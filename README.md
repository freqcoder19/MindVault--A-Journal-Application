# ✨ MindVault — Personal Gemini Journal

> **Privacy-First AI Journaling & Personal Reflection Platform**  
> Built for the **Google Cloud Gen AI Academy APAC Ideathon**

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/) [![Cloud Run](https://img.shields.io/badge/Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run) [![Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/) [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/) [![Firestore](https://img.shields.io/badge/Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/docs/firestore)

---

## 📖 Overview

**MindVault** is a privacy-first personal AI journal that connects private journaling with **Gemini-powered conversations, reflections, recurring themes, monthly insights, memories, and personal goals**.

The core experience follows:

**Write → Talk → Understand**

Every protected operation is tied to the authenticated Firebase UID, creating a strict boundary between users and their personal data.

---
🌟 Key Features
📝 Intelligent Journaling
Rich-text journal editor
Mood and tag tracking
Private image memories
User-controlled AI reflections
🤖 Gemini Conversations
Multi-turn Gemini chat
Context-aware journal discussions
Entry-level AI reflection
Natural personal guidance
📊 Personal Understanding
Mood trends
Recurring themes
Monthly reflections
Positive moments and challenges
Personal observations and carry-forward insights
🎯 Personal Goals
Create, edit and delete goals
Complete and reopen goals
Optional target dates
Gemini can reference relevant goals during conversations
🔐 Security Architecture

MindVault treats security as an architectural requirement rather than a UI feature.

Firebase Authentication
          ↓
Firebase ID Token
          ↓
Server-Side Verification
          ↓
Trusted Firebase UID
          ↓
UID-Based Authorization
          ↓
Firestore / Storage Isolation
Security Controls
Firebase ID token verification on the server
No client-trusted UID authorization
Firestore UID-based isolation
Storage UID-based isolation
Server-side input validation
Per-user API rate limiting
No hardcoded credentials
Google Cloud IAM authorization
Application Default Credentials for Vertex AI
🧠 Gemini Authentication & Intelligence Architecture

MindVault supports two production-ready server-side Gemini authentication modes configured via `MINDVAULT_GEMINI_AUTH_MODE`:

### Mode 1: `VERTEX_AI_ADC` (Default Production Mode)
Gemini is accessed directly through Google Cloud Vertex AI using Application Default Credentials (ADC) and IAM:

```
Cloud Run
    │
    ▼
Application Default Credentials (ADC)
    │
    ▼
Google Cloud IAM (`roles/aiplatform.user`)
    │
    ▼
Vertex AI
    │
    ▼
Gemini 2.5 Flash
```

- **Zero-Key Architecture**: No API keys are created, managed, or configured.
- **Enterprise IAM Identity**: The Cloud Run runtime service account authenticates seamlessly via ADC.
- **Default Setting**: The application defaults to `MINDVAULT_GEMINI_AUTH_MODE=VERTEX_AI_ADC`.

### Mode 2: `GEMINI_API_KEY_SECRET` (Google Cloud Secret Manager Mode)
For environments where Gemini Developer API keys are utilized, MindVault retrieves the key securely on the backend from Google Cloud Secret Manager using `@google-cloud/secret-manager`:

```
Cloud Run
    │
    ▼
Application Default Credentials (ADC)
    │
    ▼
Google Cloud IAM (`roles/secretmanager.secretAccessor`)
    │
    ▼
Secret Manager (`projects/${PROJECT_ID}/secrets/${GEMINI_API_KEY_SECRET}/versions/latest`)
    │
    ▼
Server-Side Memory (Ephemeral, never logged or exposed)
    │
    ▼
Gemini 2.5 Flash
```

- **Configurable Secret Name**: Configure the secret resource name via `GEMINI_API_KEY_SECRET` (defaults to `GEMINI_API_KEY`).
- **Least-Privilege Access**: The Cloud Run service account requires only `roles/secretmanager.secretAccessor` on the designated secret.
- **Zero Client Exposure**: The secret is retrieved strictly on the trusted Express server — **never** committed to GitHub, **never** sent to frontend code or browser responses, and **never** printed to logs.
- **Safe Fallback**: If the secret is unavailable or permissions are restricted, the backend fails safely with graceful diagnostic logging and can optionally fall back to Vertex AI ADC.

User journal content is only used for AI operations explicitly initiated through the application.

🗄️ Data Isolation

Firestore follows a user-scoped hierarchy:

/users/{uid}/entries/{entryId}

/users/{uid}/conversations/{conversationId}

/users/{uid}/conversations/{conversationId}/messages/{messageId}

/users/{uid}/settings/preferences

Private memories follow the same principle:

/users/{uid}/entries/{entryId}/images/{imageId}

This ensures that application data is partitioned around the authenticated user's identity.

☁️ Google Cloud Stack
Service	Purpose
Firebase Authentication	Secure user identity
Cloud Firestore	Private journal and application data
Cloud Storage	Private journal memories
Cloud Run	Production application hosting
Vertex AI	Gemini inference
Gemini 2.5 Flash	Conversations and reflections
Secret Manager	Secure secret management
IAM + ADC	Cloud authentication and authorization
🚀 Quickstart
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd MindVault--A-Journal-Application

npm install

npm run dev

Production build:

npm run build
npm start
☁️ Cloud Run Deployment

**Mode 1: Vertex AI ADC (Default Production)**
```bash
gcloud run deploy mindvault \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account=<CLOUD_RUN_SERVICE_ACCOUNT> \
  --set-env-vars="MINDVAULT_GEMINI_AUTH_MODE=VERTEX_AI_ADC,GOOGLE_CLOUD_LOCATION=global,NODE_ENV=production"
```

**Mode 2: Secret Manager API Key**
```bash
gcloud run deploy mindvault \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account=<CLOUD_RUN_SERVICE_ACCOUNT> \
  --set-env-vars="MINDVAULT_GEMINI_AUTH_MODE=GEMINI_API_KEY_SECRET,GEMINI_API_KEY_SECRET=GEMINI_API_KEY,GOOGLE_CLOUD_LOCATION=global,NODE_ENV=production"
```
💡 Original Enhancement

MindVault extends a traditional journal into a continuous personal reflection system:

Journal Entry
     ↓
Gemini Conversation
     ↓
AI Reflection
     ↓
Recurring Themes
     ↓
Monthly Understanding
     ↓
Personal Goals & Memories

The system does not automatically invoke Gemini when a journal is saved. AI interaction remains user-controlled.

🛡️ Security-First Development

The project began with Google AI Studio Custom Instructions configured as a security constitution.

The development rules established:

Threat Modeling
      ↓
Secure Coding
      ↓
Authentication
      ↓
Authorization
      ↓
Database Isolation
      ↓
Secret Management
      ↓
Secure AI Integration

These principles were carried into the application's Firebase, Firestore, Cloud Run and Vertex AI implementation.

🧪 Validation

Security boundaries were tested against:

Valid Token       → Authorized
Missing Token     → 401
Invalid Token     → 401
Forged Token      → 401
Wrong User UID    → Denied

The backend derives authorization from the verified Firebase identity rather than browser-supplied identity fields.

## 🏛️ System Architecture

```text
                         ┌─────────────────────┐
                         │       MindVault     │
                         │  React + TypeScript │
                         └──────────┬──────────┘
                                    │
                         Firebase Authentication
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Cloud Run      │
                         │  Node.js + Express  │
                         ├─────────────────────┤
                         │ ID Token Verification
                         │ UID Authorization   │
                         │ Input Validation    │
                         │ Rate Limiting       │
                         └──────┬──────┬───────┘
                                │      │
                    ┌───────────┘      └────────────┐
                    ▼                               ▼
             ┌────────────┐                  ┌──────────────┐
             │ Firestore  │                  │  Vertex AI   │
             │            │                  │ Gemini 2.5   │
             │ UID-Isolated│                 │    Flash     │
             │ User Data  │                  │ ADC + IAM    │
             └────────────┘                  └──────────────┘
                    │
                    ▼
             ┌────────────┐
             │  Storage   │
             │  Private   │
             │  Memories  │




