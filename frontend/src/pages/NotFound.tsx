import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
      <HelpCircle className="h-16 w-16 text-slate-400 animate-pulse" />
      <h1 className="text-4xl font-extrabold tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-sm">The route you requested does not exist or has been deleted from this project workspace.</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
};
