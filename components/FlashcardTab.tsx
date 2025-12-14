import React, { useState } from 'react';
import { WordEntry } from '../types';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Button from './Button';

interface FlashcardTabProps {
  words: WordEntry[];
}

const FlashcardTab: React.FC<FlashcardTabProps> = ({ words }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (words.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl">Sổ ghi nhớ trống.</p>
        <p className="text-sm mt-2">Hãy thêm từ mới ở mục "Học từ" trước nhé!</p>
      </div>
    );
  }

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    }, 200);
  };

  const currentWord = words[currentIndex];

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full flex justify-between items-center mb-6 text-gray-500 text-sm font-medium">
        <span>Thẻ {currentIndex + 1} / {words.length}</span>
        <Button variant="ghost" onClick={() => setIsFlipped(!isFlipped)} className="text-blue-500">
          <RefreshCw className="w-4 h-4 mr-1" /> Lật thẻ
        </Button>
      </div>

      <div 
        className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center justify-center backface-hidden p-8">
            <span className="text-sm text-gray-400 font-semibold tracking-wider mb-2">TIẾNG ANH</span>
            <h2 className="text-5xl font-bold text-gray-800 mb-4 text-center">{currentWord.word}</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-mono text-lg">{currentWord.pronunciation}</span>
            <p className="text-xs text-gray-400 absolute bottom-6">Nhấn để xem nghĩa</p>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full bg-blue-600 rounded-2xl shadow-xl text-white flex flex-col items-center justify-center backface-hidden rotate-y-180 p-8">
            <span className="text-sm text-blue-200 font-semibold tracking-wider mb-4">NGHĨA & VÍ DỤ</span>
            <h3 className="text-3xl font-bold text-center mb-4">{currentWord.meaning}</h3>
            <p className="text-center text-blue-100 mb-4">{currentWord.explanation}</p>
            <div className="bg-white/10 p-4 rounded-lg w-full">
              <p className="text-sm italic text-center">"{currentWord.example}"</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <Button onClick={handlePrev} variant="secondary" className="w-32">
          <ChevronLeft className="w-4 h-4" /> Trước
        </Button>
        <Button onClick={handleNext} variant="secondary" className="w-32">
          Sau <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardTab;