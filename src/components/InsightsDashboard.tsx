import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Smile, 
  Flame, 
  Lightbulb, 
  BrainCircuit, 
  Target, 
  ShieldCheck,
  RefreshCw,
  Award,
  BarChart3
} from 'lucide-react';
import { JournalEntry, DigestReport } from '../types';
import { MOOD_PRESETS } from '../lib/constants';
import { generateWeeklyDigest } from '../lib/geminiApi';

interface InsightsDashboardProps {
  entries: JournalEntry[];
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ entries }) => {
  const [digest, setDigest] = useState<DigestReport | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [digestTimeframe, setDigestTimeframe] = useState('Past 7 Days');

  // Compute metrics
  const totalEntries = entries.length;
  const reflectionsCount = entries.filter(e => !!e.aiReflection).length;
  
  const avgMoodScore = totalEntries > 0
    ? (entries.reduce((acc, curr) => acc + (curr.moodScore || 3), 0) / totalEntries).toFixed(1)
    : '0.0';

  // Compute unique active days / streak
  const uniqueDates = new Set(
    entries.map(e => new Date(e.createdAt).toISOString().split('T')[0])
  );
  const activeDaysCount = uniqueDates.size;

  // Compute tag frequencies
  const tagCounts: Record<string, number> = {};
  entries.forEach(e => {
    (e.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Compute mood frequencies
  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  const handleGenerateDigest = async () => {
    if (entries.length === 0) {
      alert("Please write at least one journal entry before synthesizing a digest.");
      return;
    }
    setLoadingDigest(true);
    try {
      const res = await generateWeeklyDigest(entries, digestTimeframe);
      setDigest(res);
    } catch (err: any) {
      console.error("Digest generation failed:", err);
      alert(`Digest error: ${err.message}`);
    } finally {
      setLoadingDigest(false);
    }
  };

  // Recent 10 entries for timeline curve
  const recentEntries = [...entries].reverse().slice(-10);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-[#737373] mb-2">
            <span className="text-xs font-medium text-[#a3a3a3]">Total Entries</span>
            <Calendar className="w-4 h-4 text-[#f27d26]" />
          </div>
          <p className="font-display font-bold text-2xl text-white">{totalEntries}</p>
          <span className="text-[10px] text-[#525252] font-mono">Scoped in /users/UID</span>
        </div>

        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-[#737373] mb-2">
            <span className="text-xs font-medium text-[#a3a3a3]">Active Days</span>
            <Flame className="w-4 h-4 text-[#f27d26]" />
          </div>
          <p className="font-display font-bold text-2xl text-white">{activeDaysCount}</p>
          <span className="text-[10px] text-[#525252] font-mono">Consistent Introspection</span>
        </div>

        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-[#737373] mb-2">
            <span className="text-xs font-medium text-[#a3a3a3]">Avg Mood Score</span>
            <Smile className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-display font-bold text-2xl text-white">{avgMoodScore} <span className="text-sm font-sans font-normal text-[#525252]">/ 5.0</span></p>
          <span className="text-[10px] text-[#525252] font-mono">Emotional Baseline</span>
        </div>

        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-[#737373] mb-2">
            <span className="text-xs font-medium text-[#a3a3a3]">AI Reflections</span>
            <Sparkles className="w-4 h-4 text-[#f27d26]" />
          </div>
          <p className="font-display font-bold text-2xl text-white">{reflectionsCount}</p>
          <span className="text-[10px] text-[#525252] font-mono">Gemini 2.5 Synthesized</span>
        </div>

      </div>

      {/* Mood Timeline Chart */}
      <div className="bg-[#121212] border border-[#262626] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#f27d26]" />
            <h3 className="font-display font-bold text-sm md:text-base text-white">
              Mood Score Trajectory
            </h3>
          </div>
          <span className="text-xs text-[#737373] font-mono">Recent Reflections</span>
        </div>

        {recentEntries.length === 0 ? (
          <div className="py-12 text-center text-[#525252] text-xs font-serif-body">
            Write your first journal entries to visualize your mood trajectory over time.
          </div>
        ) : (
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-[#262626]">
            {recentEntries.map((e, idx) => {
              const heightPercent = ((e.moodScore || 3) / 5) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] text-[#a3a3a3] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {e.moodScore}/5
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[28px] rounded-t-lg transition-all group-hover:brightness-125 ${
                      e.moodScore >= 4
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                        : e.moodScore === 3
                        ? 'bg-gradient-to-t from-[#ea580c] to-[#f27d26]'
                        : 'bg-gradient-to-t from-rose-600 to-orange-400'
                    }`}
                  />
                  <span className="text-[10px] text-[#525252] font-mono truncate max-w-full">
                    {new Date(e.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Grid: Top Themes & Emotion Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Top Tag Distribution */}
        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-5 shadow-lg space-y-3">
          <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">
            Most Explored Themes
          </h4>
          {topTags.length === 0 ? (
            <p className="text-[#525252] text-xs py-4 font-serif-body">No tags recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topTags.map(([tag, count]) => {
                const percentage = Math.round((count / totalEntries) * 100);
                return (
                  <div key={tag} className="space-y-1">
                    <div className="flex justify-between text-xs text-[#d4d4d4]">
                      <span>#{tag}</span>
                      <span className="font-mono text-[#737373]">{count} entries ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-[#f27d26] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emotion Distribution */}
        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-5 shadow-lg space-y-3">
          <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">
            Mood State Breakdown
          </h4>
          <div className="flex flex-wrap gap-2">
            {MOOD_PRESETS.map((m) => {
              const count = moodCounts[m.type] || 0;
              if (count === 0) return null;
              return (
                <div
                  key={m.type}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${m.bgColor} ${m.color}`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label.split('/')[0]}</span>
                  <span className="font-mono font-bold bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[10px]">
                    {count}
                  </span>
                </div>
              );
            })}
            {Object.keys(moodCounts).length === 0 && (
              <p className="text-[#525252] text-xs py-4 font-serif-body">No moods logged yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Gemini Weekly / Periodic Digest Generator */}
      <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#f27d26]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base md:text-lg text-white">
                Gemini Cognitive & Emotional Digest
              </h3>
              <p className="text-xs text-[#737373] font-serif-body">
                Synthesizes overarching psychological patterns, growth breakthroughs, and stressors across multiple entries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              id="digest-timeframe-select"
              value={digestTimeframe}
              onChange={(e) => setDigestTimeframe(e.target.value)}
              className="text-xs bg-[#0a0a0a] border border-[#262626] text-[#d4d4d4] rounded-xl px-3 py-2 focus:outline-none focus:border-[#f27d26]"
            >
              <option value="Past 7 Days">Past 7 Days</option>
              <option value="Past 30 Days">Past 30 Days</option>
              <option value="All Time">All Journal Entries</option>
            </select>

            <button
              id="generate-digest-btn"
              onClick={handleGenerateDigest}
              disabled={loadingDigest || entries.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f27d26] hover:bg-[#e06b16] text-[#0a0a0a] text-xs font-semibold shadow-md transition-all disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDigest ? 'animate-spin' : ''}`} />
              <span>{loadingDigest ? 'Synthesizing...' : 'Generate Digest'}</span>
            </button>
          </div>
        </div>

        {/* Digest Output */}
        {digest && (
          <div className="mt-4 pt-4 border-t border-[#262626] space-y-4 animate-fade-in">
            
            {/* Executive summary */}
            <div className="p-4.5 rounded-2xl bg-[#0a0a0a] border border-[#262626]">
              <span className="text-[11px] font-display font-bold text-[#f27d26] uppercase tracking-wider block mb-1.5">
                Executive Synthesis ({digest.timeframe})
              </span>
              <p className="text-xs md:text-sm text-[#d4d4d4] leading-relaxed font-serif-body whitespace-pre-line">
                {digest.executiveSummary}
              </p>
            </div>

            {/* Grid of Breakthroughs and Stressors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626] space-y-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Growth Breakthroughs
                </span>
                <ul className="space-y-1.5 text-[#a3a3a3] font-serif-body">
                  {digest.growthBreakthroughs.map((b, i) => (
                    <li key={i}>• {b}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626] space-y-2">
                <span className="text-[#f27d26] font-semibold flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Latent Stressors
                </span>
                <ul className="space-y-1.5 text-[#a3a3a3] font-serif-body">
                  {digest.latentStressors.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Weekly Recommendation */}
            <div className="p-4.5 rounded-2xl bg-[#0a0a0a] border border-[#262626] text-xs">
              <span className="text-[#f27d26] font-bold uppercase tracking-wider block mb-1">
                🧭 Forward-Looking Mindfulness Focus
              </span>
              <p className="text-[#d4d4d4] font-serif-body leading-relaxed">
                {digest.weeklyRecommendation}
              </p>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
