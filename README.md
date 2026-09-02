# Personal Gemini Journal

> **Enterprise-Grade AI Personal Journal & Strategic Reflection System**  
> Powered by Google Gemini 2.5, Cloud Firestore isolated persistence, and Client-Side Zero-Knowledge AES-GCM 256-bit Vault Encryption.

---

## 1. Architectural Overview

The application is structured as a full-stack, secure reflection platform designed with defense-in-depth security principles:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ React 19 + Tailwind CSS + Motion Layout                          │  │
│  │ ─────────────────────────────────────────────────────────────── │  │
│  │ • Persona-Driven Multi-Turn Chat & Live Synthesis                │  │
│  │ • Zero-Knowledge Vault Encryption (AES-GCM 256-bit / PBKDF2)     │  │
│  │ • Direct-to-Firestore isolated user sync (/users/{uid}/...)      │  │
│  │ • Vector-styled PDF Export & Document Generation                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
           ▼ (Auth & Direct Doc Sync)                        ▼ (AI Workloads)
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│       FIREBASE FIRESTORE & AUTH      │          │       EXPRESS BACKEND PROXY          │
│ • Deterministic Path:                │          │ • Port 3000 / Node ESM Runtime       │
│   /users/{userId}/entries/{id}       │          │ • Lazy Google GenAI SDK init         │
│ • Strict Security Rules (Owner-Only) │          │ • Safe prompt framing & rate-limits  │
│ • Default-Deny Fallback Root Match   │          │ • Zero browser key exposure          │
└──────────────────────────────────────┘          └──────────────────┬───────────────────┘
                                                                     │
                                                                     ▼
                                                  ┌──────────────────────────────────────┐
                                                  │       GOOGLE GEMINI API (v2.5)       │
                                                  │ • gemini-2.5-flash AI engine         │
                                                  │ • Key provisioned via Secret Manager │
                                                  └──────────────────────────────────────┘
```

---

## 2. Key Capabilities & Security Directives

### 🛡️ Enterprise Security Model
- **Zero Browser Key Exposure**: All interactions with `@google/genai` are strictly mediated by backend Express routes (`/api/gemini/chat`, `/api/gemini/synthesize`, `/api/gemini/title`).
- **Deterministic Multi-Tenant Isolation**: All user reflections, chats, summaries, and action plans are scoped to `/users/{userId}/...` paths in Cloud Firestore.
- **Zero-Knowledge Client-Side Vault**: Users can encrypt sensitive entries using PBKDF2 (100,000 SHA-256 iterations) + AES-GCM 256-bit with client-generated random IVs and salts before syncing to Firestore.
- **Anti-Prompt-Injection Delimiters**: Strict separation of system prompts and user inputs using structural boundary frames (`---BEGIN USER CONVERSATION---`).

### 🧠 Adaptive AI Reflection Engine
- **Configurable Personas**:
  - **Reflective Explorer (Socratic)**: Unpacks underlying motivations with insightful open-ended questions.
  - **Executive Coach**: Sharp, results-oriented, prioritizing actionable steps and KPI alignment.
  - **Empathetic Listener**: Compassionate, psychologically safe validation and gentle reframing.
  - **First-Principles Scientist**: Deconstructs assumptions down to fundamental truths.
  - **Mindful Stoic**: Distinguishes control spheres, encouraging resilience and perspective.
  - **Devil's Advocate**: Constructively challenges biases, cognitive blind spots, and assumptions.
- **Real-Time Synthesis View**: Automated extraction of core themes, sentiment trajectory, key insights, and actionable checkboxes.
- **Prompt Sparks Library**: Curated reflection sparks across deep reflection, decision architecture, emotional balance, and creative ideation.

---

## 3. Secret Manager & Environment Configuration

All sensitive secrets are managed via Google Cloud Secret Manager or container environment variables at runtime.

### Required Environment Variables

Create or configure `.env` based on `.env.example`:

```bash
# GEMINI_API_KEY: Provisioned via Google Cloud Secret Manager at runtime.
GEMINI_API_KEY="your-gemini-api-key"

# APP_URL: The base URL where the service is deployed (Cloud Run URL).
APP_URL="https://your-service-url.run.app"

# PORT: Standard server port (default: 3000)
PORT=3000
```

### Google Cloud Secret Manager Integration

When deploying to Google Cloud Run, bind the `GEMINI_API_KEY` directly from Secret Manager:

```bash
# 1. Create the secret in Google Cloud Secret Manager
gcloud secrets create GEMINI_API_KEY \
  --replication-policy="automatic" \
  --data-file="-" <<< "AIzaSy..."

# 2. Grant Cloud Run Service Account permission to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Firestore Security Rules

The application uses deterministic user scoping to enforce zero cross-tenant access.

### `firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Default-deny root rule
    match /{document=**} {
      allow read, write: if false;
    }
    
    // User profile document rule
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User journal entries subcollection
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User audit logs / metadata
      match /audit_logs/{logId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Deploying Firestore Rules

Using the Firebase CLI:

```bash
# Log in and deploy rules
firebase use --add <YOUR_PROJECT_ID>
firebase deploy --only firestore:rules
```

---

## 5. Local Development Setup

### Prerequisites
- Node.js `>= 20.0.0`
- npm `>= 10.0.0` or bun `>= 1.1.0`

### Installation & Execution

```bash
# 1. Install project dependencies
npm install

# 2. Create local environment configuration
cp .env.example .env
# Fill in your GEMINI_API_KEY in .env

# 3. Start development server (boots Express server with Vite middleware on port 3000)
npm run dev

# 4. Open in browser
open http://localhost:3000
```

---

## 6. Production Build & Cloud Run Deployment

### Local Build Verification

```bash
# Run TypeScript type-checking and linter
npm run lint

# Compile Vite frontend bundle and bundle server with esbuild
npm run build

# Test production server locally
npm start
```

### Deploying to Google Cloud Run

You can deploy the containerized application to Google Cloud Run using the `gcloud` CLI:

```bash
# 1. Set your Google Cloud Project ID
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-east1"
export SERVICE_NAME="personal-gemini-journal"

gcloud config set project $PROJECT_ID

# 2. Build and deploy directly with Google Cloud Build & Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"
```

---

## 7. Project Structure

```
├── .env.example                 # Template for required environment variables
├── AGENTS.md                    # Enterprise Security Constitution & STRIDE directives
├── GEMINI.md                    # Gemini SDK proxy & server-side guidelines
├── firestore.rules              # Production Firestore security rules
├── metadata.json                # AI Studio application metadata & frame permissions
├── package.json                 # Project dependencies and build scripts
├── server.ts                    # Express backend with lazy Gemini SDK initialization
├── src/
│   ├── App.tsx                  # Main orchestration component & state controller
│   ├── components/
│   │   ├── AuthModal.tsx        # Firebase Authentication modal (Email & Google Auth)
│   │   ├── ChatWorkspace.tsx    # Multi-turn conversation workspace with streaming
│   │   ├── JournalSidebar.tsx   # History browser, search, tags, & favorites
│   │   ├── Navbar.tsx           # Global header, theme toggles, & persona selector
│   │   ├── PromptSparksModal.tsx# Curated reflection prompts library
│   │   ├── SecurityConsoleModal.tsx # STRIDE compliance & encryption audit logs
│   │   ├── SynthesisView.tsx    # Automated AI insights, themes, & action plan
│   │   ├── ThemeModal.tsx       # Theme switcher (Deep Stone & Warm Editorial Paper)
│   │   └── VaultPassphraseModal.tsx # Client-side AES-GCM encryption controller
│   ├── lib/
│   │   ├── cryptoVault.ts       # Web Crypto API (AES-GCM 256 / PBKDF2) engine
│   │   ├── firebase.ts          # Firebase SDK initialization & Firestore persistence
│   │   ├── pdfExport.ts         # Printable journal export generator
│   │   └── sparksData.ts        # Structured reflection prompts database
│   ├── types.ts                 # Core TypeScript definitions & schemas
│   └── index.css                # Tailwind CSS styling and theme variable mappings
└── vite.config.ts               # Vite configuration with Tailwind CSS plugin
```

---

## 8. License

Licensed under the Apache License, Version 2.0. See source files for details.
