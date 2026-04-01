/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  MessageCircle, 
  ShieldAlert, 
  Trophy, 
  Home, 
  User, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Sparkles,
  Send,
  Volume2,
  Heart,
  Diamond,
  Target,
  Medal,
  PlayCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { Lesson, LessonStep, LESSONS, UserProgress } from './types';

// --- AI Service ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `
당신은 70대 어르신들을 위한 다정한 디지털 도우미 '은빛 부엉이'입니다.
어르신들이 스마트폰, 키오스크, 카카오톡 등 디지털 기기 사용법을 물어볼 때, 
다음 원칙을 지켜 답변해주세요:
1. 아주 쉬운 단어를 사용하세요 (예: '아이콘' 대신 '그림 버튼', '탭' 대신 '살짝 누르기').
2. 한 번에 하나씩만 설명하세요.
3. 따뜻하고 격려하는 말투를 사용하세요 (예: "천천히 하셔도 괜찮아요!", "정말 잘하고 계세요!").
4. 비유를 활용하세요 (예: "카카오톡은 종이 편지 대신 핸드폰으로 보내는 편지예요").
5. 답변은 3문장 이내로 짧게 하세요.
`;

// --- Helpers ---
const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.85; // Slightly slower for seniors
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
};

// --- Components ---

const Mascot = ({ mood = 'happy' }: { mood?: 'happy' | 'thinking' | 'celebrating' | 'sad' | 'shocked' }) => {
  const getEmoji = () => {
    switch (mood) {
      case 'thinking': return '🧐';
      case 'celebrating': return '🥳';
      case 'sad': return '😥';
      case 'shocked': return '😱';
      default: return '🦉';
    }
  };

  return (
    <motion.div 
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-6xl mb-4 flex flex-col items-center"
    >
      <div className="bg-orange-100 p-6 rounded-full border-4 border-orange-400 shadow-lg">
        {getEmoji()}
      </div>
      <span className="text-sm font-bold mt-2 text-orange-800 bg-orange-200 px-3 py-1 rounded-full">은빛 부엉이</span>
    </motion.div>
  );
};

const Header = ({ progress }: { progress: UserProgress }) => (
  <header className="fixed top-0 left-0 right-0 bg-white border-b-4 border-gray-100 p-4 flex justify-between items-center z-50">
    <div className="flex items-center gap-2">
      <div className="bg-orange-500 p-2 rounded-lg">
        <Smartphone className="text-white w-6 h-6" />
      </div>
      <h1 className="text-2xl font-black text-gray-800 tracking-tight hidden sm:block">실버링크</h1>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full border-2 border-red-200">
        <Heart className="text-red-500 w-5 h-5 fill-red-500" />
        <span className="font-bold text-red-700">{progress.hearts}</span>
      </div>
      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border-2 border-blue-200">
        <Diamond className="text-blue-500 w-5 h-5 fill-blue-500" />
        <span className="font-bold text-blue-700">{progress.gems}</span>
      </div>
      <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full border-2 border-orange-200">
        <span className="text-lg">🔥</span>
        <span className="font-bold text-orange-700">{progress.currentStreak}</span>
      </div>
    </div>
  </header>
);

const LessonPath = ({ onSelectLesson, completedLessons }: { onSelectLesson: (l: Lesson) => void, completedLessons: string[] }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone': return <Smartphone className="w-8 h-8" />;
      case 'MessageCircle': return <MessageCircle className="w-8 h-8" />;
      case 'ShieldAlert': return <ShieldAlert className="w-8 h-8" />;
      case 'Youtube': return <PlayCircle className="w-8 h-8" />;
      default: return <Smartphone className="w-8 h-8" />;
    }
  };

  return (
    <div className="pt-24 pb-32 flex flex-col items-center gap-12 max-w-md mx-auto px-6">
      <div className="w-full bg-orange-100 border-4 border-orange-300 rounded-3xl p-6 mb-4 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-20">
          <Smartphone className="w-32 h-32" />
        </div>
        <h2 className="text-2xl font-black text-orange-900 mb-2">1단계: 스마트폰 첫걸음</h2>
        <p className="text-orange-800 font-bold">기초부터 차근차근 배워보아요!</p>
      </div>

      {LESSONS.map((lesson, index) => {
        const isCompleted = completedLessons.includes(lesson.id);
        const isNext = index === 0 || completedLessons.includes(LESSONS[index - 1].id);
        
        return (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
            style={{ marginLeft: index % 2 === 0 ? '0' : index % 4 === 1 ? '80px' : '-80px' }}
          >
            {/* Path Line */}
            {index < LESSONS.length - 1 && (
              <svg className="absolute top-16 left-1/2 w-32 h-32 -z-10" style={{ transform: index % 4 === 0 ? 'translateX(-20%)' : index % 4 === 1 ? 'translateX(-80%) scaleX(-1)' : index % 4 === 2 ? 'translateX(-80%) scaleX(-1)' : 'translateX(-20%)' }}>
                <path d="M 20 0 Q 20 60 80 60 T 140 120" fill="transparent" stroke={isCompleted ? "#fb923c" : "#e5e7eb"} strokeWidth="16" strokeLinecap="round" strokeDasharray="0 24" />
              </svg>
            )}

            <motion.button
              whileHover={isNext ? { scale: 1.05 } : {}}
              whileTap={isNext ? { scale: 0.95 } : {}}
              onClick={() => isNext && onSelectLesson(lesson)}
              className={`
                relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border-b-8 transition-all
                ${isCompleted ? 'bg-orange-500 border-orange-700 text-white' : 
                  isNext ? 'bg-purple-500 border-purple-700 text-white shadow-xl ring-4 ring-purple-200 ring-offset-4' : 
                  'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'}
              `}
            >
              {getIcon(lesson.icon)}
              
              {/* Progress Ring for Next Lesson */}
              {isNext && !isCompleted && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="8" strokeDasharray="289" strokeDashoffset="289" className="animate-[dash_2s_ease-out_forwards]" />
                </svg>
              )}

              {isCompleted && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 border-2 border-orange-500">
                  <CheckCircle2 className="text-orange-500 w-6 h-6" />
                </div>
              )}
              
              {/* Crown for completed */}
              {isCompleted && (
                <div className="absolute -top-8 text-3xl animate-bounce">👑</div>
              )}
            </motion.button>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 text-center">
              <span className={`text-lg font-bold ${isNext ? 'text-gray-800' : 'text-gray-400'}`}>
                {lesson.title}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const LessonView = ({ 
  lesson, 
  hearts,
  onComplete, 
  onWrongAnswer,
  onCancel,
  onRefillHearts
}: { 
  lesson: Lesson, 
  hearts: number,
  onComplete: (points: number, gems: number) => void, 
  onWrongAnswer: () => void,
  onCancel: () => void,
  onRefillHearts: () => void
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const step = lesson.steps[currentStepIdx];

  // Auto-read question when step changes
  useEffect(() => {
    if (step && !isFinished) {
      speak(step.content);
    }
  }, [currentStepIdx, step, isFinished]);

  if (hearts <= 0) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6">
        <Mascot mood="shocked" />
        <h2 className="text-3xl font-black text-gray-800 mt-6 mb-4 text-center">하트가 모두 소진되었어요!</h2>
        <p className="text-xl text-gray-600 text-center mb-8 font-bold">조금 쉬었다가 다시 도전하거나,<br/>보석을 사용해 하트를 채울 수 있어요.</p>
        
        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={onRefillHearts}
            className="w-full py-5 text-2xl font-black rounded-2xl border-b-8 bg-blue-500 border-blue-700 text-white flex items-center justify-center gap-2 active:translate-y-1"
          >
            <Diamond className="w-8 h-8 fill-white" /> 보석 50개로 채우기
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-5 text-2xl font-black rounded-2xl border-b-8 bg-gray-200 border-gray-300 text-gray-700 active:translate-y-1"
          >
            나중에 하기
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-yellow-50 to-orange-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-9xl mb-8"
        >
          🏆
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black text-orange-600 mb-8 text-center"
        >
          학습 완료!
        </motion.h2>
        
        <div className="flex gap-4 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-yellow-100 border-4 border-yellow-400 p-6 rounded-3xl flex flex-col items-center min-w-[140px]"
          >
            <div className="text-yellow-600 font-black text-lg mb-2">획득 점수</div>
            <div className="flex items-center gap-2 text-3xl font-black text-yellow-700">
              <Trophy className="w-8 h-8" /> +15
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-100 border-4 border-blue-400 p-6 rounded-3xl flex flex-col items-center min-w-[140px]"
          >
            <div className="text-blue-600 font-black text-lg mb-2">획득 보석</div>
            <div className="flex items-center gap-2 text-3xl font-black text-blue-700">
              <Diamond className="w-8 h-8 fill-blue-700" /> +10
            </div>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={() => onComplete(15, 10)}
          className="w-full max-w-sm py-5 text-2xl font-black rounded-2xl border-b-8 bg-orange-500 border-orange-700 text-white active:translate-y-1"
        >
          계속하기
        </motion.button>
      </div>
    );
  }

  const handleCheck = () => {
    if (step.type === 'info') {
      if (currentStepIdx < lesson.steps.length - 1) {
        setCurrentStepIdx(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
      return;
    }

    const correct = selectedOption === step.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      speak("딩동댕! 정답이에요!");
    } else {
      speak("아쉬워요. 다시 한번 생각해볼까요?");
      onWrongAnswer();
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setIsCorrect(null);
    if (currentStepIdx < lesson.steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      <div className="p-4 flex items-center gap-4 border-b-4 border-gray-100">
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
          <XCircle className="w-8 h-8 text-gray-400" />
        </button>
        <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIdx + 1) / lesson.steps.length) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-red-500 font-bold text-xl">
          <Heart className="w-6 h-6 fill-red-500" /> {hearts}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center max-w-2xl mx-auto w-full">
        <Mascot mood={isCorrect === false ? 'sad' : isCorrect === true ? 'celebrating' : 'happy'} />
        
        <div className="w-full flex items-start gap-4 mb-8 mt-4">
          <button 
            onClick={() => speak(step.content)}
            className="p-3 bg-blue-100 text-blue-600 rounded-2xl border-b-4 border-blue-200 active:translate-y-1 flex-shrink-0"
          >
            <Volume2 className="w-8 h-8" />
          </button>
          <h2 className="text-3xl font-bold text-gray-800 leading-tight">
            {step.content}
          </h2>
        </div>

        {step.imageUrl && (
          <div className="w-full aspect-video rounded-3xl overflow-hidden border-4 border-gray-100 mb-8 shadow-inner">
            <img src={step.imageUrl} alt="Lesson" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        {step.type === 'quiz' && (
          <div className="w-full grid gap-4">
            {step.options?.map(option => (
              <button
                key={option}
                onClick={() => !showFeedback && setSelectedOption(option)}
                className={`
                  p-6 text-2xl font-bold rounded-2xl border-4 text-left transition-all
                  ${selectedOption === option ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}
                  ${showFeedback && option === step.correctAnswer ? 'border-green-500 bg-green-50 text-green-700' : ''}
                  ${showFeedback && selectedOption === option && option !== step.correctAnswer ? 'border-red-500 bg-red-50 text-red-700' : ''}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`p-6 border-t-4 transition-colors ${showFeedback ? (isCorrect ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200') : 'bg-white border-gray-100'}`}>
        {showFeedback ? (
          <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
              <span className={`text-2xl font-black ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? '참 잘하셨어요!' : '아쉬워요, 다시 해볼까요?'}
              </span>
            </div>
            {!isCorrect && <p className="text-xl text-red-700 font-bold">{step.hint}</p>}
            <button
              onClick={isCorrect ? handleNext : () => setShowFeedback(false)}
              className={`w-full py-5 text-2xl font-black rounded-2xl border-b-8 text-white transition-transform active:translate-y-1
                ${isCorrect ? 'bg-green-500 border-green-700' : 'bg-red-500 border-red-700'}`}
            >
              {isCorrect ? '다음으로 넘어가기' : '다시 고르기'}
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full">
            <button
              disabled={step.type === 'quiz' && !selectedOption}
              onClick={handleCheck}
              className={`w-full py-5 text-2xl font-black rounded-2xl border-b-8 transition-all active:translate-y-1
                ${(step.type === 'info' || selectedOption) ? 'bg-green-500 border-green-700 text-white' : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'}`}
            >
              {step.type === 'info' ? '이해했어요!' : '정답 확인하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const QuestsView = ({ progress }: { progress: UserProgress }) => {
  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-black text-gray-800 mb-6 border-b-4 border-gray-100 pb-4">오늘의 임무</h2>
      
      <div className="space-y-4">
        <div className="bg-white border-4 border-gray-200 rounded-3xl p-6 flex items-center gap-6">
          <div className="text-5xl">🔥</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">출석하기</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className="bg-orange-500 h-4 rounded-full w-full"></div>
            </div>
            <div className="flex justify-between text-gray-500 font-bold">
              <span>1 / 1</span>
              <span className="text-orange-500">완료!</span>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-gray-200 rounded-3xl p-6 flex items-center gap-6">
          <div className="text-5xl">📱</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">학습 1회 완료하기</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className="bg-blue-500 h-4 rounded-full" style={{ width: progress.completedLessons.length > 0 ? '100%' : '0%' }}></div>
            </div>
            <div className="flex justify-between text-gray-500 font-bold">
              <span>{progress.completedLessons.length > 0 ? '1' : '0'} / 1</span>
              {progress.completedLessons.length > 0 ? (
                <span className="text-blue-500">완료!</span>
              ) : (
                <span className="text-blue-500 flex items-center gap-1"><Diamond className="w-4 h-4 fill-blue-500"/> 10</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LeaderboardView = ({ progress }: { progress: UserProgress }) => {
  const mockUsers = [
    { name: '김영희', points: 1500, avatar: '👵' },
    { name: '이철수', points: 1200, avatar: '👴' },
    { name: '나 (회원님)', points: progress.points, avatar: '😊', isMe: true },
    { name: '박지민', points: 900, avatar: '👩‍🦳' },
    { name: '최동훈', points: 850, avatar: '👨‍🦳' },
  ].sort((a, b) => b.points - a.points);

  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 text-white text-center mb-8 shadow-lg">
        <Medal className="w-16 h-16 mx-auto mb-4" />
        <h2 className="text-3xl font-black mb-2">명예의 전당</h2>
        <p className="text-lg font-bold opacity-90">이번 주 금빛 리그 순위입니다!</p>
      </div>

      <div className="bg-white border-4 border-gray-100 rounded-3xl overflow-hidden">
        {mockUsers.map((user, index) => (
          <div 
            key={user.name} 
            className={`flex items-center gap-4 p-6 border-b-4 border-gray-50 last:border-0
              ${user.isMe ? 'bg-orange-50' : ''}`}
          >
            <div className={`text-2xl font-black w-8 text-center
              ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-400'}`}
            >
              {index + 1}
            </div>
            <div className="text-4xl bg-gray-100 rounded-full p-2">{user.avatar}</div>
            <div className="flex-1">
              <div className={`text-xl font-bold ${user.isMe ? 'text-orange-700' : 'text-gray-800'}`}>
                {user.name}
              </div>
            </div>
            <div className="text-xl font-black text-gray-600">
              {user.points}점
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AITutor = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userMsg }] }],
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      
      const aiText = response.text || "죄송해요, 다시 말씀해주시겠어요?";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      speak(aiText); // Read AI response out loud
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "연결이 조금 불안정해요. 잠시 후 다시 물어봐주세요!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed inset-0 bg-white z-[200] flex flex-col"
        >
          <div className="p-4 border-b-4 border-orange-100 flex justify-between items-center bg-orange-50">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full border-2 border-orange-400">🦉</div>
              <h3 className="text-xl font-bold text-orange-900">은빛 부엉이 도우미</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-full">
              <XCircle className="w-8 h-8 text-orange-800" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-orange-50/30">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🦉</div>
                <h4 className="text-2xl font-bold text-gray-800 mb-2">무엇이든 물어보세요!</h4>
                <p className="text-gray-500 text-lg font-bold">"카카오톡이 뭐야?", "사진은 어떻게 찍어?"</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl text-xl font-medium shadow-sm border-2
                  ${m.role === 'user' ? 'bg-orange-500 text-white border-orange-600 rounded-tr-none' : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'}`}>
                  <Markdown>{m.text}</Markdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-5 rounded-3xl border-2 border-gray-100 rounded-tl-none flex gap-2">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-orange-400 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-orange-400 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-orange-400 rounded-full" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t-4 border-orange-100">
            <div className="flex gap-3">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="여기에 궁금한 걸 써보세요..."
                className="flex-1 p-5 text-xl bg-gray-50 border-4 border-gray-100 rounded-2xl focus:border-orange-400 outline-none"
              />
              <button 
                onClick={handleSend}
                className="bg-orange-500 p-5 rounded-2xl border-b-8 border-orange-700 text-white active:translate-y-1"
              >
                <Send className="w-8 h-8" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [view, setView] = useState<'home' | 'quests' | 'leaderboard' | 'profile'>('home');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isAIHelpOpen, setIsAIHelpOpen] = useState(false);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('silverlink_progress');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      completedLessons: parsed.completedLessons || [],
      currentStreak: parsed.currentStreak || 0,
      points: parsed.points || 0,
      hearts: parsed.hearts !== undefined ? parsed.hearts : 5,
      gems: parsed.gems !== undefined ? parsed.gems : 100,
      lastActive: parsed.lastActive || new Date().toISOString()
    };
  });

  useEffect(() => {
    localStorage.setItem('silverlink_progress', JSON.stringify(progress));
  }, [progress]);

  const handleLessonComplete = (pointsEarned: number, gemsEarned: number) => {
    if (!selectedLesson) return;
    
    setProgress(prev => {
      const isFirstTime = !prev.completedLessons.includes(selectedLesson.id);
      return {
        ...prev,
        completedLessons: isFirstTime ? [...prev.completedLessons, selectedLesson.id] : prev.completedLessons,
        points: prev.points + pointsEarned,
        gems: prev.gems + gemsEarned,
        currentStreak: prev.currentStreak === 0 ? 1 : prev.currentStreak, 
        lastActive: new Date().toISOString()
      };
    });
    setSelectedLesson(null);
  };

  const handleRefillHearts = () => {
    if (progress.gems >= 50) {
      setProgress(prev => ({ ...prev, hearts: 5, gems: prev.gems - 50 }));
    } else {
      alert("보석이 부족해요!");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-orange-200">
      <Header progress={progress} />
      
      <main className="max-w-4xl mx-auto">
        {view === 'home' && !selectedLesson && (
          <LessonPath 
            completedLessons={progress.completedLessons}
            onSelectLesson={(l) => setSelectedLesson(l)} 
          />
        )}

        {selectedLesson && (
          <LessonView 
            lesson={selectedLesson} 
            hearts={progress.hearts}
            onComplete={handleLessonComplete}
            onWrongAnswer={() => setProgress(prev => ({ ...prev, hearts: Math.max(0, prev.hearts - 1) }))}
            onCancel={() => setSelectedLesson(null)}
            onRefillHearts={handleRefillHearts}
          />
        )}

        {view === 'quests' && !selectedLesson && (
          <QuestsView progress={progress} />
        )}

        {view === 'leaderboard' && !selectedLesson && (
          <LeaderboardView progress={progress} />
        )}

        {view === 'profile' && !selectedLesson && (
          <div className="pt-24 px-6 flex flex-col items-center">
             <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center border-4 border-orange-400 text-6xl mb-4">
               👴
             </div>
             <h2 className="text-3xl font-bold mb-8">나의 배움 기록</h2>
             <div className="grid grid-cols-2 gap-4 w-full max-w-md">
               <div className="bg-blue-50 p-6 rounded-3xl border-4 border-blue-100 text-center">
                 <Trophy className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                 <div className="text-2xl font-black text-blue-800">{progress.points}점</div>
                 <div className="text-blue-600 font-bold">총 점수</div>
               </div>
               <div className="bg-red-50 p-6 rounded-3xl border-4 border-red-100 text-center">
                 <div className="text-4xl mb-2">🔥</div>
                 <div className="text-2xl font-black text-red-800">{progress.currentStreak}일</div>
                 <div className="text-red-600 font-bold">연속 학습</div>
               </div>
               <div className="bg-pink-50 p-6 rounded-3xl border-4 border-pink-100 text-center">
                 <Heart className="w-10 h-10 text-pink-500 fill-pink-500 mx-auto mb-2" />
                 <div className="text-2xl font-black text-pink-800">{progress.hearts}개</div>
                 <div className="text-pink-600 font-bold">남은 하트</div>
               </div>
               <div className="bg-purple-50 p-6 rounded-3xl border-4 border-purple-100 text-center">
                 <Diamond className="w-10 h-10 text-purple-500 fill-purple-500 mx-auto mb-2" />
                 <div className="text-2xl font-black text-purple-800">{progress.gems}개</div>
                 <div className="text-purple-600 font-bold">보유 보석</div>
               </div>
             </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {!selectedLesson && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-gray-100 p-2 sm:p-4 flex justify-around items-center z-50">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl ${view === 'home' ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Home className="w-8 h-8" />
            <span className="text-xs font-bold hidden sm:block">학습</span>
          </button>

          <button 
            onClick={() => setView('quests')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl ${view === 'quests' ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Target className="w-8 h-8" />
            <span className="text-xs font-bold hidden sm:block">임무</span>
          </button>
          
          <button 
            onClick={() => setIsAIHelpOpen(true)}
            className="relative -top-6 bg-orange-500 p-4 rounded-full border-b-8 border-orange-700 shadow-xl text-white active:translate-y-1"
          >
            <Sparkles className="w-8 h-8" />
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-orange-900 text-[10px] font-black px-2 py-1 rounded-full border-2 border-white">도움!</div>
          </button>

          <button 
            onClick={() => setView('leaderboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl ${view === 'leaderboard' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Medal className="w-8 h-8" />
            <span className="text-xs font-bold hidden sm:block">순위</span>
          </button>

          <button 
            onClick={() => setView('profile')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl ${view === 'profile' ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <User className="w-8 h-8" />
            <span className="text-xs font-bold hidden sm:block">내 정보</span>
          </button>
        </nav>
      )}

      <AITutor isOpen={isAIHelpOpen} onClose={() => setIsAIHelpOpen(false)} />
    </div>
  );
}
