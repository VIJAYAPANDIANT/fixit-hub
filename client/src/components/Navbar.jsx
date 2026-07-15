import React from 'react';
import { Terminal, LayoutDashboard, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ theme, onToggleTheme, activeTab, onTabChange }) {
  return (
    <header className="flex justify-between items-center px-6 py-4 bg-black/20 dark:bg-black/20 light:bg-white/40 border-b border-white/5 dark:border-white/5 light:border-black/5 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      
      {/* Glitchy Logo */}
      <div 
        onClick={() => onTabChange('hero')}
        className="flex items-center gap-2.5 cursor-pointer group select-none"
      >
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 dark:from-purple-600 dark:to-cyan-500 light:from-cyan-500 light:to-blue-600 flex items-center justify-center shadow-lg shadow-purple-950/40">
          <span className="font-mono font-extrabold text-sm text-white">FI</span>
        </div>
        
        <span className="text-xl font-bold font-mono tracking-tight flex items-center gap-0.5">
          FIX
          <span className="text-purple-400 dark:text-purple-400 light:text-cyan-600 neon-text-purple dark:neon-text-purple light:neon-text-cyan hover-glitch">
            {'{ }'}
          </span>
        </span>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-mono">
        <button
          onClick={() => onTabChange('hero')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            activeTab === 'hero' 
              ? 'bg-purple-500/10 dark:bg-purple-500/10 light:bg-cyan-500/10 border border-purple-500/30 dark:border-purple-500/30 light:border-cyan-500/30 text-purple-300 dark:text-purple-300 light:text-cyan-700' 
              : 'text-gray-400 hover:text-white dark:hover:text-white light:hover:text-black border border-transparent'
          }`}
        >
          <Terminal size={13} />
          <span>COMMAND CENTER</span>
        </button>

        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            activeTab === 'dashboard' 
              ? 'bg-purple-500/10 dark:bg-purple-500/10 light:bg-cyan-500/10 border border-purple-500/30 dark:border-purple-500/30 light:border-cyan-500/30 text-purple-300 dark:text-purple-300 light:text-cyan-700' 
              : 'text-gray-400 hover:text-white dark:hover:text-white light:hover:text-black border border-transparent'
          }`}
        >
          <LayoutDashboard size={13} />
          <span>TEAM DASHBOARD</span>
        </button>

        <div className="h-4 w-px bg-white/10 dark:bg-white/10 light:bg-black/10 mx-1" />

        {/* Theme Toggle Button */}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {/* CSS injection for Logo Bracket Glitch Hover */}
      <style>{`
        .hover-glitch {
          display: inline-block;
          position: relative;
        }
        .group:hover .hover-glitch {
          animation: glitch 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;
        }
        @keyframes glitch {
          0% {
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
          20% {
            transform: translate(-2px, 2px);
            clip-path: inset(20% 0 30% 0);
          }
          40% {
            transform: translate(2px, -2px);
            clip-path: inset(40% 0 10% 0);
          }
          60% {
            transform: translate(-1px, 1px);
            clip-path: inset(70% 0 5% 0);
          }
          80% {
            transform: translate(1px, -1px);
            clip-path: inset(10% 0 60% 0);
          }
          100% {
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
        }
      `}</style>
    </header>
  );
}
