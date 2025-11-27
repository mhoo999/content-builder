import './LearningSection.css';
import RichTextEditor from '../RichTextEditor';

function LearningSection({ lessonData, onUpdate, courseCode, year }) {
  // 차시 번호를 2자리 문자열로 변환 (01, 02, ...)
  const lessonNumStr = String(lessonData.lessonNumber).padStart(2, '0');
  
  // 자동 생성된 URL들
  const autoLectureVideoUrl = courseCode && year 
    ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_${lessonNumStr}.mp4`
    : '';
  const autoLectureSubtitle = courseCode 
    ? `../subtitles/${courseCode}_${lessonNumStr}.vtt`
    : '';

  const handleOpinionChange = (value) => {
    onUpdate({ ...lessonData, opinionQuestion: value });
  };

  const handleProfessorThinkChange = (value) => {
    onUpdate({ ...lessonData, professorThink: value });
  };

  const handleLectureChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value });
  };

  const handleTimestampChange = (index, value) => {
    const newTimestamps = [...lessonData.timestamps];
    newTimestamps[index] = value;
    onUpdate({ ...lessonData, timestamps: newTimestamps });
  };

  // 타임스탬프 포맷 정정 함수 (H:MM:SS 형식)
  const formatTimestamp = (value) => {
    if (!value) return '';
    
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    
    // 최대 6자리까지만 (HMMSS)
    const numStr = numbers.slice(0, 6).padStart(6, '0');
    
    // H:MM:SS 형식으로 변환
    const hours = parseInt(numStr.slice(0, 1), 10);
    const minutes = parseInt(numStr.slice(1, 3), 10);
    const seconds = parseInt(numStr.slice(3, 5), 10);
    
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handlePracticeToggle = (e) => {
    const hasPractice = e.target.checked;
    const lectureVideoUrl = lessonData.lectureVideoUrl || autoLectureVideoUrl;
    const lectureSubtitle = lessonData.lectureSubtitle || autoLectureSubtitle;
    
    // 실습 타임스탬프 초기화 (기본 2개: "0:00:04", "0:00:00")
    const practiceTimestamps = hasPractice && (!lessonData.practiceTimestamps || lessonData.practiceTimestamps.length === 0)
      ? ['0:00:04', '0:00:00']
      : (lessonData.practiceTimestamps || []);
    
    onUpdate({
      ...lessonData,
      hasPractice: hasPractice,
      practiceVideoUrl: hasPractice && lectureVideoUrl ? lectureVideoUrl.replace('.mp4', '_P.mp4') : '',
      practiceSubtitle: hasPractice && lectureSubtitle ? lectureSubtitle.replace('.vtt', '_P.vtt') : '',
      practiceTimestamps: practiceTimestamps
    });
  };

  const handlePracticeChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value });
  };

  const handlePracticeTimestampChange = (index, value) => {
    const newPracticeTimestamps = [...(lessonData.practiceTimestamps || [])];
    newPracticeTimestamps[index] = value;
    onUpdate({ ...lessonData, practiceTimestamps: newPracticeTimestamps });
  };

  const handlePracticeTimestampBlur = (index) => {
    const currentValue = (lessonData.practiceTimestamps || [])[index] || '';
    const formatted = formatTimestamp(currentValue);
    if (formatted && formatted !== currentValue) {
      handlePracticeTimestampChange(index, formatted);
    }
  };

  const addPracticeTimestamp = () => {
    const newPracticeTimestamps = [...(lessonData.practiceTimestamps || []), '0:00:00'];
    onUpdate({ ...lessonData, practiceTimestamps: newPracticeTimestamps });
  };

  const removePracticeTimestamp = (index) => {
    const newPracticeTimestamps = (lessonData.practiceTimestamps || []).filter((_, i) => i !== index);
    onUpdate({ ...lessonData, practiceTimestamps: newPracticeTimestamps });
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
            placeholder={autoLectureVideoUrl || "https://cdn-it.livestudy.com/mov/{연도}/{코드명}/{코드명}_{차시번호}.mp4"}
            value={lessonData.lectureVideoUrl || autoLectureVideoUrl}
            onChange={(e) => handleLectureChange('lectureVideoUrl', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>자막 파일 경로</label>
          <input
            type="text"
            placeholder={autoLectureSubtitle || "../subtitles/{코드명}_{차시번호}.vtt"}
            value={lessonData.lectureSubtitle || autoLectureSubtitle}
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
        <div className="checkbox-group" style={{ marginTop: '16px' }}>
          <label>
            <input
              type="checkbox"
              checked={lessonData.hasPractice || false}
              onChange={handlePracticeToggle}
            />
            <span>실습있음</span>
          </label>
        </div>
        {(lessonData.hasPractice || false) && (
          <>
            <div className="form-group">
              <label>실습 강의 영상 URL</label>
              <input
                type="url"
                placeholder={lessonData.lectureVideoUrl || autoLectureVideoUrl ? `${(lessonData.lectureVideoUrl || autoLectureVideoUrl).replace('.mp4', '_P.mp4')}` : "{강의영상URL}_P.mp4"}
                value={lessonData.practiceVideoUrl || (lessonData.lectureVideoUrl || autoLectureVideoUrl ? `${(lessonData.lectureVideoUrl || autoLectureVideoUrl).replace('.mp4', '_P.mp4')}` : '')}
                onChange={(e) => handlePracticeChange('practiceVideoUrl', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>실습 자막 파일 경로</label>
              <input
                type="text"
                placeholder={lessonData.lectureSubtitle || autoLectureSubtitle ? `${(lessonData.lectureSubtitle || autoLectureSubtitle).replace('.vtt', '_P.vtt')}` : "{자막경로}_P.vtt"}
                value={lessonData.practiceSubtitle || (lessonData.lectureSubtitle || autoLectureSubtitle ? `${(lessonData.lectureSubtitle || autoLectureSubtitle).replace('.vtt', '_P.vtt')}` : '')}
                onChange={(e) => handlePracticeChange('practiceSubtitle', e.target.value)}
              />
            </div>
            <div className="timestamp-group">
              <div className="list-header">
                <label className="group-label">실습 타임스탬프</label>
                <button
                  className="btn-add-small"
                  onClick={addPracticeTimestamp}
                  type="button"
                >
                  + 추가
                </button>
              </div>
              <div className="timestamp-inputs">
                {(lessonData.practiceTimestamps || ['0:00:04', '0:00:00']).map((timestamp, index) => (
                  <div key={index} className="timestamp-input-wrapper">
                    <input
                      type="text"
                      placeholder="0:00:04"
                      value={timestamp}
                      onChange={(e) => {
                        // 숫자만 입력 가능
                        const value = e.target.value.replace(/[^\d:]/g, '');
                        handlePracticeTimestampChange(index, value);
                      }}
                      onBlur={() => handlePracticeTimestampBlur(index)}
                      pattern="[0-9]:[0-9]{2}:[0-9]{2}"
                    />
                    {(lessonData.practiceTimestamps || []).length > 2 && (
                      <button
                        className="btn-remove-inline"
                        onClick={() => removePracticeTimestamp(index)}
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
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
          <RichTextEditor
            value={lessonData.professorThink}
            onChange={handleProfessorThinkChange}
            placeholder="예: 암호를 사용하지 않으면 도청 문제가 발생합니다..."
          />
        </div>
      </div>
    </div>
  );
}

export default LearningSection;
