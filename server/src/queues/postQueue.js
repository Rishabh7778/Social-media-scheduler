import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// 1. Redis se connection banao
const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null, // BullMQ ke liye ye zaroori hai
});

// 2. Ek nayi Queue banao jiska naam 'facebook-posts' rakhenge
export const postQueue = new Queue('facebook-posts', { connection });

console.log("✅ BullMQ Queue connected to Redis!");

