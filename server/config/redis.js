const { Redis } = require('@upstash/redis');

let redis = null;
const memoryCache = new Map();
const MAX_MEMORY_CACHE_ENTRIES = 500;

const getFromMemory = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const setInMemory = (key, value, ttlSeconds) => {
  if (memoryCache.has(key)) memoryCache.delete(key);
  if (memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
};

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('✅ Upstash Redis client initialized');
  } catch (err) {
    console.warn('⚠️ Upstash Redis init error, falling back to memory/MongoDB:', err.message);
  }
} else {
  console.log('ℹ️ Upstash Redis credentials not provided, using resilient fallback (MongoDB + memory)');
}

const getReviewCache = async (codeHash) => {
  const key = `review:${codeHash}`;
  try {
    if (redis) {
      const data = await redis.get(key);
      if (data) return typeof data === 'string' ? JSON.parse(data) : data;
    }
    return getFromMemory(key);
  } catch (err) {
    console.warn('Redis getReviewCache warning:', err.message);
    return getFromMemory(key);
  }
};

const setReviewCache = async (codeHash, data, ttlSeconds = 86400) => {
  const key = `review:${codeHash}`;
  try {
    if (redis) {
      await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
    }
    setInMemory(key, data, ttlSeconds);
  } catch (err) {
    console.warn('Redis setReviewCache warning:', err.message);
    setInMemory(key, data, ttlSeconds);
  }
};

const deleteReviewCache = async (codeHash) => {
  const key = `review:${codeHash}`;
  try {
    if (redis) await redis.del(key);
    memoryCache.delete(key);
  } catch (err) {
    memoryCache.delete(key);
  }
};

const getQuizCache = async (key) => {
  const cacheKey = `quiz:${key}`;
  try {
    if (redis) {
      const data = await redis.get(cacheKey);
      if (data) return typeof data === 'string' ? JSON.parse(data) : data;
    }
    return getFromMemory(cacheKey);
  } catch (err) {
    return getFromMemory(cacheKey);
  }
};

const setQuizCache = async (key, data, ttlSeconds = 43200) => {
  const cacheKey = `quiz:${key}`;
  try {
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(data), { ex: ttlSeconds });
    }
    setInMemory(cacheKey, data, ttlSeconds);
  } catch (err) {
    setInMemory(cacheKey, data, ttlSeconds);
  }
};

const checkQuotaGuard = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const userKey = `quota:user:${userId}:${today}`;
  const globalKey = `quota:global:${today}`;
  const USER_DAILY_LIMIT = 50;
  const GLOBAL_DAILY_LIMIT = 1000;

  try {
    if (redis) {
      const [userCount, globalCount] = await Promise.all([
        redis.incr(userKey),
        redis.incr(globalKey),
      ]);
      if (userCount === 1) await redis.expire(userKey, 86400);
      if (globalCount === 1) await redis.expire(globalKey, 86400);

      if (userCount > USER_DAILY_LIMIT) {
        throw Object.assign(new Error('Daily AI review limit reached for your account (50 reviews/day).'), {
          statusCode: 429,
        });
      }
      if (globalCount > GLOBAL_DAILY_LIMIT) {
        throw Object.assign(new Error('Global AI quota reached for today. Please try again tomorrow.'), {
          statusCode: 429,
        });
      }
      return { userCount, globalCount };
    }
    return { userCount: 1, globalCount: 1 };
  } catch (err) {
    if (err.statusCode === 429) throw err;
    return { userCount: 1, globalCount: 1 };
  }
};

module.exports = {
  redis,
  getReviewCache,
  setReviewCache,
  deleteReviewCache,
  getQuizCache,
  setQuizCache,
  checkQuotaGuard,
};
