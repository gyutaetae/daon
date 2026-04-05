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
  PlayCircle,
  Image as ImageIcon,
  Train,
  Gift,
  LogOut
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import Markdown from 'react-markdown';
import { Lesson, LessonStep, LESSONS, UserProgress } from './types';

import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// --- AI Service ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || "", 
  dangerouslyAllowBrowser: true 
});

const SYSTEM_INSTRUCTION = `
당신은 대한민국 60세 이상 어르신들을 위해 디지털 기기 사용법을 가르치는 다정하고 따뜻한 강사 '다온 선생님'입니다.
어르신들과 정서적으로 깊이 교류하며, 다음 원칙을 지켜 답변해주세요:
1. 아주 쉬운 단어를 사용하세요 (예: '아이콘' 대신 '그림 버튼', '탭' 대신 '살짝 누르기').
2. 한 번에 하나씩만 천천히 설명하세요.
3. 따뜻하고 격려하는 말투를 사용하세요 (예: "우리 어르신 천천히 하셔도 괜찮아요!", "아이고, 정말 잘하고 계세요!").
4. 실생활 비유를 활용하세요 (예: "카카오톡은 엽서 대신 핸드폰으로 보내는 편지예요").
5. 답변은 3문장 이내로 짧고 굵게 하세요.
`;

// --- Helpers ---
const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.8; // Slower for seniors
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
};

const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

// --- Components ---

const Mascot = ({ mood = 'happy' }: { mood?: 'happy' | 'thinking' | 'celebrating' | 'sad' | 'shocked' }) => {
  const getEmoji = () => {
    switch (mood) {
      case 'thinking': return '🤔';
      case 'celebrating': return '🎉';
      case 'sad': return '😥';
      case 'shocked': return '😱';
      default: return '👩‍🏫'; // Teacher Daon
    }
  };

  return (
    <motion.div 
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 2.5 }}
      className="text-7xl mb-4 flex flex-col items-center"
    >
      <div className="bg-orange-100 p-6 rounded-full border-4 border-orange-400 shadow-lg">
        {getEmoji()}
      </div>
      <span className="text-lg font-black mt-3 text-orange-900 bg-orange-200 px-4 py-1 rounded-full shadow-sm">다온 선생님</span>
    </motion.div>
  );
};

const Header = ({ progress, user }: { progress: UserProgress | null, user: FirebaseUser | null }) => (
  <header className="fixed top-0 left-0 right-0 bg-white border-b-2 border-gray-200 p-4 flex justify-between items-center z-50 shadow-sm">
    <div className="flex items-center gap-2">
      <h1 className="text-3xl font-black text-[#5a4bda] tracking-tight">다온</h1>
    </div>
    {progress && (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
          <Heart className="text-red-500 w-6 h-6 fill-red-500" />
          <span className="font-black text-gray-700 text-lg">{progress.hearts}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
          <div className="bg-[#ffc800] rounded-full p-1 border-2 border-[#d9a800]">
            <Diamond className="text-white w-3 h-3 fill-white" />
          </div>
          <span className="font-black text-gray-700 text-lg">{progress.gems}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
          <span className="text-xl">🔥</span>
          <span className="font-black text-gray-700 text-lg">{progress.currentStreak}</span>
        </div>
      </div>
    )}
  </header>
);

const DailyRewardModal = ({ onClaim, streak, gems }: { onClaim: () => void, streak: number, gems: number }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl border-8 border-orange-400"
      >
        <div className="text-8xl mb-6 animate-bounce">🎁</div>
        <h2 className="text-4xl font-black text-gray-900 mb-4">출석 보상 도착!</h2>
        <p className="text-2xl text-gray-700 font-bold mb-8 leading-relaxed">
          오늘도 오셨군요!<br/>
          <span className="text-orange-600">{streak}일 연속</span> 출석입니다.<br/>
          보석 <span className="text-blue-600">{gems}개</span>를 받으세요!
        </p>
        <button 
          onClick={onClaim}
          className="w-full py-6 text-3xl font-black rounded-2xl border-b-8 bg-orange-500 border-orange-700 text-white active:translate-y-2 transition-transform"
        >
          보상 받기
        </button>
      </motion.div>
    </div>
  );
};

const LessonPath = ({ onSelectLesson, completedLessons }: { onSelectLesson: (l: Lesson) => void, completedLessons: string[] }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Image': return <ImageIcon className="w-8 h-8" />;
      case 'Youtube': return <PlayCircle className="w-8 h-8" />;
      case 'Train': return <Train className="w-8 h-8" />;
      case 'ShieldAlert': return <ShieldAlert className="w-8 h-8" />;
      default: return <Smartphone className="w-8 h-8" />;
    }
  };

  const formatTitle = (title: string) => {
    const parts = title.split(' ');
    if (parts.length > 1) {
      return `${parts[0]}\n${parts.slice(1).join(' ')}`;
    }
    return title;
  };

  return (
    <div className="pt-28 pb-40 flex flex-col items-center max-w-md mx-auto px-4 relative">
      {/* Background Decorations */}
      <div className="absolute top-60 left-0 text-6xl opacity-80 pointer-events-none">🌳</div>
      <div className="absolute top-96 right-0 text-5xl opacity-80 pointer-events-none">🌲</div>
      <div className="absolute bottom-40 left-10 text-4xl opacity-80 pointer-events-none">🌿</div>

      {/* Banner */}
      <div className="w-full bg-[#dcf2fa] rounded-2xl mb-12 relative overflow-hidden shadow-sm border-b-[12px] border-[#a5d6a7]">
        <div className="flex items-center gap-4 p-6 relative z-10">
          <div className="text-7xl">🐶</div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">1단계: 필수 앱 정복!</h2>
            <p className="text-base text-gray-700 font-bold">다온 선생님과 함께 천천히 배워요!</p>
          </div>
        </div>
      </div>

      {/* Path Container */}
      <div className="relative w-full flex flex-col items-center gap-6">
        {/* SVG Path Line */}
        <div className="absolute top-20 bottom-20 left-0 right-0 -z-10">
           <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M 35 5 L 65 35 L 35 65 L 65 95" stroke="#cbd5e1" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
           </svg>
        </div>

        {LESSONS.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isNext = index === 0 || completedLessons.includes(LESSONS[index - 1].id);
          
          let bgColor = 'bg-[#e5e5e5]';
          let borderColor = 'border-[#cccccc]';
          let textColor = 'text-gray-500';
          
          if (isCompleted || isNext) {
            if (index === 0) { bgColor = 'bg-[#7c5ff4]'; borderColor = 'border-[#5a4bda]'; textColor = 'text-white'; }
            else if (index === 1) { bgColor = 'bg-[#70c0e8]'; borderColor = 'border-[#4a90e2]'; textColor = 'text-white'; }
            else if (index === 2) { bgColor = 'bg-[#b5b5b5]'; borderColor = 'border-[#999999]'; textColor = 'text-white'; }
            else { bgColor = 'bg-[#e0e0e0]'; borderColor = 'border-[#b5b5b5]'; textColor = 'text-gray-600'; }
          }

          const positionClass = index % 2 === 0 ? '-translate-x-12' : 'translate-x-12';

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${positionClass}`}
            >
              <motion.button
                whileHover={isNext ? { scale: 1.05 } : {}}
                whileTap={isNext ? { scale: 0.95 } : {}}
                onClick={() => isNext && onSelectLesson(lesson)}
                className={`
                  relative w-40 h-40 rounded-full flex flex-col items-center justify-center border-b-[10px] transition-all shadow-md
                  ${bgColor} ${borderColor} ${textColor}
                  ${!isNext && !isCompleted ? 'opacity-80 cursor-not-allowed' : ''}
                `}
              >
                <div className="mb-2 bg-white/20 p-2 rounded-full">
                  {getIcon(lesson.icon)}
                </div>
                <span className="text-center font-black text-lg leading-tight whitespace-pre-line">
                  {formatTitle(lesson.title)}
                </span>

                {isCompleted && (
                  <div className="absolute -top-4 -right-2 text-4xl animate-bounce drop-shadow-md">👑</div>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
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
  onComplete: (xp: number, gems: number) => void, 
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

  useEffect(() => {
    if (step && !isFinished) {
      speak(step.content);
    }
  }, [currentStepIdx, step, isFinished]);

  if (hearts <= 0) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6">
        <Mascot mood="shocked" />
        <h2 className="text-4xl font-black text-gray-900 mt-6 mb-6 text-center leading-tight">아이고!<br/>하트가 모두 소진되었어요!</h2>
        <p className="text-2xl text-gray-700 text-center mb-10 font-bold leading-relaxed">조금 쉬었다가 다시 도전하거나,<br/>보석을 사용해 하트를 채울 수 있어요.</p>
        
        <div className="w-full max-w-md space-y-6">
          <button 
            onClick={onRefillHearts}
            className="w-full py-6 text-3xl font-black rounded-2xl border-b-8 bg-blue-500 border-blue-700 text-white flex items-center justify-center gap-3 active:translate-y-2"
          >
            <Diamond className="w-10 h-10 fill-white" /> 보석 50개로 채우기
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-6 text-3xl font-black rounded-2xl border-b-8 bg-gray-200 border-gray-300 text-gray-800 active:translate-y-2"
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
          className="text-5xl font-black text-orange-600 mb-10 text-center"
        >
          학습 완료!
        </motion.h2>
        
        <div className="flex gap-6 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-yellow-100 border-4 border-yellow-400 p-8 rounded-3xl flex flex-col items-center min-w-[160px]"
          >
            <div className="text-yellow-700 font-black text-2xl mb-3">획득 경험치</div>
            <div className="flex items-center gap-2 text-4xl font-black text-yellow-800">
              <Trophy className="w-10 h-10" /> +15
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-100 border-4 border-blue-400 p-8 rounded-3xl flex flex-col items-center min-w-[160px]"
          >
            <div className="text-blue-700 font-black text-2xl mb-3">획득 보석</div>
            <div className="flex items-center gap-2 text-4xl font-black text-blue-800">
              <Diamond className="w-10 h-10 fill-blue-700" /> +10
            </div>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={() => onComplete(15, 10)}
          className="w-full max-w-md py-6 text-3xl font-black rounded-2xl border-b-8 bg-orange-500 border-orange-700 text-white active:translate-y-2"
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
      speak("딩동댕! 정답이에요! 정말 잘하셨어요.");
    } else {
      speak("아이고, 아쉬워요. 다시 한번 천천히 생각해볼까요?");
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
      <div className="p-6 flex items-center gap-6 border-b-4 border-gray-200">
        <button onClick={onCancel} className="p-3 hover:bg-gray-100 rounded-full">
          <XCircle className="w-10 h-10 text-gray-500" />
        </button>
        <div className="flex-1">
          <Progress value={((currentStepIdx + 1) / lesson.steps.length) * 100} className="h-6" />
        </div>
        <div className="flex items-center gap-2 text-red-500 font-black text-2xl">
          <Heart className="w-8 h-8 fill-red-500" /> {hearts}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center max-w-3xl mx-auto w-full">
        <Mascot mood={isCorrect === false ? 'sad' : isCorrect === true ? 'celebrating' : 'happy'} />
        
        <div className="w-full flex items-start gap-4 mb-10 mt-6">
          <button 
            onClick={() => speak(step.content)}
            className="p-4 bg-blue-100 text-blue-700 rounded-2xl border-b-4 border-blue-300 active:translate-y-1 flex-shrink-0"
          >
            <Volume2 className="w-10 h-10" />
          </button>
          <h2 className="text-4xl font-black text-gray-900 leading-snug">
            {step.content}
          </h2>
        </div>

        {step.imageUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full aspect-video rounded-[2rem] overflow-hidden border-8 border-white mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative group"
          >
            <img 
              src={step.imageUrl} 
              alt="Lesson" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 border-4 border-black/5 rounded-[2rem] pointer-events-none"></div>
          </motion.div>
        )}

        {step.type === 'quiz' && (
          <div className="w-full grid gap-6">
            {step.options?.map(option => (
              <button
                key={option}
                onClick={() => !showFeedback && setSelectedOption(option)}
                className={`
                  p-8 text-3xl font-black rounded-2xl border-4 text-left transition-all
                  ${selectedOption === option ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-300 hover:border-gray-400 text-gray-800'}
                  ${showFeedback && option === step.correctAnswer ? 'border-green-500 bg-green-50 text-green-800' : ''}
                  ${showFeedback && selectedOption === option && option !== step.correctAnswer ? 'border-red-500 bg-red-50 text-red-800' : ''}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`p-8 border-t-4 transition-colors ${showFeedback ? (isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300') : 'bg-white border-gray-200'}`}>
        {showFeedback ? (
          <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-4">
              {isCorrect ? (
                <CheckCircle2 className="w-12 h-12 text-green-700" />
              ) : (
                <XCircle className="w-12 h-12 text-red-700" />
              )}
              <span className={`text-3xl font-black ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                {isCorrect ? '참 잘하셨어요!' : '아쉬워요, 다시 해볼까요?'}
              </span>
            </div>
            {!isCorrect && <p className="text-2xl text-red-800 font-bold">{step.hint}</p>}
            <button
              onClick={isCorrect ? handleNext : () => setShowFeedback(false)}
              className={`w-full py-6 text-3xl font-black rounded-2xl border-b-8 text-white transition-transform active:translate-y-2
                ${isCorrect ? 'bg-green-600 border-green-800' : 'bg-red-600 border-red-800'}`}
            >
              {isCorrect ? '다음으로 넘어가기' : '다시 고르기'}
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            <button
              disabled={step.type === 'quiz' && !selectedOption}
              onClick={handleCheck}
              className={`w-full py-6 text-3xl font-black rounded-2xl border-b-8 transition-all active:translate-y-2
                ${(step.type === 'info' || selectedOption) ? 'bg-green-600 border-green-800 text-white' : 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed'}`}
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
    <div className="pt-28 pb-40 px-6 max-w-3xl mx-auto">
      <h2 className="text-4xl font-black text-gray-900 mb-8 border-b-4 border-gray-200 pb-6">오늘의 임무</h2>
      
      <div className="space-y-6">
        <Card className="border-4 border-gray-200 rounded-3xl shadow-sm">
          <CardContent className="p-8 flex items-center gap-8">
            <div className="text-6xl">🔥</div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-gray-900 mb-3">출석하기</h3>
              <Progress value={100} className="h-6 mb-3 bg-gray-200" />
              <div className="flex justify-between text-gray-600 font-bold text-xl">
                <span>1 / 1</span>
                <span className="text-orange-600 font-black">완료!</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-gray-200 rounded-3xl shadow-sm">
          <CardContent className="p-8 flex items-center gap-8">
            <div className="text-6xl">📱</div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-gray-900 mb-3">학습 1회 완료하기</h3>
              <Progress value={progress.completedLessons.length > 0 ? 100 : 0} className="h-6 mb-3 bg-gray-200" />
              <div className="flex justify-between text-gray-600 font-bold text-xl">
                <span>{progress.completedLessons.length > 0 ? '1' : '0'} / 1</span>
                {progress.completedLessons.length > 0 ? (
                  <span className="text-blue-600 font-black">완료!</span>
                ) : (
                  <span className="text-blue-600 font-black flex items-center gap-2"><Diamond className="w-6 h-6 fill-blue-600"/> 10</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const LeaderboardView = ({ progress, user }: { progress: UserProgress, user: FirebaseUser }) => {
  const [leaderboard, setLeaderboard] = useState<{ name: string, xp: number, avatar: string, isMe: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const users: { name: string, xp: number, avatar: string, isMe: boolean }[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          users.push({
            name: data.displayName || '익명 사용자',
            xp: data.xp || 0,
            avatar: data.photoURL || '👵',
            isMe: doc.id === user.uid
          });
        });
        
        // If current user is not in top 10, we could add them at the bottom, but for now just show top 10.
        setLeaderboard(users);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user.uid]);

  return (
    <div className="pt-28 pb-40 px-6 max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-10 text-white text-center mb-10 shadow-lg">
        <Medal className="w-20 h-20 mx-auto mb-6" />
        <h2 className="text-4xl font-black mb-4">명예의 전당</h2>
        <p className="text-2xl font-bold opacity-90">이번 주 금빛 리그 순위입니다!</p>
      </div>

      <div className="bg-white border-4 border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-2xl font-bold text-gray-500">순위를 불러오는 중입니다...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-2xl font-bold text-gray-500">아직 순위가 없습니다.</div>
        ) : (
          leaderboard.map((u, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-6 p-8 border-b-4 border-gray-100 last:border-0
                ${u.isMe ? 'bg-orange-50' : ''}`}
            >
              <div className={`text-3xl font-black w-10 text-center
                ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-400'}`}
              >
                {index + 1}
              </div>
              <Avatar className="w-16 h-16 border-2 border-gray-200">
                {u.avatar.startsWith('http') ? (
                  <AvatarImage src={u.avatar} alt="avatar" />
                ) : (
                  <AvatarFallback className="text-4xl bg-gray-100">{u.avatar}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className={`text-2xl font-black ${u.isMe ? 'text-orange-800' : 'text-gray-900'}`}>
                  {u.name}
                </div>
              </div>
              <div className="text-2xl font-black text-gray-700">
                {u.xp} XP
              </div>
            </div>
          ))
        )}
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
      let aiText = "";

      // Prioritize Groq if available, otherwise use Gemini
      if (process.env.GROQ_API_KEY) {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant' as const, content: m.text })),
            { role: "user", content: userMsg }
          ],
          model: "llama-3.3-70b-versatile",
        });
        aiText = chatCompletion.choices[0]?.message?.content || "";
      } else if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userMsg }] }],
          config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        aiText = response.text || "";
      } else {
        throw new Error("API_KEY_MISSING");
      }
      
      if (!aiText) {
        aiText = "아이고, 제가 잘 못 들었어요. 다시 말씀해주시겠어요?";
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      speak(aiText);
    } catch (error: any) {
      console.error("AI Tutor Error:", error);
      let errorMsg = "연결이 조금 불안정하네요. 잠시 후 다시 물어봐주세요!";
      
      if (error.message === "API_KEY_MISSING") {
        errorMsg = "다온 선생님이 답변을 드릴 수 있는 열쇠(API Key)가 없어요. Vercel 설정에서 GEMINI_API_KEY 또는 GROQ_API_KEY를 등록해 주세요!";
      } else if (error.message?.includes("API key not valid")) {
        errorMsg = "다온 선생님의 열쇠(API Key)가 올바르지 않아요. 관리자에게 확인을 요청해 주세요!";
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
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
          <div className="p-6 border-b-4 border-orange-200 flex justify-between items-center bg-orange-50">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-full border-2 border-orange-400 text-3xl">👩‍🏫</div>
              <h3 className="text-3xl font-black text-orange-900">다온 선생님</h3>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-orange-100 rounded-full">
              <XCircle className="w-10 h-10 text-orange-800" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-orange-50/30">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">👩‍🏫</div>
                <h4 className="text-3xl font-black text-gray-900 mb-4">무엇이든 물어보세요!</h4>
                <p className="text-gray-700 text-2xl font-bold">"카카오톡이 뭐야?", "사진은 어떻게 찍어?"</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-2xl font-bold shadow-sm border-4 leading-relaxed
                  ${m.role === 'user' ? 'bg-orange-500 text-white border-orange-600 rounded-tr-none' : 'bg-white text-gray-900 border-gray-200 rounded-tl-none'}`}>
                  <Markdown>{m.text}</Markdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-6 rounded-[2rem] border-4 border-gray-200 rounded-tl-none flex gap-3">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 bg-orange-400 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-3 h-3 bg-orange-400 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-3 h-3 bg-orange-400 rounded-full" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t-4 border-orange-200">
            <div className="flex gap-4">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="여기에 궁금한 걸 써보세요..."
                className="flex-1 p-6 text-2xl font-bold bg-gray-50 border-4 border-gray-200 rounded-2xl focus:border-orange-500 outline-none"
              />
              <button 
                onClick={handleSend}
                className="bg-orange-500 p-6 rounded-2xl border-b-8 border-orange-700 text-white active:translate-y-2"
              >
                <Send className="w-10 h-10" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const defaultProgress: UserProgress = {
  completedLessons: [],
  currentStreak: 0,
  xp: 0,
  hearts: 5,
  gems: 0,
  lastActiveDate: ''
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const [view, setView] = useState<'home' | 'quests' | 'leaderboard' | 'profile'>('home');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isAIHelpOpen, setIsAIHelpOpen] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      setProgress(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProgress;
        setProgress(data);
        
        // Check Daily Reward
        const today = getTodayString();
        if (data.lastActiveDate !== today) {
          setShowDailyReward(true);
        }
      } else {
        // Create new user profile
        const newProgress: UserProgress = {
          completedLessons: [],
          currentStreak: 0,
          xp: 0,
          hearts: 5,
          gems: 100,
          lastActiveDate: ''
        };
        setDoc(userRef, {
          ...newProgress,
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("현재 도메인이 Firebase에 등록되지 않았습니다. Firebase 콘솔(Authentication -> Settings -> Authorized domains)에 현재 Vercel 도메인을 추가해주세요.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업 차단을 해제해주세요.");
      } else {
        alert("로그인 중 오류가 발생했습니다: " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (user && progress) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
    } else {
      // Update local state for guests
      setProgress(prev => prev ? { ...prev, ...updates } : { ...defaultProgress, ...updates });
    }
  };

  const handleClaimDailyReward = () => {
    const current = progress || defaultProgress;
    const today = getTodayString();
    
    const newStreak = current.currentStreak + 1; 
    updateProgress({
      currentStreak: newStreak,
      gems: current.gems + 20,
      xp: current.xp + 10,
      lastActiveDate: today
    });
    
    setShowDailyReward(false);
    speak("오늘도 오셨군요! 참 잘하셨어요. 보석을 드릴게요.");
  };

  const handleLessonComplete = (xpEarned: number, gemsEarned: number) => {
    if (!selectedLesson) return;
    const current = progress || defaultProgress;
    
    const isFirstTime = !current.completedLessons.includes(selectedLesson.id);
    updateProgress({
      completedLessons: isFirstTime ? [...current.completedLessons, selectedLesson.id] : current.completedLessons,
      xp: current.xp + xpEarned,
      gems: current.gems + gemsEarned,
    });
    setSelectedLesson(null);
  };

  const handleRefillHearts = () => {
    const current = progress || defaultProgress;
    if (current.gems >= 50) {
      updateProgress({ hearts: 5, gems: current.gems - 50 });
    } else {
      alert("보석이 부족해요!");
    }
  };

  const currentProgress = progress || defaultProgress;

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-3xl font-black text-orange-500 animate-pulse">다온 불러오는 중...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#f4efe6] font-sans text-gray-900 selection:bg-orange-200">
      <Header progress={currentProgress} user={user} />
      
      {showDailyReward && user && (
        <DailyRewardModal 
          onClaim={handleClaimDailyReward} 
          streak={currentProgress.currentStreak + 1} 
          gems={20} 
        />
      )}

      <main className="max-w-4xl mx-auto">
        {view === 'home' && !selectedLesson && (
          <LessonPath 
            completedLessons={currentProgress.completedLessons}
            onSelectLesson={(l) => setSelectedLesson(l)} 
          />
        )}

        {selectedLesson && (
          <LessonView 
            lesson={selectedLesson} 
            hearts={currentProgress.hearts}
            onComplete={handleLessonComplete}
            onWrongAnswer={() => updateProgress({ hearts: Math.max(0, currentProgress.hearts - 1) })}
            onCancel={() => setSelectedLesson(null)}
            onRefillHearts={handleRefillHearts}
          />
        )}

        {view === 'quests' && !selectedLesson && (
          <QuestsView progress={currentProgress} />
        )}

        {view === 'leaderboard' && !selectedLesson && (
          <LeaderboardView progress={currentProgress} user={user} />
        )}

        {view === 'profile' && !selectedLesson && (
          <div className="pt-28 px-6 flex flex-col items-center pb-40">
            {!user ? (
              <div className="flex flex-col items-center text-center w-full max-w-md">
                <Mascot />
                <h1 className="text-5xl font-black text-orange-600 mb-4 mt-6">다온</h1>
                <p className="text-2xl text-gray-700 font-bold mb-12">로그인하고 내 기록을<br/>안전하게 보관하세요!</p>
                
                <button 
                  onClick={handleLogin}
                  className="w-full py-6 text-3xl font-black rounded-2xl border-b-8 bg-white border-gray-300 text-gray-800 flex items-center justify-center gap-4 active:translate-y-2 shadow-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-8 h-8" />
                  구글로 시작하기
                </button>
                <p className="mt-6 text-gray-500 font-bold text-lg">
                  * 팝업이 뜨지 않는다면 브라우저 팝업 차단을 해제해주세요.
                </p>
              </div>
            ) : (
              <>
                <div className="w-40 h-40 bg-orange-100 rounded-full flex items-center justify-center border-8 border-orange-400 text-7xl mb-6 shadow-md overflow-hidden">
                  {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : '👴'}
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-2">{user.displayName || '회원님'}</h2>
                <p className="text-xl text-gray-500 font-bold mb-10">{user.email}</p>

                <div className="grid grid-cols-2 gap-6 w-full max-w-2xl mb-12">
                  <div className="bg-blue-50 p-8 rounded-[2rem] border-4 border-blue-200 text-center shadow-sm">
                    <Trophy className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <div className="text-4xl font-black text-blue-900 mb-1">{currentProgress.xp}</div>
                    <div className="text-blue-700 font-bold text-xl">경험치 (XP)</div>
                  </div>
                  <div className="bg-red-50 p-8 rounded-[2rem] border-4 border-red-200 text-center shadow-sm">
                    <div className="text-5xl mb-3">🔥</div>
                    <div className="text-4xl font-black text-red-900 mb-1">{currentProgress.currentStreak}일</div>
                    <div className="text-red-700 font-bold text-xl">연속 학습</div>
                  </div>
                  <div className="bg-pink-50 p-8 rounded-[2rem] border-4 border-pink-200 text-center shadow-sm">
                    <Heart className="w-12 h-12 text-pink-500 fill-pink-500 mx-auto mb-3" />
                    <div className="text-4xl font-black text-pink-900 mb-1">{currentProgress.hearts}개</div>
                    <div className="text-pink-700 font-bold text-xl">남은 하트</div>
                  </div>
                  <div className="bg-purple-50 p-8 rounded-[2rem] border-4 border-purple-200 text-center shadow-sm">
                    <Diamond className="w-12 h-12 text-purple-500 fill-purple-500 mx-auto mb-3" />
                    <div className="text-4xl font-black text-purple-900 mb-1">{currentProgress.gems}개</div>
                    <div className="text-purple-700 font-bold text-xl">보유 보석</div>
                  </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-2xl font-bold text-gray-500 hover:text-gray-800 bg-gray-200 px-8 py-4 rounded-2xl"
                >
                  <LogOut className="w-8 h-8" /> 로그아웃
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {!selectedLesson && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 px-2 pb-safe pt-2 flex justify-around items-center z-50">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'home' ? 'text-[#5a4bda]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home className="w-8 h-8" />
            <span className="text-xs font-black">학습</span>
          </button>

          <button 
            onClick={() => setView('quests')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'quests' ? 'text-[#5a4bda]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Target className="w-8 h-8" />
            <span className="text-xs font-black">임무</span>
          </button>
          
          <div className="relative -top-6">
            <button 
              onClick={() => setIsAIHelpOpen(true)}
              className="bg-[#ff9600] rounded-full border-b-[6px] border-[#cc7800] shadow-lg text-white active:translate-y-1 transition-transform flex flex-col items-center justify-center w-[72px] h-[72px]"
            >
              <span className="font-black text-lg">질문!</span>
            </button>
          </div>

          <button 
            onClick={() => setView('leaderboard')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'leaderboard' ? 'text-[#5a4bda]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Trophy className="w-8 h-8" />
            <span className="text-xs font-black">순위</span>
          </button>

          <button 
            onClick={() => setView('profile')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'profile' ? 'text-[#5a4bda]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <User className="w-8 h-8" />
            <span className="text-xs font-black">내 정보</span>
          </button>
        </nav>
      )}

      <AITutor isOpen={isAIHelpOpen} onClose={() => setIsAIHelpOpen(false)} />
    </div>
  );
}
