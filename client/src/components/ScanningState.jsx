import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const STATUS_TEXTS = [
  "Reading stack trace...",
  "Scrubbing local file paths and email PII...",
  "Calculating SHA-256 footprint hash...",
  "Querying Redis cache clusters...",
  "Scanning internal database tables...",
  "Retrieving community vote ranks...",
  "Matching patterns...",
  "Parsing solutions..."
];

export default function ScanningState({ isScanning }) {
  const [statusText, setStatusText] = useState(STATUS_TEXTS[0]);
  const [logIndex, setLogIndex] = useState(0);

  // Cycle funny rotating status logs
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setLogIndex(prev => {
        const next = (prev + 1) % STATUS_TEXTS.length;
        setStatusText(STATUS_TEXTS[next]);
        return next;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isScanning]);

  if (!isScanning) return null;

  return (
    <div className="w-full max-w-3xl space-y-6 pt-4 select-none animate-fadeIn pointer-events-none z-10">
      
      {/* Streaming scan metrics */}
      <div className="flex items-center gap-3 justify-center text-xs font-mono text-purple-400">
        <Loader2 className="animate-spin text-purple-500" size={14} />
        <span className="neon-text-purple uppercase tracking-wider">{statusText}</span>
      </div>

      {/* Ghost cards skeleton loader */}
      <div className="grid grid-cols-1 gap-5">
        {[1, 2].map((idx) => (
          <div 
            key={idx} 
            className="glass-panel border-white/5 rounded-xl p-5 space-y-4 opacity-40 animate-pulse relative overflow-hidden"
          >
            {/* Glossy sweep skeleton effect */}
            <div className="absolute inset-0 skeleton-shimmer-sweep" />

            {/* Skeleton Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="space-y-1.5 w-full">
                <div className="h-3 w-16 bg-white/10 rounded" />
                <div className="h-4 w-1/3 bg-white/10 rounded" />
              </div>
              <div className="h-8 w-12 bg-white/10 rounded-full" />
            </div>

            {/* Skeleton Body */}
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-white/10 rounded" />
              <div className="h-3.5 w-5/6 bg-white/10 rounded" />
              
              {/* Code diff skeleton */}
              <div className="h-20 w-full bg-black/40 rounded border border-white/5 pt-3 pl-3 space-y-1.5 mt-4">
                <div className="h-2 w-1/4 bg-white/5 rounded" />
                <div className="h-2 w-2/3 bg-white/5 rounded" />
                <div className="h-2 w-1/2 bg-white/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shimmer sweep animation CSS */}
      <style>{`
        .skeleton-shimmer-sweep::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.03) 20%,
            rgba(255, 255, 255, 0.08) 60%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

    </div>
  );
}
