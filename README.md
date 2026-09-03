# MindVault

**Your thoughts. Your space. Your understanding.**

MindVault is a privacy-first personal AI journal that combines a private journal, a conversational AI companion (Gemini), and long-term reflection tools — while guaranteeing that no one, not even the system administrator, can read your private content.

```
WRITE → TALK → UNDERSTAND
```

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Core Experience](#core-experience)
- [Features](#features)
- [Privacy & Security Model](#privacy--security-model)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Navigation](#navigation)
- [Design Philosophy](#design-philosophy)
- [Cost / AI Usage Principles](#cost--ai-usage-principles)
- [What This Project Is Not](#what-this-project-is-not)
- [Roadmap Discipline](#roadmap-discipline)
- [License](#license)

---

## Overview

MindVault is not just another CRUD journal with a chatbot bolted on. It's a private personal space designed around a simple idea: journaling becomes more valuable when it's paired with a conversational AI that understands your context — and when your privacy is never negotiable.

Users can:

- Write private journal entries
- Talk naturally with Gemini
- Reflect on individual entries
- Understand how their thoughts and emotions evolve over time
- Identify recurring themes without a "pattern detector" gimmick
- Review their month through an AI-generated summary
- Maintain simple personal goals
- Receive gentle, context-aware encouragement from Gemini when relevant

The product philosophy is built around a progression:

> "What happened?" → "How did I feel?" → "What keeps showing up?" → "What did I learn?" → "What do I want to do next?"

## The Problem

Traditional digital journals mostly just **store** information. Generic AI chatbots can discuss your thoughts, but they lack a persistent, structured personal context. MindVault combines both:

**Private Journal + Conversational AI + Long-Term Personal Reflection**

The AI is designed to feel like a thoughtful companion to your journal — not a generic chatbot bolted onto an app.

## Core Experience

### Write
Create private journal entries with mood, tags, and up to 2 private images ("memories"). Any entry can be sent for **"Reflect with Gemini"** — the backend securely retrieves the authenticated user's entry so nothing has to be copy-pasted.

### Talk
Have a natural, multi-turn conversation with Gemini. There is no separate "AI Reflections" area — you simply talk to Gemini, and it responds using your permitted journal context. Gemini does not force analysis, patterns, or motivational messaging into every reply.

### Understand
MindVault helps you understand your journal through:

- Individual entry reflections
- Recurring themes that surface naturally (never as a standalone "Thought Loop" or "Pattern Detector" feature)
- **Monthly Reflection** — select a month and ask Gemini to reflect on it, producing:
  1. Your month in a few words
  2. Positive moments
  3. Challenges & downs
  4. What you learned
  5. Something worth noticing
  6. Carrying forward

All summaries are grounded strictly in actual journal content — Gemini does not invent events, achievements, emotions, or patterns.

## Features

| Area | Description |
|---|---|
| **Journal** | Create, edit, delete, and view private entries. Add mood, tags, and up to 2 private images. |
| **Gemini Companion** | Multi-turn conversational AI, contextually aware of your journal and goals. |
| **Summary** | Current snapshot (entries, active days, mood/trend), recurring themes, monthly reflection, and a small private "Memories" collection. |
| **Goals** | Lightweight personal goals — create, edit, complete, reopen, delete, optional target date. Not a project management tool. |
| **Profile** | Account and app-level settings. |
| **Admin Dashboard** | Aggregate, anonymized operational telemetry only — no private content, ever. |

Recurring themes and patterns are surfaced gently inside **Summary** or during **Gemini** conversations (e.g. *"Something worth noticing — you've returned to this topic several times this month"*) — never as a standalone, algorithmic-feeling feature.

## Privacy & Security Model

MindVault's strongest differentiator is **privacy by design**:

> "Even the person operating MindVault cannot read your journal."

### Admin Model

- Exactly **one** designated administrator account, authorized via Firebase Authentication with a server-side custom claim (`admin: true`).
- No admin signup, no role selector, no client-controlled admin flag, no localStorage/query-param/request-body based authorization.
- The frontend may hide admin UI from normal users, but **authorization is always enforced server-side.**

### What the Administrator Can See

Aggregate, anonymized operational telemetry only:

- Total users, total journal entries, total Gemini requests
- Request counts and rate-limit statistics
- System health, backend error counts, model/service status
- Aggregate storage metrics and safe performance metrics

### What the Administrator Can Never See

- Journal content or titles
- Gemini chats, prompts, or responses
- Private images / memories
- Goals
- Monthly summaries
- Individual sentiment, emotional analysis, or recurring patterns
- Any other private user information

Admin telemetry endpoints return aggregate data only — the backend never retrieves private data and merely hides it in the UI.

### Zero-Trust Request Flow

```
Firebase Authentication
        ↓
Firebase ID Token
        ↓
Backend verifies token
        ↓
Verified UID
        ↓
User-isolated Firestore / Storage
        ↓
Secure Gemini backend
        ↓
Vertex AI
```

- The client never determines its own identity or authorization.
- The backend derives the UID exclusively from a verified Firebase ID token.
- Firestore and Firebase Storage are isolated per authenticated user.
- Private images are never publicly accessible.
- Rate limiting remains enabled at all times.

## Architecture

**Google Cloud Project:** `mindvault-507114`

- **Gemini inference:** Google Cloud Vertex AI, using Application Default Credentials / IAM — currently `gemini-2.5-flash`
- **Secrets:** Google Cloud Secret Manager (no hardcoded API keys, no browser-side Gemini API key)
- **Auth:** Firebase Authentication with server-side ID token verification
- **Data:** Firestore and Firebase Storage, both UID-isolated

### App Check

App Check is **optional**. The app does not require any of the following to function:

```
VITE_RECAPTCHA_SITE_KEY
VITE_APPCHECK_DEBUG_TOKENS
MINDVAULT_APPCHECK_ENFORCEMENT
APPCHECK_DEBUG_TOKENS
```

Its absence never weakens Firebase Authentication, ID-token verification, Firestore/Storage isolation, backend authorization, rate limiting, Vertex AI security, or Secret Manager usage.

## Tech Stack

- **Frontend:** Web client (Firebase-integrated)
- **Backend:** Server-side token verification and business logic
- **Database:** Firestore (per-user isolation)
- **Storage:** Firebase Storage (per-user isolation)
- **AI:** Gemini via Vertex AI
- **Secrets:** Google Cloud Secret Manager
- **Auth:** Firebase Authentication + custom claims

## Navigation

Unauthenticated users land on a polished welcome page (no guest mode, no anonymous journal, no demo login, no skip-login) introducing **Write / Talk / Understand** with a single primary call to action: **Sign In**.

Authenticated users see:

```
Journal | Gemini | Summary | Goals | Profile
```

There are intentionally **no** separate destinations for "Throughput," "Thought Loop," "Recurring Patterns," "AI Reflections," or "Security Architecture." That functionality is folded naturally into Journal, Gemini, Summary, and Goals.

## Design Philosophy

MindVault should feel like a **premium personal journal** — calm, private, warm, minimal, modern, trustworthy, personal.

**Embrace:** warm neutral backgrounds, white/off-white surfaces, deep charcoal dark mode, muted sage/teal accents, subtle borders, rounded cards, elegant typography, generous spacing, soft shadows, restrained animation.

**Avoid:** bright orange as a primary color, random multi-color cards, old-style black dashboard cards, excessive analytics, technical security dashboards, unnecessary buttons, feature overload.

The app should make users feel *"this is my private space,"* not *"I'm using an enterprise monitoring system."*

## Cost / AI Usage Principles

MindVault avoids unnecessary Gemini calls. Gemini is **not** automatically invoked when:

- Saving a journal entry
- Uploading an image
- Creating, completing, reopening, or deleting a goal
- Opening Summary
- Opening the application

Gemini runs only on explicit user intent — starting a Gemini conversation, choosing "Reflect with Gemini," or requesting "Reflect on this month." Monthly summaries are cached after generation to avoid redundant calls.

## What This Project Is Not

MindVault is deliberately **not**:

- Another generic AI chatbot
- Another basic CRUD journal app
- A productivity/task-management dashboard (that's not what Goals is for)
- A project-management tool
- A complicated AI control panel
- An analytics-heavy admin dashboard

Removed/rejected feature patterns that should not return:
- Standalone "Explore Recurring Patterns" page or button
- "Discuss" button on journal entries
- "Unlocked status" UI
- Standalone "Throughput Detector," "Thought Loop," "Recurring Patterns," or "AI Reflections" pages

