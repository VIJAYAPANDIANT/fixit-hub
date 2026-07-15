import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Mic, Sparkles, X, ChevronRight, CornerDownLeft } from 'lucide-react';

const SUGGESTIONS = [
  {
    label: "React Hook Order",
    text: "Error: Rendered fewer hooks than expected. This may be caused by a React Hook useEffect being called conditionally."
  },
  {
    label: "Java NullPointer",
    text: "java.lang.NullPointerException: Cannot invoke \"com.example.User.getEmail()\" because the return value of \"getUser()\" is null"
  },
  {
    label: "Python KeyError",
    text: "Traceback (most recent call last):\n  File \"app.py\", line 12, in process_request\n    username = data['username']\nKeyError: 'username'"
  }
];

export default function HeroConsole({ onDiagnose, isScanning, showResults }) {
  const [errorText, setErrorText] = useState('');
  const [langBadge, setLangBadge] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Auto-detect language signature on change
  useEffect(() => {
    const text = errorText.toLowerCase();
    if (!text.trim()) {
      setLangBadge(null);
      return;
    }

    if (text.includes('useeffect') || text.includes('hooks') || text.includes('rendered fewer hooks')) {
      setLangBadge({ name: 'React Hook Order', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' });
    } else if (text.includes('nullpointerexception') || text.includes('java.lang')) {
      setLangBadge({ name: 'Java (Spring)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' });
    } else if (text.includes('keyerror') || text.includes('traceback') && text.includes('.py')) {
      setLangBadge({ name: 'Python (Flask/Django)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' });
    } else if (text.includes('cannot read properties') || text.includes('is not a function')) {
      setLangBadge({ name: 'Node.js Exception', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' });
    } else {
      setLangBadge({ name: 'General Stack Trace', color: 'text-gray-400 border-white/10 bg-white/5' });
    }
  }, [errorText]);

  // Voice Input Speech-to-Text handler (optional premium feature)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported on this browser. Try Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setErrorText(prev => prev + ' ' + speechToText);
    };

    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!errorText.trim() || isScanning) return;
    onDiagnose(errorText);
  };

  if (showResults) return null; // hide Hero Console when results fanned out

  return (
    <div className="w-full max-w-3xl animate-fadeIn relative z-20">
      
      {/* Glass Console Container */}
      <div className="glass-panel rounded-xl overflow-hidden scanline-effect border-purple-500/10 dark:border-purple-500/10 light:border-black/10 shadow-lg shadow-black/80">
        
        {/* Console Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 dark:bg-black/60 light:bg-white/90 border-b border-white/5 dark:border-white/5 light:border-black/5">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80 shadow-rose-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-emerald-500/50" />
            <span className="ml-2 text-3xs font-mono text-gray-500 select-none">Ingestion Console v1.2</span>
          </div>
          
          <div className="flex items-center space-x-1.5 text-3xs font-mono text-purple-400">
            <Terminal size={12} className="animate-pulse" />
            <span className="neon-text-purple">GATEWAY ACTIVE</span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-3xs font-mono text-gray-500">
              <span className="flex items-center gap-1.5">
                <ChevronRight size={13} className="text-purple-400" /> input_unredacted_traceback
              </span>
              
              {/* Dynamic Auto-detect Badge */}
              {langBadge && (
                <div className={`px-2.5 py-0.5 rounded border text-4xs font-mono font-bold animate-fadeIn uppercase ${langBadge.color}`}>
                  {langBadge.name}
                </div>
              )}
            </div>

            <div className="relative">
              <textarea
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
                disabled={isScanning}
                placeholder="Paste code crash logs, stack traces, compiler errors, or type assertions here... e.g. TypeError: Cannot read properties of undefined..."
                className="w-full h-40 bg-black/40 text-[#00ffb3] border border-white/10 dark:border-white/10 light:border-black/15 rounded-lg p-3.5 font-mono text-xs focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-gray-700 resize-none leading-relaxed select-text"
              />
              
              {/* Voice-Input Option */}
              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isScanning}
                className={`absolute bottom-3.5 right-3.5 p-2 rounded-full border hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                  isRecording 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                }`}
                title="Speak / Voice Input"
              >
                <Mic size={13} />
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <div className="text-3xs font-mono text-gray-600 uppercase">Test Tracebacks:</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setErrorText(preset.text)}
                  disabled={isScanning}
                  className="text-3xs px-2.5 py-1.5 rounded bg-white/5 border border-white/5 hover:bg-purple-950/20 hover:border-purple-500/30 text-gray-400 hover:text-purple-300 transition-all font-mono cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-between items-center pt-2">
            <div />
            <button
              type="submit"
              disabled={isScanning || !errorText.trim()}
              className={`px-5 py-2.5 text-xs font-mono font-semibold rounded flex items-center gap-2 transition-all ${
                isScanning
                  ? 'bg-purple-950/20 text-purple-400 border border-purple-500/30 cursor-not-allowed'
                  : !errorText.trim()
                  ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] active:scale-95 cursor-pointer'
              }`}
            >
              <Sparkles size={13} />
              <span>🔍 DIAGNOSE</span>
            </button>
          </div>

        </form>
      </div>

      {/* Swipe Scanline simulation */}
      {isScanning && (
        <div className="absolute inset-0 bg-purple-500/5 pointer-events-none scan-line-swipe" />
      )}

      {/* CSS Scanline Shader sweep */}
      <style>{`
        .scan-line-swipe {
          animation: swipe 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          border-bottom: 2px solid rgba(168, 85, 247, 0.4);
          box-shadow: 0 5px 20px rgba(168, 85, 247, 0.3);
        }
        @keyframes swipe {
          from {
            top: 0%;
            bottom: 100%;
          }
          to {
            top: 100%;
            bottom: 0%;
          }
        }
      `}</style>

    </div>
  );
}
