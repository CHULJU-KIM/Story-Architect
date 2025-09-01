import React, { useState, useCallback, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface InitialStepProps {
  onStart: (concept: string, imageFile?: File) => void;
  isLoading: boolean;
}

const ImageUploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TextIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


const InitialStep: React.FC<InitialStepProps> = ({ onStart, isLoading }) => {
  const [concept, setConcept] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startMode, setStartMode] = useState<'image' | 'text' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드할 수 있습니다 (jpg, png, webp 등).');
        return;
      }
      setError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!concept.trim()) {
      setError('스토리 컨셉을 입력해주세요.');
      return;
    }
    if (startMode === 'image' && !imageFile) {
      setError('이미지를 업로드해주세요.');
      return;
    }
    setError(null);
    onStart(concept, startMode === 'image' ? imageFile! : undefined);
  };
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files?.[0];
      if (file) {
         if (fileInputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
            
            const changeEvent = new Event('change', { bubbles: true });
            fileInputRef.current.dispatchEvent(changeEvent);
         }
      }
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };
  
  const renderForm = () => (
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          {startMode === 'image' && (
             <div>
                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300 mb-2">1. 주인공 또는 배경 이미지</label>
                <label 
                    onDrop={handleDrop} 
                    onDragOver={handleDragOver}
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="mx-auto h-40 w-auto rounded-lg object-contain" />
                    ) : (
                      <>
                        <ImageUploadIcon />
                        <div className="flex text-sm text-gray-400">
                          <p className="pl-1">파일을 드래그하거나 클릭해서 업로드하세요</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                </label>
              </div>
          )}

        <div>
          <label htmlFor="concept" className="block text-sm font-medium text-gray-300">{startMode === 'image' ? '2. 스토리 핵심 컨셉' : '1. 스토리 핵심 컨셉'}</label>
          <textarea
            id="concept"
            name="concept"
            rows={3}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-400"
            placeholder="예: '사이버펑크 도시를 탐험하는 고양이 로봇의 이야기'"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-4">
            <button type="button" onClick={() => setStartMode(null)} className="w-full flex justify-center py-3 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                뒤로가기
            </button>
            <button
              type="submit"
              disabled={isLoading || (startMode === 'image' && (!imageFile || !concept)) || (startMode === 'text' && !concept) }
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? <LoadingSpinner text="준비 중..." size="sm" /> : '스토리 제작 시작'}
            </button>
        </div>
      </form>
  );

  const renderChoice = () => (
      <div className="space-y-4 animate-fade-in">
          <button onClick={() => setStartMode('image')} className="w-full text-left p-6 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-all duration-200 flex items-center space-x-4">
            <ImageUploadIcon />
            <div>
                <h3 className="font-bold text-lg text-white">이미지로 시작하기</h3>
                <p className="text-gray-400">대표 이미지로 이야기의 분위기를 잡고 시작합니다. (성장 앨범에 추천)</p>
            </div>
          </button>
          <button onClick={() => setStartMode('text')} className="w-full text-left p-6 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-all duration-200 flex items-center space-x-4">
            <TextIcon />
            <div>
                <h3 className="font-bold text-lg text-white">글로만 시작하기</h3>
                <p className="text-gray-400">아이디어만으로 시작하면 AI가 모든 이미지를 그려줍니다. (소설/동화 창작에 추천)</p>
            </div>
          </button>
      </div>
  );

  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">이야기 시작하기</h2>
          <p className="mt-2 text-gray-400">어떻게 이야기를 시작하시겠어요?</p>
        </div>
        
        {startMode ? renderForm() : renderChoice()}

      </div>
    </div>
  );
};

export default InitialStep;