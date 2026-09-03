import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  RotateCcw, 
  BookOpen, 
  Mic, 
  MicOff, 
  AlertCircle, 
  Compass, 
  Repeat, 
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { JournalEntry, ThoughtLoopAnalysis, AIChatMessage } from '../types';
import { sendGeminiCompanionChat, fetchThoughtLoops } from '../lib/geminiApi';

interface GeminiCompanionViewProps {
  userId?: string;
  entries: JournalEntry[];
  focusedEntry?: JournalEntry | null;
  onClearFocusedEntry?: () => void;
  onWriteJournalPrompt?: (promptText: string) => void;
  initialPrompt?: string | null;
}

export const GeminiCompanionView: React.FC<GeminiCompanionViewProps> = ({
  userId: _userId,
  entries,
  focusedEntry,
  onClearFocusedEntry,
  onWriteJournalPrompt,
  initialPrompt
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: focusedEntry
        ? `I'm here with you to explore "${focusedEntry.title || 'your recent reflection'}". What thoughts or sensations are coming up around this entry?`
        : "I'm here with you. Whether you want to talk through a worry, celebrate a quiet win, or unpack how you've been feeling, I'm listening.",
      timestamp: new Date().toISOString()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hidden Thought Loop capability: On-demand exploration state
  const [patternAnalysis, setPatternAnalysis] = useState<ThoughtLoopAnalysis | null>(null);
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const [patternError, setPatternError] = useState<string | null>(null);

  // Voice dictation
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, patternAnalysis]);

  // Voice dictation setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev.trim() ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // Handle initial prompt if passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
    }
  }, [initialPrompt]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setError(null);
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const reply = await sendGeminiCompanionChat({
        currentMessage: text,
        history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        entryId: focusedEntry?.id,
        entryContent: focusedEntry?.content
      });

      const assistantMsg: AIChatMessage = {
        id: `gemini-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      setError(err.message || "Could not connect with Gemini. Please check your connection or sign-in state.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    if (confirm("Start a fresh conversation with Gemini?")) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: "Fresh conversation started. What would you like to explore today?",
          timestamp: new Date().toISOString()
        }
      ]);
      setPatternAnalysis(null);
      setError(null);
    }
  };

  // Trigger internal Thought Loop Detector capability
  const handleExplorePatterns = async () => {
    setIsAnalyzingPatterns(true);
    setPatternError(null);
    try {
      const analysis = await fetchThoughtLoops();
      setPatternAnalysis(analysis);
    } catch (err: any) {
      console.error("Thought Loop Analysis Error:", err);
      setPatternError(err.message || "Failed to analyze recurring patterns.");
    } finally {
      setIsAnalyzingPatterns(false);
    }
  };

  // Determine if recent messages mention recurring thoughts or if user has multiple entries
  const showPatternSuggestion = entries.length >= 2 && !patternAnalysis;

  return (
    <section className="max-w-4xl mx-auto space-y-4 animate-fade-in flex flex-col h-[calc(100vh-12rem)] min-h-[580px]">
      
      {/* Header Bar */}
      <div className="bg-surface-card border border-theme rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-theme flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base text-theme-primary tracking-tight">
                Gemini Journal Companion
              </h2>
              <span className="text-[10px] font-mono text-accent px-2 py-0.5 rounded-full bg-surface-secondary border border-theme">
                Confidential
              </span>
            </div>
            <p className="text-[11px] text-theme-muted font-serif-body">
              Talk freely with Gemini. Reflects with you naturally using your private journal context.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="gemini-clear-chat-btn"
            onClick={handleClearConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-card border border-theme text-xs text-theme-muted hover:text-theme-primary transition-colors cursor-pointer shadow-xs"
            title="Clear current dialogue and start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New conversation</span>
          </button>
        </div>
      </div>

      {/* Focused Entry Context Banner (if user came from an entry) */}
      {focusedEntry && (
        <div className="bg-surface-card border border-accent/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs gap-3 shadow-xs shrink-0">
          <div className="flex items-center gap-2 truncate">
            <BookOpen className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-theme-muted">Discussing entry:</span>
            <span className="font-semibold text-theme-primary truncate">"{focusedEntry.title || 'Untitled'}"</span>
            <span className="text-theme-muted font-mono">({new Date(focusedEntry.createdAt).toLocaleDateString()})</span>
          </div>

          {onClearFocusedEntry && (
            <button
              onClick={onClearFocusedEntry}
              className="text-theme-muted hover:text-theme-primary p-1 rounded-lg hover:bg-surface-secondary"
              title="Return to general journal companion chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Message History Stream */}
      <div 
        id="gemini-conversation-stream"
        className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface-card border border-theme rounded-3xl space-y-4 shadow-xs"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-theme-muted mb-1 px-1">
              {msg.role === 'user' ? (
                <span>You</span>
              ) : (
                <span className="flex items-center gap-1 text-accent font-medium">
                  <Sparkles className="w-3 h-3" />
                  Gemini
                </span>
              )}
              <span>•</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-xl md:max-w-2xl whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-accent text-white font-sans rounded-tr-xs shadow-xs'
                  : 'bg-surface-secondary text-theme-primary font-serif-body border border-theme rounded-tl-xs shadow-xs'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start max-w-full animate-fade-in">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-accent mb-1 px-1">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Gemini is reflecting...</span>
            </div>
            <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-surface-secondary border border-theme text-theme-muted text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-ping"></div>
              <span>Forming thoughtful reflection...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="underline font-semibold hover:opacity-80 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Inline Thought Loop Analysis Card (Surfaced organically when user explores patterns) */}
        {patternAnalysis && (
          <div className="p-5 rounded-2xl bg-surface-secondary border border-accent/30 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-accent" />
                <h4 className="font-display font-semibold text-xs text-theme-primary uppercase tracking-wider">
                  Recurring Patterns in Your Journal
                </h4>
              </div>
              <button
                onClick={() => setPatternAnalysis(null)}
                className="text-theme-muted hover:text-theme-primary text-xs"
              >
                &times; Dismiss
              </button>
            </div>

            {patternAnalysis.insufficientData ? (
              <p className="text-xs text-theme-secondary font-serif-body">
                {patternAnalysis.message || "Write a couple more reflections to help Gemini detect long-term emotional themes."}
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-theme-primary font-serif-body italic">
                  "{patternAnalysis.overallSummary}"
                </p>

                {patternAnalysis.recurringPatterns && patternAnalysis.recurringPatterns.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {patternAnalysis.recurringPatterns.slice(0, 2).map((pattern, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-surface-card border border-theme space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-theme-primary">{pattern.theme}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-secondary text-accent">
                            {pattern.trend}
                          </span>
                        </div>
                        <p className="text-[11px] text-theme-secondary leading-relaxed">
                          {pattern.reflectiveInsight}
                        </p>
                        {pattern.reflectionQuestion && (
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                if (onWriteJournalPrompt) {
                                  onWriteJournalPrompt(pattern.reflectionQuestion);
                                } else {
                                  handleSendMessage(`Let's reflect on this question: "${pattern.reflectionQuestion}"`);
                                }
                              }}
                              className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>Reflect on this question</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {patternError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
            {patternError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[11px] font-mono text-theme-muted">Suggestions:</span>
          {[
            "I'm feeling a bit overwhelmed today.",
            "I had a quiet win today that felt good.",
            "What recurring themes have I been writing about?",
            "Help me unpack a decision I'm wrestling with."
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-secondary border border-theme hover:border-accent text-theme-secondary hover:text-theme-primary transition-all shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Form */}
      <div className="bg-surface-card border border-theme rounded-2xl p-2.5 md:p-3 shadow-xs flex items-end gap-2 shrink-0">
        <textarea
          ref={textareaRef}
          id="gemini-chat-input"
          rows={2}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Talk freely with Gemini... (Press Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          className="flex-1 bg-surface-secondary border border-theme rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:border-accent resize-none min-h-[44px] max-h-32 transition-colors"
        />

        <div className="flex items-center gap-1.5 pb-1">
          {/* Voice Input Button */}
          <button
            id="gemini-chat-voice-btn"
            type="button"
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl border text-xs transition-all ${
              isListening 
                ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse' 
                : 'bg-surface-secondary border-theme text-theme-muted hover:text-theme-primary'
            }`}
            title={isListening ? "Listening... Click to stop" : "Speak your message"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            id="gemini-chat-send-btn"
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl btn-primary-accent text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
            title="Send message to Gemini"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </section>
  );
};
