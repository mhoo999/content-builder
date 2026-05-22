import React, { useState, useEffect, useRef, useCallback } from "react"
import "./LearningSection.css"
import TinyMCEEditor from "../TinyMCEEditor/TinyMCEEditor"

const DEBOUNCE_DELAY = 300

function LearningSection({ lessonData, onUpdate, courseCode, year }) {
  // 로컬 state로 입력값 관리 (빠른 UI 응답)
  const [localData, setLocalData] = useState(lessonData)
  const debounceRef = useRef(null)
  const isInitialMount = useRef(true)

  // lessonData가 외부에서 변경되면 로컬 state 동기화
  useEffect(() => {
    setLocalData(lessonData)
  }, [lessonData.lessonNumber, lessonData.weekNumber])

  // 로컬 데이터 변경 시 debounce로 부모에 전달
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onUpdate(localData)
    }, DEBOUNCE_DELAY)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localData])

  // 로컬 업데이트 함수
  const updateLocal = useCallback((updates) => {
    setLocalData(prev => ({ ...prev, ...updates }))
  }, [])

  const lessonNumStr = String(localData.lessonNumber).padStart(2, "0")

  // 타임스탬프 동기화 (학습내용 개수와 맞춤)
  useEffect(() => {
    const learningContents = localData.learningContents || []
    const nonPracticeContents = learningContents.filter(
      (content) => !(typeof content === "string" && content.includes("class='practice'"))
    )
    const contentCount = nonPracticeContents.length
    const timestamps = localData.timestamps || []
    const timestampCount = timestamps.length

    if (contentCount === 0) return
    if (timestampCount === contentCount) return

    if (timestampCount < contentCount) {
      const newTimestamps = [...timestamps]
      while (newTimestamps.length < contentCount) {
        newTimestamps.push("0:00:00")
      }
      updateLocal({ timestamps: newTimestamps })
      return
    }

    if (timestampCount > contentCount) {
      const newTimestamps = timestamps.slice(0, contentCount)
      updateLocal({ timestamps: newTimestamps })
    }
  }, [localData.learningContents?.length, localData.timestamps?.length, updateLocal])

  const autoLectureVideoUrl =
    courseCode && year ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_${lessonNumStr}.mp4` : ""
  const autoLectureSubtitle = courseCode ? `../subtitles/${courseCode}_${lessonNumStr}.vtt` : ""

  const handleOpinionChange = (value) => {
    updateLocal({ opinionQuestion: value })
  }

  const handleProfessorThinkChange = (value) => {
    updateLocal({ professorThink: value })
  }

  const handleLectureChange = (field, value) => {
    updateLocal({ [field]: value })
  }

  const formatTimestamp = (value) => {
    if (!value) return ""
    const numbers = value.replace(/\D/g, "")
    if (!numbers) return ""

    let numStr = numbers
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

    if (seconds >= 60) seconds = 0
    if (minutes >= 60) minutes = 0

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  const handleTimestampChange = (field, index, value) => {
    const timestamps = localData[field] || []
    const newTimestamps = [...timestamps]
    newTimestamps[index] = value
    updateLocal({ [field]: newTimestamps })
  }

  const handleTimestampBlur = (field, index) => {
    const timestamps = localData[field] || []
    const currentValue = timestamps[index] || ""
    const formatted = formatTimestamp(currentValue)
    if (formatted && formatted !== currentValue) {
      handleTimestampChange(field, index, formatted)
    }
  }

  const addTimestamp = (field) => {
    const timestamps = localData[field] || []
    const newTimestamps = [...timestamps, "0:00:00"]
    updateLocal({ [field]: newTimestamps })
  }

  const removeTimestamp = (field, index) => {
    const timestamps = localData[field] || []
    const newTimestamps = timestamps.filter((_, i) => i !== index)
    updateLocal({ [field]: newTimestamps })
  }

  const handlePracticeToggle = (e) => {
    const hasPractice = e.target.checked
    const lectureVideoUrl = localData.lectureVideoUrl || autoLectureVideoUrl
    const lectureSubtitle = localData.lectureSubtitle || autoLectureSubtitle

    const practiceTimestamps =
      hasPractice && (!localData.practiceTimestamps || localData.practiceTimestamps.length === 0)
        ? ["0:00:04", "0:00:00"]
        : localData.practiceTimestamps || []

    const learningContents = localData.learningContents
      ? localData.learningContents.filter(
          (content) => !(typeof content === "string" && content.includes("class='practice'")),
        )
      : []

    const practiceContent =
      hasPractice && !localData.practiceContent
        ? "<ul class='practice'><li></li></ul>"
        : localData.practiceContent || ""

    updateLocal({
      hasPractice: hasPractice,
      practiceContent: hasPractice ? practiceContent : "",
      practiceVideoUrl: hasPractice && lectureVideoUrl ? lectureVideoUrl.replace(".mp4", "_P.mp4") : "",
      practiceSubtitle: hasPractice && lectureSubtitle ? lectureSubtitle.replace(".vtt", "_P.vtt") : "",
      practiceTimestamps: practiceTimestamps,
      learningContents: learningContents,
    })
  }

  const handlePracticeChange = (field, value) => {
    updateLocal({ [field]: value })
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
            value={localData.opinionQuestion}
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
            value={localData.lectureVideoUrl || autoLectureVideoUrl}
            onChange={(e) => handleLectureChange("lectureVideoUrl", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>자막 파일 경로</label>
          <input
            type="text"
            placeholder={autoLectureSubtitle || "../subtitles/{코드명}_{차시번호}.vtt"}
            value={localData.lectureSubtitle || autoLectureSubtitle}
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
            {(localData.timestamps || ["0:00:04", "0:00:00"]).map((timestamp, index) => (
              <div key={index} className="timestamp-input-wrapper">
                <input
                  type="text"
                  placeholder="0:00:04"
                  value={timestamp}
                  onChange={(e) => {
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
        {(localData.hasPractice || false) && (
          <>
            <div className="form-group" style={{ marginTop: "24px" }}>
              <label>실습 강의 영상 URL</label>
              <input
                type="url"
                placeholder={
                  localData.lectureVideoUrl || autoLectureVideoUrl
                    ? `${(localData.lectureVideoUrl || autoLectureVideoUrl).replace(".mp4", "_P.mp4")}`
                    : "{강의영상URL}_P.mp4"
                }
                value={
                  localData.practiceVideoUrl ||
                  (localData.lectureVideoUrl || autoLectureVideoUrl
                    ? `${(localData.lectureVideoUrl || autoLectureVideoUrl).replace(".mp4", "_P.mp4")}`
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
                  localData.lectureSubtitle || autoLectureSubtitle
                    ? `${(localData.lectureSubtitle || autoLectureSubtitle).replace(".vtt", "_P.vtt")}`
                    : "{자막경로}_P.vtt"
                }
                value={
                  localData.practiceSubtitle ||
                  (localData.lectureSubtitle || autoLectureSubtitle
                    ? `${(localData.lectureSubtitle || autoLectureSubtitle).replace(".vtt", "_P.vtt")}`
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
                {(localData.practiceTimestamps || ["0:00:04", "0:00:00"]).map((timestamp, index) => (
                  <div key={index} className="timestamp-input-wrapper">
                    <input
                      type="text"
                      placeholder="0:00:04"
                      value={timestamp}
                      onChange={(e) => {
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
          <input type="text" value={localData.opinionQuestion} disabled className="disabled-input" />
          <small className="hint">💡 생각묻기 질문이 자동으로 표시됩니다</small>
        </div>
        <div className="form-group">
          <label>교수님 의견</label>
          <TinyMCEEditor
            value={localData.professorThink}
            onChange={handleProfessorThinkChange}
            placeholder="예: 암호를 사용하지 않으면 도청 문제가 발생합니다..."
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(LearningSection)
