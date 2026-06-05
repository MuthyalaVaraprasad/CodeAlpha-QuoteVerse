import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Quote, Collection } from '../types';
import { GlassCard } from '../components/GlassCard';
import { getCollections, createCollection, addQuoteToCollection } from '../services/db';
import { 
  Heart, FolderPlus, Download, Copy, Share2, 
  Trash2, Folder, Eye, FileText 
} from 'lucide-react';

export const Favorites: React.FC = () => {
  const { user, quotes, favorites, toggleFavoriteQuote, showToast } = useApp();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all' or collectionId
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColIcon] = useState('Folder');

  // Canvas Exporter overlay state
  const [exportQuote, setExportQuote] = useState<Quote | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (user) {
      getCollections(user.uid).then(setCollections);
    }
  }, [user]);

  // Filter quotes belonging to favorites
  const favoriteQuotes = quotes.filter(q => favorites.includes(q.id));

  // Filter quotes by active tab
  let displayedQuotes = favoriteQuotes;
  if (activeTab !== 'all') {
    const col = collections.find(c => c.id === activeTab);
    if (col) {
      displayedQuotes = favoriteQuotes.filter(q => col.quoteIds.includes(q.id));
    }
  }

  // --- Statistics calculations ---
  const totalSaved = favorites.length;
  // Simulated stats
  const mostShared = favoriteQuotes.length > 0 ? favoriteQuotes[0] : null;
  const mostViewedCount = totalSaved > 0 ? Math.max(totalSaved * 4, 15) : 0;

  // --- Collection creation ---
  const handleCreateCollection = async () => {
    if (!user) return;
    if (!newColName.trim()) {
      showToast("Collection name is required.", "error");
      return;
    }
    try {
      const newCol = await createCollection(user.uid, newColName, newColIcon);
      setCollections(prev => [...prev, newCol]);
      setNewColName('');
      setShowAddCollection(false);
      showToast(`Collection "${newColName}" created successfully!`, "success");
    } catch (e) {
      showToast("Failed to create collection.", "error");
    }
  };

  // --- Export Actions ---

  // 1. Export as Text file
  const handleExportText = (quote: Quote) => {
    const content = `"${quote.text}"\n— ${quote.author}\n\nGenerated via QuoteVerse AI`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QuoteVerse_${quote.author.replace(/ /g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded quote as plain text file.", "success");
  };

  // 2. Export as PDF text format representation
  const handleExportPDF = (quote: Quote) => {
    const content = `=========================================\n` +
                    `             QUOTEVERSE AI               \n` +
                    `       Daily Wisdom PDF Exporter         \n` +
                    `=========================================\n\n` +
                    `Quote:\n` +
                    `"${quote.text}"\n\n` +
                    `Author: ${quote.author}\n` +
                    `Category: ${quote.category}\n\n` +
                    `Explanation:\n` +
                    `- Meaning: ${quote.explanation?.meaning || 'Internal growth catalyst.'}\n` +
                    `- Core Lesson: ${quote.explanation?.lesson || 'Action generates its own momentum.'}\n` +
                    `- Action step: ${quote.explanation?.application || 'Practice mindfulness.'}\n\n` +
                    `=========================================\n` +
                    `Generated on ${new Date().toLocaleDateString()}\n` +
                    `Thank you for using QuoteVerse AI!`;
                    
    const blob = new Blob([content], { type: 'application/pdf-alternative;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QuoteVerse_${quote.author.replace(/ /g, '_')}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded PDF representation successfully.", "success");
  };

  // 3. Export as Styled Image using Canvas API
  useEffect(() => {
    if (exportQuote && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background gradient (Purple to Indigo dark theme)
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#0f0a1c');
        grad.addColorStop(0.5, '#180f2d');
        grad.addColorStop(1, '#080510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw glass overlay outline
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        // Draw QuoteVerse AI watermark logo at top
        ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
        ctx.font = '800 16px Outfit, sans-serif';
        ctx.fillText('QUOTEVERSE AI', 40, 50);

        // Draw decorative speech mark
        ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
        ctx.font = '800 120px Outfit, sans-serif';
        ctx.fillText('“', 40, 180);

        // Draw quote text wrapped
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'italic 500 18px Inter, sans-serif';
        const words = `"${exportQuote.text}"`.split(' ');
        let line = '';
        let y = 140;
        const maxWidth = canvas.width - 80;
        const lineHeight = 26;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, 40, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 40, y);

        // Draw Author
        ctx.fillStyle = '#d946ef';
        ctx.font = '600 14px Outfit, sans-serif';
        ctx.fillText(`— ${exportQuote.author}`, 40, y + 36);

        // Draw Category Tag background box
        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.fillRect(40, canvas.height - 65, 120, 26);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.strokeRect(40, canvas.height - 65, 120, 26);

        // Category label
        ctx.fillStyle = '#a855f7';
        ctx.font = '800 10px Inter, sans-serif';
        ctx.fillText(exportQuote.category.toUpperCase(), 50, canvas.height - 48);
      }
    }
  }, [exportQuote]);

  const handleDownloadImage = () => {
    if (canvasRef.current && exportQuote) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `QuoteVerse_${exportQuote.author.replace(/ /g, '_')}.png`;
      link.click();
      setExportQuote(null); // close dialog
      showToast("Downloaded quote graphics card successfully!", "success");
    }
  };

  const handleCopy = (quote: Quote) => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
    showToast("Copied to clipboard!", "success");
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
        console.log(e);
      }
    } else {
      handleCopy(quote);
    }
  };

  // Add quote to collection dialog helpers
  const handleAssignToCollection = async (quoteId: string, colId: string) => {
    if (!user) return;
    try {
      await addQuoteToCollection(user.uid, colId, quoteId);
      // Refresh local list
      const cols = await getCollections(user.uid);
      setCollections(cols);
      showToast("Added quote to collection folder.", "success");
    } catch (e) {
      showToast("Failed to assign quote.", "error");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 10 }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Saved Collections</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Manage favorite quotes and customized graphic cards</p>
      </div>

      {/* 1. Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <GlassCard style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <Heart size={16} color="var(--accent-pink)" style={{ margin: '0 auto 4px auto' }} />
          <div style={{ fontSize: 16, fontWeight: 800 }}>{totalSaved}</div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Total Saved</span>
        </GlassCard>
        <GlassCard style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <Share2 size={16} color="var(--accent-purple)" style={{ margin: '0 auto 4px auto' }} />
          <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mostShared ? mostShared.author : 'None'}
          </div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Most Shared</span>
        </GlassCard>
        <GlassCard style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <Eye size={16} color="var(--accent-indigo)" style={{ margin: '0 auto 4px auto' }} />
          <div style={{ fontSize: 16, fontWeight: 800 }}>{mostViewedCount}</div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Total Views</span>
        </GlassCard>
      </div>

      {/* 2. Collection Folder Tabs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
            Folders
          </span>
          <button 
            onClick={() => setShowAddCollection(!showAddCollection)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--accent-purple)', 
              fontSize: 12, 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <FolderPlus size={14} />
            <span>Create Folder</span>
          </button>
        </div>

        {showAddCollection && (
          <GlassCard style={{ marginBottom: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} className="animate-fade-in">
            <span style={{ fontSize: 12, fontWeight: 700 }}>New Collection Folder</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                placeholder="Folder Name (e.g. Daily Inspiration)" 
                className="input-field" 
                value={newColName} 
                onChange={(e) => setNewColName(e.target.value)} 
                style={{ flex: 1, padding: '10px 14px' }}
              />
              <button className="btn-primary" onClick={handleCreateCollection} style={{ padding: '10px 16px', borderRadius: 12 }}>
                <span>Create</span>
              </button>
            </div>
          </GlassCard>
        )}

        {/* Collections Tab Scroller */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: activeTab === 'all' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: 12,
              padding: '8px 16px',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Favorites ({favoriteQuotes.length})
          </button>
          
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              style={{
                background: activeTab === col.id ? 'var(--accent-purple)' : 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: 12,
                padding: '8px 16px',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Folder size={12} />
              <span>{col.name} ({col.quoteIds.filter(id => favorites.includes(id)).length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Favorites List Display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {displayedQuotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            No quotes saved in this collection folder. Add favorite quotes using the heart icon on Home!
          </div>
        ) : (
          displayedQuotes.map(quote => (
            <GlassCard key={quote.id} style={{ padding: 20 }}>
              <p style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 8 }}>
                "{quote.text}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--accent-pink)', fontWeight: 600 }}>— {quote.author}</span>
                
                {/* Inline Collection Assigner Select */}
                {collections.length > 0 && (
                  <select 
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignToCollection(quote.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 6,
                      fontSize: 10,
                      color: 'var(--text-secondary)',
                      padding: '2px 6px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" disabled>Add to folder</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <button 
                    onClick={() => handleCopy(quote)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Copy Text"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => handleShare(quote)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Share Link"
                  >
                    <Share2 size={16} />
                  </button>
                  <button 
                    onClick={() => toggleFavoriteQuote(quote.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer' }}
                    title="Unsave Quote"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 14 }}>
                  {/* Export Options */}
                  <button 
                    onClick={() => handleExportText(quote)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Export TXT"
                  >
                    <FileText size={14} />
                    <span>TXT</span>
                  </button>
                  <button 
                    onClick={() => handleExportPDF(quote)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Export PDF representation"
                  >
                    <FileText size={14} color="#f87171" style={{ color: '#f87171' }} />
                    <span>PDF</span>
                  </button>
                  <button 
                    onClick={() => setExportQuote(quote)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Export Image Card"
                  >
                    <Download size={14} color="var(--accent-purple)" />
                    <span>PNG</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Exporter Dialog Overlay */}
      {exportQuote && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 3, 10, 0.9)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            animation: 'fadeIn 0.2s'
          }}
        >
          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 800, textAlign: 'center' }}>Wisdom Card Image Preview</span>
            
            {/* The hidden canvas that does actual drawing, and visual display replica */}
            <canvas 
              ref={canvasRef} 
              width={340} 
              height={380} 
              style={{ 
                width: '100%', 
                borderRadius: 16, 
                boxShadow: '0 10px 30px rgba(168,85,247,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn-secondary" 
                onClick={() => setExportQuote(null)} 
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleDownloadImage}
                style={{ flex: 1 }}
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Favorites;
