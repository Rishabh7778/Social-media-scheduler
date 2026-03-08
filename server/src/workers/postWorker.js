import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';

const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

const postWorker = new Worker('facebook-posts', async (job) => {
  const { postContent, id, access_token, imageUrl } = job.data;

  console.log(`🚀 Processing Job ${job.id}: Posting to Page ${id}...`);

  if (!id || id === 'undefined') {
    throw new Error("Bhai, Page ID 'undefined' mili hai! Queue check karo.");
  }

  try {
    let fbResponse;
    const FB_API_VERSION = 'v20.0';

    if (imageUrl) {
      // DHAYAN RAKHO: imageUrl ek valid public URL hona chahiye (localhost nahi chalega)
      fbResponse = await axios.post(
        `https://graph.facebook.com/${FB_API_VERSION}/${id}/photos`,
        {
          caption: postContent,
          url: imageUrl, // Facebook ise internet se download karega
          access_token: access_token,
        }
      );
    } else {
      fbResponse = await axios.post(
        `https://graph.facebook.com/${FB_API_VERSION}/${id}/feed`,
        {
          message: postContent,
          access_token: access_token,
        }
      );
    }

    console.log(`✅ Success! Facebook Post ID: ${fbResponse.data.id}`);
    return fbResponse.data;

  } catch (error) {
    const errorDetails = error.response?.data?.error || {};
    const errorMsg = errorDetails.message || error.message;
    console.error(`❌ Facebook API Error:`, error.response?.data || error.message);
    
    // Agar permission error hai, toh yahan saaf dikhega
    throw new Error(`FB Error: ${errorMsg}`);
  }
}, { connection });

postWorker.on('completed', (job) => {
  console.log(`✨ Job ${job.id} has completed! Check your Facebook Page!`);
});

postWorker.on('failed', (job, err) => {
  console.error(`💀 Job ${job.id} failed: ${err.message}`);
});

export default postWorker;