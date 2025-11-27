/**
 * Content Builder 데이터 모델
 * 25itinse subjects/{과목코드}/{차시}/assets/data/data.json 구조 기반
 */

// 기본 과목 정보
export const createCourseData = () => ({
  courseCode: '',           // 과목 코드 (예: 25itinse)
  courseName: '',           // 과정명 (예: 인터넷보안)
  backgroundImage: '',      // 배경 이미지 경로
  professor: createProfessorData(),
  weeks: [],                // 주차별 정보 (subjects.json 생성용)
  lessons: []               // 차시별 데이터
});

// 교수 정보 (전체 과목 공통)
export const createProfessorData = () => ({
  name: '',
  photo: '',                // 상대경로: ../images/{과목코드}_professor.png
  education: [''],          // 학력 리스트 (동적 추가/삭제)
  career: [{ period: '', startDate: '', endDate: '', description: '' }]  // 경력 리스트 (시작일/종료일 + 내용)
});

// 주차 정보 (subjects.json용)
export const createWeekData = () => ({
  weekNumber: 1,
  weekTitle: '',            // 예: "암호 기술 개요"
  lessons: []               // 차시명 리스트
});

// 차시 데이터 (각 {차시}/assets/data/data.json)
export const createLessonData = () => ({
  subject: '',              // 과정명
  index: 1,                 // 주차
  section: 1,               // 차시
  instruction: '',          // 음성파일 ZIP URL
  guide: '',                // 교안 ZIP URL
  sections: ['인트로', '준비하기', '학습하기', '정리하기'],
  pages: []                 // 페이지 컴포넌트 배열
});

// 페이지 컴포넌트: 인트로
export const createIntroPage = (professor) => ({
  path: '',
  section: 0,
  title: '인트로',
  component: 'intro',
  media: '../../../resources/media/common_start.mp3',
  data: {
    professor: {
      name: professor.name,
      photo: professor.photo,
      profile: [
        {
          title: '학　력',
          content: professor.education
        },
        {
          title: '경　력',
          content: professor.career
        }
      ]
    }
  }
});

// 페이지 컴포넌트: 오리엔테이션 (1주1차시만)
export const createOrientationPage = (videoUrl, subtitlePath) => ({
  path: '/orientation',
  section: 1,
  title: '오리엔테이션',
  description: '본격적인 학습에 앞서 오리엔테이션을 먼저 들어주세요.',
  script: '본격적인 학습에 앞서 교수님의 오리엔테이션을 먼저 들어주세요.',
  component: 'orientation',
  media: videoUrl,
  caption: [{
    src: subtitlePath,
    lable: '한국어',
    language: 'ko',
    kind: 'subtitles'
  }],
  data: {}
});

// 페이지 컴포넌트: 용어체크
export const createTermPage = (terms) => ({
  path: '/term',
  section: 1,
  title: '용어체크',
  description: '이번 시간에 다룰 주요 용어를 체크해보세요.',
  script: '이번 시간에 다룰 주요 용어를 체크해보세요.',
  component: 'term',
  media: '../../../resources/media/common_word.mp3',
  data: terms.map(term => ({
    title: term.title,
    content: term.content  // 배열 또는 문자열 (이미지 포함 가능)
  }))
});

// 페이지 컴포넌트: 학습목표
export const createObjectivesPage = (contents, objectives) => ({
  path: '/objectives',
  section: 1,
  title: '학습목표',
  description: '주요 학습내용과 학습목표를 살펴보세요.',
  script: '이번 시간에 학습할 주요 학습 내용과 학습목표를 확인해보세요.',
  component: 'objectives',
  media: '../../../resources/media/common_goal.mp3',
  data: [
    {
      title: '학습내용',
      contents: contents
    },
    {
      title: '학습목표',
      contents: objectives
    }
  ]
});

// 페이지 컴포넌트: 생각묻기
export const createOpinionPage = (question) => ({
  path: '/opinion',
  section: 2,
  title: '생각묻기',
  description: '다음의 질문에 답해보세요.',
  script: '본격적인 학습을 시작하기 전 다음의 질문에 답해보세요.',
  component: 'opinion',
  media: '../../../resources/media/common_question.mp3',
  data: {
    title: question
  }
});

// 페이지 컴포넌트: 강의보기
export const createLecturePage = (videoUrl, subtitlePath, timestamps) => ({
  path: '/lecture',
  section: 2,
  title: '강의보기',
  description: '교수님의 강의에 맞춰 주도적으로 학습하세요.',
  script: '영상페이지에서는 내레이션을 제공하지 않습니다',
  component: 'lecture',
  media: videoUrl,
  caption: [{
    src: subtitlePath,
    lable: '한국어',
    language: 'ko',
    kind: 'subtitles'
  }],
  data: timestamps.map(time => ({ time }))
});

// 페이지 컴포넌트: 점검하기
export const createCheckPage = (question, professorThink, professorImage) => ({
  path: '/check',
  section: 2,
  title: '점검하기',
  description: '질문에 대한 교수님의 생각을 확인해보세요.',
  script: '질문에 대한 교수님의 생각을 확인해보세요.',
  component: 'check',
  media: '../../../resources/media/common_check.mp3',
  data: {
    title: question,
    photo: professorImage || '../images/professor-02.png',
    think: professorThink
  }
});

// 페이지 컴포넌트: 연습문제
export const createExercisePage = (exercises) => ({
  path: '/exercise',
  section: 3,
  title: '연습문제',
  description: '학습한 내용을 토대로 다음의 문제를 풀어보세요.',
  script: '학습한 내용을 얼마나 이해했는지 문제를 풀며 확인해보세요.',
  component: 'exercise',
  media: '../../../resources/media/common_quiz.mp3',
  data: exercises
});

// 연습문제 - OX (문제1 고정)
export const createBooleanExercise = (question, answer, commentary) => ({
  type: 'boolean',
  subject: question,
  value: ['O', 'X'],
  answer: answer,        // "1" 또는 "2"
  commentary: commentary
});

// 연습문제 - 4지선다 (문제2,3 고정)
export const createMultipleExercise = (question, options, answer, commentary) => ({
  type: 'multiple',
  subject: question,
  value: options,        // 4개 배열
  answer: answer,        // "1", "2", "3", "4"
  commentary: commentary
});

// 페이지 컴포넌트: 학습정리
export const createTheoremPage = (theoremContent) => ({
  path: '/theorem',
  section: 3,
  title: '학습정리',
  description: '학습한 내용을 다시 한번 정리해보세요.',
  script: '학습한 내용을 다시 한번 정리해보세요.',
  component: 'theorem',
  media: '../../../resources/media/common_summary.mp3',
  data: {
    theorem: theoremContent,  // HTML 문자열 배열 (이미지, 표 포함 가능)
    reference: ''
  }
});

// 페이지 컴포넌트: 다음안내
export const createNextPage = () => ({
  path: '/next',
  section: 3,
  title: '다음안내',
  description: '다음시간 주제를 확인하고, 미리 준비해보세요.',
  script: '이것으로 이번 시간 강의를 마쳤습니다. 수고하셨습니다.',
  component: 'next',
  media: '../../../resources/media/common_out.mp3',
  photo: '../images/professor.png',
  data: []
});

// 빌더용 간소화 데이터 (입력 폼용)
export const createBuilderLessonData = () => ({
  // 기본 정보
  weekNumber: 1,
  lessonNumber: 1,
  lessonTitle: '',

  // 오리엔테이션 (1주1차시만)
  hasOrientation: false,
  orientation: {
    videoUrl: '',
    subtitlePath: ''
  },

  // 용어체크 (3개)
  terms: [
    { title: '', content: '' },
    { title: '', content: '' },
    { title: '', content: '' }
  ],

  // 학습목표
  learningContents: ['', '', ''],
  learningObjectives: ['', '', ''],

  // 생각묻기 & 점검하기
  opinionQuestion: '',
  professorThink: '',

  // 강의보기
  lectureVideoUrl: '',
  lectureSubtitle: '',
  timestamps: ['', '', ''],
  hasPractice: false,  // 실습있음 체크박스
  practiceVideoUrl: '',  // 실습 강의 영상 URL
  practiceSubtitle: '',  // 실습 자막 파일 경로

  // 연습문제 (동적 추가/삭제, boolean 또는 multiple 선택)
  exercises: [
    {
      type: 'boolean',  // 'boolean' 또는 'multiple'
      question: '',
      answer: '2',      // boolean: "1"(O) or "2"(X), multiple: "1"~"4"
      options: [],      // multiple일 때만 사용
      commentary: ''
    }
  ],

  // 학습정리 (HTML 지원)
  summary: ['', '', ''],

  // 다운로드
  instructionUrl: '',  // 음성파일 ZIP
  guideUrl: ''         // 교안 ZIP
});
