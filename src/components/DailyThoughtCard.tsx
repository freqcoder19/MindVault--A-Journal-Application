import React, { useState, useMemo } from 'react';
import { Sparkles, RefreshCw, MessageSquareQuote } from 'lucide-react';
import { MoodType } from '../types';

interface DailyThoughtCardProps {
  recentMood?: MoodType | null;
  onTalkToGemini?: (prompt: string) => void;
}

interface ThoughtItem {
  id: string;
  text: string;
  theme: string;
  tailoredMoods?: MoodType[];
}

const CURATED_THOUGHTS: ThoughtItem[] = [
  { id: '1', text: 'Small steps still move you forward.', theme: 'Patience & Momentum' },
  { id: '2', text: "You don't have to have everything figured out today.", theme: 'Acceptance', tailoredMoods: ['anxious', 'frustrated'] },
  { id: '3', text: 'Some days are for progress. Some are simply for being.', theme: 'Rest & Grace', tailoredMoods: ['exhausted', 'reflective'] },
  { id: '4', text: "You're allowed to be proud of how far you've come.", theme: 'Self-Compassion', tailoredMoods: ['grateful', 'hopeful'] },
  { id: '5', text: 'Your peace is worth protecting, even in the smallest boundaries.', theme: 'Inner Boundaries' },
  { id: '6', text: 'Breathe. Give yourself permission to arrive without rushing.', theme: 'Presence', tailoredMoods: ['anxious', 'exhausted'] },
  { id: '7', text: 'Growth is rarely loud or linear. Quiet awareness is already progress.', theme: 'Gentle Growth', tailoredMoods: ['reflective'] },
  { id: '8', text: 'Every honest word you write here is an act of self-kindness.', theme: 'Mindful Care' },
  { id: '9', text: 'What is heavy right now does not have to be carried all at once.', theme: 'Relief', tailoredMoods: ['exhausted', 'frustrated', 'grieving'] },
  { id: '10', text: 'Notice what brought a quiet spark of gratitude today, however small.', theme: 'Gratitude', tailoredMoods: ['grateful', 'ecstatic', 'calm'] },
  { id: '11', text: 'You do not have to perform for your own thoughts. Be true to yourself here.', theme: 'Authenticity' },
  { id: '12', text: 'Gentleness with yourself is not hesitation; it is foundational wisdom.', theme: 'Wisdom', tailoredMoods: ['anxious'] }
];

export const DailyThoughtCard: React.FC<DailyThoughtCardProps> = ({
  recentMood,
  onTalkToGemini
}) => {
  // Deterministic calculation based on calendar day
  const defaultIndex = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );

    // If recentMood matches a tailored thought, prefer one of those subtly
    if (recentMood) {
      const tailored = CURATED_THOUGHTS.filter(t => t.tailoredMoods?.includes(recentMood));
      if (tailored.length > 0) {
        const tailoredIdx = dayOfYear % tailored.length;
        return CURATED_THOUGHTS.indexOf(tailored[tailoredIdx]);
      }
    }

    return dayOfYear % CURATED_THOUGHTS.length;
  }, [recentMood]);

  const [currentIndex, setCurrentIndex] = useState<number>(defaultIndex);

  const activeThought = CURATED_THOUGHTS[currentIndex % CURATED_THOUGHTS.length];

  const handleNextThought = () => {
    setCurrentIndex(prev => (prev + 1) % CURATED_THOUGHTS.length);
  };

  return (
    <section 
      id="daily-thought-section"
      className="bg-surface-card border border-theme rounded-3xl p-5 md:p-6 shadow-xs relative overflow-hidden transition-all group"
    >
      {/* Decorative calm background glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-accent/5 blur-2xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-theme/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-surface-secondary border border-theme flex items-center justify-center text-accent shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-theme-primary">
            Today's Thought
          </h2>
          <span className="text-[10px] font-mono text-accent px-2 py-0.5 rounded-full bg-surface-secondary border border-theme">
            {activeThought.theme}
          </span>
        </div>

        <button
          id="daily-thought-cycle-btn"
          onClick={handleNextThought}
          className="text-[11px] font-mono text-theme-muted hover:text-accent flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-surface-secondary"
          title="See another comforting thought"
        >
          <RefreshCw className="w-3 h-3 group-hover:rotate-45 transition-transform" />
          <span>New thought</span>
        </button>
      </div>

      <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <blockquote className="space-y-1">
          <p className="font-serif-body text-base md:text-lg text-theme-primary leading-relaxed italic">
            "{activeThought.text}"
          </p>
          <p className="text-[11px] text-theme-muted font-sans">
            A quiet mindful anchor for your day.
          </p>
        </blockquote>

        {onTalkToGemini && (
          <button
            id="daily-thought-talk-gemini-btn"
            onClick={() => onTalkToGemini(`I was reflecting on today's thought: "${activeThought.text}". What perspective or questions come to mind?`)}
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-surface-card border border-theme hover:border-accent text-xs font-medium text-theme-secondary hover:text-accent transition-all shadow-xs"
          >
            <MessageSquareQuote className="w-3.5 h-3.5 text-accent" />
            <span>Talk to Gemini about this</span>
          </button>
        )}
      </div>
    </section>
  );
};
