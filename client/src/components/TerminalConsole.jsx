import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Sparkles, X, ChevronRight } from 'lucide-react';

const SUGGESTIONS = [
  {
    label: "React Hook Error",
    text: "Error: Rendered fewer hooks than expected. This may be caused by a React Hook being called conditionally."
  },
  {
    label: "Java NPE",
    text: "java.lang.NullPointerException: Cannot invoke \"com.example.User.getEmail()\" because the return value of \"getUser()\" is null"
  },
  {
    label: "Python KeyError",
    text: "Traceback (most recent call last):\n  File \"app.py\", line 12, in process_request\n    username = data['username']\nKeyError: 'username'"
  },
  {
    label: "JS TypeError",
    text: "TypeError: Cannot read properties of undefined (reading 'details')\n    at renderUser (Profile.js:25:21)\n    at UserProfile (Profile.js:42:5)"
  }
];

export default function TerminalConsole({ onDiagnose, isScanning, onReset, showResults }) {
  const [errorText, setErrorText] = useState('');
  const [scanLogs, setScanLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);
  const logTerminalEndRef = useRef(null);

  const logsList = [
    "[SYSTEM] Initiating core diagnostic matrices...",
    "[SYSTEM] Reading input streams...",
    "[SCANNER] Tokenizing characters and parsing traceback tree...",
    "[SCANNER] Running code pattern match regex...",
    "[AI-ENGINE] Correlating exceptions to known library signatures...",
    "[AI-ENGINE] Computing confidence vector mappings...",
    "[DATABASE] Storing telemetry data...",
    "[AI-ENGINE] Compiling fix recommendations...",
    "[SYSTEM] Diagnostic report generated!"
  ];

  // Auto-scroll scanning logs
  useEffect(() => {
    if (logTerminalEndRef.current) {
      logTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scanLogs]);

  // Handle scanning simulation logs
  useEffect(() => {
    let timer;
    if (isScanning && logIndex < logsList.length) {
      timer = setTimeout(() => {
        setScanLogs((prev) => [...prev, logsList[logIndex]]);
        setLogIndex((prev) => prev + 1);
      }, 350 + Math.random() * 200); // realistic variance
    } else if (!isScanning) {
      setScanLogs([]);
      setLogIndex(0);
    }
    return () => clearTimeout(timer);
  }, [isScanning, logIndex]);

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!errorText.trim()) return;
    onDiagnose(errorText);
  };

  const handleSuggestionClick = (text) => {
    setErrorText(text);
  };

  return (
    <div className={`w-full max-w-3xl transition-all duration-700 transform ${showResults ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
      <div className="glass-panel rounded-xl overflow-hidden scanline-effect border-purple-500/20 shadow-purple-900/10">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-rose-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-emerald-500/50" />
            <span className="ml-2 text-xs font-mono text-gray-400 select-none">fixit-terminal@v1.0.0</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-400">
            <Terminal size={14} className="animate-pulse" />
            <span className="neon-text-purple">QUANTUM-SCANNING</span>
          </div>
        </div>

        {/* Terminal Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1.5"><ChevronRight size={14} className="text-purple-400" /> paste_error_trace_here</span>
              {errorText && (
                <button
                  type="button"
                  onClick={() => setErrorText('')}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            
            <div className="relative">
              <textarea
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
                disabled={isScanning}
                placeholder="Paste code crash logs, stack traces, compiler errors, or type assertions here... e.g. TypeError: Cannot read properties of undefined..."
                className="w-full h-44 bg-black/40 text-green-400 border border-white/10 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-gray-600 resize-none leading-relaxed"
              />
              {!errorText && (
                <div className="absolute top-3 right-3 text-purple-500/40 pointer-events-none animate-pulse">
                  <Cpu size={24} />
                </div>
              )}
            </div>
          </div>

          {/* Quick presets / suggestions */}
          {!isScanning && !showResults && (
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-gray-500">Quick Test Templates:</div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(preset.text)}
                    className="text-xs px-2.5 py-1.5 rounded bg-white/5 border border-white/5 hover:bg-purple-950/20 hover:border-purple-500/30 text-gray-300 hover:text-purple-300 transition-all font-mono"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <div>
              {showResults && (
                <button
                  type="button"
                  onClick={onReset}
                  className="px-4 py-2 text-xs font-mono text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-md transition-all"
                >
                  &lt; RESET TERMINAL
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isScanning || !errorText.trim()}
              className={`px-5 py-2.5 text-xs font-mono font-semibold rounded-md flex items-center gap-2 transition-all ${
                isScanning
                  ? 'bg-purple-950/20 text-purple-400 border border-purple-500/30 cursor-not-allowed'
                  : !errorText.trim()
                  ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)] cursor-pointer active:scale-95'
              }`}
            >
              <Sparkles size={14} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'DIAGNOSING STACK TRACE...' : 'DIAGNOSE ERROR'}
            </button>
          </div>
        </form>

        {/* Scan Log Terminal Output */}
        {isScanning && (
          <div className="bg-black/80 border-t border-white/5 p-4 font-mono text-xs text-purple-300 space-y-1.5 max-h-40 overflow-y-auto leading-relaxed">
            {scanLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                <span className={idx === scanLogs.length - 1 ? 'text-white font-bold animate-pulse' : ''}>{log}</span>
              </div>
            ))}
            <div ref={logTerminalEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
