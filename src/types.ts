export interface Dream {
  id?: number;
  title: string;
  content: string;
  date: string;
  mood: string;
  image_url?: string;
  audio_url?: string;
  analysis?: string;
  user_id?: string; // Вот это добавили
  created_at?: string;
}
