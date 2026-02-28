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
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");
  return new GoogleGenAI({ apiKey: geminiKey });
};

const app = express();
app.use(express.json({ limit: '50mb' }));

// API Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/dreams", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    let query = supabase.from("dreams").select("*").order("created_at", { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;

    // Фильтруем на стороне сервера, если колонка существует в данных
    // Это предотвращает ошибку 42703 (column does not exist) в Supabase
    if (userId && data && data.length > 0 && 'user_id' in data[0]) {
      const filteredData = data.filter((d: any) => d.user_id === userId || !d.user_id);
      return res.json(filteredData);
    }

    res.json(data);
  } catch (error: any) {
    console.error("Fetch dreams error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/dreams", async (req, res) => {
  try {
    const { title, content, date, mood, image_url, audio_url, analysis, user_id } = req.body;
    
    // Проверяем структуру таблицы (берем одну запись или просто пробуем вставить)
    // Самый надежный способ - вставить только базовые поля, если расширенные могут отсутствовать
    const insertData: any = { title, content, date, mood, analysis };
    
    // Пробуем добавить user_id и image_url, если они переданы
    // В Supabase если колонки нет, запрос упадет. 
    // Чтобы этого избежать, мы могли бы сначала проверить схему, но это медленно.
    // Просто сделаем вставку максимально безопасной.
    
    const { data, error } = await supabase.from("dreams").insert([req.body]).select();
    
    if (error && error.code === '42703') { // Column does not exist
      // Пробуем вставить без новых колонок
      const fallbackData = { title, content, date, mood, analysis, audio_url };
      const { data: retryData, error: retryError } = await supabase.from("dreams").insert([fallbackData]).select();
      if (retryError) throw retryError;
      return res.json({ id: retryData[0].id });
    }
    
    if (error) throw error;
    res.json({ id: data[0].id });
  } catch (error: any) {
    console.error("Create dream error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Проанализируй этот сон и дай краткий психологический разбор на русском языке в формате Markdown: ${req.body.content}`,
    });
    
    const text = response.text || "Не удалось получить ответ от ИИ.";
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Ошибка ИИ. Попробуйте позже." });
  }
});

app.patch("/api/dreams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { analysis, title, image_url } = req.body;
    
    // Сначала проверяем, какие колонки существуют
    const { data: existingDream, error: fetchError } = await supabase.from("dreams").select("*").eq("id", id).single();
    if (fetchError) throw fetchError;

    const updateData: any = {};
    if (analysis !== undefined) updateData.analysis = analysis;
    if (title !== undefined) updateData.title = title;
    
    // Обновляем image_url только если колонка существует
    if (image_url !== undefined && 'image_url' in existingDream) {
      updateData.image_url = image_url;
    }
    
    const { error } = await supabase.from("dreams").update(updateData).eq("id", id);
    if (error) throw error;
    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("Update dream error:", error);
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
