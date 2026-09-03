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
  Repeat,
  Camera,
  X,
  Plus,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { MOOD_PRESETS, PERSONA_PRESETS, DEFAULT_TAGS } from '../lib/constants';
import { MoodType, PersonaType, JournalEntry, AIReflectionData, JournalImage } from '../types';
import { requestAIReflection } from '../lib/geminiApi';
import { encryptText, sanitizeInput } from '../lib/security';
import { recordAuditLog } from '../lib/journalService';
import { uploadJournalMemoryPhoto, validateImageFile, MAX_IMAGES_PER_ENTRY } from '../lib/storageService';
import { ImagePreviewModal } from './ImagePreviewModal';

interface JournalEditorProps {
  userId: string;
  initialEntry?: JournalEntry | null;
  onSave: (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | void>;
  onCancelEdit?: () => void;
  vaultPasskey: string | null;
  onOpenPasskeyModal: () => void;
  defaultPrompt?: string | null;
  onNavigateToLoops?: () => void;
  onNavigateToReflections?: () => void;
  onTalkToGeminiEntry?: (entry: JournalEntry) => void;
  onNavigateToGemini?: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  initialEntry,
  onSave,
  onCancelEdit,
  vaultPasskey,
  onOpenPasskeyModal,
  defaultPrompt,
  onNavigateToLoops: _onNavigateToLoops,
  onNavigateToReflections: _onNavigateToReflections,
  onTalkToGeminiEntry,
  onNavigateToGemini,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('reflective');
  const [tags, setTags] = useState<string[]>(['Mindfulness']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('empathetic');
  const [isEncryptedVault, setIsEncryptedVault] = useState(false);

  // Journal Memory Photos State (max 2 images)
  const [images, setImages] = useState<JournalImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewingImage, setPreviewingImage] = useState<JournalImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post-Save Workflow State
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [lastSavedEntry, setLastSavedEntry] = useState<JournalEntry | null>(null);

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
      setImages(initialEntry.images || []);
      setIsEncryptedVault(initialEntry.isEncrypted || false);
      setCurrentReflection(initialEntry.aiReflection || null);
      setSavedEntryId(null);
      setSavedSuccessMessage(null);
    } else if (defaultPrompt) {
      setTitle('');
      setContent(`Prompt: ${defaultPrompt}\n\n`);
      setMood('reflective');
      setImages([]);
      setSavedEntryId(null);
      setSavedSuccessMessage(null);
    } else {
      setImages([]);
      setSavedEntryId(null);
      setSavedSuccessMessage(null);
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
      alert("Voice speech recognition is not supported in this browser. You can write your thoughts directly in the journal.");
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

  // Image Selection & Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageError(null);

    if (images.length >= MAX_IMAGES_PER_ENTRY) {
      setImageError(`Each journal entry is limited to a maximum of ${MAX_IMAGES_PER_ENTRY} memory photos.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const file = files[0];
    const validation = validateImageFile(file, images.length);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const tempEntryId = initialEntry?.id || `draft_${Date.now()}`;
      const uploadedImage = await uploadJournalMemoryPhoto({
        userId,
        entryId: tempEntryId,
        file,
        onProgress: (percent) => setUploadProgress(percent),
      });

      setImages(prev => [...prev, uploadedImage]);
      setImageError(null);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setImageError(err.message || 'Failed to attach image memory.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setImageError(null);
  };

  // Trigger Gemini Reflection (Operates strictly on text/context, never automatically sends photos)
  const handleGenerateReflection = async () => {
    const cleanContent = sanitizeInput(content);
    if (!cleanContent) {
      setAiError("Please write some journal thoughts before requesting an AI reflection.");
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
    setSavedSuccessMessage(null);
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
        images: images.length > 0 ? images : undefined,
        isEncrypted: isEncryptedVault,
        ...(encryptedPayload ? { encryptedPayload } : {}),
        ...(currentReflection ? { aiReflection: currentReflection } : {}),
      };

      const resultId = await onSave(entryPayload);
      const savedId = typeof resultId === 'string' ? resultId : initialEntry?.id || `saved-${Date.now()}`;

      const fullSavedEntry: JournalEntry = {
        id: savedId,
        userId,
        ...entryPayload,
        content: content.trim(), // preserved unencrypted in memory for seamless transition to talk to Gemini
        createdAt: initialEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setSavedEntryId(savedId);
      setLastSavedEntry(fullSavedEntry);
      setSavedSuccessMessage("Entry saved securely to your journal.");

      // If updating, maintain content; if new entry, keep clean state for follow-up options
      if (!initialEntry) {
        setTitle('');
        setContent('');
        setTags(['Mindfulness']);
        setImages([]);
        setCurrentReflection(null);
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
    <section className="bg-surface-card border border-theme rounded-3xl p-6 md:p-8 shadow-xs relative transition-all">
      
      {/* Hidden File Input for Image Memories */}
      <input
        ref={fileInputRef}
        type="file"
        id="journal-memory-file-input"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Editor Top Bar: Mood & Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-theme">
          
          {/* Mood Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-theme-muted font-medium hidden sm:inline">Inner State:</span>
            <div className="relative group">
              <select
                id="journal-mood-select"
                value={mood}
                onChange={(e) => setMood(e.target.value as MoodType)}
                className={`appearance-none text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border transition-all cursor-pointer bg-surface-secondary border-theme text-theme-primary focus:outline-none focus:border-accent`}
              >
                {MOOD_PRESETS.map((m) => (
                  <option key={m.type} value={m.type} className="bg-surface-card text-theme-primary">
                    {m.emoji} {m.label} (Score: {m.score}/5)
                  </option>
                ))}
              </select>
              <Smile className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-theme-muted pointer-events-none" />
            </div>
          </div>

          {/* Right Tools: Voice & Zero-Knowledge Encryption */}
          <div className="flex items-center gap-2">
            
            {/* Voice Dictation Button */}
            <button
              id="journal-voice-dictation-btn"
              type="button"
              onClick={toggleVoiceDictation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isListening
                  ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-surface-secondary border-theme text-theme-secondary hover:text-theme-primary hover:border-accent/40'
              }`}
              title={isListening ? "Listening... Click to stop" : "Dictate your thoughts via Voice"}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-500" /> : <Mic className="w-3.5 h-3.5" />}
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
                  ? 'bg-accent-subtle border-accent text-accent font-semibold'
                  : 'bg-surface-secondary border-theme text-theme-muted hover:text-theme-primary'
              }`}
              title="Client-side AES-GCM Zero-Knowledge Encryption"
            >
              {isEncryptedVault ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-accent" />
                  <span>Passkey Vault</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-theme-muted" />
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
            className="w-full bg-transparent border-0 border-b border-theme focus:border-accent pb-2.5 text-base md:text-lg font-display text-theme-primary placeholder-theme-muted focus:outline-none transition-colors"
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
            className="w-full bg-surface-secondary border border-theme rounded-2xl p-4 text-theme-primary placeholder-theme-muted font-serif-body text-base leading-relaxed focus:outline-none focus:border-accent transition-all resize-y min-h-[160px]"
          />

          {/* Word count footer */}
          <div className="flex items-center justify-between text-[11px] font-mono text-theme-muted px-2 mt-1.5">
            <span>{wordCount} words • ~{readTimeMin} min read</span>
            {isEncryptedVault && (
              <span className="text-accent flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3" /> AES-256 GCM Client Encryption
              </span>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-theme-muted font-medium mr-1 flex items-center gap-1">
              <TagIcon className="w-3 h-3 text-theme-muted" /> Tags:
            </span>

            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg bg-surface-secondary text-theme-secondary border border-theme"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-rose-500 ml-0.5 text-theme-muted transition-colors"
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
                className="text-xs bg-surface-secondary border border-theme rounded-lg px-2 py-0.5 text-theme-primary placeholder-theme-muted focus:outline-none focus:border-accent w-24"
              />
              
              <button
                type="button"
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="ml-1 p-1 text-theme-muted hover:text-theme-primary transition-colors"
                title="Browse suggested tags"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Suggested tags palette */}
          {showTagPicker && (
            <div className="p-3 bg-surface-secondary border border-theme rounded-xl flex flex-wrap gap-1.5 animate-fade-in">
              {DEFAULT_TAGS.map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => handleAddTag(suggested)}
                  disabled={tags.includes(suggested)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    tags.includes(suggested)
                      ? 'bg-surface-card border-theme text-theme-muted opacity-60 cursor-default'
                      : 'bg-surface-card border-theme text-theme-secondary hover:text-accent hover:border-accent/40'
                  }`}
                >
                  +{suggested}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FEATURE 2: Private Journal Memory Photos Section */}
        <div className="space-y-3 pt-2 border-t border-theme">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-theme-primary">Private Journal Memory</span>
              <span className="text-[11px] font-mono text-theme-muted">({images.length}/2 photos)</span>
            </div>

            {images.length < MAX_IMAGES_PER_ENTRY && (
              <button
                id="journal-add-memory-btn"
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-card border border-theme hover:border-accent text-accent text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📷 Add a memory</span>
              </button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {uploadingImage && (
            <div className="p-3 rounded-xl bg-surface-secondary border border-theme space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-theme-secondary font-mono">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  Encrypting & uploading memory photo...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden border border-theme">
                <div 
                  className="h-full bg-accent transition-all duration-200 rounded-full"
                  style={{ width: `${Math.max(5, uploadProgress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Image Validation Error Alert */}
          {imageError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setImageError(null)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                &times;
              </button>
            </div>
          )}

          {/* Selected Images Thumbnails Preview Before Saving */}
          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {images.map((img, idx) => (
                <div 
                  key={img.id || idx}
                  className="relative group bg-surface-secondary border border-theme rounded-2xl p-2.5 flex items-center gap-3 transition-all hover:border-accent/40"
                >
                  <img 
                    src={img.url} 
                    alt={img.name || `Memory ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded-xl border border-theme shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewingImage(img)}
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-theme-primary truncate" title={img.name}>
                      {img.name || `Memory ${idx + 1}`}
                    </p>
                    <p className="text-[11px] font-mono text-theme-muted mt-0.5">
                      {(img.size / 1024).toFixed(0)} KB • Private
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewingImage(img)}
                      className="text-[11px] text-accent hover:underline font-medium mt-1 inline-block"
                    >
                      View full size
                    </button>
                  </div>

                  <button
                    id={`journal-remove-memory-btn-${idx}`}
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="p-1.5 rounded-lg text-theme-muted hover:text-rose-500 hover:bg-surface-card transition-colors shrink-0"
                    title="Remove memory photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optional Gemini AI Reflection Bar (Manual Trigger Only) */}
        <div className="bg-surface-secondary border border-theme rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-surface-card text-accent border border-theme">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-theme-primary">Gemini Cognitive Reflection</h4>
                <p className="text-[11px] text-theme-muted">
                  Private text analysis using server-side Gemini 2.5 Flash
                </p>
              </div>
            </div>

            {/* Persona Selector */}
            <select
              id="journal-persona-select"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value as PersonaType)}
              className="text-xs bg-surface-card border border-theme text-theme-primary font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-accent"
            >
              {PERSONA_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-surface-card text-theme-primary">
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-secondary border border-theme hover:border-accent text-theme-primary hover:text-accent text-xs font-semibold shadow-xs transition-all disabled:opacity-40"
            >
              <Sparkles className={`w-3.5 h-3.5 text-accent ${isReflecting ? 'animate-spin' : ''}`} />
              <span>{isReflecting ? 'Gemini Reflecting...' : 'Reflect with Gemini'}</span>
            </button>

            {currentReflection && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
                <Check className="w-3.5 h-3.5" /> Reflection Ready
              </span>
            )}
          </div>

          {/* AI Error Alert */}
          {aiError && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}
        </div>

        {/* Live Reflection Preview (if generated before saving) */}
        {currentReflection && (
          <div className="p-5 rounded-2xl bg-surface-secondary border border-theme space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-accent font-display flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Gemini Reflection Analysis
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-surface-card text-accent border border-theme">
                {currentReflection.personaUsed || selectedPersona}
              </span>
            </div>
            
            <p className="text-xs md:text-sm text-theme-primary leading-relaxed font-serif-body italic">
              "{currentReflection.reflection}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs pt-2 border-t border-theme">
              <div className="p-3 rounded-xl bg-surface-card border border-theme">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider block mb-1">
                  💡 Cognitive Reframe
                </span>
                <p className="text-theme-secondary text-xs leading-relaxed">{currentReflection.cognitiveReframe}</p>
              </div>

              {currentReflection.actionableNudge && (
                <div className="p-3 rounded-xl bg-surface-card border border-theme">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                    🌿 Mindful Micro-Nudge
                  </span>
                  <p className="text-theme-secondary text-xs leading-relaxed">{currentReflection.actionableNudge}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls: Submit / Cancel */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
          {onCancelEdit && (
            <button
              id="journal-cancel-edit-btn"
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface-card border border-theme text-theme-secondary text-xs font-medium transition-colors"
            >
              Cancel Edit
            </button>
          )}

          <button
            id="journal-save-entry-btn"
            type="submit"
            disabled={saving || uploadingImage || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-primary-accent font-medium text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Encrypting & Saving...' : (initialEntry ? 'Update MindVault Entry' : 'Save Entry')}</span>
          </button>
        </div>

      </form>

      {/* Post-Save Follow-Up Workflow: Natural Choice to Talk to Gemini or Write Another Entry */}
      {savedSuccessMessage && (
        <div className="mt-6 p-5 md:p-6 rounded-3xl bg-surface-secondary border border-accent/40 shadow-xs animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-theme-primary">{savedSuccessMessage}</span>
            </div>
            <button 
              onClick={() => {
                setSavedSuccessMessage(null);
                setLastSavedEntry(null);
              }}
              className="text-theme-muted hover:text-theme-primary text-xs"
            >
              &times; Dismiss
            </button>
          </div>

          <p className="text-xs text-theme-secondary font-serif-body">
            Your reflections are securely saved in your journal without any automatic AI analysis. Would you like to talk through what you wrote with Gemini, or write another entry?
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              id="post-save-talk-gemini-btn"
              onClick={() => {
                if (onTalkToGeminiEntry && lastSavedEntry) {
                  onTalkToGeminiEntry(lastSavedEntry);
                } else if (onNavigateToGemini) {
                  onNavigateToGemini();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary-accent text-white text-xs font-medium transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Talk to Gemini about this entry</span>
            </button>

            <button
              id="post-save-new-entry-btn"
              onClick={() => {
                setSavedSuccessMessage(null);
                setSavedEntryId(null);
                setLastSavedEntry(null);
                setTitle('');
                setContent('');
                setTags(['Mindfulness']);
                setImages([]);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-card hover:bg-surface-secondary border border-theme text-theme-secondary hover:text-theme-primary text-xs font-medium transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write another entry</span>
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal (Accessible, Dismissible with Esc key) */}
      <ImagePreviewModal
        image={previewingImage}
        onClose={() => setPreviewingImage(null)}
      />

    </section>
  );
};
