import Redis from "ioredis"; 

const redis = new Redis();

export const rateLimiter  = async (req, res, next) => {
  const key = `rate-limit:${req.user?.id || req.ip}`;
    const limit = 50; 
    const window = 60;
    
    const current = await redis.incr(key);
    if (current === 1) {
        await redis.expire(key, window);
    }
    if (current > limit) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
    }
    next();
}