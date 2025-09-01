
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18M5.468 18.253L12 12m6.532-6.253L12 12" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 4.142-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 7.858 4.5 12 4.5s7.5 3.358 7.5 7.5Z" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight text-white">
              AI 스토리 아키텍트 <span className="text-gray-400 text-lg font-normal hidden sm:inline">/ AI Story Architect</span>
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
