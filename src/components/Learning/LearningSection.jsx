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

  const handlePracticeToggle = (e) => {
    const hasPractice = e.target.checked;
    const lectureVideoUrl = lessonData.lectureVideoUrl || autoLectureVideoUrl;
    const lectureSubtitle = lessonData.lectureSubtitle || autoLectureSubtitle;
    
    onUpdate({
      ...lessonData,
      hasPractice: hasPractice,
      practiceVideoUrl: hasPractice && lectureVideoUrl ? lectureVideoUrl.replace('.mp4', '_P.mp4') : '',
      practiceSubtitle: hasPractice && lectureSubtitle ? lectureSubtitle.replace('.vtt', '_P.vtt') : ''
    });
  };

  const handlePracticeChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value });
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
