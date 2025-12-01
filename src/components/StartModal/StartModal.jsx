import { useState } from 'react';
import './StartModal.css';

function StartModal({ onClose, onCreate }) {
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

    // 시작~끝 강의 번호만큼 생성 (2개 강의당 1주차, 8주는 중간고사로 건너뜀)
    const lessons = Array.from({ length: lessonCount }, (_, index) => {
      const lessonNumber = startLesson + index;
      let weekNumber = Math.ceil(lessonNumber / 2);
      // 7주 이후는 8주를 건너뛰고 9주부터 시작
      if (weekNumber >= 8) {
        weekNumber += 1;
      }
      return {
        lessonNumber,
        weekNumber,
        title: ''
      };
    });

    onCreate(lessons, courseCode.trim(), courseName.trim(), year.trim());
    onClose();
  };

  return (
    <div className="start-modal-overlay" onClick={onClose}>
      <div className="start-modal" onClick={(e) => e.stopPropagation()}>
        <div className="start-modal-header">
          <h2>차시 구조 만들기</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="start-modal-body">
          <div className="course-info-section">
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
            <small>2개 강의당 1주차로 자동 생성됩니다. (8주는 중간고사로 건너뜀)</small>
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
              📊 생성 예정: {lessonCount}개 강의 ({startLesson}강~{endLesson}강)
            </small>
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
