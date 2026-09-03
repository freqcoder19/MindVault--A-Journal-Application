import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight,
  KeyRound
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../lib/firebase';
import { recordAuditLog } from '../lib/journalService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await recordAuditLog(res.user.uid, "AUTH_GOOGLE_SIGNIN", "SUCCESS", `User signed in via Google OAuth (${res.user.email})`, "FIREBASE_AUTH");
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMsg(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isRegister) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await recordAuditLog(res.user.uid, "AUTH_REGISTER_EMAIL", "SUCCESS", `New user created (${email})`, "FIREBASE_AUTH");
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        await recordAuditLog(res.user.uid, "AUTH_LOGIN_EMAIL", "SUCCESS", `User signed in with email (${email})`, "FIREBASE_AUTH");
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Email auth error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg("Invalid email or password combination.");
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg("This email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg("Password should be at least 6 characters.");
      } else {
        setErrorMsg(err.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080b0d]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#111619] border border-[#232d34] rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#7c827d] hover:text-white hover:bg-[#1b2226] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#171e22] border border-[#2d3942] flex items-center justify-center text-[#48ab9e] shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-xl text-white tracking-wide">
            {isRegister ? 'Create Secure Vault' : 'Sign In to MindVault'}
          </h2>
          <p className="text-xs text-[#9ea8a5] font-serif-body mt-1">
            Zero-Trust Personal Journaling with Account UID Data Isolation
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          id="auth-google-signin-btn"
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#171e22] hover:bg-[#1d262b] text-white font-medium text-sm border border-[#2d3942] transition-all shadow-sm hover:border-[#48ab9e]/40 disabled:opacity-40 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-[#232d34] w-full" />
          <span className="bg-[#111619] px-3 text-[11px] uppercase tracking-wider text-[#7c827d] font-mono">
            Or with email
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          <div>
            <label className="block text-xs text-[#9ea8a5] mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#7c827d]" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mindvault.me"
                className="w-full bg-[#0a0d0f] border border-[#232d34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4f5450] focus:outline-none focus:border-[#48ab9e] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9ea8a5] mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#7c827d]" />
              <input
                id="auth-password-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0a0d0f] border border-[#232d34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4f5450] focus:outline-none focus:border-[#48ab9e] transition-colors"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2d7a6e] hover:bg-[#236359] text-white font-medium text-sm shadow-md transition-all disabled:opacity-40 mt-2 cursor-pointer"
          >
            <span>{isRegister ? 'Create Vault Account' : 'Sign In to Vault'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Register/Login */}
        <div className="mt-4 text-center">
          <button
            id="auth-toggle-mode-btn"
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            className="text-xs text-[#7c827d] hover:text-[#48ab9e] transition-colors cursor-pointer"
          >
            {isRegister ? 'Already have a vault? Sign in' : "Don't have a vault yet? Create account"}
          </button>
        </div>

        {/* Footer Security Note */}
        <div className="mt-5 pt-4 border-t border-[#232d34] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted & Isolated</span>
          </div>

          <span className="text-[11px] text-[#7c827d] font-mono">
            Firebase Auth Verified
          </span>
        </div>

      </div>
    </div>
  );
};
