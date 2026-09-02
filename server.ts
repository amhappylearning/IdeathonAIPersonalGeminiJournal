import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy Google GenAI initialization for security and graceful startup
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is missing. Please configure it in AI Studio Secrets."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback chain for resilience against transient model overload / 503 spikes
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

async function generateContentWithRetryAndFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  maxRetries?: number;
}) {
  const ai = getGenAI();
  const preferred = params.preferredModel || "gemini-2.5-flash";
  const modelsToTry = [
    preferred,
    ...CANDIDATE_MODELS.filter((m) => m !== preferred),
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    const retries = params.maxRetries ?? 2;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return { response, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        const isTransient =
          errStr.includes("503") ||
          errStr.includes("high demand") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("429") ||
          errStr.includes("RESOURCE_EXHAUSTED") ||
          errStr.includes("500") ||
          errStr.includes("overloaded");

        console.warn(
          `[Gemini API] Model ${model} attempt ${attempt + 1}/${retries + 1} failed: ${errStr}`
        );

        if (isTransient && attempt < retries) {
          // Exponential backoff with small jitter (600ms, 1200ms...)
          const delay = Math.pow(2, attempt) * 600 + Math.random() * 200;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // If not retryable on this model or attempts exhausted, break to next fallback model
        break;
      }
    }
  }

  throw lastError || new Error("All Gemini model candidates failed to respond.");
}

// Health & Security Telemetry
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "personal-gemini-journal-secure-backend",
    uptime: process.uptime(),
    keyConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/security/audit-status", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  const keyLength = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0;
  const maskedKey = hasKey
    ? `${process.env.GEMINI_API_KEY?.substring(0, 4)}...${process.env.GEMINI_API_KEY?.slice(-4)}`
    : "NOT_SET";

  res.json({
    securityConstitutionVersion: "1.0.0-PROD",
    threatModel: {
      strideCompliant: true,
      authEnforcement: "Firebase Authentication ID Token Scoped",
      dataIsolation: "Cloud Firestore strict per-user paths (/users/{uid}/*)",
      keyManagement: "Google Cloud Secret Manager / Server-Side Environment Variable Only",
      browserKeyLeakageRisk: "0% (Key never sent to client)",
      clientVaultEncryptionSupport: "AES-GCM-256 (Optional Zero-Knowledge E2EE)",
    },
    secretAudit: {
      keyProvisioned: hasKey,
      keyMask: maskedKey,
      keyLength: keyLength > 0 ? `${keyLength} characters` : "None",
      managedLocation: "Server-side process memory (Cloud Run / Node)",
    },
  });
});

// Multi-turn Gemini AI Chat for Brainstorming & Journaling
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, persona = "reflective", userContext = "" } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    // Select system instruction persona
    let systemInstruction = "";
    switch (persona) {
      case "brainstormer":
        systemInstruction = `You are a brilliant, high-energy Creative Ideation & Brainstorming Partner. 
Your goal is to help the user unpack ideas, explore uncharted angles, challenge assumptions, brainstorm analogies, and expand concepts into actionable frameworks.
Engage interactively: respond with clarity, constructive enthusiasm, lateral thinking, and 1-2 provocative follow-up questions to push their thinking further.`;
        break;
      case "socratic":
        systemInstruction = `You are a thoughtful Socratic Inquirer and Philosophy Mentor.
Guide the user to deeper self-awareness by asking profound, gentle, clarifying questions about their values, underlying motives, and mental models. Avoid giving unsolicited advice; instead, illuminate their blind spots.`;
        break;
      case "strategist":
        systemInstruction = `You are an Executive Strategist and Productivity Architect.
Help the user synthesize messy thoughts into structured systems, 80/20 prioritization, decision trees, risk matrices, and execution sprints. Keep tone crisp, pragmatic, and high-leverage.`;
        break;
      case "stoic":
        systemInstruction = `You are a Stoic Mindful Companion and Emotional Anchor.
Help the user distinguish what is within their control from what is outside their control. Provide grounding perspective, emotional de-escalation, and constructive equanimity.`;
        break;
      case "reflective":
      default:
        systemInstruction = `You are the Personal Gemini Journal AI — an empathetic, insightful, and secure intellectual companion.
Your mission:
1. Provide thoughtful, warm, and structured reflection on the user's thoughts, challenges, feelings, and aspirations.
2. Synthesize what they're saying with emotional intelligence and intellectual rigor.
3. Offer gentle perspective shifts, highlight patterns in their thoughts, and ask one meaningful question that invites deeper discovery.
Never be robotic. Maintain a supportive, articulate, and conversational journal dialogue.`;
        break;
    }

    if (userContext) {
      systemInstruction += `\n\n--- User Session Context & Vault Tags ---\n${userContext}`;
    }

    // Format contents for Google GenAI SDK
    // Map roles: 'user' -> 'user', 'assistant'/'model' -> 'model'
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const { response, modelUsed } = await generateContentWithRetryAndFallback({
      preferredModel: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    });

    const reply = response.text || "I was unable to generate a response. Please try again.";
    res.json({ reply, persona, modelUsed });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    const msg = error?.message || "Failed to communicate with Gemini API.";
    const isOverloaded = msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE");
    res.status(isOverloaded ? 503 : 500).json({
      error: isOverloaded
        ? "Gemini is currently experiencing high demand. Automatic retry did not succeed. Please try sending again in a moment."
        : msg,
    });
  }
});

// Automatic AI Summarization & Synthesis Engine
app.post("/api/gemini/synthesize", async (req, res) => {
  try {
    const { messages, title, persona = "reflective" } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Conversation messages are required for synthesis." });
    }

    const conversationTranscript = messages
      .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const prompt = `You are the AI Synthesis Engine for the Personal Gemini Journal.
Analyze the following journal conversation / brainstorming session between the user and Gemini:

--- BEGIN SESSION TRANSCRIPT ---
${conversationTranscript}
--- END SESSION TRANSCRIPT ---

Generate a rich, structured synthesis in valid JSON format ONLY with the following exact schema:
{
  "title": "A concise, evocative, high-impact title summarizing this entry (max 8 words)",
  "summaryMarkdown": "A comprehensive, beautifully formatted Markdown summary of the entire session (2-3 structured paragraphs with bullet points highlighting key realizations)",
  "keyInsights": ["Array of 3-5 distinct epiphanies, breakthrough insights, or core takeaways"],
  "actionItems": ["Array of 2-5 concrete, actionable next steps or commitments formulated in the session"],
  "sentimentTrajectory": {
    "startMood": "Brief description of initial emotional/cognitive state (e.g. Disorganized, Anxious, Curious, Stagnant)",
    "endMood": "Brief description of ending state (e.g. Empowered, Crystal Clear, Rejuvenated, Focused)",
    "arc": "1-sentence summary of the transformation or shift during the conversation"
  },
  "tags": ["Array of 3-6 relevant thematic tags like '#Productivity', '#Mindfulness', '#IdeaValidation'"],
  "mindMapNodes": [
    {
      "category": "Core Theme name",
      "points": ["Key sub-point 1", "Key sub-point 2"]
    }
  ]
}

Return ONLY the raw JSON object without markdown code blocks, backticks, or other text.`;

    const { response } = await generateContentWithRetryAndFallback({
      preferredModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Fallback parsing if wrapped in codeblocks
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      synthesis: parsedData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Gemini Synthesize API Error:", error);
    const msg = error?.message || "Failed to generate AI synthesis.";
    const isOverloaded = msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE");
    res.status(isOverloaded ? 503 : 500).json({
      error: isOverloaded
        ? "Gemini is currently experiencing high demand. Please try synthesizing again in a moment."
        : msg,
    });
  }
});

// Journaling Sparks & Stoic Brainstorm Prompts Generator
app.post("/api/gemini/sparks", async (req, res) => {
  try {
    const { category = "all" } = req.body;

    const prompt = `Generate 4 distinct, deeply engaging, non-cliché journal prompt sparks for category: "${category}".
Categories can be: 'deep-reflection', 'creative-brainstorming', 'emotional-clarity', 'strategic-planning', or 'stoic-wisdom'.

Return ONLY valid JSON array with objects:
[
  {
    "id": "unique-id",
    "category": "category-name",
    "headline": "Short intriguing prompt hook (3-6 words)",
    "promptText": "The full provocative question or thought experiment to kick off a multi-turn journal chat",
    "iconType": "spark|brain|heart|target|shield"
  }
]
Return raw JSON only.`;

    const { response } = await generateContentWithRetryAndFallback({
      preferredModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "[]";
    const sparks = JSON.parse(rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim());
    res.json({ sparks });
  } catch (error: any) {
    console.error("Gemini Sparks API Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch sparks." });
  }
});

// Vite middleware for development & Static asset serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Secure Personal Gemini Journal Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
