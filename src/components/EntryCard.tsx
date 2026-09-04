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
  Camera,
  Maximize2
} from 'lucide-react';
import { JournalEntry, AIChatMessage, JournalImage } from '../types';
import { MOOD_PRESETS } from '../lib/constants';
import { decryptText } from '../lib/security';
import { AIReflectionCard } from './AIReflectionCard';
import { updateJournalEntry } from '../lib/journalService';
import { ImagePreviewModal } from './ImagePreviewModal';
import { renderRichTextHtml, extractPlainText } from '../lib/richText';

interface EntryCardProps {
  entry: JournalEntry;
  userId: string;
  isVaultLocked: boolean;
  vaultPasskey: string | null;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  onOpenPasskeyModal: () => void;
  onSelectInquiryQuestion?: (question: string) => void;
  onRequestReflection?: (entry: JournalEntry) => void;
  onTalkToGemini?: (entry: JournalEntry) => void;
  isReflecting?: boolean;
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
  onTalkToGemini: _onTalkToGemini,
  isReflecting = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [decryptedBody, setDecryptedBody] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<boolean>(false);
  const [showReflection, setShowReflection] = useState(true);
  const [previewImage, setPreviewImage] = useState<JournalImage | null>(null);

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

  const images = entry.images || [];

  return (
    <article className="bg-surface-card hover:bg-surface-secondary/60 border border-theme hover:border-accent/40 rounded-3xl p-5 md:p-6 shadow-xs transition-all relative overflow-hidden group">
      
      {/* Top Meta Line: Mood & Date */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-theme">
        <div className="flex items-center gap-2.5">
          {/* Mood Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-surface-secondary border border-theme text-theme-secondary">
            <span>{moodMeta.emoji}</span>
            <span>{moodMeta.label}</span>
          </span>

          {/* Encryption / Lock Badge */}
          {entry.isEncrypted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-surface-secondary border border-theme text-accent text-[11px] font-mono">
              {isVaultLocked ? <Lock className="w-3 h-3 text-rose-500" /> : <Unlock className="w-3 h-3 text-emerald-500" />}
              <span>{isVaultLocked ? 'Locked' : 'Decrypted'}</span>
            </span>
          )}

          {/* Photos Count Pill */}
          {images.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-accent-subtle text-accent border border-accent/30 text-[11px] font-mono">
              <Camera className="w-3 h-3" />
              <span>{images.length} {images.length === 1 ? 'memory' : 'memories'}</span>
            </span>
          )}
        </div>

        {/* Date / Time */}
        <div className="flex items-center gap-2 text-xs text-theme-muted font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>{dateFormatted} • {timeFormatted}</span>
        </div>
      </div>

      {/* Entry Title */}
      <div className="pt-3.5 pb-2 flex items-start justify-between gap-3">
        <h3 className="font-display font-bold text-base md:text-lg text-theme-primary group-hover:text-accent transition-colors">
          {entry.title}
        </h3>

        {/* Action buttons (Edit & Delete) */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            id={`entry-edit-btn-${entry.id}`}
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface-secondary transition-colors"
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
            className="p-1.5 rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Hierarchy 1: Journal Thought Content */}
      <div className="py-2">
        {entry.isEncrypted && (isVaultLocked || !vaultPasskey) ? (
          <div className="p-4 rounded-2xl bg-surface-secondary border border-theme flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-card border border-theme flex items-center justify-center text-accent shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-theme-primary">Zero-Knowledge Encrypted Content</p>
                <p className="text-[11px] text-theme-muted font-mono">
                  Encrypted locally via AES-256 GCM before cloud transmission.
                </p>
              </div>
            </div>

            <button
              id={`entry-unlock-btn-${entry.id}`}
              onClick={onOpenPasskeyModal}
              className="px-3.5 py-1.5 rounded-xl bg-surface-card hover:bg-surface-secondary border border-theme hover:border-accent text-accent text-xs font-medium transition-colors whitespace-nowrap"
            >
              Enter Passkey to View
            </button>
          </div>
        ) : (
          <div className="text-theme-secondary text-sm md:text-base leading-relaxed font-serif-body">
            {decryptError ? (
              <p className="text-rose-500 text-xs">⚠️ Error decrypting entry. Check your passkey.</p>
            ) : (
              <div
                className={`rich-text-content ${isExpanded ? '' : 'line-clamp-4'} 
                           [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-1.5 
                           [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-1.5 
                           [&_li]:my-0.5 
                           [&_b]:font-bold [&_strong]:font-bold 
                           [&_i]:italic [&_em]:italic 
                           [&_u]:underline
                           [&_p]:my-1`}
                dangerouslySetInnerHTML={{ __html: renderRichTextHtml(displayContent || entry.content) }}
              />
            )}
            
            {extractPlainText(displayContent || entry.content).length > 200 && (
              <button
                id={`entry-expand-btn-${entry.id}`}
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs font-sans text-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>{isExpanded ? 'Show less' : 'Read full reflection'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Primary Hierarchy 2: Attached Memory Photos (Natural, balanced layout) */}
      {images.length > 0 && (
        <div className="my-3 pt-2">
          {images.length === 1 ? (
            /* Single Image Layout: Natural aspect ratio, subtle framing */
            <div className="max-w-md">
              <div 
                className="relative group/img overflow-hidden rounded-2xl border border-theme bg-surface-secondary cursor-pointer"
                onClick={() => setPreviewImage(images[0])}
              >
                <img 
                  src={images[0].url} 
                  alt={images[0].name || "Journal memory"}
                  className="w-full max-h-72 object-cover transition-transform duration-300 group-hover/img:scale-[1.01]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                  <span className="p-2 rounded-full bg-surface-card/90 text-theme-primary shadow-md">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-theme-muted mt-1 px-1 truncate">
                📷 {images[0].name || 'Private Memory'}
              </p>
            </div>
          ) : (
            /* Balanced Two-Image Layout */
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.slice(0, 2).map((img, idx) => (
                  <div 
                    key={img.id || idx}
                    className="relative group/img overflow-hidden rounded-2xl border border-theme bg-surface-secondary cursor-pointer aspect-4/3"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img 
                      src={img.url} 
                      alt={img.name || `Memory ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-[1.01]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                      <span className="p-2 rounded-full bg-surface-card/90 text-theme-primary shadow-md">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags Chips */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {entry.tags.map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2.5 py-0.5 rounded-lg bg-surface-secondary text-theme-muted border border-theme font-mono"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Primary Hierarchy 3: AI Cognitive Reflection Section */}
      <div className="mt-4 pt-3 border-t border-theme">
        {entry.aiReflection ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                id={`entry-toggle-reflection-btn-${entry.id}`}
                onClick={() => setShowReflection(!showReflection)}
                className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline transition-colors cursor-pointer"
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
                  entryContent={extractPlainText(displayContent || entry.content)}
                  onSelectInquiryQuestion={onSelectInquiryQuestion}
                  savedChatHistory={entry.aiChatHistory || []}
                  onSaveChatHistory={handleSaveChat}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-theme/40">
            <span className="text-[11px] text-theme-muted font-mono">Private journal entry</span>
            {onRequestReflection && (
              <button
                id={`entry-reflect-gemini-btn-${entry.id}`}
                onClick={() => onRequestReflection(entry)}
                disabled={isReflecting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-white hover:opacity-90 text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-60"
                title="Generate a private, compassionate Gemini reflection for this entry"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isReflecting ? 'animate-spin' : ''}`} />
                <span>{isReflecting ? 'Reflecting...' : 'Reflect with Gemini'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox / Preview Modal for Attached Memory Photos */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />

    </article>
  );
};
