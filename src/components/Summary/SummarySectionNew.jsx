import React, { useState, useEffect, useRef, useCallback } from "react"
import "./SummarySection.css"
import TinyMCEEditor from "../TinyMCEEditor/TinyMCEEditor"

const DEBOUNCE_DELAY = 300

function SummarySection({ lessonData, onUpdate, courseCode, year, courseType = 'general' }) {
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

  const autoInstructionUrl =
    courseCode && year
      ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/down/${courseCode}_mp3_${lessonNumStr}.zip`
      : ""
  const autoGuideUrl =
    courseCode && year
      ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/down/${courseCode}_book_${lessonNumStr}.zip`
      : ""

  // exercises 초기화 (useEffect로 이동)
  useEffect(() => {
    if (!localData.exercises || localData.exercises.length === 0) {
      updateLocal({
        exercises: [
          {
            type: "boolean",
            question: "",
            answer: "",
            options: [],
            commentary: "",
          },
          {
            type: "multiple",
            question: "",
            answer: "",
            options: ["", "", "", ""],
            commentary: "",
          },
          {
            type: "multiple",
            question: "",
            answer: "",
            options: ["", "", "", ""],
            commentary: "",
          },
        ],
      })
    }
  }, [localData.exercises, updateLocal])

  const addExercise = () => {
    updateLocal({
      exercises: [
        ...localData.exercises,
        {
          type: "boolean",
          question: "",
          answer: "",
          options: [],
          commentary: "",
        },
      ],
    })
  }

  const removeExercise = (index) => {
    updateLocal({
      exercises: localData.exercises.filter((_, i) => i !== index),
    })
  }

  const changeExerciseType = (index, newType) => {
    const newExercises = [...localData.exercises]
    newExercises[index] = {
      ...newExercises[index],
      type: newType,
      answer: "",
      options: newType === "multiple" ? ["", "", "", ""] : [],
    }
    updateLocal({ exercises: newExercises })
  }

  const updateExercise = (index, field, value) => {
    const newExercises = [...localData.exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    updateLocal({ exercises: newExercises })
  }

  const updateExerciseOption = (exerciseIndex, optionIndex, value) => {
    const newExercises = [...localData.exercises]
    const newOptions = [...newExercises[exerciseIndex].options]
    newOptions[optionIndex] = value
    newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], options: newOptions }
    updateLocal({ exercises: newExercises })
  }

  const addSummary = () => {
    updateLocal({
      summary: [...localData.summary, ""],
    })
  }

  const removeSummary = (index) => {
    updateLocal({
      summary: localData.summary.filter((_, i) => i !== index),
    })
  }

  const updateSummary = (index, value) => {
    const newSummary = [...localData.summary]
    newSummary[index] = value
    updateLocal({ summary: newSummary })
  }

  const handleDownloadChange = (field, value) => {
    updateLocal({ [field]: value })
  }

  const exercises =
    localData.exercises && localData.exercises.length > 0
      ? localData.exercises
      : [
          {
            type: "boolean",
            question: "",
            answer: "",
            options: [],
            commentary: "",
          },
          {
            type: "multiple",
            question: "",
            answer: "",
            options: ["", "", "", ""],
            commentary: "",
          },
          {
            type: "multiple",
            question: "",
            answer: "",
            options: ["", "", "", ""],
            commentary: "",
          },
        ]

  return (
    <div className="form-section">
      <h3>정리하기</h3>

      {/* 연습문제 (일반 과정만 표시) */}
      {courseType === 'general' && (
      <div id="subsection-exercises" className="subsection">
        <div className="list-header">
          <h4>연습문제</h4>
          <button className="btn-add-small" onClick={addExercise}>
            + 문제 추가
          </button>
        </div>

        {exercises.map((exercise, index) => (
          <div key={index} className="exercise-item">
            <div className="exercise-header">
              <span className="exercise-number">문제 {index + 1}</span>
              <div className="exercise-controls">
                <select
                  className="type-selector"
                  value={exercise.type}
                  onChange={(e) => changeExerciseType(index, e.target.value)}
                >
                  <option value="boolean">OX</option>
                  <option value="multiple">4지선다</option>
                </select>
                {exercises.length > 1 && (
                  <button className="btn-remove-inline" onClick={() => removeExercise(index)}>
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>문항</label>
              <TinyMCEEditor
                value={exercise.question}
                onChange={(value) => updateExercise(index, "question", value)}
                placeholder="문제를 입력하세요"
              />
            </div>

            {exercise.type === "multiple" && (
              <div className="options-group">
                <label className="group-label">선택지</label>
                {exercise.options.map((option, optIndex) => (
                  <div key={optIndex} className="form-group">
                    <label>선택지 {optIndex + 1}</label>
                    <TinyMCEEditor
                      value={option}
                      onChange={(value) => updateExerciseOption(index, optIndex, value)}
                      placeholder={`선택지 ${optIndex + 1}를 입력하세요`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label>정답</label>
              {exercise.type === "boolean" ? (
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name={`exercise${index}_answer`}
                      value="1"
                      checked={exercise.answer === "1"}
                      onChange={(e) => updateExercise(index, "answer", e.target.value)}
                    />
                    <span>O (참)</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`exercise${index}_answer`}
                      value="2"
                      checked={exercise.answer === "2"}
                      onChange={(e) => updateExercise(index, "answer", e.target.value)}
                    />
                    <span>X (거짓)</span>
                  </label>
                </div>
              ) : (
                <select value={exercise.answer || ""} onChange={(e) => updateExercise(index, "answer", e.target.value)}>
                  <option value="">정답을 선택해주세요.</option>
                  {exercise.options.map((option, optIndex) => (
                    <option key={optIndex} value={String(optIndex + 1)}>
                      {optIndex + 1}번
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>해설</label>
              <TinyMCEEditor
                value={exercise.commentary}
                onChange={(value) => updateExercise(index, "commentary", value)}
                placeholder="정답에 대한 해설을 작성하세요"
              />
            </div>
          </div>
        ))}
      </div>
      )}

      {/* 학습정리 */}
      <div id="subsection-summary" className="subsection">
        <div className="list-header">
          <h4>학습정리</h4>
          <button className="btn-add-small" onClick={addSummary}>
            + 추가
          </button>
        </div>
        {localData.summary.map((sum, index) => (
          <div key={index} className="dynamic-item-vertical">
            <div className="item-header">
              <label>정리 {index + 1}</label>
              {localData.summary.length > 1 && (
                <button className="btn-remove-inline" onClick={() => removeSummary(index)}>
                  ×
                </button>
              )}
            </div>
            <TinyMCEEditor
              key={`summary-editor-${index}-${localData.lessonNumber}`}
              value={sum}
              onChange={(value) => updateSummary(index, value)}
              placeholder={`학습정리 내용 ${index + 1}`}
            />
          </div>
        ))}
      </div>

      {/* 다운로드 */}
      <div className="subsection">
        <h4>다운로드 파일</h4>
        <div className="form-group">
          <label>음성파일 ZIP URL</label>
          <input
            type="url"
            placeholder={
              autoInstructionUrl || "https://cdn-it.livestudy.com/mov/{연도}/{코드명}/down/{코드명}_mp3_{차시번호}.zip"
            }
            value={localData.instructionUrl || autoInstructionUrl}
            onChange={(e) => handleDownloadChange("instructionUrl", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>교안 ZIP URL</label>
          <input
            type="url"
            placeholder={
              autoGuideUrl || "https://cdn-it.livestudy.com/mov/{연도}/{코드명}/down/{코드명}_book_{차시번호}.zip"
            }
            value={localData.guideUrl || autoGuideUrl}
            onChange={(e) => handleDownloadChange("guideUrl", e.target.value)}
          />
        </div>
      </div>

      {/* 다음안내 (아웃트로) */}
      <div id="subsection-next" className="subsection">
        <h4>다음안내</h4>
        <div className="info-box">
          <p>📢 이것으로 이번 시간 강의를 마쳤습니다. 수고하셨습니다.</p>
          <small>다음안내 페이지는 Export 시 자동으로 생성됩니다.</small>
        </div>
      </div>
    </div>
  )
}

export default React.memo(SummarySection)
