import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Tag as TagIcon, 
  RefreshCw, 
  BookOpen,
  Lightbulb,
  Heart,
  Flame
} from 'lucide-react';
import { STARTER_PROMPTS } from '../lib/constants';
import { IntrospectivePrompt, JournalEntry } from '../types';
import { fetchPersonalizedPrompts } from '../lib/geminiApi';

interface GuidedPromptsViewProps {
  entries: JournalEntry[];
  onSelectPrompt: (promptText: string) => void;
}

export const GuidedPromptsView: React.FC<GuidedPromptsViewProps> = ({
  entries,
  onSelectPrompt,
}) => {
  const [promptsList, setPromptsList] = useState<IntrospectivePrompt[]>(STARTER_PROMPTS);
  const [loadingAi, setLoadingAi] = useState(false);
  const [focusArea, setFocusArea] = useState('Deep Self-Discovery & Growth');

  const focusOptions = [
    'Deep Self-Discovery & Growth',
    'Anxiety & Stress Grounding',
    'Career & Creative Ambition',
    'Gratitude & Micro-Moments',
    'Relationship Boundaries & Empathy',
    'Evening Clarity & Sleep Transition',
  ];

  const handleGenerateCustomPrompts = async () => {
    setLoadingAi(true);
    try {
      const recentMoods = entries.slice(0, 5).map(e => e.mood);
      const newPrompts = await fetchPersonalizedPrompts(recentMoods, focusArea);
      if (newPrompts && newPrompts.length > 0) {
        setPromptsList(newPrompts);
      }
    } catch (err: any) {
      console.error("Failed to generate AI prompts:", err);
      alert(`Could not generate AI prompts: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333333] text-[#f27d26] text-xs font-mono">
            <Compass className="w-3.5 h-3.5" />
            <span>Introspective Prompt Engine</span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white">
            Guided Prompts for Deep Inner Clarity
          </h2>
          <p className="text-xs md:text-sm text-[#a3a3a3] font-serif-body leading-relaxed">
            Break through writer’s block or emotional fog with curated psychological prompts and Gemini-generated inquiries tailored to your recent reflections.
          </p>
        </div>

        {/* AI Prompt Generator Control Box */}
        <div className="w-full md:w-auto shrink-0 bg-[#0a0a0a] p-4 rounded-2xl border border-[#262626] space-y-3 z-10">
          <div className="text-xs font-semibold text-[#d4d4d4] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f27d26]" />
            <span>AI Prompt Generator</span>
          </div>

          <select
            id="prompt-focus-select"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            className="w-full text-xs bg-[#121212] border border-[#262626] rounded-xl px-2.5 py-1.5 text-[#d4d4d4] focus:outline-none focus:border-[#f27d26]"
          >
            {focusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <button
            id="generate-ai-prompts-btn"
            onClick={handleGenerateCustomPrompts}
            disabled={loadingAi}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#f27d26] hover:bg-[#e06b16] text-[#0a0a0a] font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>{loadingAi ? 'Synthesizing Prompts...' : 'Generate with Gemini'}</span>
          </button>
        </div>
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promptsList.map((prompt, idx) => (
          <div
            key={idx}
            className="bg-[#121212] hover:bg-[#151515] border border-[#262626] hover:border-[#333333] rounded-3xl p-5 md:p-6 flex flex-col justify-between gap-4 transition-all shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#f27d26] border border-[#333333]">
                  {prompt.category}
                </span>
                <span className="text-xs text-[#737373] flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  ~{prompt.estimatedMinutes} min
                </span>
              </div>

              <h3 className="font-display font-bold text-base text-white group-hover:text-[#f27d26] transition-colors">
                {prompt.title}
              </h3>

              <p className="text-xs md:text-sm text-[#d4d4d4] font-serif-body leading-relaxed">
                "{prompt.promptText}"
              </p>
            </div>

            <div className="pt-3 border-t border-[#262626] flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1">
                {prompt.tags.map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-lg bg-[#0a0a0a] text-[#a3a3a3] border border-[#262626] font-mono">
                    #{t}
                  </span>
                ))}
              </div>

              <button
                id={`start-journaling-prompt-btn-${idx}`}
                onClick={() => onSelectPrompt(prompt.promptText)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#f27d26] text-[#f27d26] hover:text-[#0a0a0a] border border-[#333333] hover:border-[#f27d26] text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Write</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
