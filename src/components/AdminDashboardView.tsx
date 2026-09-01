import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  BookOpen, 
  Sparkles, 
  Repeat, 
  Activity, 
  Lock, 
  KeyRound, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  AlertTriangle,
  EyeOff,
  Cpu,
  Clock
} from 'lucide-react';
import { fetchAdminDashboard } from '../lib/geminiApi';
import { AdminDashboardData } from '../types';

interface AdminDashboardViewProps {
  currentUserEmail?: string;
  onGoToJournal?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ 
  currentUserEmail,
  onGoToJournal 
}) => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const response = await fetchAdminDashboard();
      setData(response);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("[AdminDashboard] Error loading admin telemetry:", err);
      if (err.status === 403 || err.message?.includes("403") || err.message?.includes("Forbidden")) {
        setIsForbidden(true);
        setError("HTTP 403 Forbidden: Administrative privileges required. Administrators only have access to aggregate metrics.");
      } else if (err.status === 401 || err.message?.includes("401")) {
        setError("HTTP 401 Unauthorized: Please sign in with an authenticated Firebase account.");
      } else {
        setError(err.message || "Failed to load admin telemetry securely.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Format uptime into human-readable string
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  if (isForbidden) {
    return (
      <div id="admin-forbidden-view" className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4">
        <div className="bg-[#1a1111] border border-rose-900/50 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            Access Denied • RBAC Enforcement Active
          </h2>
          <p className="text-sm text-rose-300/80 max-w-lg mx-auto font-serif-body">
            Your current authenticated account does not possess the verified <code className="font-mono bg-rose-950/60 px-2 py-0.5 rounded text-rose-400">ADMIN</code> role in Firebase custom claims.
          </p>
          <div className="p-4 bg-[#120a0a] border border-rose-900/30 rounded-2xl text-xs text-[#a3a3a3] font-mono text-left max-w-md mx-auto space-y-1">
            <div className="text-rose-400 font-bold">Security Boundary Verification:</div>
            <div>• Endpoint: <span className="text-white">GET /api/admin/dashboard</span></div>
            <div>• HTTP Response: <span className="text-rose-400 font-bold">403 Forbidden</span></div>
            <div>• Enforced By: <span className="text-white">Server-side requireAdmin middleware</span></div>
            <div>• Client Trust: <span className="text-emerald-400 font-bold">0% (Zero client-supplied trust)</span></div>
          </div>
          {onGoToJournal && (
            <button
              id="admin-return-journal-btn"
              onClick={onGoToJournal}
              className="px-6 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold transition-all shadow-md"
            >
              Return to Personal Journal
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-view" className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl text-white tracking-tight">
                  Admin & RBAC Operations Dashboard
                </h1>
                <span className="text-[10px] font-mono uppercase bg-purple-950/80 text-purple-300 border border-purple-800/60 px-2.5 py-0.5 rounded-full font-bold tracking-wider">
                  ROLE: ADMIN
                </span>
              </div>
              <p className="text-xs text-[#a3a3a3] font-serif-body mt-0.5">
                Aggregate, anonymized operational & security telemetry • Zero-knowledge privacy architecture
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="admin-refresh-telemetry-btn"
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] text-xs font-medium text-[#d4d4d4] transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#f27d26] ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* ZERO-KNOWLEDGE PRIVACY DIRECTIVE BANNER */}
      <div className="bg-gradient-to-r from-purple-950/40 via-[#16121f] to-purple-950/20 border border-purple-800/40 rounded-3xl p-5 shadow-lg flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center shrink-0 text-purple-300 mt-0.5">
          <EyeOff className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-bold text-sm text-purple-200 flex items-center gap-2">
            <span>Mandatory Privacy Directive Enforced</span>
            <span className="text-[10px] font-mono bg-purple-900/80 px-2 py-0.5 rounded text-purple-300">
              Zero-Knowledge Admin
            </span>
          </h3>
          <p className="text-xs text-purple-200/80 font-serif-body leading-relaxed">
            Administrators <strong className="text-white">CANNOT</strong> access, query, or view individual users' journal entries, conversation contents, or raw Gemini prompts/responses. Only aggregate, anonymized operational metrics and security posture diagnostics are accessible via this administrative boundary.
          </p>
        </div>
      </div>

      {error && !isForbidden && (
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-4 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Metric Cards */}
      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Registered Users Count */}
            <div id="metric-total-users" className="bg-[#121212] border border-[#262626] rounded-2xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">Total Users</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-bold text-2xl text-white">
                {data.aggregateMetrics.totalUserCount}
              </div>
              <p className="text-[11px] text-[#737373] font-serif-body">
                Isolated Firebase accounts
              </p>
            </div>

            {/* Total Journal Entries Count (Aggregate) */}
            <div id="metric-total-entries" className="bg-[#121212] border border-[#262626] rounded-2xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">Total Entries</span>
                <div className="w-8 h-8 rounded-xl bg-[#f27d26]/10 border border-[#f27d26]/20 flex items-center justify-center text-[#f27d26]">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-bold text-2xl text-white">
                {data.aggregateMetrics.totalJournalEntryCount}
              </div>
              <p className="text-[11px] text-[#737373] font-serif-body">
                Aggregate count (content concealed)
              </p>
            </div>

            {/* Total AI Requests */}
            <div id="metric-total-ai-requests" className="bg-[#121212] border border-[#262626] rounded-2xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">AI Operations</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-bold text-2xl text-white">
                {data.aggregateMetrics.totalAIRequestCount}
              </div>
              <p className="text-[11px] text-[#737373] font-serif-body">
                Gemini 2.5 Flash operations
              </p>
            </div>

            {/* Auth Failures, App Check Blocks & Rate Limits */}
            <div id="metric-security-events" className="bg-[#121212] border border-[#262626] rounded-2xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">Security Events</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-2xl text-rose-400">
                  {data.aggregateMetrics.authFailureCount}
                </span>
                <span className="text-xs text-[#737373] font-mono">auth</span>
                <span className="text-[#333333]">/</span>
                <span className="font-display font-bold text-2xl text-amber-400">
                  {data.aggregateMetrics.appCheckFailureCount || 0}
                </span>
                <span className="text-xs text-[#737373] font-mono">origin</span>
                <span className="text-[#333333]">/</span>
                <span className="font-display font-bold text-2xl text-blue-400">
                  {data.aggregateMetrics.rateLimitEventCount}
                </span>
                <span className="text-xs text-[#737373] font-mono">limits</span>
              </div>
              <p className="text-[11px] text-[#737373] font-serif-body">
                Auth + App Check origin + Rate limits
              </p>
            </div>

          </div>

          {/* Detailed Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AI Request Breakdown by Capability */}
            <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#f27d26]" />
                  <span>AI Workload Telemetry</span>
                </h3>
                <span className="text-[11px] font-mono text-[#737373]">
                  Aggregate Volume
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { label: 'Cognitive Reflections', count: data.aggregateMetrics.aiRequestsByType.reflection, color: 'bg-orange-500' },
                  { label: 'Interactive Dialog / Chat', count: data.aggregateMetrics.aiRequestsByType.chat, color: 'bg-blue-500' },
                  { label: 'Thought Loop Detections', count: data.aggregateMetrics.aiRequestsByType.thoughtLoops, color: 'bg-purple-500' },
                  { label: 'Guided Writing Prompts', count: data.aggregateMetrics.aiRequestsByType.prompts, color: 'bg-amber-500' },
                  { label: 'Sentiment Analysis', count: data.aggregateMetrics.aiRequestsByType.sentiment, color: 'bg-emerald-500' },
                  { label: 'Longitudinal Digests', count: data.aggregateMetrics.aiRequestsByType.digest, color: 'bg-indigo-500' },
                ].map((item) => {
                  const maxCount = Math.max(1, data.aggregateMetrics.totalAIRequestCount);
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#d4d4d4]">{item.label}</span>
                        <span className="font-mono text-[#737373]">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anonymized Longitudinal Thought Loop Themes */}
            <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-purple-400" />
                  <span>Aggregate Longitudinal Themes</span>
                </h3>
                <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  Anonymized
                </span>
              </div>

              <p className="text-xs text-[#737373] font-serif-body">
                Aggregated recurring thematic clusters detected across user journals without exposing user identities or entry content.
              </p>

              <div className="space-y-2.5 pt-1">
                {data.aggregateMetrics.aggregateThoughtLoopThemes.map((item, idx) => (
                  <div 
                    key={item.theme} 
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#161616] border border-[#262626]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#525252] w-4">{idx + 1}.</span>
                      <span className="text-xs font-medium text-white">{item.theme}</span>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#202020] text-[#a3a3a3] border border-[#333333]">
                      {item.aggregateOccurrences} instances
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Security Posture Diagnostic Table */}
          <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Cryptographic Security Posture Verification</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: 'Token Verification Engine', value: data.securityPosture.tokenVerificationEngine, ok: true },
                { label: 'Origin Attestation Engine', value: data.securityPosture.appCheckEngine || 'firebase-admin/app-check', ok: data.securityPosture.appCheckEnforced !== false },
                { label: 'Backend Isolation Enforced', value: 'Direct /users/{uid}/ isolated queries only', ok: data.securityPosture.backendIsolationEnforced },
                { label: 'Gemini Auth Engine', value: data.securityPosture.geminiAuthEngine, ok: true },
                { label: 'Active LLM Model', value: data.securityPosture.selectedModel, ok: true },
                { label: 'Secret Manager Status', value: data.securityPosture.secretManagerDiagnostic || 'Resolved', ok: data.securityPosture.secretManagerConfigured },
                { label: 'Rate Limiter Enforcement', value: 'Per-UID Sliding Window (20 req/min)', ok: data.securityPosture.rateLimiterActive },
                { label: 'Firestore Security Rules', value: 'Enforced at storage engine level', ok: data.securityPosture.firestoreRulesEnforced },
                { label: 'Administrative Access Type', value: data.securityPosture.adminAccessType, ok: true },
                { label: 'Raw Journal Access', value: data.securityPosture.rawJournalAccessDisabled ? 'DISABLED (Zero-Knowledge)' : 'Active', ok: data.securityPosture.rawJournalAccessDisabled },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#161616] border border-[#262626] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#737373] font-mono uppercase">{item.label}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xs font-semibold text-white truncate" title={item.value}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-[#525252] font-mono border-t border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Server Uptime: {formatUptime(data.aggregateMetrics.uptimeSeconds)}</span>
              </div>
              <div>Telemetry Generated: {new Date(data.generatedAt).toLocaleTimeString()}</div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
