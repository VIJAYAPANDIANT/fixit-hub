import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, notificationService } from '../services/api';
import { 
  Sun, Moon, Shield, LogOut, LayoutDashboard, Search, Bookmark, 
  User as UserIcon, Settings, Menu, X, Terminal, Briefcase, Plus,
  Bell, Check
} from 'lucide-react';

const NotificationBell: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.list,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const readMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2.5 rounded-lg bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-300 transition relative cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-pulse border border-white dark:border-dark-900">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 glass-panel bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl shadow-xl z-50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-2">
              <h4 className="font-bold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <button
                  onClick={() => readAllMutation.mutate()}
                  className="text-xs text-brand-500 hover:underline font-bold cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <p className="text-xs text-slate-400 text-center py-4">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
              ) : (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      n.isRead
                        ? 'bg-slate-50/50 dark:bg-dark-950/20 border-slate-100 dark:border-dark-800/40 opacity-70'
                        : 'bg-brand-500/5 border-brand-500/10 hover:bg-brand-500/10'
                    }`}
                  >
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="font-bold text-xs truncate">{n.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => readMutation.mutate(n.id)}
                        className="p-1 rounded bg-slate-100 dark:bg-dark-800 hover:bg-brand-500 hover:text-white transition shrink-0 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem('activeProjectId') || '';
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.list
  });

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      const defaultId = projects[0].id;
      setActiveProjectId(defaultId);
      localStorage.setItem('activeProjectId', defaultId);
    }
  }, [projects, activeProjectId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    setActiveProjectId(nextId);
    localStorage.setItem('activeProjectId', nextId);
    window.dispatchEvent(new Event('projectChanged'));
  };

  const createProject = async () => {
    const name = prompt("Enter new project name:");
    if (name) {
      try {
        await projectService.create(name);
        window.location.reload();
      } catch (err) {
        alert("Failed to create project");
      }
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Terminal },
    { to: '/search', label: 'Advanced Search', icon: Search },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { to: '/profile', label: 'Profile', icon: UserIcon },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-dark-950 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gradient">
              <Terminal className="h-6 w-6 text-brand-500" />
              <span>FixIt Hub</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 ml-8 bg-slate-100 dark:bg-dark-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-700">
              <Briefcase className="h-4 w-4 text-slate-500" />
              <select 
                value={activeProjectId} 
                onChange={handleProjectChange}
                className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer pr-4"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-dark-900 dark:text-white">
                    {p.name}
                  </option>
                ))}
              </select>
              <button 
                onClick={createProject} 
                title="Create Project"
                className="text-slate-500 hover:text-brand-500 hover:scale-110 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-dark-800">
              <div className="text-right">
                <p className="text-sm font-semibold">{user?.name}</p>
                <span className="text-xs text-brand-500 font-bold tracking-wider">{user?.role}</span>
              </div>
              <button 
                onClick={logout}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-8">
        <aside className="hidden md:block w-64 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.02]' 
                      : 'hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 hover:translate-x-1'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-dark-900 p-6 flex flex-col gap-6 shadow-xl border-r border-slate-200 dark:border-dark-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-gradient">Menu</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg bg-slate-100 dark:bg-dark-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-100 dark:bg-dark-800 p-3 rounded-lg border border-slate-200 dark:border-dark-700">
              <p className="text-xs text-slate-500 font-bold mb-1">Active Project</p>
              <select 
                value={activeProjectId} 
                onChange={handleProjectChange}
                className="w-full bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-dark-900 dark:text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <nav className="flex-1 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-500 text-white shadow-md' 
                        : 'hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 dark:border-dark-800 pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{user?.name}</p>
                <span className="text-xs text-brand-500 font-bold tracking-wider">{user?.role}</span>
              </div>
              <button 
                onClick={logout}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
