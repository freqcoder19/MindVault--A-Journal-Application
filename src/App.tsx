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
import { AIReflectionCard } from './components/AIReflectionCard';
import { InsightsDashboard } from './components/InsightsDashboard';
import { GuidedPromptsView } from './components/GuidedPromptsView';
import { ThoughtLoopDetectorView } from './components/ThoughtLoopDetectorView';
import { SecurityConstitutionModal } from './components/SecurityConstitutionModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthModal } from './components/AuthModal';
import { PasskeyModal } from './components/PasskeyModal';
import { fetchSecurityStatus } from './lib/geminiApi';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  KeyRound, 
  AlertCircle,
  FolderLock,
  Repeat
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'journal' | 'reflections' | 'loops' | 'insights' | 'prompts' | 'security' | 'admin'>('journal');

  // Journal & Audit State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showEditor, setShowEditor] = useState(true);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | null>(null);

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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        ensureUserDocument(user.uid, user.email, user.displayName);
        fetchSecurityStatus().then(setSecurityStatus).catch(() => {});
      } else {
        setEntries([]);
        setAuditLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time subscriptions when user changes
  useEffect(() => {
    if (!currentUser) return;

    const unsubEntries = subscribeToEntries(
      currentUser.uid,
      (newEntries) => setEntries(newEntries),
      (err) => console.warn("Entries subscription warning:", err)
    );

    const unsubLogs = subscribeToAuditLogs(
      currentUser.uid,
      (newLogs) => setAuditLogs(newLogs)
    );

    return () => {
      unsubEntries();
      unsubLogs();
    };
  }, [currentUser]);

  // Sign out handler
  const handleSignOut = async () => {
    if (currentUser) {
      await recordAuditLog(currentUser.uid, "AUTH_SIGNOUT", "SUCCESS", "User session ended cleanly", "FIREBASE_AUTH");
    }
    await firebaseSignOut(auth);
    setVaultPasskey(null);
    setIsVaultLocked(true);
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
  const handleSaveEntry = async (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (editingEntry) {
      await updateJournalEntry(currentUser.uid, editingEntry.id, entryData);
      setEditingEntry(null);
    } else {
      await saveJournalEntry(currentUser.uid, entryData);
    }
    setPrefilledPrompt(null);
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

  // Extract all distinct tags from user's entries
  const allUserTags = Array.from(
    new Set(entries.flatMap(e => e.tags || []))
  );

  // Entries with reflections for Reflections Tab
  const entriesWithReflections = entries.filter(e => !!e.aiReflection);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] flex flex-col font-sans selection:bg-[#f27d26]/30 selection:text-[#f27d26]">
      
      {/* Top Header */}
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8">
        
        {/* Unauthenticated Security Callout Banner */}
        {!currentUser && !authLoading && (
          <div className="mb-8 p-6 md:p-8 rounded-3xl bg-[#121212] border border-[#262626] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333333] text-[#f27d26] text-xs font-mono">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Zero-Trust Architecture • Google Cloud mindvault-507114</span>
              </div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-white">
                MindVault: Personal Gemini Journal
              </h1>
              <p className="text-xs md:text-sm text-[#a3a3a3] font-serif-body leading-relaxed">
                Experience confidential self-reflection with server-isolated Gemini AI, zero-knowledge client vaults, and database security rules strictly locking data to your authenticated UID.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 z-10 shrink-0 w-full md:w-auto">
              <button
                id="landing-signin-btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-[#f27d26] hover:bg-[#e06b16] text-[#0a0a0a] font-bold text-xs md:text-sm shadow-xl transition-all text-center cursor-pointer"
              >
                Sign In / Open Vault
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: JOURNAL (Editor + Timeline) */}
        {activeTab === 'journal' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Editor Container */}
            {showEditor && currentUser && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#f27d26]" />
                    <span>{editingEntry ? 'Editing MindVault Entry' : 'Daily Introspection & Reflection'}</span>
                  </h2>

                  {editingEntry && (
                    <button
                      onClick={() => setEditingEntry(null)}
                      className="text-xs text-[#a3a3a3] hover:text-[#f27d26] underline transition-colors"
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
                />
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-[#121212] border border-[#262626] rounded-2xl p-4 md:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
              
              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#737373]" />
                <input
                  id="journal-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search thoughts, tags, reflections..."
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-2 text-xs text-[#d4d4d4] placeholder-[#525252] focus:outline-none focus:border-[#f27d26]/60 transition-colors"
                />
              </div>

              {/* Mood & Tag Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                
                {/* Mood Filter */}
                <select
                  id="journal-mood-filter-select"
                  value={filterMood}
                  onChange={(e) => setFilterMood(e.target.value)}
                  className="text-xs bg-[#0a0a0a] border border-[#262626] text-[#d4d4d4] rounded-xl px-3 py-2 focus:outline-none focus:border-[#f27d26]/60"
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
                    className="text-xs bg-[#0a0a0a] border border-[#262626] text-[#d4d4d4] rounded-xl px-3 py-2 focus:outline-none focus:border-[#f27d26]/60"
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
                    className="text-xs text-[#737373] hover:text-[#f27d26] px-2 py-1 underline font-mono transition-colors"
                  >
                    Reset
                  </button>
                )}

              </div>
            </div>

            {/* Timeline Entries List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-widest font-mono">
                  Isolated Journal Timeline ({filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'})
                </span>

                {currentUser && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Scoped: /users/{currentUser.uid.slice(0, 6)}...
                  </span>
                )}
              </div>

              {filteredEntries.length === 0 ? (
                <div className="bg-[#121212]/50 border border-dashed border-[#262626] rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#737373]">
                    <FolderLock className="w-6 h-6 text-[#f27d26]" />
                  </div>
                  <h3 className="font-display font-semibold text-base text-white">
                    {entries.length === 0 ? 'Your MindVault is Empty' : 'No matching entries found'}
                  </h3>
                  <p className="text-xs text-[#737373] font-serif-body max-w-sm mx-auto">
                    {entries.length === 0 
                      ? 'Begin your personal journey by capturing your current state of mind above.' 
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
                    onRequestReflection={handleStartEdit}
                  />
                ))
              )}
            </div>

          </div>
        )}

        {/* TAB 2: AI REFLECTIONS STREAM */}
        {activeTab === 'reflections' && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#f27d26]" />
                  <span>Gemini Cognitive Reflections</span>
                </h2>
                <p className="text-xs text-[#a3a3a3] font-serif-body mt-1">
                  Synthesized cognitive reframes, inquiry prompts, and interactive dialogue threads across your entries.
                </p>
              </div>

              <span className="text-xs font-mono bg-[#1a1a1a] text-[#f27d26] px-3.5 py-1.5 rounded-full border border-[#333333]">
                {entriesWithReflections.length} Reflections
              </span>
            </div>

            {entriesWithReflections.length === 0 ? (
              <div className="bg-[#121212]/50 border border-dashed border-[#262626] rounded-3xl p-12 text-center space-y-3">
                <Sparkles className="w-8 h-8 mx-auto text-[#525252]" />
                <h3 className="font-display font-semibold text-base text-white">
                  No AI Reflections Generated Yet
                </h3>
                <p className="text-xs text-[#737373] font-serif-body max-w-sm mx-auto">
                  Write or edit any journal entry and click "Reflect with Gemini" to generate deep, multi-perspective psychological reflections.
                </p>
              </div>
            ) : (
              entriesWithReflections.map((entry) => (
                <div key={entry.id} className="space-y-2">
                  <div className="flex items-center justify-between px-2 text-xs text-[#737373] font-mono">
                    <span className="font-bold text-[#d4d4d4]">{entry.title}</span>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <AIReflectionCard
                    reflection={entry.aiReflection!}
                    entryContent={entry.content}
                    onSelectInquiryQuestion={handleSelectPrompt}
                    savedChatHistory={entry.aiChatHistory || []}
                    onSaveChatHistory={(chat) => {
                      if (currentUser) {
                        updateJournalEntry(currentUser.uid, entry.id, { aiChatHistory: chat });
                      }
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: THOUGHT LOOP DETECTOR (ORIGINAL FEATURE) */}
        {activeTab === 'loops' && (
          <ThoughtLoopDetectorView
            entries={entries}
            onSelectPrompt={handleSelectPrompt}
            onGoToJournal={() => setActiveTab('journal')}
            userId={currentUser?.uid}
          />
        )}

        {/* TAB 4: INSIGHTS & ANALYTICS */}
        {activeTab === 'insights' && (
          <InsightsDashboard entries={entries} />
        )}

        {/* TAB 4: GUIDED PROMPTS */}
        {activeTab === 'prompts' && (
          <GuidedPromptsView
            entries={entries}
            onSelectPrompt={handleSelectPrompt}
          />
        )}

        {/* TAB 5: SECURITY CONSTITUTION INSPECTOR */}
        {activeTab === 'security' && (
          <SecurityConstitutionModal
            userId={currentUser?.uid || ''}
            auditLogs={auditLogs}
            entries={entries}
            onDataWiped={() => {
              setEntries([]);
              setAuditLogs([]);
            }}
          />
        )}

        {/* TAB 6: ADMIN & RBAC DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboardView
            currentUserEmail={currentUser?.email || undefined}
            onGoToJournal={() => setActiveTab('journal')}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#262626] bg-[#0a0a0a] py-6 px-4 text-center text-xs text-[#525252] font-mono space-y-1">
        <p>
          System: <span className="text-[#f27d26]">mindvault-507114</span> • Region: <span className="text-[#737373]">us-central1</span> • Database: <span className="text-[#737373]">ai-studio-5307edf2-554e-46d5-8531-ff81d7300d1c</span>
        </p>
        <p className="text-[11px] text-[#525252] font-serif-body italic">
          Zero-Trust Security Constitution Enforced • Encrypted via Secret Manager & AES-GCM Client Vaults
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
