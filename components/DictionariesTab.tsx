import React, { useState } from 'react';
import { WordEntry } from '../types';
import Button from './Button';
import { Book, Edit2, Trash2, Plus, Save, X, Library } from 'lucide-react';

interface DictionariesTabProps {
  themes: string[];
  words: WordEntry[];
  onAddTheme: (name: string) => void;
  onRenameTheme: (oldName: string, newName: string) => void;
  onDeleteTheme: (name: string) => void;
}

const DictionariesTab: React.FC<DictionariesTabProps> = ({ 
  themes, 
  words, 
  onAddTheme, 
  onRenameTheme, 
  onDeleteTheme 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Count words per theme
  const getWordCount = (themeName: string) => {
    return words.filter(w => (w.theme || 'Chung') === themeName).length;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newThemeName.trim()) {
      onAddTheme(newThemeName.trim());
      setNewThemeName('');
      setIsAdding(false);
    }
  };

  const startEdit = (theme: string) => {
    setEditingTheme(theme);
    setEditValue(theme);
  };

  const saveEdit = () => {
    if (editValue.trim() && editValue !== editingTheme && editingTheme) {
      onRenameTheme(editingTheme, editValue.trim());
    }
    setEditingTheme(null);
    setEditValue('');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Library className="w-6 h-6 text-blue-600" />
            Quản lý Bộ Từ Điển
          </h2>
          <p className="text-gray-500 mt-1">Tạo các bộ từ điển riêng biệt để học tập trung hơn.</p>
        </div>
        
        <Button onClick={() => setIsAdding(true)} className="shadow-md">
          <Plus className="w-5 h-5" /> Thêm bộ từ điển
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 animate-in slide-in-from-top-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tên bộ từ điển mới</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="Ví dụ: IELTS Writing, Từ vựng Y Khoa..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              autoFocus
            />
            <Button type="submit" className="bg-green-600 hover:bg-green-700">Lưu</Button>
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Huỷ</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map(theme => (
          <div key={theme} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            {/* Decorative spine */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500"></div>
            
            <div className="p-5 pl-7">
              {editingTheme === theme ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-2 border border-blue-300 rounded text-sm focus:outline-none"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save className="w-4 h-4"/></button>
                  <button onClick={() => setEditingTheme(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1" title={theme}>{theme}</h3>
                    <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                      <Book className="w-4 h-4" />
                      <span>{getWordCount(theme)} từ vựng</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2 border-t border-gray-100 pt-4">
                 <button 
                    onClick={() => startEdit(theme)}
                    className="flex-1 py-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
                 >
                   <Edit2 className="w-3 h-3" /> Đổi tên
                 </button>
                 
                 {theme !== 'Chung' && (
                   <button 
                      onClick={() => onDeleteTheme(theme)}
                      className="flex-1 py-2 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
                   >
                     <Trash2 className="w-3 h-3" /> Xoá bộ
                   </button>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DictionariesTab;