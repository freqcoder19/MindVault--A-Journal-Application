import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Smile, 
  Flame, 
  Target, 
  RefreshCw, 
  Award, 
  BarChart2,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { JournalEntry, DigestReport } from '../types';
import { MOOD_PRESETS } from '../lib/constants';
import { generateWeeklyDigest } from '../lib/geminiApi';

interface InsightsDashboardProps {
  entries: JournalEntry[];
  onNavigateToEntry?: (entryId: string) => void;
  onOpenGemini?: () => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ 
  entries,
  onOpenGemini,
}) => {
  const [digest, setDigest] = useState<DigestReport | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [digestTimeframe, setDigestTimeframe] = useState('Past 7 Days');

  // Compute metrics
  const totalEntries = entries.length;
  const reflectionsCount = entries.filter(e => !!e.aiReflection).length;
  
  const avgMoodScore = totalEntries > 0
    ? (entries.reduce((acc, curr) => acc + (curr.moodScore || 3), 0) / totalEntries).toFixed(1)
    : '0.0';

  // Compute unique active days
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
      alert("Please write at least one journal entry before generating a summary.");
      return;
    }
    setLoadingDigest(true);
    try {
      const res = await generateWeeklyDigest(entries, digestTimeframe);
      setDigest(res);
    } catch (err: any) {
      console.error("Digest generation failed:", err);
      alert(`Summary synthesis error: ${err.message}`);
    } finally {
      setLoadingDigest(false);
    }
  };

  // Recent 12 entries for timeline curve
  const recentEntries = [...entries].reverse().slice(-12);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Page Header: Calm, Minimal Sage Tone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-theme/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
            </div>
            <h2 className="font-display font-bold text-xl text-theme-primary">
              Personal Summary
            </h2>
          </div>
          <p className="text-xs text-theme-muted">
            Holistic emotional trajectory and Gemini mindful synthesis across your private entries.
          </p>
        </div>

        {onOpenGemini && (
          <button
            onClick={onOpenGemini}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-card hover:bg-surface-secondary border border-theme hover:border-accent/40 text-theme-secondary hover:text-accent text-xs font-medium transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Open Gemini Companion</span>
            <ArrowUpRight className="w-3 h-3 text-theme-muted" />
          </button>
        )}
      </div>

      {/* Top 4 Metrics: Sage and Minimalist */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-surface-card border border-theme rounded-2xl p-4.5 shadow-xs transition-all hover:border-theme/80">
          <div className="flex items-center justify-between text-theme-muted mb-2">
            <span className="text-xs font-medium text-theme-secondary">Total Entries</span>
            <Calendar className="w-4 h-4 text-accent" />
          </div>
          <p className="font-display font-bold text-2xl text-theme-primary">{totalEntries}</p>
          <span className="text-[10px] text-theme-muted font-mono">Isolated in your private vault</span>
        </div>

        <div className="bg-surface-card border border-theme rounded-2xl p-4.5 shadow-xs transition-all hover:border-theme/80">
          <div className="flex items-center justify-between text-theme-muted mb-2">
            <span className="text-xs font-medium text-theme-secondary">Active Days</span>
            <Flame className="w-4 h-4 text-accent" />
          </div>
          <p className="font-display font-bold text-2xl text-theme-primary">{activeDaysCount}</p>
          <span className="text-[10px] text-theme-muted font-mono">Consistent mindfulness</span>
        </div>

        <div className="bg-surface-card border border-theme rounded-2xl p-4.5 shadow-xs transition-all hover:border-theme/80">
          <div className="flex items-center justify-between text-theme-muted mb-2">
            <span className="text-xs font-medium text-theme-secondary">Average Mood</span>
            <Smile className="w-4 h-4 text-accent" />
          </div>
          <p className="font-display font-bold text-2xl text-theme-primary">
            {avgMoodScore} <span className="text-xs font-sans font-normal text-theme-muted">/ 5.0</span>
          </p>
          <span className="text-[10px] text-theme-muted font-mono">Self-reported emotional baseline</span>
        </div>

        <div className="bg-surface-card border border-theme rounded-2xl p-4.5 shadow-xs transition-all hover:border-theme/80">
          <div className="flex items-center justify-between text-theme-muted mb-2">
            <span className="text-xs font-medium text-theme-secondary">Gemini Reflections</span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <p className="font-display font-bold text-2xl text-theme-primary">{reflectionsCount}</p>
          <span className="text-[10px] text-theme-muted font-mono">Synthesized by Gemini 2.5</span>
        </div>

      </div>

      {/* Mood Score Trajectory Visualizer */}
      <div className="bg-surface-card border border-theme rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-sm md:text-base text-theme-primary">
              Emotional Trajectory
            </h3>
          </div>
          <span className="text-xs text-theme-muted font-mono">Recent entries</span>
        </div>

        {recentEntries.length === 0 ? (
          <div className="py-10 text-center text-theme-muted text-xs font-serif-body">
            Create your first journal entries to visualize your mood trajectory over time.
          </div>
        ) : (
          <div className="h-40 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-theme/60">
            {recentEntries.map((e, idx) => {
              const heightPercent = Math.max(15, ((e.moodScore || 3) / 5) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] text-theme-muted opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {e.moodScore}/5
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[26px] rounded-t-md transition-all group-hover:brightness-110 ${
                      e.moodScore >= 4
                        ? 'bg-gradient-to-t from-teal-700 to-teal-400'
                        : e.moodScore === 3
                        ? 'bg-gradient-to-t from-emerald-800 to-teal-600'
                        : 'bg-gradient-to-t from-slate-700 to-slate-500'
                    }`}
                  />
                  <span className="text-[10px] text-theme-muted font-mono truncate max-w-full">
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
        <div className="bg-surface-card border border-theme rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <h4 className="font-display font-semibold text-xs text-theme-primary uppercase tracking-wider">
              Most Explored Themes
            </h4>
          </div>
          {topTags.length === 0 ? (
            <p className="text-theme-muted text-xs py-4 font-serif-body">No tags recorded yet.</p>
          ) : (
            <div className="space-y-2.5 pt-1">
              {topTags.map(([tag, count]) => {
                const percentage = Math.round((count / totalEntries) * 100);
                return (
                  <div key={tag} className="space-y-1">
                    <div className="flex justify-between text-xs text-theme-secondary">
                      <span>#{tag}</span>
                      <span className="font-mono text-theme-muted">{count} entries ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-accent rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emotion Distribution */}
        <div className="bg-surface-card border border-theme rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-accent" />
            <h4 className="font-display font-semibold text-xs text-theme-primary uppercase tracking-wider">
              Mood Breakdown
            </h4>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {MOOD_PRESETS.map((m) => {
              const count = moodCounts[m.type] || 0;
              if (count === 0) return null;
              return (
                <div
                  key={m.type}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-theme bg-surface-secondary/70 text-xs font-medium text-theme-secondary"
                >
                  <span>{m.emoji}</span>
                  <span>{m.label.split('/')[0]}</span>
                  <span className="font-mono font-semibold bg-surface-card border border-theme px-1.5 py-0.5 rounded text-[10px] text-theme-primary">
                    {count}
                  </span>
                </div>
              );
            })}
            {Object.keys(moodCounts).length === 0 && (
              <p className="text-theme-muted text-xs py-4 font-serif-body">No moods logged yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Gemini Journal Synthesis Digest */}
      <div className="bg-surface-card border border-theme rounded-2xl p-6 md:p-8 shadow-xs space-y-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base md:text-lg text-theme-primary">
                Gemini Mindful Synthesis Digest
              </h3>
              <p className="text-xs text-theme-muted font-serif-body">
                Synthesizes overarching cognitive themes, growth breakthroughs, and gentle recommendations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              id="digest-timeframe-select"
              value={digestTimeframe}
              onChange={(e) => setDigestTimeframe(e.target.value)}
              className="text-xs bg-surface-secondary border border-theme text-theme-primary rounded-xl px-3 py-2 focus:outline-none focus:border-accent"
            >
              <option value="Past 7 Days">Past 7 Days</option>
              <option value="Past 30 Days">Past 30 Days</option>
              <option value="All Time">All Journal Entries</option>
            </select>

            <button
              id="generate-digest-btn"
              onClick={handleGenerateDigest}
              disabled={loadingDigest || entries.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDigest ? 'animate-spin' : ''}`} />
              <span>{loadingDigest ? 'Synthesizing...' : 'Generate Digest'}</span>
            </button>
          </div>
        </div>

        {/* Digest Output */}
        {digest && (
          <div className="mt-4 pt-4 border-t border-theme/60 space-y-4 animate-fade-in">
            
            {/* Executive summary */}
            <div className="p-4.5 rounded-xl bg-surface-secondary/60 border border-theme/80">
              <span className="text-[11px] font-display font-bold text-accent uppercase tracking-wider block mb-1.5">
                Executive Synthesis ({digest.timeframe})
              </span>
              <p className="text-xs md:text-sm text-theme-primary leading-relaxed font-serif-body whitespace-pre-line">
                {digest.executiveSummary}
              </p>
            </div>

            {/* Grid of Breakthroughs and Stressors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              <div className="p-4 rounded-xl bg-surface-secondary/60 border border-theme/80 space-y-2">
                <span className="text-accent font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent" /> Growth Breakthroughs
                </span>
                <ul className="space-y-1.5 text-theme-secondary font-serif-body">
                  {digest.growthBreakthroughs.map((b, i) => (
                    <li key={i}>• {b}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary/60 border border-theme/80 space-y-2">
                <span className="text-theme-secondary font-semibold flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-accent" /> Mindful Observations
                </span>
                <ul className="space-y-1.5 text-theme-muted font-serif-body">
                  {digest.latentStressors.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Forward-Looking Recommendation */}
            <div className="p-4.5 rounded-xl bg-accent/10 border border-accent/25 text-xs">
              <span className="text-accent font-bold uppercase tracking-wider block mb-1">
                Forward-Looking Mindfulness Focus
              </span>
              <p className="text-theme-primary font-serif-body leading-relaxed">
                {digest.weeklyRecommendation}
              </p>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
