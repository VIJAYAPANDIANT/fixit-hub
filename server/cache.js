import dotenv from 'dotenv';

dotenv.config();

// In-Memory Fallback Cache Store
class MemoryCache {
  constructor() {
    this.store = new Map();
    console.log('Cache Gateway: Initialized local in-memory fallback cache.');
  }

  async connect() {
    return true; // immediately ready
  }

  async get(key) {
    if (!this.store.has(key)) return null;
    const entry = this.store.get(key);
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, options = {}) {
    let expiresAt = null;
    if (options.EX) {
      expiresAt = Date.now() + options.EX * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key);
  }

  async quit() {
    return true;
  }
}

let cacheClient;

// Standard Redis client configuration helper
async function initCache() {
  if (process.env.REDIS_URL) {
    try {
      // Dynamic import to prevent crash if 'redis' is not installed
      const { createClient } = await import('redis');
      const client = createClient({ url: process.env.REDIS_URL });
      
      client.on('error', (err) => {
        console.warn('Redis connection failed. Falling back to In-Memory Cache. Error:', err.message);
        cacheClient = new MemoryCache();
      });

      await client.connect();
      console.log('Cache Gateway: Connected to Redis database successfully.');
      cacheClient = client;
    } catch (e) {
      console.warn('Redis package could not be initialized. Using In-Memory Cache.');
      cacheClient = new MemoryCache();
    }
  } else {
    cacheClient = new MemoryCache();
  }
}

// Ensure it is initialized
await initCache();

export default {
  get: async (key) => cacheClient.get(key),
  set: async (key, value, options) => cacheClient.set(key, value, options),
  del: async (key) => cacheClient.del(key),
};
