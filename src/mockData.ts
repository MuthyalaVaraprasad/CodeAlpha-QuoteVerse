import type { Quote, Collection, Achievement } from './types';

export const CATEGORIES = [
  'Motivation',
  'Success',
  'Life',
  'Study',
  'Leadership',
  'Happiness',
  'Productivity',
  'Business',
  'Startup',
  'AI',
  'Programming',
  'Finance',
  'Fitness',
  'Self Growth',
  'Creativity'
];

export const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'col_motivation', name: 'Motivation', icon: 'Flame', quoteIds: [], isDefault: true },
  { id: 'col_success', name: 'Success', icon: 'Award', quoteIds: [], isDefault: true },
  { id: 'col_study', name: 'Study Focus', icon: 'BookOpen', quoteIds: [], isDefault: true },
  { id: 'col_career', name: 'Career Prep', icon: 'Briefcase', quoteIds: [], isDefault: true },
  { id: 'col_personal', name: 'Personal Growth', icon: 'User', quoteIds: [], isDefault: true }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach_first_quote', title: 'First Step', description: 'Read your first quote in QuoteVerse AI.', icon: 'Sparkles', earned: false },
  { id: 'ach_streak_7', title: '7 Day Streak', description: 'Open the app 7 days in a row.', icon: 'Flame', earned: false, progress: 1, maxProgress: 7 },
  { id: 'ach_streak_30', title: '30 Day Streak', description: 'Establish a daily reflection habit.', icon: 'Calendar', earned: false, progress: 1, maxProgress: 30 },
  { id: 'ach_collector', title: 'Quote Collector', description: 'Save 10 or more quotes.', icon: 'FolderHeart', earned: false, progress: 0, maxProgress: 10 },
  { id: 'ach_master', title: 'Inspiration Master', description: 'Interact with AI tools 5 times.', icon: 'BrainCircuit', earned: false, progress: 0, maxProgress: 5 }
];

// Word pools for deterministic combinatorial generation
const categoryWordPools: Record<string, {
  authors: string[];
  subjects: string[];
  verbs: string[];
  adjectives: string[];
  endings: string[];
}> = {
  Motivation: {
    authors: ['Les Brown', 'Eric Thomas', 'Zig Ziglar', 'Jim Rohn', 'Tony Robbins', 'Arnold Schwarzenegger'],
    subjects: ['Your potential', 'The fire within', 'Every small step', 'Grit', 'Doubt', 'Daily discipline', 'Consistency', 'Courage', 'Action', 'Persistence'],
    verbs: ['destroys', 'fuels', 'unlocks', 'transforms', 'amplifies', 'conquers', 'accelerates', 'defines', 'strengthens', 'empowers'],
    adjectives: ['limitless opportunities', 'our deepest fears', 'unseen obstacles', 'future victories', 'the path of excellence', 'unwavering resolve', 'daily momentum', 'comfort zone boundaries', 'strategic success', 'positive energy'],
    endings: ['when you refuse to stop.', 'through pure consistency.', 'and drives us forward.', 'without looking back.', 'every single morning.', 'by choosing to try.', 'regardless of setbacks.', 'with persistent effort.', 'to achieve the impossible.', 'and creates new realities.']
  },
  Success: {
    authors: ['Earl Nightingale', 'Winston Churchill', 'Colin Powell', 'Napoleon Hill', 'Booker T. Washington', 'Swami Vivekananda'],
    subjects: ['True achievement', 'Great victory', 'The road to success', 'Every accomplishment', 'Meticulous preparation', 'Diligent execution', 'Failing forward', 'Resilience', 'Standard of quality', 'Mastery'],
    verbs: ['requires', 'demands', 'forges', 'unlocks', 'inspires', 'shapes', 'rewards', 'validates', 'accelerates', 'redefines'],
    adjectives: ['unparalleled focus', 'disciplined effort', 'unwavering belief', 'continuous refinement', 'bold action', 'unseen dedication', 'strategic foresight', 'relentless passion', 'inner clarity', 'cognitive growth'],
    endings: ['as the ultimate result.', 'with absolute dedication.', 'through years of patience.', 'by performing simple tasks well.', 'before you even realize it.', 'across all life aspects.', 'to build a legacy.', 'and tests your resolve.', 'without looking back.', 'every step of the way.']
  },
  Life: {
    authors: ['Abraham Lincoln', 'John Lennon', 'Dalai Lama', 'Marcus Aurelius', 'Alan Watts', 'Seneca'],
    subjects: ['Life', 'Modern existence', 'Every breath', 'Wisdom', 'Acceptance', 'Daily reflection', 'Mindfulness', 'The present moment', 'True wealth', 'Human connection'],
    verbs: ['teaches', 'offers', 'requires', 'mirrors', 'creates', 'unfolds', 'balances', 'reveals', 'deepens', 'enriches'],
    adjectives: ['raw beauty', 'inner peace', 'predictable turns', 'meaningful experiences', 'deep presence', 'mental clarity', 'spiritual growth', 'human vulnerability', 'emotional balance', 'natural harmony'],
    endings: ['in the most unexpected ways.', 'and helps us find meaning.', 'without unnecessary worry.', 'every single day.', 'by simply letting go.', 'through regular reflection.', 'across all stages.', 'and opens our eyes.', 'to live with purpose.', 'and brings lasting joy.']
  },
  Study: {
    authors: ['Mahatma Gandhi', 'B.B. King', 'Albert Einstein', 'Socrates', 'Galileo Galilei', 'Nelson Mandela'],
    subjects: ['Knowledge', 'Constant learning', 'Deep study', 'Curiosity', 'Education', 'Intelligence', 'Mastery', 'Analytical research', 'Mental training', 'Wisdom'],
    verbs: ['expands', 'compounds', 'sharpens', 'elevates', 'illuminates', 'strengthens', 'unlocks', 'updates', 'guides', 'refines'],
    adjectives: ['critical thinking', 'complex structures', 'intellectual clarity', 'unseen pathways', 'cognitive assets', 'deep comprehension', 'problem-solving skills', 'academic discipline', 'lifelong wisdom', 'active memory'],
    endings: ['and stays with you forever.', 'by studying consistently.', 'through patient examination.', 'without losing curiosity.', 'in every single detail.', 'to open new doors.', 'with focused study blocks.', 'every single day.', 'and lights the path ahead.', 'to understand the world.']
  },
  Leadership: {
    authors: ['John C. Maxwell', 'Simon Sinek', 'Warren Bennis', 'Peter Drucker', 'Nelson Mandela', 'Lao Tzu'],
    subjects: ['Great leadership', 'True leaders', 'A vision', 'Team alignment', 'Integrity', 'Empathy', 'Strategic direction', 'Accountability', 'Mentorship', 'Action'],
    verbs: ['inspires', 'guides', 'builds', 'cultivates', 'demonstrates', 'shapes', 'empowers', 'supports', 'coordinates', 'elevates'],
    adjectives: ['trust and respect', 'shared ownership', 'long-term visions', 'collaborative growth', 'active listening', 'ethical standards', 'personal growth', 'organizational clarity', 'unified goals', 'collective action'],
    endings: ['by putting others first.', 'through daily example.', 'with absolute honesty.', 'to achieve shared goals.', 'across all departments.', 'without seeking credit.', 'by mentoring others.', 'every single day.', 'and drives the group forward.', 'to build strong foundations.']
  },
  Happiness: {
    authors: ['Aristotle', 'Gautama Buddha', 'Marcus Aurelius', 'Helen Keller', 'Thich Nhat Hanh', 'Ralph Waldo Emerson'],
    subjects: ['Inner joy', 'Happiness', 'Contentment', 'Gratitude', 'A warm smile', 'True peace', 'Acceptance', 'Loving kindness', 'Mindfulness', 'Simplicity'],
    verbs: ['springs', 'flows', 'depends', 'creates', 'heals', 'softens', 'enriches', 'brightens', 'settles', 'centers'],
    adjectives: ['daily appreciation', 'simple pleasures', 'positive emotions', 'clear conscience', 'emotional stability', 'genuine connections', 'quiet moments', 'self-compassion', 'present awareness', 'kind deeds'],
    endings: ['from within ourselves.', 'and brings peace of mind.', 'by appreciating what you have.', 'without external conditions.', 'in every circumstance.', 'through quiet presence.', 'to light up the day.', 'and spreads to others.', 'every single day.', 'and cures emotional fatigue.']
  },
  Productivity: {
    authors: ['Tim Ferriss', 'James Clear', 'David Allen', 'Cal Newport', 'Peter Drucker', 'Stephen Covey'],
    subjects: ['Peak focus', 'Daily output', 'Time management', 'Single-tasking', 'Organization', 'Habit building', 'Deep work', 'Action steps', 'Meticulous planning', 'Execution'],
    verbs: ['optimizes', 'doubles', 'structures', 'eliminates', 'accelerates', 'simplifies', 'maximizes', 'refines', 'drives', 'channels'],
    adjectives: ['strategic outcomes', 'cognitive energy', 'high-impact tasks', 'digital distraction', 'morning routines', 'focus sessions', 'project milestones', 'daily priorities', 'seamless workflow', 'clean workspace'],
    endings: ['to build compounding habits.', 'by working in sprints.', 'through absolute prioritization.', 'without switching tasks.', 'every single day.', 'with minimal friction.', 'to achieve goals quickly.', 'and keeps you organized., without burning out.', 'step by step.']
  },
  Business: {
    authors: ['Bill Gates', 'Peter Drucker', 'Steve Jobs', 'Richard Branson', 'Warren Buffett', 'Jeff Bezos'],
    subjects: ['Business growth', 'Innovation', 'Customer value', 'Market trust', 'Quality service', 'Operations', 'Industry demand', 'Strategy', 'Risk management', 'Profitability'],
    verbs: ['drives', 'sustains', 'delivers', 'scales', 'requires', 'secures', 'optimizes', 'balances', 'validates', 'dominates'],
    adjectives: ['customer satisfaction', 'organizational efficiency', 'competitive edge', 'strategic pivots', 'market authority', 'sustainable growth', 'product quality', 'brand loyalty', 'ethical practices', 'financial viability'],
    endings: ['by listening to feedback.', 'through clear execution.', 'across all sectors.', 'without compromising value.', 'to build long-term value.', 'in every transaction.', 'with sound planning.', 'every single day.', 'and ensures longevity.', 'to thrive under pressure.']
  },
  Startup: {
    authors: ['John Doerr', 'Eric Ries', 'Paul Graham', 'Peter Thiel', 'Reid Hoffman', 'Marc Andreessen'],
    subjects: ['Product iteration', 'Vision', 'A startup team', 'Execution speed', 'Market fit', 'Bootstrapping', 'Agility', 'Customer validation', 'Pivot strategies', 'Innovation'],
    verbs: ['accelerates', 'validates', 'refines', 'drives', 'defines', 'transforms', 'tests', 'shapes', 'challenges', 'captures'],
    adjectives: ['rapid prototyping', 'growth velocity', 'customer feedback', 'scalable systems', 'MVP building', 'target markets', 'creative solutions', 'developer efficiency', 'unique positioning', 'funding readiness'],
    endings: ['by shipping quickly.', 'through constant testing.', 'with minimal overhead.', 'before funds run out.', 'to solve real problems.', 'across the board.', 'every single week.', 'without fear of pivots.', 'and drives viral adoption.', 'to build a unicorn.']
  },
  AI: {
    authors: ['Dave Waters', 'Alan Turing', 'John McCarthy', 'Demis Hassabis', 'Ray Kurzweil', 'Fei-Fei Li'],
    subjects: ['Machine learning', 'Deep networks', 'Data modeling', 'Algorithmic reason', 'Cognitive compute', 'Tech innovation', 'Automation', 'AI reasoning', 'Neural architecture', 'Smart systems'],
    verbs: ['augments', 'amplifies', 'processes', 'optimizes', 'handles', 'guides', 'decodes', 'calculates', 'predicts', 'translates'],
    adjectives: ['cognitive capabilities', 'massive data arrays', 'prediction accuracy', 'custom parameters', 'computer visions', 'natural languages', 'technical innovations', 'human capabilities', 'strategic decisions', 'complex problems'],
    endings: ['to augment human potential.', 'with ethical boundaries.', 'through rigorous training.', 'in real-time environments., by processing inputs.', 'across neural nodes.', 'every microsecond.', 'without human bias.', 'to write the future.', 'with logic-based models.']
  },
  Programming: {
    authors: ['John Johnson', 'Martin Fowler', 'Linus Torvalds', 'Grace Hopper', 'Kent Beck', 'Ada Lovelace'],
    subjects: ['Clean code', 'Refactoring', 'Software design', 'Debugging', 'Logic structure', 'Algorithms', 'Systems code', 'Syntax design', 'Stack choice', 'Compiler check'],
    verbs: ['simplifies', 'structures', 'runs', 'optimizes', 'compiles', 'prevents', 'refines', 'deploys', 'scales', 'fixes'],
    adjectives: ['technical complexity', 'runtime efficiency', 'modular patterns', 'code readabilities', 'complex problems', 'system bottlenecks', 'developer velocity', 'interface design', 'data integrity', 'class inheritance'],
    endings: ['by writing simple methods.', 'through automated tests.', 'with clean comments.', 'without code smell.', 'across server routes.', 'every build cycle.', 'to save memory space.', 'and increases velocity.', 'without regression bugs.', 'with clean architecture.']
  },
  Finance: {
    authors: ['Warren Buffett', 'Benjamin Graham', 'Robert Kiyosaki', 'Dave Ramsey', 'John Bogle', 'Ray Dalio'],
    subjects: ['Wealth building', 'Asset compound', 'Savings', 'Smart investing', 'Budget plans', 'Market research', 'Financial freedom', 'Passive yields', 'Capital growth', 'Risk mitigation'],
    verbs: ['secures', 'builds', 'compounds', 'mitigates', 'grows', 'optimizes', 'guides', 'tracks', 'stabilizes', 'delivers'],
    adjectives: ['long-term yields', 'portfolio assets', 'personal savings', 'strategic budgeting', 'compound interests', 'market volatility', 'investment options', 'risk tolerance', 'economic shifts', 'financial wellness'],
    endings: ['by paying yourself first.', 'through compound growth.', 'with low-cost indexes.', 'without emotional trading.', 'across multiple sectors.', 'to secure retirement.', 'every single pay period.', 'and beats inflation.', 'with sound budgets.', 'for a stable future.']
  },
  Fitness: {
    authors: ['Arnold Schwarzenegger', 'Jack LaLanne', 'Bruce Lee', 'Jim Ryun', 'David Goggins', 'Laird Hamilton'],
    subjects: ['Muscle growth', 'Physical health', 'Daily training', 'Stamina', 'Cardio workouts', 'Body power', 'Diet habits', 'Workout routine', 'Mental toughness', 'Core strength'],
    verbs: ['demands', 'improves', 'transforms', 'builds', 'shapes', 'strengthens', 'restores', 'fuels', 'conditions', 'drives'],
    adjectives: ['physical performance', 'mental resilience', 'muscle recovery', 'cellular health', 'training volumes', 'cardiovascular power', 'healthy lifestyle', 'athletic limits', 'core balance', 'athletic endurance'],
    endings: ['by pushing your limits.', 'through clean nutrition.', 'with rest and recovery., without skipping days.', 'every workout session.', 'to increase longevity.', 'in every activity.', 'and hardens resolve.', 'and clears the mind.', 'step by rep.']
  },
  'Self Growth': {
    authors: ['Ernest Hemingway', 'Carol Dweck', 'Viktor Frankl', 'Carl Jung', 'Eckhart Tolle', 'Marcus Aurelius'],
    subjects: ['Inner growth', 'Character design', 'Growth mindset', 'Self awareness', 'Wisdom', 'Habits check', 'Self compassion', 'Personal growth', 'Mindfulness', 'Maturity'],
    verbs: ['expands', 'shapes', 'enriches', 'elevates', 'guides', 'challenges', 'heals', 'unlocks', 'clarifies', 'updates'],
    adjectives: ['emotional maturity', 'mental resilience', 'cognitive expansion', 'custom habits', 'personal potential', 'past experiences', 'self acceptance', 'inner peace', 'focus states', 'life goals'],
    endings: ['by focusing on yourself.', 'through daily introspection.', 'with self-compassion.', 'without social comparisons.', 'in every life phase.', 'to build resilience.', 'and helps you heal.', 'every single morning.', 'and releases anxiety.', 'for a peaceful life.']
  },
  Creativity: {
    authors: ['Maya Angelou', 'Ken Robinson', 'Pablo Picasso', 'Elizabeth Gilbert', 'Austin Kleon', 'Rick Rubin'],
    subjects: ['Creative flow', 'Art expression', 'Imagination', 'Innovation', 'Craft design', 'Brainstorms', 'Graphic mockups', 'Novel concepts', 'Design choice', 'Visual arts'],
    verbs: ['sparks', 'enriches', 'transforms', 'colors', 'shapes', 'challenges', 'captures', 'refines', 'translates', 'reveals'],
    adjectives: ['artistic visions', 'original concepts', 'creative boundaries', 'design aesthetics', 'visual compositions', 'abstract ideas', 'craft perfection', 'unique perspectives', 'lateral thoughts', 'innovative patterns'],
    endings: ['by letting ideas flow.', 'through playful practice.', 'without self-judgment.', 'in every sketch.', 'to color the world.', 'with focus and freedom.', 'every creative block.', 'and inspires others.', 'to make art alive.', 'with unique styles.']
  }
};

// Seeded pseudorandom generator for deterministic variance
const getSeededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

export const generateQuotesPool = (): Quote[] => {
  const pool: Quote[] = [];
  
  CATEGORIES.forEach(category => {
    const data = categoryWordPools[category];
    if (!data) return;

    for (let i = 0; i < 539; i++) {
      const rand = getSeededRandom(`${category}_${i}`);
      const sIdx = Math.floor(rand() * data.subjects.length);
      const vIdx = Math.floor(rand() * data.verbs.length);
      const aIdx = Math.floor(rand() * data.adjectives.length);
      const eIdx = Math.floor(rand() * data.endings.length);
      const auIdx = Math.floor(rand() * data.authors.length);

      const text = `${data.subjects[sIdx]} ${data.verbs[vIdx]} ${data.adjectives[aIdx]} ${data.endings[eIdx]}`;
      const author = data.authors[auIdx];
      const id = `q_${category.toLowerCase().replace(/ /g, '_')}_${i}`;

      pool.push({
        id,
        text,
        author,
        category,
        isTrending: i === 5 || i === 42 || i === 128,
        isAIRecommended: i === 9 || i === 234 || i === 500,
        explanation: {
          meaning: `This quote indicates that ${data.subjects[sIdx].toLowerCase()} naturally ${data.verbs[vIdx]} ${data.adjectives[aIdx]}.`,
          lesson: `In the context of ${category.toLowerCase()}, consistency in alignment leads to direct transformation.`,
          application: `Reflect on this concept today. Take one active step to integrate ${data.subjects[sIdx].toLowerCase()} in your actions.`
        }
      });
    }
  });

  return pool;
};

// Standard seed list containing all 15 * 539 = 8,085 quotes
export const SEED_QUOTES: Quote[] = generateQuotesPool();
