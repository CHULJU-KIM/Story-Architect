
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FinalStory, Scene } from '../types';
import LoadingSpinner from './LoadingSpinner';

const PLACEHOLDER_MUSIC_URL = 'https://storage.googleapis.com/wf-assets/ga-aistudio-template-diffusion/music/cinematic-documentary.mp3';

interface FinalStepProps {
  finalStory: FinalStory | null;
  scenes: Scene[];
  onRestart: () => void;
}

const MusicIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-13c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
    </svg>
);

const FinalStep: React.FC<FinalStepProps> = ({ finalStory, scenes, onRestart }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [storyStarted, setStoryStarted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showFullText, setShowFullText] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Fix: Replace NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Fix: Replace NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentScene = scenes[currentSceneIndex];
  const SCENE_DURATION = 8000; // 8 seconds per scene

  const hideControls = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControls();
  }, [hideControls]);
  
  const setupTimer = useCallback(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
          setCurrentSceneIndex(prev => (prev + 1) % scenes.length);
      }, SCENE_DURATION);
  }, [scenes.length]);
  
  useEffect(() => {
      if (isPlaying) {
          setupTimer();
          hideControls();
      } else {
          if (timerRef.current) clearInterval(timerRef.current);
      }
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      };
  }, [isPlaying, setupTimer, hideControls]);

  const handleStartStory = () => {
    setStoryStarted(true);
    setIsPlaying(true);
    audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
  };
  
  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };
  
  const goToScene = (index: number) => {
    setCurrentSceneIndex(index);
    if(isPlaying) setupTimer(); // Reset timer on manual navigation
  };
  
  const handleExport = () => {
    if (!finalStory) return;
    const storyData = {
        title: finalStory.title,
        fullText: finalStory.fullText,
        musicUrl: PLACEHOLDER_MUSIC_URL,
        scenes: scenes.map((scene, index) => ({
          ...scene,
          polishedDescription: finalStory.polishedScenes[index]?.description || scene.userDescription,
        })),
    };

    const htmlContent = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${storyData.title}</title><script src="https://cdn.tailwindcss.com"></script><style>body{background-color:#000;color:#fff;font-family:sans-serif;overflow:hidden}.ken-burns{animation:ken-burns 8s ease-in-out alternate infinite}@keyframes ken-burns{0%{transform:scale(1)}100%{transform:scale(1.05)}}.fade-in{animation:fadeIn 1s ease-out}@keyframes fadeIn{0%{opacity:0}to{opacity:1}}.slide{transition:opacity 1s ease-in-out}</style></head><body class="flex items-center justify-center h-screen"><div id="app" class="w-full h-full relative"></div><script>const storyData=${JSON.stringify(storyData)};const app=document.getElementById("app");let currentIndex=0;let isPlaying=false;const audio=new Audio(storyData.musicUrl);audio.loop=true;function showStartScreen(){app.innerHTML=\`<div class="w-full h-full flex flex-col items-center justify-center bg-black text-center p-4 fade-in"><h1 class="text-5xl font-bold mb-4">${storyData.title}</h1><button id="start-btn" class="text-2xl py-3 px-6 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-transform hover:scale-105">▶ 스토리 시작</button></div>\`;document.getElementById("start-btn").onclick=startStory}function startStory(){isPlaying=true;audio.play().catch(console.error);renderPlayer()}function renderPlayer(){app.innerHTML=\`<div class="w-full h-full relative bg-black"><div id="slides" class="w-full h-full"></div><div id="caption" class="absolute bottom-16 left-0 right-0 p-6 text-center bg-gradient-to-t from-black/80 to-transparent text-lg drop-shadow-lg font-semibold"></div><div id="controls" class="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-black/50"><button id="play-pause" class="px-2"></button><div id="progress-bar" class="flex-grow h-1 bg-white/20 rounded-full mx-4"><div id="progress" class="h-full bg-indigo-500 rounded-full"></div></div><button id="restart-btn" class="text-sm px-3 py-1 bg-gray-700 rounded-md">처음으로</button></div></div>\`;document.getElementById("play-pause").onclick=()=>{isPlaying=!isPlaying;isPlaying?audio.play():audio.pause();updatePlayPauseButton()};document.getElementById("restart-btn").onclick=showStartScreen;renderScene(0);setInterval(update,100)}function update(){if(!isPlaying)return;currentIndex=(currentIndex+1)%(storyData.scenes.length*100);if(currentIndex%100===0)renderScene(currentIndex/100);const progress=(currentIndex%100)/100;document.getElementById("progress").style.width=\`\${progress*100}%\`}function renderScene(index){const scene=storyData.scenes[index];document.getElementById("slides").innerHTML=\`<img src="\${scene.generatedImage}" class="absolute inset-0 w-full h-full object-contain ken-burns slide fade-in" />\`;document.getElementById("caption").textContent=scene.polishedDescription;currentIndex=index*100}function updatePlayPauseButton(){document.getElementById("play-pause").innerHTML=isPlaying?'❚❚':'▶'}showStartScreen();<\/script></body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${finalStory.title.replace(/\s/g, '_') || 'story'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (!finalStory || !scenes || scenes.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <LoadingSpinner text="스토리를 완성하고 있습니다..." />
      </div>
    );
  }

  if (!storyStarted) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center animate-fade-in p-4">
        <h1 className="text-5xl font-bold mb-4 text-indigo-400">{finalStory.title}</h1>
        <p className="text-lg text-gray-300 mb-6 max-w-2xl">{finalStory.fullText.substring(0, 150)}...</p>
        
        <div className="bg-gray-800/50 rounded-lg p-4 mb-8 max-w-2xl w-full border border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center justify-center">
            <MusicIcon />
            AI 음악 추천
          </h2>
          <p className="text-indigo-300 mt-2">{finalStory.musicRecommendation}</p>
        </div>

        <button onClick={handleStartStory} className="text-2xl py-4 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 shadow-lg">
          ▶ 스토리 시작
        </button>
        <p className="text-xs text-gray-500 mt-4 max-w-xs">
            *분위기를 위해 어울리는 배경 음악이 재생됩니다. (AI 추천 음악이 아님)
        </p>
         <audio ref={audioRef} src={PLACEHOLDER_MUSIC_URL} loop preload="auto" />
      </div>
    );
  }

  const polishedCaption = finalStory.polishedScenes[currentSceneIndex]?.description || currentScene.userDescription;

  return (
    <div className="w-full h-full max-w-6xl mx-auto animate-fade-in flex flex-col" onMouseMove={handleMouseMove}>
      <div className="relative bg-black rounded-lg shadow-2xl flex-grow overflow-hidden">
        {scenes.map((scene, index) => (
          <div key={scene.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSceneIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {scene.generatedImage && <img src={scene.generatedImage} alt={`Scene ${index + 1}`} className={`w-full h-full object-contain ${index === currentSceneIndex ? 'ken-burns-active' : ''}`} />}
          </div>
        ))}
        <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-center z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white text-lg drop-shadow-lg font-semibold">{polishedCaption}</p>
        </div>
         <div className={`absolute top-4 right-4 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={() => setShowFullText(!showFullText)} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800/60 hover:bg-gray-700/80 backdrop-blur-sm">
            {showFullText ? '스토리 숨기기' : '전체 스토리'}
          </button>
        </div>
      </div>

      <div className={`flex-shrink-0 mt-4 space-y-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full bg-gray-700/50 rounded-full">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${((currentSceneIndex + 1) / scenes.length) * 100}%`, transition: 'width 0.5s' }}></div>
        </div>
        <div className="flex justify-between items-center gap-4 text-white p-2">
            <button onClick={handleTogglePlay} className="p-2">
                {isPlaying 
                  ? <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.002v3.996a1 1 0 001.555.832l3.197-2.001a1 1 0 000-1.664l-3.197-1.999z" clipRule="evenodd" /></svg>
                }
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => goToScene((currentSceneIndex - 1 + scenes.length) % scenes.length)} aria-label="Previous">&#9664;</button>
              <span className="text-sm">{currentSceneIndex + 1} / {scenes.length}</span>
              <button onClick={() => goToScene((currentSceneIndex + 1) % scenes.length)} aria-label="Next">&#9654;</button>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleExport} className="py-2 px-4 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700">저장/게시</button>
                <button onClick={onRestart} className="py-2 px-4 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600">새 스토리</button>
            </div>
        </div>
      </div>
      
      {showFullText && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4" onClick={() => setShowFullText(false)}>
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in max-h-[80vh] max-w-3xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold mb-4">전체 스토리</h3>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{finalStory.fullText}</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default FinalStep;
