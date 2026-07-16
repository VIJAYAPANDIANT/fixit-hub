import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Configure application interface styles and dashboard parameters
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Interface Mode</h3>
            <p className="text-xs text-slate-500">Switch between light and dark backgrounds</p>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-800 transition text-sm font-semibold cursor-pointer"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-dark-800 pt-4 flex gap-3 text-xs text-slate-400">
          <Info className="h-5 w-5 text-brand-500 shrink-0" />
          <span>FixIt Hub dynamically caches logs locally and synchronizes status triages in real time with backend Elasticsearch cluster metrics.</span>
        </div>
      </div>
    </div>
  );
};
