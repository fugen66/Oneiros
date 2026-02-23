import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "https://vjyqbkgoxyjnitwyajms.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_MhqLKan6u4IHHz9cORb9-Q_1VSTsI_Z";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini
const geminiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: geminiKey });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/dreams", async (req, res) => {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/dreams", async (req, res) => {
    const { title, content, date, mood, image_url, audio_url, analysis } = req.body;
    const { data, error } = await supabase
      .from("dreams")
      .insert([{ title, content, date, mood, image_url, audio_url, analysis }])
      .select();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data[0].id });
  });

  app.delete("/api/dreams/:id", async (req, res) => {
    const { error } = await supabase
      .from("dreams")
      .delete()
      .eq("id", req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.post("/api/analyze", async (req, res) => {
    const { content } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Ты — эксперт по психоанализу и толкованию сновидений. 
Проанализируй это сновидение с символической и психологической точки зрения. 
Дай глубокое представление о возможных значениях и эмоциональных подтекстах. 

ВАЖНО: Весь ответ должен быть СТРОГО на русском языке. Не используй английский язык в заголовках или пояснениях.
Ответ оформи в красивом формате Markdown.

Сон: ${content}`,
      });
      res.json({ text: response.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/visualize", async (req, res) => {
    const { content } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: `Сюрреалистичная, эфирная и художественная визуализация следующего сна: ${content}. Стиль должен быть живописным, атмосферным и слегка абстрактным, как воспоминание или видение. Без текста на изображении.` }],
        },
        config: { imageConfig: { aspectRatio: "16:9" } },
      });
      
      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      res.json({ imageUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return app;
}

export const appPromise = startServer();
export default appPromise;
