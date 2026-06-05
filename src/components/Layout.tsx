import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from './Navbar';
import { Bell, Search, Monitor, Smartphone, Check, X, ShieldAlert, Sparkles, Trophy, Target, Heart } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    view, 
    changeView, 
    notifications, 
    markNotificationAsRead, 
    toast, 
    hideToast,
    devicePreview, 
    setDevicePreview
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy size={16} className="text-amber-400" style={{ color: '#fbbf24' }} />;
      case 'goal': return <Target size={16} className="text-emerald-400" style={{ color: '#34d399' }} />;
      case 'mood': return <Sparkles size={16} className="text-indigo-400" style={{ color: '#818cf8' }} />;
      case 'quote': return <Heart size={16} className="text-rose-400" style={{ color: '#f87171' }} />;
      default: return <Bell size={16} className="text-purple-400" style={{ color: '#a78bfa' }} />;
    }
  };

  const isAuthScreen = ['splash', 'onboarding', 'login'].includes(view);

  return (
    <div className="app-container">
      {/* Settings device toggle button visible on desktop */}
      <button 
        className="settings-device-toggle"
        onClick={() => setDevicePreview(!devicePreview)}
        title="Toggle View Mode"
      >
        {devicePreview ? <Monitor size={16} /> : <Smartphone size={16} />}
        <span>{devicePreview ? "Desktop Web Mode" : "Mobile Frame Mode"}</span>
      </button>

      <div className={`device-frame ${!devicePreview ? 'full-web-mode' : ''}`}>
        <div className="app-shell">
          
          {/* Global Toast Container */}
          {toast && (
            <div className="toast-container">
              <div className="toast animate-fade-in">
                {toast.type === 'success' && <Check size={16} style={{ color: '#22c55e' }} />}
                {toast.type === 'error' && <X size={16} style={{ color: '#ef4444' }} />}
                {toast.type === 'info' && <ShieldAlert size={16} style={{ color: '#3b82f6' }} />}
                <span>{toast.message}</span>
                <button 
                  onClick={hideToast} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-muted)', 
                    marginLeft: 'auto',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Global Header Panel (Hidden on Splash/Onboard/Login) */}
          {!isAuthScreen && (
            <header className="app-header" style={{ padding: '20px 20px 0 20px', marginBottom: '10px' }}>
              <h1 className="app-title-glow" style={{ fontSize: '24px', cursor: 'pointer' }} onClick={() => changeView('home')}>
                QuoteVerse
              </h1>
              <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                <button 
                  onClick={() => changeView('search')}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '50%',
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <Search size={18} />
                </button>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '50%',
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        background: 'var(--accent-pink)',
                        color: 'white',
                        fontSize: 9,
                        fontWeight: 'bold',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div 
                    className="glass-card animate-fade-in"
                    style={{
                      position: 'absolute',
                      top: 48,
                      right: 0,
                      width: 280,
                      maxHeight: 320,
                      overflowY: 'auto',
                      padding: 16,
                      zIndex: 200,
                      borderRadius: 16,
                      background: 'rgba(12, 8, 22, 0.95)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                      border: '1px solid var(--accent-purple)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                        No notifications yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {notifications.map(n => (
                          <div 
                            key={n.id}
                            onClick={() => handleNotificationClick(n.id)}
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              background: n.read ? 'transparent' : 'rgba(168, 85, 247, 0.08)',
                              border: '1px solid rgba(255,255,255,0.03)',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: 8,
                              alignItems: 'flex-start',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ marginTop: 2 }}>{getNotificationIcon(n.type)}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)' }}>{n.title}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{n.body}</div>
                              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{n.timestamp}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </header>
          )}

          {/* Main App Content Viewport */}
          <main className="screen-content">
            {children}
          </main>

          {/* Bottom Nav Bar (Hidden on Auth views) */}
          <Navbar />
        </div>
      </div>
    </div>
  );
};
export default Layout;
