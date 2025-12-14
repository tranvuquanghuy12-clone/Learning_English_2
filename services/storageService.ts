import { QuizResult, WordEntry, UserProfile } from "../types";

const WORDS_KEY = "gemini_eng_words";
const STATS_KEY = "gemini_eng_stats";
const PROFILE_KEY = "gemini_eng_profile";
// New key to store the full list of active themes (not just custom ones)
const THEMES_KEY = "gemini_eng_active_themes_v1"; 

export const DEFAULT_THEMES = ["Chung", "Giao tiếp", "Kinh doanh", "Du lịch", "Công nghệ", "Ẩm thực", "Y tế"];

// --- Local Storage Helpers ---

export const getStoredWords = (): WordEntry[] => {
  try {
    const data = localStorage.getItem(WORDS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map((w: any) => ({ ...w, theme: w.theme || 'Chung' }));
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

export const getStoredThemes = (): string[] => {
  try {
    const data = localStorage.getItem(THEMES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    
    // MIGRATION: If no new theme data, check for old custom themes and merge with defaults
    const oldKey = "gemini_eng_custom_themes";
    const oldData = localStorage.getItem(oldKey);
    let initialThemes = [...DEFAULT_THEMES];
    
    if (oldData) {
      const oldCustom = JSON.parse(oldData);
      initialThemes = Array.from(new Set([...initialThemes, ...oldCustom]));
    }
    
    // Save immediately to the new key
    saveStoredThemes(initialThemes);
    return initialThemes;
  } catch (e) {
    return DEFAULT_THEMES;
  }
};

export const saveStoredThemes = (themes: string[]) => {
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes));
};

// --- CSV Helper Utilities ---

const escapeCSV = (field: string | number): string => {
  if (field === null || field === undefined) return '';
  const stringField = String(field);
  if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'; 
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

// --- Export & Import Logic ---

export const exportAllDataToCSV = (words: WordEntry[], stats: QuizResult[], profile: UserProfile, themes: string[]) => {
  let csvContent = "";

  // SECTION 1: PROFILE
  csvContent += "SECTION:PROFILE\n";
  csvContent += "xp,level,unlockedBadges\n";
  csvContent += `${profile.xp},${profile.level},"${profile.unlockedBadges.join('|')}"\n\n`;

  // SECTION 2: WORDS
  csvContent += "SECTION:WORDS\n";
  csvContent += "id,word,pronunciation,meaning,explanation,example,theme,addedAt\n";
  words.forEach(w => {
    const row = [
      w.id,
      w.word,
      w.pronunciation,
      w.meaning,
      w.explanation,
      w.example,
      w.theme || 'Chung',
      w.addedAt
    ].map(escapeCSV).join(",");
    csvContent += row + "\n";
  });
  csvContent += "\n";

  // SECTION 3: STATS
  csvContent += "SECTION:STATS\n";
  csvContent += "id,date,score,totalQuestions,xpEarned\n";
  stats.forEach(s => {
    const row = [
      s.id,
      s.date,
      s.score,
      s.totalQuestions,
      s.xpEarned || 0
    ].map(escapeCSV).join(",");
    csvContent += row + "\n";
  });
  csvContent += "\n";

  // SECTION 4: THEMES
  csvContent += "SECTION:THEMES\n";
  csvContent += "themes_json\n";
  csvContent += `${escapeCSV(JSON.stringify(themes))}\n`;

  // Create Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `gemini_english_backup_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importFromCSV = async (file: File): Promise<{ words: WordEntry[], stats: QuizResult[], profile: UserProfile, themes: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        reject("File is empty");
        return;
      }

      try {
        const lines = text.split('\n');
        let currentSection = '';
        
        let newProfile: UserProfile = { xp: 0, level: 1, unlockedBadges: [] };
        const newWords: WordEntry[] = [];
        const newStats: QuizResult[] = [];
        let newThemes: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (line.startsWith('SECTION:')) {
            currentSection = line.split(':')[1];
            i++; 
            continue;
          }

          const cols = parseCSVLine(line);

          if (currentSection === 'PROFILE') {
            if (cols.length >= 3) {
               newProfile = {
                 xp: parseInt(cols[0]) || 0,
                 level: parseInt(cols[1]) || 1,
                 unlockedBadges: cols[2] ? cols[2].split('|').filter(b => b) : []
               };
            }
          } else if (currentSection === 'WORDS') {
            if (cols.length >= 6) {
              newWords.push({
                id: cols[0] || Date.now().toString(),
                word: cols[1],
                pronunciation: cols[2],
                meaning: cols[3],
                explanation: cols[4],
                example: cols[5],
                theme: cols[6] || 'Chung',
                addedAt: parseInt(cols[7]) || Date.now()
              });
            }
          } else if (currentSection === 'STATS') {
            if (cols.length >= 4) {
              newStats.push({
                id: cols[0],
                date: cols[1],
                score: parseInt(cols[2]),
                totalQuestions: parseInt(cols[3]),
                xpEarned: parseInt(cols[4]) || 0
              });
            }
          } else if (currentSection === 'THEMES') {
            if (cols.length >= 1) {
              try {
                const parsed = JSON.parse(cols[0]);
                if (Array.isArray(parsed)) {
                  newThemes = parsed;
                }
              } catch (e) {
                if (cols[0].includes('|') || cols[0].length > 0) {
                  newThemes = cols[0].split('|').filter(t => t);
                }
              }
            }
          }
        }

        // AUTO-DISCOVERY: Scan words for any themes not in the list (in case they were manually edited or legacy)
        // AND ensuring DEFAULT_THEMES are present is NO LONGER forced, user allows deleting defaults.
        // We only add a theme if a word explicitly uses it.
        const existingThemeSet = new Set(newThemes);
        newWords.forEach(w => {
          if (w.theme && !existingThemeSet.has(w.theme)) {
            newThemes.push(w.theme);
            existingThemeSet.add(w.theme);
          }
        });
        
        // Ensure "Chung" always exists as fallback
        if (!existingThemeSet.has("Chung")) {
             newThemes.unshift("Chung");
        }

        saveStoredProfile(newProfile);
        saveStoredWords(newWords);
        saveStoredStats(newStats);
        saveStoredThemes(newThemes);

        resolve({ words: newWords, stats: newStats, profile: newProfile, themes: newThemes });

      } catch (err) {
        console.error("Parse Error", err);
        reject("Lỗi định dạng file CSV");
      }
    };

    reader.onerror = () => reject("Error reading file");
    reader.readAsText(file);
  });
};