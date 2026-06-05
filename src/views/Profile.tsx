import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { 
  Flame, LogOut, Save, Bell, Globe, ChevronLeft, 
  ChevronRight, Upload, Download, Clock, 
  Music, Type, RefreshCw
} from 'lucide-react';
import { getActivityCalendar } from '../services/db';

export const Profile: React.FC = () => {
  const { 
    user, 
    logout, 
    favorites, 
    showToast,
    darkMode,
    setDarkMode
  } = useApp();

  const [activityCalendar, setActivityCalendar] = useState<Record<string, number>>({});
  
  // Settings toggle lists (Saved locally)
  const [morningReminder, setMorningReminder] = useState(true);
  const [moodReminder, setMoodReminder] = useState(false);
  const [language, setLanguage] = useState('English');

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || 'Alex Johnson');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || '');

  // --- 15 Extra Customization States ---
  // 1. Custom Greetings text
  const [customGreeting, setCustomGreeting] = useState(() => localStorage.getItem('quoteverse_custom_greetings') || 'Stay inspired, stay motivated.');
  // 2. Accent Color switcher
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('quoteverse_accent_color') || '#a855f7');
  // 3. Font Size Adjuster
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('quoteverse_font_size') || 'medium');
  // 4. Pomodoro Focus Sound
  const [focusSound, setFocusSound] = useState(() => localStorage.getItem('quoteverse_focus_sound') || 'None');
  // 5. Zen Session duration
  const [zenDuration, setZenDuration] = useState(() => localStorage.getItem('quoteverse_zen_duration') || '5');
  // 6. Watermark card toggle
  const [showWatermark, setShowWatermark] = useState(() => localStorage.getItem('quoteverse_watermark') !== 'false');
  // 7. Daily counter cap limit
  const [dailyMixLimit, setDailyMixLimit] = useState(() => localStorage.getItem('quoteverse_mix_limit') || 'Unlimited');
  // 8. Daily quotes time picker
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('quoteverse_reminder_time') || '08:00');

  // --- Real Monthly Calendar States ---
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const avatarsList = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
  ];

  // Dynamic color apply effect
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-purple', accentColor);
    localStorage.setItem('quoteverse_accent_color', accentColor);
  }, [accentColor]);

  // Sync settings when modified
  useEffect(() => {
    localStorage.setItem('quoteverse_custom_greetings', customGreeting);
    localStorage.setItem('quoteverse_font_size', fontSize);
    localStorage.setItem('quoteverse_focus_sound', focusSound);
    localStorage.setItem('quoteverse_zen_duration', zenDuration);
    localStorage.setItem('quoteverse_watermark', showWatermark.toString());
    localStorage.setItem('quoteverse_mix_limit', dailyMixLimit);
    localStorage.setItem('quoteverse_reminder_time', reminderTime);
  }, [customGreeting, fontSize, focusSound, zenDuration, showWatermark, dailyMixLimit, reminderTime]);

  useEffect(() => {
    if (user) {
      setActivityCalendar(getActivityCalendar());
    }
  }, [user]);

  if (!user) return null;

  // Levels and streak freezes removed

  // --- Profile picture local upload (Base64 reader) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Avatar image must be smaller than 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedAvatar(base64);
      
      const localUser = localStorage.getItem('quoteverse_auth_user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        parsed.photoURL = base64;
        localStorage.setItem('quoteverse_auth_user', JSON.stringify(parsed));
        user.photoURL = base64; // sync live context
        showToast("Profile image uploaded successfully!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Save profile username changes
  const handleSaveProfile = () => {
    const localUser = localStorage.getItem('quoteverse_auth_user');
    if (localUser) {
      const parsed = JSON.parse(localUser);
      parsed.name = editName;
      parsed.photoURL = selectedAvatar;
      localStorage.setItem('quoteverse_auth_user', JSON.stringify(parsed));
      user.name = editName;
      showToast("Username updated successfully.", "success");
      setIsEditing(false);
    }
  };

  // --- Backup & Restore ---
  const handleDownloadBackup = () => {
    const backupData = {
      user: localStorage.getItem('quoteverse_auth_user'),
      favorites: localStorage.getItem('quoteverse_favorites'),
      collections: localStorage.getItem('quoteverse_collections'),
      journals: localStorage.getItem('quoteverse_journals'),
      goals: localStorage.getItem('quoteverse_goals'),
      moods: localStorage.getItem('quoteverse_moods'),
      activity: localStorage.getItem('quoteverse_activity')
    };

    const content = JSON.stringify(backupData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QuoteVerse_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Backup exported successfully!", "success");
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        
        Object.keys(backup).forEach(key => {
          const value = backup[key];
          if (value) {
            localStorage.setItem(key === 'activity' ? 'quoteverse_activity' : key, value);
          }
        });

        showToast("Backup restored! Refreshing app...", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showToast("Failed to parse backup uploader.", "error");
      }
    };
    reader.readAsText(file);
  };

  // Reset Account Cache Wipes
  const handleResetAccount = () => {
    if (window.confirm("Are you sure you want to delete all streaks, collections, and settings? This cannot be undone.")) {
      localStorage.clear();
      showToast("All cache wiped. Logging out...", "info");
      setTimeout(() => {
        logout();
      }, 1500);
    }
  };

  // --- RENDER MONTHLY CALENDAR DIALOG ---
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const renderRealCalendar = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Day calculations
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

    const calendarCells = [];

    // Add empty placeholders before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(<div key={`empty-${i}`} className="streak-day-cell" style={{ border: 'none', background: 'none' }} />);
    }

    // Add actual days
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${calYear}-${(calMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const isActive = !!activityCalendar[dateStr];

      calendarCells.push(
        <div 
          key={`day-${day}`} 
          className={`streak-day-cell ${isActive ? 'active' : ''}`}
          title={isActive ? `${activityCalendar[dateStr]} actions recorded` : 'No activity'}
        >
          {day}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Month selector header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {monthNames[calMonth]} {calYear}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={handlePrevMonth}
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={handleNextMonth}
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Days labels header row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
            {weekdays.map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {calendarCells}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 10 }} className="animate-fade-in">
      
      {/* 1. Header Profile Box */}
      <GlassCard style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={selectedAvatar || user.photoURL} 
              alt="Profile Avatar" 
              style={{ width: 76, height: 76, borderRadius: '50%', border: '2.5px solid var(--accent-purple)', objectFit: 'cover' }}
            />
            
            {/* Custom file image selector trigger button overlay */}
            <label 
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: 'var(--accent-purple)',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1.5px solid #080510',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
              title="Upload Photo"
            >
              <Upload size={12} color="white" />
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  style={{ padding: '6px 12px', fontSize: 14 }}
                />
                
                {/* Illustrated Avatar selectors */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {avatarsList.map((av, idx) => (
                    <img 
                      key={idx}
                      src={av} 
                      onClick={() => setSelectedAvatar(av)}
                      style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        cursor: 'pointer',
                        border: selectedAvatar === av ? '2px solid var(--accent-purple)' : 'none',
                        objectFit: 'cover'
                      }} 
                    />
                  ))}
                </div>

                <button className="btn-primary" onClick={handleSaveProfile} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, width: 'fit-content' }}>
                  <Save size={12} />
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>
                  {user.name}
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', margin: '2px 0 6px 0' }}>
                  {user.email}
                </span>
                <span 
                  onClick={() => setIsEditing(true)} 
                  style={{ fontSize: 11, color: 'var(--accent-purple)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Edit Profile
                </span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 2. Numerical Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ textAlign: 'center', background: 'var(--bg-glass)', padding: '10px 4px', borderRadius: 12, border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{user.readingHistory.length}</div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Read</span>
        </div>
        <div style={{ textAlign: 'center', background: 'var(--bg-glass)', padding: '10px 4px', borderRadius: 12, border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{favorites.length}</div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Saved</span>
        </div>
        <div style={{ textAlign: 'center', background: 'var(--bg-glass)', padding: '10px 4px', borderRadius: 12, border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{user.daysActive}</div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Active Days</span>
        </div>
        <div style={{ textAlign: 'center', background: 'var(--bg-glass)', padding: '10px 4px', borderRadius: 12, border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{user.collectionsCreated}</div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Folders</span>
        </div>
      </div>

      {/* 3. Streaks & Activity Real Monthly Calendar */}
      <GlassCard style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={15} color="var(--accent-purple)" />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Activity Calendar</span>
          </div>
          <span style={{ fontSize: 11, background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
            {user.daysActive} Day Streak
          </span>
        </div>
        {renderRealCalendar()}
      </GlassCard>

      {/* 4. Reminder Settings */}
      <GlassCard style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
          <Bell size={15} color="var(--accent-purple)" />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Alert & reminder settings</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>Morning Motivation</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Receive quotes of the day</span>
          </div>
          <input type="checkbox" checked={morningReminder} onChange={() => setMorningReminder(!morningReminder)} style={{ cursor: 'pointer', accentColor: 'var(--accent-purple)' }} />
        </div>

        {morningReminder && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 10, marginTop: -6 }} className="animate-fade-in">
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Preferred Time</span>
            <input 
              type="time" 
              value={reminderTime} 
              onChange={(e) => setReminderTime(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: 12,
                outline: 'none'
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>Mood Check Alerts</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Reminders to journal daily mood</span>
          </div>
          <input type="checkbox" checked={moodReminder} onChange={() => setMoodReminder(!moodReminder)} style={{ cursor: 'pointer', accentColor: 'var(--accent-purple)' }} />
        </div>
      </GlassCard>

      {/* 5. Preferences & Custom Settings (10-15 Extra features) */}
      <GlassCard style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
          <Globe size={15} color="var(--accent-indigo)" />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Advanced custom options</span>
        </div>

        {/* 1. Custom Greetings input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Personalized Greetings message:</span>
          <input 
            type="text" 
            className="input-field" 
            value={customGreeting} 
            onChange={(e) => setCustomGreeting(e.target.value)} 
            placeholder="e.g. Dream big, act daily."
            style={{ padding: '8px 12px', fontSize: 13 }}
          />
        </div>

        {/* 2. Theme Accent Color selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Theme Accent Color</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#a855f7', '#6366f1', '#10b981', '#f43f5e', '#3b82f6'].map(color => (
              <div 
                key={color}
                onClick={() => setAccentColor(color)}
                style={{ 
                  width: 18, 
                  height: 18, 
                  borderRadius: '50%', 
                  background: color, 
                  cursor: 'pointer',
                  border: accentColor === color ? '2px solid white' : '1px solid rgba(0,0,0,0.4)',
                  boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                }}
              />
            ))}
          </div>
        </div>

        {/* 3. Font Size Adjuster */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}><Type size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Font Size</span>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, padding: '4px 8px', outline: 'none' }}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </div>

        {/* 4. Pomodoro Ambient Sound */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}><Music size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Focus Audio Sound</span>
          <select value={focusSound} onChange={(e) => setFocusSound(e.target.value)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, padding: '4px 8px', outline: 'none' }}>
            <option value="None">None</option>
            <option value="Rain">Rain Ambient</option>
            <option value="Forest">Forest Birds</option>
            <option value="WhiteNoise">White Noise</option>
          </select>
        </div>

        {/* 5. Zen Session Timer duration */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}><Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Zen Breathing Timer</span>
          <select value={zenDuration} onChange={(e) => setZenDuration(e.target.value)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, padding: '4px 8px', outline: 'none' }}>
            <option value="2">2 Minutes</option>
            <option value="5">5 Minutes</option>
            <option value="10">10 Minutes</option>
          </select>
        </div>

        {/* 6. Card Watermark display switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Show Cards Watermark</span>
          <input type="checkbox" checked={showWatermark} onChange={() => setShowWatermark(!showWatermark)} style={{ cursor: 'pointer', accentColor: 'var(--accent-purple)' }} />
        </div>

        {/* 7. Mixer Cap Limit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Daily Mixer Cap</span>
          <select value={dailyMixLimit} onChange={(e) => setDailyMixLimit(e.target.value)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, padding: '4px 8px', outline: 'none' }}>
            <option value="10">10 Quotes</option>
            <option value="50">50 Quotes</option>
            <option value="100">100 Quotes</option>
            <option value="Unlimited">Unlimited</option>
          </select>
        </div>

        {/* General switches */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Dark Theme</span>
          <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} style={{ cursor: 'pointer', accentColor: 'var(--accent-purple)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>App Language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, padding: '4px 8px', outline: 'none' }}>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
          </select>
        </div>
      </GlassCard>

      {/* 6. Data Backup & Reset actions */}
      <GlassCard style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Data Sync & local backup</span>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={handleDownloadBackup}
            style={{
              flex: 1,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 12,
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Download size={14} />
            <span>Backup</span>
          </button>

          <label 
            style={{
              flex: 1,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 12,
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Upload size={14} />
            <span>Restore</span>
            <input type="file" accept=".json" onChange={handleRestoreBackup} style={{ display: 'none' }} />
          </label>
        </div>

        <button 
          onClick={handleResetAccount}
          style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <RefreshCw size={14} />
          <span>Wipe Local Data Cache</span>
        </button>
      </GlassCard>

      {/* 7. Action Controls Dashboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Logout */}
        <button 
          onClick={logout}
          style={{ 
            width: '100%', 
            padding: '12px 18px', 
            borderRadius: 14, 
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
          className="logout-btn-hover"
        >
          <LogOut size={15} />
          <span>Logout Session</span>
        </button>
      </div>

      {/* Style injection */}
      <style>{`
        .logout-btn-hover:hover {
          background: rgba(239, 68, 68, 0.15) !important;
        }
      `}</style>
    </div>
  );
};
export default Profile;
