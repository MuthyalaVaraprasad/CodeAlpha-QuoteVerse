import React, { useEffect, useState } from 'react';
import { Sparkles, Quote } from 'lucide-react';

export const Splash: React.FC = () => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
  }, []);

  return (
    <div 
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        position: 'relative'
      }}
    >
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: pulse ? 1 : 0,
          transform: pulse ? 'scale(1)' : 'scale(0.9)',
          transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Glowing Logo Circle */}
        <div 
          style={{
            width: 100,
            height: 100,
            borderRadius: '28px',
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(168, 85, 247, 0.45), 0 0 0 1px rgba(255,255,255,0.1) inset',
            animation: 'pulseGlow 2.5s infinite ease-in-out',
            transform: 'rotate(-5deg)'
          }}
        >
          <Quote size={50} color="white" fill="white" style={{ transform: 'rotate(5deg)' }} />
        </div>

        {/* Text Logo */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <h1 
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '38px',
              fontWeight: 800,
              letterSpacing: '-1px',
              background: 'linear-gradient(to right, #f8fafc, #d946ef, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 4
            }}
          >
            QuoteVerse AI
          </h1>
          <p 
            style={{
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              opacity: 0.8
            }}
          >
            Smart • Personal • Powerful
          </p>
        </div>
      </div>

      {/* Floating Sparkles in Background */}
      <div style={{ position: 'absolute', top: '25%', left: '25%', animation: 'pulseGlow 3s infinite', opacity: 0.3 }}>
        <Sparkles size={20} color="var(--accent-purple)" />
      </div>
      <div style={{ position: 'absolute', bottom: '25%', right: '25%', animation: 'pulseGlow 4s infinite', opacity: 0.3 }}>
        <Sparkles size={16} color="var(--accent-indigo)" />
      </div>

      {/* Loading Indicator */}
      <div 
        style={{
          position: 'absolute',
          bottom: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}
      >
        <div 
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2px solid rgba(168, 85, 247, 0.1)',
            borderTopColor: 'var(--accent-purple)',
            animation: 'loading-skeleton 1s linear infinite',
            // Simple rotational CSS workaround
            transformOrigin: 'center'
          }}
          className="spinner-rotate"
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner-rotate {
            animation: spin 0.8s linear infinite !important;
          }
        `}</style>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.5px' }}>
          Initializing Wisdom...
        </span>
      </div>
    </div>
  );
};
export default Splash;
