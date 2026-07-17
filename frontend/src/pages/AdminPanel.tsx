import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, authService } from '../services/api';
import { ShieldCheck, User as UserIcon } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  
  const [registerMsg, setRegisterMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.listUsers
  });

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterMsg('');
    setErrorMsg('');
    setSubmitting(true);

    try {
      await authService.register(email, name, role);
      setRegisterMsg("Developer registered successfully in FixIt Hub registry.");
      setEmail('');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create user account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Operations Panel</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Register new organization developers, audit system accounts, and align user access roles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-500" />
            <span>Register Developer</span>
          </h3>

          {registerMsg && (
            <div className="p-3 bg-accent-50/50 border border-accent-500/30 text-accent-600 dark:bg-accent-950/15 text-xs font-semibold rounded-lg">
              {registerMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50/50 border border-red-500/30 text-red-600 dark:bg-red-950/15 text-xs font-semibold rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegisterUser} className="space-y-3">
            <div>
              <label htmlFor="reg-dev-name" className="text-xs font-bold text-slate-400 block mb-1">DEVELOPER NAME</label>
              <input 
                id="reg-dev-name"
                type="text" 
                required
                placeholder="Vijayapandian T"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reg-dev-email" className="text-xs font-bold text-slate-400 block mb-1">EMAIL ADDRESS</label>
              <input 
                id="reg-dev-email"
                type="email" 
                required
                placeholder="v.pandian@fixit.hub"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reg-dev-role" className="text-xs font-bold text-slate-400 block mb-1">ACCESS ROLE</label>
              <select 
                id="reg-dev-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 focus:outline-none"
              >
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="ADMIN">ADMINISTRATOR</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Account'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-800 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-slate-400" />
            <span>Developer Roster</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-800 text-xs font-bold text-slate-400">
                  <th className="py-2.5">NAME</th>
                  <th className="py-2.5">EMAIL</th>
                  <th className="py-2.5 text-right">ROLE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-850">
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td className="py-3 font-semibold">{u.name}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        u.role === 'ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-dark-850 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
