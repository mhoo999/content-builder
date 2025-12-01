import "./LearningSection.css"
import RichTextEditor from "../RichTextEditor"

function LearningSection({ lessonData, onUpdate, courseCode, year }) {
  // 차시 번호를 2자리 문자열로 변환 (01, 02, ...)
  const lessonNumStr = String(lessonData.lessonNumber).padStart(2, "0")

  // 자동 생성된 URL들
  const autoLectureVideoUrl =
    courseCode && year ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_${lessonNumStr}.mp4` : ""
  const autoLectureSubtitle = courseCode ? `../subtitles/${courseCode}_${lessonNumStr}.vtt` : ""

  const handleOpinionChange = (value) => {
    onUpdate({ ...lessonData, opinionQuestion: value })
  }

  const handleProfessorThinkChange = (value) => {
    onUpdate({ ...lessonData, professorThink: value })
  }

  const handleLectureChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value })
  }

  // 타임스탬프 포맷 정정 함수 (H:MM:SS 형식) - 공통 함수
  const formatTimestamp = (value) => {
    if (!value) return ""

    // 숫자만 추출
    const numbers = value.replace(/\D/g, "")
    if (!numbers) return ""

    // 오른쪽부터 초, 분, 시 순서로 해석
    // 예: "3" → 3초, "430" → 4분 30초, "490" → 4분 00초 (초는 0-59까지만)
    let numStr = numbers

    // 오른쪽부터 2자리씩 추출
    let seconds = 0
    let minutes = 0
    let hours = 0

    if (numStr.length >= 1) {
      seconds = parseInt(numStr.slice(-2) || "0", 10)
    }
    if (numStr.length >= 3) {
      minutes = parseInt(numStr.slice(-4, -2) || "0", 10)
    }
    if (numStr.length >= 5) {
      hours = parseInt(numStr.slice(-6, -4) || "0", 10)
    }

    // 초가 60 이상이면 0으로 처리 (분에 더하지 않음)
    if (seconds >= 60) {
      seconds = 0
    }

    // 분이 60 이상이면 0으로 처리 (시에 더하지 않음)
    if (minutes >= 60) {
      minutes = 0
    }

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  // 타임스탬프 변경 핸들러 - 공통 함수
  const handleTimestampChange = (field, index, value) => {
    const timestamps = lessonData[field] || []
    const newTimestamps = [...timestamps]
    newTimestamps[index] = value
    onUpdate({ ...lessonData, [field]: newTimestamps })
  }

  // 타임스탬프 포커스 아웃 핸들러 - 공통 함수
  const handleTimestampBlur = (field, index) => {
    const timestamps = lessonData[field] || []
    const currentValue = timestamps[index] || ""
    const formatted = formatTimestamp(currentValue)
    if (formatted && formatted !== currentValue) {
      handleTimestampChange(field, index, formatted)
    }
  }

  // 타임스탬프 추가 - 공통 함수
  const addTimestamp = (field) => {
    const timestamps = lessonData[field] || []
    const newTimestamps = [...timestamps, "0:00:00"]
    onUpdate({ ...lessonData, [field]: newTimestamps })
  }

  // 타임스탬프 삭제 - 공통 함수
  const removeTimestamp = (field, index) => {
    const timestamps = lessonData[field] || []
    const newTimestamps = timestamps.filter((_, i) => i !== index)
    onUpdate({ ...lessonData, [field]: newTimestamps })
  }

  const handlePracticeToggle = (e) => {
    const hasPractice = e.target.checked
    const lectureVideoUrl = lessonData.lectureVideoUrl || autoLectureVideoUrl
    const lectureSubtitle = lessonData.lectureSubtitle || autoLectureSubtitle

    // 실습 타임스탬프 초기화 (기본 2개: "0:00:04", "0:00:00")
    const practiceTimestamps =
      hasPractice && (!lessonData.practiceTimestamps || lessonData.practiceTimestamps.length === 0)
        ? ["0:00:04", "0:00:00"]
        : lessonData.practiceTimestamps || []

    // 학습내용에서 실습 항목 제거 (기존 데이터 마이그레이션)
    const learningContents = lessonData.learningContents
      ? lessonData.learningContents.filter(
          (content) => !(typeof content === "string" && content.includes("class='practice'")),
        )
      : []

    // 실습 내용 초기화 (기존 practiceContent가 없으면 기본값 설정)
    const practiceContent =
      hasPractice && !lessonData.practiceContent
        ? "<ul class='practice'><li></li></ul>"
        : lessonData.practiceContent || ""

    onUpdate({
      ...lessonData,
      hasPractice: hasPractice,
      practiceContent: hasPractice ? practiceContent : "",
      practiceVideoUrl: hasPractice && lectureVideoUrl ? lectureVideoUrl.replace(".mp4", "_P.mp4") : "",
      practiceSubtitle: hasPractice && lectureSubtitle ? lectureSubtitle.replace(".vtt", "_P.vtt") : "",
      practiceTimestamps: practiceTimestamps,
      learningContents: learningContents, // 실습 항목 제거된 학습내용
    })
  }

  const handlePracticeChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value })
  }

  return (
    <div className="form-section">
      <h3>🎓 학습하기</h3>

      {/* 생각묻기 */}
      <div id="subsection-opinion" className="subsection">
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
      <div id="subsection-lecture" className="subsection">
        <h4>강의보기</h4>
        <div className="form-group">
          <label>강의 영상 URL</label>
          <input
            type="url"
            placeholder={
              autoLectureVideoUrl || "https://cdn-it.livestudy.com/mov/{연도}/{코드명}/{코드명}_{차시번호}.mp4"
            }
            value={lessonData.lectureVideoUrl || autoLectureVideoUrl}
            onChange={(e) => handleLectureChange("lectureVideoUrl", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>자막 파일 경로</label>
          <input
            type="text"
            placeholder={autoLectureSubtitle || "../subtitles/{코드명}_{차시번호}.vtt"}
            value={lessonData.lectureSubtitle || autoLectureSubtitle}
            onChange={(e) => handleLectureChange("lectureSubtitle", e.target.value)}
          />
        </div>
        <div className="timestamp-group">
          <div className="list-header">
            <label className="group-label">타임스탬프</label>
            <button className="btn-add-small" onClick={() => addTimestamp("timestamps")} type="button">
              + 추가
            </button>
          </div>
          <div className="timestamp-inputs">
            {(lessonData.timestamps || ["0:00:04", "0:00:00"]).map((timestamp, index) => (
              <div key={index} className="timestamp-input-wrapper">
                <input
                  type="text"
                  placeholder="0:00:04"
                  value={timestamp}
                  onChange={(e) => {
                    // 숫자만 입력 가능
                    const value = e.target.value.replace(/[^\d:]/g, "")
                    handleTimestampChange("timestamps", index, value)
                  }}
                  onBlur={() => handleTimestampBlur("timestamps", index)}
                  pattern="[0-9]:[0-9]{2}:[0-9]{2}"
                />
                <button
                  className="btn-remove-inline"
                  onClick={() => removeTimestamp("timestamps", index)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        {(lessonData.hasPractice || false) && (
          <>
            <div className="form-group" style={{ marginTop: "24px" }}>
              <label>실습 강의 영상 URL</label>
              <input
                type="url"
                placeholder={
                  lessonData.lectureVideoUrl || autoLectureVideoUrl
                    ? `${(lessonData.lectureVideoUrl || autoLectureVideoUrl).replace(".mp4", "_P.mp4")}`
                    : "{강의영상URL}_P.mp4"
                }
                value={
                  lessonData.practiceVideoUrl ||
                  (lessonData.lectureVideoUrl || autoLectureVideoUrl
                    ? `${(lessonData.lectureVideoUrl || autoLectureVideoUrl).replace(".mp4", "_P.mp4")}`
                    : "")
                }
                onChange={(e) => handlePracticeChange("practiceVideoUrl", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>실습 자막 파일 경로</label>
              <input
                type="text"
                placeholder={
                  lessonData.lectureSubtitle || autoLectureSubtitle
                    ? `${(lessonData.lectureSubtitle || autoLectureSubtitle).replace(".vtt", "_P.vtt")}`
                    : "{자막경로}_P.vtt"
                }
                value={
                  lessonData.practiceSubtitle ||
                  (lessonData.lectureSubtitle || autoLectureSubtitle
                    ? `${(lessonData.lectureSubtitle || autoLectureSubtitle).replace(".vtt", "_P.vtt")}`
                    : "")
                }
                onChange={(e) => handlePracticeChange("practiceSubtitle", e.target.value)}
              />
            </div>
            <div className="timestamp-group">
              <div className="list-header">
                <label className="group-label">실습 타임스탬프</label>
                <button className="btn-add-small" onClick={() => addTimestamp("practiceTimestamps")} type="button">
                  + 추가
                </button>
              </div>
              <div className="timestamp-inputs">
                {(lessonData.practiceTimestamps || ["0:00:04", "0:00:00"]).map((timestamp, index) => (
                  <div key={index} className="timestamp-input-wrapper">
                    <input
                      type="text"
                      placeholder="0:00:04"
                      value={timestamp}
                      onChange={(e) => {
                        // 숫자만 입력 가능
                        const value = e.target.value.replace(/[^\d:]/g, "")
                        handleTimestampChange("practiceTimestamps", index, value)
                      }}
                      onBlur={() => handleTimestampBlur("practiceTimestamps", index)}
                      pattern="[0-9]:[0-9]{2}:[0-9]{2}"
                    />
                    <button
                      className="btn-remove-inline"
                      onClick={() => removeTimestamp("practiceTimestamps", index)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 점검하기 */}
      <div id="subsection-check" className="subsection">
        <h4>점검하기</h4>
        <div className="form-group">
          <label>질문 (생각묻기와 동일)</label>
          <input type="text" value={lessonData.opinionQuestion} disabled className="disabled-input" />
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
  )
}

export default LearningSection
