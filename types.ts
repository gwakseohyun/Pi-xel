
export type Resolution = '32x32' | '64x64';

export interface Theme {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  color: string;
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  resultImageUrl: string | null;
  originalResult: string | null;
}
