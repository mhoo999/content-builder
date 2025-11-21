import { useState, useEffect } from 'react';
import './PreparationSection.css';
import ImageUploader from '../ImageUploader/ImageUploader';
import { shortenImageText, restoreImageText } from '../../utils/textDisplay';

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
    const originalValue = newTerms[index][field];
    
    // 이미지가 포함된 필드(content)인 경우, 축약된 텍스트를 원본으로 복원
    if (field === 'content' && originalValue) {
      const restoredValue = restoreImageText(value, originalValue);
      newTerms[index] = { ...newTerms[index], [field]: restoredValue };
    } else {
      newTerms[index] = { ...newTerms[index], [field]: value };
    }
    
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
        <div className="list-header">
          <h4>용어체크</h4>
          <button
            className="btn-add-small"
            onClick={() => {
              const newTerms = [...lessonData.terms, { title: '', content: '' }];
              onUpdate({ ...lessonData, terms: newTerms });
            }}
          >
            + 용어 추가
          </button>
        </div>
        {lessonData.terms.map((term, index) => (
          <div key={index} className="term-item">
            <div className="term-header">
              <span>용어 {index + 1}</span>
              {lessonData.terms.length > 1 && (
                <button
                  className="btn-remove-inline"
                  onClick={() => {
                    const newTerms = lessonData.terms.filter((_, i) => i !== index);
                    onUpdate({ ...lessonData, terms: newTerms });
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <div className="form-group">
              <label>제목 (줄바꿈 가능)</label>
              <textarea
                placeholder="예: 평문(plaintext)&#10;또는 키 배송 문제&#10;(key distribution problem)"
                value={term.title}
                onChange={(e) => handleTermChange(index, 'title', e.target.value)}
                rows={2}
              />
              <small className="hint">💡 Enter 키로 줄바꿈 가능</small>
            </div>
            <div className="form-group">
              <label>내용</label>
              <textarea
                placeholder="예: 암호화하기 전의 메시지"
                value={shortenImageText(term.content)}
                onChange={(e) => handleTermChange(index, 'content', e.target.value)}
                rows={3}
              />
              <ImageUploader
                onImageInsert={(imageHtml) => {
                  const newContent = term.content + '\n' + imageHtml;
                  handleTermChange(index, 'content', newContent);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 학습목표 */}
      <div className="subsection">
        <h4>학습목표</h4>

        <div className="learning-group">
          <div className="list-header">
            <label className="group-label">학습내용</label>
            <button
              className="btn-add-small"
              onClick={() => {
                const newContents = [...lessonData.learningContents, ''];
                onUpdate({ ...lessonData, learningContents: newContents });
              }}
            >
              + 추가
            </button>
          </div>
          {lessonData.learningContents.map((content, index) => (
            <div key={index} className="dynamic-item">
              <input
                type="text"
                placeholder={`학습내용 ${index + 1}`}
                value={content}
                onChange={(e) => handleLearningContentChange(index, e.target.value)}
              />
              {lessonData.learningContents.length > 1 && (
                <button
                  className="btn-remove-small"
                  onClick={() => {
                    const newContents = lessonData.learningContents.filter((_, i) => i !== index);
                    onUpdate({ ...lessonData, learningContents: newContents });
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="learning-group">
          <div className="list-header">
            <label className="group-label">학습목표</label>
            <button
              className="btn-add-small"
              onClick={() => {
                const newObjectives = [...lessonData.learningObjectives, ''];
                onUpdate({ ...lessonData, learningObjectives: newObjectives });
              }}
            >
              + 추가
            </button>
          </div>
          {lessonData.learningObjectives.map((objective, index) => (
            <div key={index} className="dynamic-item">
              <input
                type="text"
                placeholder={`학습목표 ${index + 1}`}
                value={objective}
                onChange={(e) => handleLearningObjectiveChange(index, e.target.value)}
              />
              {lessonData.learningObjectives.length > 1 && (
                <button
                  className="btn-remove-small"
                  onClick={() => {
                    const newObjectives = lessonData.learningObjectives.filter((_, i) => i !== index);
                    onUpdate({ ...lessonData, learningObjectives: newObjectives });
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PreparationSection;
