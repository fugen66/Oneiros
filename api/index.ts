import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
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
      model: "gemini-1.5-flash",
      contents: `Ты — эксперт по психоанализу и толкованию сновидений. Проанализируй сон: ${req.body.content}. Ответ на русском в Markdown.`,
    });
    
    const text = response.text || "К сожалению, ИИ не смог проанализировать этот сон. Попробуйте изменить описание.";
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini Analyze Error:", error);
    res.status(500).json({ error: "ИИ временно недоступен или возникла ошибка при анализе. Попробуйте еще раз." });
  }
});

app.post("/api/visualize", async (req, res) => {
  try {
    const { content } = req.body;
    const ai = getGeminiAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A vivid, detailed, and realistic visualization of the following dream scene: "${content}". The image should be cinematic, capturing the specific elements and atmosphere described, with high-quality textures and lighting. Avoid generic surrealism unless specified in the dream.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    let imageUrl = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("ИИ не сгенерировал изображение");
    
    res.json({ imageUrl });
  } catch (error: any) {
    console.error("Visualization Error:", error);
    let message = error.message || "Ошибка визуализации";
    if (message.includes("429") || message.includes("quota")) {
      message = "Превышен лимит на генерацию картинок. Попробуйте через пару минут.";
    }
    res.status(500).json({ error: message });
  }
});

app.patch("/api/dreams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { analysis } = req.body;
    const { error } = await supabase.from("dreams").update({ analysis }).eq("id", id);
    if (error) throw error;
    res.json({ status: "ok" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/dreams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("dreams").delete().eq("id", id);
    if (error) throw error;
    res.json({ status: "ok" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Development vs Production
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}

export default app;
