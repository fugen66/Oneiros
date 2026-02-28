export const analyzeDream = async (content: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Server response was not JSON:", text);
    if (text.includes("504") || text.includes("Timeout")) {
      throw new Error("Сервер Vercel не успел ответить (Таймаут). Попробуйте сократить описание сна.");
    }
    throw new Error("Ошибка связи с сервером. Пожалуйста, проверьте настройки API ключа в Vercel.");
  }
  
  if (!response.ok) {
    const msg = data.error || "Ошибка сервера";
    if (msg.includes("503") || msg.includes("demand") || msg.includes("UNAVAILABLE")) {
      throw new Error("ИИ сейчас перегружен. Пожалуйста, подождите 30 секунд и попробуйте снова.");
    }
    if (msg.includes("429") || msg.includes("quota")) {
      throw new Error("Превышен лимит запросов. Пожалуйста, подождите минуту.");
    }
    throw new Error(msg);
  }
  
  return data.text;
};
