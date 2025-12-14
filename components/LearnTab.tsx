import React, { useState } from 'react';
import { GeneratedWordData, WordEntry } from '../types';
import { lookupWord } from '../services/geminiService';
import Button from './Button';
import { Search, Plus, BookOpen, Volume2, Tag } from 'lucide-react';

interface LearnTabProps {
  onAddWord: (word: WordEntry) => void;
  existingThemes: string[];
}

const DEFAULT_THEMES = ["Chung", "Giao tiếp", "Kinh doanh", "Du lịch", "Công nghệ", "Ẩm thực", "Y tế"];

const LearnTab: React.FC<LearnTabProps> = ({ onAddWord, existingThemes }) => {
  const [inputWord, setInputWord] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('Chung');
  const [customTheme, setCustomTheme] = useState('');
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedWordData | null>(null);
  const [error, setError] = useState('');

  // Combine default and user themes unique
  const allThemes = Array.from(new Set([...DEFAULT_THEMES, ...existingThemes]));

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
    setInputWord('');
    setResult(null);
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
               <select 
                 value={isCustomTheme ? 'custom' : selectedTheme}
                 onChange={(e) => {
                   if (e.target.value === 'custom') {
                     setIsCustomTheme(true);
                   } else {
                     setIsCustomTheme(false);
                     setSelectedTheme(e.target.value);
                   }
                 }}
                 className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
               >
                 {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
                 <option value="custom">+ Thêm chủ đề mới</option>
               </select>
             </div>
             
             {isCustomTheme && (
               <div className="flex-1">
                 <label className="block text-xs font-semibold text-gray-500 mb-1">Tên chủ đề mới</label>
                 <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="Nhập tên chủ đề..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                 />
               </div>
             )}
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
                <Volume2 className="w-4 h-4" />
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
              <p className="text-gray-700 mt-1 italic">"{result.example}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnTab;