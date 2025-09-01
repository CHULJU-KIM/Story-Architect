export enum AppState {
  INITIAL,
  STORYTELLING,
  FINAL,
}

export interface Scene {
  id: number; // Unique ID, e.g., Date.now()
  userDescription: string;
  // Holds the full data URL (data:mime/type;base64,...) for the final image
  generatedImage: string | null; 
  // Holds the full data URL if the user uploaded an image for this specific scene
  userProvidedImage?: string | null; 
  status: 'pending' | 'generating' | 'done' | 'error';
  promptGuide: string;
  isEditing?: boolean;
}

export interface PolishedScene {
  id: number;
  description: string;
}

export interface FinalStory {
  title: string;
  fullText: string;
  musicRecommendation: string;
  polishedScenes: PolishedScene[];
}