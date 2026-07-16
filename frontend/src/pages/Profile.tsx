import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User as UserIcon, Mail } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your account credentials and system privileges
        </p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-dark-800 flex flex-col items-center text-center space-y-4">
        <div className="h-24 w-24 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/25">
          <UserIcon className="h-12 w-12" />
        </div>

        <div>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <Mail className="h-4 w-4" />
            <span>{user?.email}</span>
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-500">
          <ShieldCheck className="h-4 w-4" />
          <span>{user?.role}</span>
        </div>
      </div>
    </div>
  );
};
