import React, { useState } from 'react';
import { Sliders, X, Check, Copy, Loader2, Sparkles } from 'lucide-react';

function DiffViewer({ diffText }) {
  if (!diffText) return null;
  const lines = diffText.split('\n');
  
  return (
    <div className="bg-black/80 rounded-lg p-4 font-mono text-2xs border border-white/10 overflow-x-auto select-text leading-relaxed max-w-full">
      {lines.map((line, idx) => {
        let lineClass = 'text-gray-400';
        let bgClass = '';
        if (line.startsWith('+')) {
          lineClass = 'text-emerald-400';
          bgClass = 'bg-emerald-500/10 px-1';
        } else if (line.startsWith('-')) {
          lineClass = 'text-rose-400';
          bgClass = 'bg-rose-500/10 px-1';
        } else if (line.startsWith('@@')) {
          lineClass = 'text-cyan-400 font-bold';
          bgClass = 'bg-cyan-500/5 px-1';
        }
        
        return (
          <div key={idx} className={`whitespace-pre-wrap ${bgClass} ${lineClass}`}>
            {line}
          </div>
        );
      })}
    </div>
  );
}

export default function AITailorPanel({ isOpen, onClose, fix, onTailorFixStream, isTailoring }) {
  const [userCode, setUserCode] = useState('');
  const [tailoredFix, setTailoredFix] = useState(null);
  const [streamLog, setStreamLog] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !fix) return null;

  const handleCopy = () => {
    if (!tailoredFix) return;
    navigator.clipboard.writeText(tailoredFix.code_snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger R3F Typewriter Simulation
  const drawTypewriter = (targetFix) => {
    let currentCode = '';
    const fullCode = targetFix.code_snippet;
    let index = 0;
    
    setStreamLog('Synthesizing highlighted diff...');

    const interval = setInterval(() => {
      if (index >= fullCode.length) {
        clearInterval(interval);
        setTailoredFix(targetFix);
        setStreamLog('');
        return;
      }

      currentCode += fullCode.slice(index, index + 15);
      setTailoredFix({ ...targetFix, code_snippet: currentCode });
      index += 15;
    }, 15);
  };

  const handleTailorSubmit = () => {
    if (!userCode.trim()) return;
    setTailoredFix(null);
    setStreamLog('Connecting to AI Server-Sent Events channel...');

    onTailorFixStream(
      fix.id,
      userCode,
      (partialBuffer) => {
        setStreamLog(`Buffering bytes (${partialBuffer.length} chars)...`);
      },
      (finalPayload) => {
        setStreamLog('Applying code modifications...');
        drawTypewriter(finalPayload);
      }
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-132 bg-slate-950/95 border-l border-white/10 z-50 shadow-2xl flex flex-col transition-all duration-300 animate-slideLeft select-none">
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-2">
          <Sliders className="text-purple-400 animate-pulse" size={16} />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            AI Code Tailor Panel
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6 scrollbar">
        
        {/* Source Fix Information */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-lg space-y-1.5">
          <div className="text-3xs font-mono text-purple-400 uppercase tracking-widest">Targeting Patch</div>
          <div className="text-sm font-bold text-white leading-snug">{fix.title}</div>
          <div className="text-xs text-gray-400 font-sans leading-relaxed">{fix.description}</div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <label className="block text-2xs font-mono text-gray-400 uppercase tracking-wide">
            Paste your current code segment:
          </label>
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            disabled={isTailoring}
            placeholder="e.g. const renderMenu = () => { if (user) { return ... } }"
            className="w-full h-36 bg-black/50 text-cyan-300 border border-white/10 rounded-lg p-3 font-mono text-xs focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed placeholder:text-gray-700"
          />
        </div>

        {/* Submit action */}
        <div className="flex justify-end">
          <button
            onClick={handleTailorSubmit}
            disabled={isTailoring || !userCode.trim()}
            className="px-5 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-mono font-semibold text-xs active:scale-95 transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
          >
            {isTailoring ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>STREAMING...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>TAILOR CODE DIFF</span>
              </>
            )}
          </button>
        </div>

        {/* Stream Telemetry Logs */}
        {streamLog && (
          <div className="p-3 bg-black/40 border border-cyan-500/10 rounded font-mono text-2xs text-cyan-400 animate-pulse">
            &gt; {streamLog}
          </div>
        )}

        {/* Tailored Diff Output */}
        {tailoredFix && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-2xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
                TAILORED RE-SYNTHESIS PATCH
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-2xs font-mono text-purple-400 hover:text-purple-300 py-1 px-2 hover:bg-white/5 rounded cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>COPY DIFF</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              {tailoredFix.description}
            </p>

            <DiffViewer diffText={tailoredFix.code_snippet} />
          </div>
        )}

      </div>
      
      {/* CSS transitions */}
      <style>{`
        .animate-slideLeft {
          animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideLeft {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
