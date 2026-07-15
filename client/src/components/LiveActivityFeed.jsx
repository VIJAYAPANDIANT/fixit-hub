import React from 'react';
import { Cpu, Heart, CheckCircle2, X, Info, Bell } from 'lucide-react';

export default function LiveActivityFeed({ notifications, onDismiss }) {
  
  const getIcon = (type) => {
    switch (type) {
      case 'diagnose':
        return <Cpu className="text-pink-400 dark:text-pink-400 light:text-pink-600" size={16} />;
      case 'vote':
        return <Heart className="text-emerald-400 dark:text-emerald-400 light:text-emerald-600" size={16} />;
      case 'tailor':
        return <Info className="text-cyan-400 dark:text-cyan-400 light:text-cyan-600" size={16} />;
      case 'system':
        return <CheckCircle2 className="text-purple-400 dark:text-purple-400 light:text-purple-600" size={16} />;
      default:
        return <Bell className="text-gray-400" size={16} />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'diagnose':
        return 'border-pink-500/30 dark:border-pink-500/30 light:border-pink-500/50 shadow-pink-950/20';
      case 'vote':
        return 'border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-500/50 shadow-emerald-950/20';
      case 'tailor':
        return 'border-cyan-500/30 dark:border-cyan-500/30 light:border-cyan-500/50 shadow-cyan-950/20';
      case 'system':
        return 'border-purple-500/30 dark:border-purple-500/30 light:border-purple-500/50 shadow-purple-950/20';
      default:
        return 'border-white/10 dark:border-white/10 light:border-black/10 shadow-black/40';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto glass-panel dark:glass-panel light:bg-white/90 border rounded-lg p-3.5 flex gap-3 items-start justify-between shadow-lg transition-all duration-500 transform translate-y-0 opacity-100 ${getBorderColor(
            notif.type
          )}`}
          style={{ animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="mt-0.5">{getIcon(notif.type)}</div>
          <div className="flex-1 space-y-0.5">
            <p className="text-xs text-white dark:text-white light:text-gray-900 leading-relaxed font-sans">{notif.message}</p>
            <div className="flex items-center gap-1.5 text-3xs font-mono text-gray-500">
              <span>{notif.timestamp}</span>
              <span>•</span>
              <span className="uppercase text-2xs tracking-wider">{notif.type || 'LIVE'}</span>
            </div>
          </div>
          <button
            onClick={() => onDismiss(notif.id)}
            className="text-gray-500 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {/* Embedded slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%) translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
