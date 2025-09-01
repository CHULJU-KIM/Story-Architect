
import React, { useState, useEffect, useRef } from 'react';
import type { Scene } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface StorytellingStepProps {
  scenes: Scene[];
  onAddScene: (description: string, imageFile?: File) => void;
  onFinish: () => void;
  promptGuide: string;
  onUpdateScene: (sceneId: number, newDescription: string) => void;
  onDeleteScene: (sceneId: number) => void;
}

const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const BotIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18M5.468 18.253L12 12m6.532-6.253L12 12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 4.142-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 7.858 4.5 12 4.5s7.5 3.358 7.5 7.5Z" />
    </svg>
);

const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const RetryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10.5M20 20l-1.5-1.5A9 9 0 003.5 13.5" />
    </svg>
);

const StorytellingStep: React.FC<StorytellingStepProps> = ({ scenes, onAddScene, onFinish, promptGuide, onUpdateScene, onDeleteScene }) => {
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const filmStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filmStripRef.current) {
      filmStripRef.current.scrollLeft = filmStripRef.current.scrollWidth;
    }
  }, [scenes.length]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddSceneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onAddScene(description, imageFile || undefined);
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSelectScene = (scene: Scene) => {
    setSelectedSceneId(scene.id);
    setEditingDescription(scene.userDescription);
  };
  
  const handleUpdateSubmit = () => {
      if (selectedSceneId && editingDescription.trim()) {
          onUpdateScene(selectedSceneId, editingDescription);
          setSelectedSceneId(null);
      }
  };

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  return (
    <div className="flex flex-col flex-grow h-full max-h-[85vh]">
      <div className="flex-grow p-4 bg-gray-800 rounded-t-xl overflow-y-auto">
        {/* Main Content Area: Editor or Add Scene Form */}
        {selectedScene ? (
          // EDITING VIEW
          <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">장면 편집하기</h3>
                <button onClick={() => setSelectedSceneId(null)} className="text-gray-400 hover:text-white">&times; 닫기</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <div className="aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                          {selectedScene.status === 'generating' && <LoadingSpinner text="재생성 중..." />}
                          {selectedScene.status === 'error' && <div className="text-red-400 p-4 text-center">이미지 생성 실패</div>}
                          {selectedScene.generatedImage && <img src={selectedScene.generatedImage} alt={`Scene ${selectedScene.id}`} className="w-full h-full object-contain" />}
                      </div>
                  </div>
                  <div className="flex flex-col space-y-4">
                      <textarea
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          rows={6}
                          className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400"
                      />
                      <div className="flex items-center gap-2">
                         <button onClick={handleUpdateSubmit} className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">재생성</button>
                         <button onClick={() => { onDeleteScene(selectedScene.id); setSelectedSceneId(null); }} className="flex-1 justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">삭제</button>
                      </div>
                  </div>
              </div>
          </div>
        ) : (
          // ADD SCENE VIEW
          <form onSubmit={handleAddSceneSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">다음 장면 묘사하기:</label>
              <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                <p className="text-indigo-300">{promptGuide}</p>
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400"
              placeholder="여기에 장면을 묘사해주세요..."
            />
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-grow w-full">
                    <label htmlFor="scene-image-upload" className="text-sm font-medium text-gray-300">또는, 직접 이미지 업로드 (선택 사항)</label>
                    <input
                        id="scene-image-upload"
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                    />
                </div>
                {imagePreview && <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-lg object-cover" />}
            </div>
            <button type="submit" disabled={!description.trim()} className="w-full py-3 px-4 rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
              장면 추가
            </button>
          </form>
        )}
      </div>

      {/* Film Strip */}
      <div className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm p-4 rounded-b-xl">
        <h3 className="text-lg font-semibold mb-3">필름 스트립</h3>
        <div ref={filmStripRef} className="flex items-center gap-4 overflow-x-auto pb-2">
          {scenes.map((scene, index) => (
            <div key={scene.id} className="flex-shrink-0 w-40 text-center relative group">
              <div
                onClick={() => handleSelectScene(scene)}
                className={`aspect-video rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center cursor-pointer border-2 ${selectedSceneId === scene.id ? 'border-indigo-500' : 'border-transparent'} hover:border-indigo-400 transition-all`}
              >
                {scene.status === 'generating' && <LoadingSpinner size="sm" text="생성 중" />}
                {scene.status === 'error' && <div className="text-red-400 text-xs p-2">오류</div>}
                {scene.generatedImage && <img src={scene.generatedImage} alt={`Scene ${index + 1}`} className="w-full h-full object-cover" />}
                {scene.status === 'done' && !scene.generatedImage && <div className="text-gray-400 text-xs p-2">글로만 시작</div>}
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">{scene.userDescription}</p>
              <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleSelectScene(scene)} className="p-1.5 bg-gray-800/70 rounded-full text-white hover:bg-indigo-600"><EditIcon /></button>
              </div>
              {scene.userProvidedImage && <div className="absolute top-1 left-1 p-1.5 bg-gray-800/70 rounded-full text-white"><UserIcon /></div>}
            </div>
          ))}
          <div className="w-40 h-22 flex-shrink-0"></div> {/* Spacer for scroll */}
        </div>
        <button
          onClick={onFinish}
          disabled={scenes.filter(s => s.status === 'done').length < 2}
          className="mt-4 w-full py-3 px-4 rounded-md shadow-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          스토리 완성하기
        </button>
      </div>
    </div>
  );
};

export default StorytellingStep;
