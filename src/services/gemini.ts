export const analyzeDream = async (content: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  
  const data = await response.json().catch(() => ({ error: "Сервер прислал некорректный ответ" }));
  
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

  const data = await response.json().catch(() => ({ error: "Ошибка сервера" }));

  if (!response.ok) {
    throw new Error(data.error || "Не удалось создать визуализацию. Попробуйте позже.");
  }

  return data.imageUrl;
};
