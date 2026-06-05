import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { askAISmart } from '../services/ai';
import { GlassCard } from '../components/GlassCard';
import { 
  Sparkles, BrainCircuit, Briefcase, Clock, Heart, 
  BookOpen, Target, Compass, BookOpenCheck, Rss, Mic, 
  ArrowLeft, Check, Play, Pause, RotateCcw, 
  Plus, ChevronRight, MicOff
} from 'lucide-react';
import { 
  getGoals, saveGoal, getJournals, addJournal, 
  addMoodRecord, addNotification, trackActivity
} from '../services/db';
import type { Goal, JournalEntry, MoodRecord, Quote } from '../types';
import { speakText, voiceListenerInstance } from '../services/audio';

type AIFeatureType = 
  | null 
  | 'generator' 
  | 'career' 
  | 'productivity' 
  | 'mood' 
  | 'journal' 
  | 'goals' 
  | 'vision' 
  | 'explainer' 
  | 'feed' 
  | 'voice';

export const AISmart: React.FC = () => {
  const { user, showToast, quotes } = useApp();
  const [activeFeature, setActiveFeature] = useState<AIFeatureType>(null);
  const [loading, setLoading] = useState(false);

  // --- Sub-Feature States ---
  // 1. AI Quote Generator
  const [genTopic, setGenTopic] = useState('Motivation');
  const [genMood, setGenMood] = useState('Optimistic');
  const [genGoal, setGenGoal] = useState('Build a Habit');
  const [genProfession] = useState('Creative Professional');
  const [generatedQuote, setGeneratedQuote] = useState<Omit<Quote, 'id'> | null>(null);

  // 2. Career Coach
  const [careerTab, setCareerTab] = useState<'roadmap' | 'resume' | 'interview'>('roadmap');
  const [careerProfession, setCareerProfession] = useState('Software Engineer');
  const [careerPrompt, setCareerPrompt] = useState('');
  const [careerResult, setCareerResult] = useState('');

  // 3. Productivity Coach
  const [prodGoal, setProdGoal] = useState('');
  const [prodResult, setProdResult] = useState('');
  // Pomodoro Timer
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoActive, setPomoActive] = useState(false);
  const pomoTimer = useRef<any>(null);

  // 4. Mood Analyzer
  const [moodText, setMoodText] = useState('');
  const [moodResult, setMoodResult] = useState<MoodRecord | null>(null);

  // 5. AI Journal
  const [journalText, setJournalText] = useState('');
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [showJournalReport, setShowJournalReport] = useState(false);

  // 6. Goal Planner
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Personal');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newMilestonesText, setNewMilestonesText] = useState('');

  // 7. Vision Board
  const [visionBoard, setVisionBoard] = useState({
    career: 'Lead a cross-functional design team.',
    life: 'Build a peaceful home surrounded by nature.',
    startup: 'Launch a self-sustaining micro-SaaS platform.',
    roadmap: 'Phase 1: Upskill; Phase 2: Launch Beta; Phase 3: Bootstrap.'
  });
  const [isEditingVision, setIsEditingVision] = useState(false);

  // 8. Quote Explainer
  const [explainText, setExplainText] = useState('');
  const [explainedQuote, setExplainedQuote] = useState<Quote['explanation'] | null>(null);

  // 9. Personal Feed
  const [personalInterests, setPersonalInterests] = useState('Technology, Mindfulness, Self Growth');
  const [feedQuotes, setFeedQuotes] = useState<Quote[]>([]);

  // 10. Voice Assistant
  const [voiceInputText, setVoiceInputText] = useState('');
  const [voiceIsListening, setVoiceIsListening] = useState(false);
  const [voiceAIResponse, setVoiceAIResponse] = useState('Tap the microphone and ask for motivation or search quotes.');

  // Load User Data for Journals & Goals
  useEffect(() => {
    if (user) {
      getJournals(user.uid).then(setJournals);
      getGoals(user.uid).then(setGoals);
    }
  }, [user]);

  // Pomodoro Counter
  useEffect(() => {
    if (pomoActive) {
      pomoTimer.current = setInterval(() => {
        setPomoTime(prev => {
          if (prev <= 1) {
            clearInterval(pomoTimer.current);
            setPomoActive(false);
            if (user) {
              addNotification(user.uid, {
                title: '🍅 Focus Session Completed!',
                body: 'Your 25-minute Pomodoro block has ended. Take a 5-minute break!',
                type: 'goal'
              });
            }
            showToast("Focus session complete! Time to rest.", "success");
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(pomoTimer.current);
    }
    return () => clearInterval(pomoTimer.current);
  }, [pomoActive]);

  const togglePomo = () => setPomoActive(!pomoActive);
  const resetPomo = () => {
    setPomoActive(false);
    setPomoTime(25 * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Back button helper
  const handleBack = () => {
    setActiveFeature(null);
    setLoading(false);
    // clean results if needed
  };

  // --- Sub-Feature Actions ---

  // 1. Generate Quote
  const handleGenerateQuote = async () => {
    if (!user) return;
    setLoading(true);
    setGeneratedQuote(null);
    try {
      const response = await askAISmart(user.uid, 'generator', '', {
        topic: genTopic,
        mood: genMood,
        goal: genGoal,
        category: genTopic,
        profession: genProfession
      });
      const parsed = JSON.parse(response);
      setGeneratedQuote(parsed);
      trackActivity(user.uid);
    } catch (e) {
      showToast("Generation failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Career Coach AI
  const handleCareerCoach = async () => {
    if (!user) return;
    setLoading(true);
    setCareerResult('');
    try {
      const prompt = `Provide ${careerTab} advice for a ${careerProfession}. Prompt input: "${careerPrompt}"`;
      const response = await askAISmart(user.uid, 'career', prompt, {
        feature: careerTab,
        profession: careerProfession
      });
      setCareerResult(response);
    } catch (e) {
      showToast("Career advisor failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 3. Productivity Coach
  const handleProductivityCoach = async () => {
    if (!user) return;
    setLoading(true);
    setProdResult('');
    try {
      const prompt = `Create a productivity schedule and focus advice for this target: "${prodGoal}"`;
      const response = await askAISmart(user.uid, 'productivity', prompt, {
        goal: prodGoal
      });
      setProdResult(response);
    } catch (e) {
      showToast("Productivity planning failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 4. Mood Analyzer
  const handleMoodAnalysis = async () => {
    if (!user) return;
    if (!moodText.trim()) {
      showToast("Please enter your thoughts first.", "error");
      return;
    }
    setLoading(true);
    setMoodResult(null);
    try {
      const response = await askAISmart(user.uid, 'mood', moodText);
      const parsed = JSON.parse(response);
      
      const record = await addMoodRecord(user.uid, {
        date: new Date().toLocaleDateString(),
        thoughts: moodText,
        score: parsed.score,
        label: parsed.label,
        analysis: parsed.analysis,
        recommendations: parsed.recommendations,
        suggestedQuoteIds: parsed.suggestedQuoteIds || []
      });
      setMoodResult(record);
    } catch (e) {
      showToast("Mood analysis failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 5. AI Journal Logger
  const handleAddJournal = async () => {
    if (!user) return;
    if (!journalText.trim()) {
      showToast("Please write something in your journal.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await askAISmart(user.uid, 'journal', journalText);
      const parsed = JSON.parse(response);

      const entry = await addJournal(user.uid, {
        date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        text: journalText,
        sentiment: {
          score: parsed.score,
          label: parsed.label,
          analysis: parsed.analysis
        }
      });
      setJournals(prev => [entry, ...prev]);
      setJournalText('');
      showToast("Journal entry added with AI Analysis!", "success");
    } catch (e) {
      showToast("Journal analysis failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 6. Goal Planner Target Creator
  const handleAddGoal = async () => {
    if (!user) return;
    if (!newGoalTitle.trim() || !newGoalTarget.trim()) {
      showToast("Title and Target date are required.", "error");
      return;
    }

    const milestoneTitles = newMilestonesText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const goalId = `gol_${Date.now()}`;
    const newGoal: Goal = {
      id: goalId,
      title: newGoalTitle,
      category: newGoalCategory,
      targetDate: newGoalTarget,
      milestones: milestoneTitles.map((title, idx) => ({
        id: `mil_${goalId}_${idx}`,
        title,
        completed: false
      })),
      progress: 0,
      completed: false
    };

    try {
      await saveGoal(user.uid, newGoal);
      setGoals(prev => [...prev, newGoal]);
      setNewGoalTitle('');
      setNewGoalTarget('');
      setNewMilestonesText('');
      showToast("New Goal added to tracking dashboard!", "success");
    } catch (e) {
      showToast("Failed to create goal.", "error");
    }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const updatedMilestones = goal.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const progress = updatedMilestones.length > 0 
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : 100;
      
      const updatedGoal: Goal = {
        ...goal,
        milestones: updatedMilestones,
        progress,
        completed: progress === 100
      };

      await saveGoal(user.uid, updatedGoal);
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      
      if (updatedGoal.completed) {
        showToast(`🎉 Goal "${goal.title}" fully completed!`, "success");
        addNotification(user.uid, {
          title: '🔥 Goal Accomplished!',
          body: `Congratulations, you completed all milestones for: ${goal.title}`,
          type: 'goal'
        });
      }
    }
  };

  // 8. Quote Explainer
  const handleExplainQuote = async () => {
    if (!user) return;
    if (!explainText.trim()) {
      showToast("Enter a quote first.", "error");
      return;
    }
    setLoading(true);
    setExplainedQuote(null);
    try {
      const response = await askAISmart(user.uid, 'explainer', explainText);
      const parsed = JSON.parse(response);
      setExplainedQuote(parsed);
    } catch (e) {
      showToast("Quote explanation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 9. Personal Feed Recommendation Generator
  const handleGeneratePersonalFeed = async () => {
    if (!user) return;
    setLoading(true);
    setFeedQuotes([]);
    try {
      const response = await askAISmart(user.uid, 'feed', '', {
        interests: personalInterests,
        favorites: favoritesHistoryString()
      });
      const parsed = JSON.parse(response);
      // Map suggestedQuoteIds or matching categories to real quotes list
      const suggestedIds = parsed.quoteIds || [];
      const matches = quotes.filter(q => suggestedIds.includes(q.id) || personalInterests.toLowerCase().includes(q.category.toLowerCase()));
      setFeedQuotes(matches.slice(0, 5));
    } catch (e) {
      showToast("Personalized matching failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const favoritesHistoryString = () => {
    if (!user) return '';
    return user.favorites.join(', ');
  };

  // 10. Voice Assistant Recognition
  const toggleVoiceListening = () => {
    if (!voiceListenerInstance.isSupported()) {
      showToast("Speech recognition is not supported in this browser.", "error");
      return;
    }

    if (voiceIsListening) {
      voiceListenerInstance.stop();
      setVoiceIsListening(false);
    } else {
      setVoiceIsListening(true);
      setVoiceInputText('Listening...');
      voiceListenerInstance.start({
        onResult: (text) => {
          setVoiceInputText(text);
          processVoiceCommand(text);
        },
        onError: (err) => {
          console.error(err);
          setVoiceIsListening(false);
          setVoiceInputText('');
          setVoiceAIResponse("Sorry, couldn't hear you clearly. Tap mic to retry.");
        },
        onEnd: () => {
          setVoiceIsListening(false);
        }
      });
    }
  };

  const processVoiceCommand = async (command: string) => {
    if (!user) return;
    setLoading(true);
    setVoiceAIResponse('Consulting voice assistant...');
    try {
      const matchWord = command.toLowerCase();
      let speechOutput = "";

      if (matchWord.includes('motivate') || matchWord.includes('motivation') || matchWord.includes('inspire')) {
        speechOutput = "Believe in yourself! Every struggle you face today is cultivating the strength you need for tomorrow. Continue pushing, you are closer than you think.";
        setVoiceAIResponse(`AI Motivational Assistant says:\n\n"${speechOutput}"`);
      } else if (matchWord.includes('search') || matchWord.includes('quote about')) {
        const query = matchWord.replace('search', '').replace('quote about', '').trim();
        const found = quotes.find(q => q.text.toLowerCase().includes(query) || q.category.toLowerCase().includes(query));
        if (found) {
          speechOutput = `I found a quote by ${found.author}: "${found.text}"`;
          setVoiceAIResponse(`Search Result Found:\n\n"${found.text}" — ${found.author}`);
        } else {
          speechOutput = "Sorry, I couldn't find a quote matching that category in local database.";
          setVoiceAIResponse(speechOutput);
        }
      } else {
        // Fallback to Gemini
        const response = await askAISmart(user.uid, 'productivity', `Provide a short, 2-sentence motivational advice for: ${command}`);
        speechOutput = response.replace(/[\#\*]/g, '');
        setVoiceAIResponse(response);
      }

      // Read back voice
      speakText(speechOutput);
    } catch (e) {
      setVoiceAIResponse("Error processing voice prompt.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING SUB-FEES DASHBOARD PANEL ---
  const renderFeatureDashboard = () => {
    switch (activeFeature) {
      case 'generator':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>AI Smart Quote Generator</h3>
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Core Theme / Topic</label>
                <select className="input-field" value={genTopic} onChange={(e) => setGenTopic(e.target.value)}>
                  {['Motivation', 'Success', 'Study', 'Leadership', 'Creativity', 'AI'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Current Mood</label>
                <select className="input-field" value={genMood} onChange={(e) => setGenMood(e.target.value)}>
                  {['Optimistic', 'Stressed', 'Exhausted', 'Determined', 'Anxious', 'Happy'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Goal</label>
                <input type="text" className="input-field" value={genGoal} onChange={(e) => setGenGoal(e.target.value)} placeholder="e.g. Build daily habits" />
              </div>
              <button className="btn-primary" onClick={handleGenerateQuote} disabled={loading} style={{ marginTop: 8 }}>
                <Sparkles size={16} />
                <span>{loading ? "Generating Quote..." : "Generate Quote"}</span>
              </button>
            </GlassCard>

            {generatedQuote && (
              <GlassCard style={{ padding: 24, border: '1px solid rgba(168, 85, 247, 0.35)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, transparent 100%)' }} className="animate-fade-in">
                <span style={{ fontSize: 10, background: 'var(--accent-purple)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>AI Generated</span>
                <p style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', margin: '12px 0', lineHeight: 1.5 }}>"{generatedQuote.text}"</p>
                <p style={{ fontSize: 13, color: 'var(--accent-pink)', fontWeight: 600, marginBottom: 16 }}>— {generatedQuote.author}</p>
                
                {generatedQuote.explanation && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                    <div style={{ fontSize: 12 }}><strong style={{ color: 'var(--accent-purple)' }}>Meaning:</strong> {generatedQuote.explanation.meaning}</div>
                    <div style={{ fontSize: 12 }}><strong style={{ color: 'var(--accent-purple)' }}>Core Lesson:</strong> {generatedQuote.explanation.lesson}</div>
                    <div style={{ fontSize: 12 }}><strong style={{ color: 'var(--accent-purple)' }}>Action step:</strong> {generatedQuote.explanation.application}</div>
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        );

      case 'career':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Career Coach AI</h3>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 12, border: '1px solid var(--border-glass)' }}>
              {(['roadmap', 'resume', 'interview'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCareerTab(tab)}
                  style={{
                    flex: 1,
                    background: careerTab === tab ? 'var(--accent-purple)' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 4px',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Target Profession</label>
                <input type="text" className="input-field" value={careerProfession} onChange={(e) => setCareerProfession(e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Prompt details (optional)</label>
                <input type="text" className="input-field" value={careerPrompt} onChange={(e) => setCareerPrompt(e.target.value)} placeholder="e.g. advice on tech stack transitions" />
              </div>
              <button className="btn-primary" onClick={handleCareerCoach} disabled={loading}>
                <span>{loading ? "Asking Coach..." : "Get Advice"}</span>
              </button>
            </GlassCard>

            {careerResult && (
              <GlassCard style={{ padding: 20, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: '1.6' }} className="animate-fade-in">
                {careerResult}
              </GlassCard>
            )}
          </div>
        );

      case 'productivity':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Productivity Coach</h3>
            
            {/* 1. Pomodoro widget */}
            <GlassCard 
              style={{ 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '24px 10px'
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '1px' }}>Focus Session Timer</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, color: 'white', margin: '10px 0' }}>
                {formatTime(pomoTime)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="btn-primary" onClick={togglePomo} style={{ padding: '8px 16px', borderRadius: 10, background: pomoActive ? '#ef4444' : 'var(--accent-purple)' }}>
                  {pomoActive ? <Pause size={14} /> : <Play size={14} />}
                  <span>{pomoActive ? "Pause" : "Start"}</span>
                </button>
                <button className="btn-secondary" onClick={resetPomo} style={{ padding: '8px 16px', borderRadius: 10 }}>
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              </div>
            </GlassCard>

            {/* 2. Planner input */}
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>What's your primary bottleneck today?</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={prodGoal} 
                onChange={(e) => setProdGoal(e.target.value)} 
                placeholder="e.g. Writing documentation, finishing code refactoring..."
                style={{ resize: 'none' }}
              />
              <button className="btn-primary" onClick={handleProductivityCoach} disabled={loading}>
                <span>{loading ? "Planning..." : "Get Focus Strategy"}</span>
              </button>
            </GlassCard>

            {prodResult && (
              <GlassCard style={{ padding: 20, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: '1.6' }} className="animate-fade-in">
                {prodResult}
              </GlassCard>
            )}
          </div>
        );

      case 'mood':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Mood Analyzer</h3>
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter your current thoughts and feelings in detail:</label>
              <textarea 
                className="input-field" 
                rows={4} 
                value={moodText} 
                onChange={(e) => setMoodText(e.target.value)} 
                placeholder="e.g. I am feeling a bit stressed about the upcoming client meeting, but excited to demonstrate the code changes..." 
                style={{ resize: 'none' }}
              />
              <button className="btn-primary" onClick={handleMoodAnalysis} disabled={loading}>
                <span>{loading ? "Analyzing Mood..." : "Submit for Analysis"}</span>
              </button>
            </GlassCard>

            {moodResult && (
              <GlassCard style={{ padding: 22, border: '1px solid var(--accent-purple)' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-purple)' }}>Mood Evaluation Summary</span>
                  <span style={{ fontSize: 10, background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-pink)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 10px', borderRadius: 12, fontWeight: 700 }}>
                    Score: {moodResult.score}/10
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: moodResult.score >= 7 ? '#22c55e' : moodResult.score >= 5 ? '#eab308' : '#ef4444' }} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{moodResult.label}</span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                  {moodResult.analysis}
                </p>

                {/* Recommendations */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Actions</span>
                  <ul style={{ paddingLeft: 18, fontSize: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {moodResult.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ color: 'var(--text-primary)' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            )}
          </div>
        );

      case 'journal':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>AI Journal Logger</h3>
              <button 
                onClick={() => setShowJournalReport(!showJournalReport)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {showJournalReport ? "Show Logs" : "Show Analytics"}
              </button>
            </div>

            {showJournalReport ? (
              <GlassCard style={{ padding: 20 }} className="animate-fade-in">
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Sentiment Index</span>
                {/* Simulated Chart */}
                <div style={{ display: 'flex', height: 140, alignItems: 'flex-end', justifyContent: 'space-around', margin: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>
                  {[40, 55, 30, 80, 65, 85, 75].map((h, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 22 }}>
                      <div 
                        style={{ 
                          width: '100%', 
                          height: h, 
                          background: h >= 70 ? 'linear-gradient(to top, var(--accent-indigo), var(--accent-purple))' : h >= 50 ? '#eab308' : '#ef4444',
                          borderRadius: '4px 4px 0 0',
                          boxShadow: '0 0 10px rgba(168,85,247,0.1)'
                        }} 
                      />
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>W{i+1}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Your emotional sentiment shows a steady positive upward trend. Keep practicing gratitude to maintain emotional resilience.
                </p>
              </GlassCard>
            ) : (
              <>
                <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Record today's actions, achievements, and worries:</label>
                  <textarea 
                    className="input-field" 
                    rows={4} 
                    value={journalText} 
                    onChange={(e) => setJournalText(e.target.value)} 
                    placeholder="Write your diary entry..." 
                    style={{ resize: 'none' }}
                  />
                  <button className="btn-primary" onClick={handleAddJournal} disabled={loading}>
                    <span>{loading ? "Analyzing Journal..." : "Save Journal"}</span>
                  </button>
                </GlassCard>

                {/* Historical list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recent Entries</span>
                  {journals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>No logs stored yet.</div>
                  ) : (
                    journals.map(entry => (
                      <GlassCard key={entry.id} style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{entry.date}</span>
                          <span 
                            style={{ 
                              fontSize: 9, 
                              background: entry.sentiment.label === 'Positive' ? 'rgba(34, 197, 94, 0.1)' : entry.sentiment.label === 'Negative' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', 
                              color: entry.sentiment.label === 'Positive' ? '#22c55e' : entry.sentiment.label === 'Negative' ? '#ef4444' : 'var(--text-secondary)', 
                              padding: '2px 8px', 
                              borderRadius: 10,
                              fontWeight: 700
                            }}
                          >
                            {entry.sentiment.label} ({entry.sentiment.score}%)
                          </span>
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--text-primary)' }}>{entry.text}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: 6 }}>
                          <strong>AI Insight:</strong> {entry.sentiment.analysis}
                        </p>
                      </GlassCard>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 'goals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Goal Planner</h3>
            
            {/* Goal creation */}
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="text" className="input-field" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="Goal Title (e.g. Master React Native)" />
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="input-field" value={newGoalCategory} onChange={(e) => setNewGoalCategory(e.target.value)} style={{ flex: 1 }}>
                  {['Personal', 'Career', 'Study', 'Fitness', 'Finance'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" className="input-field" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} style={{ flex: 1 }} />
              </div>
              <textarea 
                className="input-field" 
                rows={2} 
                value={newMilestonesText} 
                onChange={(e) => setNewMilestonesText(e.target.value)} 
                placeholder="Milestones (One per line)" 
                style={{ resize: 'none' }}
              />
              <button className="btn-primary" onClick={handleAddGoal}>
                <Plus size={16} />
                <span>Create Tracking Goal</span>
              </button>
            </GlassCard>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Goals</span>
              {goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>No goals set. Create one above!</div>
              ) : (
                goals.map(g => (
                  <GlassCard key={g.id} style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700 }}>{g.title}</h4>
                        <span style={{ fontSize: 10, color: 'var(--accent-purple)', fontWeight: 600 }}>{g.category} • Target: {g.targetDate}</span>
                      </div>
                      
                      {/* Circular Progress Ring Mock */}
                      <div 
                        style={{ 
                          width: 38, 
                          height: 38, 
                          borderRadius: '50%', 
                          background: `conic-gradient(var(--accent-purple) ${g.progress}%, rgba(255,255,255,0.05) 0)`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                          <span style={{ fontSize: 9, fontWeight: 800, margin: '0 auto' }}>{g.progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Milestones checklist */}
                    {g.milestones.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {g.milestones.map(m => (
                          <div 
                            key={m.id} 
                            onClick={() => handleToggleMilestone(g.id, m.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}
                          >
                            <div 
                              style={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: 4, 
                                border: '1px solid var(--accent-purple)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                background: m.completed ? 'var(--accent-purple)' : 'transparent'
                              }}
                            >
                              {m.completed && <Check size={10} color="white" />}
                            </div>
                            <span style={{ color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: m.completed ? 'line-through' : 'none' }}>
                              {m.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                ))
              )}
            </div>
          </div>
        );

      case 'vision':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Vision Board</h3>
              <button 
                className="btn-secondary" 
                onClick={() => setIsEditingVision(!isEditingVision)}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12 }}
              >
                {isEditingVision ? "Save Board" : "Edit Vision"}
              </button>
            </div>

            {isEditingVision ? (
              <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Dream Career</label>
                  <input type="text" className="input-field" value={visionBoard.career} onChange={(e) => setVisionBoard({...visionBoard, career: e.target.value})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Dream Life</label>
                  <input type="text" className="input-field" value={visionBoard.life} onChange={(e) => setVisionBoard({...visionBoard, life: e.target.value})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Dream Startup</label>
                  <input type="text" className="input-field" value={visionBoard.startup} onChange={(e) => setVisionBoard({...visionBoard, startup: e.target.value})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Success Roadmap</label>
                  <textarea rows={3} className="input-field" value={visionBoard.roadmap} onChange={(e) => setVisionBoard({...visionBoard, roadmap: e.target.value})} style={{ resize: 'none' }} />
                </div>
              </GlassCard>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                <GlassCard style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, transparent 100%)', borderLeft: '3px solid var(--accent-purple)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>Dream Career</span>
                  <p style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{visionBoard.career}</p>
                </GlassCard>
                <GlassCard style={{ background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.08) 0%, transparent 100%)', borderLeft: '3px solid var(--accent-pink)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-pink)', textTransform: 'uppercase' }}>Dream Life</span>
                  <p style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{visionBoard.life}</p>
                </GlassCard>
                <GlassCard style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)', borderLeft: '3px solid var(--accent-indigo)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>Dream Startup</span>
                  <p style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{visionBoard.startup}</p>
                </GlassCard>
                <GlassCard style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Success Roadmap</span>
                  <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{visionBoard.roadmap}</p>
                </GlassCard>
              </div>
            )}
          </div>
        );

      case 'explainer':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>AI Quote Explainer</h3>
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Input the quote you want explained:</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={explainText} 
                onChange={(e) => setExplainText(e.target.value)} 
                placeholder="e.g. The only true wisdom is in knowing you know nothing." 
                style={{ resize: 'none' }}
              />
              <button className="btn-primary" onClick={handleExplainQuote} disabled={loading}>
                <span>{loading ? "Explaining Quote..." : "Explain Meaning"}</span>
              </button>
            </GlassCard>

            {explainedQuote && (
              <GlassCard style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-fade-in">
                <div>
                  <h5 style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: 4 }}>Deep Meaning</h5>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{explainedQuote.meaning}</p>
                </div>
                <div>
                  <h5 style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-pink)', textTransform: 'uppercase', marginBottom: 4 }}>Core Lesson</h5>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{explainedQuote.lesson}</p>
                </div>
                <div>
                  <h5 style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase', marginBottom: 4 }}>Practical Action</h5>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{explainedQuote.application}</p>
                </div>
              </GlassCard>
            )}
          </div>
        );

      case 'feed':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="animate-fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>AI Personal Feed</h3>
            
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Configure Your Interests (comma-separated):</label>
              <input type="text" className="input-field" value={personalInterests} onChange={(e) => setPersonalInterests(e.target.value)} />
              <button className="btn-primary" onClick={handleGeneratePersonalFeed} disabled={loading}>
                <Rss size={16} />
                <span>{loading ? "Matching..." : "Generate AI Recommended Feed"}</span>
              </button>
            </GlassCard>

            {feedQuotes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedQuotes.map(quote => (
                  <GlassCard key={quote.id} style={{ padding: 18 }}>
                    <p style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 8 }}>"{quote.text}"</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {quote.author}</span>
                      <span style={{ fontSize: 9, background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>
                        {quote.category}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        );

      case 'voice':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Voice AI Assistant</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, margin: '20px 0' }}>
              {/* Mic button */}
              <button
                onClick={toggleVoiceListening}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: voiceIsListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.15)',
                  border: voiceIsListening ? '2px solid #ef4444' : '2px solid var(--accent-purple)',
                  color: voiceIsListening ? '#ef4444' : 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: voiceIsListening ? '0 0 30px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(168, 85, 247, 0.2)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              >
                {voiceIsListening ? <MicOff size={38} className="animate-pulse" /> : <Mic size={38} />}
              </button>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Speech Input Status:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: voiceIsListening ? '#ef4444' : 'white' }}>
                  {voiceInputText || 'Idle'}
                </span>
              </div>
            </div>

            <GlassCard style={{ padding: 22, background: 'rgba(255,255,255,0.01)', minHeight: 140 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>AI Companion Response</span>
              <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {voiceAIResponse}
              </p>
            </GlassCard>

            {/* Hint Box */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
              <strong>Voice commands you can say:</strong>
              <ul style={{ paddingLeft: 16, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>"Give me motivation"</li>
                <li>"Search quotes by Steve Jobs"</li>
                <li>"Help me organize my day"</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --- RENDERING AI SELECT FEATURE VIEW ---
  if (activeFeature) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Navigation back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            onClick={handleBack}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Back to AI Smart</span>
        </div>

        {renderFeatureDashboard()}
      </div>
    );
  }

  const featuresList = [
    { id: 'generator', name: 'AI Quote Generator', desc: 'Custom quote prompted by mood/goals', icon: BrainCircuit, color: '#a855f7' },
    { id: 'career', name: 'Career Coach AI', desc: 'Resume tips, roadmap pathways, skills', icon: Briefcase, color: '#6366f1' },
    { id: 'productivity', name: 'Productivity Coach', desc: 'Daily schedules & Pomodoro timer focus', icon: Clock, color: '#d946ef' },
    { id: 'mood', name: 'Mood Analyzer', desc: 'Write thoughts, returns score & actions', icon: Heart, color: '#ec4899' },
    { id: 'journal', name: 'AI Journal Logger', desc: 'Sentiment analyzer diary logs', icon: BookOpen, color: '#22c55e' },
    { id: 'goals', name: 'Goal Planner', desc: 'Milestones checklist & progress tracking', icon: Target, color: '#eab308' },
    { id: 'vision', name: 'Vision Board', desc: 'Dream boards for career, life, & startup', icon: Compass, color: '#06b6d4' },
    { id: 'explainer', name: 'Quote Explainer', desc: 'Decodes deep quote meaning & actions', icon: BookOpenCheck, color: '#3b82f6' },
    { id: 'feed', name: 'AI Personal Feed', desc: 'Interest-based recommended matching feed', icon: Rss, color: '#f97316' },
    { id: 'voice', name: 'Voice AI Assistant', desc: 'Talk to assistant & voice output quote read', icon: Mic, color: '#10b981' }
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>AI Smart Co-Pilot</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Unlock personalized mental metrics & strategic roadmaps</p>
      </div>

      {/* Grid of features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {featuresList.map(feat => {
          const Icon = feat.icon;
          return (
            <GlassCard 
              key={feat.id}
              onClick={() => setActiveFeature(feat.id)}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: 'rgba(255,255,255,0.01)'
              }}
              className="ai-smart-grid-item"
            >
              <div 
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${feat.color}15`,
                  color: feat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 15px ${feat.color}10`
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>{feat.name}</h4>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{feat.desc}</p>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </GlassCard>
          );
        })}
      </div>

      {/* Style injection */}
      <style>{`
        .ai-smart-grid-item:hover {
          background: rgba(255,255,255,0.03) !important;
          border-color: var(--accent-purple) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};
export default AISmart;
