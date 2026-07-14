import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Sliders, Check, Copy, Flame, HelpCircle, Loader2 } from 'lucide-react';
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

export default function FixCards({ fixes, onVote, onTailorFix, isTailoringMap }) {
  const [copiedId, setCopiedId] = useState(null);
  const [tailorInputText, setTailorInputText] = useState({});
  const [tailoredFixes, setTailoredFixes] = useState({});
  const [activeTailorId, setActiveTailorId] = useState(null);

  const handleCopy = (id, text) => {
    // Strip diff markers for copying clean code, or copy the diff
    // Let's copy the entire diff block
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoteSubmit = (id, type) => {
    onVote(id, type);
    if (type === 'up') {
      // Trigger small confetti blast
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#a855f7', '#06b6d4', '#10b981']
      });
    }
  };

  const handleTailorSubmit = async (id, originalFix) => {
    const userCode = tailorInputText[id];
    if (!userCode || !userCode.trim()) return;

    try {
      const result = await onTailorFix(id, userCode);
      if (result) {
        setTailoredFixes(prev => ({
          ...prev,
          [id]: result // Save tailored version of this fix
        }));
        
        // Trigger cyber explosion confetti
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#06b6d4', '#22c55e']
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#a855f7', '#06b6d4']
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTailorPane = (id) => {
    setActiveTailorId(activeTailorId === id ? null : id);
  };

  const sortedFixes = [...fixes].sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="w-full max-w-4xl space-y-6 select-none pb-20">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-xl font-mono font-bold text-white flex items-center gap-2">
          <Flame className="text-amber-500 animate-pulse" size={20} />
          <span>DIAGNOSTIC REPORT: {fixes.length} FIX SOLUTIONS</span>
        </h2>
        <div className="text-xs font-mono text-gray-400">
          Ranked by community efficiency & AI reliability
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedFixes.map((fix) => {
          // Check if this fix has been tailored
          const isTailored = !!tailoredFixes[fix.id];
          const displayFix = tailoredFixes[fix.id] || fix;
          const isTailoring = !!isTailoringMap[fix.id];

          return (
            <div 
              key={fix.id} 
              className={`glass-panel glass-panel-hover rounded-xl overflow-hidden border-white/5 transition-all duration-300 ${
                isTailored ? 'neon-border-green/20 border-emerald-500/30' : ''
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-black/30 border-b border-white/5 gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-2.5 py-0.5 text-2xs font-mono font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded uppercase">
                      SOLUTION
                    </span>
                    {isTailored && (
                      <span className="px-2.5 py-0.5 text-2xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded uppercase animate-pulse">
                        TAILORED BY AI
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{displayFix.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  {/* AI Confidence Badge */}
                  <div className="flex flex-col items-end">
                    <div className="text-2xs font-mono text-gray-500">AI CONFIDENCE</div>
                    <div className={`text-sm font-mono font-bold ${
                      displayFix.ai_confidence >= 90 ? 'text-emerald-400 neon-text-green' : 'text-cyan-400 neon-text-cyan'
                    }`}>
                      {displayFix.ai_confidence}%
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
                      onClick={() => handleCopy(fix.id, displayFix.code_diff)}
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
                  <DiffViewer diffText={displayFix.code_diff} />
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-center px-5 py-4 bg-black/40 border-t border-white/5 font-mono text-xs">
                
                {/* Vote actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleVoteSubmit(fix.id, 'up')}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-emerald-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <ThumbsUp size={14} />
                    <span>{displayFix.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleVoteSubmit(fix.id, 'down')}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-rose-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <ThumbsDown size={14} />
                    <span>{displayFix.downvotes}</span>
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
                        <Loader2 size={10} className="animate-spin" /> Tailoring variables...
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
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleToggleTailorPane(fix.id)}
                      className="px-3 py-1.5 rounded border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleTailorSubmit(fix.id, fix)}
                      disabled={isTailoring || !(tailorInputText[fix.id] || '').trim()}
                      className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-900/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      {isTailoring ? 'Tailoring...' : 'Refine code diff'}
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
