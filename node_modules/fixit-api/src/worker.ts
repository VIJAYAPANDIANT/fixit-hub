import { Pool } from 'pg';
import { createClient } from 'redis';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface EventTask {
  event_id: string;
  project_id: string;
  issue_id: string;
  fingerprint: string;
  exception_type: string;
  exception_message: string;
  stacktrace: string;
  environment: string;
  timestamp: string;
}

export class EventWorker {
  private pgPool: Pool;
  private redisClient: ReturnType<typeof createClient>;
  private genAI?: GoogleGenerativeAI;
  private isRunning: boolean = false;

  constructor(pgPool: Pool, redisClient: ReturnType<typeof createClient>) {
    this.pgPool = pgPool;
    this.redisClient = redisClient;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('Gemini AI diagnostics client initialized.');
    } else {
      console.warn('GEMINI_API_KEY not set. Worker will use local diagnostics fallback.');
    }
  }

  public async start() {
    this.isRunning = true;
    console.log('Event processing worker started. Listening on queue:events...');

    while (this.isRunning) {
      try {
        // Pop task from Redis (wait up to 5 seconds if queue is empty)
        const result = await this.redisClient.brPop('queue:events', 5);
        if (!result) continue;

        const task: EventTask = JSON.parse(result.element);
        await this.processEvent(task);
      } catch (err) {
        console.error('Worker loop error:', err);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  public stop() {
    this.isRunning = false;
  }

  private async processEvent(task: EventTask) {
    console.log(`[Worker] Processing event ${task.event_id} for issue ${task.issue_id}`);

    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Check if the issue already exists
      const res = await client.query(
        'SELECT id, occurrences_count FROM issues WHERE id = $1 FOR UPDATE',
        [task.issue_id]
      );

      let isNew = false;
      const timestamp = new Date(task.timestamp);

      if (res.rows.length === 0) {
        isNew = true;
        // Insert new Issue record
        const title = `${task.exception_type}: ${task.exception_message.split('\n')[0]}`;
        const severity = this.heuristicsSeverity(task.exception_type, task.exception_message);

        await client.query(
          `INSERT INTO issues (id, project_id, fingerprint, title, message, status, severity, first_seen, last_seen, occurrences_count)
           VALUES ($1, $2, $3, $4, $5, 'UNRESOLVED', $6, $7, $8, 1)`,
          [
            task.issue_id,
            task.project_id,
            task.fingerprint,
            title.substring(0, 255),
            task.exception_message,
            severity,
            timestamp,
            timestamp,
          ]
        );
      } else {
        // Update existing Issue
        await client.query(
          `UPDATE issues 
           SET last_seen = $1, occurrences_count = occurrences_count + 1, status = CASE WHEN status = 'RESOLVED' THEN 'UNRESOLVED'::issue_status ELSE status END
           WHERE id = $2`,
          [timestamp, task.issue_id]
        );
      }

      await client.query('COMMIT');

      // 2. If it's a new issue, trigger AI Diagnostics asynchronously
      if (isNew) {
        this.runAIDiagnostics(task).catch((err) =>
          console.error(`AI Diagnostics failed for issue ${task.issue_id}:`, err)
        );
      }
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private heuristicsSeverity(type: string, message: string): string {
    const text = (type + ' ' + message).toLowerCase();
    if (text.includes('critical') || text.includes('fatal') || text.includes('panic') || text.includes('sigsevg')) {
      return 'CRITICAL';
    }
    if (text.includes('database') || text.includes('conn') || text.includes('auth') || text.includes('forbidden') || text.includes('unauthorized')) {
      return 'HIGH';
    }
    if (text.includes('warning') || text.includes('deprecated') || text.includes('info')) {
      return 'LOW';
    }
    return 'MEDIUM';
  }

  private async runAIDiagnostics(task: EventTask) {
    console.log(`[AI Worker] Analyzing issue ${task.issue_id} using Gemini...`);
    let summary = '';
    let rootCause = '';
    let fixSuggestion = '';

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
You are a senior debugger. Analyze the following error and stack trace.
Exception: ${task.exception_type}
Message: ${task.exception_message}
Stacktrace:
${task.stacktrace}

Provide a structured analysis in valid JSON format ONLY. Do not wrap in markdown code blocks like \\\`json. Return exactly this JSON structure:
{
  "summary": "Brief summary of the issue",
  "root_cause": "The root cause hypothesis explaining why this crash happens",
  "fix_suggestion": "Step-by-step resolution proposal with example code"
}
`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        // Try parsing JSON out of text (handling potential ```json wrappers if Gemini ignores instructions)
        const cleanJSON = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const analysis = JSON.parse(cleanJSON);
        
        summary = analysis.summary || 'Unhandled exception detected.';
        rootCause = analysis.root_cause || 'Unknown root cause.';
        fixSuggestion = analysis.fix_suggestion || 'No fix suggested.';
      } catch (err) {
        console.error('Gemini call failed, falling back to offline heuristics:', err);
        const fallback = this.generateLocalDiagnostics(task);
        summary = fallback.summary;
        rootCause = fallback.rootCause;
        fixSuggestion = fallback.fixSuggestion;
      }
    } else {
      const fallback = this.generateLocalDiagnostics(task);
      summary = fallback.summary;
      rootCause = fallback.rootCause;
      fixSuggestion = fallback.fixSuggestion;
    }

    // Save AI findings to PostgreSQL
    const aiPayload = {
      summary,
      root_cause: rootCause,
      fix_suggestion: fixSuggestion,
      analyzed_at: new Date().toISOString(),
    };

    await this.pgPool.query(
      'UPDATE issues SET ai_analysis = $1 WHERE id = $2',
      [JSON.stringify(aiPayload), task.issue_id]
    );

    console.log(`[AI Worker] Saved diagnostics for issue ${task.issue_id}`);
  }

  private generateLocalDiagnostics(task: EventTask) {
    const summary = `Local analysis of unhandled exception: ${task.exception_type}`;
    let rootCause = `The application threw a ${task.exception_type} due to "${task.exception_message}". `;
    let fixSuggestion = '';

    if (task.exception_type.includes('Null') || task.exception_type.includes('undefined')) {
      rootCause += 'A reference was made to an uninitialized, null, or undefined object instance.';
      fixSuggestion = `Ensure the target object is defined before invoking properties on it.\n\n\`\`\`javascript\nif (target) {\n  // do action\n} else {\n  // handle error condition\n}\n\`\`\``;
    } else if (task.exception_type.includes('Auth') || task.exception_type.includes('Token')) {
      rootCause += 'Authentication tokens were missing, invalid, or expired.';
      fixSuggestion = 'Check your API header parsing, verify token decryption keys, or refresh your session configuration.';
    } else if (task.exception_type.includes('Database') || task.exception_type.includes('Query')) {
      rootCause += 'The database query failed, likely due to a connection timeout, syntax error, or deadlocks.';
      fixSuggestion = 'Check DB pool size limit, test connections locally, and run database migrations if tables are missing.';
    } else {
      rootCause += 'Inspect the stack trace parameters and review recent code commits.';
      fixSuggestion = 'Wrap in a try-catch block, inspect environment variables, and verify input schemas.';
    }

    return { summary, rootCause, fixSuggestion };
  }
}
