import { Badge, QuizResult, UserProfile, WordEntry } from "../types";

export const LEVELS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 300 },
  { level: 4, xp: 600 },
  { level: 5, xp: 1000 },
  { level: 6, xp: 1500 },
  { level: 7, xp: 2200 },
  { level: 8, xp: 3000 },
  { level: 9, xp: 4000 },
  { level: 10, xp: 5500 },
];

export const BADGES: Badge[] = [
  {
    id: "novice_scholar",
    name: "Tập sự",
    description: "Học 5 từ mới",
    icon: "🌱",
    condition: (stats) => stats.words >= 5
  },
  {
    id: "vocabulary_collector",
    name: "Nhà sưu tầm",
    description: "Học 20 từ mới",
    icon: "📚",
    condition: (stats) => stats.words >= 20
  },
  {
    id: "quiz_starter",
    name: "Người thử thách",
    description: "Hoàn thành 3 bài kiểm tra",
    icon: "🎯",
    condition: (stats) => stats.quizzes >= 3
  },
  {
    id: "perfectionist",
    name: "Hoàn hảo",
    description: "Đạt điểm tuyệt đối trong 1 bài kiểm tra",
    icon: "⭐",
    condition: (stats) => stats.perfectScores >= 1
  },
  {
    id: "word_master",
    name: "Bậc thầy từ vựng",
    description: "Học 50 từ mới",
    icon: "👑",
    condition: (stats) => stats.words >= 50
  }
];

export const calculateLevel = (currentXp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (currentXp >= LEVELS[i].xp) {
      level = LEVELS[i].level;
    } else {
      break;
    }
  }
  return level;
};

export const getNextLevelXp = (level: number): number => {
  const next = LEVELS.find(l => l.level === level + 1);
  return next ? next.xp : LEVELS[LEVELS.length - 1].xp * 1.5;
};

export const checkNewBadges = (
  currentProfile: UserProfile, 
  words: WordEntry[], 
  stats: QuizResult[]
): string[] => {
  const statsData = {
    words: words.length,
    quizzes: stats.length,
    perfectScores: stats.filter(s => s.score === s.totalQuestions).length
  };

  const newBadges: string[] = [];
  
  BADGES.forEach(badge => {
    if (!currentProfile.unlockedBadges.includes(badge.id)) {
      if (badge.condition(statsData)) {
        newBadges.push(badge.id);
      }
    }
  });

  return newBadges;
};
