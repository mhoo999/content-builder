import { useState } from 'react';
import { createCourseData, createBuilderLessonData, createProfessorData } from './models/dataModel';
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

  // 새 차시 추가
  const addLesson = () => {
    const newLesson = createBuilderLessonData();
    newLesson.weekNumber = Math.ceil((courseData.lessons.length + 1) / 2);
    newLesson.lessonNumber = courseData.lessons.length + 1;

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
          alert('데이터를 성공적으로 불러왔습니다!');
        } catch (error) {
          alert('JSON 파일을 읽는 중 오류가 발생했습니다: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const currentLesson = courseData.lessons[currentLessonIndex];

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <h1>📚 Content Builder</h1>
        <div className="header-actions">
          <label className="btn-secondary">
            📥 Import
            <input
              type="file"
              accept=".json"
              onChange={importJSON}
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
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="main-content">
        {/* 사이드바 */}
        <aside className="sidebar">
          <div className="course-info-section">
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
        <main className="editor-area">
          {courseData.lessons.length === 0 ? (
            <div className="welcome-screen">
              <h2>Content Builder에 오신 것을 환영합니다! 👋</h2>
              <p>왼쪽 사이드바에서 "새 차시"를 클릭하여 시작하세요.</p>
            </div>
          ) : currentLesson ? (
            <div className="lesson-editor">
              <h2>{currentLesson.lessonNumber}차시 편집</h2>
              <p className="subtitle">
                {currentLesson.weekNumber}주 {currentLesson.lessonNumber % 2 === 1 ? '1' : '2'}차
              </p>

              {/* 여기에 폼 컴포넌트들이 들어갈 예정 */}
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
              </div>

              <div className="coming-soon">
                <p>🚧 폼 컴포넌트 구현 중...</p>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
