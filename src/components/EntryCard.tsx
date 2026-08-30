import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Smile, 
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { JournalEntry, AIChatMessage } from '../types';
import { MOOD_PRESETS } from '../lib/constants';
import { decryptText } from '../lib/security';
import { AIReflectionCard } from './AIReflectionCard';
import { updateJournalEntry } from '../lib/journalService';

interface EntryCardProps {
  entry: JournalEntry;
  userId: string;
  isVaultLocked: boolean;
  vaultPasskey: string | null;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  onOpenPasskeyModal: () => void;
  onSelectInquiryQuestion?: (question: string) => void;
  onRequestReflection: (entry: JournalEntry) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  userId,
  isVaultLocked,
  vaultPasskey,
  onEdit,
  onDelete,
  onOpenPasskeyModal,
  onSelectInquiryQuestion,
  onRequestReflection,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [decryptedBody, setDecryptedBody] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<boolean>(false);
  const [showReflection, setShowReflection] = useState(true);

  const moodMeta = MOOD_PRESETS.find((m) => m.type === entry.mood) || MOOD_PRESETS[4];
  const dateFormatted = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = new Date(entry.createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Handle client-side zero-knowledge decryption
  useEffect(() => {
    if (entry.isEncrypted && entry.encryptedPayload) {
      if (vaultPasskey && !isVaultLocked) {
        decryptText(entry.encryptedPayload, vaultPasskey)
          .then((text) => {
            setDecryptedBody(text);
            setDecryptError(false);
          })
          .catch((err) => {
            console.warn("Decryption failed:", err);
            setDecryptedBody(null);
            setDecryptError(true);
          });
      } else {
        setDecryptedBody(null);
      }
    }
  }, [entry.isEncrypted, entry.encryptedPayload, vaultPasskey, isVaultLocked]);

  const displayContent = entry.isEncrypted
    ? (isVaultLocked || !vaultPasskey ? null : decryptedBody)
    : entry.content;

  const handleSaveChat = async (newChat: AIChatMessage[]) => {
    await updateJournalEntry(userId, entry.id, { aiChatHistory: newChat });
  };

  return (
    <article className="bg-[#121212] hover:bg-[#151515] border border-[#262626] hover:border-[#333333] rounded-3xl p-5 md:p-6 shadow-xl transition-all relative overflow-hidden group">
      
      {/* Top Meta Line: Mood & Date */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          {/* Mood Pill */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${moodMeta.bgColor} ${moodMeta.color}`}>
            <span>{moodMeta.emoji}</span>
            <span>{moodMeta.label}</span>
          </span>

          {/* Encryption / Lock Badge */}
          {entry.isEncrypted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#1a1a1a] border border-[#333333] text-[#f27d26] text-[11px] font-mono">
              {isVaultLocked ? <Lock className="w-3 h-3 text-[#e11d48]" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
              <span>{isVaultLocked ? 'Locked' : 'Decrypted'}</span>
            </span>
          )}
        </div>

        {/* Date / Time */}
        <div className="flex items-center gap-2 text-xs text-[#737373] font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>{dateFormatted} • {timeFormatted}</span>
        </div>
      </div>

      {/* Entry Title */}
      <div className="pt-3.5 pb-2 flex items-start justify-between gap-3">
        <h3 className="font-display font-bold text-base md:text-lg text-white group-hover:text-[#f27d26] transition-colors">
          {entry.title}
        </h3>

        {/* Action buttons (Edit & Delete) */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            id={`entry-edit-btn-${entry.id}`}
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-lg text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            title="Edit entry"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          <button
            id={`entry-delete-btn-${entry.id}`}
            onClick={() => {
              if (confirm("Are you sure you want to permanently delete this journal entry from your isolated vault?")) {
                onDelete(entry.id);
              }
            }}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#e11d48] hover:bg-[#1a1a1a] transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Entry Body Content */}
      <div className="py-2">
        {entry.isEncrypted && (isVaultLocked || !vaultPasskey) ? (
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#f27d26] shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Zero-Knowledge Encrypted Content</p>
                <p className="text-[11px] text-[#737373] font-mono">
                  Encrypted locally via AES-256 GCM before cloud transmission.
                </p>
              </div>
            </div>

            <button
              id={`entry-unlock-btn-${entry.id}`}
              onClick={onOpenPasskeyModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] hover:border-[#f27d26] text-[#f27d26] text-xs font-medium transition-colors whitespace-nowrap"
            >
              Enter Passkey to View
            </button>
          </div>
        ) : (
          <div className="text-[#d4d4d4] text-sm md:text-base leading-relaxed font-serif-body">
            <p className={`${isExpanded ? '' : 'line-clamp-3'} whitespace-pre-line`}>
              {displayContent || (decryptError ? "⚠️ Error decrypting entry. Check your passkey." : entry.content)}
            </p>
            
            {(displayContent?.length || 0) > 200 && (
              <button
                id={`entry-expand-btn-${entry.id}`}
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs font-sans text-[#f27d26] hover:text-[#e06b16] flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>{isExpanded ? 'Show less' : 'Read full reflection'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tags Chips */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {entry.tags.map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#0a0a0a] text-[#a3a3a3] border border-[#262626] font-mono"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* AI Reflection Section */}
      <div className="mt-4 pt-3 border-t border-[#262626]">
        {entry.aiReflection ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                id={`entry-toggle-reflection-btn-${entry.id}`}
                onClick={() => setShowReflection(!showReflection)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#f27d26] hover:text-[#e06b16] transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showReflection ? 'Hide AI Reflection' : 'View AI Cognitive Reflection'}</span>
                {showReflection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showReflection && (
              <div className="mt-2">
                <AIReflectionCard
                  reflection={entry.aiReflection}
                  entryContent={displayContent || entry.content}
                  onSelectInquiryQuestion={onSelectInquiryQuestion}
                  savedChatHistory={entry.aiChatHistory || []}
                  onSaveChatHistory={handleSaveChat}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#737373] font-mono">No AI reflection yet</span>
            <button
              id={`entry-request-ai-btn-${entry.id}`}
              onClick={() => onRequestReflection(entry)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] hover:border-[#f27d26] text-white hover:text-[#f27d26] text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f27d26]" />
              <span>Reflect with Gemini</span>
            </button>
          </div>
        )}
      </div>

    </article>
  );
};
