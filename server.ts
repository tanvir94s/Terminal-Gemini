import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "30mb" }));

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    defaultModel: "gemini-3.8-flash",
  });
});

// Stream Gemini Chat response
app.post("/api/gemini/stream", async (req: Request, res: Response) => {
  const { messages, model = "gemini-3.8-flash", systemInstruction, temperature = 0.7 } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Messages array is required." });
    return;
  }

  let ai: GoogleGenAI;
  try {
    ai = getGenAI();
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to initialize Gemini client." });
    return;
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    // Format messages for @google/genai
    const formattedContents = messages.map((m: any) => {
      const parts: any[] = [];
      if (m.images && Array.isArray(m.images)) {
        for (const img of m.images) {
          if (img.data && img.mimeType) {
            parts.push({
              inlineData: {
                data: img.data,
                mimeType: img.mimeType,
              },
            });
          }
        }
      }
      if (m.content) {
        parts.push({ text: m.content });
      }
      return {
        role: m.role === "user" ? "user" : "model",
        parts: parts.length > 0 ? parts : [{ text: "" }],
      };
    });

    const stream = await ai.models.generateContentStream({
      model: model || "gemini-3.8-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: typeof temperature === "number" ? temperature : undefined,
      },
    });

    let totalText = "";

    for await (const chunk of stream) {
      const chunkText = chunk.text || "";
      if (chunkText) {
        totalText += chunkText;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    res.write(`event: done\ndata: ${JSON.stringify({ finishReason: "STOP", fullLength: totalText.length })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    const errorMsg = err.message || "Unknown error occurred while contacting Gemini.";
    res.write(`event: error\ndata: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.end();
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Gemini Terminal] Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
