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
    if (data.error) throw new Error(data.error);
    return data.text;
  } catch (e) {
    throw new Error("Не удалось прочитать ответ сервера. Возможно, сервер упал.");
  }
};

export const generateDreamImage = async (content: string) => {
  const response = await fetch('/api/visualize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка сервера (${response.status}): ${errorText || 'Неизвестная ошибка'}`);
  }

  try {
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.imageUrl;
  } catch (e) {
    throw new Error("Не удалось прочитать ответ сервера. Возможно, сервер упал.");
  }
};
