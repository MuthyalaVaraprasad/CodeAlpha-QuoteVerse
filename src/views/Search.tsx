import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Quote } from '../types';
import { GlassCard } from '../components/GlassCard';
import { speakText, stopSpeaking } from '../services/audio';
import { voiceListenerInstance } from '../services/audio';
import { 
  Search as SearchIcon, ArrowLeft, Mic, MicOff, Clock, 
  Flame, Volume2, VolumeX, Copy, Heart, X 
} from 'lucide-react';

export const SearchScreen: React.FC = () => {
  const { quotes, favorites, toggleFavoriteQuote, triggerQuoteReadTrack, goBack, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speakingQuoteId, setSpeakingQuoteId] = useState<string | null>(null);

  const KEY_RECENT_SEARCHES = 'quoteverse_recent_searches';

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem(KEY_RECENT_SEARCHES);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const trendingSearches = ['Steve Jobs', 'Success', 'Productivity', 'Self Growth', 'AI'];

  // Smart suggestions (based on matching categories or authors)
  const suggestions = query.trim().length > 0
    ? Array.from(new Set([
        ...quotes.filter(q => q.author.toLowerCase().includes(query.toLowerCase())).map(q => q.author),
        ...quotes.filter(q => q.category.toLowerCase().includes(query.toLowerCase())).map(q => q.category)
      ])).slice(0, 4)
    : [];

  // Core Search Logic
  const filteredQuotes = query.trim().length === 0
    ? []
    : quotes.filter(q => 
        q.text.toLowerCase().includes(query.toLowerCase()) ||
        q.author.toLowerCase().includes(query.toLowerCase()) ||
        q.category.toLowerCase().includes(query.toLowerCase())
      );

  const handleSearchSubmit = (searchVal: string) => {
    const term = searchVal.trim();
    if (!term) return;
    
    setQuery(term);
    
    // Add to recents
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem(KEY_RECENT_SEARCHES, JSON.stringify(updated));
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
    localStorage.removeItem(KEY_RECENT_SEARCHES);
    showToast("Cleared search history.", "info");
  };

  // Voice search action
  const toggleVoiceSearch = () => {
    if (!voiceListenerInstance.isSupported()) {
      showToast("Speech recognition is not supported in this browser.", "error");
      return;
    }

    if (isListening) {
      voiceListenerInstance.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      showToast("Listening for search term...", "info");
      voiceListenerInstance.start({
        onResult: (text) => {
          setQuery(text);
          handleSearchSubmit(text);
          setIsListening(false);
        },
        onError: (err) => {
          console.error(err);
          setIsListening(false);
          showToast("Could not recognize speech.", "error");
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
    }
  };

  // Quote Actions
  const handleCopy = (quote: Quote) => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
    showToast("Copied to clipboard!", "success");
  };

  const handleSpeak = (quote: Quote) => {
    if (speakingQuoteId === quote.id) {
      stopSpeaking();
      setSpeakingQuoteId(null);
    } else {
      setSpeakingQuoteId(quote.id);
      speakText(quote.text, undefined, () => setSpeakingQuoteId(null));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 10 }} className="animate-fade-in">
      
      {/* Search Header Input bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button 
          onClick={() => { goBack(); stopSpeaking(); }}
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
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search quotes, categories..." 
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit(query);
            }}
            style={{ paddingLeft: 42, paddingRight: 42 }}
          />
          <SearchIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          
          <button 
            onClick={toggleVoiceSearch}
            style={{ 
              position: 'absolute', 
              right: 14, 
              top: '50%', 
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isListening ? '#ef4444' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
          </button>
        </div>
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => { setQuery(sug); handleSearchSubmit(sug); }}
              style={{
                background: 'rgba(168,85,247,0.08)',
                border: '1px solid var(--border-glass)',
                borderRadius: 12,
                padding: '6px 12px',
                color: 'var(--accent-purple)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ✨ {sug}
            </button>
          ))}
        </div>
      )}

      {/* Main viewport logic */}
      {query.trim().length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
                  Recent Searches
                </span>
                <button 
                  onClick={handleClearRecents}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentSearches.map((term, i) => (
                  <div 
                    key={i}
                    onClick={() => { setQuery(term); handleSearchSubmit(term); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                      <Clock size={14} />
                      <span>{term}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = recentSearches.filter(s => s !== term);
                        setRecentSearches(updated);
                        localStorage.setItem(KEY_RECENT_SEARCHES, JSON.stringify(updated));
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
              Trending Searches
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {trendingSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(term); handleSearchSubmit(term); }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 12,
                    padding: '8px 14px',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Flame size={12} color="var(--accent-pink)" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      ) : (
        // Results
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Search Results ({filteredQuotes.length})
          </span>

          {filteredQuotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
              No quotes matched your search query. Try another keyword.
            </div>
          ) : (
            filteredQuotes.map(quote => (
              <GlassCard 
                key={quote.id} 
                style={{ padding: 18 }}
                onClick={() => triggerQuoteReadTrack(quote.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>
                    {quote.category}
                  </span>
                </div>
                <p style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 10 }}>
                  "{quote.text}"
                </p>
                <p style={{ fontSize: 12, color: 'var(--accent-pink)', fontWeight: 600, marginBottom: 12 }}>
                  — {quote.author}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSpeak(quote); }}
                      style={{ background: 'none', border: 'none', color: speakingQuoteId === quote.id ? 'var(--accent-pink)' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {speakingQuoteId === quote.id ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(quote); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavoriteQuote(quote.id); }}
                    style={{ background: 'none', border: 'none', color: favorites.includes(quote.id) ? 'var(--accent-pink)' : 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Heart size={15} fill={favorites.includes(quote.id) ? 'var(--accent-pink)' : 'none'} />
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

    </div>
  );
};
export default SearchScreen;
