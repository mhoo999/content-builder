import { useState } from 'react';
import { createCourseData, createBuilderLessonData, createProfessorData } from './models/dataModel';
import ProfessorSection from './components/Professor/ProfessorSection';
import PreparationSection from './components/Preparation/PreparationSection';
import LearningSection from './components/Learning/LearningSection';
import SummarySection from './components/Summary/SummarySectionNew';
import StartModal from './components/StartModal/StartModal';
import { convertDataJsonToBuilderFormat, parseSubjectsJson, parseProfessorInfo, markRelativeImages } from './utils/folderParser';
import './App.css';

function App() {
  // 전역 과목 데이터
  const [courseData, setCourseData] = useState(() => ({
    courseCode: '',
    courseName: '',
    backgroundImage: '',
    professor: createProfessorData(),
    lessons: []
  }));

  // 임포트된 이미지 저장소 (경로 -> base64)
  const [importedImages, setImportedImages] = useState({});

  // 현재 편집 중인 차시
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  // 오른쪽 사이드바 접기/펼치기
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // 시작하기 모달
  const [showStartModal, setShowStartModal] = useState(false);

  // 새 차시 추가
  const addLesson = () => {
    const newLesson = createBuilderLessonData();
    newLesson.weekNumber = Math.ceil((courseData.lessons.length + 1) / 2);
    newLesson.lessonNumber = courseData.lessons.length + 1;

    // 이전 차시의 다운로드 URL 복사
    if (courseData.lessons.length > 0) {
      const previousLesson = courseData.lessons[courseData.lessons.length - 1];
      if (previousLesson.instructionUrl) {
        newLesson.instructionUrl = previousLesson.instructionUrl;
      }
      if (previousLesson.guideUrl) {
        newLesson.guideUrl = previousLesson.guideUrl;
      }
    }

    setCourseData(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson]
    }));
    setCurrentLessonIndex(courseData.lessons.length);
  };

  // 차시 삭제
  const deleteLesson = (index) => {
    if (window.confirm('정말 이 차시를 삭제하시겠습니까?')) {
      setCourseData(prev => ({
        ...prev,
        lessons: prev.lessons.filter((_, i) => i !== index)
      }));
      if (currentLessonIndex >= index && currentLessonIndex > 0) {
        setCurrentLessonIndex(currentLessonIndex - 1);
      }
    }
  };

  // 차시 데이터 업데이트
  const updateLesson = (index, updatedLesson) => {
    setCourseData(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === index ? updatedLesson : lesson
      )
    }));
  };

  // 주차 번호 업데이트 (인라인 편집용)
  const updateLessonWeek = (index, weekNumber) => {
    const weekNum = parseInt(weekNumber) || 1;
    const lesson = courseData.lessons[index];
    updateLesson(index, { ...lesson, weekNumber: weekNum });
  };

  // 차시 제목 업데이트 (인라인 편집용)
  const updateLessonTitle = (index, title) => {
    const lesson = courseData.lessons[index];
    updateLesson(index, { ...lesson, lessonTitle: title });
  };

  // 모달에서 차시 생성
  const createLessonsFromModal = (lessonStructure) => {
    const newLessons = lessonStructure.map((structure, index) => {
      const newLesson = createBuilderLessonData();
      newLesson.weekNumber = structure.weekNumber;
      newLesson.lessonNumber = index + 1;
      newLesson.lessonTitle = structure.title;
      return newLesson;
    });

    setCourseData(prev => ({
      ...prev,
      lessons: newLessons
    }));
    setCurrentLessonIndex(0);
  };

  // 과목 정보 업데이트
  const updateCourseInfo = (field, value) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  // 교수 정보 업데이트
  const updateProfessor = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      professor: { ...prev.professor, [field]: value }
    }));
  };

  // Export to Subjects Folder
  const exportToSubjects = async () => {
    if (!courseData.courseCode) {
      alert('과목 코드를 입력해주세요.');
      return;
    }

    if (courseData.lessons.length === 0) {
      alert('차시를 추가해주세요.');
      return;
    }

    // 출력 경로 입력 받기
    // Windows/macOS/Linux 공통 경로 안내
    const isWindows = navigator.platform.toLowerCase().includes('win');
    const defaultPath = isWindows ? '~/Documents' : '~/Documents';
    const examplePath = isWindows
      ? 'C:\\Users\\username\\Documents\n또는: ~/Documents (자동 확장됨)'
      : '~/Documents\n또는: /Users/username/Documents';

    const outputPath = prompt(
      `출력 경로를 입력하세요:\n\n예: ${examplePath}`,
      defaultPath
    );

    if (!outputPath) {
      return; // 사용자가 취소
    }

    // 익스포트할 데이터에 임포트된 이미지 포함
    const exportData = {
      ...courseData,
      importedImages: importedImages
    };

    try {
      // API 호출하여 폴더 구조 생성
      const response = await fetch('/api/export-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseData: exportData,
          outputPath: outputPath
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || '폴더 생성 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      alert(
        `✅ 폴더 구조 생성 완료!\n\n` +
        `위치: ${result.outputPath}\n` +
        `차시 수: ${result.lessonCount}개`
      );
    } catch (error) {
      console.error('Export error:', error);

      // API가 없는 경우 대체 방법 안내
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `${courseData.courseCode}_builder.json`;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      const pythonCmd = isWindows ? 'python' : 'python3';
      const command = `${pythonCmd} builder_to_subjects.py ${filename} ${outputPath}`;
      const imageCount = Object.keys(importedImages).length;
      alert(
        `⚠️ API 서버가 실행되지 않았습니다.\n\n` +
        `JSON 파일이 다운로드되었습니다. (이미지 ${imageCount}개 포함)\n` +
        `터미널에서 다음 명령어를 실행하세요:\n\n${command}`
      );
    }
  };

  // Folder Import (subjects/{code}/ 폴더 구조)
  const importFolder = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      // subjects.json 찾기
      const subjectsJsonFile = files.find(f => f.webkitRelativePath.endsWith('subjects.json'));
      let lessonTitles = {};

      if (subjectsJsonFile) {
        const subjectsText = await subjectsJsonFile.text();
        const subjectsData = JSON.parse(subjectsText);
        lessonTitles = parseSubjectsJson(subjectsData);
      }

      // 이미지 파일들 찾아서 저장소에 저장
      const imageFiles = files.filter(f => {
        const path = f.webkitRelativePath.toLowerCase();
        return path.includes('/images/') &&
               (path.endsWith('.jpg') || path.endsWith('.jpeg') ||
                path.endsWith('.png') || path.endsWith('.gif') || path.endsWith('.webp'));
      });

      // 이미지를 base64로 변환하여 저장 (경로를 키로 사용)
      const imageStore = {};
      await Promise.all(
        imageFiles.map(async (file) => {
          const pathParts = file.webkitRelativePath.split('/');
          // images/filename.ext 형태로 키 생성
          const imagesIndex = pathParts.findIndex(p => p === 'images');
          if (imagesIndex !== -1) {
            const relativePath = '../' + pathParts.slice(imagesIndex).join('/');
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(file);
            });
            imageStore[relativePath] = base64;
          }
        })
      );

      // 이미지 저장소 업데이트
      setImportedImages(imageStore);
      console.log(`Imported ${Object.keys(imageStore).length} images`);

      // 모든 data.json 파일 찾기
      const dataJsonFiles = files.filter(f => f.webkitRelativePath.endsWith('/assets/data/data.json'));

      if (dataJsonFiles.length === 0) {
        alert('data.json 파일을 찾을 수 없습니다.');
        return;
      }

      // 차시 번호 추출 및 정렬
      const lessonData = await Promise.all(
        dataJsonFiles.map(async (file) => {
          const pathParts = file.webkitRelativePath.split('/');
          const lessonFolder = pathParts[pathParts.length - 4]; // subjects/{code}/{lesson}/assets/data/data.json
          const lessonNumber = parseInt(lessonFolder, 10);

          const text = await file.text();
          const dataJson = JSON.parse(text);

          return { lessonNumber, dataJson, file };
        })
      );

      // 차시 번호로 정렬
      lessonData.sort((a, b) => a.lessonNumber - b.lessonNumber);

      // 교수 정보 추출 (첫 번째 차시에서)
      const professorInfo = lessonData.length > 0
        ? parseProfessorInfo(lessonData[0].dataJson)
        : createProfessorData();

      // Builder 형식으로 변환 + 상대경로 이미지 마킹
      const lessons = lessonData.map((item, index) => {
        const builderLesson = convertDataJsonToBuilderFormat(item.dataJson, item.lessonNumber);
        builderLesson.lessonTitle = lessonTitles[item.lessonNumber] || `${item.lessonNumber}차시`;

        // 이미지가 포함된 필드들에 data-original-src 속성 추가 (경로 표시용)
        // 용어 내용
        if (builderLesson.terms) {
          builderLesson.terms = builderLesson.terms.map(term => ({
            ...term,
            content: markRelativeImages(term.content)
          }));
        }
        // 교수님 의견
        if (builderLesson.professorThink) {
          builderLesson.professorThink = markRelativeImages(builderLesson.professorThink);
        }
        // 연습문제 (문항, 해설)
        if (builderLesson.exercises) {
          builderLesson.exercises = builderLesson.exercises.map(ex => ({
            ...ex,
            question: markRelativeImages(ex.question),
            commentary: markRelativeImages(ex.commentary)
          }));
        }
        // 학습정리
        if (builderLesson.summary) {
          builderLesson.summary = builderLesson.summary.map(s =>
            markRelativeImages(s)
          );
        }

        return builderLesson;
      });

      // 과목 코드 추출 (파일 경로에서)
      // 경로 예시: "25itinse/01/assets/data/data.json" 또는 "subjects/25itinse/01/assets/data/data.json"
      // 차시 폴더(01, 02...)의 바로 상위 폴더가 과목코드
      let courseCode = '';
      if (dataJsonFiles.length > 0) {
        const pathParts = dataJsonFiles[0].webkitRelativePath.split('/');
        // pathParts 끝에서부터: data.json(-1), data(-2), assets(-3), 차시폴더(-4), 과목코드(-5)
        // 예: ['25itinse', '01', 'assets', 'data', 'data.json']
        //      [0]         [1]   [2]       [3]     [4]
        // length=5, 과목코드 인덱스 = 5-5 = 0 ✓
        // 예: ['subjects', '25itinse', '01', 'assets', 'data', 'data.json']
        //      [0]         [1]         [2]   [3]       [4]     [5]
        // length=6, 과목코드 인덱스 = 6-5 = 1 ✓
        const courseCodeIndex = pathParts.length - 5;
        if (courseCodeIndex >= 0) {
          courseCode = pathParts[courseCodeIndex];
        }

        // 추출된 코드가 숫자로만 되어 있으면 (차시 폴더를 잘못 선택한 경우) 상위 폴더 확인
        if (/^\d+$/.test(courseCode) && courseCodeIndex > 0) {
          courseCode = pathParts[courseCodeIndex - 1] || courseCode;
        }
      }

      // 과정명 추출 (첫 번째 data.json의 subject 필드에서)
      let courseName = '';
      if (lessonData.length > 0 && lessonData[0].dataJson.subject) {
        courseName = lessonData[0].dataJson.subject;
      }

      // 데이터 설정
      setCourseData({
        courseCode: courseCode,
        courseName: courseName,
        backgroundImage: '',
        professor: professorInfo,
        lessons: lessons
      });

      setCurrentLessonIndex(0);
      const imageCount = Object.keys(imageStore).length;
      alert(`${lessons.length}개 차시를 성공적으로 불러왔습니다!\n\n과목코드: ${courseCode}\n과정명: ${courseName}\n이미지: ${imageCount}개 저장됨`);

    } catch (error) {
      console.error('Folder import error:', error);
      alert('폴더를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const currentLesson = courseData.lessons[currentLessonIndex];

  return (
    <div className="app">
      {/* 시작하기 모달 */}
      {showStartModal && (
        <StartModal
          onClose={() => setShowStartModal(false)}
          onCreate={createLessonsFromModal}
        />
      )}

      {/* 헤더 */}
      <header className="header">
        <div className="header-left">
          <h1>📚 Content Builder</h1>
        </div>
        <div className="header-actions">
          <label className="btn-secondary">
            📂 Import Folder
            <input
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={importFolder}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className="btn-primary"
            onClick={exportToSubjects}
            disabled={courseData.lessons.length === 0 || !courseData.courseCode}
            title="JSON 다운로드 + 폴더 구조 생성 안내"
          >
            📁 Export to Subjects
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="main-content">
        {/* 왼쪽 사이드바 (차시 목록만) */}
        <aside className="sidebar sidebar-left">
          <div className="lessons-list">
            <div className="lessons-header">
              <h3>차시 목록</h3>
              <button
                className="btn-add"
                onClick={addLesson}
                disabled={courseData.lessons.length === 0}
              >
                + 새 차시
              </button>
            </div>

            {courseData.lessons.length === 0 ? (
              <p className="empty-message">차시를 추가해주세요</p>
            ) : (
              <div className="lesson-tabs">
                {courseData.lessons.map((lesson, index) => (
                  <div
                    key={index}
                    className={`lesson-tab ${currentLessonIndex === index ? 'active' : ''}`}
                    onClick={() => setCurrentLessonIndex(index)}
                  >
                    <div className="lesson-info">
                      <span className="lesson-number">{lesson.lessonNumber}차시</span>
                      <input
                        type="number"
                        className="week-input-inline"
                        value={lesson.weekNumber}
                        onChange={(e) => updateLessonWeek(index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        min="1"
                      />
                      <span className="week-label-inline">주</span>
                      <input
                        type="text"
                        className="title-input-inline"
                        placeholder="제목 입력"
                        value={lesson.lessonTitle}
                        onChange={(e) => updateLessonTitle(index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLesson(index);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 에디터 영역 */}
        <main className="editor-area-wrapper">
          <div className="editor-area">
          {courseData.lessons.length === 0 ? (
            <div className="welcome-screen">
              <h2>Content Builder에 오신 것을 환영합니다! 👋</h2>
              <p>차시 구조를 먼저 만들어 시작하세요.</p>
              <button className="btn-start-center" onClick={() => setShowStartModal(true)}>
                시작하기
              </button>
            </div>
          ) : currentLesson ? (
            <div className="lesson-editor">
              <h2>{currentLesson.lessonNumber}차시 편집</h2>
              <p className="subtitle">
                {(() => {
                  // 같은 주차에 속한 차시들 중에서 현재 차시가 몇 번째인지 계산
                  const sameWeekLessons = courseData.lessons.filter(
                    lesson => lesson.weekNumber === currentLesson.weekNumber
                  ).sort((a, b) => a.lessonNumber - b.lessonNumber);
                  const weekLessonNumber = sameWeekLessons.findIndex(
                    lesson => lesson.lessonNumber === currentLesson.lessonNumber
                  ) + 1;
                  return `${currentLesson.weekNumber}주 ${weekLessonNumber}차`;
                })()}
              </p>

              {/* 기본 정보 */}
              <div className="form-section">
                <h3>📝 기본 정보</h3>
                <div className="form-group">
                  <label>차시명</label>
                  <input
                    type="text"
                    placeholder="예: 암호학의 기본 개념"
                    value={currentLesson.lessonTitle}
                    onChange={(e) => {
                      const updated = { ...currentLesson, lessonTitle: e.target.value };
                      updateLesson(currentLessonIndex, updated);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>주차</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="예: 1"
                    value={currentLesson.weekNumber}
                    onChange={(e) => {
                      const weekNum = parseInt(e.target.value, 10) || 1;
                      const updated = { ...currentLesson, weekNumber: weekNum };
                      updateLesson(currentLessonIndex, updated);
                    }}
                  />
                  <small className="hint">💡 주차 번호를 입력하세요 (예: 1주, 2주)</small>
                </div>
              </div>

              {/* 준비하기 섹션 */}
              <PreparationSection
                lessonData={currentLesson}
                onUpdate={(updated) => updateLesson(currentLessonIndex, updated)}
              />

              {/* 학습하기 섹션 */}
              <LearningSection
                lessonData={currentLesson}
                onUpdate={(updated) => updateLesson(currentLessonIndex, updated)}
              />

              {/* 정리하기 섹션 */}
              <SummarySection
                lessonData={currentLesson}
                onUpdate={(updated) => updateLesson(currentLessonIndex, updated)}
              />
            </div>
          ) : null}
          </div>
        </main>

        {/* 오른쪽 사이드바 (과목 정보, 교수 정보) */}
        <aside className={`sidebar sidebar-right ${rightSidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="sidebar-toggle" onClick={() => setRightSidebarOpen(!rightSidebarOpen)}>
            {rightSidebarOpen ? '▶' : '◀'}
          </div>
          {rightSidebarOpen && (
            <div className="sidebar-content">
              {/* 과목 정보 */}
              <div className="sidebar-section">
                <h3>과목 정보</h3>
                <div className="form-group">
                  <label>과목 코드</label>
                  <input
                    type="text"
                    placeholder="예: 25itinse"
                    value={courseData.courseCode}
                    onChange={(e) => updateCourseInfo('courseCode', e.target.value)}
                    disabled={courseData.lessons.length === 0}
                  />
                </div>
                <div className="form-group">
                  <label>과정명</label>
                  <input
                    type="text"
                    placeholder="예: 인터넷보안"
                    value={courseData.courseName}
                    onChange={(e) => updateCourseInfo('courseName', e.target.value)}
                    disabled={courseData.lessons.length === 0}
                  />
                </div>
              </div>

              {/* 교수 정보 */}
              <div className="sidebar-section">
                <h3>교수 정보</h3>
                <ProfessorSection
                  professor={courseData.professor}
                  onUpdate={(updated) => setCourseData(prev => ({ ...prev, professor: updated }))}
                  disabled={courseData.lessons.length === 0}
                />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;
