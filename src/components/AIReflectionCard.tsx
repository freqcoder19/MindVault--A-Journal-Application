import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  MessageSquare, 
  HelpCircle, 
  Send, 
  Check, 
  Lightbulb, 
  Flame, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AIReflectionData, AIChatMessage, PersonaType } from '../types';
import { sendEntryDialog } from '../lib/geminiApi';
import { PERSONA_PRESETS } from '../lib/constants';

interface AIReflectionCardProps {
  reflection: AIReflectionData;
  entryContent: string;
  onSelectInquiryQuestion?: (question: string) => void;
  savedChatHistory?: AIChatMessage[];
  onSaveChatHistory?: (chat: AIChatMessage[]) => void;
}

export const AIReflectionCard: React.FC<AIReflectionCardProps> = ({
  reflection,
  entryContent,
  onSelectInquiryQuestion,
  savedChatHistory = [],
  onSaveChatHistory,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(savedChatHistory);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(savedChatHistory.length > 0);

  const persona = PERSONA_PRESETS.find(p => p.id === reflection.personaUsed) || PERSONA_PRESETS[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsSending(true);

    try {
      const reply = await sendEntryDialog(entryContent, newMessages, userMsg.content);
      const aiMsg: AIChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      const finalHistory = [...newMessages, aiMsg];
      setMessages(finalHistory);
      if (onSaveChatHistory) {
        onSaveChatHistory(finalHistory);
      }
    } catch (err: any) {
      console.error("Dialog error:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-surface-card border border-theme rounded-2xl p-5 md:p-6 shadow-xs relative overflow-hidden transition-all">
      
      {/* Top Banner: Persona & Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-theme/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent/15 border border-accent/30 text-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-display font-bold text-theme-primary uppercase tracking-wider">
                Gemini Cognitive Reflection
              </h4>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${persona.badgeColor}`}>
                {persona.name}
              </span>
            </div>
            <p className="text-[11px] text-theme-muted font-serif-body">{reflection.sentimentSummary}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-surface-secondary px-3 py-1 rounded-full border border-theme">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span>Server-Side Isolated</span>
        </div>
      </div>

      {/* Main Reflection Body */}
      <div className="py-4">
        <p className="text-theme-primary text-sm md:text-base leading-relaxed font-serif-body italic whitespace-pre-line">
          "{reflection.reflection}"
        </p>
      </div>

      {/* Structured Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        
        {/* Cognitive Reframe */}
        <div className="p-4 rounded-xl bg-surface-secondary border border-theme">
          <div className="flex items-center gap-1.5 text-accent text-xs font-semibold mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Cognitive Reframe</span>
          </div>
          <p className="text-xs text-theme-secondary leading-relaxed font-serif-body">
            {reflection.cognitiveReframe}
          </p>
        </div>

        {/* Actionable Micro-Nudge */}
        {reflection.actionableNudge && (
          <div className="p-4 rounded-xl bg-surface-secondary border border-theme">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Mindful Micro-Nudge</span>
            </div>
            <p className="text-xs text-theme-secondary leading-relaxed font-serif-body">
              {reflection.actionableNudge}
            </p>
          </div>
        )}
      </div>

      {/* Key Themes Chips */}
      {reflection.keyThemes && reflection.keyThemes.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-theme-muted uppercase tracking-wider mr-1">
            Psychological Themes:
          </span>
          {reflection.keyThemes.map((theme, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-surface-secondary text-theme-secondary border border-theme font-mono"
            >
              #{theme}
            </span>
          ))}
        </div>
      )}

      {/* Inquiry Questions for Tomorrow */}
      {reflection.inquiryQuestions && reflection.inquiryQuestions.length > 0 && (
        <div className="mt-4 p-4.5 rounded-xl bg-surface-secondary border border-theme space-y-2.5">
          <div className="flex items-center gap-1.5 text-accent text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Introspective Follow-Up Prompts</span>
          </div>
          
          <div className="space-y-2">
            {reflection.inquiryQuestions.map((q, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3 text-xs text-theme-primary group">
                <span className="leading-relaxed font-serif-body flex-1">
                  • {q}
                </span>
                {onSelectInquiryQuestion && (
                  <button
                    id={`inquiry-btn-${idx}`}
                    type="button"
                    onClick={() => onSelectInquiryQuestion(q)}
                    className="shrink-0 text-[11px] text-accent hover:opacity-80 hover:underline flex items-center gap-1 font-mono transition-opacity cursor-pointer"
                  >
                    <span>Journal this</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Conversation Accordion */}
      <div className="mt-4 pt-3.5 border-t border-theme/60">
        <button
          id="toggle-ai-chat-btn"
          type="button"
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-2 text-xs font-medium text-accent hover:opacity-80 transition-opacity cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{showChat ? 'Hide Reflection Dialogue' : 'Explore this thought deeper with Gemini →'}</span>
          {messages.length > 0 && (
            <span className="text-[10px] bg-surface-secondary text-theme-secondary px-2 py-0.5 rounded-full border border-theme font-mono">
              {messages.length} msgs
            </span>
          )}
        </button>

        {showChat && (
          <div className="mt-3 bg-surface-secondary/70 border border-theme rounded-2xl p-4 space-y-3 animate-fade-in">
            {/* Dialogue Message List */}
            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {messages.length === 0 ? (
                <p className="text-theme-muted italic text-[11px] text-center py-2">
                  Ask Gemini clarifying questions, unpack an emotion, or request a mindfulness exercise based on this entry.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl ${
                      m.role === 'user'
                        ? 'bg-surface-card border border-accent/40 text-theme-primary ml-6 text-right'
                        : 'bg-surface-card border border-theme text-theme-secondary mr-6 text-left font-serif-body'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-theme/60">
              <input
                id="dialog-msg-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Gemini to unpack a thought or suggest a perspective..."
                className="flex-1 bg-surface-card border border-theme rounded-xl px-3 py-2 text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-accent"
              />
              <button
                id="dialog-send-btn"
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="p-2 rounded-xl bg-accent text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};
