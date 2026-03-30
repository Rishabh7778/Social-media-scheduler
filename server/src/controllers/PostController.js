import db from '../config/db.js';
import { postQueue } from '../queues/postQueue.js';
import redisClient from '../config/redis.js'; 
import axios from 'axios';

const CACHE_TTL = 864000; // 10 Din



export const createPost = async (req, res) => {
  try {
    const { title, description, date, status, selectedPage } = req.body;
    const userId = req.user?.id; // req.user object se id nikal rahe hain

    const imageUrl = req.file ? req.file.path : null;

    if (!selectedPage) {
      return res.status(400).json({ error: "Please select a social account" });
    }

    let pageData;
    try {
      pageData = typeof selectedPage === 'string' ? JSON.parse(selectedPage) : selectedPage;
    } catch (e) {
      return res.status(400).json({ error: "Invalid account data format" });
    }

    // 🚨 MAGIC FIX: Ye line ensure karegi ki undefined na aaye
    const finalProvider = pageData.provider || pageData.platform;

    if (!finalProvider) {
      return res.status(400).json({ error: "Provider name is missing in the selected account" });
    }

    // ✅ Sahi (Local Time ko same rakhega)
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    const scheduledDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    const query = `INSERT INTO posts (user_id, title, description, scheduled_at, status, image_url, provider, provider_post_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    // 🚨 BULLETPROOF ARRAY: Yahan hum har value check kar rahe hain ( || null lagakar )
    const [result] = await db.execute(query, [
      userId || null,
      title || 'New Post',
      description || '',
      scheduledDate || null,
      status || 'pending',
      imageUrl || null,
      finalProvider,
      null
    ]);

    const cacheKey = `posts:${userId}:${finalProvider}`;
    await redisClient.del(cacheKey); 
    console.log(`🧹 Cache cleared for: ${cacheKey}`);

    // BullMQ Logic 
    if (status === 'pending' || status === 'scheduled') {
      const delay = Math.max(0, new Date(date).getTime() - Date.now());
      const jobName = finalProvider === 'linkedin' ? 'publish-to-linkedin' : 'publish-to-facebook';

      await postQueue.add(
        jobName,
        {
          postId: result.insertId,
          postContent: description || '',
          postTitle: title || '',
          userId: userId,
          imageUrl: imageUrl,
          provider: finalProvider,
          platformId: pageData.id || pageData.social_id,
          access_token: pageData.access_token
        },
        {
          jobId: `job_${result.insertId}`,
          delay: delay,
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 }
        }
      );

      console.log(`✅ Job Queued: ${finalProvider.toUpperCase()} ke liye schedule ho gaya! Job ID: ${result.insertId}`);
    }

    res.status(201).json({
      success: true,
      message: "Post created and queued successfully!",
      postId: result.insertId
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to create post: " + error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const provider = req.user.provider; // Token se aayega
    
    // 🚨 DEBUG: Dekho kya aa raha hai
    // console.log("FETCH POSTS -> UserID:", userId, "| Provider:", provider);

    if (!provider) {
       return res.status(400).json({ error: "Provider missing in token! Please login again." });
    }

    const cacheKey = `posts:${userId}:${provider}`;

    const cachedPosts = await redisClient.get(cacheKey);
    if (cachedPosts) {
      // Agar Redis mein empty array bhi save ho gaya tha, toh usko handle karna zaroori hai
      const parsedPosts = JSON.parse(cachedPosts);
      return res.status(200).json(parsedPosts);
    }

    console.log(`🐢 Redis Miss: Fetching from DB for User ${userId} (${provider})`);
    
    // 🚨 FIX: SQL Query mein Check karo
    const [posts] = await db.execute(
      'SELECT id, title, description, scheduled_at, status, image_url, provider, provider_post_id FROM posts WHERE user_id = ? AND provider = ? ORDER BY scheduled_at DESC',
      [userId, provider]
    );

    // Agar posts length 0 bhi hai, tab bhi Redis mein save karo (taaki DB call bache)
    await redisClient.setEx(cacheKey, 864000, JSON.stringify(posts));

    res.status(200).json(posts);
  } catch (error) {
    console.error("Fetch Posts Error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};
// 3. Cancel Scheduled Post
// ... (createPost aur getUserPosts aapke paas sahi wale hain hi)

// 🚨 3. Cancel Scheduled Post (Isme Fix kiya hai)
export const cancelScheduledPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Pehle post fetch karo taaki uska 'provider' pata chal sake
    const [posts] = await db.execute('SELECT * FROM posts WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (posts.length === 0) {
      return res.status(404).json({ error: "Post nahi mili ya aapki nahi hai." });
    }

    const postProvider = posts[0].provider; // 👈 Post ka asli provider (facebook/linkedin)

    // BullMQ se job hatao
    const job = await postQueue.getJob(`job_${id}`);
    if (job) {
      await job.remove();
      console.log(`🛑 BullMQ: Job ID ${id} removed.`);
    }

    // Database se uda do
    await db.execute('DELETE FROM posts WHERE id = ?', [id]);
    
    // 🔥 REDIS FIX: Sahi wali key delete karo
    const cacheKey = `posts:${userId}:${postProvider}`;
    await redisClient.del(cacheKey);
    
    console.log(`🧹 Cache cleared for: ${cacheKey}`);

    res.status(200).json({ success: true, message: "Scheduling cancelled successfully!" });

  } catch (error) {
    console.error("Cancel Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🚨 4. Delete Post (Social + DB + Cache Fix)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [posts] = await db.execute('SELECT * FROM posts WHERE id = ? AND user_id = ?', [id, userId]);
    if (posts.length === 0) return res.status(404).json({ error: "Post nahi mili." });

    const post = posts[0];
    const postProvider = post.provider;

    // ... (Social Media API Delete Logic wahi rahega jo aapne likha hai) ...
    // LinkedIn/Facebook API calls...

    // Database se delete
    await db.execute('DELETE FROM posts WHERE id = ?', [id]);
    
    // 🔥 REDIS FIX: Sahi wali key delete karo
    const cacheKey = `posts:${userId}:${postProvider}`;
    await redisClient.del(cacheKey);
    console.log(`🧹 Cache cleared for: ${cacheKey}`);

    res.status(200).json({ success: true, message: "Post successfully deleted!" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🚨 5. Reschedule Post (Cache Fix)
export const reschedulePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate } = req.body;
    const userId = req.user.id;

    const [posts] = await db.execute('SELECT * FROM posts WHERE id = ? AND user_id = ?', [id, userId]);
    if (posts.length === 0) return res.status(404).json({ error: "Post nahi mili." });

    const postProvider = posts[0].provider;

    // BullMQ Update
    const delay = Math.max(0, new Date(newDate).getTime() - Date.now());
    const job = await postQueue.getJob(`job_${id}`);
    if (job) await job.changeDelay(delay);

    // Format Date for MySQL
    const d = new Date(newDate);
    const pad = (n) => n.toString().padStart(2, '0');
    const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    // DB Update
    await db.execute('UPDATE posts SET scheduled_at = ? WHERE id = ?', [formattedDate, id]);

    // 🔥 REDIS FIX: Sahi wali key delete karo
    const cacheKey = `posts:${userId}:${postProvider}`;
    await redisClient.del(cacheKey);

    res.status(200).json({ success: true, message: "Post successfully rescheduled!" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};