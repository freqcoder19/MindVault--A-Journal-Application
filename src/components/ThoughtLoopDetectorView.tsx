import React, { useState } from 'react';
import { 
  Repeat, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  HelpCircle, 
  BookOpen, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  Layers,
  ArrowRight,
  Info,
  Clock,
  Compass
} from 'lucide-react';
import { JournalEntry, ThoughtLoopAnalysis, ThoughtLoopPattern } from '../types';
import { fetchThoughtLoops } from '../lib/geminiApi';

interface ThoughtLoopDetectorViewProps {
  entries: JournalEntry[];
  onSelectPrompt: (promptText: string) => void;
  onGoToJournal: () => void;
  userId?: string;
}

export const ThoughtLoopDetectorView: React.FC<ThoughtLoopDetectorViewProps> = ({
  entries,
  onSelectPrompt,
  onGoToJournal,
  userId,
}) => {
  const [analysis, setAnalysis] = useState<ThoughtLoopAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchThoughtLoops();
      setAnalysis(result);
    } catch (err: any) {
      console.error("Thought Loop detection failed:", err);
      setError(err.message || "Failed to analyze journal history.");
    } finally {
      setLoading(false);
    }
  };

  const getTrendBadge = (trend: ThoughtLoopPattern['trend']) => {
    switch (trend) {
      case 'Increasing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-3 h-3" />
            Increasing Trend
          </span>
        );
      case 'Decreasing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingDown className="w-3 h-3" />
            Decreasing Trend
          </span>
        );
      case 'Fluctuating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Activity className="w-3 h-3" />
            Fluctuating
          </span>
        );
      case 'Stable':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Minus className="w-3 h-3" />
            Stable Pattern
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333333] text-[#f27d26] text-xs font-mono">
            <Repeat className="w-3.5 h-3.5" />
            <span>Longitudinal Pattern Synthesizer • Vertex AI ADC</span>
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
            Thought Loop Detector
          </h2>
          <p className="text-xs md:text-sm text-[#a3a3a3] font-serif-body leading-relaxed">
            Analyzes multiple entries across your confidential journal timeline to detect recurring themes, cyclical concerns, and longitudinal emotional trajectories over time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 z-10 shrink-0 w-full md:w-auto">
          <button
            id="analyze-thought-loops-btn"
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#f27d26] hover:bg-[#e06b16] text-[#0a0a0a] font-bold text-xs md:text-sm shadow-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing Timeline...' : 'Analyze My Journal'}</span>
          </button>
        </div>
      </div>

      {/* Security & Data Boundary Assurance Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-[#121212]/70 border border-[#262626] text-[11px] text-[#737373] font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict UID Isolation: <span className="text-[#d4d4d4]">/users/{userId ? userId.slice(0, 6) + '...' : 'authUid'}/entries</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Max 15 Recent Entries</span>
          <span>•</span>
          <span>Non-Clinical Mindfulness</span>
          <span>•</span>
          <span className="text-[#f27d26]">Gemini 2.5 Flash</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleAnalyze}
            className="px-3 py-1 bg-rose-900/40 hover:bg-rose-900/70 border border-rose-700/50 rounded-lg text-[11px] font-mono text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-12 text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#f27d26]">
            <Repeat className="w-6 h-6 animate-spin text-[#f27d26]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-display font-semibold text-base text-white">
              Synthesizing Cognitive & Emotional Loops...
            </h3>
            <p className="text-xs text-[#737373] font-serif-body">
              Retrieving your isolated journal entries and querying Google Cloud Vertex AI to identify recurring mental cycles without clinical assumptions.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0a] border border-[#262626] text-[10px] font-mono text-[#a3a3a3]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Verifying zero-knowledge boundaries</span>
          </div>
        </div>
      )}

      {/* Initial Empty State (Before Analysis is triggered) */}
      {!loading && !analysis && !error && (
        <div className="bg-[#121212]/60 border border-dashed border-[#262626] rounded-3xl p-10 md:p-14 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#f27d26]">
            <Repeat className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="font-display font-semibold text-lg text-white">
              Discover What Your Mind Returns To
            </h3>
            <p className="text-xs md:text-sm text-[#737373] font-serif-body leading-relaxed">
              Our thoughts frequently repeat across days and weeks. The Thought Loop Detector reads across your recent entries to highlight underlying concerns, emotional trends, and gentle reflection questions to help you break stuck cycles.
            </p>
          </div>

          <div className="pt-2">
            <button
              id="initial-analyze-btn"
              onClick={handleAnalyze}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f27d26]" />
              <span>Run First Thought Loop Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Insufficient Data State */}
      {!loading && analysis && analysis.insufficientData && (
        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-8 md:p-10 text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-display font-semibold text-base text-white">
              More Journal History Needed
            </h3>
            <p className="text-xs text-[#a3a3a3] font-serif-body leading-relaxed">
              {analysis.message || "At least 2-3 journal entries with introspective content are needed to reliably identify longitudinal thought loops."}
            </p>
            <p className="text-[11px] text-[#737373] font-mono">
              Analyzed: {analysis.entriesAnalyzedCount} {analysis.entriesAnalyzedCount === 1 ? 'entry' : 'entries'} found in vault
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onGoToJournal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f27d26] hover:bg-[#e06b16] text-[#0a0a0a] text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Write a Journal Entry</span>
            </button>
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {!loading && analysis && !analysis.insufficientData && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Overarching Summary & Emotional Arc Banner */}
          <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#f27d26]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm md:text-base text-white">
                    Cognitive Overview & Emotional Trajectory
                  </h3>
                  <span className="text-[10px] text-[#737373] font-mono">
                    Synthesized from {analysis.entriesAnalyzedCount} recent private entries • {new Date(analysis.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#0a0a0a] border border-[#262626] text-emerald-400">
                  {analysis.recurringPatterns.length} {analysis.recurringPatterns.length === 1 ? 'Pattern Detected' : 'Patterns Detected'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626] space-y-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-[#f27d26] tracking-wider">
                  Mindset Summary
                </span>
                <p className="text-xs md:text-sm text-[#d4d4d4] font-serif-body leading-relaxed">
                  {analysis.overallSummary}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626] space-y-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-purple-400 tracking-wider">
                  Dominant Emotional Arc
                </span>
                <p className="text-xs text-[#a3a3a3] font-serif-body leading-relaxed">
                  {analysis.dominantEmotionalArc}
                </p>
              </div>
            </div>
          </div>

          {/* List of Recurring Thought Loop Pattern Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold text-[#737373] uppercase tracking-widest font-mono flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#f27d26]" />
                <span>Identified Thought Loops & Recurring Themes</span>
              </h3>
              <span className="text-[11px] text-[#525252] font-mono">
                Click any question to reflect in Journal
              </span>
            </div>

            {analysis.recurringPatterns.map((pattern, idx) => (
              <div
                key={idx}
                className="bg-[#121212] border border-[#262626] hover:border-[#383838] rounded-3xl p-5 md:p-6 shadow-xl transition-all space-y-4"
              >
                {/* Pattern Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#262626]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-xs font-mono font-bold text-[#f27d26]">
                        {idx + 1}
                      </span>
                      <h4 className="font-display font-bold text-base md:text-lg text-white">
                        {pattern.theme}
                      </h4>
                    </div>
                    {pattern.description && (
                      <p className="text-xs text-[#a3a3a3] font-serif-body pl-9">
                        {pattern.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-9 sm:pl-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#1a1a1a] text-[#d4d4d4] border border-[#333333]">
                      <Clock className="w-3 h-3 text-[#f27d26]" />
                      {pattern.frequency}
                    </span>
                    {getTrendBadge(pattern.trend)}
                  </div>
                </div>

                {/* Related Themes and Emotional Movement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  
                  {/* Related Themes */}
                  {pattern.relatedThemes && pattern.relatedThemes.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#0a0a0a] border border-[#262626] space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#737373] tracking-wider block">
                        Interconnected Themes
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pattern.relatedThemes.map((theme, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2.5 py-0.5 rounded-lg bg-[#1a1a1a] border border-[#333333] text-[11px] text-[#d4d4d4]"
                          >
                            #{theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotional Movement */}
                  {pattern.emotionalTrend && (
                    <div className="p-3.5 rounded-2xl bg-[#0a0a0a] border border-[#262626] space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#737373] tracking-wider block">
                        Emotional Trajectory
                      </span>
                      <p className="text-xs text-[#d4d4d4] font-serif-body">
                        {pattern.emotionalTrend}
                      </p>
                    </div>
                  )}

                </div>

                {/* Reflective Insight */}
                {pattern.reflectiveInsight && (
                  <div className="p-4 rounded-2xl bg-[#171410] border border-[#f27d26]/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#f27d26] tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Reflective Insight
                    </span>
                    <p className="text-xs md:text-sm text-[#e5e5e5] font-serif-body leading-relaxed">
                      "{pattern.reflectiveInsight}"
                    </p>
                  </div>
                )}

                {/* Gentle Reflection Question & Action Button */}
                {pattern.reflectionQuestion && (
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" /> Gentle Inquiry Question
                      </span>
                      <p className="text-xs md:text-sm text-white font-serif-body italic">
                        {pattern.reflectionQuestion}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectPrompt(pattern.reflectionQuestion)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#f27d26] text-[#d4d4d4] hover:text-[#0a0a0a] border border-[#333333] hover:border-[#f27d26] text-xs font-semibold transition-all cursor-pointer"
                      title="Pre-fill this question in your Journal editor"
                    >
                      <span>Reflect in Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Non-Clinical Ethics Disclaimer */}
      <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626] text-center text-[11px] text-[#525252] font-serif-body">
        Thought Loop Detector is an introspective self-reflection tool powered by Google Cloud Vertex AI (Gemini 2.5 Flash). It does not provide clinical, psychological, or medical diagnoses.
      </div>

    </div>
  );
};
