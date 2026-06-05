import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Quote } from '../types';
import { GlassCard } from '../components/GlassCard';
import { speakText, stopSpeaking } from '../services/audio';
import { 
  Copy, Share2, Heart, Volume2, Sparkles, Flame, 
  RotateCw, ArrowLeft, VolumeX, Eye, BookOpen 
} from 'lucide-react';

export const Home: React.FC = () => {
  const { 
    quotes, 
    favorites, 
    toggleFavoriteQuote, 
    triggerQuoteReadTrack, 
    user,
    changeView 
  } = useApp();

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');
  const touchStart = useRef<number>(0);

  // Quote of the Day (locked based on today's calendar date)
  const qotd: Quote = quotes.length > 0 
    ? quotes[new Date().getDate() % quotes.length] 
    : { id: 'q_default', text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", category: "Life" };

  // Filter lists
  const trendingQuotes = quotes.filter(q => q.isTrending).slice(0, 3);
  const aiRecommended = quotes.filter(q => q.isAIRecommended).slice(0, 2);

  // Map recently viewed
  const recentlyViewed = user && user.readingHistory
    ? user.readingHistory
        .map(h => quotes.find(q => q.id === h.quoteId))
        .filter((q): q is Quote => !!q)
        .slice(0, 3)
    : [];

  useEffect(() => {
    if (quotes.length > 0) {
      // Seed initial home quote
      const randIdx = Math.floor(Math.random() * quotes.length);
      setCurrentQuoteIndex(randIdx);
      // Track read history for initial quote
      triggerQuoteReadTrack(quotes[randIdx].id);
    }
  }, [quotes]);

  const activeQuote = quotes[currentQuoteIndex] || qotd;

  const handleNextQuote = () => {
    if (quotes.length === 0) return;
    stopSpeaking();
    setIsSpeaking(false);
    setSlideDirection('left');
    
    setTimeout(() => {
      const nextIdx = (currentQuoteIndex + 1) % quotes.length;
      setCurrentQuoteIndex(nextIdx);
      triggerQuoteReadTrack(quotes[nextIdx].id);
      setSlideDirection('none');
    }, 200);
  };

  const handlePrevQuote = () => {
    if (quotes.length === 0) return;
    stopSpeaking();
    setIsSpeaking(false);
    setSlideDirection('right');
    
    setTimeout(() => {
      const prevIdx = (currentQuoteIndex - 1 + quotes.length) % quotes.length;
      setCurrentQuoteIndex(prevIdx);
      triggerQuoteReadTrack(quotes[prevIdx].id);
      setSlideDirection('none');
    }, 200);
  };

  // Swiping controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;
    if (diff > 50) {
      handleNextQuote(); // swiped left -> next
    } else if (diff < -50) {
      handlePrevQuote(); // swiped right -> prev
    }
  };

  // Copy Quote Action
  const handleCopy = (quote: Quote) => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
    // Show toast is triggered inside context or custom trigger
    const alertUser = (window as any).alertUser;
    if (alertUser) alertUser("Copied to clipboard!");
  };

  // Speak Quote Action
  const handleSpeak = (quote: Quote) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(quote.text, undefined, () => setIsSpeaking(false));
    }
  };

  // Share Quote Action
  const handleShare = async (quote: Quote) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QuoteVerse AI`,
          text: `"${quote.text}" — ${quote.author}`,
          url: window.location.href
        });
      } catch (e) {
        console.log("Sharing cancelled:", e);
      }
    } else {
      handleCopy(quote);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 10 }}>
      
      {/* 1. Quote of the Day Panel */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Sparkles size={16} color="var(--accent-pink)" />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
            Quote Of The Day
          </span>
        </div>
        <GlassCard 
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.25)'
          }}
          onClick={() => triggerQuoteReadTrack(qotd.id)}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, lineHeight: 1.5, fontStyle: 'italic', marginBottom: 12 }}>
            "{qotd.text}"
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--accent-pink)', fontWeight: 600 }}>
              — {qotd.author}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSpeak(qotd); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Volume2 size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavoriteQuote(qotd.id); }}
                style={{ background: 'none', border: 'none', color: favorites.includes(qotd.id) ? 'var(--accent-pink)' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Heart size={16} fill={favorites.includes(qotd.id) ? 'var(--accent-pink)' : 'none'} />
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 2. Interactive Random Card Swiper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={16} color="var(--accent-purple)" />
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              Inspiration Mixer
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Swipe to explore</span>
        </div>

        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 'var(--border-radius-lg)',
            transition: 'all 0.2s ease-out',
            transform: slideDirection === 'left' ? 'translateX(-100px) scale(0.95)' : slideDirection === 'right' ? 'translateX(100px) scale(0.95)' : 'none',
            opacity: slideDirection !== 'none' ? 0.3 : 1
          }}
        >
          <GlassCard style={{ minHeight: 210, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 28 }}>
            
            {/* Top Category Tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span 
                style={{ 
                  background: 'rgba(168, 85, 247, 0.15)', 
                  border: '1px solid rgba(168, 85, 247, 0.3)', 
                  borderRadius: 20, 
                  padding: '4px 12px', 
                  fontSize: 10, 
                  fontWeight: 700, 
                  color: 'var(--accent-purple)',
                  textTransform: 'uppercase'
                }}
              >
                {activeQuote.category}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Eye size={12} /> {Math.floor(Math.random() * 200) + 50}
              </span>
            </div>

            {/* Core Quote Body */}
            <p 
              style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: 18, 
                fontWeight: 700, 
                lineHeight: 1.5, 
                marginBottom: 20,
                color: 'var(--text-primary)'
              }}
            >
              "{activeQuote.text}"
            </p>

            {/* Author */}
            <p style={{ fontSize: 14, color: 'var(--accent-purple)', fontWeight: 600, marginBottom: 20 }}>
              — {activeQuote.author}
            </p>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <button 
                  onClick={() => handleSpeak(activeQuote)} 
                  style={{ background: 'none', border: 'none', color: isSpeaking ? 'var(--accent-pink)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Listen Quote"
                >
                  {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{isSpeaking ? "Mute" : "Listen"}</span>
                </button>
                <button 
                  onClick={() => handleCopy(activeQuote)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Copy Quote"
                >
                  <Copy size={18} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>Copy</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <button 
                  onClick={() => handleShare(activeQuote)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Share Quote"
                >
                  <Share2 size={18} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>Share</span>
                </button>
                <button 
                  onClick={() => toggleFavoriteQuote(activeQuote.id)}
                  style={{ background: 'none', border: 'none', color: favorites.includes(activeQuote.id) ? 'var(--accent-pink)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Save Quote"
                >
                  <Heart size={18} fill={favorites.includes(activeQuote.id) ? 'var(--accent-pink)' : 'none'} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>Save</span>
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Carousel buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button 
            className="btn-secondary" 
            onClick={handlePrevQuote}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12 }}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>
          <button 
            className="btn-primary" 
            onClick={handleNextQuote}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12 }}
          >
            <span>Next Quote</span>
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* 3. AI Recommended Panel */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="var(--accent-pink)" />
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              AI Smart Recommended
            </span>
          </div>
          <button 
            onClick={() => changeView('ai_smart')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            See AI Smart
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {aiRecommended.map(quote => (
            <GlassCard 
              key={quote.id} 
              style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.01)' }}
              onClick={() => triggerQuoteReadTrack(quote.id)}
            >
              <p style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 8 }}>
                "{quote.text}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {quote.author}</span>
                <span style={{ fontSize: 9, background: 'rgba(217, 70, 239, 0.15)', color: 'var(--accent-pink)', border: '1px solid rgba(217, 70, 239, 0.2)', padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', fontWeight: 700 }}>
                  99% Match
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* 4. Trending Quotes Slider */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Flame size={16} color="var(--accent-purple)" />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
            Trending Quotes
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trendingQuotes.map(quote => (
            <div 
              key={quote.id} 
              onClick={() => {
                const idx = quotes.findIndex(q => q.id === quote.id);
                if (idx > -1) {
                  setCurrentQuoteIndex(idx);
                  triggerQuoteReadTrack(quote.id);
                }
              }}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="trending-quote-row"
            >
              <div 
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(168,85,247,0.1)',
                  color: 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                #
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>
                  "{quote.text}"
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {quote.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recently Viewed Quotes */}
      {recentlyViewed.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BookOpen size={16} color="var(--accent-indigo)" />
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              Recently Viewed
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            {recentlyViewed.map(quote => (
              <GlassCard 
                key={quote.id}
                onClick={() => {
                  const idx = quotes.findIndex(q => q.id === quote.id);
                  if (idx > -1) {
                    setCurrentQuoteIndex(idx);
                    triggerQuoteReadTrack(quote.id);
                  }
                }}
                style={{
                  minWidth: 180,
                  width: 180,
                  padding: 14,
                  background: 'rgba(255,255,255,0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 110
                }}
              >
                <p style={{ fontSize: 11, fontStyle: 'italic', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{quote.text}"
                </p>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                  — {quote.author}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Style injection for trending hover */}
      <style>{`
        .trending-quote-row:hover {
          background: rgba(168,85,247,0.05) !important;
          border-color: rgba(168,85,247,0.3) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
};
export default Home;
