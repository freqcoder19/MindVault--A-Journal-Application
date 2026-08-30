import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Save, 
  Mic, 
  MicOff, 
  Lock, 
  Unlock, 
  Tag as TagIcon, 
  Smile, 
  Check, 
  AlertCircle, 
  BrainCircuit, 
  RotateCcw,
  Sliders,
  ChevronDown,
  Info
} from 'lucide-react';
import { MOOD_PRESETS, PERSONA_PRESETS, DEFAULT_TAGS } from '../lib/constants';
import { MoodType, PersonaType, JournalEntry, AIReflectionData } from '../types';
import { requestAIReflection } from '../lib/geminiApi';
import { encryptText, sanitizeInput } from '../lib/security';
import { recordAuditLog } from '../lib/journalService';

interface JournalEditorProps {
  userId: string;
  initialEntry?: JournalEntry | null;
  onSave: (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancelEdit?: () => void;
  vaultPasskey: string | null;
  onOpenPasskeyModal: () => void;
  defaultPrompt?: string | null;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  initialEntry,
  onSave,
  onCancelEdit,
  vaultPasskey,
  onOpenPasskeyModal,
  defaultPrompt,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('reflective');
  const [tags, setTags] = useState<string[]>(['Mindfulness']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('empathetic');
  const [isEncryptedVault, setIsEncryptedVault] = useState(false);

  // AI Reflection states
  const [isReflecting, setIsReflecting] = useState(false);
  const [currentReflection, setCurrentReflection] = useState<AIReflectionData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Populate editor if editing existing entry or starting from a prompt
  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title || '');
      setContent(initialEntry.content || '');
      setMood(initialEntry.mood || 'reflective');
      setTags(initialEntry.tags || []);
      setIsEncryptedVault(initialEntry.isEncrypted || false);
      setCurrentReflection(initialEntry.aiReflection || null);
    } else if (defaultPrompt) {
      setTitle('');
      setContent(`Prompt: ${defaultPrompt}\n\n`);
      setMood('reflective');
    }
  }, [initialEntry, defaultPrompt]);

  // Setup Web Speech API for voice dictation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript) {
          setContent((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceDictation = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser environment. You can type directly in the journal.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start voice recognition:", e);
      }
    }
  };

  const currentMoodMeta = MOOD_PRESETS.find(m => m.type === mood) || MOOD_PRESETS[4];

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags([...tags, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Trigger Gemini Reflection
  const handleGenerateReflection = async () => {
    const cleanContent = sanitizeInput(content);
    if (!cleanContent) {
      setAiError("Please write some journal content before requesting an AI reflection.");
      return;
    }

    setIsReflecting(true);
    setAiError(null);

    try {
      const reflection = await requestAIReflection({
        content: cleanContent,
        mood: currentMoodMeta.label,
        moodScore: currentMoodMeta.score,
        tags,
        persona: selectedPersona,
      });

      setCurrentReflection(reflection);
      await recordAuditLog(
        userId,
        "GEMINI_REFLECTION_REQUEST",
        "SUCCESS",
        `Requested ${selectedPersona} reflection (${cleanContent.length} chars)`,
        "GEMINI_GATEWAY"
      );
    } catch (err: any) {
      console.error("AI Reflection error:", err);
      setAiError(err.message || "Failed to generate reflection.");
      await recordAuditLog(
        userId,
        "GEMINI_REFLECTION_REQUEST",
        "BLOCKED",
        `Error: ${err.message}`,
        "GEMINI_GATEWAY"
      );
    } finally {
      setIsReflecting(false);
    }
  };

  // Submit and Save Entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("Please write your journal thoughts before saving.");
      return;
    }

    setSaving(true);
    try {
      let finalContent = content;
      let encryptedPayload: string | undefined = undefined;

      if (isEncryptedVault) {
        if (!vaultPasskey) {
          onOpenPasskeyModal();
          setSaving(false);
          return;
        }
        // Client-side Zero Knowledge AES-GCM encryption
        encryptedPayload = await encryptText(content, vaultPasskey);
        finalContent = "[Encrypted MindVault Zero-Knowledge Content]";
      }

      const entryPayload: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        title: title.trim() || `Journal • ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        content: isEncryptedVault ? finalContent : content.trim(),
        mood,
        moodScore: currentMoodMeta.score,
        tags,
        isEncrypted: isEncryptedVault,
        ...(encryptedPayload ? { encryptedPayload } : {}),
        ...(currentReflection ? { aiReflection: currentReflection } : {}),
      };

      await onSave(entryPayload);

      // Reset form if creating fresh
      if (!initialEntry) {
        setTitle('');
        setContent('');
        setCurrentReflection(null);
        setTags(['Mindfulness']);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      alert(`Failed to save entry: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Word count & estimate read time
  const wordCount = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
  const readTimeMin = Math.ceil(wordCount / 200);

  return (
    <section className="bg-[#121212] border border-[#262626] rounded-3xl p-6 md:p-8 shadow-2xl relative transition-all">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Editor Top Bar: Mood & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
          
          {/* Mood Selector Dropdown / Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737373] font-medium hidden sm:inline">Inner State:</span>
            <div className="relative group">
              <select
                id="journal-mood-select"
                value={mood}
                onChange={(e) => setMood(e.target.value as MoodType)}
                className={`appearance-none text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border transition-all cursor-pointer bg-[#0a0a0a] focus:outline-none focus:border-[#f27d26]/60 ${currentMoodMeta.bgColor} ${currentMoodMeta.color}`}
              >
                {MOOD_PRESETS.map((m) => (
                  <option key={m.type} value={m.type} className="bg-[#121212] text-[#d4d4d4]">
                    {m.emoji} {m.label} (Score: {m.score}/5)
                  </option>
                ))}
              </select>
              <Smile className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#737373] pointer-events-none" />
            </div>
          </div>

          {/* Right Tools: Voice, Zero-Knowledge Vault Encryption, Persona */}
          <div className="flex items-center gap-2">
            
            {/* Voice Dictation Button */}
            <button
              id="journal-voice-dictation-btn"
              type="button"
              onClick={toggleVoiceDictation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isListening
                  ? 'bg-[#1a1a1a] border-[#e11d48] text-[#e11d48] animate-pulse'
                  : 'bg-[#0a0a0a] border-[#262626] text-[#737373] hover:text-[#d4d4d4] hover:border-[#333333]'
              }`}
              title={isListening ? "Listening... Click to stop" : "Dictate your thoughts via Voice"}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 text-[#e11d48]" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
            </button>

            {/* Zero-Knowledge Vault Encryption Toggle */}
            <button
              id="journal-encryption-toggle-btn"
              type="button"
              onClick={() => {
                if (!isEncryptedVault && !vaultPasskey) {
                  onOpenPasskeyModal();
                }
                setIsEncryptedVault(!isEncryptedVault);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isEncryptedVault
                  ? 'bg-[#1a1a1a] border-[#f27d26]/50 text-[#f27d26] shadow-sm'
                  : 'bg-[#0a0a0a] border-[#262626] text-[#737373] hover:text-[#d4d4d4]'
              }`}
              title="Client-side AES-GCM Zero-Knowledge Encryption"
            >
              {isEncryptedVault ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#f27d26]" />
                  <span>Passkey Vault</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-[#737373]" />
                  <span>Standard Isolation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <input
            id="journal-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this reflection a title (or leave blank for date)..."
            className="w-full bg-transparent border-0 border-b border-[#262626] focus:border-[#f27d26]/60 pb-2.5 text-base md:text-lg font-display text-white placeholder-[#525252] focus:outline-none transition-colors"
          />
        </div>

        {/* Main Content Area */}
        <div className="relative">
          <textarea
            id="journal-content-textarea"
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Unpack your raw thoughts, sensations, vulnerabilities, or insights freely. MindVault strictly isolates this to your authenticated UID..."
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-2xl p-4.5 text-[#d4d4d4] placeholder-[#525252] font-serif-body text-base leading-relaxed focus:outline-none focus:border-[#f27d26]/50 transition-all resize-y min-h-[160px]"
          />

          {/* Word count & reading time footer */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#525252] px-2 mt-1.5">
            <span>{wordCount} words • ~{readTimeMin} min read</span>
            {isEncryptedVault && (
              <span className="text-[#f27d26]/80 flex items-center gap-1">
                <Lock className="w-3 h-3" /> AES-256 GCM Client Encryption
              </span>
            )}
          </div>
        </div>

        {/* Tags & Categorization Section */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#737373] font-medium mr-1 flex items-center gap-1">
              <TagIcon className="w-3 h-3 text-[#525252]" /> Tags:
            </span>

            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg bg-[#1a1a1a] text-[#d4d4d4] border border-[#333333]"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-[#e11d48] ml-0.5 text-[#737373]"
                >
                  &times;
                </button>
              </span>
            ))}

            {/* Tag add button & input */}
            <div className="relative inline-flex items-center">
              <input
                id="journal-custom-tag-input"
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(customTagInput);
                  }
                }}
                placeholder="+ Add tag..."
                className="text-xs bg-[#0a0a0a] border border-[#262626] rounded-lg px-2 py-0.5 text-[#d4d4d4] placeholder-[#525252] focus:outline-none focus:border-[#f27d26]/50 w-24"
              />
              
              <button
                type="button"
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="ml-1 p-1 text-[#737373] hover:text-[#d4d4d4]"
                title="Browse suggested tags"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Suggested tags palette */}
          {showTagPicker && (
            <div className="p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl flex flex-wrap gap-1.5 animate-fade-in">
              {DEFAULT_TAGS.map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => handleAddTag(suggested)}
                  disabled={tags.includes(suggested)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    tags.includes(suggested)
                      ? 'bg-[#121212] border-[#262626] text-[#525252] cursor-default'
                      : 'bg-[#1a1a1a] border-[#333333] text-[#a3a3a3] hover:text-[#f27d26] hover:border-[#f27d26]/40'
                  }`}
                >
                  +{suggested}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gemini AI Reflection Trigger Bar */}
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl p-4.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#1a1a1a] text-[#f27d26] border border-[#333333]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Gemini Cognitive Reflection</h4>
                <p className="text-[11px] text-[#737373]">
                  Select an AI thinking style for confidential cognitive analysis
                </p>
              </div>
            </div>

            {/* Persona Selector */}
            <select
              id="journal-persona-select"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value as PersonaType)}
              className="text-xs bg-[#1a1a1a] border border-[#333333] text-[#f27d26] font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#f27d26]"
            >
              {PERSONA_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#121212] text-[#d4d4d4]">
                  {p.name} ({p.subtitle})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              id="journal-reflect-gemini-btn"
              type="button"
              disabled={isReflecting || !content.trim()}
              onClick={handleGenerateReflection}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] hover:border-[#f27d26] text-white hover:text-[#f27d26] text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
            >
              <Sparkles className={`w-3.5 h-3.5 text-[#f27d26] ${isReflecting ? 'animate-spin' : ''}`} />
              <span>{isReflecting ? 'Gemini Reflecting...' : 'Reflect with Gemini'}</span>
            </button>

            {currentReflection && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                <Check className="w-3.5 h-3.5" /> Reflection Ready
              </span>
            )}
          </div>

          {/* AI Error Notification */}
          {aiError && (
            <div className="mt-3 p-2.5 rounded-xl bg-[#1a1a1a] border border-[#e11d48]/40 text-[#e11d48] text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}
        </div>

        {/* Live Reflection Preview (if generated before saving) */}
        {currentReflection && (
          <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#333333] space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#f27d26] font-display flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Gemini Reflection Analysis
              </span>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#f27d26] border border-[#333333]">
                {currentReflection.personaUsed || selectedPersona}
              </span>
            </div>
            
            <p className="text-xs md:text-sm text-[#d4d4d4] leading-relaxed font-serif-body italic">
              "{currentReflection.reflection}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs pt-2 border-t border-[#262626]">
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <span className="text-[10px] text-[#f27d26] font-bold uppercase tracking-wider block mb-1">
                  💡 Cognitive Reframe
                </span>
                <p className="text-[#a3a3a3] text-xs leading-relaxed">{currentReflection.cognitiveReframe}</p>
              </div>

              {currentReflection.actionableNudge && (
                <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                    🌿 Mindful Micro-Nudge
                  </span>
                  <p className="text-[#a3a3a3] text-xs leading-relaxed">{currentReflection.actionableNudge}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls: Submit / Cancel */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
          {onCancelEdit && (
            <button
              id="journal-cancel-edit-btn"
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] text-[#d4d4d4] text-xs font-medium transition-colors"
            >
              Cancel Edit
            </button>
          )}

          <button
            id="journal-save-entry-btn"
            type="submit"
            disabled={saving || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#f27d26] hover:bg-[#e06b16] text-[#0a0a0a] font-bold text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Encrypting & Saving...' : (initialEntry ? 'Update MindVault Entry' : 'Save to MindVault')}</span>
          </button>
        </div>

      </form>
    </section>
  );
};
