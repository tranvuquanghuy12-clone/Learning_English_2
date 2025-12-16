import React, { useState, useEffect, useRef } from 'react';
import { GeneratedWordData, WordEntry } from '../types';
import { lookupWord } from '../services/geminiService';
import Button from './Button';
import { Search, Plus, BookOpen, Volume2, Tag, X, ChevronDown, Check } from 'lucide-react';

interface LearnTabProps {
  onAddWord: (word: WordEntry) => void;
  themes: string[];
  onDeleteTheme?: (theme: string) => boolean;
}

const TypewriterText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayText}</span>;
};

const LearnTab: React.FC<LearnTabProps> = ({ onAddWord, themes, onDeleteTheme }) => {
  const [inputWord, setInputWord] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('Chung');
  const [customTheme, setCustomTheme] = useState('');
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedWordData | null>(null);
  const [error, setError] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync selectedTheme if it gets deleted externally or via the delete action
  useEffect(() => {
    if (!isCustomTheme && selectedTheme !== 'Chung' && !themes.includes(selectedTheme)) {
      setSelectedTheme('Chung');
    }
  }, [themes, selectedTheme, isCustomTheme]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim()) return;

    const themeToUse = isCustomTheme && customTheme.trim() ? customTheme.trim() : selectedTheme;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await lookupWord(inputWord.trim(), themeToUse);
      setResult(data);
    } catch (err) {
      setError('Không thể tìm thấy thông tin từ này. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    if (!result) return;
    const themeToUse = isCustomTheme && customTheme.trim() ? customTheme.trim() : selectedTheme;
    
    const newEntry: WordEntry = {
      id: Date.now().toString(),
      word: inputWord.trim(),
      ...result,
      theme: themeToUse,
      addedAt: Date.now(),
    };
    onAddWord(newEntry);
    
    // Reset after adding
    if (isCustomTheme && customTheme.trim()) {
       setSelectedTheme(customTheme.trim());
       setIsCustomTheme(false);
       setCustomTheme('');
    }
    setInputWord('');
    setResult(null);
  };

  const handleDeleteCurrentTheme = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown toggle
    if (onDeleteTheme) {
      // If deleted successfully, logic in useEffect or App will handle state,
      // but we can also manually reset if needed.
      onDeleteTheme(selectedTheme);
    }
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Default to US English
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-500" />
          Tra từ mới
        </h2>
        
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="flex gap-2">
             <input
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder="Nhập từ tiếng anh (ví dụ: resilience)..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1">
               <label className="block text-xs font-semibold text-gray-500 mb-1">Chủ đề</label>
               
               {isCustomTheme ? (
                 <div className="flex gap-2 animate-fade-in">
                   <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="Nhập tên chủ đề..."
                    className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    autoFocus
                   />
                   <button 
                     type="button" 
                     onClick={() => setIsCustomTheme(false)}
                     className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-300"
                     title="Huỷ"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
               ) : (
                 <div className="relative" ref={dropdownRef}>
                    <div 
                      className="flex items-center justify-between w-full p-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                       <span className="text-sm text-gray-800">{selectedTheme}</span>
                       
                       <div className="flex items-center gap-1">
                         {/* Delete Button integrated into the selector */}
                         {selectedTheme !== 'Chung' && (
                           <button
                             type="button"
                             onClick={handleDeleteCurrentTheme}
                             className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all mr-1"
                             title={`Xoá chủ đề "${selectedTheme}"`}
                           >
                             <X className="w-4 h-4" />
                           </button>
                         )}
                         <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                       </div>
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                         {themes.map(t => (
                           <div 
                             key={t}
                             onClick={() => {
                               setSelectedTheme(t);
                               setIsDropdownOpen(false);
                             }}
                             className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex justify-between items-center ${
                               t === selectedTheme ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'
                             }`}
                           >
                              {t}
                              {t === selectedTheme && <Check className="w-4 h-4" />}
                           </div>
                         ))}
                         <div 
                           onClick={() => {
                              setIsCustomTheme(true);
                              setIsDropdownOpen(false);
                           }}
                           className="px-3 py-2.5 text-sm text-blue-600 font-medium cursor-pointer hover:bg-gray-50 border-t border-gray-100 flex items-center gap-2 sticky bottom-0 bg-white"
                         >
                            <Plus className="w-4 h-4" /> Thêm chủ đề mới
                         </div>
                      </div>
                    )}
                 </div>
               )}
             </div>
          </div>

          <Button type="submit" isLoading={isLoading} disabled={!inputWord} className="w-full sm:w-auto">
            Tra cứu
          </Button>
        </form>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>

      {result && (
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                 <h3 className="text-3xl font-bold text-gray-900">{inputWord}</h3>
                 <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium border border-blue-100">
                    <Tag className="w-3 h-3" />
                    {isCustomTheme ? customTheme : selectedTheme}
                 </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-gray-500">
                <button
                  type="button"
                  onClick={() => playAudio(inputWord)}
                  className="p-1.5 hover:bg-blue-100 text-blue-500 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">{result.pronunciation}</span>
              </div>
            </div>
            <Button onClick={handleAdd} variant="primary" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Thêm vào sổ
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Nghĩa tiếng việt</label>
                <p className="text-lg font-medium text-gray-800 mt-1">{result.meaning}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Giải thích nhanh</label>
                <p className="text-gray-800 mt-1">{result.explanation}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Ví dụ
              </label>
              <p className="text-gray-700 mt-1 italic min-h-[1.5rem]">
                "<TypewriterText text={result.example} />"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnTab;