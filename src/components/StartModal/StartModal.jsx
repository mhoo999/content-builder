import { useState } from 'react';
import './StartModal.css';

function StartModal({ onClose, onCreate }) {
  const [lessonCount, setLessonCount] = useState(26);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');

  // 필수 입력 검증
  const isFormValid = () => {
    return courseCode.trim() !== '' && 
           courseName.trim() !== '' && 
           lessonCount >= 1 && 
           lessonCount <= 100;
  };

  // 생성 버튼
  const handleCreate = () => {
    if (!isFormValid()) {
      return;
    }

    // 강의 개수만큼 생성 (2개 강의당 1주차, 8주는 중간고사로 건너뜀)
    const lessons = Array.from({ length: lessonCount }, (_, index) => {
      let weekNumber = Math.ceil((index + 1) / 2);
      // 7주 이후는 8주를 건너뛰고 9주부터 시작
      if (weekNumber >= 8) {
        weekNumber += 1;
      }
      return {
        weekNumber,
        title: ''
      };
    });

    onCreate(lessons, courseCode.trim(), courseName.trim());
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
          </div>

          <div className="divider"></div>

          <p className="modal-description">
            몇 개의 강의를 만들까요?<br />
            <small>2개 강의당 1주차로 자동 생성됩니다. (8주는 중간고사로 건너뜀)</small>
          </p>

          <div className="count-input-wrapper">
            <input
              type="number"
              className="count-input"
              value={lessonCount}
              onChange={(e) => setLessonCount(parseInt(e.target.value) || 0)}
              min="1"
              max="100"
            />
            <span className="count-label">개 강의</span>
          </div>

          <div className="preview">
            <small className="preview-text">
              📊 생성 예정: {lessonCount}개 강의 / {Math.ceil(lessonCount / 2)}개 주차
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
