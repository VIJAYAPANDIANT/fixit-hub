import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { createClient as createClickHouseClient } from '@clickhouse/client';
import { EventWorker } from './worker';

const app = express();
const port = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// 1. Connection Configurations
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/fixit_metadata',
});

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

const clickhouseClient = createClickHouseClient({
  host: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: 'default',
  password: '',
  database: process.env.CLICKHOUSE_DB || 'fixit_events',
});

// 2. Database & Schema Initialization
async function initializeDB() {
  console.log('Initializing PostgreSQL schemas and seeding defaults...');
  const client = await pgPool.connect();
  try {
    // Helper to create types safely
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE issue_status AS ENUM ('UNRESOLVED', 'RESOLVED', 'INVESTIGATING', 'SILENCED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE issue_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        dsn_key VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id UUID PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        fingerprint VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        status issue_status DEFAULT 'UNRESOLVED',
        severity issue_severity DEFAULT 'MEDIUM',
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        first_seen TIMESTAMP NOT NULL,
        last_seen TIMESTAMP NOT NULL,
        occurrences_count INTEGER DEFAULT 1,
        ai_analysis JSONB,
        UNIQUE(project_id, fingerprint)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check seed data
    const orgRes = await client.query('SELECT id FROM organizations LIMIT 1');
    let orgId: string;
    
    if (orgRes.rows.length === 0) {
      const newOrg = await client.query(
        "INSERT INTO organizations (name) VALUES ('Acme Corp') RETURNING id"
      );
      orgId = newOrg.rows[0].id;
      console.log('Seeded organization Acme Corp.');
    } else {
      orgId = orgRes.rows[0].id;
    }

    const userRes = await client.query('SELECT id FROM users LIMIT 1');
    let userId: string;
    if (userRes.rows.length === 0) {
      const newUser = await client.query(
        `INSERT INTO users (email, password_hash, name) 
         VALUES ('admin@fixit.hub', 'scrypt_hashed_password', 'Admin User') 
         RETURNING id`
      );
      userId = newUser.rows[0].id;
      console.log('Seeded user admin@fixit.hub.');
    } else {
      userId = userRes.rows[0].id;
    }

    const projectRes = await client.query('SELECT id FROM projects LIMIT 1');
    if (projectRes.rows.length === 0) {
      const backendProj = await client.query(
        `INSERT INTO projects (org_id, name, dsn_key) 
         VALUES ($1, 'Production Backend API', 'http://token_api_secret_key_1@localhost:5001/1') 
         RETURNING id`,
        [orgId]
      );
      const frontendProj = await client.query(
        `INSERT INTO projects (org_id, name, dsn_key) 
         VALUES ($1, 'Customer Web Dashboard', 'http://token_web_secret_key_2@localhost:5001/2') 
         RETURNING id`,
        [orgId]
      );
      console.log('Seeded default projects with DSNs.');

      // Prime Redis DSN indexes so the Go Ingestion service doesn't have to hit PostgreSQL
      await redisClient.set('dsn:http://token_api_secret_key_1@localhost:5001/1', backendProj.rows[0].id);
      await redisClient.set('dsn:http://token_web_secret_key_2@localhost:5001/2', frontendProj.rows[0].id);
    }
  } catch (err) {
    console.error('PostgreSQL Initialization Error:', err);
  } finally {
    client.release();
  }
}

// 3. API Handlers

app.get('/', (req, res) => {
  res.json({ status: 'healthy', message: 'Universal Error & Bug Resolution Hub API is running.' });
});

app.get('/api', (req, res) => {
  res.json({ status: 'healthy', message: 'Universal Error & Bug Resolution Hub API is running.' });
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await pgPool.query('SELECT * FROM projects ORDER BY name ASC');
    res.json(projects.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get filtered issues for a project
app.get('/api/projects/:projectId/issues', async (req, res) => {
  const { projectId } = req.params;
  const { status, severity, search } = req.query;

  let queryText = 'SELECT * FROM issues WHERE project_id = $1';
  const queryParams: any[] = [projectId];
  let paramIndex = 2;

  if (status) {
    queryText += ` AND status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }
  if (severity) {
    queryText += ` AND severity = $${paramIndex}`;
    queryParams.push(severity);
    paramIndex++;
  }
  if (search) {
    queryText += ` AND (title ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  queryText += ' ORDER BY last_seen DESC';

  try {
    const issues = await pgPool.query(queryText, queryParams);
    res.json(issues.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get issue stats (24-hour event timeline, browser / OS distributions)
app.get('/api/projects/:projectId/analytics', async (req, res) => {
  const { projectId } = req.params;
  try {
    // 1. ClickHouse Timeline query: Event counts grouped by hour for the last 7 days
    const timelineResultSet = await clickhouseClient.query({
      query: `
        SELECT 
          toStartOfHour(timestamp) as time,
          count() as count
        FROM events
        WHERE project_id = {pid:UUID} AND timestamp >= now() - INTERVAL 7 DAY
        GROUP BY time
        ORDER BY time ASC
      `,
      query_params: { pid: projectId },
      format: 'JSONEachRow',
    });
    const timeline = await timelineResultSet.json();

    // 2. ClickHouse Browser distribution query
    const browserResultSet = await clickhouseClient.query({
      query: `
        SELECT 
          mapContains(tags, 'browser') ? tags['browser'] : 'unknown' as browser,
          count() as count
        FROM events
        WHERE project_id = {pid:UUID}
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 5
      `,
      query_params: { pid: projectId },
      format: 'JSONEachRow',
    });
    const browsers = await browserResultSet.json();

    // 3. ClickHouse OS distribution query
    const osResultSet = await clickhouseClient.query({
      query: `
        SELECT 
          mapContains(tags, 'os') ? tags['os'] : 'unknown' as os,
          count() as count
        FROM events
        WHERE project_id = {pid:UUID}
        GROUP BY os
        ORDER BY count DESC
        LIMIT 5
      `,
      query_params: { pid: projectId },
      format: 'JSONEachRow',
    });
    const osList = await osResultSet.json();

    res.json({ timeline, browsers, os: osList });
  } catch (err: any) {
    console.error('ClickHouse analytics query failed:', err);
    // Return mock analytics if ClickHouse connection is missing or failing locally
    res.json({
      timeline: Array.from({ length: 24 }).map((_, i) => ({
        time: new Date(Date.now() - (24 - i) * 60 * 60 * 1000).toISOString(),
        count: Math.floor(Math.random() * 50) + 5,
      })),
      browsers: [
        { browser: 'Chrome', count: 184 },
        { browser: 'Firefox', count: 42 },
        { browser: 'Safari', count: 28 },
      ],
      os: [
        { os: 'Windows', count: 120 },
        { os: 'macOS', count: 90 },
        { os: 'Linux', count: 44 },
      ],
    });
  }
});

// Get individual issue details (including recent events and comments)
app.get('/api/issues/:issueId', async (req, res) => {
  const { issueId } = req.params;
  try {
    const issueRes = await pgPool.query('SELECT * FROM issues WHERE id = $1', [issueId]);
    if (issueRes.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    const issue = issueRes.rows[0];

    // Fetch comments
    const commentsRes = await pgPool.query(
      `SELECT c.*, u.name as user_name, u.avatar_url 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.issue_id = $1 
       ORDER BY c.created_at ASC`,
      [issueId]
    );

    // Fetch latest occurrences from ClickHouse
    let events: any[] = [];
    try {
      const clickhouseRes = await clickhouseClient.query({
        query: `
          SELECT event_id, timestamp, environment, release, exception_type, exception_message, stacktrace, breadcrumbs, tags, user_context
          FROM events
          WHERE issue_id = {iid:UUID}
          ORDER BY timestamp DESC
          LIMIT 10
        `,
        query_params: { iid: issueId },
        format: 'JSONEachRow',
      });
      events = await clickhouseRes.json();
    } catch (chErr) {
      console.warn('ClickHouse events pull failed. Providing mock stacktraces.');
      // Return a simulated latest event if ClickHouse isn't working
      events = [
        {
          event_id: 'mock-evt-112',
          timestamp: issue.last_seen,
          environment: 'production',
          release: 'v1.4.2',
          exception_type: issue.title.split(':')[0],
          exception_message: issue.message,
          stacktrace: `at Object.processData (index.ts:18:24)\nat App.handleEvent (app.tsx:42:15)\nat HTMLButtonElement.dispatch (react-dom.production.min.js:34:110)`,
          breadcrumbs: JSON.stringify([
            { timestamp: new Date(Date.now() - 1000).toISOString(), message: 'Button Sign In Clicked', type: 'ui' },
            { timestamp: new Date().toISOString(), message: 'API Request POST /auth/login - 500', type: 'network' }
          ]),
          tags: { browser: 'Chrome', os: 'Windows', version: '124' },
          user_context: { id: 'usr_849', email: 'support@example.com' }
        }
      ];
    }

    res.json({
      ...issue,
      comments: commentsRes.rows,
      latest_events: events,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update issue status
app.put('/api/issues/:issueId/status', async (req, res) => {
  const { issueId } = req.params;
  const { status } = req.body;

  try {
    const issueRes = await pgPool.query(
      'UPDATE issues SET status = $1 WHERE id = $2 RETURNING *',
      [status, issueId]
    );
    if (issueRes.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issueRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment to issue
app.post('/api/issues/:issueId/comments', async (req, res) => {
  const { issueId } = req.params;
  const { content } = req.body;

  try {
    // Get default admin user id
    const userRes = await pgPool.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'No user registered to comment' });
    }
    const userId = userRes.rows[0].id;

    const commentRes = await pgPool.query(
      `INSERT INTO comments (issue_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *, (SELECT name FROM users WHERE id = $2) as user_name`,
      [issueId, userId, content]
    );

    res.json(commentRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Custom simulation endpoint to trigger client errors dynamically
app.post('/api/projects/:projectId/simulate', async (req, res) => {
  const { projectId } = req.params;
  const { type } = req.body; // e.g. "TypeError", "NullPointer", "DatabaseConnectionError"

  try {
    const projRes = await pgPool.query('SELECT dsn_key FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const dsn = projRes.rows[0].dsn_key;

    // Simulate sending log payloads
    let exception_type = type || 'TypeError';
    let exception_message = 'Cannot read property "user_session" of undefined';
    let stacktrace = `at renderDashboard (dashboard.tsx:120:45)\nat Object.render (react-dom.production.min.js:14:24)\nat startApp (index.tsx:28:10)`;
    let tags = { browser: 'Firefox', os: 'Linux' };

    if (type === 'DatabaseConnectionError') {
      exception_message = 'Connection pool exhausted. Timeout acquiring connection after 30s';
      stacktrace = `at Pool.acquireConnection (pg-pool.js:84:18)\nat async pgQuery (db.ts:4:20)\nat async getUserData (user.ts:88:14)`;
      tags = { browser: 'Server', os: 'Ubuntu' };
    } else if (type === 'NetworkTimeout') {
      exception_message = 'Failed to fetch /api/v1/user: connection timed out';
      stacktrace = `at window.fetch (fetch.js:4:88)\nat async syncUserData (sync.ts:40:11)`;
      tags = { browser: 'Chrome', os: 'macOS' };
    }

    const payload = {
      exception_type,
      exception_message,
      stacktrace,
      environment: 'production',
      release: 'v1.4.1',
      tags,
      breadcrumbs: JSON.stringify([
        { timestamp: new Date(Date.now() - 5000).toISOString(), message: 'Navigated to /dashboard', type: 'navigation' },
        { timestamp: new Date(Date.now() - 2000).toISOString(), message: 'Clicked refresh logs', type: 'ui' }
      ]),
      user_context: { id: 'usr_882', email: 'developer@acme.com' }
    };

    // Make an internal loop-back call to Go Ingestion service
    // Running in docker-compose, go ingestion port is 5001
    const ingestionUrl = process.env.INGESTION_URL || 'http://localhost:5001';
    const response = await fetch(`${ingestionUrl}/api/v1/store/?dsn=${encodeURIComponent(dsn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Ingestion failed: ${errText}` });
    }

    const result = await response.json();
    res.json({ message: 'Error simulated successfully', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server Initialization
async function startServer() {
  // Wait a few seconds for services to start in Docker
  console.log('Connecting to Redis...');
  await redisClient.connect();
  console.log('Redis connected.');

  await initializeDB();

  // Start Event worker in parallel
  const worker = new EventWorker(pgPool, redisClient);
  worker.start().catch((err) => console.error('Worker run crash:', err));

  app.listen(port, () => {
    console.log(`FixIt Management Server listening on port ${port}...`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal API Server Crash:', err);
  });
}

export default app;
