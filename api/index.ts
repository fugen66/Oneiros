import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL || "https://vjyqbkgoxyjnitwyajms.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_MhqLKan6u4IHHz9cORb9-Q_1VSTsI_Z";
const supabase = createClient(supabaseUrl, supabaseKey);

// Функция для получения ИИ
const getGeminiAI = () => {
  const geminiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("API_KEY не найден. Проверьте настройки в Vercel.");
  }
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
    res.json(data || []);
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

// Анализ сна (Используем стабильную gemini-2.0-flash)
app.post("/api/analyze", async (req, res) => {
  try {
    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: `Ты — эксперт по психоанализу и толкованию сновидений. Проанализируй сон: ${req.body.content}. Ответ на русском в Markdown.`,
    });
    
    const text = response.text || "ИИ не смог сформировать ответ.";
    res.json({ text });
  } catch (error: any) {
    console.error("Analyze Error:", error);
    let message = "Ошибка при анализе сна";
    if (error.message?.includes("429")) {
      message = "Превышен лимит запросов к ИИ. Пожалуйста, подождите минуту.";
    }
    res.status(500).json({ error: message });
  }
});

// Визуализация сна
app.post("/api/visualize", async (req, res) => {
  try {
    const { content } = req.body;
    const ai = getGeminiAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A vivid, cinematic, and realistic visualization of this dream: "${content}". High quality, detailed textures.` }]
      },
      config: {
        imageConfig: { aspectRatio: "16:9" }
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
    console.error("Visualize Error:", error);
    let message = "Ошибка визуализации";
    
    // Обработка лимитов (429)
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      message = "Бесплатный лимит на создание картинок исчерпан. Google просит подождать (обычно от 15 до 60 минут).";
    } else if (error.message?.includes("safety")) {
      message = "ИИ посчитал описание сна слишком деликатным для визуализации. Попробуйте изменить текст.";
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

export default app;
