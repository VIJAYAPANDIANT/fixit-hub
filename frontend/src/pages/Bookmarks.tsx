import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { issueService, bookmarkService } from '../services/api';
import { Bookmark as BookmarkIcon, ArrowRight } from 'lucide-react';

export const Bookmarks: React.FC = () => {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState(() => localStorage.getItem('activeProjectId') || '');
  const { data: bookmarkedIds = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkService.listIds,
  });

  useEffect(() => {
    const handleProjectChanged = () => {
      setProjectId(localStorage.getItem('activeProjectId') || '');
    };
    window.addEventListener('projectChanged', handleProjectChanged);
    return () => window.removeEventListener('projectChanged', handleProjectChanged);
  }, []);

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => issueService.list(projectId, {}),
    enabled: !!projectId,
  });

  const bookmarkedIssues = issues.filter(issue => bookmarkedIds.includes(issue.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookmarked Errors</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Quick access to bookmarked codebases crashes and priority investigations
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : bookmarkedIssues.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl border border-slate-200 dark:border-dark-800">
          <BookmarkIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-lg">No bookmarked issues</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bookmark items from the issue details screen to display them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarkedIssues.map((issue) => (
            <div 
              key={issue.id}
              onClick={() => navigate(`/errors/${issue.id}`)}
              className="glass-panel-interactive p-5 rounded-2xl border border-slate-200 dark:border-dark-800 cursor-pointer flex justify-between items-center"
            >
              <div>
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-850 dark:bg-red-950/30 dark:text-red-400 rounded-md font-bold uppercase">
                  {issue.severity}
                </span>
                <h3 className="font-bold text-lg mt-1">{issue.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{issue.message}</p>
              </div>
              <button className="p-2 rounded-lg bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
