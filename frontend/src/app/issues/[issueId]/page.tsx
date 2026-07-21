"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  Terminal, 
  Sparkles, 
  Tag, 
  Send,
  MessageSquare,
  Activity,
  Layers,
  HelpCircle,
  RefreshCw,
  User,
  HeartCrack
} from 'lucide-react';

interface Comment {
  id: string;
  issue_id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

interface ClickHouseEvent {
  event_id: string;
  timestamp: string;
  environment: string;
  release: string;
  exception_type: string;
  exception_message: string;
  stacktrace: string;
  breadcrumbs: string;
  tags: Record<string, string>;
  user_context: Record<string, string>;
}

interface IssueDetails {
  id: string;
  project_id: string;
  title: string;
  message: string;
  status: 'UNRESOLVED' | 'RESOLVED' | 'INVESTIGATING' | 'SILENCED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  occurrences_count: number;
  first_seen: string;
  last_seen: string;
  ai_analysis?: {
    summary: string;
    root_cause: string;
    fix_suggestion: string;
    analyzed_at: string;
  };
  comments: Comment[];
  latest_events: ClickHouseEvent[];
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function IssuePage({ params }: { params: { issueId: string } }) {
  const [issue, setIssue] = useState<IssueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const issueId = params.issueId;

  // Load Issue details
  useEffect(() => {
    async function loadIssue() {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/issues/${issueId}`);
        if (!response.ok) throw new Error('API server returned error');
        const data = await response.json();
        setIssue(data);
        setOffline(false);
      } catch (err) {
        console.warn('Backend server offline. Displaying mock issue detail.');
        setOffline(true);
        setIssue(generateMockIssueDetails(issueId));
      } finally {
        setLoading(false);
      }
    }
    loadIssue();
  }, [issueId]);

  // Handle status update
  async function handleStatusChange(status: string) {
    if (!issue) return;
    setUpdatingStatus(true);

    if (offline) {
      setTimeout(() => {
        setIssue(prev => prev ? { ...prev, status: status as any } : null);
        setUpdatingStatus(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/issues/${issueId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssue(prev => prev ? { ...prev, status: updated.status } : null);
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Handle post comment
  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!issue || !newComment.trim()) return;
    setSubmittingComment(true);

    if (offline) {
      setTimeout(() => {
        const comment: Comment = {
          id: 'comment-' + Date.now(),
          issue_id: issueId,
          user_name: 'Sandbox Developer',
          avatar_url: null,
          content: newComment,
          created_at: new Date().toISOString()
        };
        setIssue(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
        setNewComment('');
        setSubmittingComment(false);
      }, 400);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (response.ok) {
        const comment = await response.json();
        setIssue(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
        setNewComment('');
      }
    } catch (err) {
      alert('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-secondary)' }}>
        <RefreshCw size={32} className="animate-spin" color="var(--primary)" />
        <span>Fetching issue contexts, log occurrences, and AI diagnostics...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <HeartCrack size={48} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
        <h2>Issue Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>The requested error event signature does not exist in our metadata store.</p>
        <Link href="/" className="btn btn-secondary" style={{ marginTop: '2rem' }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const latestEvent = issue.latest_events?.[0];
  const breadcrumbs = latestEvent ? JSON.parse(latestEvent.breadcrumbs) : [];

  return (
    <div className="app-container">
      {/* Back Link */}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.95rem' }} className="btn btn-secondary">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Log Contexts & AI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Issue Header */}
          <div style={{ padding: '2rem' }} className={`glass-panel severity-${issue.severity.toLowerCase()}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className={`badge badge-${issue.status.toLowerCase()}`}>{issue.status}</span>
                  <span className={`badge severity-${issue.severity.toLowerCase()}`} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem' }}>
                    {issue.severity} Severity
                  </span>
                </div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.5rem', wordBreak: 'break-word' }}>
                  {issue.title}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                  {issue.message}
                </p>
              </div>

              {/* Status Updater */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TRIAGE STATE</span>
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="form-input"
                  style={{ background: 'var(--bg-main)', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="UNRESOLVED">🔴 Unresolved</option>
                  <option value="INVESTIGATING">🟡 Investigating</option>
                  <option value="RESOLVED">🟢 Resolved</option>
                  <option value="SILENCED">⚪ Silenced</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Diagnostics Panel (Gemini 1.5) */}
          <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'linear-gradient(135deg, rgba(13,17,33,0.7) 0%, rgba(99,102,241,0.04) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Copilot Diagnostics</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Gemini 1.5 Flash</span>
                </div>
              </div>
              
              {issue.ai_analysis && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Analyzed {new Date(issue.ai_analysis.analyzed_at).toLocaleTimeString()}
                </span>
              )}
            </div>

            {issue.ai_analysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '0.25rem' }}>Summary</h4>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {issue.ai_analysis.summary}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '0.25rem' }}>Root Cause Hypothesis</h4>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {issue.ai_analysis.root_cause}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '0.5rem' }}>Suggested Resolution</h4>
                  <div style={{ 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px', 
                    padding: '1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                    lineHeight: 1.5
                  }}>
                    {issue.ai_analysis.fix_suggestion}
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                AI is currently diagnosing this crash...
              </div>
            )}
          </div>

          {/* Stacktrace Explorer */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} /> Stack Trace
            </h3>
            {latestEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <pre style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  color: '#e2e8f0',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {latestEvent.stacktrace}
                </pre>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No stack trace logs collected.</div>
            )}
          </div>

          {/* Breadcrumbs Timeline */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} /> Telemetry Breadcrumbs
            </h3>
            {breadcrumbs.length > 0 ? (
              <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                {breadcrumbs.map((crumb: any, index: number) => (
                  <div key={index} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    {/* Bullet */}
                    <div style={{
                      position: 'absolute',
                      left: '-29px',
                      top: '4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: crumb.type === 'error' || crumb.type === 'network' && crumb.message.includes('500') ? 'var(--error)' : 'var(--primary)',
                      border: '2px solid var(--bg-main)'
                    }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {crumb.message}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(crumb.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Category: {crumb.type || 'system'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No preceding SDK breadcrumbs tracked for this event.</div>
            )}
          </div>

        </div>

        {/* Right Column: Statistics & Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Metadata Stats Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={14} /> METRIC DETAILS
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Occurrences</span>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{issue.occurrences_count} events</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>First Seen</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {new Date(issue.first_seen).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last Seen</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {new Date(issue.last_seen).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Environment</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--info)' }}>
                  {latestEvent?.environment || 'production'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Release</span>
                <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.04)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {latestEvent?.release || 'unknown'}
                </span>
              </div>

            </div>
          </div>

          {/* Client Details / Tags */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={14} /> META TAGS
            </h3>
            {latestEvent && latestEvent.tags ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.entries(latestEvent.tags).map(([key, val]) => (
                  <div key={key} style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '0.35rem 0.6rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{key}:</strong> {val}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No telemetry tags found.</div>
            )}
          </div>

          {/* Collaboration Comment Thread */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={14} /> COMMENTS ({issue.comments.length})
            </h3>
            
            {/* Comment List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxMerge: '250px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {issue.comments.map((comment) => (
                <div key={comment.id} style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={10} /> {comment.user_name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {comment.content}
                  </p>
                </div>
              ))}
              {issue.comments.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                  No updates posted. Claim assignment and log notes below.
                </p>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Log resolution steps or notes..."
                className="form-input"
                style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submittingComment}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0.5rem' }}
                disabled={submittingComment}
              >
                <Send size={14} />
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}

// Generate sandbox fallback metrics if API service fails to yield a database hook
function generateMockIssueDetails(issueId: string): IssueDetails {
  const isDB = issueId.includes('db') || issueId.includes('database');
  
  return {
    id: issueId,
    project_id: 'proj-1',
    title: isDB 
      ? 'DatabaseConnectionError: Pool Limit Exceeded' 
      : 'TypeError: Cannot read property "map" of undefined',
    message: isDB 
      ? 'Connection pool "fixit_metadata" exhausted. 100 active clients.' 
      : 'at fetchDashboardTimeline (metrics.ts:42:15)\nat async loadAnalytics (metrics.ts:18:24)',
    status: 'UNRESOLVED',
    severity: isDB ? 'CRITICAL' : 'HIGH',
    occurrences_count: isDB ? 55 : 320,
    first_seen: new Date(Date.now() - 24 * 3600000).toISOString(),
    last_seen: new Date(Date.now() - 5 * 60000).toISOString(),
    ai_analysis: {
      summary: isDB 
        ? 'The backend API service is failing to execute operations because it cannot acquire an active socket from the PostgreSQL pool.'
        : 'A runtime error occurred when attempting to map elements of an array because the target variable resolving from your API endpoint is null or undefined.',
      root_cause: isDB
        ? 'Connection pool size was hardcoded to 100, but dashboard widgets are concurrently polling API routes. High volume has exhausted pool resources.'
        : 'The database returned a NULL response for timeline logs under projects with no registered events. The client route was not handling empty states.',
      fix_suggestion: isDB
        ? 'Increase PG pool limits in docker configuration and implement query connection releases:\n\n```typescript\n// Increase pool limits\nconst pgPool = new Pool({\n  max: 250, // Increase max connection threshold\n  idleTimeoutMillis: 30000,\n});\n```'
        : 'Initialize fallback arrays inside the analytics selector:\n\n```typescript\n// Fallback pattern\nconst data = timeline || [];\ndata.map(t => {\n  // secure logic\n});\n```',
      analyzed_at: new Date().toISOString()
    },
    comments: [],
    latest_events: [
      {
        event_id: 'evt-10928',
        timestamp: new Date().toISOString(),
        environment: 'production',
        release: 'v1.4.1',
        exception_type: isDB ? 'DatabaseConnectionError' : 'TypeError',
        exception_message: isDB ? 'Pool exhausted' : 'Cannot read property "map"',
        stacktrace: isDB 
          ? `at Pool.acquireConnection (pg-pool.js:84:18)\nat async pgQuery (db.ts:4:20)\nat async getUserData (user.ts:88:14)`
          : `at fetchDashboardTimeline (metrics.ts:42:15)\nat async loadAnalytics (metrics.ts:18:24)\nat handleRefresh (dashboard.tsx:8:14)`,
        breadcrumbs: JSON.stringify([
          { timestamp: new Date(Date.now() - 6000).toISOString(), message: 'Navigated to dashboard analytics', type: 'navigation' },
          { timestamp: new Date(Date.now() - 2000).toISOString(), message: 'Requested reload metrics', type: 'ui' }
        ]),
        tags: {
          browser: 'Chrome 124',
          os: 'Windows 11',
          environment: 'production',
          version: '1.4.1'
        },
        user_context: {
          id: 'usr_849',
          email: 'admin@acme.com'
        }
      }
    ]
  };
}
