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
    throw new Error("Сервер прислал некорректный ответ. Возможно, превышено время ожидания или не настроен API ключ в Vercel.");
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

export const generateDreamImage = async (content: string) => {
  const response = await fetch('/api/visualize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Server visualization response was not JSON:", text);
    throw new Error("Ошибка сервера при визуализации. Возможно, превышено время ожидания.");
  }

  if (!response.ok) {
    throw new Error(data.error || "Не удалось создать визуализацию. Попробуйте позже.");
  }

  return data.imageUrl;
};
