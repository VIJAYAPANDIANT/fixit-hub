import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { issueService, taxonomyService } from '../services/api';
import { IssueStatus, IssueSeverity, IssueDifficulty } from '../types';
import { Search as SearchIcon, Info, HelpCircle, ArrowRight, CornerDownRight } from 'lucide-react';

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState(() => localStorage.getItem('activeProjectId') || '');

  useEffect(() => {
    const handleProjectChanged = () => {
      setProjectId(localStorage.getItem('activeProjectId') || '');
    };
    window.addEventListener('projectChanged', handleProjectChanged);
    return () => window.removeEventListener('projectChanged', handleProjectChanged);
  }, []);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<IssueStatus | ''>('');
  const [severity, setSeverity] = useState<IssueSeverity | ''>('');
  const [difficulty, setDifficulty] = useState<IssueDifficulty | ''>('');
  const [languageId, setLanguageId] = useState('');
  const [frameworkId, setFrameworkId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');

  const { data: languages = [] } = useQuery({ queryKey: ['languages'], queryFn: taxonomyService.getLanguages });
  const { data: frameworks = [] } = useQuery({ queryKey: ['frameworks'], queryFn: taxonomyService.getFrameworks });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: taxonomyService.getCategories });
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: taxonomyService.getTags });

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search', projectId, query, status, severity, difficulty, languageId, frameworkId, categoryId, selectedTags, sortBy],
    queryFn: () => issueService.search(projectId, query, {
      status, severity, difficulty, languageId, frameworkId, categoryId, tagIds: selectedTags, sortBy
    }),
    enabled: !!projectId,
  });

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const issues = searchResults?.issues || [];
  const suggestions = searchResults?.suggestions || [];
  const autocomplete = searchResults?.autocomplete || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Elasticsearch Engine</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Perform keyword searches, typo corrections, and custom relevance boosting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-500 tracking-wider">TAXONOMY FILTERS</h3>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">LANGUAGE</label>
              <select 
                value={languageId} 
                onChange={(e) => setLanguageId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                <option value="">All Languages</option>
                {languages.map(l => <option key={l.id} value={l.slug}>{l.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">FRAMEWORK</label>
              <select 
                value={frameworkId} 
                onChange={(e) => setFrameworkId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                <option value="">All Frameworks</option>
                {frameworks.map(f => <option key={f.id} value={f.slug}>{f.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">CATEGORY</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-dark-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">STATUS</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full text-sm px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-dark-800">
                  <option value="">All Statuses</option>
                  <option value="UNRESOLVED">UNRESOLVED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">SEVERITY</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="w-full text-sm px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-dark-800">
                  <option value="">All Severities</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-dark-800">
              <label className="text-xs font-bold text-slate-400 block mb-2">TAGS</label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {tags.map(t => {
                  const selected = selectedTags.includes(t.slug);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTagToggle(t.slug)}
                      className={`text-xs px-2 py-1 rounded-md font-semibold transition border ${
                        selected 
                          ? 'bg-brand-500 text-white border-brand-600' 
                          : 'bg-slate-100 dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-dark-800 flex items-center gap-3">
            <SearchIcon className="h-5 w-5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by title, message, description, stacktrace..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-base bg-transparent border-none focus:outline-none placeholder-slate-400"
            />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold bg-slate-100 dark:bg-dark-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-700 cursor-pointer"
            >
              <option value="relevance">Relevance Score</option>
              <option value="popularity">Popularity Sort</option>
              <option value="views">Views Count</option>
              <option value="newest">Chronological</option>
            </select>
          </div>

          {suggestions.length > 0 && (
            <div className="bg-brand-500/10 border border-brand-500/20 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <span className="font-medium text-slate-600 dark:text-slate-300">Did you mean?</span>
              <div className="flex gap-2">
                {suggestions.map((sug, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setQuery(sug)}
                    className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && autocomplete.length > 0 && (
            <div className="bg-slate-100/50 dark:bg-dark-900/50 p-4 rounded-xl border border-slate-200 dark:border-dark-800 space-y-2">
              <p className="text-xs font-bold text-slate-400">AUTOCOMPLETE MATCHES</p>
              <div className="space-y-1">
                {autocomplete.slice(0, 3).map((title, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setQuery(title)}
                    className="w-full text-left text-sm flex items-center gap-2 hover:text-brand-500 transition"
                  >
                    <CornerDownRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-50/50 dark:bg-red-950/10 text-red-500 text-sm">
              Failed to query Elasticsearch. Check backend server.
            </div>
          ) : issues.length === 0 ? (
            <div className="glass-panel p-16 text-center rounded-2xl border border-slate-200 dark:border-dark-800">
              <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg">No search results</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Verify search keyword, index documents, or select alternative taxonomy filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div 
                  key={issue.id}
                  onClick={() => navigate(`/errors/${issue.id}`)}
                  className="glass-panel-interactive p-5 rounded-2xl border border-slate-200 dark:border-dark-800 cursor-pointer flex flex-col sm:flex-row justify-between items-start gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 rounded-md font-bold uppercase">
                        {issue.severity}
                      </span>
                      {issue.languageName && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-dark-800 rounded text-slate-500">
                          {issue.languageName}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg truncate">{issue.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{issue.message}</p>
                    <div className="flex gap-1.5 flex-wrap pt-2">
                      {issue.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-dark-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="self-end sm:self-center p-2 rounded-lg bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
