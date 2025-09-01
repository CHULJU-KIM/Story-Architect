import React, { useState, useCallback } from 'react';
import { AppState, Scene, FinalStory } from './types';
import InitialStep from './components/InitialStep';
import StorytellingStep from './components/StorytellingStep';
import FinalStep from './components/FinalStep';
import Header from './components/Header';
import { fileToBase64, generateImageForScene, finalizeStory } from './services/geminiService';

const PROMPT_GUIDES = [
  "첫 번째 씬은 '발단'입니다. 주인공과 배경을 소개하며 이야기가 어떻게 시작되는지 묘사해주세요.",
  "두 번째 씬은 '전개'입니다. 주인공이 어떤 사건이나 갈등에 직면하게 되나요?",
  "세 번째 씬은 '위기'입니다. 갈등이 심화되고 주인공이 어려운 상황에 처하는 장면을 묘사해주세요.",
  "네 번째 씬은 '절정'입니다. 이야기의 가장 긴장감 넘치는 순간, 전환점을 만들어주세요.",
  "마지막 씬은 '결말'입니다. 모든 사건이 해결되고 이야기가 어떻게 마무리되는지 보여주세요."
];

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [storyConcept, setStoryConcept] = useState<string>('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [finalStory, setFinalStory] = useState<FinalStory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getNextPromptGuide = (sceneCount: number): string => {
    // We subtract 1 because the first "scene" can be a placeholder
    const realSceneIndex = sceneCount > 0 && scenes[0]?.generatedImage ? sceneCount - 1 : sceneCount;
    return PROMPT_GUIDES[realSceneIndex] || `장면 #${realSceneIndex + 1}을(를) 묘사해주세요.`;
  }

  const handleStartStorytelling = useCallback(async (concept: string, imageFile?: File) => {
    setIsLoading(true);
    setError(null);
    const initialSceneId = Date.now();
    try {
      setStoryConcept(concept);
      const promptGuide = getNextPromptGuide(0);
      if (imageFile) {
        const dataUrl = await fileToBase64(imageFile);
        setScenes([
          { id: initialSceneId, userDescription: '초기 이미지', generatedImage: dataUrl, status: 'done', promptGuide: promptGuide, userProvidedImage: dataUrl }
        ]);
      } else {
        setScenes([
          { id: initialSceneId, userDescription: '텍스트로 시작', generatedImage: null, status: 'done', promptGuide: promptGuide }
        ]);
      }
      setAppState(AppState.STORYTELLING);
    } catch (e) {
      setError('이야기를 시작하는 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddScene = useCallback(async (description: string, imageFile?: File) => {
    setError(null);
    const lastScene = scenes.length > 0 ? scenes[scenes.length - 1] : null;
    
    const newSceneId = Date.now();
    const nextPromptGuide = getNextPromptGuide(scenes.length);

    const newSceneBase: Omit<Scene, 'status' | 'generatedImage' | 'userProvidedImage'> = {
      id: newSceneId,
      userDescription: description,
      promptGuide: nextPromptGuide,
    };
    
    setScenes(prev => [...prev, { ...newSceneBase, status: 'pending', generatedImage: null }]);

    try {
        if (imageFile) {
            const userImageDataUrl = await fileToBase64(imageFile);
            setScenes(prev => prev.map(s => s.id === newSceneId ? { ...s, status: 'done', generatedImage: userImageDataUrl, userProvidedImage: userImageDataUrl } : s));
        } else {
            setScenes(prev => prev.map(s => s.id === newSceneId ? { ...s, status: 'generating' } : s));
            
            const previousImageDataUrl = lastScene?.generatedImage;
            const newImageDataUrl = await generateImageForScene(description, previousImageDataUrl);
            setScenes(prev => prev.map(s => s.id === newSceneId ? { ...s, generatedImage: newImageDataUrl, status: 'done' } : s));
        }
    } catch (e) {
        setError(e instanceof Error ? e.message : '장면 생성 중 오류가 발생했습니다.');
        setScenes(prev => prev.map(s => s.id === newSceneId ? { ...s, status: 'error' } : s));
        console.error(e);
    }
}, [scenes]);

  const handleUpdateScene = useCallback(async (sceneId: number, newDescription: string) => {
    setError(null);
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

    // The image to base the generation on is the one from the *previous* scene
    const previousImage = sceneIndex > 0 ? scenes[sceneIndex - 1].generatedImage : null;

    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, userDescription: newDescription, status: 'generating' } : s));

    try {
      const newImageDataUrl = await generateImageForScene(newDescription, previousImage);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, generatedImage: newImageDataUrl, status: 'done' } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : '장면 업데이트 중 오류가 발생했습니다.');
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'error' } : s));
      console.error(e);
    }
  }, [scenes]);

  const handleDeleteScene = useCallback((sceneId: number) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId));
  }, []);

  const handleFinishStory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sceneDescriptions = scenes
        .filter(s => s.generatedImage !== null && s.userDescription !== '초기 이미지' && s.userDescription !== '텍스트로 시작')
        .map(s => s.userDescription);
        
      const result = await finalizeStory(storyConcept, sceneDescriptions);
      setFinalStory(result);
      setAppState(AppState.FINAL);
    } catch (e) {
      setError(e instanceof Error ? e.message : '스토리 요약 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [scenes, storyConcept]);
  
  const handleRestart = useCallback(() => {
    setAppState(AppState.INITIAL);
    setStoryConcept('');
    setScenes([]);
    setFinalStory(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.INITIAL:
        return <InitialStep onStart={handleStartStorytelling} isLoading={isLoading} />;
      case AppState.STORYTELLING:
        const currentPrompt = scenes.length > 0 ? scenes[scenes.length-1].promptGuide : PROMPT_GUIDES[0];
        return <StorytellingStep 
                  scenes={scenes} 
                  onAddScene={handleAddScene} 
                  onFinish={handleFinishStory} 
                  promptGuide={currentPrompt}
                  onUpdateScene={handleUpdateScene}
                  onDeleteScene={handleDeleteScene}
                />;
      case AppState.FINAL:
         const finalScenes = scenes.filter(s => s.generatedImage !== null && s.userDescription !== '초기 이미지' && s.userDescription !== '텍스트로 시작');
        return <FinalStep finalStory={finalStory} scenes={finalScenes} onRestart={handleRestart} />;
      default:
        return <div>잘못된 상태입니다.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
        {error && (
          <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative mb-6 animate-fade-in" role="alert">
            <strong className="font-bold">오류: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close">
                <span className="text-xl">×</span>
            </button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}