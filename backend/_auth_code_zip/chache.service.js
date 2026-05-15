const Redis = require("ioredis");

let redisClient = null;

const redisEnabled = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

if (redisEnabled) {
  redisClient = new Redis(
    process.env.REDIS_URL || {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    }
  );

  // Prevent unhandled error events if caller doesn't attach listeners.
  redisClient.on("error", (err) => {
    console.warn("Redis unavailable, continuing without cache:", err?.message || err);
  });

  // Best effort connect; if it fails, app should still run.
  redisClient.connect().catch(() => {});
}

const safeCacheClient = {
  on: (event, handler) => {
    if (redisClient) redisClient.on(event, handler);
  },
  get: async (key) => {
    try {
      if (!redisClient) return null;
      return await redisClient.get(key);
    } catch {
      return null;
    }
  },
  set: async (...args) => {
    try {
      if (!redisClient) return "NO_CACHE";
      return await redisClient.set(...args);
    } catch {
      return "NO_CACHE";
    }
  },
};

module.exports = safeCacheClient;