
export interface SimpleResponse {
  title: string;
  reply: string;
}

export interface AnalysisResult {
  detectedName: string;
  summary: string;
  shortcutsUsed?: string;
  replies: SimpleResponse[];
}

export interface ChatSession {
  id: string; // Will use timestamp
  contactName: string;
  history: string[]; // Array of conversation summaries
  isBossMode: boolean;
  goal: 'rapport' | 'getNumber'; // The objective for this conversation
  personalContext?: string; // User-provided context for more tailored advice
  location?: string;
  language?: 'en' | 'es'; // Primary language of the conversation
}