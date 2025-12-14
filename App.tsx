import React, { useState, useEffect } from 'react';
import { Tab, WordEntry, QuizResult, UserProfile } from './types';
import { getStoredWords, saveStoredWords, getStoredStats, saveStoredStats, getStoredProfile, saveStoredProfile } from './services/storageService';
import { calculateLevel, checkNewBadges, BADGES } from './services/gamificationService';
import LearnTab from './components/LearnTab';
import FlashcardTab from './components/FlashcardTab';
import QuizTab from './components/QuizTab';
import StatsTab from './components/StatsTab';
import { Book, GraduationCap, LayoutDashboard, BrainCircuit } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LEARN);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [stats, setStats] = useState<QuizResult[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ xp: 0, level: 1, unlockedBadges: [] });
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize data from storage
  useEffect(() => {
    setWords(getStoredWords());
    setStats(getStoredStats());
    setUserProfile(getStoredProfile());
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

    // XP Reward for adding word
    const newProfile = { ...userProfile, xp: userProfile.xp + 10 };
    updateGamification(newProfile, updatedWords, stats);
  };

  const handleFinishQuiz = (result: QuizResult, xpEarned: number) => {
    const updatedStats = [...stats, result];
    setStats(updatedStats);
    saveStoredStats(updatedStats);

    // XP Reward for quiz
    const newProfile = { ...userProfile, xp: userProfile.xp + xpEarned };
    updateGamification(newProfile, words, updatedStats);
  };

  const existingThemes = Array.from(new Set(words.map(w => w.theme || 'General')));

  const navItems = [
    { id: Tab.LEARN, label: 'Học từ', icon: <Book className="w-5 h-5" /> },
    { id: Tab.FLASHCARD, label: 'Thẻ nhớ', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: Tab.QUIZ, label: 'Kiểm tra', icon: <GraduationCap className="w-5 h-5" /> },
    { id: Tab.STATS, label: 'Thống kê', icon: <LayoutDashboard className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl animate-fade-in flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {activeTab === Tab.LEARN && <LearnTab onAddWord={handleAddWord} existingThemes={existingThemes} />}
        {activeTab === Tab.FLASHCARD && <FlashcardTab words={words} />}
        {activeTab === Tab.QUIZ && <QuizTab words={words} onFinishQuiz={handleFinishQuiz} />}
        {activeTab === Tab.STATS && <StatsTab stats={stats} words={words} userProfile={userProfile} />}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-10 pb-safe">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;