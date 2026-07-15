import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Sparkles, Shield, Globe } from 'lucide-react';
import Navbar from './components/Navbar';
import Scene3DBackground from './components/Scene3DBackground';
import HeroConsole from './components/HeroConsole';
import ScanningState from './components/ScanningState';
import FixCardGrid from './components/FixCardGrid';
import AITailorPanel from './components/AITailorPanel';
import LiveActivityFeed from './components/LiveActivityFeed';
import TeamDashboard from './components/TeamDashboard';
import confetti from 'canvas-confetti';

const BACKEND_URL = 'http://localhost:5000';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Custom theme and layout routing states
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' or 'dashboard'
  
  // App Ingestion/Solver States
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [fixes, setFixes] = useState([]);
  const [cacheHit, setCacheHit] = useState(false);
  
  // Drawer states
  const [selectedFix, setSelectedFix] = useState(null);
  const [isTailorOpen, setIsTailorOpen] = useState(false);
  const [isTailoringMap, setIsTailoringMap] = useState({});

  // 1. Dynamic Font Loader (Space Grotesk & JetBrains Mono)
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap';
    document.head.appendChild(link);
    
    // Set theme default classes
    document.documentElement.className = 'dark';
  }, []);

  // 2. Initialize WebSocket network
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

  // Theme Toggler
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.className = nextTheme;
    console.log(`Theme toggled to: ${nextTheme}`);
  };

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

      if (!response.ok) throw new Error('Diagnosis failed');
      const data = await response.json();

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
        // Cycle skeleton loader status messages
        setTimeout(() => {
          setFixes(data.fixes);
          setIsScanning(false);
          setIsSuccess(true);
          setShowResults(true);
        }, 2500);
      }

    } catch (err) {
      console.error(err);
      setIsScanning(false);
      alert('Failed to connect to backend server. Make sure the Node server is running.');
    }
  };

  // API Call: Vote on Fix
  const handleVote = async (fixId, type) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fixes/${fixId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      // Handle double-voting warn toast
      if (response.status === 400) {
        const errorData = await response.json();
        const warnNotif = {
          id: Math.random().toString(),
          message: errorData.error || `Double Vote Blocked: You have already submitted a vote for this patch.`,
          type: 'diagnose', 
          timestamp: new Date().toLocaleTimeString()
        };
        setNotifications((prev) => [warnNotif, ...prev].slice(0, 4));
        return;
      }

      if (!response.ok) throw new Error('Vote failed');
      const updatedFix = await response.json();
      
      // Update fixes state
      setFixes((prev) =>
        prev.map((f) => (f.id === fixId ? { ...f, ...updatedFix } : f))
      );

      // Trigger confetti on upvote success
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

  // API Call: Verify Solution ("This worked for me")
  const handleVerify = async (fixId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fixes/${fixId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 400) {
        const errorData = await response.json();
        const warnNotif = {
          id: Math.random().toString(),
          message: errorData.error || `Verification Blocked: You have already confirmed this patch.`,
          type: 'diagnose', 
          timestamp: new Date().toLocaleTimeString()
        };
        setNotifications((prev) => [warnNotif, ...prev].slice(0, 4));
        return;
      }

      if (!response.ok) throw new Error('Verification failed');
      const updatedFix = await response.json();
      
      // Update state
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

  // SSE Stream API: Stream Tailored solution character-by-character
  const handleTailorFixStream = (fixId, userCode, onChunk, onComplete) => {
    setIsTailoringMap((prev) => ({ ...prev, [fixId]: true }));

    const url = `${BACKEND_URL}/api/fixes/${fixId}/tailor-stream?userCode=${encodeURIComponent(userCode)}`;
    const eventSource = new EventSource(url);
    
    let buffer = '';

    eventSource.onmessage = (event) => {
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
        onChunk(buffer);
      } catch (err) {
        // streaming buffering
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();
      setIsTailoringMap((prev) => ({ ...prev, [fixId]: false }));
    };

    return eventSource;
  };

  const handleOpenTailor = (fix) => {
    setSelectedFix(fix);
    setIsTailorOpen(true);
  };

  const handleDismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleReset = () => {
    setShowResults(false);
    setIsSuccess(false);
    setCacheHit(false);
    setFixes([]);
    setIsTailorOpen(false);
    setSelectedFix(null);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'hero') {
      handleReset();
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden font-sans bg-[#0a0a0f] dark:bg-[#0a0a0f] light:bg-[#f3f4f6] transition-colors duration-300">
      
      {/* 1. Scene3DBackground (pauses when tab inactive, falls back on low end) */}
      {activeTab === 'hero' && (
        <Scene3DBackground isScanning={isScanning} isSuccess={isSuccess} />
      )}

      {/* 2. Main Overlay UI */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigation Navbar */}
        <Navbar 
          theme={theme} 
          onToggleTheme={toggleTheme} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />

        {/* 3. Page Router Container */}
        <main className="flex-1 flex flex-col items-center justify-start px-6 pt-10 pb-16 space-y-12">
          
          {activeTab === 'hero' ? (
            <>
              {/* Slogans Title */}
              {!showResults && !isScanning && (
                <div className="text-center max-w-2xl space-y-4 pt-4 animate-fadeIn">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-2xs mb-2">
                    <Sparkles size={10} /> NEXT-GEN AI DEBUGGING TERMINAL
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-gray-100 to-gray-300 dark:from-white dark:via-gray-100 dark:to-gray-300 light:from-gray-900 light:via-gray-800 light:to-black bg-clip-text text-transparent leading-none font-display">
                    Diagnose Code Errors <span className="text-transparent bg-gradient-to-r from-[#00ffb3] to-cyan-400 bg-clip-text">Instantly.</span>
                  </h1>
                  <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 leading-relaxed max-w-lg mx-auto font-sans">
                    Paste your traceback logs into our floating cyber console. Our AI detects runtime signatures, maps variables, and suggests verified hotfixes.
                  </p>
                </div>
              )}

              {/* Ingestion Console */}
              <HeroConsole
                onDiagnose={handleDiagnose}
                isScanning={isScanning}
                showResults={showResults}
              />

              {/* Loading Scan effects */}
              <ScanningState isScanning={isScanning} />

              {/* Tarot arcing Solution cards */}
              {showResults && (
                <FixCardGrid
                  fixes={fixes}
                  onVote={handleVote}
                  onVerify={handleVerify}
                  onOpenTailor={handleOpenTailor}
                  cacheHit={cacheHit}
                />
              )}
            </>
          ) : (
            // Paid Business analytics
            <TeamDashboard />
          )}

        </main>

        {/* Footer */}
        <footer className="py-6 bg-black/40 border-t border-white/5 dark:border-white/5 light:border-black/5 text-center text-3xs font-mono text-gray-500 backdrop-blur-md mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>© 2026 FIXIT COMMAND CENTER INC. ALL RIGHTS RESERVED.</div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><Shield size={10} /> SECURE LOGS</span>
              <span className="flex items-center gap-1"><Globe size={10} /> QUANTUM TELEMETRY</span>
            </div>
          </div>
        </footer>
      </div>

      {/* 4. Sliding Side Drawer Tailoring Panel */}
      <AITailorPanel
        isOpen={isTailorOpen}
        onClose={() => setIsTailorOpen(false)}
        fix={selectedFix}
        onTailorFixStream={handleTailorFixStream}
        isTailoring={Object.values(isTailoringMap).some(Boolean)}
      />

      {/* 5. Live Activity Toast stacking feeds */}
      <LiveActivityFeed
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
      
      {/* Dynamic font styles injection */}
      <style>{`
        body {
          font-family: 'Space Grotesk', sans-serif;
        }
        pre, code, .font-mono {
          font-family: 'JetBrains Mono', monospace !important;
        }
        .font-display {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 800;
        }
        /* Custom scrollbars */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(10, 10, 15, 0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 179, 0.3);
          border-radius: 2.5px;
        }
      `}</style>

    </div>
  );
}
