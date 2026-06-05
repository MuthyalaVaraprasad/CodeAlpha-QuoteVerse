import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Quote, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const Login: React.FC = () => {
  const { login, loading, changeView } = useApp();
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await login();
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const isBtnLoading = loading || authLoading;

  return (
    <div 
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '30px 10px 20px 10px',
        animation: 'fadeIn 0.5s ease-out'
      }}
    >
      {/* Top Bar with Back Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', height: 32 }}>
        <button 
          onClick={() => changeView('onboarding')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-glass)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
          title="Back to Onboarding"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      {/* Main Logo and Card Section */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20
        }}
      >
        {/* Animated App Icon */}
        <div 
          style={{
            width: 84,
            height: 84,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(168, 85, 247, 0.35)',
            transform: 'rotate(-4deg)',
            marginBottom: 8
          }}
        >
          <Quote size={40} color="white" fill="white" style={{ transform: 'rotate(4deg)' }} />
        </div>

        {/* Welcome titles */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800 }}>
            Welcome Back!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
            Sign in to access your QuoteVerse
          </p>
        </div>

        {/* OAuth Google button card */}
        <GlassCard 
          style={{ 
            width: '100%', 
            padding: 24, 
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >

          <button
            onClick={handleGoogleSignIn}
            disabled={isBtnLoading}
            style={{
              width: '100%',
              background: 'white',
              border: 'none',
              borderRadius: '16px',
              color: '#0f172a',
              padding: '16px 20px',
              fontSize: '15px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              cursor: isBtnLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              opacity: isBtnLoading ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (!isBtnLoading) {
                e.currentTarget.style.transform = 'scale(1.01)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            }}
          >
            {isBtnLoading ? (
              <>
                <div 
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid rgba(0, 0, 0, 0.1)',
                    borderTopColor: '#0f172a',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <span>Connecting Account...</span>
              </>
            ) : (
              <>
                {/* Beautiful multi-colored Google SVG icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.63-1.09-1.39-1.19-2.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </GlassCard>
      </div>

      {/* Footer Legal Terms links */}
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: 260, margin: '0 auto' }}>
          By continuing, you agree to our <br />
          <a href="#terms" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>Terms of Service</a> &amp; <a href="#privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>
      </div>

      {/* Spin animation utility style injection */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
export default Login;
