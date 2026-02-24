export const analyzeDream = async (content: string) => {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка анализа");
  return data.text;
};

export const generateDreamImage = async (content: string) => {
  const res = await fetch('/api/visualize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка визуализации");
  return data.imageUrl;
};
