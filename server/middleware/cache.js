import NodeCache from "node-cache";

// Create cache instance with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Cache middleware factory
export const createCacheMiddleware = (keyGenerator, ttl = 300) => {
  return (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const cachedData = cache.get(key);

      if (cachedData) {
        console.log(`Cache hit for key: ${key}`);
        return res.status(200).json(cachedData);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache successful responses
      res.json = function (data) {
        if (res.statusCode === 200 && data) {
          try {
            console.log(`Caching data for key: ${key}`);
            // Convert to POJO to avoid Mongoose internal issues during cloning
            const dataToCache = JSON.parse(JSON.stringify(data));
            cache.set(key, dataToCache, ttl);
          } catch (cacheError) {
            console.warn(`Failed to cache key ${key}:`, cacheError.message);
          }
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// Specific cache middleware for analytics
export const analyticsCache = createCacheMiddleware(
  (req) => `analytics:${req.user.id}`,
  300 // 5 minutes
);

// Specific cache middleware for history
export const historyCache = createCacheMiddleware(
  (req) => {
    const { page = 1, limit = 10, type, status } = req.query;
    return `history:${req.user.id}:${page}:${limit}:${type || "all"}:${status || "all"
      }`;
  },
  180 // 3 minutes
);

// Clear cache for user
export const clearUserCache = (userId) => {
  const keys = cache.keys();
  const userKeys = keys.filter((key) => key.includes(userId));
  cache.del(userKeys);
  console.log(`Cleared ${userKeys.length} cache entries for user ${userId}`);
};

export default cache;
