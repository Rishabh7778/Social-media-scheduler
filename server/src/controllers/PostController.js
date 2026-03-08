import db from '../../database/db.js';
import { postQueue } from '../queues/postQueue.js';

export const createPost = async (req, res) => {
  try {
    const { title, description, date, status, selectedPage } = req.body;
    const userId = req.user.id;
    
    // --- DHAYAN DEIN: Cloudinary URL yahan hai ---
    // Agar Multer-Cloudinary use kar rahe ho, toh req.file.path hi pura URL hai
    const imageUrl = req.file ? req.file.path : null; 

    let pageData;
    try {
      pageData = typeof selectedPage === 'string' ? JSON.parse(selectedPage) : selectedPage;
    } catch (e) {
      return res.status(400).json({ error: "Invalid selectedPage data" });
    }

    // 2. Database mein save (imageUrl yahan bhi direct link jayega)
    const query = `INSERT INTO posts (user_id, title, description, scheduled_at, status, image_url) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(query, [userId, title, description, date, status, imageUrl]);

    // 3. BullMQ logic
    if (status === 'pending' && pageData) {
      const delay = Math.max(0, new Date(date).getTime() - Date.now());

      await postQueue.add(
        'publish-to-facebook',
        {
          postId: result.insertId,
          postContent: description,
          userId: userId,
          
          // --- CHANGE YAHAN HAI ---
          // Localhost wala URL banane ki zaroorat nahi hai! 
          // Cloudinary ka URL 'https' se shuru hota hai, Facebook ise turant utha lega.
          imageUrl: imageUrl, 

          id: pageData.id,
          access_token: process.env.FB_PAGE_ACCESS_TOKEN || pageData.access_token
        },
        {
          delay: delay,
          removeOnComplete: true, //Iska matlab hai ki jab Facebook par post sucessfully ho jaye, toh Redis se ye dabba delete kar dena. Kyun? Taaki Redis ka godown फालतू data se na bhare.
        }
      );

      console.log(`✅ Job Queued: Cloudinary Image ke sath post jayega!`);
    }

    res.status(201).json({ message: "Post saved and scheduled!", postId: result.insertId });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Error logic: " + error.message });
  }
};