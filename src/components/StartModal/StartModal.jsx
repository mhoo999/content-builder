import { useState } from 'react';
import './StartModal.css';

function StartModal({ onClose, onCreate }) {
  const [lessonCount, setLessonCount] = useState(26);

  // 생성 버튼
  const handleCreate = () => {
    if (lessonCount < 1) {
      alert('최소 1개 이상의 강의를 입력해주세요.');
      return;
    }
    if (lessonCount > 100) {
      alert('최대 100개까지 생성할 수 있습니다.');
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

    onCreate(lessons);
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
              autoFocus
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
          <button className="create-btn" onClick={handleCreate}>
            생성
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartModal;
