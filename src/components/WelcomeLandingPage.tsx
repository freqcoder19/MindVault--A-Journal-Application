import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  ArrowRight, 
  MessageSquare, 
  Image as ImageIcon,
  CheckCircle2,
  X,
  Compass,
  HeartHandshake,
  Key
} from 'lucide-react';

interface WelcomeLandingPageProps {
  onOpenAuth: () => void;
}

type IntroStage = 'write' | 'talk' | 'understand';

export const WelcomeLandingPage: React.FC<WelcomeLandingPageProps> = ({ onOpenAuth }) => {
  const [activeStage, setActiveStage] = useState<IntroStage>('write');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Stages configuration
  const stages: Record<IntroStage, {
    number: string;
    label: string;
    headline: string;
    description: string;
    icon: React.ElementType;
  }> = {
    write: {
      number: '01',
      label: 'WRITE',
      headline: 'Capture what is on your mind.',
      description: 'Put your thoughts into words, attach private memories, and keep everything organized.',
      icon: BookOpen
    },
    talk: {
      number: '02',
      label: 'TALK',
      headline: 'Have a natural conversation with Gemini.',
      description: 'Talk naturally with Gemini using the journal context you choose to share.',
      icon: MessageSquare
    },
    understand: {
      number: '03',
      label: 'UNDERSTAND',
      headline: 'Discover patterns and insights over time.',
      description: 'Explore insights and recurring thought patterns without exposing your private journal to administrators.',
      icon: TrendingUp
    }
  };

  const currentStage = stages[activeStage];

  return (
    <div className="min-h-screen bg-[#090c0e] text-[#e8eceb] font-sans relative overflow-x-hidden selection:bg-[#48ab9e]/25 selection:text-[#48ab9e] flex flex-col">
      
      {/* Ambient background glow & atmospheric gradients */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-[#2d7a6e]/18 via-[#1f4a43]/8 to-transparent rounded-full blur-[130px] pointer-events-none -z-10"
        aria-hidden="true" 
      />
      <div 
        className="absolute top-[45%] right-[-120px] w-[500px] h-[500px] bg-gradient-to-br from-[#48ab9e]/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10"
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-10 left-[-100px] w-[550px] h-[550px] bg-gradient-to-tr from-[#16302c]/20 to-transparent rounded-full blur-[150px] pointer-events-none -z-10"
        aria-hidden="true" 
      />

      {/* Subtle geometric starfield/grid backdrop */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#141c2018_1px,transparent_1px),linear-gradient(to_bottom,#141c2018_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" 
        aria-hidden="true"
      />

      {/* MINIMAL NAVIGATION HEADER */}
      <header className="w-full border-b border-[#1b252b]/80 bg-[#090c0e]/80 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="w-8 h-8 rounded-xl bg-[#12191d] border border-[#233139] flex items-center justify-center text-[#48ab9e] shadow-[0_0_15px_rgba(72,171,158,0.15)] group-hover:border-[#48ab9e]/40 transition-all">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-wider text-white">
                MindVault
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c827d]">
                Private Journal
              </span>
            </div>
          </div>

          {/* Minimal Links */}
          <nav className="flex items-center gap-6 sm:gap-8 text-xs font-medium text-[#9ea8a5]">
            <a 
              href="#interactive-space" 
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </a>
            <button 
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              id="landing-header-signin-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#141d22] hover:bg-[#1a252b] text-white border border-[#273841] hover:border-[#48ab9e]/50 font-medium transition-all shadow-xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#48ab9e]" />
              <span>Sign In</span>
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 flex flex-col items-center">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8 md:pt-12">
          
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#11181c]/90 border border-[#22323a] text-xs text-[#9ea8a5] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#48ab9e] animate-pulse" />
            <span className="font-mono tracking-wider uppercase text-[11px] text-[#48ab9e]">
              Private • AI-Assisted • Zero-Trust
            </span>
          </div>

          {/* Hero Title */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.15]">
            MindVault
          </h1>

          {/* Tagline */}
          <p className="font-serif-body text-xl sm:text-2xl md:text-3xl italic text-[#d6dedb] font-normal tracking-wide leading-snug">
            "Your thoughts. Your space. Your understanding."
          </p>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-[#9ea8a5] max-w-2xl mx-auto leading-relaxed font-normal">
            A private journal where you can write freely, talk with Gemini, and understand patterns in your thoughts — while keeping your personal memories protected.
          </p>

          {/* Primary CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="landing-hero-signin-btn"
              onClick={onOpenAuth}
              className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#2d7a6e] hover:bg-[#236359] text-white font-medium text-sm sm:text-base shadow-[0_0_28px_rgba(45,122,110,0.35)] hover:shadow-[0_0_36px_rgba(45,122,110,0.55)] transition-all cursor-pointer border border-[#48ab9e]/40"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Authentication Guarantee */}
          <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-mono text-[#7c827d]">
            <Lock className="w-3 h-3 text-[#48ab9e]" />
            <span>Requires authenticated user account • Zero guest leakage</span>
          </div>

        </section>

        {/* INTERACTIVE INTRO PANEL */}
        <section 
          id="interactive-space"
          className="w-full mt-16 sm:mt-20 scroll-mt-24"
        >
          <div className="relative rounded-3xl bg-[#10161a]/75 border border-[#212e36] p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-[0_12px_48px_rgba(0,0,0,0.6)] overflow-hidden">
            
            {/* Top ambient highlight line */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#48ab9e]/50 to-transparent" />
            
            {/* Header / Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#1b262d]">
              <div>
                <span className="text-[11px] font-mono tracking-[0.2em] text-[#48ab9e] uppercase block mb-1">
                  Interactive Preview
                </span>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-wide">
                  YOUR PRIVATE SPACE
                </h2>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-[#7c827d] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#48ab9e]" />
                <span>Write → Talk → Understand</span>
              </div>
            </div>

            {/* 3 Interactive Stages Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6">
              {(Object.keys(stages) as IntroStage[]).map((key) => {
                const s = stages[key];
                const isActive = activeStage === key;
                const IconComponent = s.icon;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveStage(key)}
                    onMouseEnter={() => setActiveStage(key)}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isActive 
                        ? 'bg-[#152026] border-[#48ab9e]/60 shadow-[0_0_24px_rgba(72,171,158,0.12)] text-white' 
                        : 'bg-[#11171a]/50 border-[#1d272d] text-[#7c827d] hover:text-[#c4ccc9] hover:bg-[#131b20]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#48ab9e]" />
                    )}
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-mono font-semibold tracking-wider ${isActive ? 'text-[#48ab9e]' : 'text-[#606967]'}`}>
                        {s.number} — {s.label}
                      </span>
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#48ab9e]' : 'text-[#606967]'}`} />
                    </div>
                    
                    <h3 className={`text-sm font-semibold mb-1 ${isActive ? 'text-white' : 'text-[#9ea8a5]'}`}>
                      {s.headline}
                    </h3>
                  </button>
                );
              })}
            </div>

            {/* Detailed Active Stage Showcase Area */}
            <div className="mt-6 p-6 sm:p-8 rounded-2xl bg-[#0d1316] border border-[#1b262d] relative transition-all">
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                
                {/* Left: Stage description */}
                <div className="space-y-3 max-w-md">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131e23] border border-[#24353e] text-[11px] font-mono text-[#48ab9e]">
                    <Sparkles className="w-3 h-3" />
                    <span>Stage {currentStage.number}: {currentStage.label}</span>
                  </div>
                  <h4 className="font-display text-lg sm:text-xl font-bold text-white">
                    {currentStage.headline}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#9ea8a5] leading-relaxed font-normal">
                    {currentStage.description}
                  </p>
                </div>

                {/* Right: Simulated Interactive Mock Window */}
                <div className="w-full lg:w-[420px] bg-[#12191d] border border-[#233139] rounded-xl p-4 text-xs shadow-inner">
                  
                  {activeStage === 'write' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-[#1f2c33] pb-2 text-[11px] font-mono text-[#7c827d]">
                        <span>Today • 9:42 PM</span>
                        <span className="text-[#48ab9e] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Encrypted Vault
                        </span>
                      </div>
                      <div className="font-serif-body italic text-[#dbe3e0] text-sm leading-relaxed">
                        "The noise of the week finally softened today. I realized clarity doesn't come from forcing answers, but creating quiet..."
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#19242a] text-[10px] font-mono text-[#48ab9e] border border-[#253740]">
                          <ImageIcon className="w-3 h-3" />
                          Private photo memory attached
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#19242a] text-[#9ea8a5]">
                          #peace
                        </span>
                      </div>
                    </div>
                  )}

                  {activeStage === 'talk' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-[#1f2c33] pb-2 text-[11px] font-mono text-[#7c827d]">
                        <span>Gemini Reflection</span>
                        <span className="text-[#48ab9e]">Server-Isolated</span>
                      </div>
                      <div className="bg-[#162127] rounded-lg p-3 text-[#c6d0cc] leading-relaxed text-[11.5px] border border-[#24343d]">
                        <span className="text-[#48ab9e] font-semibold block mb-1 font-mono text-[10px] uppercase tracking-wider">
                          Companion Insight
                        </span>
                        "I noticed you spoke about feeling unmoored early in the week, but centered by Friday. Would you like to explore what habits helped you recover that peace?"
                      </div>
                    </div>
                  )}

                  {activeStage === 'understand' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-[#1f2c33] pb-2 text-[11px] font-mono text-[#7c827d]">
                        <span>Thought Loop Analysis</span>
                        <span className="text-emerald-400">Recurring Pattern</span>
                      </div>
                      <div className="bg-[#142025] rounded-lg p-3 border border-[#22353f] space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-white font-medium">Sunday Clarity Cycle</span>
                          <span className="text-[10px] font-mono text-[#48ab9e]">3 occurrences</span>
                        </div>
                        <p className="text-[11px] text-[#9ea8a5] leading-relaxed">
                          Your thoughts consistently shift toward long-term optimism during Sunday morning writing sessions.
                        </p>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* PRIVACY STATEMENT */}
            <div 
              id="privacy" 
              className="mt-8 pt-6 border-t border-[#1b262d] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#162329] border border-[#253943] flex items-center justify-center text-[#48ab9e] shrink-0">
                  <Lock className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold tracking-wider text-white uppercase block">
                    PRIVATE BY DESIGN
                  </span>
                  <p className="text-xs text-[#9ea8a5] mt-0.5">
                    Your journal is isolated to your account. Your private conversations and memories are not visible to administrators.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="shrink-0 text-xs text-[#48ab9e] hover:text-[#5ec7b9] underline underline-offset-4 transition-colors font-mono cursor-pointer"
              >
                Learn more
              </button>
            </div>

          </div>
        </section>

        {/* VISUAL FEATURE CARDS */}
        <section 
          id="features"
          className="w-full mt-10 grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {/* Card 1: Private Journal */}
          <div className="group p-6 rounded-2xl bg-[#101518]/60 hover:bg-[#131b20] border border-[#1e2930] hover:border-[#48ab9e]/40 transition-all duration-300 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#151f24] border border-[#233139] flex items-center justify-center text-[#48ab9e] group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-white tracking-wide">
                PRIVATE JOURNAL
              </h3>
              <p className="text-xs text-[#9ea8a5] leading-relaxed">
                Your personal space for thoughts and memories.
              </p>
            </div>
          </div>

          {/* Card 2: Gemini Companion */}
          <div className="group p-6 rounded-2xl bg-[#101518]/60 hover:bg-[#131b20] border border-[#1e2930] hover:border-[#48ab9e]/40 transition-all duration-300 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#151f24] border border-[#233139] flex items-center justify-center text-[#48ab9e] group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-white tracking-wide">
                GEMINI COMPANION
              </h3>
              <p className="text-xs text-[#9ea8a5] leading-relaxed">
                Talk naturally and reflect with Gemini.
              </p>
            </div>
          </div>

          {/* Card 3: Thought Loop */}
          <div className="group p-6 rounded-2xl bg-[#101518]/60 hover:bg-[#131b20] border border-[#1e2930] hover:border-[#48ab9e]/40 transition-all duration-300 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#151f24] border border-[#233139] flex items-center justify-center text-[#48ab9e] group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-white tracking-wide">
                THOUGHT LOOP
              </h3>
              <p className="text-xs text-[#9ea8a5] leading-relaxed">
                Notice recurring patterns when they matter.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM FINAL INVITATION */}
        <section className="mt-16 text-center space-y-4">
          <p className="text-xs font-mono text-[#7c827d]">
            Ready to begin your private reflection?
          </p>
          <button
            id="landing-bottom-signin-btn"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#152026] hover:bg-[#1c2930] text-white border border-[#2b3d47] hover:border-[#48ab9e]/60 text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#48ab9e]" />
            <span>Sign In to MindVault</span>
          </button>
        </section>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="w-full border-t border-[#1b252b] py-8 text-center text-xs text-[#606967] font-mono">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} MindVault • Personal Gemini Journal</span>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-[#9ea8a5] transition-colors cursor-pointer"
            >
              Privacy Notice
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={onOpenAuth}
              className="hover:text-white transition-colors cursor-pointer text-[#48ab9e]"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>

      {/* CLEAN PRIVACY MODAL */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080b0d]/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#11171a] border border-[#232f36] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#7c827d] hover:text-white hover:bg-[#1a2328] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#152127] border border-[#253842] flex items-center justify-center text-[#48ab9e]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Privacy Architecture
                </h3>
                <span className="text-[11px] font-mono text-[#48ab9e] uppercase tracking-wider">
                  Private by Design
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#9ea8a5] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#0d1316] border border-[#1f2b32]">
                <strong className="text-white block mb-1 font-medium">Account-Level Isolation</strong>
                Your journal entries, reflections, and attachments are strictly bound to your authenticated account. No other user can access your thoughts.
              </div>

              <div className="p-3.5 rounded-xl bg-[#0d1316] border border-[#1f2b32]">
                <strong className="text-white block mb-1 font-medium">Zero Administrator Snooping</strong>
                System administrators only monitor high-level aggregate telemetry (e.g. system uptime, token usage). Under no circumstances are your private journals or conversations queried or displayed.
              </div>

              <div className="p-3.5 rounded-xl bg-[#0d1316] border border-[#1f2b32]">
                <strong className="text-white block mb-1 font-medium">Your Choice with Gemini</strong>
                Reflections are processed through our trusted, server-side Gemini integration only when you choose to converse or request guidance.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1f2b32] flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#19242a] hover:bg-[#202d34] text-white text-xs font-medium transition-colors cursor-pointer border border-[#293a43]"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
