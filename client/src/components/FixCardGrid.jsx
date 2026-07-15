import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Sliders, Check, Copy, Flame, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';

function DiffViewer({ diffText }) {
  if (!diffText) return null;
  const lines = diffText.split('\n');
  
  return (
    <div className="bg-black/60 rounded p-3 font-mono text-2xs border border-white/5 overflow-x-auto select-text leading-relaxed max-w-full">
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

export default function FixCardGrid({ fixes, onVote, onVerify, onOpenTailor, cacheHit }) {
  const [copiedId, setCopiedId] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);

  const handleCopy = (e, id, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCardClick = (id) => {
    if (activeCardId === id) {
      // Toggle / pull back
      setActiveCardId(null);
      setExpandedCardId(null);
    } else {
      setActiveCardId(id);
      setExpandedCardId(id);
    }
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

  // Radial Glowing Confidence Ring Helper
  const renderConfidenceRing = (score) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="w-10 h-10 transform -rotate-90">
          <circle 
            cx="20" cy="20" r={radius} 
            className="text-white/5" 
            strokeWidth="3.5" stroke="currentColor" fill="transparent" 
          />
          <circle 
            cx="20" cy="20" r={radius} 
            className="text-cyan-400 dark:text-cyan-400 light:text-cyan-600 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" 
            strokeWidth="3.5" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor" 
            fill="transparent" 
          />
        </svg>
        <span className="absolute font-mono text-3xs font-extrabold text-white">{score}%</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl space-y-8 select-none pb-20 pt-4 z-10">
      
      {/* Cache Match notification banner */}
      {cacheHit && (
        <div className="glass-panel neon-border-cyan/30 rounded-xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Flame size={16} />
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                System Registry Hit
              </div>
              <div className="text-xs text-gray-400 font-sans">
                Retrieved matching trace footprints from cache registry. Bypassed queue.
              </div>
            </div>
          </div>
          <span className="text-2xs font-mono text-cyan-400 neon-text-cyan font-bold">
            CACHED MATCH
          </span>
        </div>
      )}

      {/* Header title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
          Diagnostic Fix Solutions Grid
        </h2>
        <span className="text-3xs font-mono text-gray-500">
          Click solution card to pull forward & edit
        </span>
      </div>

      {/* 3D Arc Card Deck container */}
      <div className="relative flex flex-col md:flex-row justify-center items-center gap-6 py-6 perspective-container min-h-128">
        
        {fixes.map((fix, idx) => {
          const isSelected = activeCardId === fix.id;
          const isExpanded = expandedCardId === fix.id;
          const isFlagged = fix.flagged;
          
          // Calculate angle for the 3D arc fan deck layout
          const total = fixes.length;
          const mid = (total - 1) / 2;
          const angleOffset = (idx - mid) * 8; // 8 degrees separation
          const translateOffset = Math.abs(idx - mid) * -15; // translate back slightly for curve

          // Custom 3D inline styles
          const cardStyle = isSelected
            ? {
                transform: 'translateZ(120px) rotateY(0deg) translateY(0px)',
                zIndex: 40,
              }
            : {
                transform: `rotateY(${angleOffset}deg) translateZ(${translateOffset}px)`,
                zIndex: 10 + idx,
              };

          return (
            <div
              key={fix.id}
              onClick={() => handleCardClick(fix.id)}
              style={cardStyle}
              className={`w-full md:w-80 glass-panel glass-panel-hover rounded-xl cursor-pointer select-none transition-all duration-500 ease-out transform bobbing-wave flex flex-col ${
                isSelected ? 'neon-border-cyan/40 border-cyan-500/40 bg-slate-900/90' : 'bg-[#0a0a0f]/75'
              } ${isFlagged ? 'opacity-55 border-rose-500/20' : ''}`}
            >
              
              {/* Flagged warning badge */}
              {isFlagged && (
                <div className="bg-rose-950/20 border-b border-rose-500/20 px-4 py-2 flex items-center gap-1.5 text-4xs font-mono text-rose-400">
                  <ShieldAlert size={12} className="animate-pulse" />
                  <span>MODERATION REVIEW REQUIRED</span>
                </div>
              )}

              {/* Card Header */}
              <div className="flex justify-between items-start p-4 bg-black/20 border-b border-white/5 gap-2.5">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className={`px-2 py-0.5 text-4xs font-mono font-bold border rounded uppercase ${getSourceBadgeColor(fix.source_type)}`}>
                      {fix.source_type || 'ai'}
                    </span>
                    
                    {/* Community verification count */}
                    {fix.verified_count > 0 && (
                      <span className="px-2 py-0.5 text-4xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded uppercase">
                        ✅ {fix.verified_count} dev solves
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug">{fix.title}</h3>
                </div>
                {renderConfidenceRing(fix.confidence_score || fix.ai_confidence || 85)}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3.5 flex-1 flex flex-col">
                <p className="text-2xs text-gray-400 font-sans leading-relaxed flex-1">
                  {fix.description}
                </p>

                {/* Code Diff patch */}
                {isExpanded && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between items-center text-4xs font-mono text-gray-500">
                      <span>PATCH DIFF</span>
                      <button
                        onClick={(e) => handleCopy(e, fix.id, fix.code_snippet)}
                        className="text-purple-400 hover:text-purple-300 py-0.5 px-1.5 hover:bg-white/5 rounded cursor-pointer transition-colors"
                      >
                        {copiedId === fix.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <DiffViewer diffText={fix.code_snippet} />
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 bg-black/40 border-t border-white/5 font-mono text-3xs flex justify-between items-center gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onVote(fix.id, 'up'); }}
                    className="flex items-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <ThumbsUp size={11} />
                    <span>{fix.upvotes}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onVote(fix.id, 'down'); }}
                    className="flex items-center gap-1 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <ThumbsDown size={11} />
                    <span>{fix.downvotes}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  {isExpanded && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onVerify(fix.id); }}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-bold cursor-pointer"
                      title="Verify this solution worked"
                    >
                      <CheckCircle size={11} />
                      <span>Verify</span>
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenTailor(fix); }}
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5 font-bold cursor-pointer"
                  >
                    <Sliders size={11} />
                    <span>Tailor</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* CSS Perspect and bobbing wave animations */}
      <style>{`
        .perspective-container {
          perspective: 1000px;
          transform-style: preserve-3d;
        }
        .bobbing-wave {
          animation: bob 4s ease-in-out infinite alternate;
        }
        @keyframes bob {
          0% {
            transform: translateY(0px) rotateY(var(--deg, 0deg));
          }
          100% {
            transform: translateY(-8px) rotateY(var(--deg, 0deg));
          }
        }
      `}</style>

    </div>
  );
}
