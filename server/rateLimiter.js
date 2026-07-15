import pool from './db.js';
import crypto from 'crypto';

// In-Memory Rate Limiter Store
const ipLimits = new Map(); // ip -> { count, resetTime }
const apiKeyLimits = new Map(); // apiKey -> { count, resetTime }

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_IP_REQUESTS = 100; // max 100 requests per IP per window

// Clean expired limits periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipLimits.entries()) {
    if (now > data.resetTime) ipLimits.delete(ip);
  }
  for (const [key, data] of apiKeyLimits.entries()) {
    if (now > data.resetTime) apiKeyLimits.delete(key);
  }
}, 5 * 60 * 1000); // clean every 5 minutes

export async function rateLimitMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();

  // 1. If API Key is provided: Validate key and plan-based rate limits
  if (apiKey) {
    try {
      const teamResult = await pool.query('SELECT * FROM teams WHERE api_key = $1', [apiKey]);
      
      if (teamResult.rows.length === 0) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key.' });
      }

      const team = teamResult.rows[0];
      req.team = team; // save team info to request

      // Define limits based on team plan
      let limit = 20; // 20 requests/window for free tier
      if (team.plan_type === 'pro') limit = 200;
      if (team.plan_type === 'enterprise') limit = 10000; // virtually unlimited

      let limitData = apiKeyLimits.get(apiKey);
      if (!limitData || now > limitData.resetTime) {
        limitData = { count: 0, resetTime: now + WINDOW_MS };
      }

      limitData.count++;
      apiKeyLimits.set(apiKey, limitData);

      // Set headers
      res.setHeader('X-RateLimit-Limit-ApiKey', limit);
      res.setHeader('X-RateLimit-Remaining-ApiKey', Math.max(0, limit - limitData.count));

      if (limitData.count > limit) {
        return res.status(429).json({ 
          error: `Too Many Requests: API Key rate limit exceeded for plan '${team.plan_type}'. Reset in ${Math.round((limitData.resetTime - now) / 1000)} seconds.` 
        });
      }

      return next(); // Bypass IP rate limits if API Key authenticated successfully
    } catch (err) {
      console.error('Rate limiting database auth error:', err);
      return res.status(500).json({ error: 'Internal server error validating credentials.' });
    }
  }

  // 2. IP-based rate limiting (Default)
  let limitData = ipLimits.get(clientIp);
  if (!limitData || now > limitData.resetTime) {
    limitData = { count: 0, resetTime: now + WINDOW_MS };
  }

  limitData.count++;
  ipLimits.set(clientIp, limitData);

  res.setHeader('X-RateLimit-Limit', MAX_IP_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_IP_REQUESTS - limitData.count));

  if (limitData.count > MAX_IP_REQUESTS) {
    return res.status(429).json({ 
      error: `Too Many Requests: IP rate limit exceeded. Reset in ${Math.round((limitData.resetTime - now) / 1000)} seconds.` 
    });
  }

  next();
}
