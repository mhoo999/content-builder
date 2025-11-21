import { useState, useEffect } from 'react';
import { createCourseData, createBuilderLessonData, createProfessorData } from './models/dataModel';
import ProfessorSection from './components/Professor/ProfessorSection';
import PreparationSection from './components/Preparation/PreparationSection';
import LearningSection from './components/Learning/LearningSection';
import SummarySection from './components/Summary/SummarySectionNew';
import Home from './components/Home/Home';
import { convertDataJsonToBuilderFormat, parseSubjectsJson, parseProfessorInfo } from './utils/folderParser';
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

  // 현재 편집 중인 차시
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  // 오른쪽 사이드바 접기/펼치기
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // 화면 모드 (home: 홈 화면, editor: 에디터 화면)
  const [viewMode, setViewMode] = useState('home');

  // 자동 저장 (로컬 스토리지)
  useEffect(() => {
    if (viewMode === 'editor' && courseData.courseCode && courseData.lessons.length > 0) {
      const projectKey = `content-builder-project-${courseData.courseCode}`;
      const dataToSave = {
        ...courseData,
        lastModified: new Date().toISOString()
      };
      try {
        localStorage.setItem(projectKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('자동 저장 실패:', error);
      }
    }
  }, [courseData, viewMode]);

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

  // JSON Export
  const exportJSON = () => {
    const dataStr = JSON.stringify(courseData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${courseData.courseCode || 'course'}_builder.json`;
    link.click();
    URL.revokeObjectURL(url);
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
    const defaultPath = '~/IdeaProjects/contents_it/subjects';
    const outputPath = prompt(
      '출력 경로를 입력하세요:\n\n' +
      '예: ~/IdeaProjects/contents_it/subjects\n' +
      '또는: /Users/username/projects/subjects',
      defaultPath
    );

    if (!outputPath) {
      return; // 사용자가 취소
    }

    try {
      // API 호출하여 폴더 구조 생성
      const response = await fetch('/api/export-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseData: courseData,
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
      const dataStr = JSON.stringify(courseData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `${courseData.courseCode}_builder.json`;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      const command = `python3 builder_to_subjects.py ${filename} ${outputPath}`;
      alert(
        `⚠️ API 서버가 실행되지 않았습니다.\n\n` +
        `JSON 파일이 다운로드되었습니다.\n` +
        `터미널에서 다음 명령어를 실행하세요:\n\n${command}`
      );
    }
  };

  // JSON Import
  const importJSON = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setCourseData(data);
          setCurrentLessonIndex(0);
          setViewMode('editor');
          alert('데이터를 성공적으로 불러왔습니다!');
        } catch (error) {
          alert('JSON 파일을 읽는 중 오류가 발생했습니다: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  // 프로젝트 불러오기 (홈 화면에서)
  const handleLoadProject = (data) => {
    setCourseData(data);
    setCurrentLessonIndex(0);
    setViewMode('editor');
  };

  // 새 프로젝트 시작
  const handleNewProject = () => {
    if (courseData.lessons.length > 0) {
      if (!window.confirm('현재 작업 중인 내용이 사라집니다. 새 프로젝트를 시작하시겠습니까?')) {
        return;
      }
    }
    setCourseData({
      courseCode: '',
      courseName: '',
      backgroundImage: '',
      professor: createProfessorData(),
      lessons: []
    });
    setCurrentLessonIndex(0);
    setViewMode('editor');
  };

  // Folder Import (subjects/{code}/ 폴더 구조)
  const importFolder = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      // subjects.json 찾기
      const subjectsJsonFile = files.find(f => f.webkitRelativePath.endsWith('subjects.json'));
      let lessonTitles = {};
      let courseCode = '';
      let courseName = '';

      if (subjectsJsonFile) {
        const subjectsText = await subjectsJsonFile.text();
        const subjectsData = JSON.parse(subjectsText);
        lessonTitles = parseSubjectsJson(subjectsData);
        courseCode = subjectsData.courseCode || '';
        courseName = subjectsData.courseName || '';
      }

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

      // Builder 형식으로 변환
      const lessons = lessonData.map((item, index) => {
        const builderLesson = convertDataJsonToBuilderFormat(item.dataJson, item.lessonNumber);
        builderLesson.lessonTitle = lessonTitles[item.lessonNumber] || `${item.lessonNumber}차시`;
        return builderLesson;
      });

      // 과목 코드 추출 (파일 경로에서)
      if (!courseCode && dataJsonFiles.length > 0) {
        const pathParts = dataJsonFiles[0].webkitRelativePath.split('/');
        courseCode = pathParts[1] || '';
      }

      // 데이터 설정
      setCourseData({
        courseCode: courseCode,
        courseName: courseName || courseData.courseName,
        backgroundImage: '',
        professor: professorInfo,
        lessons: lessons
      });

      setCurrentLessonIndex(0);
      setViewMode('editor');
      alert(`${lessons.length}개 차시를 성공적으로 불러왔습니다!`);

    } catch (error) {
      console.error('Folder import error:', error);
      alert('폴더를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const currentLesson = courseData.lessons[currentLessonIndex];

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <div className="header-left">
          {viewMode === 'editor' && (
            <button
              className="btn-home-link"
              onClick={() => {
                if (window.confirm('홈으로 이동하시겠습니까? (작업 내용은 자동 저장됩니다)')) {
                  setViewMode('home');
                }
              }}
            >
              🏠 홈
            </button>
          )}
          <h1>📚 Content Builder</h1>
        </div>
        <div className="header-actions">
          <label className="btn-secondary">
            📥 Import JSON
            <input
              type="file"
              accept=".json"
              onChange={importJSON}
              style={{ display: 'none' }}
            />
          </label>
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
            className="btn-secondary"
            onClick={exportJSON}
            disabled={courseData.lessons.length === 0}
          >
            📤 Export JSON
          </button>
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
      {viewMode === 'home' ? (
        <Home
          onNewProject={handleNewProject}
          onLoadProject={handleLoadProject}
        />
      ) : (
        <div className="main-content">
        {/* 왼쪽 사이드바 (차시 목록만) */}
        <aside className="sidebar sidebar-left">
          <div className="lessons-list">
            <div className="lessons-header">
              <h3>차시 목록</h3>
              <button className="btn-add" onClick={addLesson}>
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
                    <span className="lesson-number">{lesson.lessonNumber}차시</span>
                    <span className="lesson-title">
                      {lesson.lessonTitle || '제목 없음'}
                    </span>
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
              <p>왼쪽 사이드바에서 "새 차시"를 클릭하여 시작하세요.</p>
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
                  />
                </div>
                <div className="form-group">
                  <label>과정명</label>
                  <input
                    type="text"
                    placeholder="예: 인터넷보안"
                    value={courseData.courseName}
                    onChange={(e) => updateCourseInfo('courseName', e.target.value)}
                  />
                </div>
              </div>

              {/* 교수 정보 */}
              <div className="sidebar-section">
                <h3>교수 정보</h3>
                <ProfessorSection
                  professor={courseData.professor}
                  onUpdate={(updated) => setCourseData(prev => ({ ...prev, professor: updated }))}
                />
              </div>
            </div>
          )}
        </aside>
        </div>
      )}
    </div>
  );
}

export default App;
