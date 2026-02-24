import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || "https://vjyqbkgoxyjnitwyajms.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_MhqLKan6u4IHHz9cORb9-Q_1VSTsI_Z";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini
const getGeminiAI = () => {
  const geminiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error("API_KEY is missing in Vercel settings");
  return new GoogleGenAI({ apiKey: geminiKey });
};

const app = express();
app.use(express.json({ limit: '50mb' }));

// API Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/dreams", async (req, res) => {
  try {
    const { data, error } = await supabase.from("dreams").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/dreams", async (req, res) => {
  try {
    const { title, content, date, mood, image_url, audio_url, analysis } = req.body;
    const { data, error } = await supabase.from("dreams").insert([{ title, content, date, mood, image_url, audio_url, analysis }]).select();
    if (error) throw error;
    res.json({ id: data[0].id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Ты — эксперт по психоанализу и толкованию сновидений. Проанализируй сон: ${req.body.content}. Ответ на русском в Markdown.`,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/visualize", async (req, res) => {
  try {
    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [{ text: `Surreal dream visualization: ${req.body.content}` }] },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    res.json({ imageUrl: part ? `data:image/png;base64,${part.inlineData.data}` : null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Development vs Production
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  // Динамический импорт Vite, чтобы он не ломал билд в продакшене
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}

// Only listen if not in Vercel
if (process.env.VERCEL !== "1") {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

export default app;
