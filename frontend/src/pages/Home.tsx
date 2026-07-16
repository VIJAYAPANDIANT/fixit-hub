import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { issueService } from '../services/api';
import { IssueStatus, IssueSeverity, IssueDifficulty } from '../types';
import { Eye, Clock, User as UserIcon, HelpCircle, RefreshCw, Layers } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState(() => localStorage.getItem('activeProjectId') || '');

  useEffect(() => {
    const handleProjectChanged = () => {
      setProjectId(localStorage.getItem('activeProjectId') || '');
    };
    window.addEventListener('projectChanged', handleProjectChanged);
    return () => window.removeEventListener('projectChanged', handleProjectChanged);
  }, []);

  const [status, setStatus] = useState<IssueStatus | ''>('');
  const [severity, setSeverity] = useState<IssueSeverity | ''>('');
  const [difficulty, setDifficulty] = useState<IssueDifficulty | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { data: issues = [], isLoading, error, refetch } = useQuery({
    queryKey: ['issues', projectId, status, severity, difficulty, search, sortBy],
    queryFn: () => issueService.list(projectId, { status, severity, difficulty, search, sortBy }),
    enabled: !!projectId,
  });

  const getSeverityBadgeClass = (sev: IssueSeverity) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200/50';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200/50';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200/50';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-200/50';
    }
  };

  const getStatusBadgeClass = (stat: IssueStatus) => {
    switch (stat) {
      case 'UNRESOLVED': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Issues & Triage</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time ingestion feed and status triages for your applications
          </p>
        </div>
        <button 
          onClick={() => refetch()} 
          className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-800 transition"
        >
          <RefreshCw className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">SEARCH KEYWORD</label>
          <input 
            type="text" 
            placeholder="Type or message..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">STATUS</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value as IssueStatus | '')}
            className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="UNRESOLVED">UNRESOLVED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">SEVERITY</label>
          <select 
            value={severity} 
            onChange={(e) => setSeverity(e.target.value as IssueSeverity | '')}
            className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">DIFFICULTY</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value as IssueDifficulty | '')}
            className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer"
          >
            <option value="">All Difficulties</option>
            <option value="HARD">HARD</option>
            <option value="MODERATE">MODERATE</option>
            <option value="EASY">EASY</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">SORT BY</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="popularity">Occurrences</option>
            <option value="views">Views count</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-50/50 dark:bg-red-950/10 text-red-500 text-sm">
          Failed to load issues list. Verify backend server is alive.
        </div>
      ) : issues.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 dark:border-dark-800">
          <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-lg">No active issues found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Check your query filters, DSN Key configuration, or verify ingest triggers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {issues.map((issue) => (
            <div 
              key={issue.id}
              onClick={() => navigate(`/errors/${issue.id}`)}
              className="glass-panel-interactive p-5 rounded-2xl border border-slate-200 dark:border-dark-800 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityBadgeClass(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClass(issue.status)}`}>
                    {issue.status}
                  </span>
                  {issue.languageName && (
                    <span className="bg-slate-100 dark:bg-dark-800 px-2 py-0.5 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">
                      {issue.languageName}
                    </span>
                  )}
                  {issue.frameworkName && (
                    <span className="bg-slate-100 dark:bg-dark-800 px-2 py-0.5 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300">
                      {issue.frameworkName}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold truncate dark:text-slate-100">{issue.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{issue.message}</p>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold pt-1">
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{issue.occurrencesCount} occurrences</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{issue.views} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last seen {new Date(issue.lastSeen).toLocaleDateString()}</span>
                  </div>
                  {issue.assignedToName && (
                    <div className="flex items-center gap-1 text-brand-500 font-bold">
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>Assigned to {issue.assignedToName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-100 dark:border-dark-800 pt-3 md:pt-0">
                <div className="flex gap-1.5 flex-wrap">
                  {issue.tags?.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="bg-brand-500/10 text-brand-500 dark:bg-brand-500/20 text-xs px-2 py-0.5 rounded-md font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-400">Difficulty: {issue.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
