import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5433', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'postgres',
});

// Initialize database schema
export async function initDb() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL database successfully.');

    // Drop old tables first to perform a clean migration to the 6-table schema
    console.log('Dropping old tables for fresh schema migration...');
    await client.query(`
      DROP TABLE IF EXISTS team_error_logs CASCADE;
      DROP TABLE IF EXISTS teams CASCADE;
      DROP TABLE IF EXISTS votes CASCADE;
      DROP TABLE IF EXISTS fixes CASCADE;
      DROP TABLE IF EXISTS errors CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schemaSql);
    console.log('Database tables verified/created successfully.');
    
    // Seed initial users and teams for testing
    console.log('Seeding initial developer accounts...');
    const userRes = await client.query(`
      INSERT INTO users(email, plan_type) 
      VALUES('slayer@fixit.dev', 'pro') 
      ON CONFLICT DO NOTHING RETURNING id
    `);
    const teamRes = await client.query(`
      INSERT INTO teams(name, plan_type, api_key) 
      VALUES('Alpha Team', 'enterprise', 'alpha_secure_api_key_2026') 
      ON CONFLICT DO NOTHING RETURNING id
    `);
    
    console.log('Seeding completed.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

export default pool;
