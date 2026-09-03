MindVault 🧠🔐
Your thoughts. Your space. Your understanding.


MindVault is a privacy-first personal AI journal built with Firebase, Google Cloud, Vertex AI, and Gemini.

It combines private journaling with conversational AI and long-term reflection, allowing users to write about their experiences, talk naturally with Gemini, and understand their personal journey over time.

Unlike a traditional journal that only stores information, MindVault helps users reflect on their experiences while keeping their personal data protected through strict user-level isolation.

Privacy by design: Even the MindVault administrator cannot read users' private journal entries, Gemini conversations, goals, memories, or personal reflections. The administrator can access only aggregate operational telemetry.

✨ Core Experience

MindVault is built around a simple flow:

WRITE → TALK → UNDERSTAND
✍️ Write

Create private journal entries with:

Journal text
Mood
Tags
Date/time
Up to 2 private images/memories
💬 Talk

Have a natural, multi-turn conversation with Gemini, using the user's permitted journal context.

🧠 Understand

Reflect on individual entries, review recurring themes, explore monthly reflections, and understand how thoughts and emotions change over time.

🚀 Features
📝 Personal Journal

Users can:

Create journal entries
Edit entries
Delete entries
View their own entries
Add mood information
Add tags
Attach up to 2 private images

Each journal entry can also be sent to Gemini through "Reflect with Gemini".

The user does not need to manually copy their journal entry into an AI chatbot.

🤖 Gemini Companion

Gemini is integrated as a conversational companion rather than a separate analytics tool.

Users can naturally say things like:

"I feel down today."

"I'm really happy about how things went today."

"I keep getting distracted."

"I think I'm finally making progress."

Gemini responds contextually using the user's permitted journal context.

The conversation supports multi-turn interaction, making the experience feel more like a continuous conversation than isolated AI prompts.

🔎 Reflect with Gemini

Users can explicitly ask Gemini to reflect on an individual journal entry.

Journal Entry
      ↓
Reflect with Gemini
      ↓
Secure Backend
      ↓
Vertex AI / Gemini
      ↓
Personal Reflection

The backend retrieves the selected entry using the authenticated user's identity before sending the required context for AI processing.

Private images attached to entries are not automatically sent to Gemini.

📊 Personal Summary

The Summary section helps users understand their journal rather than simply displaying statistics.

It can provide:

Current Snapshot
Number of entries
Active days
Average mood
Mood trend
Recurring Themes

Examples:

Creativity
Learning
Mindfulness
Relationships
Work
Uncertainty
Monthly Reflection

Users can select a month and ask Gemini to:

Reflect on this month

The reflection can include:

Your month in a few words
Positive moments
Challenges & downs
What you learned
Something worth noticing
Carrying forward

The reflection is designed to be grounded in the user's actual journal content rather than generating unsupported events or emotions.

🧠 Recurring Themes

MindVault can identify recurring themes within a user's journal.

However, this functionality is intentionally integrated into the experience rather than presented as a separate "pattern detector."

For example:

Something worth noticing

You've returned to this topic several times this month.

This keeps the experience focused on gentle self-reflection rather than algorithmic surveillance.

🖼️ Private Memories

Users can attach up to 2 private images to a journal entry.

These memories can appear within the user's personal journal/summary experience.

Images remain private and are not automatically sent to Gemini.

🎯 Personal Goals

MindVault includes a simple personal Goals section.

Users can:

Create goals
Edit goals
Complete goals
Reopen goals
Delete goals
Add optional target dates

Example:

GOALS

☐ Finish MindVault MVP
☑ Complete Firebase security
☐ Publish project blog

Goals are intentionally lightweight and are not designed to become a project-management system.

Gemini can reference relevant goals when they naturally help the conversation.

🔐 Privacy-First Architecture

Privacy is one of the core design principles of MindVault.

The system follows a zero-trust style request flow:

Firebase Authentication
          ↓
Firebase ID Token
          ↓
Backend Token Verification
          ↓
Verified User UID
          ↓
User-Isolated Firestore / Storage
          ↓
Secure Gemini Backend
          ↓
Vertex AI

The client does not determine its own identity or authorization.

The backend derives the user identity from the verified Firebase ID token.

🛡️ User Data Isolation

Private data is isolated by authenticated user identity.

Conceptually:

/users/{userId}/...

Firestore and Firebase Storage access is protected using authenticated user identity and security rules.

This prevents one user from accessing another user's:

Journal entries
Images
Memories
Goals
Personal reflections
👨‍💻 Privacy-Limited Administration

MindVault has a single designated administrator.

The administrator is authorized through:

Firebase Authentication
        ↓
Verified ID Token
        ↓
Verified email
        +
admin: true custom claim
        ↓
Admin Dashboard

There is:

❌ No admin signup
❌ No client-controlled admin flag
❌ No localStorage-based authorization
❌ No query-parameter authorization
❌ No request-body role authorization

Authorization is enforced on the backend.

📈 Admin Dashboard

The Admin Dashboard is designed for operational monitoring only.

The administrator can access aggregate telemetry such as:

Total users
Total journal entries
Gemini request counts
Rate-limit statistics
System health
Backend error counts
Model/service status
Aggregate storage metrics
Safe performance metrics
Administrators cannot access:
❌ Journal content
❌ Journal titles
❌ Gemini prompts
❌ Gemini responses
❌ Gemini conversations
❌ Private images
❌ Memories
❌ Goals
❌ Monthly summaries
❌ Individual sentiment
❌ Individual emotional analysis
❌ Individual recurring patterns

The backend does not retrieve private data and simply hide it from the dashboard.

Admin telemetry endpoints are designed to return aggregate information only.

Even the person operating MindVault cannot read your journal.

☁️ Firebase & Google Cloud

MindVault combines Firebase services with Google Cloud AI infrastructure.

Firebase Authentication

Used for:

User registration/sign-in
Identity management
Authentication
Secure user sessions
Cloud Firestore

Used for:

Journal entries
User-specific data
Goals
Reflection-related information

Firestore security rules provide user-level data isolation.

Firebase Storage

Used for private journal images/memories with user-isolated access.

Google Cloud Run

Used as the secure backend/runtime layer for the application.

Cloud Run handles protected backend operations instead of exposing sensitive AI credentials to the browser.

Vertex AI

Gemini inference is performed through Google Cloud Vertex AI.

The project currently uses:

gemini-2.5-flash

with Google Cloud authentication/IAM rather than exposing a Gemini API key in the client.

Secret Manager

Google Cloud Secret Manager is used for secure secret management where required.

🤖 Gemini Architecture

MindVault does not expose a Gemini API key in the browser.

Instead:

User
 ↓
MindVault Frontend
 ↓
Authenticated Backend
 ↓
Vertex AI
 ↓
Gemini
 ↓
Response

This keeps AI credentials and sensitive backend operations away from the client.

Gemini requests are intentionally triggered when the user asks for AI functionality, such as:

Gemini conversation
Reflect with Gemini
Reflect on this month

The application avoids unnecessary Gemini calls when:

Saving a journal
Uploading an image
Creating a goal
Completing a goal
Opening the Summary
Opening the application

This helps control AI usage and cost.

🛡️ App Check

App Check is optional and does not block the application when App Check environment variables are absent.

Optional App Check configuration does not replace or weaken:

Firebase Authentication
ID-token verification
Firestore isolation
Storage isolation
Backend authorization
Rate limiting
Vertex AI security
Secret management

🏗️ Architecture Overview
                         ┌──────────────────┐
                         │      User        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ MindVault Web App│
                         └────────┬─────────┘
                                  │
                         Firebase Authentication
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    Cloud Run     │
                         │ Secure Backend   │
                         └───────┬──────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 │               │                │
                 ▼               ▼                ▼
          ┌────────────┐  ┌────────────┐  ┌─────────────┐
          │ Firestore  │  │ Vertex AI  │  │   Storage   │
          │            │  │  Gemini    │  │   Images    │
          └────────────┘  └────────────┘  └─────────────┘
                 │
                 ▼
          Firestore Security
               Rules

               
🎨 Product Design

MindVault is designed to feel like a private personal space, not an enterprise dashboard.

Design principles
Calm
Warm
Minimal
Modern
Trustworthy
Personal

The interface uses:

Warm neutral backgrounds
White/off-white surfaces
Deep charcoal surfaces in dark mode
Muted sage/teal accents
Rounded cards
Subtle borders
Generous spacing
Restrained animations

The goal is to make users feel:

"This is my private space."

🧭 Application Navigation


The normal user experience is centered around:

Journal | Gemini | Summary | Goals | Profile

Each area has a clear purpose:

Section	Purpose
Journal	Write and preserve personal experiences
Gemini	Have a natural AI conversation
Summary	Understand journal history and monthly reflections
Goals	Track personal goals
Profile	Manage the user's account

🔒 Security Philosophy

MindVault follows a Privacy by Design approach.

The application is built around several principles:

Authenticate every user
Derive identity from verified tokens
Never trust client-provided identity
Isolate user data
Protect private images
Keep AI processing server-side
Never expose API credentials
Enforce admin authorization server-side
Expose only aggregate telemetry to administrators
Minimize unnecessary AI requests

🧰 Technology Stack


Frontend

Web application
Modern responsive UI
Authentication & Data
Firebase Authentication
Cloud Firestore
Firebase Storage
AI
Google Gemini
Vertex AI
gemini-2.5-flash

Cloud

Google Cloud
Cloud Run
IAM
Secret Manager
Security
Firebase ID tokens
Firestore Security Rules
Storage security rules
Server-side authorization
Firebase custom claims
Rate limiting

🎯 Project Vision


MindVault is designed around a simple progression:

"What happened?"
       ↓
"How did I feel?"
       ↓
"What keeps showing up?"
       ↓
"What did I learn?"
       ↓
"What do I want to do next?"

Instead of treating a journal as a database of old entries, MindVault turns it into a private, conversational reflection space.

🏆 Why MindVault?

Traditional journals:

Store your thoughts.

Generic AI chatbots:

Talk about your thoughts.

MindVault combines both:

Store → Talk → Understand

while keeping privacy at the center.

Core differentiators
🔐 Privacy-first AI journaling
🤖 Gemini conversational companion
🧠 Journal-specific AI reflection
📅 Long-term monthly reflection
🔎 Recurring themes integrated naturally
🖼️ Private visual memories
🎯 Personal goals
☁️ Google Cloud architecture
🛡️ User-level data isolation
👨‍💻 Privacy-limited administration
