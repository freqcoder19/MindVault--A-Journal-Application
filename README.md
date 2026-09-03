                         ┌───────────────┐
                         │     USER      │
                         └───────┬───────┘
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │   MINDVAULT WEB APP  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Firebase Auth       │
                    └──────────┬──────────┘
                               │
                         ID Token
                               │
                               ▼
                    ┌──────────────────────┐
                    │     CLOUD RUN        │
                    │   Secure Backend     │
                    └───────┬───────┬──────┘
                            │       │
              ┌─────────────┘       └──────────────┐
              ▼                                    ▼
     ┌─────────────────┐                  ┌─────────────────┐
     │  CLOUD FIRESTORE│                  │    VERTEX AI    │
     │                 │                  │     GEMINI      │
     │ Private User    │                  │ Gemini 2.5      │
     │ Data            │                  │ Flash           │
     └────────┬────────┘                  └─────────────────┘
              │
              ▼
     ┌─────────────────┐
     │ Firebase Storage │
     │ Private Images   │
     └────────┬────────┘
              │
              ▼
     🔒 Security Rules
     User Data Isolation
