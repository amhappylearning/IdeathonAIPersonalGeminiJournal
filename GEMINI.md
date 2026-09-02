# Gemini Security & Engineering Standards

This project adheres to the Enterprise Security Directives outlined in `AGENTS.md`.
All Gemini API interactions are executed strictly on the server-side via `/api/gemini/*` endpoints using the `@google/genai` SDK with API keys provisioned securely via Google Cloud Secret Manager / runtime environment variables.

### Key Rules
1. **Server-Side AI Proxy**: No `GEMINI_API_KEY` in frontend bundles.
2. **Deterministic Data Scoping**: All user reflections and summaries are saved to `/users/{userId}/...` in Firestore.
3. **Defense-in-Depth**: Client-side AES-GCM Vault encryption available for sensitive journal entries.
4. **Structured Summarization**: Automated AI multi-turn synthesis creates concise, structured summaries, key themes, sentiment trajectories, and actionable insights.
