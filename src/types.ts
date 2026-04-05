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
  xp: number; // Changed from points to xp (경험치)
  hearts: number;
  gems: number;
  lastActiveDate: string; // YYYY-MM-DD format for easier daily streak tracking
}

export const LESSONS: Lesson[] = [
  {
    id: 'kakaotalk-photo',
    title: '카톡으로 사진 보내기',
    description: '손주에게 예쁜 꽃 사진을 보내는 방법을 배워요.',
    icon: 'Image',
    category: 'social',
    steps: [
      {
        id: 'k1',
        type: 'info',
        content: '카카오톡 채팅방에서 글씨 쓰는 곳 옆에 있는 더하기(+) 모양을 누르세요.',
        imageUrl: 'https://picsum.photos/seed/kakao_plus/600/400'
      },
      {
        id: 'k2',
        type: 'quiz',
        content: '사진을 보내고 싶을 때, 어떤 글씨가 적힌 그림을 눌러야 할까요?',
        options: ['앨범', '카메라', '선물하기'],
        correctAnswer: '앨범',
        hint: '내가 찍어둔 사진은 모두 \'앨범\'에 들어있어요.'
      }
    ]
  },
  {
    id: 'youtube-trot',
    title: '유튜브 트로트 검색',
    description: '좋아하는 가수의 노래를 유튜브에서 찾아보아요.',
    icon: 'Youtube',
    category: 'app',
    steps: [
      {
        id: 'y1',
        type: 'info',
        content: '유튜브 화면 맨 위에 있는 돋보기(🔍) 모양을 누르면 검색할 수 있어요.',
        imageUrl: 'https://picsum.photos/seed/youtube_search/600/400'
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
  },
  {
    id: 'ktx-ticket',
    title: 'KTX 기차표 예매 기초',
    description: '코레일톡 앱에서 출발역과 도착역을 고르는 법을 배워요.',
    icon: 'Train',
    category: 'app',
    steps: [
      {
        id: 't1',
        type: 'info',
        content: '어디서 출발하는지(출발역)와 어디로 가는지(도착역)를 먼저 선택해야 해요.',
        imageUrl: 'https://picsum.photos/seed/ktx/600/400'
      },
      {
        id: 't2',
        type: 'quiz',
        content: '서울에서 부산으로 갈 때, \'도착역\'은 어디로 선택해야 할까요?',
        options: ['서울역', '부산역', '대전역'],
        correctAnswer: '부산역',
        hint: '내가 최종적으로 도착할 곳을 생각해보세요.'
      }
    ]
  },
  {
    id: 'safety-phishing',
    title: '보이스피싱 예방하기',
    description: '모르는 번호로 온 수상한 문자를 구별하는 법을 배워요.',
    icon: 'ShieldAlert',
    category: 'safety',
    steps: [
      {
        id: 'p1',
        type: 'info',
        content: '모르는 번호로 온 문자 속의 파란색 영어 주소(링크)는 절대 누르면 안 돼요!',
        imageUrl: 'https://picsum.photos/seed/safety_link/600/400'
      },
      {
        id: 'p2',
        type: 'quiz',
        content: '아들이라며 "엄마 폰 고장났어, 여기로 돈 보내줘"라는 문자가 왔을 때 가장 먼저 해야 할 일은?',
        options: ['바로 돈을 보낸다', '아들에게 직접 전화를 걸어 목소리를 확인한다', '문자 속 링크를 누른다'],
        correctAnswer: '아들에게 직접 전화를 걸어 목소리를 확인한다',
        hint: '반드시 본인인지 직접 목소리로 확인하는 게 가장 안전해요.'
      }
    ]
  }
];
