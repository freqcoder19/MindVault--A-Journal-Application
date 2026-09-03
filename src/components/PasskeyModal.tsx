import React, { useState } from 'react';
import { Lock, KeyRound, X, Check, AlertCircle, ShieldAlert } from 'lucide-react';
import { hashPasskey } from '../lib/security';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (passkey: string) => void;
  hasStoredHash: boolean;
  onSaveNewPasskey?: (passkey: string, hash: string) => void;
}

export const PasskeyModal: React.FC<PasskeyModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  hasStoredHash,
  onSaveNewPasskey,
}) => {
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey || passkey.length < 6) {
      setErrorMsg("Passkey must be at least 6 characters long.");
      return;
    }

    if (!hasStoredHash && passkey !== confirmPasskey) {
      setErrorMsg("Passkeys do not match.");
      return;
    }

    try {
      const hash = await hashPasskey(passkey);
      if (onSaveNewPasskey) {
        onSaveNewPasskey(passkey, hash);
      }
      onUnlock(passkey);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to process passkey.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-card border border-theme rounded-2xl p-6 md:p-7 shadow-xl overflow-hidden">
        
        <button
          id="passkey-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-surface-secondary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-theme-primary">
            {hasStoredHash ? 'Unlock Private Vault' : 'Configure Zero-Knowledge Passkey'}
          </h3>
          <p className="text-xs text-theme-muted font-serif-body mt-1">
            {hasStoredHash 
              ? 'Enter your private passkey to decrypt sensitive AES-GCM entries locally.' 
              : 'Create a local passphrase for zero-knowledge client-side encryption.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSetPasskey} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1">
              Vault Passkey / PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-theme-muted" />
              <input
                id="vault-passkey-input"
                type="password"
                required
                autoFocus
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter 6+ character passkey..."
                className="w-full bg-surface-secondary border border-theme rounded-xl pl-10 pr-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {!hasStoredHash && (
            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">
                Confirm Passkey
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-theme-muted" />
                <input
                  id="vault-confirm-passkey-input"
                  type="password"
                  required
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  placeholder="Repeat passkey..."
                  className="w-full bg-surface-secondary border border-theme rounded-xl pl-10 pr-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-surface-secondary border border-theme text-[11px] text-theme-secondary space-y-1">
            <p className="font-semibold text-theme-primary flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-accent" /> Zero-Knowledge Guarantee:
            </p>
            <p className="leading-relaxed font-serif-body text-theme-muted">
              Your passkey is NEVER sent to Google servers or stored in plaintext. If lost, encrypted entries cannot be recovered by any administrator.
            </p>
          </div>

          <button
            id="vault-passkey-submit-btn"
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-accent hover:opacity-90 text-white font-semibold text-xs shadow-xs transition-opacity cursor-pointer"
          >
            {hasStoredHash ? 'Unlock Vault' : 'Activate Passkey Protection'}
          </button>
        </form>

      </div>
    </div>
  );
};
