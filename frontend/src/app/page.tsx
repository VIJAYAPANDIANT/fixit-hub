"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Search, 
  Terminal, 
  Zap, 
  RefreshCw, 
  Layers, 
  Clock, 
  Activity,
  Chrome,
  Laptop,
  ArrowRight
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  dsn_key: string;
  created_at: string;
}

interface Issue {
  id: string;
  project_id: string;
  title: string;
  message: string;
  status: 'UNRESOLVED' | 'RESOLVED' | 'INVESTIGATING' | 'SILENCED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  occurrences_count: number;
  last_seen: string;
}

interface Analytics {
  timeline: { time: string; count: number }[];
  browsers: { browser: string; count: number }[];
  os: { os: string; count: number }[];
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [simulating, setSimulating] = useState(false);

  // Load projects
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`${API_BASE}/projects`);
        if (!response.ok) throw new Error('API server returned error');
        const projData = await response.json();
        setProjects(projData);
        if (projData.length > 0) {
          setSelectedProject(projData[0]);
        }
        setOffline(false);
      } catch (err) {
        console.warn('Backend server offline, loading mock sandbox data.');
        setOffline(true);
        // Load mock sandbox projects
        const mockProj: Project[] = [
          { id: 'proj-1', name: 'Acme Production API', dsn_key: 'http://token_api_secret_key_1@localhost:5001/1', created_at: new Date().toISOString() },
          { id: 'proj-2', name: 'Corporate Web App', dsn_key: 'http://token_web_secret_key_2@localhost:5001/2', created_at: new Date().toISOString() }
        ];
        setProjects(mockProj);
        setSelectedProject(mockProj[0]);
      }
    }
    loadData();
  }, []);

  // Fetch project-specific data (issues & analytics)
  useEffect(() => {
    if (!selectedProject) return;

    async function fetchProjectData() {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterStatus) queryParams.append('status', filterStatus);
      if (filterSeverity) queryParams.append('severity', filterSeverity);
      if (search) queryParams.append('search', search);

      try {
        const issuesUrl = offline 
          ? '' 
          : `${API_BASE}/projects/${selectedProject.id}/issues?${queryParams.toString()}`;
        const analyticsUrl = offline 
          ? '' 
          : `${API_BASE}/projects/${selectedProject.id}/analytics`;

        if (offline) {
          // Mock data generation
          setIssues(generateMockIssues(selectedProject.id, filterStatus, filterSeverity, search));
          setAnalytics(generateMockAnalytics(selectedProject.id));
        } else {
          const [issuesRes, analyticsRes] = await Promise.all([
            fetch(issuesUrl),
            fetch(analyticsUrl)
          ]);
          setIssues(await issuesRes.json());
          setAnalytics(await analyticsRes.json());
        }
      } catch (err) {
        console.error('Failed to load project details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectData();
  }, [selectedProject, filterStatus, filterSeverity, search, offline]);

  // Periodic polling for new errors (runs every 4 seconds)
  useEffect(() => {
    if (offline || !selectedProject) return;
    const interval = setInterval(async () => {
      try {
        const queryParams = new URLSearchParams();
        if (filterStatus) queryParams.append('status', filterStatus);
        if (filterSeverity) queryParams.append('severity', filterSeverity);
        if (search) queryParams.append('search', search);

        const [issuesRes, analyticsRes] = await Promise.all([
          fetch(`${API_BASE}/projects/${selectedProject.id}/issues?${queryParams.toString()}`),
          fetch(`${API_BASE}/projects/${selectedProject.id}/analytics`)
        ]);
        setIssues(await issuesRes.json());
        setAnalytics(await analyticsRes.json());
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedProject, filterStatus, filterSeverity, search, offline]);

  // Trigger error simulation
  async function handleSimulate(type: string) {
    if (!selectedProject) return;
    setSimulating(true);

    if (offline) {
      // Simulate locally in sandbox mode
      setTimeout(() => {
        setIssues(prev => {
          const issueId = 'mock-issue-' + type.toLowerCase();
          const match = prev.find(i => i.id === issueId);
          if (match) {
            return prev.map(i => i.id === issueId ? { ...i, occurrences_count: i.occurrences_count + 1, last_seen: new Date().toISOString() } : i);
          } else {
            return [
              {
                id: issueId,
                project_id: selectedProject.id,
                title: `${type}: Simulated application crash log`,
                message: `Failure triggered at ${new Date().toLocaleTimeString()}`,
                status: 'UNRESOLVED',
                severity: type === 'DatabaseConnectionError' ? 'HIGH' : 'MEDIUM',
                occurrences_count: 1,
                last_seen: new Date().toISOString()
              },
              ...prev
            ];
          }
        });
        setSimulating(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/projects/${selectedProject.id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (response.ok) {
        // Force refresh
        const issuesRes = await fetch(`${API_BASE}/projects/${selectedProject.id}/issues`);
        setIssues(await issuesRes.json());
        const analyticsRes = await fetch(`${API_BASE}/projects/${selectedProject.id}/analytics`);
        setAnalytics(await analyticsRes.json());
      }
    } catch (err) {
      alert('Error triggering simulation endpoint');
    } finally {
      setSimulating(false);
    }
  }

  // Helper to render timeline charts SVG
  function renderTimelineChart() {
    if (!analytics || analytics.timeline.length === 0) return null;
    const counts = analytics.timeline.map(t => t.count);
    const maxVal = Math.max(...counts, 10);
    const chartHeight = 80;
    const chartWidth = 500;
    const padding = 20;

    const points = analytics.timeline.map((t, index) => {
      const x = padding + (index / (analytics.timeline.length - 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - (t.count / maxVal) * (chartHeight - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="timeline-svg" style={{ width: '100%', height: '100px' }}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Fill Area */}
        {points && (
          <polygon
            points={`${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`}
            fill="url(#gradient)"
          />
        )}
        {/* Line */}
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          points={points}
        />
        {/* Bottom axis line */}
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <div className="app-container">
      {/* Offline Alert Banner */}
      {offline && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: 'var(--warning-bg)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#fef08a'
        }}>
          <AlertTriangle size={24} />
          <div>
            <h4 style={{ fontWeight: 600 }}>Running in Offline Sandbox Mode</h4>
            <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Could not connect to the Backend API at {API_BASE}. Run `docker-compose up` to run the real Go Ingestion, ClickHouse, Redis, and Express processes.</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
        
        {/* Sidebar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Projects Selector */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} /> PROJECTS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  style={{
                    textAlign: 'left',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedProject?.id === proj.id ? 'var(--primary)' : 'var(--border-color)',
                    background: selectedProject?.id === proj.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                    color: selectedProject?.id === proj.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: selectedProject?.id === proj.id ? 600 : 400
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{proj.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {proj.dsn_key}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Simulator Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="var(--primary)" /> Crash Simulator
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Trigger runtime exceptions to test real-time ingestion pipeline, deduplication, and AI diagnostics.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => handleSimulate('TypeError')}
                disabled={simulating}
                className="btn btn-secondary" 
                style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'flex-start' }}
              >
                <Terminal size={14} /> Trigger TypeError
              </button>
              <button 
                onClick={() => handleSimulate('DatabaseConnectionError')}
                disabled={simulating}
                className="btn btn-secondary" 
                style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'flex-start' }}
              >
                <Terminal size={14} /> Trigger DB Exhaustion
              </button>
              <button 
                onClick={() => handleSimulate('NetworkTimeout')}
                disabled={simulating}
                className="btn btn-secondary" 
                style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'flex-start' }}
              >
                <Terminal size={14} /> Trigger Network Timeout
              </button>
            </div>
          </div>

        </div>

        {/* Dashboard Main Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Selected Project Header / Key Metrics */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{selectedProject?.name}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                DSN Endpoint: <code style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>{selectedProject?.dsn_key}</code>
              </p>
            </div>
            
            <button 
              onClick={() => {
                if (selectedProject) setSelectedProject({ ...selectedProject });
              }}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {/* Analytics Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
            
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={14} /> EVENTS VOLUME (7D)
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time ClickHouse Aggregation</span>
              </div>
              {analytics ? renderTimelineChart() : <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>}
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Chrome size={14} /> TOP BROWSER
              </h4>
              {analytics && analytics.browsers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {analytics.browsers.slice(0, 3).map((b, idx) => (
                    <div key={b.browser} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: idx === 0 ? 'var(--primary)' : 'var(--text-secondary)' }}></span>
                        {b.browser}
                      </span>
                      <span style={{ fontWeight: 600 }}>{b.count} events</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data collected</div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Laptop size={14} /> TOP PLATFORM
              </h4>
              {analytics && analytics.os.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {analytics.os.slice(0, 3).map((o, idx) => (
                    <div key={o.os} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: idx === 0 ? 'var(--info)' : 'var(--text-secondary)' }}></span>
                        {o.os}
                      </span>
                      <span style={{ fontWeight: 600 }}>{o.count} events</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data collected</div>
              )}
            </div>

          </div>

          {/* Filtering Bar */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search issues title, message..." 
                className="form-input" 
                style={{ width: '100%', paddingLeft: '2.5rem' }} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              className="form-input" 
              value={filterSeverity} 
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{ background: 'var(--bg-main)', cursor: 'pointer' }}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select 
              className="form-input" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ background: 'var(--bg-main)', cursor: 'pointer' }}
            >
              <option value="">All Statuses</option>
              <option value="UNRESOLVED">Unresolved</option>
              <option value="RESOLVED">Resolved</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="SILENCED">Silenced</option>
            </select>
          </div>

          {/* Issues Feed Grid */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr 120px 100px 180px 40px', gap: '1rem', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <div></div>
              <div>ISSUE SUMMARY</div>
              <div style={{ textAlign: 'center' }}>EVENTS</div>
              <div>SEVERITY</div>
              <div>LAST SEEN</div>
              <div></div>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlignment: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <RefreshCw size={24} className="animate-spin" />
                <span>Syncing project issues...</span>
              </div>
            ) : issues.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                No errors match selected filters. Active workspace is clean.
              </div>
            ) : (
              issues.map((issue) => (
                <Link 
                  href={`/issues/${issue.id}`} 
                  key={issue.id}
                  style={{ textDecoration: 'none', display: 'block', borderBottom: '1px solid var(--border-color)' }}
                >
                  <div 
                    className="severity-side-border"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '4px 1fr 120px 100px 180px 40px',
                      gap: '1rem',
                      alignItems: 'center',
                      padding: '1.25rem 1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: '4px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Severity Border indicator */}
                    <div className={`severity-${issue.severity.toLowerCase()}`} style={{ height: '40px', borderRadius: '4px' }}></div>
                    
                    {/* Summary */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge badge-${issue.status.toLowerCase()}`}>{issue.status}</span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {issue.title}
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {issue.message}
                      </p>
                    </div>

                    {/* Occurrences count */}
                    <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {issue.occurrences_count}
                    </div>

                    {/* Severity label */}
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      <span className={`severity-${issue.severity.toLowerCase()}`} style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {issue.severity}
                      </span>
                    </div>

                    {/* Last seen */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {new Date(issue.last_seen).toLocaleDateString()} {new Date(issue.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Link indicator */}
                    <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'flex-end' }}>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

// Mock Builders
function generateMockIssues(projectId: string, status?: string, severity?: string, search?: string): Issue[] {
  let list: Issue[] = [
    {
      id: 'issue-1',
      project_id: projectId,
      title: 'TypeError: Cannot read property "map" of undefined',
      message: 'at fetchDashboardTimeline (metrics.ts:42:15)\nat async loadAnalytics (metrics.ts:18:24)',
      status: 'UNRESOLVED',
      severity: 'HIGH',
      occurrences_count: 320,
      last_seen: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
      id: 'issue-2',
      project_id: projectId,
      title: 'DatabaseConnectionError: pool limit exceeded',
      message: 'Connection pool "fixit_metadata" exhausted. 100 active clients.',
      status: 'UNRESOLVED',
      severity: 'CRITICAL',
      occurrences_count: 55,
      last_seen: new Date(Date.now() - 12 * 60000).toISOString()
    },
    {
      id: 'issue-3',
      project_id: projectId,
      title: 'NetworkError: Failed to fetch /api/v1/projects',
      message: 'CORS policy preflight failed: header "X-Client-Id" not allowed.',
      status: 'RESOLVED',
      severity: 'MEDIUM',
      occurrences_count: 140,
      last_seen: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 'issue-4',
      project_id: projectId,
      title: 'ReferenceError: token is not defined',
      message: 'at processHeader (auth.ts:90:54)',
      status: 'INVESTIGATING',
      severity: 'HIGH',
      occurrences_count: 12,
      last_seen: new Date(Date.now() - 4 * 3600000).toISOString()
    }
  ];

  if (status) list = list.filter(i => i.status === status);
  if (severity) list = list.filter(i => i.severity === severity);
  if (search) list = list.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.message.toLowerCase().includes(search.toLowerCase()));

  return list;
}

function generateMockAnalytics(projectId: string): Analytics {
  return {
    timeline: Array.from({ length: 24 }).map((_, i) => ({
      time: new Date(Date.now() - (24 - i) * 60 * 60 * 1000).toISOString(),
      count: Math.floor(Math.random() * 45) + 3,
    })),
    browsers: [
      { browser: 'Chrome', count: 420 },
      { browser: 'Firefox', count: 180 },
      { browser: 'Safari', count: 90 },
      { browser: 'Edge', count: 42 },
    ],
    os: [
      { os: 'macOS', count: 350 },
      { os: 'Windows', count: 280 },
      { os: 'Linux', count: 98 },
      { os: 'Android', count: 22 },
    ]
  };
}
