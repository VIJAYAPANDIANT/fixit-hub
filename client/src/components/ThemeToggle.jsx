import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 text-gray-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
      title={theme === 'dark' ? 'Switch to Lab Light Theme' : 'Switch to Cyber Dark Theme'}
    >
      {theme === 'dark' ? (
        <Sun size={15} className="text-amber-400" />
      ) : (
        <Moon size={15} className="text-purple-400" />
      )}
    </button>
  );
}
