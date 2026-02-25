import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// Инициализация Supabase (используем переменные окружения или запасные ключи)
const supabaseUrl = process.env.SUPABASE_URL || "https://vjyqbkgoxyjnitwyajms.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_MhqLKan6u4IHHz9cORb9-Q_1VSTsI_Z";
const supabase = createClient(supabaseUrl, supabaseKey);

// Функция для получения ИИ (проверяем ключи)
const getGeminiAI = () => {
  const geminiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("Ключ API_KEY не найден в настройках Vercel. Проверьте раздел Environment Variables.");
  }
  return new GoogleGenAI({ apiKey: geminiKey });
};

const app = express();
app.use(express.json({ limit: '50mb' }));

// Проверка работоспособности
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Получение всех снов
app.get("/api/dreams", async (req, res) => {
  try {
    const { data, error } = await supabase.from("dreams").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Сохранение нового сна
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

// Анализ сна (используем стабильную модель 1.5-flash)
app.post("/api/analyze", async (req, res) => {
  try {
    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Ты — эксперт по психоанализу и толкованию сновидений. Проанализируй сон: ${req.body.content}. Ответ на русском в Markdown.`,
    });
    
    const text = response.text || "ИИ не смог сформировать ответ. Попробуйте еще раз.";
    res.json({ text });
  } catch (error: any) {
    console.error("Analyze Error:", error);
    res.status(500).json({ error: error.message || "Ошибка при анализе сна" });
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
    res.status(500).json({ error: error.message || "Ошибка при создании картинки" });
  }
});

// Обновление анализа
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

// Удаление сна
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
