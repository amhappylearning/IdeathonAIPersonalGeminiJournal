# Enterprise Security Directives & Production Constitution for AI Studio

> **Document Version:** 1.0.0-PROD  
> **Target Environment:** Google AI Studio / Google Cloud Run / Cloud Firestore / Gemini 2.5 & 3.0  
> **Mandate:** All code, architectures, and automated agent actions generated in this studio MUST adhere strictly to these security directives before any deployment or execution.

---

## 1. Threat Modeling Framework (STRIDE Applied to Generative AI Systems)

| Threat Category | Potential Attack Vector | Production Countermeasure & Directive |
|---|---|---|
| **Spoofing** | Unauthenticated impersonation of users or sessions | Enforce cryptographic Firebase Auth verification (`Authorization: Bearer <ID_TOKEN>`) on all server endpoints. Reject unverified client claims. |
| **Tampering** | Modifying journal entries or unauthorized cross-user modifications | Strict Firestore security rules scoping all operations to `request.auth.uid == userId`. No shared top-level mutable collections. |
| **Repudiation** | Denying sensitive edits or unauthorized access attempts | Structured client and server audit logs tracking timestamp, user UID hash, and operation payload signatures without exposing plain PII. |
| **Information Disclosure** | Secret key leakage, browser DevTools inspection, cross-tenant data leakage | Zero client-side API keys (`process.env.GEMINI_API_KEY` restricted to server-side Express routes). Client-side Vault E2EE encryption support. |
| **Denial of Service** | LLM token bombing, recursive generation loops, payload exhaustion | Server-side request rate limiting, payload byte-size bounds, max output token caps, and timeout guards on all Gemini API calls. |
| **Elevation of Privilege** | Prompt injection inducing role modification or security bypass | Rigid system instructions with explicit delimiter framing (`---BEGIN USER DATA---`) and structural output schemas. |

---

## 2. Secure Key & Secret Management Policy

1. **Zero Hardcoded Secrets**: Under no circumstances may API keys, service account credentials, OAuth client secrets, or encryption keys be committed to source files.
2. **Secret Manager & Server Containment**:
   - `GEMINI_API_KEY` is provisioned via Google Cloud Secret Manager / environment injection at runtime.
   - All interactions with the Gemini SDK (`@google/genai`) MUST be mediated through backend API routes (`/api/*`).
   - Never expose `GEMINI_API_KEY` via `VITE_` prefixed variables or transmit it to the browser.
3. **Graceful Fail-Safe Initialization**:
   - Use lazy initialization for SDK clients.
   - Validate environment variable presence before executing AI workloads, returning sanitized error responses without leaking internal stack traces or configuration dumps.

---

## 3. Multi-Tenant Database Isolation Rules (Firestore)

1. **Deterministic User Scoping**:
   - Every personal journal, reflection, session, and summary MUST be stored under the hierarchical path `/users/{userId}/...`.
   - Never use unstructured, flat collections with simple `createdBy` filter queries as the sole security boundary.
2. **Default-Deny Security Rules**:
   - Root fallback MUST deny all operations: `match /{document=**} { allow read, write: if false; }`.
   - Explicit ownership validation: `allow read, write: if request.auth != null && request.auth.uid == userId;`.
3. **End-to-End Encryption (E2EE) Vault Capability**:
   - Allow users to activate client-side AES-GCM 256-bit passphrase encryption for ultra-sensitive journal thoughts before Firestore persistence, ensuring zero-knowledge cloud storage.

---

## 4. Secure Coding & Input Sanitization Standards

1. **AI Output & Markdown Sanitization**:
   - Parse and render AI-generated markdown safely using sanitized components to prevent XSS.
2. **Strict Request Validation**:
   - Backend routes must validate incoming session IDs, message arrays, and prompt modes using structured schema validation.
3. **Safe Error Handling**:
   - Never leak database schema details, file system paths, or raw exception traces to the frontend UI. Return user-friendly, standardized JSON error objects `{ error: "Descriptive message" }`.
4. **Content Security & Frame Integrity**:
   - Explicitly declare frame permissions (`metadata.json`).
   - Enforce HTTPS across all network requests.

---

## 5. Security Checklist for Continuous Builds

- [x] Firebase Authentication required for all user data read/write.
- [x] Firestore security rules deployed and strictly preventing cross-user reads.
- [x] Server-side proxy for Gemini 2.5 API calls with zero browser key exposure.
- [x] Local storage / Firestore isolated with client-side encryption options.
- [x] Structured multi-turn conversation memory with automated privacy-preserving summaries.
