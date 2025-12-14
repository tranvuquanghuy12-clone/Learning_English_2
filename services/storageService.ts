import { QuizResult, WordEntry, UserProfile } from "../types";

const WORDS_KEY = "gemini_eng_words";
const STATS_KEY = "gemini_eng_stats";
const PROFILE_KEY = "gemini_eng_profile";

// --- Local Storage Helpers ---

export const getStoredWords = (): WordEntry[] => {
  try {
    const data = localStorage.getItem(WORDS_KEY);
    // Migration: Add default theme if missing
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map((w: any) => ({ ...w, theme: w.theme || 'General' }));
  } catch (e) {
    console.error("Failed to load words", e);
    return [];
  }
};

export const saveStoredWords = (words: WordEntry[]) => {
  localStorage.setItem(WORDS_KEY, JSON.stringify(words));
};

export const getStoredStats = (): QuizResult[] => {
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load stats", e);
    return [];
  }
};

export const saveStoredStats = (stats: QuizResult[]) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const getStoredProfile = (): UserProfile => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : { xp: 0, level: 1, unlockedBadges: [] };
  } catch (e) {
    return { xp: 0, level: 1, unlockedBadges: [] };
  }
};

export const saveStoredProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

// --- CSV Helpers ---

export const exportToCSV = (words: WordEntry[]) => {
  const headers = ["ID", "Word", "Pronunciation", "Meaning", "Explanation", "Example", "Theme", "AddedAt"];
  const rows = words.map(w => [
    `"${w.id}"`,
    `"${w.word.replace(/"/g, '""')}"`,
    `"${w.pronunciation.replace(/"/g, '""')}"`,
    `"${w.meaning.replace(/"/g, '""')}"`,
    `"${w.explanation.replace(/"/g, '""')}"`,
    `"${w.example.replace(/"/g, '""')}"`,
    `"${w.theme ? w.theme.replace(/"/g, '""') : 'General'}"`,
    `"${new Date(w.addedAt).toISOString()}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `english_notebook_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
