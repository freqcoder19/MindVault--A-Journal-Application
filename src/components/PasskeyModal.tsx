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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0a]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#121212] border border-[#262626] rounded-3xl p-6 md:p-7 shadow-2xl overflow-hidden">
        
        <button
          id="passkey-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#f27d26]">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {hasStoredHash ? 'Unlock Private Vault' : 'Configure Zero-Knowledge Passkey'}
          </h3>
          <p className="text-xs text-[#737373] font-serif-body mt-1">
            {hasStoredHash 
              ? 'Enter your private passkey to decrypt sensitive AES-GCM entries locally.' 
              : 'Create a local passphrase for zero-knowledge client-side encryption.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSetPasskey} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a3a3a3] mb-1">
              Vault Passkey / PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-[#737373]" />
              <input
                id="vault-passkey-input"
                type="password"
                required
                autoFocus
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter 6+ character passkey..."
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#f27d26]"
              />
            </div>
          </div>

          {!hasStoredHash && (
            <div>
              <label className="block text-xs font-medium text-[#a3a3a3] mb-1">
                Confirm Passkey
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-[#737373]" />
                <input
                  id="vault-confirm-passkey-input"
                  type="password"
                  required
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  placeholder="Repeat passkey..."
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#f27d26]"
                />
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-[#0a0a0a] border border-[#262626] text-[11px] text-[#a3a3a3] space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#f27d26]" /> Zero-Knowledge Guarantee:
            </p>
            <p className="leading-relaxed font-serif-body">
              Your passkey is NEVER sent to Google servers or stored in plaintext. If lost, encrypted entries cannot be recovered by any administrator.
            </p>
          </div>

          <button
            id="vault-passkey-submit-btn"
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#f27d26] hover:bg-[#e06b16] text-[#0a0a0a] font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            {hasStoredHash ? 'Unlock Vault' : 'Activate Passkey Protection'}
          </button>
        </form>

      </div>
    </div>
  );
};
