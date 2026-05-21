#!/usr/bin/env node
/**
 * subjects 폴더 → Builder JSON 변환
 * Usage: node cli/import.js <course_folder> [output_file]
 *
 * Example:
 *   node cli/import.js /path/to/subjects/18italgo
 *   node cli/import.js /path/to/subjects/18italgo output.json
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * 템플릿 감지 (index.html 파일 분석)
 */
async function detectTemplate(indexHtmlPath) {
  try {
    const html = await fs.readFile(indexHtmlPath, 'utf-8');

    // base.css 먼저 확인 (더 신뢰할 수 있는 지표)
    const baseCssMatch = html.match(/base\.([\w-]+)\.css/);
    if (baseCssMatch) {
      const theme = baseCssMatch[1];

      // 템플릿 프리셋 감지: theme 이름 기반
      // 2018: type-1 ~ type-4
      // 2019: type-5 ~ type-8
      // 2020: type-9 ~ type-12
      // 2021: type-13 ~ type-16
      // 2022+: type-17+
      const themeNum = parseInt(theme.replace('type-', ''));
      if (themeNum >= 1 && themeNum <= 4) {
        return { preset: '2018-standard', theme };
      } else if (themeNum >= 5 && themeNum <= 8) {
        return { preset: '2019-standard', theme };
      } else if (themeNum >= 9 && themeNum <= 12) {
        return { preset: '2020-standard', theme };
      } else if (themeNum >= 13 && themeNum <= 16) {
        return { preset: '2021-standard', theme };
      } else {
        return { preset: '2025-standard', theme };
      }
    }

    // Fallback: main.css 패턴으로 감지
    const mainCssMatch = html.match(/main\.([\w-]+)\.css/);
    if (mainCssMatch) {
      const theme = mainCssMatch[1];
      return { preset: '2025-standard', theme };
    }

    // 기본값
    return { preset: '2025-standard', theme: 'type-1' };
  } catch (error) {
    console.warn(`⚠️ 템플릿 감지 실패: ${error.message}`);
    return { preset: '2025-standard', theme: 'type-1' };
  }
}

/**
 * 이미지 파일을 base64로 변환
 */
async function imageToBase64(imagePath) {
  try {
    const buffer = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/png';

    if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === '.gif') {
      mimeType = 'image/gif';
    } else if (ext === '.svg') {
      mimeType = 'image/svg+xml';
    } else if (ext === '.webp') {
      mimeType = 'image/webp';
    }

    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.warn(`⚠️ 이미지 변환 실패: ${imagePath}`);
    return null;
  }
}

/**
 * subjects.json 파싱
 */
function parseSubjectsJson(subjectsJson) {
  const lessonTitles = {};
  const weekTitles = {};
  const examWeeks = [];
  let lessonCounter = 1;

  const subjects = subjectsJson.subjects || [];

  subjects.forEach((subject) => {
    // 주차 번호 추출
    let weekNumberMatch = subject.title?.match(/<span[^>]*>(\d+)주<\/span>/);
    if (!weekNumberMatch) {
      weekNumberMatch = subject.title?.match(/(\d+)주/);
    }
    const weekNumber = weekNumberMatch ? parseInt(weekNumberMatch[1], 10) : null;

    // 주차 타이틀 추출
    let weekTitle = subject.title || '';
    if (typeof weekTitle === 'string') {
      weekTitle = weekTitle.replace(/<span[^>]*>.*?<\/span>\s*/g, '').trim();
      weekTitle = weekTitle.replace(/^\d+주\s*/, '').trim();
      weekTitle = weekTitle.replace(/<[^>]+>/g, '').trim();
    }

    if (weekTitle && weekNumber) {
      weekTitles[weekNumber] = weekTitle;
    }

    const lists = subject.lists || [];

    // lists가 없는 주차는 시험 주차
    if (lists.length === 0 && weekNumber) {
      examWeeks.push({
        weekNumber: weekNumber,
        weekTitle: weekTitle,
      });
    }

    lists.forEach((listItem) => {
      let title = listItem;

      if (typeof listItem === 'string') {
        title = listItem.replace(/<span[^>]*>.*?<\/span>\s*/g, '').trim();
        title = title.replace(/^\d+차\s+/, '').trim();
      }

      if (title) {
        lessonTitles[lessonCounter] = title;
        lessonCounter++;
      }
    });
  });

  return { lessonTitles, weekTitles, examWeeks };
}

/**
 * data.json을 Builder 형식으로 변환 (simplified version)
 */
function convertDataJsonToBuilderFormat(dataJson, lessonNumber, lessonTitle = '', weekTitle = '', weekNumber = null) {
  // 현장실습 주차 감지
  if (dataJson.image && !dataJson.pages) {
    return {
      isPracticeWeek: true,
      practiceImage: dataJson.image,
      lessonNumber: lessonNumber,
      weekNumber: weekNumber || Math.ceil(lessonNumber / 2),
      weekTitle: weekTitle,
      lessonTitle: lessonTitle,
      sectionInWeek: 1,
    };
  }

  const pages = dataJson.pages || [];

  // Helper functions
  const findPageByComponent = (pages, componentType) => {
    return pages.find((page) => page.component === componentType);
  };

  // 오리엔테이션
  const orientationPage = findPageByComponent(pages, 'orientation');
  const hasOrientation = !!orientationPage;

  // 용어체크
  const termPage = findPageByComponent(pages, 'term');
  const termData = Array.isArray(termPage?.data) ? termPage.data : [];
  const terms = termData.map((term) => ({
    title: term.title || '',
    content: Array.isArray(term.content) ? term.content : [term.content || ''],
  }));

  // 학습목표
  const objectivesPage = findPageByComponent(pages, 'objectives');
  const learningContents = objectivesPage?.data?.[0]?.contents || [];
  const learningObjectives = objectivesPage?.data?.[1]?.contents || [];

  // 생각묻기 & 점검하기
  const opinionPage = findPageByComponent(pages, 'opinion');
  const checkPage = findPageByComponent(pages, 'check');
  const opinionQuestion = opinionPage?.data?.title || '';
  const professorThink = checkPage?.data?.think || '';

  // 강의보기
  const lecturePage = findPageByComponent(pages, 'lecture');
  const lectureVideoUrl = lecturePage?.media || '';
  const lectureSubtitle = lecturePage?.caption?.[0]?.src || '';
  const timestamps = Array.isArray(lecturePage?.data)
    ? lecturePage.data.map((item) => ({
        time: item.time || '',
        title: item.title || '',
      }))
    : [];

  // 실습
  const practicePage = findPageByComponent(pages, 'practice');
  const hasPractice = !!practicePage;
  const practiceVideoUrl = practicePage?.media || '';
  const practiceSubtitle = practicePage?.caption?.[0]?.src || '';
  const practiceTimestamps = Array.isArray(practicePage?.data)
    ? practicePage.data.map((item) => ({
        time: item.time || '',
        title: item.title || '',
      }))
    : [];

  // 연습문제
  const exercisePage = findPageByComponent(pages, 'exercise');
  const exercisesData = exercisePage?.data || [];
  const exercises = exercisesData.map((ex) => {
    if (ex.type === 'boolean') {
      return {
        type: 'boolean',
        question: ex.subject || '',
        answer: ex.answer || '2',
        options: [],
        commentary: ex.commentary || '',
      };
    } else {
      return {
        type: 'multiple',
        question: ex.subject || '',
        answer: ex.answer || '1',
        options: ex.value || ['', '', '', ''],
        commentary: ex.commentary || '',
      };
    }
  });

  // 학습정리
  const theoremPage = findPageByComponent(pages, 'theorem');
  const summary = theoremPage?.data?.theorem || [];
  const reference = theoremPage?.data?.reference || '';

  // 주차 정보
  const calculatedWeekNumber = weekNumber || dataJson.index || Math.ceil(lessonNumber / 2);
  const sectionInWeek = dataJson.section || ((lessonNumber - 1) % 2) + 1;

  return {
    weekNumber: calculatedWeekNumber,
    lessonNumber: lessonNumber,
    lessonTitle: lessonTitle,
    weekTitle: weekTitle,
    sectionInWeek: sectionInWeek,

    hasOrientation: hasOrientation,
    orientation: hasOrientation
      ? {
          videoUrl: orientationPage?.media || '',
          subtitlePath: orientationPage?.caption?.[0]?.src || '',
          description: orientationPage?.description || '',
          script: orientationPage?.script || '',
        }
      : {
          videoUrl: '',
          subtitlePath: '',
          description: '',
          script: '',
        },

    terms: terms.length > 0 ? terms : [{ title: '', content: [''] }],
    termDescription: termPage?.description || '',
    termScript: termPage?.script || '',

    learningContents: learningContents,
    learningObjectives: learningObjectives,
    objectivesDescription: objectivesPage?.description || '',
    objectivesScript: objectivesPage?.script || '',

    opinionQuestion: opinionQuestion,
    professorThink: professorThink,
    checkDescription: checkPage?.description || '',
    checkScript: checkPage?.script || '',

    lectureVideoUrl: lectureVideoUrl,
    lectureSubtitle: lectureSubtitle,
    timestamps: timestamps,

    hasPractice: hasPractice,
    practiceContent: '',
    practiceVideoUrl: practiceVideoUrl,
    practiceSubtitle: practiceSubtitle,
    practiceTimestamps: practiceTimestamps,

    exercises: exercises.length > 0 ? exercises : [{ type: 'boolean', question: '', answer: '2', options: [], commentary: '' }],
    summary: summary,
    reference: reference,

    instructionUrl: dataJson.instruction || '',
    guideUrl: dataJson.guide || '',
  };
}

/**
 * 교수 정보 파싱
 */
function parseProfessorInfo(dataJson) {
  const pages = dataJson.pages || [];
  const introPage = pages.find((page) => page.component === 'intro');

  if (!introPage || !introPage.data || !introPage.data.professor) {
    return {
      name: '',
      photo: '',
      education: [''],
      career: [''],
      introMedia: '',
    };
  }

  const prof = introPage.data.professor;
  const profile = prof.profile || [];

  const educationItem = profile.find((item) => item.title && item.title.includes('학'));
  const careerItem = profile.find((item) => item.title && item.title.includes('경'));

  return {
    name: prof.name || '',
    photo: prof.photo || '',
    education: educationItem?.content || [''],
    career: careerItem?.content || [''],
    introMedia: introPage?.media || '',
  };
}

/**
 * 메인 import 함수
 */
async function importCourse(courseFolderPath, outputFile = null) {
  console.log(`📂 Import 시작: ${courseFolderPath}`);

  // 1. subjects.json 읽기
  const subjectsJsonPath = path.join(courseFolderPath, 'subjects.json');
  const subjectsJson = JSON.parse(await fs.readFile(subjectsJsonPath, 'utf-8'));
  const { lessonTitles, weekTitles, examWeeks } = parseSubjectsJson(subjectsJson);

  console.log(`  📝 발견된 차시: ${Object.keys(lessonTitles).length}개`);

  // 2. 과목 코드 추출 (폴더명)
  const courseCode = path.basename(courseFolderPath);
  const courseName = subjectsJson.subjects?.[0]?.title || courseCode;

  // 3. 첫 번째 차시의 index.html에서 템플릿 감지
  const firstLessonNum = Math.min(...Object.keys(lessonTitles).map(Number));
  const firstLessonFolder = path.join(courseFolderPath, String(firstLessonNum).padStart(2, '0'));
  const indexHtmlPath = path.join(firstLessonFolder, 'index.html');
  const { preset, theme } = await detectTemplate(indexHtmlPath);

  console.log(`  🎨 감지된 템플릿: ${preset} (${theme})`);

  // 4. 각 차시 데이터 수집
  const lessons = [];
  const importedImages = {};
  const importedSubtitles = {};
  const imagesDir = path.join(courseFolderPath, 'images');
  const subtitlesDir = path.join(courseFolderPath, 'subtitles');

  // 교수 정보는 첫 번째 차시에서 추출
  let professor = null;

  for (const [lessonNumStr, lessonTitle] of Object.entries(lessonTitles)) {
    const lessonNum = parseInt(lessonNumStr);
    const lessonFolder = path.join(courseFolderPath, String(lessonNum).padStart(2, '0'));
    const dataJsonPath = path.join(lessonFolder, 'assets', 'data', 'data.json');

    try {
      const dataJson = JSON.parse(await fs.readFile(dataJsonPath, 'utf-8'));

      // 교수 정보 추출 (첫 번째 차시만)
      if (!professor) {
        professor = parseProfessorInfo(dataJson);
      }

      // 주차 정보
      const weekNumber = dataJson.index || Math.ceil(lessonNum / 2);
      const weekTitle = weekTitles[weekNumber] || '';

      // Builder 형식으로 변환
      const lesson = convertDataJsonToBuilderFormat(dataJson, lessonNum, lessonTitle, weekTitle, weekNumber);
      lessons.push(lesson);

      console.log(`  ✅ ${String(lessonNum).padStart(2, '0')}차: ${lessonTitle}`);
    } catch (error) {
      console.warn(`  ⚠️ ${String(lessonNum).padStart(2, '0')}차 읽기 실패: ${error.message}`);
    }
  }

  // 5. images 폴더의 모든 이미지를 base64로 변환
  try {
    const imageFiles = await fs.readdir(imagesDir);
    for (const file of imageFiles) {
      const imagePath = path.join(imagesDir, file);
      const stat = await fs.stat(imagePath);
      if (stat.isFile()) {
        const base64 = await imageToBase64(imagePath);
        if (base64) {
          importedImages[`../images/${file}`] = base64;
        }
      }
    }
    console.log(`  📷 이미지 ${Object.keys(importedImages).length}개 변환 완료`);
  } catch (error) {
    console.warn(`  ⚠️ 이미지 폴더 읽기 실패: ${error.message}`);
  }

  // 6. subtitles 폴더의 모든 자막 파일 읽기
  try {
    const subtitleFiles = await fs.readdir(subtitlesDir);
    for (const file of subtitleFiles) {
      const subtitlePath = path.join(subtitlesDir, file);
      const stat = await fs.stat(subtitlePath);
      if (stat.isFile() && file.endsWith('.vtt')) {
        const content = await fs.readFile(subtitlePath, 'utf-8');
        importedSubtitles[file] = content;
      }
    }
    console.log(`  📝 자막 ${Object.keys(importedSubtitles).length}개 읽기 완료`);
  } catch (error) {
    console.warn(`  ⚠️ 자막 폴더 읽기 실패: ${error.message}`);
  }

  // 7. Builder JSON 생성
  const builderJson = {
    courseCode: courseCode,
    courseName: courseName,
    courseType: 'general',
    year: new Date().getFullYear().toString(),
    templatePreset: preset,
    templateTheme: theme,
    professor: professor || {
      name: '',
      photo: '',
      education: [''],
      career: [''],
      introMedia: '',
    },
    lessons: lessons,
    examWeeks: examWeeks,
    importedImages: importedImages,
    importedSubtitles: importedSubtitles,
  };

  // 8. 출력
  const outputPath = outputFile || path.join(process.cwd(), `${courseCode}_builder.json`);
  await fs.writeFile(outputPath, JSON.stringify(builderJson, null, 2), 'utf-8');

  console.log(`\n✅ Import 완료!`);
  console.log(`📄 출력 파일: ${outputPath}`);
  console.log(`📊 총 ${lessons.length}개 차시 변환`);

  return outputPath;
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node cli/import.js <course_folder> [output_file]');
    console.log('');
    console.log('Example:');
    console.log('  node cli/import.js /path/to/subjects/18italgo');
    console.log('  node cli/import.js /path/to/subjects/18italgo output.json');
    process.exit(1);
  }

  const courseFolderPath = args[0];
  const outputFile = args[1] || null;

  importCourse(courseFolderPath, outputFile)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Import 실패:', error);
      process.exit(1);
    });
}

module.exports = { importCourse };
