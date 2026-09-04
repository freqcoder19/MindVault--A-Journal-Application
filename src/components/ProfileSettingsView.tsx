import React, { useState } from 'react';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Sun, 
  Moon, 
  Download, 
  LogOut, 
  Key, 
  FileText,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { User } from '../lib/firebase';
import { JournalEntry, SecurityStatusReport } from '../types';
import { useTheme } from '../lib/theme';
import { MindVaultMark } from './MindVaultLogo';

interface ProfileSettingsViewProps {
  currentUser: User | null;
  entries: JournalEntry[];
  isVaultLocked: boolean;
  onToggleVaultLock: () => void;
  hasPasskeyConfigured: boolean;
  onOpenPasskeyModal: () => void;
  onSignOut: () => void;
  securityStatus: SecurityStatusReport | null;
  onOpenAdminDashboard: () => void;
  isAdminVerified?: boolean;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  currentUser,
  entries,
  isVaultLocked,
  onToggleVaultLock,
  hasPasskeyConfigured,
  onOpenPasskeyModal,
  onSignOut,
  securityStatus,
  onOpenAdminDashboard,
  isAdminVerified = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [copiedUid, setCopiedUid] = useState(false);

  const handleCopyUid = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleExportJournal = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      userUid: currentUser?.uid || 'anonymous',
      entryCount: entries.length,
      entries: entries.map(e => ({
        id: e.id,
        title: e.title,
        content: e.isEncrypted && isVaultLocked ? '[Encrypted in Client Vault]' : e.content,
        mood: e.mood,
        tags: e.tags,
        imagesCount: e.images?.length || 0,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindvault-journal-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      {/* Profile Card */}
      <div className="bg-surface-card border border-theme rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-theme">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center text-xl font-bold shadow-xs">
              {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-theme-primary">
                {currentUser?.displayName || (currentUser ? 'MindVault Journaler' : 'Guest Account')}
              </h2>
              <p className="text-xs text-theme-muted font-mono">
                {currentUser?.email || 'Unregistered local session'}
              </p>
            </div>
          </div>

          {currentUser && (
            <button
              id="profile-signout-btn"
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-rose-500/10 border border-theme hover:border-rose-500/30 text-theme-secondary hover:text-rose-500 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Account Details & Security Isolation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-surface-secondary border border-theme space-y-1.5">
            <span className="text-theme-muted font-medium">Account UID (Isolated Firestore Path)</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-theme-primary truncate max-w-[200px]">
                {currentUser?.uid || 'Not signed in'}
              </span>
              {currentUser && (
                <button
                  onClick={handleCopyUid}
                  className="text-accent hover:underline font-mono text-[11px]"
                >
                  {copiedUid ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-secondary border border-theme space-y-1.5">
            <span className="text-theme-muted font-medium">Authentication Authority</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="font-semibold text-theme-primary">
                {currentUser ? 'Verified Firebase Token' : 'Unauthenticated'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences & Vault Settings */}
      <div className="bg-surface-card border border-theme rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        <h3 className="font-display font-bold text-base text-theme-primary">
          Preferences & Vault Protection
        </h3>

        <div className="space-y-4">
          
          {/* Theme Selector */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-secondary border border-theme">
            <div>
              <span className="font-semibold text-xs text-theme-primary block">Display Appearance</span>
              <span className="text-[11px] text-theme-muted">
                Calm warm off-white in light mode, serene deep charcoal in dark mode.
              </span>
            </div>

            <div className="flex items-center bg-surface-card border border-theme rounded-xl p-0.5">
              <button
                id="profile-theme-light-btn"
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !isDark 
                    ? 'bg-accent text-white shadow-xs font-semibold' 
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                id="profile-theme-dark-btn"
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isDark 
                    ? 'bg-accent text-white shadow-xs font-semibold' 
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Client-Side Passkey Vault */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-surface-secondary border border-theme gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-accent" />
                <span className="font-semibold text-xs text-theme-primary">Zero-Knowledge Passkey Vault</span>
              </div>
              <span className="text-[11px] text-theme-muted mt-0.5 block">
                Local AES-256 GCM client-side encryption. MindVault servers never see your passkey.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="profile-passkey-config-btn"
                onClick={onOpenPasskeyModal}
                className="px-3 py-1.5 rounded-xl bg-surface-card border border-theme hover:border-accent text-xs font-medium text-theme-primary hover:text-accent transition-colors shadow-xs"
              >
                {hasPasskeyConfigured ? 'Change Passkey' : 'Set Vault Passkey'}
              </button>

              <button
                id="profile-vault-toggle-btn"
                onClick={onToggleVaultLock}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  isVaultLocked
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    : 'bg-surface-card border-theme text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isVaultLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{isVaultLocked ? 'Locked' : 'Unlocked'}</span>
              </button>
            </div>
          </div>

          {/* Export Journal Data */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-secondary border border-theme">
            <div>
              <span className="font-semibold text-xs text-theme-primary block">Data Portability</span>
              <span className="text-[11px] text-theme-muted">
                Download a clean JSON archive of all your entries ({entries.length} recorded).
              </span>
            </div>

            <button
              id="profile-export-data-btn"
              onClick={handleExportJournal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-secondary border border-theme text-xs font-medium text-theme-primary hover:text-accent transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export JSON</span>
            </button>
          </div>

        </div>
      </div>

      {/* Discrete Admin Section: ONLY visible if user is designated administrator */}
      {isAdminVerified && (
        <div className="bg-surface-card border border-theme rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <MindVaultMark size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-theme-primary">
                  Administrator Profile & Overview
                </h3>
                <p className="text-xs text-theme-muted font-serif-body">
                  MindVault Operator Account
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold">
              Administrator
            </span>
          </div>

          <p className="text-xs text-theme-secondary leading-relaxed font-serif-body">
            You are signed in with the designated administrator account (barathsuresh19@gmail.com). You can view the system overview and aggregate operational telemetry.
          </p>

          <div>
            <button
              id="profile-open-admin-dashboard-btn"
              onClick={onOpenAdminDashboard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface-card border border-theme hover:border-accent/40 text-theme-primary hover:text-accent font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Open Admin Profile & Overview</span>
              <ExternalLink className="w-3 h-3 text-theme-muted" />
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
