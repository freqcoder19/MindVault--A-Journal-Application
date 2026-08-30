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
    <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 md:p-7 shadow-2xl relative overflow-hidden transition-all">
      
      {/* Top Banner: Persona & Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#1a1a1a] border border-[#333333] text-[#f27d26]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                Gemini Cognitive Reflection
              </h4>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${persona.badgeColor}`}>
                {persona.name}
              </span>
            </div>
            <p className="text-[11px] text-[#737373]">{reflection.sentimentSummary}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-[#1a1a1a] px-3 py-1 rounded-full border border-[#333333]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span>Server-Side Isolated</span>
        </div>
      </div>

      {/* Main Reflection Body */}
      <div className="py-4">
        <p className="text-[#d4d4d4] text-sm md:text-base leading-relaxed font-serif-body italic whitespace-pre-line">
          "{reflection.reflection}"
        </p>
      </div>

      {/* Structured Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        
        {/* Cognitive Reframe */}
        <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626]">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Cognitive Reframe</span>
          </div>
          <p className="text-xs text-[#a3a3a3] leading-relaxed font-serif-body">
            {reflection.cognitiveReframe}
          </p>
        </div>

        {/* Actionable Micro-Nudge */}
        {reflection.actionableNudge && (
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#262626]">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Mindful Micro-Nudge</span>
            </div>
            <p className="text-xs text-[#a3a3a3] leading-relaxed font-serif-body">
              {reflection.actionableNudge}
            </p>
          </div>
        )}
      </div>

      {/* Key Themes Chips */}
      {reflection.keyThemes && reflection.keyThemes.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#737373] uppercase tracking-wider mr-1">
            Psychological Themes:
          </span>
          {reflection.keyThemes.map((theme, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#1a1a1a] text-[#d4d4d4] border border-[#333333] font-mono"
            >
              #{theme}
            </span>
          ))}
        </div>
      )}

      {/* Inquiry Questions for Tomorrow */}
      {reflection.inquiryQuestions && reflection.inquiryQuestions.length > 0 && (
        <div className="mt-4 p-4.5 rounded-2xl bg-[#0a0a0a] border border-[#262626] space-y-2.5">
          <div className="flex items-center gap-1.5 text-[#f27d26] text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Introspective Follow-Up Prompts</span>
          </div>
          
          <div className="space-y-2">
            {reflection.inquiryQuestions.map((q, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3 text-xs text-[#d4d4d4] group">
                <span className="leading-relaxed font-serif-body flex-1">
                  • {q}
                </span>
                {onSelectInquiryQuestion && (
                  <button
                    id={`inquiry-btn-${idx}`}
                    type="button"
                    onClick={() => onSelectInquiryQuestion(q)}
                    className="shrink-0 text-[11px] text-[#f27d26] hover:text-[#e06b16] hover:underline flex items-center gap-1 font-mono transition-colors cursor-pointer"
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
      <div className="mt-4 pt-3.5 border-t border-[#262626]">
        <button
          id="toggle-ai-chat-btn"
          type="button"
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-2 text-xs font-medium text-[#f27d26] hover:text-[#e06b16] transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{showChat ? 'Hide Reflection Dialogue' : 'Explore this thought deeper with Gemini →'}</span>
          {messages.length > 0 && (
            <span className="text-[10px] bg-[#1a1a1a] text-[#d4d4d4] px-2 py-0.5 rounded-full border border-[#333333] font-mono">
              {messages.length} msgs
            </span>
          )}
        </button>

        {showChat && (
          <div className="mt-3 bg-[#0a0a0a] border border-[#262626] rounded-2xl p-4 space-y-3 animate-fade-in">
            {/* Dialogue Message List */}
            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {messages.length === 0 ? (
                <p className="text-[#525252] italic text-[11px] text-center py-2">
                  Ask Gemini clarifying questions, unpack an emotion, or request a mindfulness exercise based on this entry.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl ${
                      m.role === 'user'
                        ? 'bg-[#1a1a1a] border border-[#333333] text-white ml-6 text-right'
                        : 'bg-[#121212] border border-[#262626] text-[#d4d4d4] mr-6 text-left font-serif-body'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-[#262626]">
              <input
                id="dialog-msg-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Gemini to unpack a thought or suggest a perspective..."
                className="flex-1 bg-[#121212] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#d4d4d4] placeholder-[#525252] focus:outline-none focus:border-[#f27d26]/50"
              />
              <button
                id="dialog-send-btn"
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="p-2 rounded-xl bg-[#f27d26] text-[#0a0a0a] hover:bg-[#e06b16] disabled:opacity-40 transition-colors cursor-pointer"
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
