import { useState } from 'react';
import './StartModal.css';

function StartModal({ onClose, onCreate }) {
  const [lessonCount, setLessonCount] = useState(26);

  // 생성 버튼
  const handleCreate = () => {
    if (lessonCount < 1) {
      alert('최소 1개 이상의 차시를 입력해주세요.');
      return;
    }
    if (lessonCount > 100) {
      alert('최대 100개까지 생성할 수 있습니다.');
      return;
    }

    // 차시 개수만큼 생성 (주차는 자동 계산: 2개 차시당 1주)
    const lessons = Array.from({ length: lessonCount }, (_, index) => ({
      weekNumber: Math.ceil((index + 1) / 2),
      title: ''
    }));

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
            몇 개의 차시를 만들까요?<br />
            <small>주차는 2개 차시당 1주차씩 자동 계산됩니다.</small>
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
            <span className="count-label">개 차시</span>
          </div>

          <div className="preview">
            <small className="preview-text">
              📊 생성 예정: {lessonCount}개 차시 / {Math.ceil(lessonCount / 2)}개 주차
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
