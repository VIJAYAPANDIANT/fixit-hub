import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { issueService } from '../services/api';
import { 
  BarChart, CheckCircle, AlertOctagon, 
  Activity, Eye, ShieldAlert, Zap
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [projectId, setProjectId] = useState(() => localStorage.getItem('activeProjectId') || '');

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

  const totalErrors = issues.length;
  const resolvedErrors = issues.filter(i => i.status === 'RESOLVED').length;
  const inProgressErrors = issues.filter(i => i.status === 'IN_PROGRESS').length;
  const unresolvedErrors = issues.filter(i => i.status === 'UNRESOLVED').length;
  
  const criticalErrors = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
  const totalViews = issues.reduce((acc, curr) => acc + curr.views, 0);
  const totalEvents = issues.reduce((acc, curr) => acc + curr.occurrencesCount, 0);

  const resolutionRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;

  const stats = [
    { label: 'Total Ingested Errors', value: totalErrors, icon: BarChart, color: 'text-brand-500 bg-brand-500/10' },
    { label: 'Resolution Rate', value: `${resolutionRate.toFixed(0)}%`, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Active In-Progress', value: inProgressErrors, icon: Zap, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Unresolved / Backlog', value: unresolvedErrors, icon: AlertOctagon, color: 'text-rose-500 bg-rose-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diagnostics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Real-time metrics, system health analytics, and resolution rates
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : totalErrors === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl border border-slate-200 dark:border-dark-800">
          <Activity className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-lg">No metrics available</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Metrics will appear as exceptions are ingested into this project.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-dark-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-extrabold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-slate-400" />
                <span>Priority Exceptions Breakdown</span>
              </h3>
              
              <div className="space-y-3">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => {
                  const count = issues.filter(i => i.severity === sev).length;
                  const pct = totalErrors > 0 ? (count / totalErrors) * 100 : 0;
                  
                  let barColor = 'bg-slate-400';
                  if (sev === 'CRITICAL') barColor = 'bg-red-500';
                  if (sev === 'HIGH') barColor = 'bg-orange-500';
                  if (sev === 'MEDIUM') barColor = 'bg-yellow-500';
                  if (sev === 'LOW') barColor = 'bg-green-500';

                  return (
                    <div key={sev} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{sev}</span>
                        <span>{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-400" />
                <span>Activity Summary</span>
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-dark-800">
                  <span className="text-sm font-semibold text-slate-500">Total Views Count</span>
                  <div className="flex items-center gap-1 font-bold">
                    <Eye className="h-4 w-4 text-slate-400" />
                    <span>{totalViews}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-dark-800">
                  <span className="text-sm font-semibold text-slate-500">Logs Processed</span>
                  <span className="font-bold">{totalEvents}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-slate-500">Critical Backlog</span>
                  <span className="text-red-500 font-bold">{criticalErrors}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
