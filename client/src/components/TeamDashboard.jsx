import React, { useState, useEffect } from 'react';
import { Search, Clock, Cpu, BarChart2, ShieldAlert, Key, RefreshCw, Layers } from 'lucide-react';

const MOCK_TEAM_LOGS = [
  { id: '1', error: 'java.lang.NullPointerException: Cannot invoke payment method', lang: 'Java', time: '10 mins ago', status: 'Resolved' },
  { id: '2', error: 'TypeError: Cannot read properties of undefined (reading "auth")', lang: 'JavaScript', time: '1 hour ago', status: 'Resolved' },
  { id: '3', error: 'KeyError: "client_session_token" in auth callback', lang: 'Python', time: '3 hours ago', status: 'Pending' },
  { id: '4', error: 'ConnectionError: PostgreSQL pool saturation on port 5432', lang: 'Database', time: '1 day ago', status: 'Resolved' },
  { id: '5', error: 'ReferenceError: regeneratorRuntime is not defined', lang: 'JavaScript', time: '2 days ago', status: 'Resolved' },
];

export default function TeamDashboard() {
  const [search, setSearch] = useState('');
  const [timeSaved, setTimeSaved] = useState(41.68);
  const [apiKey, setApiKey] = useState('alpha_secure_api_key_2026');
  const [copiedKey, setCopiedKey] = useState(false);

  // Ticking time-saved gamification counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSaved((prev) => prev + 0.0003); // tick up incrementally
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const filteredLogs = MOCK_TEAM_LOGS.filter(log => 
    log.error.toLowerCase().includes(search.toLowerCase()) || 
    log.lang.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl space-y-8 select-none px-4 sm:px-6 pb-20 animate-fadeIn">
      
      {/* Dashboard Header */}
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-mono font-extrabold tracking-wider bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent uppercase">
          Team Analytics & Telemetry
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Plan Level: Enterprise Pro • CI/CD Active Nodes
        </p>
      </div>

      {/* Analytics stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Metric 1: Time Saved */}
        <div className="glass-panel p-6 rounded-xl border-purple-500/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-3xs font-mono text-purple-400 uppercase tracking-widest">Time Saved</span>
            <div className="text-2xl font-mono font-extrabold text-white">
              {timeSaved.toFixed(4)} <span className="text-xs text-purple-300 font-bold">hrs</span>
            </div>
            <p className="text-4xs font-sans text-gray-500">Gamified telemetry +2.1 seconds saved every solve</p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400">
            <Clock size={20} className="animate-spin-slow" />
          </div>
        </div>

        {/* Metric 2: Resolution rate */}
        <div className="glass-panel p-6 rounded-xl border-cyan-500/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-3xs font-mono text-cyan-400 uppercase tracking-widest">System Health</span>
            <div className="text-2xl font-mono font-extrabold text-white">
              94.2 <span className="text-xs text-cyan-300 font-bold">%</span>
            </div>
            <p className="text-4xs font-sans text-gray-500">205 solved / 218 total exceptions logged</p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-cyan-400">
            <Cpu size={20} />
          </div>
        </div>

        {/* Metric 3: Active Members */}
        <div className="glass-panel p-6 rounded-xl border-emerald-500/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-3xs font-mono text-emerald-400 uppercase tracking-widest">Team Nodes</span>
            <div className="text-2xl font-mono font-extrabold text-white">
              12 <span className="text-xs text-emerald-300 font-bold">online</span>
            </div>
            <p className="text-4xs font-sans text-gray-500">Authorized active CI/CD pipelines</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400">
            <Layers size={20} />
          </div>
        </div>

      </div>

      {/* SVG Charts Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Language distribution bar chart */}
        <div className="glass-panel p-5 rounded-xl border-white/5 space-y-4">
          <h2 className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase">
            <BarChart2 size={14} className="text-purple-400" /> Language Distribution Chart
          </h2>
          
          <div className="space-y-3 font-mono text-2xs pt-2">
            {/* Java bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>Java (Spring Boot)</span>
                <span>42%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            {/* JS bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>JavaScript / TypeScript (React / Node)</span>
                <span>35%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>

            {/* Python bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>Python (Django / Flask)</span>
                <span>15%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            {/* Database bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>Database / System Configs</span>
                <span>8%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>

          </div>
        </div>

        {/* CI/CD API Key configuration */}
        <div className="glass-panel p-5 rounded-xl border-white/5 space-y-4">
          <h2 className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase">
            <Key size={14} className="text-cyan-400" /> CI/CD pipeline integration credentials
          </h2>
          
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Diagnose failed build scripts automatically inside your GitHub Actions, GitLab CI, or Jenkins scripts using your webhook key.
          </p>

          <div className="bg-black/60 border border-white/10 rounded-lg p-3 flex items-center justify-between font-mono text-2xs">
            <span className="text-cyan-400 font-bold select-text">{apiKey}</span>
            <button 
              onClick={handleCopyKey}
              className="text-purple-400 hover:text-purple-300 py-1.5 px-3 bg-white/5 border border-white/5 hover:border-purple-500/20 rounded cursor-pointer transition-all flex items-center gap-1 active:scale-95"
            >
              {copiedKey ? (
                <>
                  <Check size={11} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <span>Copy Key</span>
              )}
            </button>
          </div>
          
          <div className="text-4xs text-gray-500 font-mono flex items-center gap-1.5">
            <ShieldAlert size={10} className="text-amber-500 animate-pulse" />
            <span>KEEP SECURE. PRIVATE CREDENTIAL KEY ENCRYPTED AT REST.</span>
          </div>
        </div>

      </div>

      {/* Private logs table */}
      <div className="glass-panel rounded-xl overflow-hidden border-white/5 space-y-4 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Private organization error registry
          </h2>
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search private exception tags..."
              className="w-full bg-black/40 text-xs border border-white/10 rounded px-2.5 py-1.5 pl-8 focus:outline-none focus:border-purple-500/50 text-gray-200"
            />
            <Search className="absolute left-2.5 top-2.2 text-gray-600" size={12} />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto w-full pt-1.5">
          <table className="w-full text-left border-collapse font-mono text-2xs leading-relaxed">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="pb-2.5 font-bold">Error Exception Logs</th>
                <th className="pb-2.5 font-bold">Platform</th>
                <th className="pb-2.5 font-bold">Timestamp</th>
                <th className="pb-2.5 font-bold text-right">State</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="py-3 text-white font-bold select-text">{log.error}</td>
                  <td className="py-3 text-cyan-400">{log.lang}</td>
                  <td className="py-3 text-gray-500">{log.time}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-4xs font-bold ${
                      log.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-gray-600">No matching private logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* CSS Spin slow */}
      <style>{`
        .animate-spin-slow {
          animation: spin 5s linear infinite;
        }
      `}</style>

    </div>
  );
}
