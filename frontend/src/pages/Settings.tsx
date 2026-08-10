import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookService } from '../services/api';
import { 
  Sun, Moon, Info, Plus, Trash2, Play, CheckCircle2, 
  AlertCircle, ShieldAlert, Check, X, BellRing, Settings as SettingsIcon 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const queryClient = useQueryClient();

  // Active Project State
  const [projectId, setProjectId] = useState(() => localStorage.getItem('activeProjectId') || '');
  
  // New Webhook Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('SLACK');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Track testing status per webhook ID
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  useEffect(() => {
    const handleProjectChanged = () => {
      setProjectId(localStorage.getItem('activeProjectId') || '');
    };
    window.addEventListener('projectChanged', handleProjectChanged);
    return () => window.removeEventListener('projectChanged', handleProjectChanged);
  }, []);

  // Fetch Webhooks
  const { data: webhooks = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['webhooks', projectId],
    queryFn: () => webhookService.list(projectId),
    enabled: !!projectId,
  });

  // Create Webhook Mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; url: string; type: string }) => 
      webhookService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', projectId] });
      setName('');
      setUrl('');
      setType('SLACK');
      setShowAddForm(false);
      triggerSuccess('Webhook added successfully!');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.message || 'Failed to add webhook.');
    }
  });

  // Toggle Webhook Mutation
  const toggleMutation = useMutation({
    mutationFn: (webhook: any) => 
      webhookService.update(projectId, webhook.id, {
        name: webhook.name,
        url: webhook.url,
        type: webhook.type,
        active: !webhook.active
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', projectId] });
      triggerSuccess('Webhook configuration updated.');
    }
  });

  // Delete Webhook Mutation
  const deleteMutation = useMutation({
    mutationFn: (webhookId: string) => webhookService.delete(projectId, webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', projectId] });
      triggerSuccess('Webhook deleted successfully.');
    }
  });

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !url.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setFormError('Webhook URL must start with http:// or https://');
      return;
    }
    createMutation.mutate({ name, url, type });
  };

  const handleToggleActive = (webhook: any) => {
    toggleMutation.mutate(webhook);
  };

  const handleDeleteWebhook = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the webhook "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestingWebhookId(id);
    setTestResult(null);
    try {
      await webhookService.test(projectId, id);
      setTestResult({ id, success: true, msg: 'Test payload received successfully! 🎉' });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to send test payload.';
      setTestResult({ id, success: false, msg: errMsg });
    } finally {
      setTestingWebhookId(null);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const maskUrl = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname;
      const path = parsed.pathname;
      if (path.length > 15) {
        return `https://${host}${path.substring(0, 8)}...${path.substring(path.length - 8)}`;
      }
      return urlStr;
    } catch {
      return urlStr.length > 30 ? `${urlStr.substring(0, 27)}...` : urlStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Configure application interface modes and configure alerts delivery targets
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interface Settings */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-6">
        <h3 className="font-bold text-base flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-brand-500" />
          <span>Interface Settings</span>
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Interface Mode</h4>
            <p className="text-xs text-slate-500">Switch between light and dark themes</p>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-800 transition text-sm font-semibold cursor-pointer"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-dark-800 pt-4 flex gap-3 text-xs text-slate-400">
          <Info className="h-5 w-5 text-brand-500 shrink-0" />
          <span>FixIt Hub dynamically caches logs locally and synchronizes status triages in real time.</span>
        </div>
      </div>

      {/* Webhook Notifications Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base flex items-center gap-2">
              <BellRing className="h-5 w-5 text-brand-500" />
              <span>Real-Time Webhook Alert Channels</span>
            </h3>
            <p className="text-xs text-slate-500">
              Deliver alerts instantly to Slack or Discord channels when new exceptions or crashes occur.
            </p>
          </div>
          {projectId && (
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormError('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition cursor-pointer"
            >
              {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{showAddForm ? 'Cancel' : 'Add Webhook'}</span>
            </button>
          )}
        </div>

        {!projectId ? (
          <div className="p-6 text-center text-slate-400 text-sm">
            <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-slate-350" />
            <span>Select a project workspace in the navigation bar to configure webhooks.</span>
          </div>
        ) : (
          <>
            {/* Create Webhook Form */}
            {showAddForm && (
              <form onSubmit={handleAddWebhook} className="p-5 border border-slate-100 dark:border-dark-800/80 bg-slate-50/50 dark:bg-dark-900/40 rounded-2xl space-y-4 animate-slideDown">
                <h4 className="text-sm font-bold">New Webhook Alert Channel</h4>
                
                {formError && (
                  <div className="p-3 bg-rose-50/50 border border-rose-500/25 text-rose-500 dark:bg-rose-950/15 text-xs font-semibold rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label htmlFor="webhook-name" className="text-[10px] font-bold text-slate-400 block mb-1">CHANNEL NAME</label>
                    <input
                      id="webhook-name"
                      type="text"
                      placeholder="e.g. #ops-alerts"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full text-sm px-3 py-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="webhook-type" className="text-[10px] font-bold text-slate-400 block mb-1">TARGET TYPE</label>
                    <select
                      id="webhook-type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                    >
                      <option value="SLACK">Slack Webhook</option>
                      <option value="DISCORD">Discord Webhook</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label htmlFor="webhook-url" className="text-[10px] font-bold text-slate-400 block mb-1">INCOMING WEBHOOK URL</label>
                    <input
                      id="webhook-url"
                      type="url"
                      placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                      className="w-full text-sm px-3 py-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Register Webhook'}
                  </button>
                </div>
              </form>
            )}

            {/* Webhooks Roster */}
            {isLoading ? (
              <p className="text-center py-4 text-slate-400 text-xs">Loading webhook configurations...</p>
            ) : fetchError ? (
              <p className="text-center py-4 text-rose-500 text-xs font-semibold">Failed to fetch webhooks list from backend.</p>
            ) : webhooks.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-200 dark:border-dark-800 rounded-2xl text-center text-slate-400 text-xs">
                No webhooks configured for this project. Register Slack/Discord above to receive real-time updates.
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((wh: any) => (
                  <div key={wh.id} className="p-4 rounded-xl border border-slate-200 dark:border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 dark:bg-dark-900/10">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{wh.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider ${
                          wh.type === 'SLACK' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
                        }`}>
                          {wh.type}
                        </span>
                        {!wh.active && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-dark-800 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-450 dark:text-slate-400 truncate" title={wh.url}>
                        {maskUrl(wh.url)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
                      {/* Active Status Switch */}
                      <button
                        onClick={() => handleToggleActive(wh)}
                        disabled={toggleMutation.isPending}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          wh.active ? 'bg-brand-500' : 'bg-slate-350 dark:bg-dark-750'
                        }`}
                        title={wh.active ? 'Disable alert delivery' : 'Enable alert delivery'}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          wh.active ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>

                      {/* Test Connection Button */}
                      <button
                        onClick={() => handleTestWebhook(wh.id)}
                        disabled={testingWebhookId === wh.id}
                        className="p-1.5 rounded-lg border border-slate-250 dark:border-dark-750 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-500 transition cursor-pointer"
                        title="Send test ping payload"
                      >
                        {testingWebhookId === wh.id ? (
                          <div className="h-4.5 w-4.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="h-4.5 w-4.5" />
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteWebhook(wh.id, wh.name)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg border border-red-200/50 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition cursor-pointer"
                        title="Delete Webhook"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Test result message display */}
                    {testResult && testResult.id === wh.id && (
                      <div className={`w-full mt-2 p-2.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 animate-fadeIn ${
                        testResult.success 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-rose-50 border-rose-250 text-rose-600 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-400'
                      }`}>
                        {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <span>{testResult.msg}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
