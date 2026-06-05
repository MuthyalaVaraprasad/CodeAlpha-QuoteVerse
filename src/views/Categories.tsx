import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Quote } from '../types';
import { CATEGORIES } from '../mockData';
import { GlassCard } from '../components/GlassCard';
import { speakText, stopSpeaking } from '../services/audio';
import { 
  Search, ArrowLeft, Volume2, VolumeX, Copy, 
  Share2, Heart, TrendingUp, Grid
} from 'lucide-react';

export const Categories: React.FC = () => {
  const { quotes, favorites, toggleFavoriteQuote, triggerQuoteReadTrack } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [speakingQuoteId, setSpeakingQuoteId] = useState<string | null>(null);

  // Statistics
  const getCount = (catName: string) => quotes.filter(q => q.category.toLowerCase() === catName.toLowerCase()).length;
  
  const categoryStats = CATEGORIES.map(cat => ({
    name: cat,
    count: getCount(cat)
  }));

  // Filter Categories by search
  const filteredCategories = categoryStats.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recommendations and Popular items
  const trendingCat = categoryStats.sort((a, b) => b.count - a.count)[0];
  const recommendedCats = categoryStats.slice(1, 4);

  // Category Icon assigner helper
  const getCategoryEmoji = (name: string) => {
    switch (name.toLowerCase()) {
      case 'motivation': return '🔥';
      case 'success': return '🏆';
      case 'life': return '🌱';
      case 'study': return '📚';
      case 'leadership': return '👑';
      case 'happiness': return '😊';
      case 'productivity': return '⚡';
      case 'business': return '💼';
      case 'startup': return '🚀';
      case 'ai': return '🤖';
      case 'programming': return '💻';
      case 'finance': return '📈';
      case 'fitness': return '💪';
      case 'self growth': return '🧠';
      case 'creativity': return '🎨';
      default: return '✨';
    }
  };

  const handleCopy = (quote: Quote) => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
    const alertUser = (window as any).alertUser;
    if (alertUser) alertUser("Copied to clipboard!");
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

  // If a specific category is selected, render the details view
  if (selectedCategory) {
    const categoryQuotes = quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s' }}>
        
        {/* Back header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => { setSelectedCategory(null); stopSpeaking(); setSpeakingQuoteId(null); }}
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
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
              {selectedCategory}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {categoryQuotes.length} inspirational quotes found
            </span>
          </div>
        </div>

        {/* Quotes list */}
        {categoryQuotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            No quotes available in this category yet. Create one using the AI Quote Generator!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {categoryQuotes.map(quote => (
              <GlassCard 
                key={quote.id} 
                style={{ padding: 22 }}
                onClick={() => triggerQuoteReadTrack(quote.id)}
              >
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, lineHeight: 1.5, marginBottom: 12 }}>
                  "{quote.text}"
                </p>
                <p style={{ fontSize: 13, color: 'var(--accent-purple)', fontWeight: 600, marginBottom: 16 }}>
                  — {quote.author}
                </p>

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSpeak(quote); }}
                      style={{ background: 'none', border: 'none', color: speakingQuoteId === quote.id ? 'var(--accent-pink)' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {speakingQuoteId === quote.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(quote); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 14 }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleShare(quote); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Share2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavoriteQuote(quote.id); }}
                      style={{ background: 'none', border: 'none', color: favorites.includes(quote.id) ? 'var(--accent-pink)' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Heart size={16} fill={favorites.includes(quote.id) ? 'var(--accent-pink)' : 'none'} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 10 }}>
      
      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Search 15 categories..." 
          className="input-field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: 46 }}
        />
        <Search 
          size={18} 
          color="var(--text-muted)" 
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} 
        />
      </div>

      {/* Category search results statistics */}
      {searchQuery === '' && (
        <>
          {/* Trending Banner */}
          <GlassCard style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <TrendingUp size={16} color="var(--accent-pink)" />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trending Category</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>
                {getCategoryEmoji(trendingCat.name)} {trendingCat.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {trendingCat.count} Quotes Available
              </span>
            </div>
          </GlassCard>

          {/* Category Recommendations */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              Recommendations for you
            </span>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {recommendedCats.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 12,
                    padding: '8px 14px',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{getCategoryEmoji(cat.name)}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Grid of Categories */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Grid size={16} color="var(--accent-purple)" />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
            All Categories
          </span>
        </div>

        {filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            No categories match your search.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {filteredCategories.map(cat => (
              <GlassCard 
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                style={{
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: 'rgba(255,255,255,0.01)'
                }}
              >
                <div style={{ fontSize: 26 }}>
                  {getCategoryEmoji(cat.name)}
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cat.name}
                  </h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {cat.count} Quotes
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default Categories;
