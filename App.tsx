import React, { useState, useEffect } from 'react';
import { Tab, WordEntry, QuizResult, UserProfile } from './types';
import { 
  getStoredWords, saveStoredWords, 
  getStoredStats, saveStoredStats, 
  getStoredProfile, saveStoredProfile, 
  getStoredThemes, saveStoredThemes 
} from './services/storageService';
import { calculateLevel, checkNewBadges, BADGES } from './services/gamificationService';
import LearnTab from './components/LearnTab';
import FlashcardTab from './components/FlashcardTab';
import QuizTab from './components/QuizTab';
import StatsTab from './components/StatsTab';
import DictionariesTab from './components/DictionariesTab';
import { Book, GraduationCap, LayoutDashboard, BrainCircuit, Library } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LEARN);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [stats, setStats] = useState<QuizResult[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ xp: 0, level: 1, unlockedBadges: [] });
  const [themes, setThemes] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize data from storage
  useEffect(() => {
    setWords(getStoredWords());
    setStats(getStoredStats());
    setUserProfile(getStoredProfile());
    setThemes(getStoredThemes());
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateGamification = (newProfile: UserProfile, currentWords: WordEntry[], currentStats: QuizResult[]) => {
    // Check for level up
    const newLevel = calculateLevel(newProfile.xp);
    if (newLevel > newProfile.level) {
      showNotification(`🎉 Chúc mừng! Bạn đã lên cấp ${newLevel}!`);
      newProfile.level = newLevel;
    }

    // Check for badges
    const newBadges = checkNewBadges(newProfile, currentWords, currentStats);
    if (newBadges.length > 0) {
      newProfile.unlockedBadges = [...newProfile.unlockedBadges, ...newBadges];
      const badgeNames = newBadges.map(id => BADGES.find(b => b.id === id)?.name).join(", ");
      setTimeout(() => showNotification(`🏆 Huy hiệu mới: ${badgeNames}`), 500); // Slight delay after level up
    }

    setUserProfile(newProfile);
    saveStoredProfile(newProfile);
  };

  const handleAddWord = (word: WordEntry) => {
    const updatedWords = [word, ...words];
    setWords(updatedWords);
    saveStoredWords(updatedWords);

    // If word uses a theme not in our list, add it automatically
    if (word.theme && !themes.includes(word.theme)) {
      const newThemes = [...themes, word.theme];
      setThemes(newThemes);
      saveStoredThemes(newThemes);
    }

    // XP Reward for adding word
    const newProfile = { ...userProfile, xp: userProfile.xp + 10 };
    updateGamification(newProfile, updatedWords, stats);
  };

  const handleAddTheme = (newTheme: string) => {
    if (themes.includes(newTheme)) {
      showNotification("Tên bộ từ điển đã tồn tại!");
      return;
    }
    const updatedThemes = [...themes, newTheme];
    setThemes(updatedThemes);
    saveStoredThemes(updatedThemes);
    showNotification(`Đã tạo bộ từ điển: ${newTheme}`);
  };

  const handleRenameTheme = (oldName: string, newName: string) => {
    if (themes.includes(newName)) {
      showNotification("Tên mới đã tồn tại, vui lòng chọn tên khác.");
      return;
    }

    // 1. Update Themes List
    const updatedThemes = themes.map(t => t === oldName ? newName : t);
    setThemes(updatedThemes);
    saveStoredThemes(updatedThemes);

    // 2. Update all words belonging to this theme
    const updatedWords = words.map(w => w.theme === oldName ? { ...w, theme: newName } : w);
    setWords(updatedWords);
    saveStoredWords(updatedWords);

    showNotification("Đã đổi tên thành công!");
  };

  // Improved Delete: Deletes the theme AND the words inside it (cleanup)
  const handleDeleteThemeWithCleanup = (themeToDelete: string) => {
    if (themeToDelete === 'Chung') {
      showNotification("Không thể xoá bộ mặc định 'Chung'");
      return;
    }
    
    const count = words.filter(w => w.theme === themeToDelete).length;
    
    if (confirm(`Bạn có chắc muốn xoá bộ từ điển "${themeToDelete}"?\n\n⚠️ CẢNH BÁO: Hành động này sẽ xoá vĩnh viễn ${count} từ vựng thuộc bộ này.`)) {
      // 1. Remove Theme
      const newThemes = themes.filter(t => t !== themeToDelete);
      setThemes(newThemes);
      saveStoredThemes(newThemes);

      // 2. Remove Words
      const newWords = words.filter(w => w.theme !== themeToDelete);
      setWords(newWords);
      saveStoredWords(newWords);

      showNotification(`Đã xoá bộ từ điển và ${count} từ liên quan.`);
    }
  };

  // Legacy delete for LearnTab (keeps words but moves logic slightly, or we can reuse the cleanup logic if desired. 
  // Based on user request "remove dictionary", cleanup is better.)
  const handleQuickDeleteTheme = (themeToDelete: string): boolean => {
     if (themeToDelete === 'Chung') return false;
     
     // Reuse logic but return boolean for LearnTab UI
     if (confirm(`Xoá chủ đề "${themeToDelete}" và toàn bộ từ vựng bên trong?`)) {
        const newThemes = themes.filter(t => t !== themeToDelete);
        setThemes(newThemes);
        saveStoredThemes(newThemes);
        
        const newWords = words.filter(w => w.theme !== themeToDelete);
        setWords(newWords);
        saveStoredWords(newWords);
        return true;
     }
     return false;
  };

  const handleFinishQuiz = (result: QuizResult, xpEarned: number) => {
    const updatedStats = [...stats, result];
    setStats(updatedStats);
    saveStoredStats(updatedStats);

    // XP Reward for quiz
    const newProfile = { ...userProfile, xp: userProfile.xp + xpEarned };
    updateGamification(newProfile, words, updatedStats);
  };

  const handleDataImported = (data: { words: WordEntry[], stats: QuizResult[], profile: UserProfile, themes: string[] }) => {
    setWords(data.words);
    setStats(data.stats);
    setUserProfile(data.profile);
    setThemes(data.themes);
    showNotification("📂 Dữ liệu đã được khôi phục thành công!");
  };

  const navItems = [
    { id: Tab.LEARN, label: 'Học từ', icon: <Book className="w-5 h-5" /> },
    { id: Tab.DICTIONARY, label: 'Bộ từ điển', icon: <Library className="w-5 h-5" /> },
    { id: Tab.FLASHCARD, label: 'Thẻ nhớ', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: Tab.QUIZ, label: 'Kiểm tra', icon: <GraduationCap className="w-5 h-5" /> },
    { id: Tab.STATS, label: 'Thống kê', icon: <LayoutDashboard className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-[100] bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl animate-fade-in flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Header - Increased z-index to 50 to cover scrolling content */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              G
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gemini English</h1>
            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
              LV {userProfile.level}
            </span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content - Using display utility classes to keep components mounted (cached) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className={activeTab === Tab.LEARN ? 'block' : 'hidden'}>
          <LearnTab 
            onAddWord={handleAddWord} 
            themes={themes} 
            onDeleteTheme={handleQuickDeleteTheme}
          />
        </div>
        
        <div className={activeTab === Tab.DICTIONARY ? 'block' : 'hidden'}>
          <DictionariesTab
            themes={themes}
            words={words}
            onAddTheme={handleAddTheme}
            onRenameTheme={handleRenameTheme}
            onDeleteTheme={handleDeleteThemeWithCleanup}
          />
        </div>

        <div className={activeTab === Tab.FLASHCARD ? 'block' : 'hidden'}>
          <FlashcardTab words={words} themes={themes} />
        </div>

        <div className={activeTab === Tab.QUIZ ? 'block' : 'hidden'}>
          <QuizTab words={words} onFinishQuiz={handleFinishQuiz} />
        </div>

        <div className={activeTab === Tab.STATS ? 'block' : 'hidden'}>
          <StatsTab 
            stats={stats} 
            words={words} 
            userProfile={userProfile} 
            themes={themes}
            onDataImported={handleDataImported} 
          />
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-10 pb-safe">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="truncate w-full text-center px-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;