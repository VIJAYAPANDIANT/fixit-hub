import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (isRegister) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, role })
        });
        if (!response.ok) {
          throw new Error("Registration failed. Account might already exist.");
        }
        setIsRegister(false);
        setErrorMsg("Registration successful! Please login with your password.");
      } else {
        await login(email, password);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-xl">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-full bg-brand-500/10 text-brand-500 mb-4">
            <Terminal className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-gradient">
            {isRegister ? 'Create your account' : 'Welcome to FixIt Hub'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isRegister ? 'Join the Universal Bug Resolution Workspace' : 'Sign in to access error logs and AI solutions'}
          </p>
        </div>

        {errorMsg && (
          <div className={`p-3 rounded-lg text-sm border font-medium ${
            errorMsg.includes("successful")
              ? 'bg-accent-50/50 border-accent-500/30 text-accent-600 dark:bg-accent-950/15'
              : 'bg-red-50/50 border-red-500/30 text-red-600 dark:bg-red-950/15'
          }`}>
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <div>
              <label htmlFor="reg-name" className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">NAME</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                placeholder="developer@fixit.hub"
              />
            </div>
          </div>

          {!isRegister && (
            <div>
              <label htmlFor="password" className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label htmlFor="reg-role" className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">ROLE</label>
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-800 bg-white/50 dark:bg-dark-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all hover:shadow-lg disabled:opacity-50"
          >
            {submitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <span>{isRegister ? 'Register' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            className="text-sm font-medium text-brand-500 hover:text-brand-600 transition"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
