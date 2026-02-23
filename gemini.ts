export const analyzeDream = async (content: string) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.text;
};

export const generateDreamImage = async (content: string) => {
  const response = await fetch('/api/visualize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.imageUrl;
};
