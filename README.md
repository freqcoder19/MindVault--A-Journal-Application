# ✨ MindVault — Personal Gemini Journal

> **Privacy-First AI Journaling & Personal Reflection Platform**  
> Built for the **Google Cloud Gen AI Academy APAC Ideathon**

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/)
[![Cloud Run](https://img.shields.io/badge/Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Firestore](https://img.shields.io/badge/Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/docs/firestore)

---

## 📖 Overview

**MindVault** is a privacy-first personal AI journal that connects private journaling with **Gemini-powered conversations, reflections, recurring themes, monthly insights, memories, and personal goals.**

The core experience follows:

### **Write → Talk → Understand**

Every protected operation is tied to the authenticated **Firebase UID**, creating a strict boundary between users and their personal data.

---

## 🌟 Key Features

### 📝 Intelligent Journaling
- Rich-text journal editor
- Mood and tag tracking
- Private image memories
- User-controlled AI reflections

### 🤖 Gemini Conversations
- Multi-turn Gemini conversations
- Context-aware journaling discussions
- Entry-level AI reflections
- Natural personal guidance

### 📊 Personal Understanding
- Mood trends
- Recurring themes
- Monthly reflections
- Positive moments and challenges
- Personal observations and carry-forward insights

### 🎯 Personal Goals
- Create, edit and delete goals
- Complete and reopen goals
- Optional target dates
- Gemini can reference relevant goals during conversations

---

Security controls include:

Firebase ID-token verification on the server
UID-based authorization
Firestore user isolation
Firebase Storage user isolation
Server-side input validation
Rate limiting
No client-trusted authorization
No hardcoded credentials
Google Cloud IAM
Application Default Credentials (ADC)
🤖 Gemini & Google Cloud

MindVault uses Gemini 2.5 Flash for conversations, reflections, themes, and monthly insights.

The current Cloud Run deployment uses:

Cloud Run → Application Default Credentials (ADC) → IAM → Vertex AI → Gemini

The application also supports a Google Cloud Secret Manager-based Gemini API-key authentication mode, where the secret is retrieved server-side and never exposed to the client.

Google Cloud Services
Cloud Run — application hosting
Vertex AI — Gemini inference
Cloud Firestore — private journal and application data
Firebase Storage — private image memories
Firebase Authentication — user identity
Google Cloud Secret Manager — secure API-key authentication mode
IAM — server-side access control
🧠 Google AI Studio Security Constitution

MindVault was developed using Google AI Studio Custom Instructions as a security-first development constitution.

The instructions established requirements for:

Threat modeling
Secure coding
Authentication and authorization
Firebase UID isolation
Firestore and Storage security
Secret management
Input validation
Rate limiting
Credential protection
Secure AI integration

These directives were carried throughout development to keep security boundaries consistent.

🚀 Deployment

MindVault is deployed on Google Cloud Run.

Live Application:
https://mindvault-824200433696.asia-southeast1.run.app/

Region: asia-southeast1

Service: mindvault

Challenge Label: dev-tutorial=cloud-run-ai-challenge

🛠️ Technology Stack
Layer	Technology
Frontend	React + TypeScript
Build	Vite
Backend	Node.js + Express
Authentication	Firebase Authentication
Database	Cloud Firestore
Storage	Firebase Cloud Storage
AI	Gemini 2.5 Flash
AI Platform	Vertex AI
Authentication	ADC + IAM
Secret Management	Google Cloud Secret Manager
Hosting	Google Cloud Run
🔒 Data Isolation

All personal data is scoped to the authenticated Firebase UID.

users/{uid}/entries
users/{uid}/conversations
users/{uid}/goals
users/{uid}/settings
users/{uid}/security_audit_logs

Private images use:

users/{uid}/entries/{entryId}/images/{imageId}

Firestore and Storage Security Rules enforce the same ownership boundary.

Users cannot access another user's private journal data.

✨ Original Enhancements

MindVault extends the base Personal Gemini Journal with:

🎨 Rich-text journaling
🖼️ Private image memories
🧠 Recurring theme discovery
📅 Monthly AI reflections
😊 Mood trends
🎯 Personal goals
💬 User-controlled Gemini reflections
🔐 Privacy-first UID isolation

These features transform the basic journal into a personal reflection and understanding platform.

🧪 Validation

The application was validated for:

Firebase authentication
Server-side ID-token verification
Unauthorized request rejection
UID-based data isolation
Firestore security rules
Storage security rules
Gemini conversations
Input validation
Rate limiting
Production build
Cloud Run deployment
Secret Manager configuration
📦 Local Setup
Install
npm install
Configure

Copy the example configuration:

cp .env.example .env

Use your own Firebase and Google Cloud configuration.

Never commit real API keys, service-account credentials, or .env files.

Run
npm run dev
Build
npm run build
Start Production Build
npm start
📁 Repository Security

Sensitive credentials are intentionally excluded from the repository.

.env
.env.local
service-account*.json
*.pem
*.key
real API keys
private credentials

Example configuration files are provided so developers can configure their own Firebase and Google Cloud projects.

🎯 Project Vision

Your AI should understand your personal journey without making your private life visible to the people operating the system.

MindVault combines personal journaling, conversational AI, memories, goals, and reflection while maintaining strong security and user-data isolation from the beginning.



## 🔐 Security Architecture

MindVault treats security as an **architectural requirement**, not simply a UI feature.

```text
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


