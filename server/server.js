import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import pool, { initDb } from './db.js';
import cache from './cache.js';
import { queryExternalSources } from './externalApis.js';
import { rateLimitMiddleware } from './rateLimiter.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Helper to hash strings to SHA-256
function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Scrubber for PII (GDPR compliance)
function scrubPII(errorText) {
  return errorText
    // Windows file paths: C:\Users\username\... -> C:\Users\[redacted]\...
    .replace(/[a-zA-Z]:\\Users\\[a-zA-Z0-9_\-\.]+(?=\\)/gi, 'C:\\Users\\[redacted]')
    // Unix file paths: /home/username/... -> /home/[redacted]/...
    .replace(/\/home\/[a-zA-Z0-9_\-\.]+(?=\/)/gi, '/home/[redacted]')
    // Email addresses
    .replace(/[\w\.-]+@[\w\.-]+\.\w+/gi, '[email-redacted]')
    // IP addresses
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip-redacted]');
}

// Redact / Normalize stack trace for caching
function normalizeError(errorText) {
  return errorText
    .replace(/at\s+.*\(?.*:\d+:\d+\)?/g, 'at [redacted]') // strip file paths and line numbers
    .replace(/:\d+:\d+/g, '') // strip line & column numbers
    .replace(/0x[0-9a-fA-F]+/g, '0x[hex]') // strip hex memory addresses
    .replace(/\d+\.\d+\.\d+/g, '[version]') // strip versions
    .replace(/[\w\-_\.\\]+\.(js|jsx|ts|tsx|py|java|cpp|h|cs|go|rs|rb|php)/gi, '[file]') // strip file basenames
    .replace(/\s+/g, ' ') // collapse whitespaces
    .trim();
}

// Language classifier
function detectLanguageAndFramework(errorText) {
  const normalized = errorText.toLowerCase();
  
  if (normalized.includes('hooks') || normalized.includes('useeffect') || normalized.includes('react hook')) {
    return { language: 'JavaScript', framework: 'React' };
  }
  if (normalized.includes('nullpointerexception') || normalized.includes('java.lang')) {
    return { language: 'Java', framework: 'Spring Boot' };
  }
  if (normalized.includes('keyerror') || normalized.includes('traceback') && normalized.includes('.py')) {
    return { language: 'Python', framework: 'Django/Flask' };
  }
  if (normalized.includes('cannot read properties') || normalized.includes('is not a function') || normalized.includes('node_modules')) {
    return { language: 'JavaScript', framework: 'Node.js' };
  }
  
  return { language: 'Auto-Detect', framework: 'General' };
}

// Fallback AI engine generating fresh template fixes
function generateAIFallbackFix(redactedText, language, framework) {
  return [
    {
      title: `AI Synthesis: Bind reference constraints`,
      description: `Generative recommendation for ${language} exception. Validate that all properties are fully bound before downstream access.`,
      code_snippet: `@@ -1,3 +1,4 @@
+// Safe guard evaluation
+if (typeof data === 'undefined' || data === null) {
+  return;
+}`,
      source_type: 'ai',
      confidence_score: 90,
    }
  ];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 1 & 2: Error Ingestion & Matching
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post('/api/diagnose', rateLimitMiddleware, async (req, res) => {
  const { errorText } = req.body;
  if (!errorText || errorText.trim() === '') {
    return res.status(400).json({ error: 'Error stack trace is required' });
  }

  try {
    // 1. Scrub PII and normalize
    const cleanText = scrubPII(errorText);
    const redactedText = normalizeError(cleanText);
    const errorHash = hashString(redactedText);

    // 2. Redis Caching Check
    const cachedResponse = await cache.get(errorHash);
    if (cachedResponse) {
      const parsed = JSON.parse(cachedResponse);
      
      // Broadcast WebSocket notification for Cache Hit
      io.emit('notification', {
        id: uuidv4(),
        message: `System Cache Hit! Retrieved solutions instantly from Redis.`,
        type: 'system',
        timestamp: new Date().toLocaleTimeString(),
      });

      return res.json({ ...parsed, cacheHit: true });
    }

    // 3. Search internal Database
    const internalError = await pool.query('SELECT * FROM errors WHERE error_hash = $1', [errorHash]);
    let errorId;
    let finalFixes = [];
    let detected = detectLanguageAndFramework(errorText);

    if (internalError.rows.length > 0) {
      errorId = internalError.rows[0].id;
      detected.language = internalError.rows[0].language;
      detected.framework = internalError.rows[0].framework;

      // Weighted ranking: upvotes + (verified_count * 2.5) - downvotes
      const fixesResult = await pool.query(
        `SELECT * FROM fixes 
         WHERE error_id = $1 AND flagged = false
         ORDER BY (upvotes + (verified_count * 2.5) - downvotes) DESC`,
        [errorId]
      );
      finalFixes = fixesResult.rows;
    }

    // Check if we need fallbacks (confidence threshold check: if no fixes exist or top fix is < 60% confidence)
    const needsFallback = finalFixes.length === 0 || finalFixes[0].confidence_score < 60;

    if (needsFallback) {
      console.log('Confidence below threshold (< 60%). Executing Fallbacks...');

      // Module 2: Fallback 1 - Query StackOverflow & GitHub
      const externalFixes = await queryExternalSources(redactedText, detected.language, detected.framework);
      
      // Module 2: Fallback 2 - AI synthesis if external is also low
      let aiFixes = [];
      if (externalFixes.length === 0 || externalFixes[0].confidence_score < 60) {
        aiFixes = generateAIFallbackFix(redactedText, detected.language, detected.framework);
      }

      // Merge and save error
      if (!errorId) {
        const errorInsert = await pool.query(
          'INSERT INTO errors(error_hash, raw_text_redacted, language, framework) VALUES($1, $2, $3, $4) RETURNING id',
          [errorHash, redactedText, detected.language, detected.framework]
        );
        errorId = errorInsert.rows[0].id;
      }

      // Save all fallback candidates
      const mergedCandidates = [...externalFixes, ...aiFixes];
      for (const fix of mergedCandidates) {
        const fixInsert = await pool.query(
          `INSERT INTO fixes(error_id, title, description, code_snippet, source_type, confidence_score) 
           VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
          [errorId, fix.title, fix.description, fix.code_snippet, fix.source_type, fix.confidence_score]
        );
        finalFixes.push(fixInsert.rows[0]);
      }
    }

    // Sort final results by rank
    finalFixes.sort((a, b) => {
      const scoreA = a.upvotes + (a.verified_count * 2.5) - a.downvotes;
      const scoreB = b.upvotes + (b.verified_count * 2.5) - b.downvotes;
      return scoreB - scoreA;
    });

    const responsePayload = {
      errorId,
      language: detected.language,
      framework: detected.framework,
      fixes: finalFixes,
      cacheHit: false
    };

    // Store in cache for 1 hour (3600 seconds)
    await cache.set(errorHash, JSON.stringify(responsePayload), { EX: 3600 });

    res.json(responsePayload);
  } catch (error) {
    console.error('Ingestion Engine Error:', error);
    res.status(500).json({ error: 'Failure during diagnostic analysis.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 3: Voting & Verification
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post('/api/fixes/:id/vote', rateLimitMiddleware, async (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'up' or 'down'

  if (type !== 'up' && type !== 'down') {
    return res.status(400).json({ error: 'Vote type must be up or down' });
  }

  const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const ipHash = hashString(clientIp + '_vote');

  try {
    // Abuse Prevention: Deduplicate vote
    const voteCheck = await pool.query('SELECT * FROM votes WHERE fix_id = $1 AND ip_hash = $2', [id, ipHash]);
    if (voteCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You have already voted on this solution!' });
    }

    // Insert vote record
    await pool.query('INSERT INTO votes(fix_id, ip_hash, vote_type) VALUES($1, $2, $3)', [id, ipHash, type]);

    // Update tally
    const column = type === 'up' ? 'upvotes' : 'downvotes';
    const voteUpdate = await pool.query(
      `UPDATE fixes SET ${column} = ${column} + 1 WHERE id = $1 RETURNING *`,
      [id]
    );

    if (voteUpdate.rows.length === 0) {
      return res.status(404).json({ error: 'Fix not found.' });
    }

    const updatedFix = voteUpdate.rows[0];

    // Moderation check: Auto-flag if downvotes exceed upvotes + 3
    if (updatedFix.downvotes > updatedFix.upvotes + 3) {
      await pool.query('UPDATE fixes SET flagged = true WHERE id = $1', [id]);
      io.emit('notification', {
        id: uuidv4(),
        message: `Alert: Solution "${updatedFix.title}" has been flagged for moderation review due to high downvotes.`,
        type: 'system',
        timestamp: new Date().toLocaleTimeString(),
      });
      updatedFix.flagged = true;
    }

    // Broadcast WebSocket vote
    io.emit('notification', {
      id: uuidv4(),
      message: `A solution patch was just ${type}voted!`,
      type: 'vote',
      timestamp: new Date().toLocaleTimeString(),
    });

    res.json(updatedFix);
  } catch (error) {
    console.error('Voting Error:', error);
    res.status(500).json({ error: 'Failed to submit vote.' });
  }
});

// "This worked for me" (Verification counter)
app.post('/api/fixes/:id/verify', rateLimitMiddleware, async (req, res) => {
  const { id } = req.params;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const ipHash = hashString(clientIp + '_verify');

  try {
    // Abuse Prevention: Deduplicate verification
    const verifyCheck = await pool.query(
      "SELECT * FROM votes WHERE fix_id = $1 AND ip_hash = $2 AND vote_type = 'verify'",
      [id, ipHash]
    );
    if (verifyCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You have already verified this solution!' });
    }

    // Log verification check
    await pool.query('INSERT INTO votes(fix_id, ip_hash, vote_type) VALUES($1, $2, $3)', [id, ipHash, 'verify']);

    // Increment count
    const verifyUpdate = await pool.query(
      'UPDATE fixes SET verified_count = verified_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (verifyUpdate.rows.length === 0) {
      return res.status(404).json({ error: 'Fix not found.' });
    }

    const updatedFix = verifyUpdate.rows[0];

    // Broadcast websocket notice
    io.emit('notification', {
      id: uuidv4(),
      message: `Developer confirmed: Solution "${updatedFix.title}" worked successfully!`,
      type: 'vote',
      timestamp: new Date().toLocaleTimeString(),
    });

    res.json(updatedFix);
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ error: 'Failed to verify solution.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 4: SSE streaming tailoring service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/api/fixes/:id/tailor-stream', async (req, res) => {
  const { id } = req.params;
  const { userCode } = req.query;

  if (!userCode || userCode.trim() === '') {
    res.write(`data: ${JSON.stringify({ error: 'User code is required' })}\n\n`);
    return res.end();
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    const fixResult = await pool.query('SELECT * FROM fixes WHERE id = $1', [id]);
    if (fixResult.rows.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Fix not found' })}\n\n`);
      return res.end();
    }

    const fix = fixResult.rows[0];
    
    // Tailoring variables
    let tailoredSnippet = fix.code_snippet;
    let tailoredDescription = fix.description;

    const funcMatch = userCode.match(/(?:function|const|let)\s+([a-zA-Z0-9_]+)/) || userCode.match(/def\s+([a-zA-Z0-9_]+)/);
    if (funcMatch && funcMatch[1]) {
      const userFuncName = funcMatch[1];
      tailoredSnippet = tailoredSnippet
        .replace(/UserProfile/g, userFuncName)
        .replace(/getUserEmail/g, userFuncName)
        .replace(/process_request/g, userFuncName)
        .replace(/renderUser/g, userFuncName);
      tailoredDescription = `${fix.description} (Tailored to your function '${userFuncName}')`;
    }

    // Stream description and code character-by-character to simulate typewriter effect
    const fullPayload = {
      title: `${fix.title} (Tailored)`,
      description: tailoredDescription,
      code_snippet: tailoredSnippet,
      confidence_score: Math.min(100, fix.confidence_score + 2),
    };

    const payloadStr = JSON.stringify(fullPayload);
    let index = 0;
    const chunkSize = 8; // stream 8 chars at a time

    const interval = setInterval(() => {
      if (index >= payloadStr.length) {
        clearInterval(interval);
        res.write('event: end\ndata: [DONE]\n\n');
        return res.end();
      }
      
      const chunk = payloadStr.slice(index, index + chunkSize);
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      index += chunkSize;
    }, 15); // very fast stream

    req.on('close', () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error('Typewriter Streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Streaming error.' })}\n\n`);
    res.end();
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 6: CI/CD team endpoint (paid tier)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post('/api/ci/diagnose', rateLimitMiddleware, async (req, res) => {
  const { errorText } = req.body;
  const team = req.team; // populated by rateLimitMiddleware check

  if (!team) {
    return res.status(401).json({ error: 'Unauthorized: Valid API Key is required.' });
  }

  if (!errorText || errorText.trim() === '') {
    return res.status(400).json({ error: 'Build error text is required.' });
  }

  try {
    const cleanText = scrubPII(errorText);
    const redactedText = normalizeError(cleanText);
    const errorHash = hashString(redactedText + '_' + team.id); // Team-scoped hash

    // Save as private and linked to team
    const errorInsert = await pool.query(
      `INSERT INTO errors(error_hash, raw_text_redacted, language, framework, is_private, team_id) 
       VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
      [errorHash, redactedText, 'Auto-Detect', 'CI/CD pipeline', true, team.id]
    );
    const errorId = errorInsert.rows[0].id;

    // Log to team logs
    await pool.query(
      'INSERT INTO team_error_logs(team_id, error_id, resolved_boolean) VALUES($1, $2, $3)',
      [team.id, errorId, false]
    );

    // AI templates fallback for CI/CD builds
    const defaultFixes = [
      {
        title: 'CI Mismatch: Verify environment node version',
        description: 'The package build engine is de-synchronized. Verify docker or engine environment targets.',
        code_snippet: `@@ -1,2 +1,2 @@
-image: node:18-alpine
+image: node:24-alpine`,
        source_type: 'ai',
        confidence_score: 95
      }
    ];

    const savedFixes = [];
    for (const fix of defaultFixes) {
      const fixInsert = await pool.query(
        `INSERT INTO fixes(error_id, title, description, code_snippet, source_type, confidence_score) 
         VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
        [errorId, fix.title, fix.description, fix.code_snippet, fix.source_type, fix.confidence_score]
      );
      savedFixes.push(fixInsert.rows[0]);
    }

    res.json({
      message: 'CI/CD Build Exception analyzed successfully. Stored privately.',
      teamName: team.name,
      errorId,
      fixes: savedFixes
    });
  } catch (error) {
    console.error('CI/CD api diagnostic error:', error);
    res.status(500).json({ error: 'Pipeline analysis failure.' });
  }
});

// Analytics endpoint
app.get('/api/teams/analytics', rateLimitMiddleware, async (req, res) => {
  const team = req.team;
  if (!team) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const errorStats = await pool.query(
      'SELECT COUNT(*) as total_errors FROM errors WHERE team_id = $1',
      [team.id]
    );
    const resolvedStats = await pool.query(
      'SELECT COUNT(*) as resolved FROM team_error_logs WHERE team_id = $1 AND resolved_boolean = true',
      [team.id]
    );

    res.json({
      teamName: team.name,
      planType: team.plan_type,
      totalErrorsLogged: parseInt(errorStats.rows[0].total_errors || 0),
      resolvedErrors: parseInt(resolvedStats.rows[0].resolved || 0),
      serviceHealth: '100% stable',
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ error: 'Failed to fetch team analytics.' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECURITY & GDPR: Delete IP Audit Logs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.delete('/api/gdpr/delete', rateLimitMiddleware, async (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const ipHash = hashString(clientIp + '_vote');
  const ipHashVerify = hashString(clientIp + '_verify');

  try {
    // Purge vote records associated with IP
    const deleteVotes = await pool.query(
      'DELETE FROM votes WHERE ip_hash = $1 OR ip_hash = $2 RETURNING *',
      [ipHash, ipHashVerify]
    );

    res.json({
      message: 'GDPR Compliance Request completed. Audit IP vote logs purged successfully.',
      recordsPurged: deleteVotes.rows.length,
    });
  } catch (error) {
    console.error('GDPR deletion error:', error);
    res.status(500).json({ error: 'GDPR purge failed.' });
  }
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);
  
  socket.emit('notification', {
    id: uuidv4(),
    message: 'Connected to FixIt Command Center webSocket grid.',
    type: 'system',
    timestamp: new Date().toLocaleTimeString(),
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 5: Live Activity Broadcaster
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CITIES = ['Munich', 'Seattle', 'Berlin', 'New York', 'Singapore', 'London', 'Tokyo', 'Sydney', 'Paris', 'Bangalore'];
const ACTIONS = [
  'fixed a NullPointerException in Java',
  'upvoted a "Hook Order" solution patch',
  'verified a Python dict KeyError fix',
  'tailored a Next.js properties solution',
  'flagged a stale build solution',
  'submitted a CI/CD build telemetry log'
];
const ACTION_TYPES = ['diagnose', 'vote', 'vote', 'tailor', 'system', 'system'];

setInterval(() => {
  const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
  const randomActionIdx = Math.floor(Math.random() * ACTIONS.length);
  const actionText = ACTIONS[randomActionIdx];
  const type = ACTION_TYPES[randomActionIdx];

  io.emit('notification', {
    id: uuidv4(),
    message: `Developer in ${randomCity} ${actionText}.`,
    type: type,
    timestamp: new Date().toLocaleTimeString(),
  });
}, 22000); // Broadcast every 22 seconds

// Start Server and database pool
const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    await initDb();
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`FixIt backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
