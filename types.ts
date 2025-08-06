
export type ActiveTool = 'none' | 'web-search' | 'image' | 'deep-thinking';

export interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string; // Base64 data URL for attached images OR generated images
  imageMimeType?: string; // Mime type for the image/attachment
  groundingChunks?: { web: { uri: string; title?: string; publishedDate?: { year?: number; month?: number; day?: number; } } }[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  pinned: boolean;
}