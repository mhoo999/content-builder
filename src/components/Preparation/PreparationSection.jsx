import { useState } from 'react';
import './PreparationSection.css';

function PreparationSection({ lessonData, onUpdate }) {
  const isFirstLesson = lessonData.weekNumber === 1 && lessonData.lessonNumber === 1;

  const handleOrientationToggle = (e) => {
    onUpdate({ ...lessonData, hasOrientation: e.target.checked });
  };

  const handleOrientationChange = (field, value) => {
    onUpdate({
      ...lessonData,
      orientation: { ...lessonData.orientation, [field]: value }
    });
  };

  const handleTermChange = (index, field, value) => {
    const newTerms = [...lessonData.terms];
    newTerms[index] = { ...newTerms[index], [field]: value };
    onUpdate({ ...lessonData, terms: newTerms });
  };

  const handleLearningContentChange = (index, value) => {
    const newContents = [...lessonData.learningContents];
    newContents[index] = value;
    onUpdate({ ...lessonData, learningContents: newContents });
  };

  const handleLearningObjectiveChange = (index, value) => {
    const newObjectives = [...lessonData.learningObjectives];
    newObjectives[index] = value;
    onUpdate({ ...lessonData, learningObjectives: newObjectives });
  };

  return (
    <div className="form-section">
      <h3>📖 준비하기</h3>

      {/* 오리엔테이션 (1주1차시만) */}
      {isFirstLesson && (
        <div className="subsection">
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={lessonData.hasOrientation}
                onChange={handleOrientationToggle}
              />
              <span>오리엔테이션 영상 제공</span>
            </label>
          </div>

          {lessonData.hasOrientation && (
            <>
              <div className="form-group">
                <label>오리엔테이션 영상 URL</label>
                <input
                  type="url"
                  placeholder="https://cdn-it.livestudy.com/mov/2025/25itinse/25itinse_ot.mp4"
                  value={lessonData.orientation.videoUrl}
                  onChange={(e) => handleOrientationChange('videoUrl', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>자막 파일 경로</label>
                <input
                  type="text"
                  placeholder="../subtitles/25itinse_ot.vtt"
                  value={lessonData.orientation.subtitlePath}
                  onChange={(e) => handleOrientationChange('subtitlePath', e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* 용어체크 */}
      <div className="subsection">
        <h4>용어체크 (3개)</h4>
        {lessonData.terms.map((term, index) => (
          <div key={index} className="term-item">
            <div className="term-header">용어 {index + 1}</div>
            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                placeholder="예: 평문(plaintext)"
                value={term.title}
                onChange={(e) => handleTermChange(index, 'title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>내용</label>
              <textarea
                placeholder="예: 암호화하기 전의 메시지"
                value={term.content}
                onChange={(e) => handleTermChange(index, 'content', e.target.value)}
                rows={3}
              />
              <small className="hint">💡 이미지 삽입 지원 예정</small>
            </div>
          </div>
        ))}
      </div>

      {/* 학습목표 */}
      <div className="subsection">
        <h4>학습목표</h4>

        <div className="learning-group">
          <label className="group-label">학습내용 (3개)</label>
          {lessonData.learningContents.map((content, index) => (
            <div key={index} className="form-group">
              <input
                type="text"
                placeholder={`학습내용 ${index + 1}`}
                value={content}
                onChange={(e) => handleLearningContentChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="learning-group">
          <label className="group-label">학습목표 (3개)</label>
          {lessonData.learningObjectives.map((objective, index) => (
            <div key={index} className="form-group">
              <input
                type="text"
                placeholder={`학습목표 ${index + 1}`}
                value={objective}
                onChange={(e) => handleLearningObjectiveChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PreparationSection;
