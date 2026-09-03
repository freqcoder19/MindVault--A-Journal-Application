import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Settings,
  ShieldCheck,
  Lock, 
  Unlock, 
  LogOut, 
  User as UserIcon,
  Sun,
  Moon
} from 'lucide-react';
import { User } from '../lib/firebase';
import { SecurityStatusReport } from '../types';
import { useTheme } from '../lib/theme';

interface NavigationHeaderProps {
  currentUser: User | null;
  activeTab: 'journal' | 'gemini' | 'insights' | 'profile' | 'admin';
  onTabChange: (tab: 'journal' | 'gemini' | 'insights' | 'profile' | 'admin') => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isVaultLocked: boolean;
  onToggleVaultLock: () => void;
  hasPasskeyConfigured: boolean;
  securityStatus: SecurityStatusReport | null;
  isAdminVerified?: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenAuth,
  onSignOut,
  isVaultLocked,
  onToggleVaultLock,
  hasPasskeyConfigured: _hasPasskeyConfigured,
  securityStatus: _securityStatus,
  isAdminVerified = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-surface-card/95 border-b border-theme px-4 lg:px-8 py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        
        {/* Brand & App Title */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div 
            onClick={() => onTabChange('journal')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-theme flex items-center justify-center shadow-xs">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-tight text-theme-primary">
                  Mind<span className="text-accent">Vault</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-surface-secondary text-accent border border-accent/30 font-medium">
                  Journal
                </span>
              </div>
              <p className="text-[11px] text-theme-muted font-serif-body italic">
                Personal Gemini Journal
              </p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="md:hidden flex items-center gap-2">
            <button
              id="mobile-theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="p-2 rounded-xl bg-surface-secondary border border-theme text-theme-secondary hover:text-accent transition-colors flex items-center gap-1 text-xs font-mono"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-theme-primary" />}
            </button>

            {currentUser ? (
              <button 
                id="mobile-user-profile-btn"
                onClick={() => onTabChange('profile')}
                className={`p-2 rounded-xl bg-surface-secondary border transition-colors ${
                  activeTab === 'profile' ? 'border-accent text-accent' : 'border-theme text-theme-secondary'
                }`}
                title="Profile & Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="mobile-signin-btn"
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl btn-primary-accent font-medium text-xs shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Normal User Navigation: Exactly 4 Items (Journal, Gemini, Insights, Profile) */}
        <nav className="flex items-center gap-1.5 p-1 bg-surface-secondary border border-theme rounded-2xl overflow-x-auto max-w-full">
          <button
            id="nav-tab-journal"
            onClick={() => onTabChange('journal')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'journal'
                ? 'bg-surface-card text-theme-primary border border-theme shadow-xs font-semibold'
                : 'text-theme-muted hover:text-theme-primary hover:bg-surface-card/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>Journal</span>
          </button>

          <button
            id="nav-tab-gemini"
            onClick={() => onTabChange('gemini')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'gemini'
                ? 'bg-surface-card text-accent border border-accent/40 shadow-xs font-semibold'
                : 'text-theme-muted hover:text-theme-primary hover:bg-surface-card/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Gemini</span>
          </button>

          <button
            id="nav-tab-insights"
            onClick={() => onTabChange('insights')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'insights'
                ? 'bg-surface-card text-theme-primary border border-theme shadow-xs font-semibold'
                : 'text-theme-muted hover:text-theme-primary hover:bg-surface-card/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            <span>Insights</span>
          </button>

          <button
            id="nav-tab-profile"
            onClick={() => onTabChange('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-surface-card text-theme-primary border border-theme shadow-xs font-semibold'
                : 'text-theme-muted hover:text-theme-primary hover:bg-surface-card/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-accent" />
            <span>Profile</span>
          </button>

          {/* Admin Dashboard: STRICTLY visible only when user is the verified administrator barathsuresh19@gmail.com */}
          {isAdminVerified && (
            <button
              id="nav-tab-admin"
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-purple-950/40 text-purple-300 border border-purple-800/60 shadow-xs font-semibold'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/20'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Right Action: Theme Switcher, Vault Lock & User Profile */}
        <div className="hidden md:flex items-center gap-2.5">
          
          {/* Light / Dark Mode Toggle Switch */}
          <div className="flex items-center bg-surface-secondary border border-theme rounded-xl p-0.5">
            <button
              id="theme-switch-light"
              onClick={() => theme !== 'light' && toggleTheme()}
              aria-label="Switch to Light mode"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                !isDark 
                  ? 'bg-surface-card text-theme-primary shadow-xs font-semibold' 
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
              title="Light mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              id="theme-switch-dark"
              onClick={() => theme !== 'dark' && toggleTheme()}
              aria-label="Switch to Dark mode"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isDark 
                  ? 'bg-surface-card text-theme-primary shadow-xs font-semibold' 
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
              title="Dark mode"
            >
              <Moon className="w-3.5 h-3.5 text-teal-300" />
              <span>Dark</span>
            </button>
          </div>

          {/* Client Vault Lock Toggle */}
          <button
            id="header-vault-lock-btn"
            onClick={onToggleVaultLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isVaultLocked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                : 'bg-surface-secondary border-theme text-theme-secondary hover:text-theme-primary hover:border-accent/40'
            }`}
            title={isVaultLocked ? "Vault is Locked. Click to unlock with passkey." : "Vault is Unlocked. Click to lock sensitive entries."}
          >
            {isVaultLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Unlocked</span>
              </>
            )}
          </button>

          {/* User Profile / Auth Status */}
          {currentUser ? (
            <div 
              onClick={() => onTabChange('profile')}
              className="flex items-center gap-2 pl-2 border-l border-theme cursor-pointer group"
              title="View Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:opacity-90">
                {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-medium text-theme-primary max-w-[120px] truncate group-hover:text-accent transition-colors">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || (currentUser.isAnonymous ? 'Guest' : 'User')}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  Online
                </span>
              </div>
            </div>
          ) : (
            <button
              id="header-signin-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-primary-accent font-medium text-xs shadow-xs transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
