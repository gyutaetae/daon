export interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'basic' | 'app' | 'safety' | 'social';
  steps: LessonStep[];
}

export interface LessonStep {
  id: string;
  type: 'info' | 'quiz' | 'action';
  content: string;
  imageUrl?: string;
  options?: string[];
  correctAnswer?: string;
  hint?: string;
}

export interface UserProgress {
  completedLessons: string[];
  currentStreak: number;
  points: number;
  hearts: number;
  gems: number;
  lastActive: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 'smartphone-1',
    title: '스마트폰 켜고 끄기',
    description: '스마트폰의 전원 버튼을 찾고 사용하는 방법을 배워요.',
    icon: 'Smartphone',
    category: 'basic',
    steps: [
      {
        id: 's1',
        type: 'info',
        content: '스마트폰 옆면이나 뒷면에 있는 긴 버튼이 전원 버튼이에요.',
        imageUrl: 'https://picsum.photos/seed/power/400/300'
      },
      {
        id: 's2',
        type: 'quiz',
        content: '화면을 완전히 끄고 싶을 때 어떤 버튼을 길게 눌러야 할까요?',
        options: ['전원 버튼', '음량 버튼', '홈 버튼'],
        correctAnswer: '전원 버튼',
        hint: '기기 옆면의 긴 버튼을 생각해보세요!'
      }
    ]
  },
  {
    id: 'kakaotalk-1',
    title: '카카오톡 메시지 보내기',
    description: '가족과 친구에게 안부 인사를 전하는 방법을 배워요.',
    icon: 'MessageCircle',
    category: 'social',
    steps: [
      {
        id: 'k1',
        type: 'info',
        content: '노란색 아이콘의 카카오톡을 누르면 친구 목록이 나와요.',
        imageUrl: 'https://picsum.photos/seed/kakao/400/300'
      },
      {
        id: 'k2',
        type: 'quiz',
        content: '메시지를 다 쓴 후, 어떤 모양의 버튼을 눌러야 전송될까요?',
        options: ['비행기 모양', '돋보기 모양', '톱니바퀴 모양'],
        correctAnswer: '비행기 모양',
        hint: '종이비행기처럼 생긴 노란색 버튼이에요!'
      }
    ]
  },
  {
    id: 'safety-1',
    title: '보이스피싱 예방하기',
    description: '모르는 번호로 온 수상한 문자를 구별하는 법을 배워요.',
    icon: 'ShieldAlert',
    category: 'safety',
    steps: [
      {
        id: 'p1',
        type: 'info',
        content: '모르는 번호로 온 문자 속의 인터넷 주소(링크)는 절대 누르면 안 돼요!',
        imageUrl: 'https://picsum.photos/seed/safety/400/300'
      },
      {
        id: 'p2',
        type: 'quiz',
        content: '아들이라며 돈을 보내달라는 문자가 왔을 때 가장 먼저 해야 할 일은?',
        options: ['바로 돈을 보낸다', '직접 전화를 걸어 확인한다', '문자 속 링크를 누른다'],
        correctAnswer: '직접 전화를 걸어 확인한다',
        hint: '본인인지 직접 목소리로 확인하는 게 가장 안전해요.'
      }
    ]
  },
  {
    id: 'youtube-1',
    title: '유튜브 영상 검색하기',
    description: '보고 싶은 트로트 영상을 찾는 방법을 배워요.',
    icon: 'Youtube',
    category: 'app',
    steps: [
      {
        id: 'y1',
        type: 'info',
        content: '유튜브 화면 맨 위에 있는 돋보기 모양을 누르면 검색할 수 있어요.',
        imageUrl: 'https://picsum.photos/seed/youtube/400/300'
      },
      {
        id: 'y2',
        type: 'quiz',
        content: '임영웅 노래를 찾고 싶을 때 눌러야 하는 모양은 무엇일까요?',
        options: ['돋보기 모양', '종 모양', '더하기 모양'],
        correctAnswer: '돋보기 모양',
        hint: '무언가를 찾을 때는 돋보기를 사용하죠!'
      }
    ]
  }
];
