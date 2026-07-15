import './globals.css';
import React from 'react';

export const metadata = {
  title: 'FixIt – Universal Error & Bug Resolution Hub',
  description: 'Production-ready error monitoring and AI-assisted troubleshooting hub.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="navbar glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1.2rem',
              color: '#fff',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}>FI</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>FixIt</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Error & Bug Resolution Hub</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} className="glow-active"></div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System Active</span>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              AD
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
