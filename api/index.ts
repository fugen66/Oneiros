import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: '50mb' }));

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

const getGeminiAI = () => {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing API Key");
  return new GoogleGenAI({ apiKey: key });
};

app.post("/api/analyze", async (req, res) => {
  try {
    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Самая стабильная модель для бесплатных ключей
      contents: `Проанализируй сон: ${req.body.content}. Ответ на русском, кратко, в Markdown.`
    });
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: "ИИ временно недоступен. Попробуйте позже." });
  }
});

app.post("/api/visualize", async (req, res) => {
  try {
    const { content } = req.body;
    const clean = content.substring(0, 100).replace(/[^a-zA-Zа-яА-Я0-9 ]/g, '');
    const imageUrl = `https://image.pollinations.ai/prompt/surreal_dream_style_${encodeURIComponent(clean)}?width=1024&height=576&nologo=true`;
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ error: "Ошибка визуализации" });
  }
});

// Для работы с Supabase напрямую из фронта (если нужно) или через прокси
app.get("/api/dreams", async (req, res) => {
  const { data } = await supabase.from("dreams").select("*").order("created_at", { ascending: false });
  res.json(data || []);
});

export default app;
