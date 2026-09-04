import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Smile, 
  Flame, 
  BarChart2,
  BookOpen,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sun,
  CloudRain,
  Compass,
  ArrowRight,
  BookHeart,
  TrendingUp,
  Award
} from 'lucide-react';
import { JournalEntry, MonthlyReflection, DigestReport } from '../types';
import { MOOD_PRESETS } from '../lib/constants';
import { generateMonthlyReflection, generateWeeklyDigest } from '../lib/geminiApi';
import { MindVaultMark } from './MindVaultLogo';

interface InsightsDashboardProps {
  entries: JournalEntry[];
  onNavigateToEntry?: (entryId: string) => void;
  onOpenGemini?: () => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ 
  entries,
  onOpenGemini,
}) => {
  // Current active month navigation state (defaults to current calendar month)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Cached monthly reflections map (key: YYYY-MM)
  const [reflectionsCache, setReflectionsCache] = useState<Record<string, MonthlyReflection>>({});
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  // Optional broader digest state
  const [digest, setDigest] = useState<DigestReport | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);

  // Month key: e.g. "2026-09"
  const currentMonthKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedDate]);

  // Month label: e.g. "September 2026"
  const currentMonthLabel = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  // Filter entries strictly for the selected month
  const monthEntries = useMemo(() => {
    return entries.filter(e => {
      const d = typeof e.createdAt === 'string' ? e.createdAt : '';
      return d.startsWith(currentMonthKey);
    });
  }, [entries, currentMonthKey]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setReflectionError(null);
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setReflectionError(null);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setReflectionError(null);
  };

  // Generate or refresh monthly reflection
  const handleReflectOnMonth = async () => {
    if (monthEntries.length === 0) {
      setReflectionError("No journal entries found for this month to reflect upon.");
      return;
    }

    setLoadingReflection(true);
    setReflectionError(null);

    try {
      const result = await generateMonthlyReflection(monthEntries, currentMonthKey);
      if (result.reflection) {
        setReflectionsCache(prev => ({
          ...prev,
          [currentMonthKey]: result.reflection!,
        }));
      } else if (result.message) {
        setReflectionError(result.message);
      }
    } catch (err: any) {
      console.error("[MonthlyReflection] Failed:", err);
      setReflectionError(err.message || "Unable to generate reflection. Please try again.");
    } finally {
      setLoadingReflection(false);
    }
  };

  // Current cached reflection for selected month
  const activeMonthlyReflection = reflectionsCache[currentMonthKey] || null;

  // Compute snapshot metrics
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

  // Recent 12 entries for mood trend visualizer
  const recentEntries = [...entries].reverse().slice(-12);

  const handleGenerateDigest = async () => {
    if (entries.length === 0) return;
    setLoadingDigest(true);
    try {
      const res = await generateWeeklyDigest(entries, 'All Journal Entries');
      setDigest(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDigest(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in max-w-5xl mx-auto pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme/60">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <BookHeart className="w-4 h-4 text-accent" />
            </div>
            <h1 className="font-display font-bold text-2xl text-theme-primary tracking-tight">
              Summary
            </h1>
          </div>
          <p className="text-xs md:text-sm text-theme-secondary font-serif-body">
            A quiet space to understand your thoughts, emotional trajectory, and monthly growth.
          </p>
        </div>

        {onOpenGemini && (
          <button
            onClick={onOpenGemini}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-secondary border border-theme hover:border-accent/40 text-theme-secondary hover:text-accent text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Talk with Gemini</span>
            <ArrowUpRight className="w-3 h-3 text-theme-muted" />
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* PART 1: CURRENT SNAPSHOT                                  */}
      {/* ======================================================== */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-xs tracking-wider uppercase text-theme-muted">
              Current Snapshot
            </h2>
          </div>
          <span className="text-[11px] text-theme-muted font-mono">
            {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} captured
          </span>
        </div>

        {/* 4 Quiet Personal Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          <div className="bg-surface-card border border-theme rounded-2xl p-4 md:p-5 shadow-xs transition-all hover:border-theme/80 space-y-1">
            <div className="flex items-center justify-between text-theme-muted mb-2">
              <span className="text-xs font-medium text-theme-secondary">Total Entries</span>
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <p className="font-display font-bold text-2xl text-theme-primary">{totalEntries}</p>
            <p className="text-[10px] text-theme-muted font-mono">Private & isolated</p>
          </div>

          <div className="bg-surface-card border border-theme rounded-2xl p-4 md:p-5 shadow-xs transition-all hover:border-theme/80 space-y-1">
            <div className="flex items-center justify-between text-theme-muted mb-2">
              <span className="text-xs font-medium text-theme-secondary">Active Days</span>
              <Flame className="w-4 h-4 text-accent" />
            </div>
            <p className="font-display font-bold text-2xl text-theme-primary">{activeDaysCount}</p>
            <p className="text-[10px] text-theme-muted font-mono">Mindful consistency</p>
          </div>

          <div className="bg-surface-card border border-theme rounded-2xl p-4 md:p-5 shadow-xs transition-all hover:border-theme/80 space-y-1">
            <div className="flex items-center justify-between text-theme-muted mb-2">
              <span className="text-xs font-medium text-theme-secondary">Average Mood</span>
              <Smile className="w-4 h-4 text-accent" />
            </div>
            <p className="font-display font-bold text-2xl text-theme-primary">
              {avgMoodScore} <span className="text-xs font-sans font-normal text-theme-muted">/ 5.0</span>
            </p>
            <p className="text-[10px] text-theme-muted font-mono">Emotional baseline</p>
          </div>

          <div className="bg-surface-card border border-theme rounded-2xl p-4 md:p-5 shadow-xs transition-all hover:border-theme/80 space-y-1">
            <div className="flex items-center justify-between text-theme-muted mb-2">
              <span className="text-xs font-medium text-theme-secondary">Reflections</span>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <p className="font-display font-bold text-2xl text-theme-primary">{reflectionsCount}</p>
            <p className="text-[10px] text-theme-muted font-mono">With Gemini guidance</p>
          </div>

        </div>

        {/* Mood Trajectory Visualizer */}
        <div className="bg-surface-card border border-theme rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-accent" />
              <h3 className="font-display font-bold text-sm md:text-base text-theme-primary">
                Mood Trend
              </h3>
            </div>
            <span className="text-xs text-theme-muted font-mono">Recent entries</span>
          </div>

          {recentEntries.length === 0 ? (
            <div className="py-10 text-center text-theme-muted text-xs font-serif-body">
              Write your first journal entries to visualize your mood trajectory over time.
            </div>
          ) : (
            <div className="h-36 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-theme/60">
              {recentEntries.map((e, idx) => {
                const heightPercent = Math.max(16, ((e.moodScore || 3) / 5) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[10px] text-theme-muted opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {e.moodScore}/5
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[24px] rounded-t-md transition-all group-hover:brightness-110 ${
                        e.moodScore >= 4
                          ? 'bg-accent'
                          : e.moodScore === 3
                          ? 'bg-accent/70'
                          : 'bg-theme-muted/40'
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

        {/* Themes & Mood Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Recurring Themes */}
          <div className="bg-surface-card border border-theme rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              <h3 className="font-display font-semibold text-xs text-theme-primary uppercase tracking-wider">
                Recurring Themes
              </h3>
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

          {/* Mood Breakdown */}
          <div className="bg-surface-card border border-theme rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-accent" />
              <h3 className="font-display font-semibold text-xs text-theme-primary uppercase tracking-wider">
                Mood Breakdown
              </h3>
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
      </section>

      {/* ======================================================== */}
      {/* PART 2: THIS MONTH (MONTHLY REFLECTION)                  */}
      {/* ======================================================== */}
      <section className="space-y-6 pt-6 border-t border-theme/60">
        
        {/* Monthly Header & Navigation */}
        <div className="bg-surface-card border border-theme rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase font-mono tracking-widest text-accent font-semibold block mb-1">
                Monthly Reflection
              </span>
              <h2 className="font-display font-bold text-xl md:text-2xl text-theme-primary">
                {currentMonthLabel}
              </h2>
              <p className="text-xs md:text-sm text-theme-secondary font-serif-body mt-1">
                A gentle look back at what showed up in your journal this month.
              </p>
            </div>

            {/* Month Navigator Controls */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="flex items-center bg-surface-secondary border border-theme rounded-xl p-1">
                <button
                  id="month-prev-btn"
                  onClick={handlePrevMonth}
                  title="Previous month"
                  className="p-1.5 rounded-lg hover:bg-surface-card text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCurrentMonth}
                  className="px-3 py-1 text-xs font-mono font-medium text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
                >
                  Current
                </button>
                <button
                  id="month-next-btn"
                  onClick={handleNextMonth}
                  title="Next month"
                  className="p-1.5 rounded-lg hover:bg-surface-card text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Reflect on this month button */}
              <button
                id="reflect-month-btn"
                onClick={handleReflectOnMonth}
                disabled={loadingReflection || monthEntries.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReflection ? 'animate-spin' : ''}`} />
                <span>
                  {loadingReflection 
                    ? 'Reflecting...' 
                    : activeMonthlyReflection 
                    ? 'Refresh Reflection' 
                    : 'Reflect on this month'}
                </span>
              </button>
            </div>
          </div>

          {/* Monthly Entries Count Badge */}
          <div className="flex items-center gap-3 pt-2 text-xs text-theme-muted">
            <span className="font-mono">
              {monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'} in {currentMonthLabel}
            </span>
            {activeMonthlyReflection && (
              <span className="text-[11px] text-accent font-mono">
                • Reflection generated on {new Date(activeMonthlyReflection.generatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Reflection Error Notice */}
          {reflectionError && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-serif-body">
              {reflectionError}
            </div>
          )}

          {/* Empty Month State */}
          {monthEntries.length === 0 && (
            <div className="p-8 rounded-2xl bg-surface-secondary/40 border border-dashed border-theme text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-surface-secondary border border-theme flex items-center justify-center text-theme-muted">
                <MindVaultMark className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display font-medium text-sm text-theme-primary">
                No journal entries found for this month.
              </h3>
              <p className="text-xs text-theme-secondary font-serif-body max-w-sm mx-auto">
                Write down a few thoughts in your journal to reflect on this month.
              </p>
            </div>
          )}

          {/* Empty Reflection state when entries exist but not reflected yet */}
          {monthEntries.length > 0 && !activeMonthlyReflection && !loadingReflection && (
            <div className="p-8 rounded-2xl bg-surface-secondary/30 border border-theme text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs md:text-sm text-theme-secondary font-serif-body max-w-md mx-auto">
                You have {monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'} captured in {currentMonthLabel}. Click above to synthesize your positive moments, challenges, and insights with Gemini.
              </p>
            </div>
          )}

          {/* Loading Reflection State */}
          {loadingReflection && (
            <div className="p-10 rounded-2xl bg-surface-secondary/30 border border-theme text-center space-y-3 animate-pulse">
              <div className="w-10 h-10 mx-auto rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-xs text-theme-secondary font-serif-body">
                Reflecting quietly on your thoughts from {currentMonthLabel}...
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* Active Monthly Reflection Output                          */}
          {/* ======================================================== */}
          {activeMonthlyReflection && !loadingReflection && (
            <div className="space-y-6 pt-4 border-t border-theme/60 animate-fade-in">
              
              {/* 1. YOUR MONTH IN A SENTENCE */}
              <div className="p-6 rounded-2xl bg-surface-secondary/70 border border-theme/80 space-y-2">
                <span className="text-[11px] font-display font-bold text-accent uppercase tracking-wider block">
                  Your Month in a Sentence
                </span>
                <p className="text-sm md:text-base text-theme-primary leading-relaxed font-serif-body italic">
                  "{activeMonthlyReflection.monthInASentence}"
                </p>
              </div>

              {/* 2. Positive Moments & Challenges & Downs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Positive Moments */}
                <div className="p-5 rounded-2xl bg-surface-secondary/40 border border-theme space-y-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-accent" />
                    <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-theme-primary">
                      Positive Moments
                    </h3>
                  </div>
                  {activeMonthlyReflection.positiveMoments.length === 0 ? (
                    <p className="text-xs text-theme-muted font-serif-body">No specific moments highlighted.</p>
                  ) : (
                    <ul className="space-y-2 text-xs md:text-sm text-theme-secondary font-serif-body">
                      {activeMonthlyReflection.positiveMoments.map((moment, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-accent mt-0.5">•</span>
                          <span>{moment}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Challenges & Downs */}
                <div className="p-5 rounded-2xl bg-surface-secondary/40 border border-theme space-y-3">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-theme-muted" />
                    <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-theme-primary">
                      Challenges & Downs
                    </h3>
                  </div>
                  {activeMonthlyReflection.challengesAndDowns.length === 0 ? (
                    <p className="text-xs text-theme-muted font-serif-body">No notable challenges detected.</p>
                  ) : (
                    <ul className="space-y-2 text-xs md:text-sm text-theme-secondary font-serif-body">
                      {activeMonthlyReflection.challengesAndDowns.map((challenge, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-theme-muted mt-0.5">•</span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* 3. WHAT YOU LEARNED */}
              <div className="p-5 rounded-2xl bg-surface-secondary/40 border border-theme space-y-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-accent" />
                  <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-theme-primary">
                    What You Learned
                  </h3>
                </div>
                {activeMonthlyReflection.whatYouLearned.length === 0 ? (
                  <p className="text-xs text-theme-muted font-serif-body">Lessons will unfold with continued journaling.</p>
                ) : (
                  <ul className="space-y-2 text-xs md:text-sm text-theme-secondary font-serif-body">
                    {activeMonthlyReflection.whatYouLearned.map((lesson, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">✦</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 4. CARRYING FORWARD */}
              <div className="p-5.5 rounded-2xl bg-accent/10 border border-accent/25 space-y-2">
                <span className="text-[11px] font-display font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-accent" />
                  <span>Carrying Forward</span>
                </span>
                <p className="text-xs md:text-sm text-theme-primary font-serif-body leading-relaxed">
                  {activeMonthlyReflection.carryingForward}
                </p>
              </div>

            </div>
          )}

        </div>

      </section>

    </div>
  );
};
