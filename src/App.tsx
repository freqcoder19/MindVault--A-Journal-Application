import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  User, 
  firebaseSignOut
} from './lib/firebase';
import { 
  subscribeToEntries, 
  subscribeToAuditLogs, 
  saveJournalEntry, 
  updateJournalEntry, 
  deleteJournalEntry, 
  recordAuditLog,
  ensureUserDocument
} from './lib/journalService';
import { JournalEntry, SecurityAuditLog, SecurityStatusReport, MoodType } from './types';
import { MOOD_PRESETS } from './lib/constants';
import { NavigationHeader } from './components/NavigationHeader';
import { JournalEditor } from './components/JournalEditor';
import { EntryCard } from './components/EntryCard';
import { DailyThoughtCard } from './components/DailyThoughtCard';
import { GeminiCompanionView } from './components/GeminiCompanionView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { InsightsDashboard } from './components/InsightsDashboard';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthModal } from './components/AuthModal';
import { PasskeyModal } from './components/PasskeyModal';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';
import { fetchSecurityStatus, requestAIReflection } from './lib/geminiApi';
import { decryptText } from './lib/security';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  FolderLock,
  ArrowRight,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active View Tab: Normal users see only journal, gemini, insights, profile
  const [activeTab, setActiveTab] = useState<'journal' | 'gemini' | 'insights' | 'profile' | 'admin'>('journal');

  // Journal & Audit State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showEditor, setShowEditor] = useState(true);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | null>(null);

  // Gemini Companion State
  const [geminiFocusedEntry, setGeminiFocusedEntry] = useState<JournalEntry | null>(null);
  const [geminiInitialPrompt, setGeminiInitialPrompt] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');

  // Client-Side Zero-Knowledge Vault Encryption State
  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [vaultPasskey, setVaultPasskey] = useState<string | null>(null);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);

  // Security backend health
  const [securityStatus, setSecurityStatus] = useState<SecurityStatusReport | null>(null);
  const [isEntryReflectingId, setIsEntryReflectingId] = useState<string | null>(null);

  // Listen to Firebase Auth state & verify custom claims strictly for barathsuresh19@gmail.com
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        ensureUserDocument(user.uid, user.email, user.displayName);
        recordAuditLog(user.uid, "SESSION_START", "SUCCESS", `Auth session active for ${user.email || user.uid}`, "FIREBASE_AUTH");
        try {
          // Cryptographically verified token result from Firebase Auth with forced refresh
          let tokenResult = await user.getIdTokenResult(true);
          const isDesignatedEmail = (user.email || "").toLowerCase().trim() === "barathsuresh19@gmail.com";
          let hasAdminClaim = tokenResult.claims.admin === true;

          // If designated admin lacks claim, attempt backend assignment bootstrap
          if (isDesignatedEmail && !hasAdminClaim) {
            try {
              const res = await fetch("/api/auth/verify-admin-claim", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${await user.getIdToken()}`,
                },
              });
              const json = await res.json();
              if (json.refreshRequired || json.adminClaimAssigned) {
                tokenResult = await user.getIdTokenResult(true);
                hasAdminClaim = tokenResult.claims.admin === true;
              }
            } catch {
              // Non-blocking
            }
          }

          // UX helper only; real authorization boundary is strictly enforced on the backend
          setIsAdminVerified(isDesignatedEmail && hasAdminClaim);
        } catch {
          setIsAdminVerified(false);
        }
      } else {
        setIsAdminVerified(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // UX Guard: Normal users without verified admin claim cannot navigate to admin tab
  useEffect(() => {
    if (activeTab === 'admin' && !isAdminVerified && !authLoading) {
      setActiveTab('journal');
    }
  }, [activeTab, isAdminVerified, authLoading]);

  // Fetch security status report
  useEffect(() => {
    fetchSecurityStatus()
      .then((status) => setSecurityStatus(status))
      .catch((err) => console.warn("Could not fetch security status:", err));
  }, []);

  // Subscribe to Firestore isolated entries when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setEntries([]);
      setAuditLogs([]);
      return;
    }

    const unsubscribeEntries = subscribeToEntries(
      currentUser.uid,
      (loadedEntries) => {
        setEntries(loadedEntries);
      },
      (error) => {
        console.error("Failed to subscribe to user entries:", error);
      }
    );

    const unsubscribeAudit = subscribeToAuditLogs(
      currentUser.uid,
      (loadedLogs) => {
        setAuditLogs(loadedLogs);
      }
    );

    return () => {
      unsubscribeEntries();
      unsubscribeAudit();
    };
  }, [currentUser]);

  // Sign out handler
  const handleSignOut = async () => {
    if (currentUser) {
      await recordAuditLog(currentUser.uid, "USER_SIGNOUT", "SUCCESS", "User terminated session", "FIREBASE_AUTH");
    }
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setIsAdminVerified(false);
    setVaultPasskey(null);
    setIsVaultLocked(false);
    setEntries([]);
    setEditingEntry(null);
  };

  // Toggle Vault Lock
  const handleToggleVaultLock = () => {
    if (isVaultLocked) {
      setIsPasskeyModalOpen(true);
    } else {
      setIsVaultLocked(true);
    }
  };

  // Unlock Vault with Passkey
  const handleUnlockVault = (passkey: string) => {
    setVaultPasskey(passkey);
    setIsVaultLocked(false);
    if (currentUser) {
      recordAuditLog(currentUser.uid, "CLIENT_VAULT_UNLOCK", "SUCCESS", "Local Zero-Knowledge passkey unlocked", "CLIENT_VAULT");
    }
  };

  // Save or Update Entry
  const handleSaveEntry = async (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string | void> => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    let savedId: string | void;
    if (editingEntry) {
      await updateJournalEntry(currentUser.uid, editingEntry.id, entryData);
      savedId = editingEntry.id;
      setEditingEntry(null);
    } else {
      savedId = await saveJournalEntry(currentUser.uid, entryData);
    }
    setPrefilledPrompt(null);
    return savedId;
  };

  // Delete Entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    await deleteJournalEntry(currentUser.uid, entryId);
  };

  // Prompt selection handler
  const handleSelectPrompt = (promptText: string) => {
    setPrefilledPrompt(promptText);
    setEditingEntry(null);
    setShowEditor(true);
    setActiveTab('journal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick edit entry
  const handleStartEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEditor(true);
    setActiveTab('journal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Request AI Reflection directly for an entry
  const handleRequestReflectionForEntry = async (entry: JournalEntry) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (entry.isEncrypted && isVaultLocked) {
      setIsPasskeyModalOpen(true);
      return;
    }

    setIsEntryReflectingId(entry.id);
    try {
      let contentToReflect = entry.content;
      if (entry.isEncrypted && entry.encryptedPayload && vaultPasskey) {
        try {
          contentToReflect = await decryptText(entry.encryptedPayload, vaultPasskey);
        } catch {
          // Keep raw content
        }
      }

      const reflection = await requestAIReflection({
        entryId: entry.id,
        content: contentToReflect,
        mood: entry.mood,
        moodScore: entry.moodScore,
        tags: entry.tags,
        persona: 'empathetic',
      });

      // Persist to user's isolated Firestore subcollection
      await updateJournalEntry(currentUser.uid, entry.id, {
        aiReflection: reflection,
      });

      // Update in-memory state
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, aiReflection: reflection } : e))
      );
    } catch (err: any) {
      console.error("[Gemini Reflection Error]:", err);
      alert(err.message || "Failed to generate reflection securely.");
    } finally {
      setIsEntryReflectingId(null);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesSearch = 
      searchQuery.trim().length === 0 ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.content && e.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.tags && e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesMood = filterMood === 'all' || e.mood === filterMood;
    const matchesTag = filterTag === 'all' || (e.tags && e.tags.includes(filterTag));

    return matchesSearch && matchesMood && matchesTag;
  });

  // Extract all unique user tags
  const allUserTags = Array.from(new Set(entries.flatMap((e) => e.tags || [])));

  // Count AI reflections
  const entriesWithReflections = entries.filter((e) => !!e.aiReflection);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090c0e] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-[#11171a] border border-[#232f36] flex items-center justify-center text-[#48ab9e] shadow-[0_0_24px_rgba(72,171,158,0.2)] animate-pulse">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="mt-4 font-display font-semibold tracking-widest uppercase text-xs text-[#7c827d]">
          MindVault
        </p>
      </div>
    );
  }

  // Unauthenticated visitors see the dedicated Welcome / Home landing page
  if (!currentUser) {
    return (
      <>
        <WelcomeLandingPage
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-theme-primary flex flex-col font-sans transition-colors">
      
      {/* Top Header with Light/Dark Mode Switcher */}
      <NavigationHeader
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        isVaultLocked={isVaultLocked}
        onToggleVaultLock={handleToggleVaultLock}
        hasPasskeyConfigured={!!vaultPasskey}
        securityStatus={securityStatus}
        isAdminVerified={isAdminVerified}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8">
        
        {/* TAB 1: JOURNAL (Daily Thought + Editor + Timeline + Quick Actions) */}
        {activeTab === 'journal' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* 1. Today's Thought / Positive Reflection Card */}
            <DailyThoughtCard
              onTalkToGemini={(prompt) => {
                setGeminiInitialPrompt(prompt);
                setGeminiFocusedEntry(null);
                setActiveTab('gemini');
              }}
            />

            {/* 2. Editor Container */}
            {showEditor && currentUser && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-base text-theme-primary uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span>{editingEntry ? 'Editing MindVault Entry' : 'Daily Introspection & Reflection'}</span>
                  </h2>

                  {editingEntry && (
                    <button
                      onClick={() => setEditingEntry(null)}
                      className="text-xs text-theme-muted hover:text-accent underline transition-colors"
                    >
                      + Write New Entry Instead
                    </button>
                  )}
                </div>

                <JournalEditor
                  userId={currentUser.uid}
                  initialEntry={editingEntry}
                  onSave={handleSaveEntry}
                  onCancelEdit={editingEntry ? () => setEditingEntry(null) : undefined}
                  vaultPasskey={vaultPasskey}
                  onOpenPasskeyModal={() => setIsPasskeyModalOpen(true)}
                  defaultPrompt={prefilledPrompt}
                  onTalkToGeminiEntry={(savedEntry) => {
                    setGeminiFocusedEntry(savedEntry);
                    setGeminiInitialPrompt(null);
                    setActiveTab('gemini');
                  }}
                  onNavigateToGemini={() => {
                    setActiveTab('gemini');
                  }}
                />
              </div>
            )}

            {/* 3. Filter & Search Bar */}
            <div className="bg-surface-card border border-theme rounded-2xl p-4 md:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              
              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-theme-muted" />
                <input
                  id="journal-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search thoughts, memories, tags..."
                  className="w-full bg-surface-secondary border border-theme rounded-xl pl-10 pr-4 py-2 text-xs text-theme-primary placeholder-theme-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Mood & Tag Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                
                {/* Mood Filter */}
                <select
                  id="journal-mood-filter-select"
                  value={filterMood}
                  onChange={(e) => setFilterMood(e.target.value)}
                  className="text-xs bg-surface-secondary border border-theme text-theme-primary rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="all">All Moods ({entries.length})</option>
                  {MOOD_PRESETS.map((m) => (
                    <option key={m.type} value={m.type}>
                      {m.emoji} {m.label.split('/')[0]}
                    </option>
                  ))}
                </select>

                {/* Tag Filter */}
                {allUserTags.length > 0 && (
                  <select
                    id="journal-tag-filter-select"
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="text-xs bg-surface-secondary border border-theme text-theme-primary rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="all">All Tags</option>
                    {allUserTags.map((t) => (
                      <option key={t} value={t}>#{t}</option>
                    ))}
                  </select>
                )}

                {/* Clear filters button if active */}
                {(searchQuery || filterMood !== 'all' || filterTag !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterMood('all');
                      setFilterTag('all');
                    }}
                    className="text-xs text-theme-muted hover:text-accent px-2 py-1 underline font-mono transition-colors"
                  >
                    Reset
                  </button>
                )}

              </div>
            </div>

            {/* 4. Timeline Entries List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-theme-muted uppercase tracking-widest font-mono">
                  Isolated Journal Timeline ({filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'})
                </span>

                {currentUser && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Scoped: /users/{currentUser.uid.slice(0, 6)}...
                  </span>
                )}
              </div>

              {filteredEntries.length === 0 ? (
                <div className="bg-surface-card border border-dashed border-theme rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-surface-secondary border border-theme flex items-center justify-center text-theme-muted">
                    <FolderLock className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-display font-semibold text-base text-theme-primary">
                    {entries.length === 0 ? 'Your MindVault is Empty' : 'No matching entries found'}
                  </h3>
                  <p className="text-xs text-theme-secondary font-serif-body max-w-sm mx-auto">
                    {entries.length === 0 
                      ? 'Begin your personal journey by capturing your current state of mind and photos above.' 
                      : 'Try adjusting your search terms or filter criteria.'}
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    userId={currentUser?.uid || ''}
                    isVaultLocked={isVaultLocked}
                    vaultPasskey={vaultPasskey}
                    onEdit={handleStartEdit}
                    onDelete={handleDeleteEntry}
                    onOpenPasskeyModal={() => setIsPasskeyModalOpen(true)}
                    onSelectInquiryQuestion={handleSelectPrompt}
                    onRequestReflection={handleRequestReflectionForEntry}
                    isReflecting={isEntryReflectingId === entry.id}
                  />
                ))
              )}
            </div>

            {/* 5. Quick Access to Gemini & Subtle Insights Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div 
                id="home-talk-gemini-card"
                onClick={() => {
                  setGeminiFocusedEntry(null);
                  setGeminiInitialPrompt(null);
                  setActiveTab('gemini');
                }}
                className="p-5 rounded-3xl bg-surface-card hover:bg-surface-secondary border border-theme hover:border-accent/40 transition-all cursor-pointer group shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-theme-primary">Talk with Gemini</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-theme-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-theme-secondary font-serif-body">
                  Discuss recent feelings, explore recurring thoughts, or unpack your day in a private, supportive dialogue.
                </p>
              </div>

              <div 
                id="home-insights-preview-card"
                onClick={() => setActiveTab('insights')}
                className="p-5 rounded-3xl bg-surface-card hover:bg-surface-secondary border border-theme hover:border-accent/40 transition-all cursor-pointer group shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-theme-primary">Summary & Insights</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-theme-muted group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-theme-secondary font-serif-body">
                  {entries.length > 0 
                    ? `View your mood trajectory across ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}, cognitive tags, and temporal consistency.` 
                    : 'Track your mood trajectories, cognitive tags, and personal growth trends over time.'}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: GEMINI COMPANION VIEW */}
        {activeTab === 'gemini' && (
          <div className="animate-fade-in">
            <GeminiCompanionView
              userId={currentUser?.uid}
              entries={entries}
              focusedEntry={geminiFocusedEntry}
              initialPrompt={geminiInitialPrompt}
              onClearFocusedEntry={() => setGeminiFocusedEntry(null)}
            />
          </div>
        )}

        {/* TAB 3: SUMMARY & INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="animate-fade-in">
            <InsightsDashboard 
              entries={entries} 
              onOpenGemini={() => setActiveTab('gemini')}
            />
          </div>
        )}

        {/* TAB 4: PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <ProfileSettingsView
              currentUser={currentUser}
              entries={entries}
              isVaultLocked={isVaultLocked}
              onToggleVaultLock={handleToggleVaultLock}
              hasPasskeyConfigured={!!vaultPasskey}
              onOpenPasskeyModal={() => setIsPasskeyModalOpen(true)}
              onSignOut={handleSignOut}
              securityStatus={securityStatus}
              onOpenAdminDashboard={() => setActiveTab('admin')}
              isAdminVerified={isAdminVerified}
            />
          </div>
        )}

        {/* TAB 5: ADMIN & RBAC DASHBOARD (Protected server-side by requireAdmin) */}
        {activeTab === 'admin' && (
          <div className="animate-fade-in">
            <AdminDashboardView
              currentUserEmail={currentUser?.email || undefined}
              onGoToJournal={() => setActiveTab('journal')}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-theme bg-surface-card py-6 px-4 text-center text-xs text-theme-muted font-mono space-y-1 transition-colors">
        <p>
          System: <span className="text-accent font-medium">mindvault-507114</span> • Database: <span className="text-theme-secondary">ai-studio-5307edf2-554e-46d5-8531-ff81d7300d1c</span>
        </p>
        <p className="text-[11px] text-theme-muted font-serif-body italic">
          Zero-Trust Security Constitution Enforced • Verified Firebase UID Isolation • Client AES-GCM Storage
        </p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Passkey / Zero-Knowledge Unlock Modal */}
      <PasskeyModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        onUnlock={handleUnlockVault}
        hasStoredHash={!!vaultPasskey}
      />

    </div>
  );
}
