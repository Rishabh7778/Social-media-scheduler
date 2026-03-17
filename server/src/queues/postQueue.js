import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// 1. Redis Connection
const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null, 
});

// 2. Queue ka naam generic rakhein
export const postQueue = new Queue('social-posts', { connection });

console.log("✅ BullMQ Generic Social Queue connected!");