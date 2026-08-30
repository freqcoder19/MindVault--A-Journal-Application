import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  ShieldAlert, 
  LogOut, 
  User as UserIcon,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { User } from '../lib/firebase';
import { SecurityStatusReport } from '../types';

interface NavigationHeaderProps {
  currentUser: User | null;
  activeTab: 'journal' | 'reflections' | 'insights' | 'prompts' | 'security';
  onTabChange: (tab: 'journal' | 'reflections' | 'insights' | 'prompts' | 'security') => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isVaultLocked: boolean;
  onToggleVaultLock: () => void;
  hasPasskeyConfigured: boolean;
  securityStatus: SecurityStatusReport | null;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenAuth,
  onSignOut,
  isVaultLocked,
  onToggleVaultLock,
  hasPasskeyConfigured,
  securityStatus
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0a0a0a]/90 border-b border-[#262626] px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Security Badge */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center shadow-lg shadow-black/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f27d26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg tracking-tight text-white">
                  Mind<span className="text-[#f27d26]">Vault</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#f27d26] border border-[#333333]">
                  v2.5 AI
                </span>
              </div>
              <p className="text-xs text-[#737373] font-serif-body italic">
                Personal Gemini Journal • Cloud mindvault-507114
              </p>
            </div>
          </div>

          {/* Mobile Auth Button */}
          <div className="md:hidden flex items-center gap-2">
            {currentUser ? (
              <button 
                id="mobile-user-profile-btn"
                onClick={onSignOut}
                className="p-2 rounded-xl bg-[#1a1a1a] border border-[#333333] text-[#d4d4d4] hover:text-[#e11d48]"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="mobile-signin-btn"
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-[#f27d26] text-[#0a0a0a] font-semibold text-xs shadow-md"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-[#121212] border border-[#262626] rounded-2xl overflow-x-auto max-w-full">
          <button
            id="nav-tab-journal"
            onClick={() => onTabChange('journal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'journal'
                ? 'bg-[#1a1a1a] text-white border border-[#333333] shadow-sm font-semibold'
                : 'text-[#737373] hover:text-[#d4d4d4] hover:bg-[#1a1a1a]/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#f27d26]" />
            <span>Journal</span>
          </button>

          <button
            id="nav-tab-reflections"
            onClick={() => onTabChange('reflections')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'reflections'
                ? 'bg-[#1a1a1a] text-white border border-[#333333] shadow-sm font-semibold'
                : 'text-[#737373] hover:text-[#d4d4d4] hover:bg-[#1a1a1a]/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f27d26]" />
            <span>AI Reflections</span>
          </button>

          <button
            id="nav-tab-insights"
            onClick={() => onTabChange('insights')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'insights'
                ? 'bg-[#1a1a1a] text-white border border-[#333333] shadow-sm font-semibold'
                : 'text-[#737373] hover:text-[#d4d4d4] hover:bg-[#1a1a1a]/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#f27d26]" />
            <span>Insights</span>
          </button>

          <button
            id="nav-tab-prompts"
            onClick={() => onTabChange('prompts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'prompts'
                ? 'bg-[#1a1a1a] text-white border border-[#333333] shadow-sm font-semibold'
                : 'text-[#737373] hover:text-[#d4d4d4] hover:bg-[#1a1a1a]/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#f27d26]" />
            <span>Prompts</span>
          </button>

          <button
            id="nav-tab-security"
            onClick={() => onTabChange('security')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-[#1a1a1a] text-emerald-400 border border-emerald-500/40 shadow-sm font-semibold'
                : 'text-[#737373] hover:text-emerald-400 hover:bg-[#1a1a1a]/50'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Security Constitution</span>
          </button>
        </nav>

        {/* Right Action: Vault Lock & User Profile */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Client Vault Lock Toggle */}
          <button
            id="header-vault-lock-btn"
            onClick={onToggleVaultLock}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isVaultLocked
                ? 'bg-[#1a1a1a] border-[#e11d48]/50 text-[#e11d48] hover:bg-[#262626]'
                : 'bg-[#121212] border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#333333]'
            }`}
            title={isVaultLocked ? "Vault is Locked. Click to unlock with passkey." : "Vault is Unlocked. Click to lock sensitive entries."}
          >
            {isVaultLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-[#e11d48]" />
                <span>Vault Locked</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vault Open</span>
              </>
            )}
          </button>

          {/* User Profile / Auth Status */}
          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#262626]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f27d26] to-[#e11d48] flex items-center justify-center text-white text-xs font-bold shadow-md">
                {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-medium text-white max-w-[130px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || (currentUser.isAnonymous ? 'Guest User' : 'Authenticated')}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  Firebase Auth
                </span>
              </div>
              <button
                id="header-signout-btn"
                onClick={onSignOut}
                className="p-2 rounded-xl bg-[#121212] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#333333] text-[#737373] hover:text-[#e11d48] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="header-signin-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#f27d26] hover:bg-[#e06b16] text-[#0a0a0a] font-semibold text-xs shadow-md transition-all"
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
