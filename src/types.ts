export interface ImageAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 without data:image/...;base64, prefix
  previewUrl: string;
  sizeBytes: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  images?: ImageAttachment[];
  isStreaming?: boolean;
  error?: string;
  modelUsed?: string;
  tokenCountEstimate?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  systemInstruction?: string;
  model: string;
  temperature: number;
}

export type TerminalThemeId = 'gemini-dark' | 'matrix' | 'amber-crt' | 'cyberpunk' | 'monokai' | 'sol';

export interface TerminalTheme {
  id: TerminalThemeId;
  name: string;
  description: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  promptUser: string;
  promptGemini: string;
  accent: string;
  accentGlow: string;
  cursorColor: string;
  selectionBg: string;
}

export interface TerminalSettings {
  theme: TerminalThemeId;
  scanlines: boolean;
  soundEnabled: boolean;
  fontSize: 'sm' | 'base' | 'lg';
  autoScroll: boolean;
  systemInstruction: string;
  model: string;
  temperature: number;
}

export interface CommandDefinition {
  command: string;
  alias?: string;
  args?: string;
  description: string;
  category: 'core' | 'session' | 'config' | 'misc';
}
