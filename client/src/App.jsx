import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Shield, Globe, Sparkles } from 'lucide-react';
import Canvas3D from './components/Canvas3D';
import TerminalConsole from './components/TerminalConsole';
import FixCards from './components/FixCards';
import NotificationToast from './components/NotificationToast';
import confetti from 'canvas-confetti';

const BACKEND_URL = 'http://localhost:5000';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // App States
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [fixes, setFixes] = useState([]);
  const [cacheHit, setCacheHit] = useState(false);
  
  // Loading maps
  const [isTailoringMap, setIsTailoringMap] = useState({});

  // Initialize Socket.io Connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 4));
      
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 6000);
    });

    return () => newSocket.close();
  }, []);

  // API Call: Diagnose Error
  const handleDiagnose = async (errorText) => {
    setIsScanning(true);
    setIsSuccess(false);
    setCacheHit(false);

    try {
      const response = await fetch(`${BACKEND_URL}/api/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorText }),
      });

      if (!response.ok) {
        throw new Error('Diagnosis failed');
      }

      const data = await response.json();

      // If it is a cache hit, bypass scan logs instantly
      if (data.cacheHit) {
        setFixes(data.fixes);
        setCacheHit(true);
        setIsScanning(false);
        setIsSuccess(true);
        setShowResults(true);
        
        // Instant micro confetti for cache hit
        confetti({
          particleCount: 30,
          spread: 30,
          origin: { y: 0.8 },
          colors: ['#06b6d4', '#0891b2']
        });
      } else {
        setTimeout(() => {
          setFixes(data.fixes);
          setIsScanning(false);
          setIsSuccess(true);
          setShowResults(true);
        }, 2500); // 2.5 seconds scanning simulation
      }

    } catch (err) {
      console.error(err);
      setIsScanning(false);
      alert('Failed to connect to backend server. Make sure the Node server is running.');
    }
  };

  // API Call: Vote on Fix (with IP Audit validation checks)
  const handleVote = async (fixId, type) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fixes/${fixId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      // Handle double-voting warning
      if (response.status === 400) {
        const errorData = await response.json();
        
        // Show warning toast
        const warnNotif = {
          id: Math.random().toString(),
          message: errorData.error || `Double Vote Blocked: You have already submitted a vote for this patch.`,
          type: 'diagnose', // pink/rose border for warning
          timestamp: new Date().toLocaleTimeString()
        };
        setNotifications((prev) => [warnNotif, ...prev].slice(0, 4));
        return;
      }

      if (!response.ok) throw new Error('Vote failed');

      const updatedFix = await response.json();
      
      // Update local state
      setFixes((prev) =>
        prev.map((f) => (f.id === fixId ? { ...f, ...updatedFix } : f))
      );

      // Trigger success confetti
      if (type === 'up') {
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#a855f7', '#06b6d4', '#10b981']
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: "This worked for me" (Verify Solution)
  const handleVerify = async (fixId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fixes/${fixId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Handle double verification block
      if (response.status === 400) {
        const errorData = await response.json();
        
        // Show warning toast
        const warnNotif = {
          id: Math.random().toString(),
          message: errorData.error || `Verify Blocked: You have already verified this patch.`,
          type: 'diagnose', 
          timestamp: new Date().toLocaleTimeString()
        };
        setNotifications((prev) => [warnNotif, ...prev].slice(0, 4));
        return;
      }

      if (!response.ok) throw new Error('Verification failed');

      const updatedFix = await response.json();
      
      // Update local state
      setFixes((prev) =>
        prev.map((f) => (f.id === fixId ? { ...f, ...updatedFix } : f))
      );

      // Confetti burst for verified solution
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#22c55e', '#10b981', '#06b6d4']
      });

    } catch (err) {
      console.error(err);
    }
  };

  // SSE Stream: Stream Tailored solution character-by-character
  const handleTailorFixStream = (fixId, userCode, onChunk, onComplete) => {
    setIsTailoringMap((prev) => ({ ...prev, [fixId]: true }));

    const url = `${BACKEND_URL}/api/fixes/${fixId}/tailor-stream?userCode=${encodeURIComponent(userCode)}`;
    const eventSource = new EventSource(url);
    
    let buffer = '';

    eventSource.onmessage = (event) => {
      // Stream completed indicator
      if (event.data === '[DONE]') {
        eventSource.close();
        setIsTailoringMap((prev) => ({ ...prev, [fixId]: false }));
        try {
          const finalData = JSON.parse(buffer);
          onComplete(finalData);
        } catch (e) {
          console.error("Failed to parse full stream payload:", e);
        }
        return;
      }

      try {
        const parsed = JSON.parse(event.data);
        if (parsed.error) {
          eventSource.close();
          setIsTailoringMap((prev) => ({ ...prev, [fixId]: false }));
          alert(parsed.error);
          return;
        }
        
        buffer += parsed.chunk;
        onChunk(buffer); // update typing log
      } catch (err) {
        // partial string buffering
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE stream closed or completed.");
      eventSource.close();
      setIsTailoringMap((prev) => ({ ...prev, [fixId]: false }));
    };

    return eventSource;
  };

  const handleDismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleReset = () => {
    setShowResults(false);
    setIsSuccess(false);
    setCacheHit(false);
    setFixes([]);
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden select-none bg-black">
      {/* 3D Canvas Background */}
      <Canvas3D isScanning={isScanning} isSuccess={isSuccess} />

      {/* Main Overlay UI */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigation Bar */}
        <header className="flex justify-between items-center px-6 py-4 bg-black/20 border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-950/40">
              <span className="font-mono font-extrabold text-sm tracking-tighter text-white">FI</span>
            </div>
            <span className="text-xl font-bold font-mono tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              FIX<span className="text-purple-400 neon-text-purple">IT</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm font-mono">
            {/* Server Status Indicator */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-md shadow-emerald-500/50" />
              <span className="text-2xs text-gray-300">COMMAND NET ACTIVE</span>
            </div>
            
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors hidden sm:inline"
            >
              DOCS
            </a>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 flex flex-col items-center justify-start px-6 pt-10 pb-16 space-y-12">
          
          {/* Header Title Section */}
          {!showResults && (
            <div className="text-center max-w-2xl space-y-4 pt-4 animate-fadeIn">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-2xs mb-2">
                <Sparkles size={10} /> NEXT-GEN AI DEBUGGING TERMINAL
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-none">
                Diagnose Code Errors <span className="text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text">Instantly.</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed font-sans max-w-lg mx-auto">
                Paste your traceback logs into our floating cyber console. Our AI detects runtime signatures, maps variables, and suggests verified hotfixes.
              </p>
            </div>
          )}

          {/* Interactive Input Terminal */}
          <TerminalConsole
            onDiagnose={handleDiagnose}
            isScanning={isScanning}
            onReset={handleReset}
            showResults={showResults}
          />

          {/* Solution Fix Cards */}
          {showResults && (
            <div className="w-full flex justify-center animate-slideUp">
              <FixCards
                fixes={fixes}
                onVote={handleVote}
                onVerify={handleVerify}
                onTailorFixStream={handleTailorFixStream}
                isTailoringMap={isTailoringMap}
                cacheHit={cacheHit}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-6 bg-black/40 border-t border-white/5 text-center text-3xs font-mono text-gray-500 backdrop-blur-md mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>© 2026 FIXIT COMMAND CENTER INC. ALL RIGHTS RESERVED.</div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><Shield size={10} /> END-TO-END SECURE</span>
              <span className="flex items-center gap-1"><Globe size={10} /> DISTRIBUTED GRAPH DATABASES</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Websocket Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
