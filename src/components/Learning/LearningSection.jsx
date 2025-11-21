import './LearningSection.css';
import ImageUploader from '../ImageUploader/ImageUploader';
import { shortenImageText, restoreImageText } from '../../utils/textDisplay';

function LearningSection({ lessonData, onUpdate }) {
  const handleOpinionChange = (value) => {
    onUpdate({ ...lessonData, opinionQuestion: value });
  };

  const handleProfessorThinkChange = (value) => {
    // value가 이미 원본(base64 포함)인지 확인
    const hasBase64Image = /<img[^>]*src=["']data:image\/[^"']+["'][^>]*>/gi.test(value);
    const originalValue = lessonData.professorThink;
    
    if (hasBase64Image) {
      // 이미 원본이면 그대로 사용
      onUpdate({ ...lessonData, professorThink: value });
    } else {
      // 축약된 버전이면 복원
      const restoredValue = restoreImageText(value, originalValue);
      onUpdate({ ...lessonData, professorThink: restoredValue });
    }
  };

  const handleProfessorThinkImageChange = (value) => {
    onUpdate({ ...lessonData, professorThinkImage: value });
  };

  const handleLectureChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value });
  };

  const handleTimestampChange = (index, value) => {
    const newTimestamps = [...lessonData.timestamps];
    newTimestamps[index] = value;
    onUpdate({ ...lessonData, timestamps: newTimestamps });
  };

  return (
    <div className="form-section">
      <h3>🎓 학습하기</h3>

      {/* 생각묻기 */}
      <div className="subsection">
        <h4>생각묻기</h4>
        <div className="form-group">
          <label>질문</label>
          <textarea
            placeholder="예: 암호를 사용하는 이유는 무엇일까요?"
            value={lessonData.opinionQuestion}
            onChange={(e) => handleOpinionChange(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* 강의보기 */}
      <div className="subsection">
        <h4>강의보기</h4>
        <div className="form-group">
          <label>강의 영상 URL</label>
          <input
            type="url"
            placeholder="https://cdn-it.livestudy.com/mov/2025/25itinse/25itinse_01.mp4"
            value={lessonData.lectureVideoUrl}
            onChange={(e) => handleLectureChange('lectureVideoUrl', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>자막 파일 경로</label>
          <input
            type="text"
            placeholder="../subtitles/25itinse_01.vtt"
            value={lessonData.lectureSubtitle}
            onChange={(e) => handleLectureChange('lectureSubtitle', e.target.value)}
          />
        </div>
        <div className="timestamp-group">
          <label className="group-label">타임스탬프 (3개)</label>
          <div className="timestamp-inputs">
            {lessonData.timestamps.map((timestamp, index) => (
              <input
                key={index}
                type="text"
                placeholder={`0:00:0${index + 1}`}
                value={timestamp}
                onChange={(e) => handleTimestampChange(index, e.target.value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 점검하기 */}
      <div className="subsection">
        <h4>점검하기</h4>
        <div className="form-group">
          <label>질문 (생각묻기와 동일)</label>
          <input
            type="text"
            value={lessonData.opinionQuestion}
            disabled
            className="disabled-input"
          />
          <small className="hint">💡 생각묻기 질문이 자동으로 표시됩니다</small>
        </div>
        <div className="form-group">
          <label>교수님 의견</label>
          <textarea
            placeholder="예: 암호를 사용하지 않으면 도청 문제가 발생합니다..."
            value={shortenImageText(lessonData.professorThink)}
            onChange={(e) => handleProfessorThinkChange(e.target.value)}
            rows={5}
          />
          <ImageUploader
            onImageInsert={(imageHtml) => {
              const newContent = lessonData.professorThink + '\n' + imageHtml;
              handleProfessorThinkChange(newContent);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default LearningSection;
