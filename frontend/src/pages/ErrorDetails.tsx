import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService, bookmarkService } from '../services/api';
import { IssueStatus, IssueSeverity, Comment } from '../types';
import { CodeBlock } from '../components/CodeBlock';
import { 
  ArrowLeft, Brain, Calendar, Eye, Activity, User, BookOpen, 
  MessageSquare, History, AlertTriangle, Sparkles, Bookmark, 
  Send, ArrowUpRight
} from 'lucide-react';

export const ErrorDetails: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [commentInput, setCommentInput] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'solutions' | 'logs' | 'comments'>('diagnostics');

  const { data: bookmarkedIds = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkService.listIds,
  });

  const isBookmarked = bookmarkedIds.includes(id);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await bookmarkService.unbookmark(id);
      } else {
        await bookmarkService.bookmark(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    }
  });

  const toggleBookmark = () => {
    bookmarkMutation.mutate();
  };

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => issueService.get(id),
    enabled: !!id,
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => issueService.getComments(id),
    enabled: !!id,
  });

  const { data: eventLogs = [] } = useQuery({
    queryKey: ['events', id],
    queryFn: () => issueService.getEvents(id),
    enabled: !!id,
  });

  const { data: scrapedFixes = [] } = useQuery({
    queryKey: ['scrapedFixes', id],
    queryFn: () => issueService.getScrapedFixes(id),
    enabled: !!id,
  });

  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (issue?.aiAnalysis) {
      try {
        setAiResponse(JSON.parse(issue.aiAnalysis));
      } catch (err) {
        // ignore
      }
    }
  }, [issue]);

  const updateStatusMutation = useMutation({
    mutationFn: (status: IssueStatus) => issueService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => issueService.addComment(id, content),
    onSuccess: () => {
      setCommentInput('');
      refetchComments();
    }
  });

  const handleRequestAI = async () => {
    setAiLoading(true);
    setAiError('');
    setAiResponse(null);
    try {
      const response = await issueService.getAIDiagnosis(id, aiContext);
      setAiResponse(response);
    } catch (err: any) {
      setAiError(err.response?.data?.message || err.message || "Failed to generate diagnostics.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentInput.trim()) {
      addCommentMutation.mutate(commentInput);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="p-4 rounded-xl border border-red-500/30 bg-red-50/50 dark:bg-red-950/10 text-red-500 text-sm">
        Issue details failed to load. Return to the list.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleBookmark}
            className={`p-2.5 rounded-xl border transition ${
              isBookmarked 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-800'
            }`}
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>

          <select 
            value={issue.status} 
            onChange={(e) => updateStatusMutation.mutate(e.target.value as IssueStatus)}
            className="text-sm font-bold bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="UNRESOLVED">UNRESOLVED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">
            {issue.severity}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 dark:bg-dark-800 dark:text-slate-300">
            {issue.difficulty}
          </span>
          {issue.languageName && (
            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-dark-800 text-slate-600 rounded">
              {issue.languageName}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{issue.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-mono text-sm break-all bg-slate-100 dark:bg-dark-950 p-3 rounded-lg border border-slate-200 dark:border-dark-900">
            {issue.message}
          </p>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-200 dark:border-dark-800 text-xs text-slate-400 font-semibold">
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            <span>{issue.occurrencesCount} Occurrences</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span>{issue.views} Views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>First seen {new Date(issue.firstSeen).toLocaleString()}</span>
          </div>
          {issue.assignedToName && (
            <div className="flex items-center gap-1.5 text-brand-500 font-bold">
              <User className="h-4 w-4" />
              <span>Assigned: {issue.assignedToName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-dark-800">
        {[
          { id: 'diagnostics', label: 'AI Diagnostic', icon: Brain },
          { id: 'solutions', label: 'Scraped Solutions', icon: BookOpen },
          { id: 'logs', label: 'Events timeline', icon: History },
          { id: 'comments', label: 'Triage Chat', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
                active 
                  ? 'border-brand-500 text-brand-500' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            {!aiResponse && !aiLoading && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-brand-500 animate-pulse" />
                  <h3 className="font-bold text-lg">AI Resolution Assistance</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Generate structured debugging explanations, root causes, steps to fix, and corrected code snippets.
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">ADDITIONAL DEBUGGING CONTEXT (OPTIONAL)</label>
                  <textarea 
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="Describe environmental variables, parameters causing failure, user context, etc."
                    className="w-full text-sm p-3 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition h-20 resize-none"
                  />
                </div>

                <button 
                  onClick={handleRequestAI}
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
                >
                  <Brain className="h-4 w-4" />
                  <span>Diagnose with Gemini</span>
                </button>
              </div>
            )}

            {aiLoading && (
              <div className="glass-panel p-8 text-center rounded-2xl border border-slate-200 dark:border-dark-800">
                <Brain className="h-10 w-10 text-brand-500 animate-bounce mx-auto mb-3" />
                <h3 className="font-bold text-lg">AI Analysis In Progress</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Analyzing runtime frameworks, stacktraces, and coding standards...
                </p>
              </div>
            )}

            {aiError && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400 text-sm flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <h4 className="font-bold">AI Diagnostics Bypassed</h4>
                  <p className="mt-1">{aiError}</p>
                </div>
              </div>
            )}

            {aiResponse && (
              <div className="space-y-6">
                <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-brand-500" />
                    <div>
                      <h4 className="font-bold text-sm">{aiResponse.title}</h4>
                      <p className="text-xs text-slate-400">Model Name: {issue.frameworkSlug || 'Gemini 1.5 Beta'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">CONFIDENCE</span>
                    <p className="text-lg font-extrabold text-accent-500">{(aiResponse.confidenceScore * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-2">
                      <h4 className="font-bold text-sm text-slate-400">ERROR EXPLANATION</h4>
                      <p className="text-sm leading-relaxed">{aiResponse.explanation}</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-2">
                      <h4 className="font-bold text-sm text-slate-400">ROOT CAUSE HYPOTHESIS</h4>
                      <p className="text-sm leading-relaxed font-medium">{aiResponse.rootCause}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-2">
                      <h4 className="font-bold text-sm text-slate-400">RESOLUTION PROCESS</h4>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{aiResponse.fixSteps}</div>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-2">
                      <h4 className="font-bold text-sm text-slate-400">PREVENTATIVE BEST PRACTICES</h4>
                      <p className="text-sm leading-relaxed">{aiResponse.bestPractices}</p>
                    </div>
                  </div>
                </div>

                {aiResponse.improvedCode && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-slate-400 pl-1">IMPROVED CODE SNIPPET</h4>
                    <CodeBlock code={aiResponse.improvedCode} language={issue.languageSlug || 'javascript'} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="space-y-4">
            {scrapedFixes.length === 0 ? (
              <div className="glass-panel p-10 text-center rounded-2xl border border-slate-200 dark:border-dark-800">
                <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <h3 className="font-bold">No scraped solutions yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verified answers will be scraped from Stack Overflow, GitHub, and doc portals on schedule.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {scrapedFixes.map((fix) => (
                  <div key={fix.id} className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-850 pb-2">
                      <div>
                        <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">{fix.sourceName}</span>
                        <h4 className="font-bold text-base mt-0.5">{fix.title}</h4>
                      </div>
                      <a 
                        href={fix.sourceUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 rounded-lg text-slate-500 transition"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {fix.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            {eventLogs.length === 0 ? (
              <div className="glass-panel p-10 text-center rounded-2xl border border-slate-200 dark:border-dark-800">
                <History className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <h3 className="font-bold">No log events</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {eventLogs.map((log) => (
                  <div key={log.id} className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                      <span>Release: {log.release}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-bold">{log.exceptionType}: {log.exceptionMessage}</p>
                    {log.stacktrace && (
                      <pre className="text-xs bg-slate-100 dark:bg-dark-900/60 p-3 rounded-lg overflow-x-auto text-rose-600 dark:text-rose-400 font-mono">
                        {log.stacktrace.slice(0, 300)}...
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-slate-200 dark:border-dark-800 text-slate-400 text-sm">
                No discussion comments yet. Be the first to start the triage analysis.
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-dark-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                      <span className="text-brand-500 font-bold">{comment.userName}</span>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-dark-800 flex gap-2">
              <input 
                type="text" 
                placeholder="Post comment to this error context..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="w-full text-sm px-3 bg-slate-100 dark:bg-dark-800 rounded-xl focus:outline-none"
              />
              <button 
                type="submit"
                className="p-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
