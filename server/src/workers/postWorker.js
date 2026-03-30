import { Worker } from 'bullmq';
import axios from 'axios';
import IORedis from 'ioredis';
import db from '../config/db.js'; 
// 🚨 Naya Import: Cache saaf karne ke liye
import redisClient from '../config/redis.js'; 

const connection = new IORedis({
  host: '127.0.0.1', 
  port: 6379,
  maxRetriesPerRequest: null
});

const worker = new Worker('social-posts', async (job) => {
  // 🚨 userId ko bhi nikal lo job.data se
  const { provider, postContent, imageUrl, platformId, access_token, userId, postId } = job.data;

  console.log(`🚀 Processing ${provider} job for Post ID: ${postId}`);

  try {
    let providerPostId = null;

    if (provider === 'facebook') {
      // --- Facebook Logic ---
      const url = imageUrl ? `https://graph.facebook.com/${platformId}/photos` : `https://graph.facebook.com/${platformId}/feed`;
      const payload = imageUrl ? { caption: postContent, url: imageUrl, access_token } : { message: postContent, access_token };

      const fbResponse = await axios.post(url, payload);
      providerPostId = fbResponse.data.id;
      console.log(`✅ Facebook Success! ID: ${providerPostId}`);

    } else if (provider === 'linkedin') {
      // --- LinkedIn Logic ---
      const authorUrn = platformId.startsWith('urn:li:') ? platformId : `urn:li:person:${platformId}`;
      let linkedinMediaUrn = null;

      if (imageUrl) {
        // Step 1: Register Upload
        const registerRes = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: authorUrn,
            serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }]
          }
        }, { headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' } });

        const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
        linkedinMediaUrn = registerRes.data.value.asset;

        // Step 2: Put Image
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' }); //Cloudinary se image DOWNLOAD kar rahi hai (binary format me)
        await axios.put(uploadUrl, imageResponse.data, {
          headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/octet-stream' }
        });
      }

      // Step 3: Final Post
      const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postContent },
            shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
            media: imageUrl ? [{
              status: 'READY',
              description: { text: postContent.substring(0, 100) }, 
              media: linkedinMediaUrn, 
              title: { text: 'Scheduled Image' }
            }] : []
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      }, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      });

      providerPostId = response.data.id;
      console.log(`✅ LinkedIn Success! ID: ${providerPostId}`);
    }

    // --- 💾 COMMON DATABASE UPDATE ---
    if (providerPostId) {
      await db.execute(
        'UPDATE posts SET status = ?, provider_post_id = ? WHERE id = ?',
        ['published', providerPostId, postId]
      );

      // 🚨 MAGIC LINE: Successful post ke baad cache saaf karo taaki Dashboard update ho jaye
      const cacheKey = `posts:${userId}:${provider}`;
      await redisClient.del(cacheKey);
      
      console.log(`✨ DB Updated & Redis Cache Cleared for ${cacheKey}`);
    }

  } catch (error) {
    console.error(`❌ Worker Error for Post ${postId}:`, error.response?.data || error.message);
    // Error hone par status 'failed' kar do
    await db.execute('UPDATE posts SET status = ? WHERE id = ?', ['failed', postId]);
    throw error; // BullMQ ko batao ki job fail ho gayi
  }
}, { connection });

worker.on('completed', (job) => console.log(`✅ Job ${job.id} finished!`));
worker.on('failed', (job, err) => console.error(`❌ Job ${job.id} failed!`));

export default worker;