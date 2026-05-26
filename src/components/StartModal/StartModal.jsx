import { useState } from 'react';
import './StartModal.css';

function StartModal({ onClose, onCreate }) {
  const [courseType, setCourseType] = useState('general'); // 과정 유형
  const [startLesson, setStartLesson] = useState(1);
  const [endLesson, setEndLesson] = useState(26);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // 강의 개수 계산
  const lessonCount = endLesson - startLesson + 1;

  // 필수 입력 검증
  const isFormValid = () => {
    return courseCode.trim() !== '' &&
           courseName.trim() !== '' &&
           year.trim() !== '' &&
           startLesson >= 1 &&
           endLesson >= startLesson &&
           lessonCount <= 100;
  };

  // 생성 버튼
  const handleCreate = () => {
    if (!isFormValid()) {
      return;
    }

    // 시작~끝 강의 번호만큼 생성 (2개 강의당 1주차)
    const lessons = Array.from({ length: lessonCount }, (_, index) => {
      const lessonNumber = startLesson + index;
      let weekNumber = Math.ceil(lessonNumber / 2);
      // 일반 과정: 8주를 건너뜀 (중간고사)
      if (courseType === 'general' && weekNumber >= 8) {
        weekNumber += 1;
      }
      // 사회복지현장실습: 8주, 16주를 건너뜀 (현장실습 주차)
      if (courseType === 'social-work-practice') {
        if (weekNumber >= 16) {
          weekNumber += 2; // 8주, 16주 모두 건너뜀
        } else if (weekNumber >= 8) {
          weekNumber += 1; // 8주만 건너뜀
        }
      }
      return {
        lessonNumber,
        weekNumber,
        title: ''
      };
    });

    onCreate(lessons, courseCode.trim(), courseName.trim(), year.trim(), courseType);
    onClose();
  };

  return (
    <div className="start-modal-overlay" onClick={onClose}>
      <div className="start-modal" onClick={(e) => e.stopPropagation()}>
        <div className="start-modal-header">
          <div>
            <span className="modal-kicker">새 과목 시작</span>
            <h2>차시 구조 만들기</h2>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="start-modal-body">
          <div className="modal-steps">
            <span className="active">1 과정 유형</span>
            <span>2 기본 정보</span>
            <span>3 차시 구조</span>
          </div>

          <div className="course-info-section">
            <div className="form-group-modal">
              <label>과정 유형 <span className="required">*</span></label>
              <select
                className="course-input"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
              >
                <option value="general">일반</option>
                <option value="social-work-practice">사회복지현장실습</option>
              </select>
            </div>
            <div className="form-group-modal">
              <label>과목 코드 <span className="required">*</span></label>
              <input
                type="text"
                className="course-input"
                placeholder="예: 25itinse"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group-modal">
              <label>과정명 <span className="required">*</span></label>
              <input
                type="text"
                className="course-input"
                placeholder="예: 인터넷보안"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>
            <div className="form-group-modal">
              <label>연도 <span className="required">*</span></label>
              <input
                type="text"
                className="course-input"
                placeholder="예: 2025"
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="divider"></div>

          <p className="modal-description">
            몇 강부터 몇 강까지 만들까요?<br />
            <small>
              {courseType === 'general'
                ? '2개 강의당 1주차로 자동 생성됩니다. (8주는 중간고사로 건너뜀)'
                : '2개 강의당 1주차로 자동 생성됩니다. (8주, 16주는 현장실습으로 건너뜀)'}
            </small>
          </p>

          <div className="lesson-range-wrapper">
            <div className="range-input-group">
              <input
                type="number"
                className="range-input"
                value={startLesson}
                onChange={(e) => setStartLesson(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
              />
              <span className="range-label">강부터</span>
            </div>
            <div className="range-input-group">
              <input
                type="number"
                className="range-input"
                value={endLesson}
                onChange={(e) => setEndLesson(parseInt(e.target.value) || 1)}
                min={startLesson}
                max="100"
              />
              <span className="range-label">강까지</span>
            </div>
          </div>

          <div className="preview">
            <small className="preview-text">
              생성 예정: {lessonCount}개 강의 ({startLesson}강~{endLesson}강)
            </small>
            <code>
              https://cdn-it.livestudy.com/mov/{year || "2025"}/{courseCode || "course-code"}/{courseCode || "course-code"}_01.mp4
            </code>
          </div>
        </div>

        <div className="start-modal-footer">
          <button className="cancel-btn" onClick={onClose}>취소</button>
          <button 
            className="create-btn" 
            onClick={handleCreate}
            disabled={!isFormValid()}
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartModal;
