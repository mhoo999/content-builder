/**
 * Subjects 폴더 구조 파싱 유틸리티
 * subjects/{code}/{lesson}/assets/data/data.json 구조를 파싱하여
 * Builder 데이터 형식으로 변환
 */

/**
 * 페이지 배열에서 특정 컴포넌트 타입의 페이지 찾기
 */
const findPageByComponent = (pages, componentType) => {
  return pages.find(page => page.component === componentType);
};

/**
 * 페이지 배열에서 특정 컴포넌트 타입의 모든 페이지 찾기
 */
const findAllPagesByComponent = (pages, componentType) => {
  return pages.filter(page => page.component === componentType);
};

/**
 * data.json 파일을 Builder 형식으로 변환
 */
export const convertDataJsonToBuilderFormat = (dataJson, lessonNumber) => {
  const pages = dataJson.pages || [];

  // 오리엔테이션 확인 (1주1차시만 가능)
  const orientationPage = findPageByComponent(pages, 'orientation');
  const hasOrientation = !!orientationPage;

  // 용어체크 파싱
  const termPage = findPageByComponent(pages, 'term');
  const terms = termPage?.data?.map(term => ({
    title: term.title || '',
    content: Array.isArray(term.content) ? term.content.join('\n') : (term.content || '')
  })) || [{ title: '', content: '' }];

  // 학습목표 파싱
  const objectivesPage = findPageByComponent(pages, 'objectives');
  const learningContents = objectivesPage?.data?.[0]?.contents || ['', '', ''];
  const learningObjectives = objectivesPage?.data?.[1]?.contents || ['', '', ''];

  // 생각묻기 & 점검하기 파싱
  const opinionPage = findPageByComponent(pages, 'opinion');
  const checkPage = findPageByComponent(pages, 'check');
  const opinionQuestion = opinionPage?.data?.title || '';
  const professorThink = checkPage?.data?.think || '';

  // 강의보기 파싱
  const lecturePage = findPageByComponent(pages, 'lecture');
  const lectureVideoUrl = lecturePage?.media || '';
  const lectureSubtitle = lecturePage?.caption?.[0]?.src || '';
  const timestamps = lecturePage?.data?.map(item => item.time || '') || ['', '', ''];

  // 연습문제 파싱
  const exercisePage = findPageByComponent(pages, 'exercise');
  const exercisesData = exercisePage?.data || [];
  const exercises = exercisesData.map(ex => {
    if (ex.type === 'boolean') {
      return {
        type: 'boolean',
        question: ex.subject || '',
        answer: ex.answer || '2',
        options: [],
        commentary: ex.commentary || ''
      };
    } else if (ex.type === 'multiple') {
      return {
        type: 'multiple',
        question: ex.subject || '',
        answer: ex.answer || '1',
        options: ex.value || ['', '', '', ''],
        commentary: ex.commentary || ''
      };
    }
    return {
      type: 'boolean',
      question: '',
      answer: '2',
      options: [],
      commentary: ''
    };
  });

  // 최소 1개의 연습문제 보장
  if (exercises.length === 0) {
    exercises.push({
      type: 'boolean',
      question: '',
      answer: '2',
      options: [],
      commentary: ''
    });
  }

  // 학습정리 파싱
  const theoremPage = findPageByComponent(pages, 'theorem');
  const summary = theoremPage?.data?.theorem || ['', '', ''];

  // 차시명 추출 (subjects.json에서 가져오는 것이 정확하지만, 여기서는 기본값)
  const weekNumber = dataJson.index || Math.ceil(lessonNumber / 2);

  return {
    weekNumber: weekNumber,
    lessonNumber: lessonNumber,
    lessonTitle: '', // subjects.json에서 가져와야 함

    hasOrientation: hasOrientation,
    orientation: hasOrientation ? {
      videoUrl: orientationPage?.media || '',
      subtitlePath: orientationPage?.caption?.[0]?.src || ''
    } : {
      videoUrl: '',
      subtitlePath: ''
    },

    terms: terms,
    learningContents: learningContents,
    learningObjectives: learningObjectives,

    opinionQuestion: opinionQuestion,
    professorThink: professorThink,

    lectureVideoUrl: lectureVideoUrl,
    lectureSubtitle: lectureSubtitle,
    timestamps: timestamps,

    exercises: exercises,
    summary: summary,

    instructionUrl: dataJson.instruction || '',
    guideUrl: dataJson.guide || ''
  };
};

/**
 * subjects.json 파일 파싱하여 주차별 차시 정보 추출
 */
export const parseSubjectsJson = (subjectsJson) => {
  const weeks = subjectsJson.weeks || [];
  const lessonTitles = {};
  let lessonCounter = 1;

  weeks.forEach(week => {
    const weekLessons = week.lessons || [];
    weekLessons.forEach(lessonTitle => {
      lessonTitles[lessonCounter] = lessonTitle;
      lessonCounter++;
    });
  });

  return lessonTitles;
};

/**
 * 교수 정보 파싱 (intro 페이지에서 추출)
 */
export const parseProfessorInfo = (dataJson) => {
  const pages = dataJson.pages || [];
  const introPage = findPageByComponent(pages, 'intro');

  if (!introPage || !introPage.data || !introPage.data.professor) {
    return {
      name: '',
      photo: '',
      education: [''],
      career: ['']
    };
  }

  const prof = introPage.data.professor;
  const profile = prof.profile || [];

  const educationItem = profile.find(item => item.title && item.title.includes('학'));
  const careerItem = profile.find(item => item.title && item.title.includes('경'));

  return {
    name: prof.name || '',
    photo: prof.photo || '',
    education: educationItem?.content || [''],
    career: careerItem?.content || ['']
  };
};
