export const analyzeDream = async (content: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка сервера (${response.status}): ${errorText || 'Неизвестная ошибка'}`);
  }
  
  try {
    const data = await response.json();
    if (data.error) {
      if (data.error.includes("429") || data.error.includes("quota")) {
        throw new Error("Превышен лимит запросов ИИ. Пожалуйста, подождите 1 минуту и попробуйте снова.");
      }
      throw new Error(data.error);
    }
    return data.text;
  } catch (e: any) {
    if (e.message.includes("Превышен лимит")) throw e;
    throw new Error("Не удалось прочитать ответ сервера. Возможно, сервер упал.");
  }
};

export const generateDreamImage = async (content: string) => {
  const response = await fetch('/api/visualize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  const data = await response.json().catch(() => ({ error: "Ошибка сервера" }));

  if (!response.ok) {
    let msg = data.error || "Неизвестная ошибка";
    if (msg.includes("429") || msg.includes("quota")) {
      throw new Error("Превышен лимит на создание картинок. Попробуйте через 1-2 минуты.");
    }
    throw new Error(msg);
  }

  return data.imageUrl;
};
