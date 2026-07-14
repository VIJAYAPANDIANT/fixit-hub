import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
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
        code_diff: `@@ -1,9 +1,9 @@
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
      },
      {
        title: 'Use conditional logic inside the Hook',
        description: 'Instead of making the Hook execution conditional, call the Hook unconditionally and place the conditional checks inside the effect callback or check variables in the dependency array.',
        code_diff: `@@ -1,6 +1,8 @@
   useEffect(() => {
+    if (!userId) return;
+    
     fetchUserData(userId);
-  }, [userId]);
+  }, [userId]);`,
        ai_confidence: 91,
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
        code_diff: `@@ -1,3 +1,6 @@
 public String getUserEmail(User user) {
-    return user.getEmail().toLowerCase();
+    if (user == null || user.getEmail() == null) {
+        return "";
+    }
+    return user.getEmail().toLowerCase();
 }`,
        ai_confidence: 94,
      },
      {
        title: 'Wrap in java.util.Optional',
        description: 'Use the Optional class to safely handle potential null values, providing a clean functional API with defaults.',
        code_diff: `@@ -1,3 +1,3 @@
 public String getUserEmail(User user) {
-    return user.getEmail().toLowerCase();
+    return Optional.ofNullable(user).map(User::getEmail).map(String::toLowerCase).orElse("");
 }`,
        ai_confidence: 88,
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
        code_diff: `@@ -1,3 +1,3 @@
 def process_request(data):
-    username = data['username']
+    username = data.get('username', 'Anonymous')
     return f"Hello, {username}"`,
        ai_confidence: 96,
      },
      {
        title: 'Validate key existence explicitly',
        description: 'Check if the key is present in the dictionary prior to retrieval to control custom fallback flow.',
        code_diff: `@@ -1,3 +1,5 @@
 def process_request(data):
-    username = data['username']
+    username = 'Anonymous'
+    if 'username' in data:
+        username = data['username']`,
        ai_confidence: 85,
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
        code_diff: `@@ -1,3 +1,3 @@
 const renderUser = (user) => {
-  return <div>{user.profile.details.bio}</div>;
+  return <div>{user?.profile?.details?.bio ?? 'No biography'}</div>;
 };`,
        ai_confidence: 97,
      },
      {
        title: 'Define default values in destructuring',
        description: 'Provide sensible default values during variable extraction to protect downstream components.',
        code_diff: `@@ -1,2 +1,2 @@
-const { profile } = user;
+const { profile = { details: {} } } = user || {};
+const bio = profile.details.bio || 'No biography';`,
        ai_confidence: 89,
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
        code_diff: `@@ -1,2 +1,3 @@
-const output = compute(data);
+import { compute } from './computations.js';
+const output = compute(data || {});`,
        ai_confidence: 72,
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
    const diagnosis = matchError(errorText);

    // Save Error to DB
    const errorResult = await pool.query(
      'INSERT INTO errors(error_text, language, framework) VALUES($1, $2, $3) RETURNING id',
      [errorText, diagnosis.language, diagnosis.framework]
    );
    const errorId = errorResult.rows[0].id;

    // Save Fixes to DB
    const fixesList = [];
    for (const fix of diagnosis.fixes) {
      const fixResult = await pool.query(
        'INSERT INTO fixes(error_id, title, description, code_diff, ai_confidence) VALUES($1, $2, $3, $4, $5) RETURNING *',
        [errorId, fix.title, fix.description, fix.code_diff, fix.ai_confidence]
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

  try {
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

    // Simple, smart rule-based tailoring for demo purposes
    // We replace generic function names in our diff template with user's code function names
    let tailoredDiff = originalFix.code_diff;
    let tailoredDescription = originalFix.description;

    // Detect function name in userCode
    const funcMatch = userCode.match(/(?:function|const|let)\s+([a-zA-Z0-9_]+)/) || userCode.match(/def\s+([a-zA-Z0-9_]+)/);
    if (funcMatch && funcMatch[1]) {
      const userFuncName = funcMatch[1];
      tailoredDiff = tailoredDiff
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
      code_diff: tailoredDiff,
      ai_confidence: Math.min(100, originalFix.ai_confidence + 2), // Slightly higher confidence for tailored code
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
    message: 'Connected to FixIt Command Center websocket network.',
    type: 'system',
    timestamp: new Date().toLocaleTimeString(),
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// Periodic simulated notifications to show active debugging community
setInterval(() => {
  const simulatedEvents = [
    'User_482 solved a NullPointerException in Java',
    'JavaScript developer in Berlin upvoted "Hook Order" fix',
    'Python developer downvoted "Defensive check" solution',
    'CyberSlayer just tailored a solution to their React code',
    'AI confidence recalculated: Hook Order fix is now 98%',
    'Database connection established from secondary node'
  ];
  const types = ['diagnose', 'vote', 'vote', 'tailor', 'system', 'system'];
  const randomIndex = Math.floor(Math.random() * simulatedEvents.length);
  
  io.emit('notification', {
    id: uuidv4(),
    message: simulatedEvents[randomIndex],
    type: types[randomIndex],
    timestamp: new Date().toLocaleTimeString(),
  });
}, 25000); // every 25 seconds

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
