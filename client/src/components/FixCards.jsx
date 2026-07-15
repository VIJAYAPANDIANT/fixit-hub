import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Sliders, Check, Copy, Flame, ShieldAlert, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

function DiffViewer({ diffText }) {
  const lines = diffText.split('\n');
  
  return (
    <div className="bg-black/60 rounded-lg p-4 font-mono text-xs border border-white/5 overflow-x-auto select-text leading-relaxed max-w-full">
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

export default function FixCards({ fixes, onVote, onVerify, onTailorFixStream, isTailoringMap, cacheHit }) {
  const [copiedId, setCopiedId] = useState(null);
  const [tailorInputText, setTailorInputText] = useState({});
  const [tailoredFixes, setTailoredFixes] = useState({});
  const [activeTailorId, setActiveTailorId] = useState(null);
  const [streamProgressLogs, setStreamProgressLogs] = useState({});

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoteSubmit = (id, type) => {
    onVote(id, type);
  };

  const handleVerifySubmit = (id) => {
    onVerify(id);
  };

  // Typewriter drawing effect on complete
  const drawTypewriter = (id, targetFix) => {
    let currentCode = '';
    const fullCode = targetFix.code_snippet;
    let index = 0;
    
    // Clear log and initialize partial object
    setStreamProgressLogs(prev => ({ ...prev, [id]: '' }));

    const interval = setInterval(() => {
      if (index >= fullCode.length) {
        clearInterval(interval);
        // Save final complete object
        setTailoredFixes(prev => ({
          ...prev,
          [id]: targetFix
        }));
        
        // Burst confetti
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#06b6d4', '#22c55e']
        });
        return;
      }

      currentCode += fullCode.slice(index, index + 16);
      setTailoredFixes(prev => ({
        ...prev,
        [id]: { ...targetFix, code_snippet: currentCode }
      }));
      index += 16;
    }, 15);
  };

  const handleTailorSubmit = (id) => {
    const userCode = tailorInputText[id];
    if (!userCode || !userCode.trim()) return;

    setStreamProgressLogs(prev => ({ ...prev, [id]: 'Opening secure SSE channel...' }));

    onTailorFixStream(
      id,
      userCode,
      (partialBuffer) => {
        // Chunk callback: update streaming log length
        setStreamProgressLogs(prev => ({ 
          ...prev, 
          [id]: `Receiving tailored matrices (${partialBuffer.length} bytes)...` 
        }));
      },
      (finalPayload) => {
        // Completed callback: Type it out!
        setStreamProgressLogs(prev => ({ ...prev, [id]: 'De-serializing payloads... Typwriting patch...' }));
        drawTypewriter(id, finalPayload);
      }
    );
  };

  const handleToggleTailorPane = (id) => {
    setActiveTailorId(activeTailorId === id ? null : id);
  };

  const getSourceBadgeColor = (source) => {
    switch (source) {
      case 'ai':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'community':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'external':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      default:
        return 'bg-white/5 border-white/10 text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6 select-none pb-20">
      
      {/* Caching Instant Match Banner */}
      {cacheHit && (
        <div className="glass-panel neon-border-cyan/30 rounded-xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Redis Cache Hit
              </div>
              <div className="text-xs text-gray-400 font-sans">
                Found matching trace in key-value registry. Loaded solutions instantly.
              </div>
            </div>
          </div>
          <span className="text-2xs font-mono text-cyan-400 neon-text-cyan font-bold">
            INSTANT CACHE MATCH
          </span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-xl font-mono font-bold text-white flex items-center gap-2">
          <Flame className="text-amber-500 animate-pulse" size={20} />
          <span>DIAGNOSTIC REPORT: {fixes.length} SOLUTIONS</span>
        </h2>
        <div className="text-xs font-mono text-gray-400">
          Ranked by confidence + verifications
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {fixes.map((fix) => {
          const isTailored = !!tailoredFixes[fix.id];
          const displayFix = tailoredFixes[fix.id] || fix;
          const isTailoring = !!isTailoringMap[fix.id];
          const isFlagged = displayFix.flagged;

          return (
            <div 
              key={fix.id} 
              className={`glass-panel glass-panel-hover rounded-xl overflow-hidden border-white/5 transition-all duration-300 ${
                isTailored ? 'neon-border-green/20 border-emerald-500/30' : ''
              } ${isFlagged ? 'border-rose-500/30 opacity-70' : ''}`}
            >
              
              {/* Flagged Caution Banner */}
              {isFlagged && (
                <div className="bg-rose-950/20 border-b border-rose-500/20 px-5 py-2.5 flex items-center gap-2 text-xs font-mono text-rose-400">
                  <ShieldAlert size={14} className="animate-pulse" />
                  <span>FLAGGED FOR MODERATION: High downvote ratio detected. Check patch validity prior to usage.</span>
                </div>
              )}

              {/* Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-black/30 border-b border-white/5 gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`px-2.5 py-0.5 text-2xs font-mono font-bold border rounded uppercase ${getSourceBadgeColor(displayFix.source_type || 'ai')}`}>
                      {displayFix.source_type || 'ai'} source
                    </span>
                    {isTailored && (
                      <span className="px-2.5 py-0.5 text-2xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded uppercase animate-pulse">
                        TAILORED
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{displayFix.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <div className="text-2xs font-mono text-gray-500">AI CONFIDENCE</div>
                    <div className={`text-sm font-mono font-bold ${
                      (displayFix.confidence_score || displayFix.ai_confidence) >= 90 ? 'text-emerald-400 neon-text-green' : 'text-cyan-400 neon-text-cyan'
                    }`}>
                      {displayFix.confidence_score || displayFix.ai_confidence || 90}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-300 leading-relaxed font-sans">{displayFix.description}</p>
                
                {/* Diff Container */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-2xs font-mono text-gray-500">
                    <span>CODE PATCH RECOMMENDATION</span>
                    <button
                      onClick={() => handleCopy(fix.id, displayFix.code_snippet || displayFix.code_diff)}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors py-1 px-2 hover:bg-white/5 rounded cursor-pointer"
                    >
                      {copiedId === fix.id ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Diff</span>
                        </>
                      )}
                    </button>
                  </div>
                  <DiffViewer diffText={displayFix.code_snippet || displayFix.code_diff} />
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-center px-5 py-4 bg-black/40 border-t border-white/5 font-mono text-xs">
                
                {/* Vote & Verification actions */}
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-3 border-r border-white/5 pr-4">
                    <button
                      onClick={() => handleVoteSubmit(fix.id, 'up')}
                      className="flex items-center gap-1 text-gray-400 hover:text-emerald-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <ThumbsUp size={13} />
                      <span>{displayFix.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleVoteSubmit(fix.id, 'down')}
                      className="flex items-center gap-1 text-gray-400 hover:text-rose-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <ThumbsDown size={13} />
                      <span>{displayFix.downvotes}</span>
                    </button>
                  </div>

                  {/* "This worked for me" Verify Button */}
                  <button
                    onClick={() => handleVerifySubmit(fix.id)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-emerald-400 transition-all cursor-pointer font-bold"
                  >
                    <CheckCircle size={13} className="text-emerald-500/80" />
                    <span>This worked for me ({displayFix.verified_count || 0})</span>
                  </button>
                </div>

                {/* Ask AI to tailor trigger */}
                <div>
                  <button
                    onClick={() => handleToggleTailorPane(fix.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border border-purple-500/20 hover:border-purple-500/40 text-purple-400 hover:text-purple-300 transition-all cursor-pointer ${
                      activeTailorId === fix.id ? 'bg-purple-950/20 border-purple-500/50 text-purple-300' : 'bg-transparent'
                    }`}
                  >
                    <Sliders size={13} />
                    <span>Tailor to my code</span>
                  </button>
                </div>
              </div>

              {/* Expandable Tailoring Pane */}
              {activeTailorId === fix.id && (
                <div className="p-5 bg-black/60 border-t border-white/5 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="block text-2xs font-mono text-gray-400">
                      PASTE YOUR CODE SNIPPET (TO MAP VARIABLE NAMES)
                    </label>
                    {isTailoring && (
                      <span className="flex items-center gap-1 text-2xs font-mono text-cyan-400 animate-pulse">
                        <Loader2 size={10} className="animate-spin" /> Stream active...
                      </span>
                    )}
                  </div>
                  
                  <textarea
                    value={tailorInputText[fix.id] || ''}
                    onChange={(e) => setTailorInputText({ ...tailorInputText, [fix.id]: e.target.value })}
                    disabled={isTailoring}
                    placeholder="e.g. const fetchUser = async (uid) => { ... }"
                    className="w-full h-24 bg-black/40 text-cyan-300 border border-white/10 rounded p-2.5 font-mono text-xs focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-700 resize-none"
                  />

                  {/* Streaming Progress Logs */}
                  {streamProgressLogs[fix.id] && (
                    <div className="text-2xs font-mono text-cyan-500/80 animate-pulse">
                      &gt; {streamProgressLogs[fix.id]}
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleToggleTailorPane(fix.id)}
                      className="px-3 py-1.5 rounded border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleTailorSubmit(fix.id)}
                      disabled={isTailoring || !(tailorInputText[fix.id] || '').trim()}
                      className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-900/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      {isTailoring ? 'Streaming...' : 'Refine code diff'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
