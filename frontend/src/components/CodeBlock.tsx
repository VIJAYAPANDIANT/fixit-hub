import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-dark-800 bg-slate-900 dark:bg-black/45 shadow-sm text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-mono tracking-wider uppercase font-bold">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 hover:text-slate-200 transition focus:outline-none"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-accent-500" />
              <span className="text-accent-500 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 overflow-x-auto max-h-96 text-slate-100 font-mono leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
};
