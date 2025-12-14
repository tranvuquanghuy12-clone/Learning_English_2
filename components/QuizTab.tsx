import React, { useState, useMemo } from 'react';
import { WordEntry, QuizResult } from '../types';
import Button from './Button';
import { CheckCircle, XCircle, Trophy, Keyboard, List, Settings, Play, Check, Filter, RefreshCcw } from 'lucide-react';

interface QuizTabProps {
  words: WordEntry[];
  onFinishQuiz: (result: QuizResult, xpEarned: number) => void;
}

type QuestionType = 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'TYPING';
type QuizStep = 'SETUP' | 'PLAYING' | 'RESULT';

interface Question {
  type: QuestionType;
  wordEntry: WordEntry;
  options?: string[]; // For Multiple Choice and Fill Blank
  correctAnswer: string; // Meaning for MC, Word for Typing/Blank
  questionText: string;
}

const QuizTab: React.FC<QuizTabProps> = ({ words, onFinishQuiz }) => {
  const [step, setStep] = useState<QuizStep>('SETUP');
  
  // Setup State
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  
  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  
  // Input State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [typingInput, setTypingInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [xpEarned, setXpEarned] = useState(0);

  // Derive unique themes from the actual word list
  const availableThemes = useMemo(() => {
    const themes = new Set(words.map(w => w.theme || 'Chung'));
    return Array.from(themes);
  }, [words]);

  // Initialize selected themes when availableThemes changes (default to all)
  React.useEffect(() => {
    if (availableThemes.length > 0 && selectedThemes.length === 0) {
      setSelectedThemes(availableThemes);
    }
  }, [availableThemes]);

  // Calculate word count based on selection
  const filteredWords = useMemo(() => {
    return words.filter(w => selectedThemes.includes(w.theme || 'Chung'));
  }, [words, selectedThemes]);

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const toggleAllThemes = () => {
    if (selectedThemes.length === availableThemes.length) {
      setSelectedThemes([]);
    } else {
      setSelectedThemes(availableThemes);
    }
  };

  const startQuiz = () => {
    if (filteredWords.length < 4) return;
    generateQuestions(filteredWords);
    setStep('PLAYING');
  };

  const generateQuestions = (sourceWords: WordEntry[]) => {
    // Shuffle words and pick up to 10
    const shuffled = [...sourceWords].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, Math.min(10, shuffled.length));

    const newQuestions: Question[] = selectedWords.map((word) => {
      // Randomly pick question type
      const rand = Math.random();
      let type: QuestionType = 'MULTIPLE_CHOICE';
      if (rand > 0.66) type = 'TYPING';
      else if (rand > 0.33) type = 'FILL_BLANK';

      // Setup Logic based on type
      if (type === 'FILL_BLANK') {
        // Create distractors (other words from the FILTERED list)
        const distractors = sourceWords
          .filter(w => w.id !== word.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(w => w.word); // Options are English words
        
        const options = [...distractors, word.word].sort(() => 0.5 - Math.random());
        
        // Hide word in example
        const regex = new RegExp(word.word, 'gi');
        const maskedExample = word.example.replace(regex, '_______');

        return {
          type,
          wordEntry: word,
          options,
          correctAnswer: word.word,
          questionText: maskedExample
        };
      } 
      
      if (type === 'TYPING') {
         return {
           type,
           wordEntry: word,
           correctAnswer: word.word,
           questionText: word.meaning
         };
      }

      // Default: Multiple Choice
      const distractors = sourceWords
        .filter((w) => w.id !== word.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((w) => w.meaning);

      const options = [...distractors, word.meaning].sort(() => 0.5 - Math.random());
      
      return {
        type: 'MULTIPLE_CHOICE',
        wordEntry: word,
        options,
        correctAnswer: word.meaning,
        questionText: word.word
      };
    });

    setQuestions(newQuestions);
    setCurrentQIndex(0);
    setScore(0);
    setIsAnswered(false);
    setSelectedOption(null);
    setTypingInput('');
    setFeedback(null);
    setXpEarned(0);
  };

  const handleOptionClick = (option: string, index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    const isCorrect = option === questions[currentQIndex].correctAnswer;
    processAnswer(isCorrect);
  };

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered) return;
    
    const isCorrect = typingInput.trim().toLowerCase() === questions[currentQIndex].correctAnswer.toLowerCase();
    processAnswer(isCorrect);
  };

  const processAnswer = (isCorrect: boolean) => {
    setIsAnswered(true);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
        setIsAnswered(false);
        setSelectedOption(null);
        setTypingInput('');
        setFeedback(null);
      } else {
        finishQuiz(isCorrect ? score + 1 : score);
      }
    }, 1500);
  };

  const finishQuiz = (finalScore: number) => {
    // XP Logic
    const baseXp = finalScore * 10;
    const bonusXp = finalScore === questions.length ? 50 : 0;
    const totalXp = baseXp + bonusXp;
    
    setXpEarned(totalXp);
    setStep('RESULT');

    const result: QuizResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      score: finalScore,
      totalQuestions: questions.length,
      xpEarned: totalXp
    };
    onFinishQuiz(result, totalXp);
  };

  // --- RENDER: EMPTY STATE ---
  if (words.length < 4) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800">Cần thêm từ vựng</h3>
        <p className="text-gray-500 mt-2">Bạn cần ít nhất 4 từ trong sổ để bắt đầu kiểm tra.</p>
      </div>
    );
  }

  // --- RENDER: SETUP STEP ---
  if (step === 'SETUP') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Settings className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Cấu hình bài kiểm tra</h2>
          <p className="text-gray-500 mt-2">Chọn chủ đề bạn muốn ôn tập hôm nay</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
             <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
               <Filter className="w-4 h-4" /> Chủ đề ({availableThemes.length})
             </label>
             <button 
               onClick={toggleAllThemes}
               className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
             >
               {selectedThemes.length === availableThemes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
             </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {availableThemes.map(theme => {
               const isSelected = selectedThemes.includes(theme);
               return (
                 <button
                   key={theme}
                   onClick={() => toggleTheme(theme)}
                   className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                     isSelected 
                       ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                       : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                   }`}
                 >
                   {theme}
                   {isSelected && <Check className="w-3 h-3" />}
                 </button>
               )
            })}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div>
              <span className="text-gray-500 text-sm">Số lượng từ: </span>
              <span className={`font-bold text-lg ${filteredWords.length < 4 ? 'text-red-500' : 'text-gray-800'}`}>
                {filteredWords.length}
              </span>
              <span className="text-gray-400 text-xs ml-1">/ {words.length} từ</span>
              
              {filteredWords.length < 4 && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Cần tối thiểu 4 từ
                </p>
              )}
           </div>
           
           <Button 
             onClick={startQuiz} 
             disabled={filteredWords.length < 4}
             className="w-full sm:w-auto px-8 py-3 text-base shadow-md hover:shadow-lg"
           >
             <Play className="w-5 h-5" /> Bắt đầu ngay
           </Button>
        </div>
      </div>
    );
  }

  // --- RENDER: RESULT STEP ---
  if (step === 'RESULT') {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
          
          <div className="flex justify-center gap-4 my-6">
            <div className="bg-gray-50 rounded-xl p-4 min-w-[100px]">
              <div className="text-3xl font-black text-blue-600 mb-1">{score}/{questions.length}</div>
              <div className="text-xs font-bold text-gray-400 uppercase">Điểm số</div>
            </div>
             <div className="bg-yellow-50 rounded-xl p-4 min-w-[100px]">
              <div className="text-3xl font-black text-yellow-600 mb-1">+{xpEarned}</div>
              <div className="text-xs font-bold text-yellow-500 uppercase">XP</div>
            </div>
          </div>

          <div className="space-y-3">
             <Button onClick={() => startQuiz()} className="w-full py-3 text-lg">
               <RefreshCcw className="w-4 h-4" /> Làm lại bài này
             </Button>
             <Button onClick={() => setStep('SETUP')} variant="secondary" className="w-full py-3">
               <Settings className="w-4 h-4" /> Chọn chủ đề khác
             </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: PLAYING STEP ---
  if (questions.length === 0) return null;

  const currentQ = questions[currentQIndex];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <button 
            onClick={() => setStep('SETUP')} 
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3 h-3" /> Cấu hình
          </button>
           <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
             {currentQ.type === 'TYPING' && <Keyboard className="w-4 h-4"/>}
             {currentQ.type === 'MULTIPLE_CHOICE' && <List className="w-4 h-4"/>}
             {currentQ.type === 'FILL_BLANK' && <span className="font-mono text-xs border rounded px-1">...</span>}
             Câu {currentQIndex + 1}/{questions.length}
           </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-8 rounded-2xl shadow-md text-center mb-8 min-h-[200px] flex flex-col justify-center items-center">
        <span className="text-xs font-bold text-blue-500 uppercase tracking-wide bg-blue-50 px-3 py-1 rounded-full mb-4">
          {currentQ.type === 'MULTIPLE_CHOICE' && 'Chọn nghĩa đúng'}
          {currentQ.type === 'FILL_BLANK' && 'Điền từ vào chỗ trống'}
          {currentQ.type === 'TYPING' && 'Gõ từ tiếng Anh'}
        </span>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
           {currentQ.questionText}
        </h2>
        
        {currentQ.type === 'TYPING' && (
             <p className="text-gray-400 mt-2 italic">Gợi ý: {currentQ.wordEntry.word.length} ký tự</p>
        )}
      </div>

      {/* Answers Area */}
      {/* Type 1 & 2: Options */}
      {(currentQ.type === 'MULTIPLE_CHOICE' || currentQ.type === 'FILL_BLANK') && currentQ.options && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((option, idx) => {
            let stateStyles = "bg-white border-2 border-gray-200 hover:border-blue-400 text-gray-700";
            
            if (isAnswered) {
               if (option === currentQ.correctAnswer) {
                 stateStyles = "bg-green-50 border-2 border-green-500 text-green-700";
               } else if (idx === selectedOption) {
                 stateStyles = "bg-red-50 border-2 border-red-500 text-red-700";
               } else {
                 stateStyles = "bg-gray-50 border-2 border-gray-100 text-gray-400 opacity-50";
               }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(option, idx)}
                disabled={isAnswered}
                className={`p-6 rounded-xl text-lg font-medium transition-all duration-200 flex items-center justify-between ${stateStyles}`}
              >
                <span>{option}</span>
                {isAnswered && option === currentQ.correctAnswer && <CheckCircle className="w-6 h-6 text-green-600" />}
                {isAnswered && idx === selectedOption && option !== currentQ.correctAnswer && <XCircle className="w-6 h-6 text-red-600" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Type 3: Typing Input */}
      {currentQ.type === 'TYPING' && (
        <form onSubmit={handleTypingSubmit} className="max-w-md mx-auto">
          <div className="relative">
             <input
              type="text"
              autoFocus
              value={typingInput}
              onChange={(e) => setTypingInput(e.target.value)}
              disabled={isAnswered}
              className={`w-full p-4 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-800' :
                feedback === 'incorrect' ? 'border-red-500 bg-red-50 text-red-800' :
                'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Nhập đáp án..."
            />
            {isAnswered && feedback === 'correct' && (
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 w-6 h-6" />
            )}
            {isAnswered && feedback === 'incorrect' && (
               <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <span className="text-sm text-red-600 font-bold hidden sm:inline">{currentQ.correctAnswer}</span>
                 <XCircle className="text-red-600 w-6 h-6" />
               </div>
            )}
          </div>
          {!isAnswered && (
             <Button type="submit" className="w-full mt-4 py-3" disabled={!typingInput}>
               Kiểm tra
             </Button>
          )}
        </form>
      )}

      {isAnswered && (
        <div className="text-center mt-6 text-gray-400 text-sm animate-pulse">
          Đang chuyển câu hỏi...
        </div>
      )}
    </div>
  );
};

export default QuizTab;