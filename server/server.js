import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import pool, { initDb } from './db.js';

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

// List of mock error diagnoses for fallback
const STATIC_DIAGNOSES = [
  {
    keywords: ['hooks', 'rendered fewer hooks', 'hook order', 'react hook'],
    language: 'JavaScript',
    framework: 'React',
    fixes: [
      {
        title: 'Move Hook outside conditional statement',
        description: 'React Hooks must be called at the very top level of your component. Moving this Hook outside of any conditional statement or early return ensures it executes in the same order on every render.',
        code_snippet: `@@ -1,9 +1,9 @@
 function UserProfile({ userId }) {
-  if (!userId) {
-    return <div>No User ID</div>;
-  }
-
   useEffect(() => {
     fetchUserData(userId);
   }, [userId]);
+
+  if (!userId) {
+    return <div>No User ID</div>;
+  }`,
        ai_confidence: 98,
        source_type: 'ai'
      },
      {
        title: 'Use conditional logic inside the Hook',
        description: 'Instead of making the Hook execution conditional, call the Hook unconditionally and place the conditional checks inside the effect callback or check variables in the dependency array.',
        code_snippet: `@@ -1,6 +1,8 @@
   useEffect(() => {
+    if (!userId) return;
+    
     fetchUserData(userId);
-  }, [userId]);
+  }, [userId]);`,
        ai_confidence: 91,
        source_type: 'community'
      }
    ]
  },
  {
    keywords: ['nullpointerexception', 'npe', 'null pointer'],
    language: 'Java',
    framework: 'Spring Boot',
    fixes: [
      {
        title: 'Add defensive null validation',
        description: 'Perform an explicit check for null on the object or its nested properties before performing actions or invoking methods.',
        code_snippet: `@@ -1,3 +1,6 @@
 public String getUserEmail(User user) {
-    return user.getEmail().toLowerCase();
+    if (user == null || user.getEmail() == null) {
+        return "";
+    }
+    return user.getEmail().toLowerCase();
 }`,
        ai_confidence: 94,
        source_type: 'ai'
      },
      {
        title: 'Wrap in java.util.Optional',
        description: 'Use the Optional class to safely handle potential null values, providing a clean functional API with defaults.',
        code_snippet: `@@ -1,3 +1,3 @@
 public String getUserEmail(User user) {
-    return user.getEmail().toLowerCase();
+    return Optional.ofNullable(user).map(User::getEmail).map(String::toLowerCase).orElse("");
 }`,
        ai_confidence: 88,
        source_type: 'external'
      }
    ]
  },
  {
    keywords: ['keyerror', 'dict key', 'dictionary key'],
    language: 'Python',
    framework: 'Django / Flask',
    fixes: [
      {
        title: 'Use dictionary .get() method',
        description: 'Accessing keys directly raises a KeyError when the key is missing. Using dict.get() returns a default value (None by default) instead of throwing an exception.',
        code_snippet: `@@ -1,3 +1,3 @@
 def process_request(data):
-    username = data['username']
+    username = data.get('username', 'Anonymous')
     return f"Hello, {username}"`,
        ai_confidence: 96,
        source_type: 'ai'
      },
      {
        title: 'Validate key existence explicitly',
        description: 'Check if the key is present in the dictionary prior to retrieval to control custom fallback flow.',
        code_snippet: `@@ -1,3 +1,5 @@
 def process_request(data):
-    username = data['username']
+    username = 'Anonymous'
+    if 'username' in data:
+        username = data['username']`,
        ai_confidence: 85,
        source_type: 'community'
      }
    ]
  },
  {
    keywords: ['cannot read properties of undefined', 'is not a function', 'null reading', 'undefined reading'],
    language: 'JavaScript',
    framework: 'Node.js / Next.js',
    fixes: [
      {
        title: 'Implement optional chaining (?.)',
        description: 'Optional chaining safely returns undefined if the property path is broken, preventing application crashes.',
        code_snippet: `@@ -1,3 +1,3 @@
 const renderUser = (user) => {
-  return <div>{user.profile.details.bio}</div>;
+  return <div>{user?.profile?.details?.bio ?? 'No biography'}</div>;
 };`,
        ai_confidence: 97,
        source_type: 'ai'
      },
      {
        title: 'Define default values in destructuring',
        description: 'Provide sensible default values during variable extraction to protect downstream components.',
        code_snippet: `@@ -1,2 +1,2 @@
-const { profile } = user;
+const { profile = { details: {} } } = user || {};
+const bio = profile.details.bio || 'No biography';`,
        ai_confidence: 89,
        source_type: 'ai'
      }
    ]
  }
];

// Helper to match errors to solutions
function matchError(errorText) {
  const normalized = errorText.toLowerCase();
  for (const diagnosis of STATIC_DIAGNOSES) {
    if (diagnosis.keywords.some(keyword => normalized.includes(keyword))) {
      return diagnosis;
    }
  }
  
  // Generic Fallback
  return {
    language: 'Auto-Detect',
    framework: 'General',
    fixes: [
      {
        title: 'Check scope binding and variable imports',
        description: 'Verify if the variable or library module is correctly imported and that references match local scope variables.',
        code_snippet: `@@ -1,2 +1,3 @@
-const output = compute(data);
+import { compute } from './computations.js';
+const output = compute(data || {});`,
        ai_confidence: 72,
        source_type: 'ai'
      }
    ]
  };
}

// REST Endpoints
app.post('/api/diagnose', async (req, res) => {
  const { errorText } = req.body;
  if (!errorText || errorText.trim() === '') {
    return res.status(400).json({ error: 'Error stack trace is required' });
  }

  try {
    const redactedText = normalizeError(errorText);
    const errorHash = hashString(redactedText);

    // 1. Caching Check: Query if error hash already exists
    const cacheResult = await pool.query('SELECT * FROM errors WHERE error_hash = $1', [errorHash]);
    
    if (cacheResult.rows.length > 0) {
      const cachedError = cacheResult.rows[0];
      
      // Fetch corresponding fixes sorted by confidence_score DESC (ranked retrieval)
      const fixesResult = await pool.query(
        'SELECT * FROM fixes WHERE error_id = $1 ORDER BY confidence_score DESC',
        [cachedError.id]
      );

      // Broadcast WebSocket notification for Cache Hit
      io.emit('notification', {
        id: uuidv4(),
        message: `System Cache Hit! Retrieved solution logs instantly.`,
        type: 'system',
        timestamp: new Date().toLocaleTimeString(),
      });

      return res.json({
        errorId: cachedError.id,
        language: cachedError.language,
        framework: cachedError.framework,
        fixes: fixesResult.rows,
        cacheHit: true // flag for the frontend to show cache badge
      });
    }

    // 2. Cache Miss: Run pattern matcher
    const diagnosis = matchError(errorText);

    // Save Error to DB
    const errorInsert = await pool.query(
      'INSERT INTO errors(error_hash, raw_text_redacted, language, framework) VALUES($1, $2, $3, $4) RETURNING id',
      [errorHash, redactedText, diagnosis.language, diagnosis.framework]
    );
    const errorId = errorInsert.rows[0].id;

    // Save Fixes to DB
    const fixesList = [];
    for (const fix of diagnosis.fixes) {
      const fixResult = await pool.query(
        'INSERT INTO fixes(error_id, title, description, code_snippet, source_type, confidence_score) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
        [errorId, fix.title, fix.description, fix.code_snippet, fix.source_type, fix.ai_confidence]
      );
      fixesList.push(fixResult.rows[0]);
    }

    // Broadcast live solve notification
    const randomUsers = ['CyberBugSlayer', 'AITechLead', 'ReactNinja', 'PyGamer', 'DevOpsMaster', 'CodeMedic'];
    const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
    io.emit('notification', {
      id: uuidv4(),
      message: `${randomUser} just analyzed a ${diagnosis.language} (${diagnosis.framework}) error.`,
      type: 'diagnose',
      timestamp: new Date().toLocaleTimeString(),
    });

    res.json({
      errorId,
      language: diagnosis.language,
      framework: diagnosis.framework,
      fixes: fixesList,
      cacheHit: false
    });
  } catch (error) {
    console.error('Diagnosis API error:', error);
    res.status(500).json({ error: 'Failed to process error stack trace' });
  }
});

app.post('/api/fixes/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'up' or 'down'

  if (type !== 'up' && type !== 'down') {
    return res.status(400).json({ error: 'Vote type must be up or down' });
  }

  // Get client IP address to prevent double-voting
  const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const ipHash = hashString(clientIp);

  try {
    // 1. Audit Check: Verify if IP hash has already voted on this specific fix
    const voteCheck = await pool.query(
      'SELECT * FROM votes WHERE fix_id = $1 AND ip_hash = $2',
      [id, ipHash]
    );

    if (voteCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You have already voted on this solution!' });
    }

    // 2. Insert vote audit log
    await pool.query(
      'INSERT INTO votes(fix_id, ip_hash, vote_type) VALUES($1, $2, $3)',
      [id, ipHash, type]
    );

    // 3. Update the aggregate vote counters in the fixes table
    const column = type === 'up' ? 'upvotes' : 'downvotes';
    const voteResult = await pool.query(
      `UPDATE fixes SET ${column} = ${column} + 1 WHERE id = $1 RETURNING *`,
      [id]
    );

    if (voteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fix not found' });
    }

    const updatedFix = voteResult.rows[0];

    // Broadcast vote update notification
    io.emit('notification', {
      id: uuidv4(),
      message: `A fix for error '${updatedFix.title}' received an ${type}vote!`,
      type: 'vote',
      timestamp: new Date().toLocaleTimeString(),
    });

    res.json(updatedFix);
  } catch (error) {
    console.error('Voting API error:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

app.post('/api/fixes/:id/tailor', async (req, res) => {
  const { id } = req.params;
  const { userCode } = req.body;

  if (!userCode || userCode.trim() === '') {
    return res.status(400).json({ error: 'User code snippet is required' });
  }

  try {
    const fixResult = await pool.query('SELECT * FROM fixes WHERE id = $1', [id]);
    if (fixResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fix not found' });
    }

    const originalFix = fixResult.rows[0];

    // Smart rule-based tailoring
    let tailoredSnippet = originalFix.code_snippet;
    let tailoredDescription = originalFix.description;

    const funcMatch = userCode.match(/(?:function|const|let)\s+([a-zA-Z0-9_]+)/) || userCode.match(/def\s+([a-zA-Z0-9_]+)/);
    if (funcMatch && funcMatch[1]) {
      const userFuncName = funcMatch[1];
      tailoredSnippet = tailoredSnippet
        .replace(/UserProfile/g, userFuncName)
        .replace(/getUserEmail/g, userFuncName)
        .replace(/process_request/g, userFuncName)
        .replace(/renderUser/g, userFuncName);
      tailoredDescription = `${originalFix.description} (Tailored to your module '${userFuncName}')`;
    }

    res.json({
      id,
      title: `${originalFix.title} (Tailored)`,
      description: tailoredDescription,
      code_snippet: tailoredSnippet,
      ai_confidence: Math.min(100, originalFix.confidence_score + 2),
    });
  } catch (error) {
    console.error('Tailor API error:', error);
    res.status(500).json({ error: 'Failed to tailor solution' });
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

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

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
