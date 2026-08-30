import { MoodMeta, PersonaMeta, IntrospectivePrompt } from "../types";

export const MOOD_PRESETS: MoodMeta[] = [
  { type: 'ecstatic', label: 'Ecstatic / Radiant', score: 5, color: 'text-[#f27d26]', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '✨' },
  { type: 'grateful', label: 'Deeply Grateful', score: 5, color: 'text-emerald-400', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '🌿' },
  { type: 'calm', label: 'Serene / Centered', score: 4, color: 'text-teal-400', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '🌊' },
  { type: 'focused', label: 'Flow & Clarity', score: 4, color: 'text-sky-400', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '🎯' },
  { type: 'reflective', label: 'Pensive / Introspective', score: 3, color: 'text-[#f27d26]', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '🌙' },
  { type: 'hopeful', label: 'Hopeful & Yearning', score: 4, color: 'text-violet-400', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '🌱' },
  { type: 'anxious', label: 'Anxious / Restless', score: 2, color: 'text-amber-400', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '⚡' },
  { type: 'frustrated', label: 'Blocked / Frustrated', score: 2, color: 'text-rose-400', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '🔥' },
  { type: 'exhausted', label: 'Fatigued / Burnout', score: 1, color: 'text-[#737373]', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '🍂' },
  { type: 'grieving', label: 'Vulnerable / Heavy', score: 1, color: 'text-purple-400', bgColor: 'bg-[#1a1a1a] border-[#333333]', emoji: '🌧️' },
];

export const PERSONA_PRESETS: PersonaMeta[] = [
  {
    id: 'empathetic',
    name: 'Empathetic Companion',
    subtitle: 'Warm Validation & Presence',
    description: 'Provides gentle, heartfelt psychological safety, holding space for whatever emotions arise.',
    iconName: 'HeartHandshake',
    badgeColor: 'text-emerald-400 bg-[#1a1a1a] border-[#333333]',
  },
  {
    id: 'socratic',
    name: 'Socratic Mirror',
    subtitle: 'Deep Inquiry & Unpacking',
    description: 'Asks clarifying, non-judgmental questions to help you uncover underlying beliefs and patterns.',
    iconName: 'HelpCircle',
    badgeColor: 'text-[#f27d26] bg-[#1a1a1a] border-[#333333]',
  },
  {
    id: 'cbt',
    name: 'CBT Perspective',
    subtitle: 'Cognitive Reframing',
    description: 'Identifies cognitive distortions (all-or-nothing, catastrophizing) and offers grounded reframes.',
    iconName: 'BrainCircuit',
    badgeColor: 'text-cyan-400 bg-[#1a1a1a] border-[#333333]',
  },
  {
    id: 'stoic',
    name: 'Stoic Philosopher',
    subtitle: 'Dichotomy of Control',
    description: 'Rooted in Marcus Aurelius and Epictetus: separating what is in your power from what is not.',
    iconName: 'ShieldCheck',
    badgeColor: 'text-[#f27d26] bg-[#1a1a1a] border-[#333333]',
  },
  {
    id: 'actionable',
    name: 'Action & Habit Coach',
    subtitle: 'Pragmatic Micro-Steps',
    description: 'Translates introspection into tangible, low-friction habits and tomorrow’s behavioral nudges.',
    iconName: 'Flame',
    badgeColor: 'text-amber-400 bg-[#1a1a1a] border-[#333333]',
  },
];

export const DEFAULT_TAGS = [
  'Gratitude',
  'Deep Work',
  'Relationships',
  'Mindfulness',
  'Emotional Processing',
  'Boundaries',
  'Dreams & Vision',
  'Physical Health',
  'Self-Compassion',
  'Anxiety Relief',
  'Creative Spark',
  'Evening Wind-Down',
];

export const STARTER_PROMPTS: IntrospectivePrompt[] = [
  {
    category: 'Clarity & Energy',
    title: 'What Gained & Drained Energy?',
    promptText: 'Look back across today. Which single interaction, task, or thought pattern energized you the most? What felt like a quiet energy leak? What small shift can safeguard your boundary tomorrow?',
    estimatedMinutes: 5,
    tags: ['Mindfulness', 'Boundaries', 'Deep Work'],
  },
  {
    category: 'Cognitive Reframing',
    title: 'The Unspoken Anxiety',
    promptText: 'Name the anxiety or tension you are carrying right now without judging it. If this feeling had a message for you, what is it trying to protect? What is the most grounded, realistic perspective?',
    estimatedMinutes: 7,
    tags: ['Emotional Processing', 'Anxiety Relief', 'Self-Compassion'],
  },
  {
    category: 'Gratitude & Wonder',
    title: 'Three Quiet Micro-Miracles',
    promptText: 'Name three tiny, ordinary things from today that were quietly miraculous (a warm cup, a breeze, a resolved message, an unexpected kind word). Why did they matter?',
    estimatedMinutes: 4,
    tags: ['Gratitude', 'Mindfulness'],
  },
  {
    category: 'Life Trajectory',
    title: 'Letter from Your Future Self',
    promptText: 'Imagine yourself 5 years from now, healthy, peaceful, and fulfilled. What gentle advice or reassurance does that future self whisper to you about the challenge you are facing today?',
    estimatedMinutes: 8,
    tags: ['Dreams & Vision', 'Self-Compassion'],
  },
];
