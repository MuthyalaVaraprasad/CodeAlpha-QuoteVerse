import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Flame, BrainCircuit, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const Onboarding: React.FC = () => {
  const { changeView } = useApp();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to Wisdom",
      subtitle: "Daily Motivation",
      description: "Explore handpicked quotes tailored to support your personal growth and mindset journey.",
      icon: Flame,
      iconColor: '#a855f7',
      bullets: [
        "Curated daily quote selections",
        "15 core inspiration domains",
        "Voice read-aloud functionality"
      ]
    },
    {
      title: "AI Wisdom Companion",
      subtitle: "Smart Cognitive Analytics",
      description: "Engage with personalized guides to plan routines, seek perspective, and understand deep conceptual ideas.",
      icon: BrainCircuit,
      iconColor: '#d946ef',
      bullets: [
        "Prompt-based quote generator",
        "Career and productivity coaches",
        "Text emotional analysis"
      ]
    },
    {
      title: "Build Your Collection",
      subtitle: "Organize & Share",
      description: "Gather quotes into organized binders, generate card graphic images, and track your daily consistency.",
      icon: Trophy,
      iconColor: '#6366f1',
      bullets: [
        "Custom collection binders",
        "HTML Canvas card image exporter",
        "Streaks and activity tracker"
      ]
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      changeView('login');
    }
  };

  const handleSkip = () => {
    changeView('login');
  };

  const CurrentIcon = slides[slide].icon;

  return (
    <div 
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 4px 10px 4px',
        animation: 'fadeIn 0.5s ease-out'
      }}
    >
      {/* Top Bar with Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', height: 24 }}>
        {slide < slides.length - 1 && (
          <button 
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Skip
          </button>
        )}
      </div>

      {/* Main Slide Carousel Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', margin: '30px 0' }}>
        <GlassCard 
          key={slide}
          className="animate-fade-in"
          style={{
            width: '100%',
            padding: 30,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}
        >
          {/* Main Visual Icon Container */}
          <div 
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: `rgba(255, 255, 255, 0.03)`,
              border: `1px solid rgba(255,255,255,0.05)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: slides[slide].iconColor,
              marginBottom: 8,
              boxShadow: `0 0 20px ${slides[slide].iconColor}15`
            }}
          >
            <CurrentIcon size={38} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>
            {slides[slide].title}
          </h2>
          
          <h4 style={{ color: slides[slide].iconColor, fontSize: 13, fontWeight: 600, letterSpacing: '0.5px', marginTop: -6 }}>
            {slides[slide].subtitle}
          </h4>

          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: '1.5', margin: '8px 0' }}>
            {slides[slide].description}
          </p>

          {/* List bullets */}
          <div 
            style={{ 
              textAlign: 'left', 
              width: '100%', 
              background: 'rgba(255,255,255,0.01)', 
              borderRadius: 12, 
              padding: '12px 16px', 
              border: '1px solid rgba(255,255,255,0.02)',
              marginTop: 10
            }}
          >
            {slides[slide].bullets.map((bullet, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 12, 
                  color: 'var(--text-primary)', 
                  marginBottom: idx === slides[slide].bullets.length - 1 ? 0 : 8 
                }}
              >
                <Sparkles size={12} color={slides[slide].iconColor} />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Controls Bar */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20
        }}
      >
        {/* Dot Indicators */}
        <div style={{ display: 'flex', gap: 8 }}>
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setSlide(idx)}
              style={{
                width: idx === slide ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: idx === slide 
                  ? `linear-gradient(95deg, var(--accent-purple), var(--accent-pink))`
                  : 'rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Primary Action Button */}
        <button 
          className="btn-primary" 
          onClick={handleNext}
          style={{ width: '100%', padding: '16px 20px', borderRadius: 16 }}
        >
          <span>{slide === slides.length - 1 ? "Get Started" : "Continue"}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
export default Onboarding;
