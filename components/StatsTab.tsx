import React, { useRef, useState } from 'react';
import { QuizResult, WordEntry, UserProfile } from '../types';
import { BADGES, getNextLevelXp } from '../services/gamificationService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Lock, Trophy, Star, Upload, AlertCircle } from 'lucide-react';
import { exportAllDataToCSV, importFromCSV } from '../services/storageService';
import Button from './Button';

interface StatsTabProps {
  stats: QuizResult[];
  words: WordEntry[];
  userProfile: UserProfile;
  customThemes: string[];
  onDataImported: (data: { words: WordEntry[], stats: QuizResult[], profile: UserProfile, customThemes: string[] }) => void;
}

const StatsTab: React.FC<StatsTabProps> = ({ stats, words, userProfile, customThemes, onDataImported }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Process data for the chart
  const chartData = React.useMemo(() => {
    const groups: { [key: string]: { totalScore: number; count: number } } = {};
    stats.forEach(s => {
      const date = new Date(s.date).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });
      if (!groups[date]) groups[date] = { totalScore: 0, count: 0 };
      const percentage = (s.score / s.totalQuestions) * 10;
      groups[date].totalScore += percentage;
      groups[date].count += 1;
    });
    return Object.keys(groups).map(date => ({
      date,
      avgScore: parseFloat((groups[date].totalScore / groups[date].count).toFixed(1))
    })).slice(-7);
  }, [stats]);

  const nextLevelXp = getNextLevelXp(userProfile.level);
  const xpProgress = Math.min((userProfile.xp / nextLevelXp) * 100, 100);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const newData = await importFromCSV(file);
      onDataImported(newData);
      alert("Nhập dữ liệu thành công!");
    } catch (err) {
      setImportError(typeof err === 'string' ? err : "Đã xảy ra lỗi khi đọc file");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Profile / Gamification Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Trophy className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
           <div className="flex flex-col items-center">
             <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                <span className="text-4xl font-black">{userProfile.level}</span>
             </div>
             <span className="mt-2 font-bold tracking-wider text-blue-100">CẤP ĐỘ</span>
           </div>

           <div className="flex-1 w-full">
             <div className="flex justify-between items-end mb-2">
               <h3 className="text-2xl font-bold">Hồ sơ người học</h3>
               <span className="text-blue-200 font-mono">{userProfile.xp} / {nextLevelXp} XP</span>
             </div>
             
             <div className="w-full bg-black/20 rounded-full h-4 backdrop-blur-sm overflow-hidden">
               <div 
                 className="bg-yellow-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                 style={{ width: `${xpProgress}%` }}
               ></div>
             </div>
             <p className="mt-3 text-blue-100 text-sm">Hãy hoàn thành thêm bài kiểm tra để tăng cấp!</p>
           </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" /> Huy hiệu của bạn
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {BADGES.map(badge => {
            const isUnlocked = userProfile.unlockedBadges.includes(badge.id);
            return (
              <div 
                key={badge.id} 
                className={`flex flex-col items-center text-center p-4 rounded-xl border ${
                  isUnlocked ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 ${
                  isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-200 grayscale'
                }`}>
                  {badge.icon}
                </div>
                <h4 className={`font-bold text-sm ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>{badge.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                {!isUnlocked && <Lock className="w-3 h-3 text-gray-400 mt-2" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts & Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Hiệu suất học tập (7 ngày qua)</h3>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 10]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Bar dataKey="avgScore" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Điểm TB" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu kiểm tra</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Sao lưu & Khôi phục</h3>
          <p className="text-gray-500 text-sm mb-6">Lưu toàn bộ tiến trình học tập (từ vựng, điểm số, cấp độ) vào file hoặc khôi phục từ file có sẵn.</p>
          
          <div className="space-y-3">
            <Button onClick={() => exportAllDataToCSV(words, stats, userProfile, customThemes)} variant="primary" className="w-full">
              <Download className="w-5 h-5" /> Tải xuống CSV
            </Button>
            
            <div className="relative">
               <input 
                 type="file" 
                 ref={fileInputRef}
                 accept=".csv"
                 onChange={handleFileChange}
                 className="hidden"
               />
               <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full" isLoading={isImporting}>
                  <Upload className="w-5 h-5" /> Nhập file CSV
               </Button>
            </div>
            {importError && (
              <div className="flex items-center gap-2 text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
                <AlertCircle className="w-4 h-4" /> {importError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;