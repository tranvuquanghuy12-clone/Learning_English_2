import React, { useState, useEffect, useMemo } from 'react';
import { WordEntry } from '../types';
import { ChevronLeft, ChevronRight, RefreshCw, Grid, RectangleHorizontal, Search, Filter } from 'lucide-react';
import Button from './Button';

interface FlashcardTabProps {
  words: WordEntry[];
  themes: string[];
}

// Sub-component for individual card in Grid Mode
const GridFlashcard: React.FC<{ word: WordEntry }> = ({ word }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className="relative aspect-[4/3] cursor-pointer group perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className="absolute w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all backface-hidden flex flex-col items-center justify-center p-4">
           <span className="text-xl font-bold text-gray-800 text-center">{word.word}</span>
           <span className="text-xs text-gray-500 mt-1 font-mono">{word.pronunciation}</span>
           <span className="absolute bottom-2 right-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{word.theme || 'Chung'}</span>
        </div>
        
        {/* Back */}
        <div className="absolute w-full h-full bg-blue-600 rounded-xl shadow-sm text-white backface-hidden rotate-y-180 flex flex-col items-center justify-center p-4">
           <p className="text-lg font-bold text-center">{word.meaning}</p>
           <p className="text-xs text-blue-100 mt-2 text-center line-clamp-3">{word.example}</p>
        </div>
      </div>
    </div>
  );
};

const FlashcardTab: React.FC<FlashcardTabProps> = ({ words, themes }) => {
  const [viewMode, setViewMode] = useState<'CARD' | 'GRID'>('CARD');
  const [selectedTheme, setSelectedTheme] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter Logic
  const filteredWords = useMemo(() => {
    return words.filter(w => {
      const matchTheme = selectedTheme === 'ALL' || (w.theme || 'Chung') === selectedTheme;
      const matchSearch = searchQuery === '' || 
                          w.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTheme && matchSearch;
    });
  }, [words, selectedTheme, searchQuery]);

  // Reset index when filter results change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filteredWords.length, selectedTheme, searchQuery]);

  // --- RENDER HELPERS ---

  if (words.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl">Sổ ghi nhớ trống.</p>
        <p className="text-sm mt-2">Hãy thêm từ mới ở mục "Học từ" trước nhé!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      
      {/* --- TOOLBAR --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 sticky top-20 z-10">
        
        {/* Search & Filter Group */}
        <div className="flex-1 flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm từ vựng..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Theme Filter */}
          <div className="relative min-w-[180px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả từ điển</option>
              {themes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('CARD')}
            className={`p-2 rounded-md transition-all ${viewMode === 'CARD' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Chế độ thẻ trượt"
          >
            <RectangleHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('GRID')}
            className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Chế độ lưới"
          >
            <Grid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      {filteredWords.length === 0 ? (
         <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Không tìm thấy từ nào phù hợp.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedTheme('ALL'); }}
              className="text-blue-600 text-sm font-medium mt-2 hover:underline"
            >
              Xoá bộ lọc
            </button>
         </div>
      ) : (
        <>
          {viewMode === 'GRID' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in pb-10">
               {filteredWords.map((word) => (
                 <GridFlashcard key={word.id} word={word} />
               ))}
            </div>
          ) : (
            /* CARD VIEW (SWIPE) */
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in pb-10">
              <div className="w-full flex justify-between items-center mb-4 text-gray-500 text-sm font-medium max-w-xl">
                <span>Thẻ {currentIndex + 1} / {filteredWords.length}</span>
                <Button variant="ghost" onClick={() => setIsFlipped(!isFlipped)} className="text-blue-500">
                  <RefreshCw className="w-4 h-4 mr-1" /> Lật thẻ
                </Button>
              </div>

              <div 
                className="relative w-full max-w-xl aspect-[4/3] perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center justify-center backface-hidden p-8">
                    <span className="text-sm text-gray-400 font-semibold tracking-wider mb-2">TIẾNG ANH</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center break-words w-full">{filteredWords[currentIndex].word}</h2>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-mono text-lg">{filteredWords[currentIndex].pronunciation}</span>
                    <div className="absolute bottom-6 flex flex-col items-center gap-1">
                       <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{filteredWords[currentIndex].theme}</span>
                       <span className="text-xs text-gray-400">Nhấn để xem nghĩa</span>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute w-full h-full bg-blue-600 rounded-2xl shadow-xl text-white flex flex-col items-center justify-center backface-hidden rotate-y-180 p-8">
                    <span className="text-sm text-blue-200 font-semibold tracking-wider mb-4">NGHĩa & VÍ DỤ</span>
                    <h3 className="text-3xl font-bold text-center mb-4">{filteredWords[currentIndex].meaning}</h3>
                    <p className="text-center text-blue-100 mb-4">{filteredWords[currentIndex].explanation}</p>
                    <div className="bg-white/10 p-4 rounded-lg w-full">
                      <p className="text-sm italic text-center">"{filteredWords[currentIndex].example}"</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 w-full max-w-xl">
                <Button 
                  onClick={() => {
                    setIsFlipped(false);
                    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length), 200);
                  }} 
                  variant="secondary" 
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Trước
                </Button>
                <Button 
                  onClick={() => {
                     setIsFlipped(false);
                     setTimeout(() => setCurrentIndex((prev) => (prev + 1) % filteredWords.length), 200);
                  }} 
                  variant="secondary" 
                  className="flex-1"
                >
                  Sau <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FlashcardTab;