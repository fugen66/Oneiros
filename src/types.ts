export interface Dream {
  id?: number;
  title: string;
  content: string;
  date: string;
  mood: string;
  image_url?: string;
  audio_url?: string;
  analysis?: string;
  created_at?: string;
}

export type Mood = 'peaceful' | 'intense' | 'lucid' | 'nightmare' | 'mysterious' | 'ordinary';
