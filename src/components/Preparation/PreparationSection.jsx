import React, { useState, useEffect, useRef, useCallback } from "react"
import "./PreparationSection.css"
import TinyMCEEditor from "../TinyMCEEditor/TinyMCEEditor"

const DEBOUNCE_DELAY = 300

function PreparationSection({ lessonData, onUpdate, courseCode, year, courseType = 'general' }) {
  // 로컬 state로 입력값 관리 (빠른 UI 응답)
  const [localData, setLocalData] = useState(lessonData)
  const debounceRef = useRef(null)
  const isInitialMount = useRef(true)

  // lessonData가 외부에서 변경되면 로컬 state 동기화
  useEffect(() => {
    setLocalData(lessonData)
  }, [lessonData.lessonNumber, lessonData.weekNumber]) // 차시 변경 시에만 동기화

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
  }, [localData]) // onUpdate 의존성 제거 (안정적인 참조 가정)

  // 로컬 업데이트 함수 (즉시 UI 반영, debounce로 부모 전달)
  const updateLocal = useCallback((updates) => {
    setLocalData(prev => ({ ...prev, ...updates }))
  }, [])

  const isFirstLesson = localData.weekNumber === 1 && localData.lessonNumber === 1

  // 1강 1주차 1차시 오리엔테이션 초기화 (useEffect로 이동)
  useEffect(() => {
    if (!isFirstLesson) return

    if (!localData.hasOrientation) {
      const autoVideoUrl =
        courseCode && year ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4` : ""
      const autoSubtitlePath = courseCode ? `../subtitles/${courseCode}_ot.vtt` : ""
      updateLocal({
        hasOrientation: true,
        orientation: {
          videoUrl: autoVideoUrl,
          subtitlePath: autoSubtitlePath,
        },
      })
    } else if (courseCode && year && !localData.orientation?.videoUrl) {
      const autoVideoUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4`
      const autoSubtitlePath = `../subtitles/${courseCode}_ot.vtt`
      updateLocal({
        orientation: {
          videoUrl: autoVideoUrl,
          subtitlePath: autoSubtitlePath,
        },
      })
    }
  }, [isFirstLesson, courseCode, year, localData.hasOrientation, localData.orientation?.videoUrl, updateLocal])

  // terms 초기화 (useEffect로 이동)
  useEffect(() => {
    if (!localData.terms || localData.terms.length === 0) {
      updateLocal({
        terms: [
          { title: "", content: ["", "", ""] },
          { title: "", content: ["", "", ""] },
          { title: "", content: ["", "", ""] },
        ],
      })
    }
  }, [localData.terms, updateLocal])

  const handleOrientationChange = (field, value) => {
    updateLocal({
      orientation: { ...localData.orientation, [field]: value },
    })
  }

  const handleTermChange = (index, field, value) => {
    const newTerms = [...localData.terms]
    newTerms[index] = { ...newTerms[index], [field]: value }
    updateLocal({ terms: newTerms })
  }

  const handleTermContentChange = (termIndex, contentIndex, value) => {
    const newTerms = [...localData.terms]
    const newContent = [...(newTerms[termIndex].content || [])]
    newContent[contentIndex] = value
    newTerms[termIndex] = { ...newTerms[termIndex], content: newContent }
    updateLocal({ terms: newTerms })
  }

  const addTermContent = (termIndex) => {
    const newTerms = [...localData.terms]
    const newContent = [...(newTerms[termIndex].content || []), ""]
    newTerms[termIndex] = { ...newTerms[termIndex], content: newContent }
    updateLocal({ terms: newTerms })
  }

  const removeTermContent = (termIndex, contentIndex) => {
    const newTerms = [...localData.terms]
    const newContent = (newTerms[termIndex].content || []).filter((_, i) => i !== contentIndex)
    newTerms[termIndex] = { ...newTerms[termIndex], content: newContent }
    updateLocal({ terms: newTerms })
  }

  const handleTermContentPaste = (termIndex, contentIndex, e) => {
    const pastedText = e.clipboardData.getData('text/plain');

    if (pastedText.includes('\n')) {
      e.preventDefault();

      const lines = pastedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length > 1) {
        const newTerms = [...localData.terms];
        const currentContent = [...(newTerms[termIndex].content || [])];
        currentContent[contentIndex] = lines[0];

        for (let i = 1; i < lines.length; i++) {
          currentContent.splice(contentIndex + i, 0, lines[i]);
        }

        newTerms[termIndex] = { ...newTerms[termIndex], content: currentContent };
        updateLocal({ terms: newTerms });

        console.log(`[용어 ${termIndex + 1}] 붙여넣기: ${lines.length}개 항목으로 자동 분리됨`);
      } else if (lines.length === 1) {
        const newTerms = [...localData.terms];
        const currentContent = [...(newTerms[termIndex].content || [])];
        currentContent[contentIndex] = lines[0];
        newTerms[termIndex] = { ...newTerms[termIndex], content: currentContent };
        updateLocal({ terms: newTerms });
      }
    }
  }

  const handleLearningContentChange = (index, value) => {
    const newContents = [...localData.learningContents]
    newContents[index] = value
    updateLocal({ learningContents: newContents })
  }

  const handleLearningObjectiveChange = (index, value) => {
    const newObjectives = [...localData.learningObjectives]
    newObjectives[index] = value
    updateLocal({ learningObjectives: newObjectives })
  }

  const isHtmlContent = (text) => {
    if (!text || typeof text !== "string") return false
    return /<[^>]+>/.test(text)
  }

  const terms =
    localData.terms && localData.terms.length > 0
      ? localData.terms
      : [
          { title: "", content: ["", "", ""] },
          { title: "", content: ["", "", ""] },
          { title: "", content: ["", "", ""] },
        ]

  return (
    <div className="form-section">
      <h3>준비하기</h3>

      {/* 오리엔테이션 (1주1차시만, 자동 활성화) */}
      {isFirstLesson && (
        <div id="subsection-orientation" className="subsection">
          <div className="form-group">
            <label>오리엔테이션 영상 URL</label>
            <input
              type="url"
              placeholder={
                courseCode && year
                  ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4`
                  : "https://cdn-it.livestudy.com/mov/{연도}/{코드명}/{코드명}_ot.mp4"
              }
              value={
                localData.orientation?.videoUrl ||
                (courseCode && year
                  ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4`
                  : "")
              }
              onChange={(e) => handleOrientationChange("videoUrl", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>자막 파일 경로</label>
            <input
              type="text"
              placeholder={courseCode ? `../subtitles/${courseCode}_ot.vtt` : "../subtitles/{코드명}_ot.vtt"}
              value={localData.orientation?.subtitlePath || (courseCode ? `../subtitles/${courseCode}_ot.vtt` : "")}
              onChange={(e) => handleOrientationChange("subtitlePath", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 용어체크 (일반 과정만 표시) */}
      {courseType === 'general' && (
      <div id="subsection-terms" className="subsection">
        <div className="list-header">
          <h4>용어체크</h4>
          <button
            className="btn-add-small"
            onClick={() => {
              const newTerms = [...localData.terms, { title: "", content: ["", "", ""] }]
              updateLocal({ terms: newTerms })
            }}
          >
            + 용어 추가
          </button>
        </div>
        {terms.map((term, index) => (
          <div key={index} className="term-item">
            <div className="term-header">
              <span>용어 {index + 1}</span>
              {terms.length > 1 && (
                <button
                  className="btn-remove-inline"
                  onClick={() => {
                    const newTerms = localData.terms.filter((_, i) => i !== index)
                    updateLocal({ terms: newTerms })
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
                onChange={(e) => handleTermChange(index, "title", e.target.value)}
                rows={2}
              />
              <small className="hint">💡 Enter 키로 줄바꿈 가능</small>
            </div>
            <div className="form-group">
              <div className="list-header">
                <label>내용</label>
                <button className="btn-add-small" onClick={() => addTermContent(index)} type="button">
                  + 추가
                </button>
              </div>
              {(term.content || [""]).map((contentItem, contentIndex) => (
                <div key={contentIndex} className="dynamic-item">
                  <input
                    type="text"
                    placeholder={`내용 ${contentIndex + 1}`}
                    value={contentItem}
                    onChange={(e) => handleTermContentChange(index, contentIndex, e.target.value)}
                    onPaste={(e) => handleTermContentPaste(index, contentIndex, e)}
                    title="여러 줄 붙여넣기 시 자동으로 항목 분리"
                  />
                  {(term.content || []).length > 1 && (
                    <button
                      className="btn-remove-small"
                      onClick={() => removeTermContent(index, contentIndex)}
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <small className="hint">💡 여러 줄을 붙여넣으면 자동으로 항목이 분리됩니다.</small>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* 학습목표 */}
      <div id="subsection-objectives" className="subsection">
        <h4>학습목표</h4>

        <div id="subsection-contents" className="learning-group">
          <div className="list-header">
            <label className="group-label">학습내용</label>
            <button
              className="btn-add-small"
              onClick={() => {
                const learningContents = localData.learningContents
                  ? [
                      ...localData.learningContents.filter(
                        (content) => !(typeof content === "string" && content.includes("class='practice'")),
                      ),
                      "",
                    ]
                  : [""]
                updateLocal({ learningContents: learningContents })
              }}
            >
              + 추가
            </button>
          </div>
          {(() => {
            const nonPracticeContents = (localData.learningContents || []).filter(
              (content) => !(typeof content === "string" && content.includes("class='practice'")),
            )
            return nonPracticeContents.map((content, index) => {
              const isHtml = isHtmlContent(content)
              const contentNumber = index + 1
              const actualIndex = localData.learningContents.findIndex((c) => c === content)

              return (
                <div
                  key={`learning-content-${actualIndex}-${index}`}
                  className={isHtml ? "dynamic-item-vertical" : "dynamic-item"}
                >
                  {isHtml && (
                    <div className="item-header">
                      <label>학습내용 {contentNumber}</label>
                      {nonPracticeContents.length > 1 && (
                        <button
                          className="btn-remove-small"
                          onClick={() => {
                            const newContents = localData.learningContents.filter((_, i) => i !== actualIndex)
                            updateLocal({ learningContents: newContents })
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                  {isHtml ? (
                    <TinyMCEEditor
                      value={content}
                      onChange={(value) => handleLearningContentChange(actualIndex, value)}
                      placeholder={`학습내용 ${contentNumber}`}
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder={`학습내용 ${contentNumber}`}
                        value={content}
                        onChange={(e) => handleLearningContentChange(actualIndex, e.target.value)}
                      />
                      {nonPracticeContents.length > 1 && (
                        <button
                          className="btn-remove-small"
                          onClick={() => {
                            const newContents = localData.learningContents.filter((_, i) => i !== actualIndex)
                            updateLocal({ learningContents: newContents })
                          }}
                        >
                          ×
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })
          })()}

          {/* 실습 에디터 별도 표시 (항상 마지막) */}
          {localData.hasPractice && (
            <div key="practice-editor" className="dynamic-item-vertical">
              <div className="item-header">
                <label>실습</label>
              </div>
              <TinyMCEEditor
                value={
                  localData.practiceContent ||
                  localData.learningContents?.find(
                    (content) => typeof content === "string" && content.includes("class='practice'"),
                  ) ||
                  "<ul class='practice'><li></li></ul>"
                }
                onChange={(value) => {
                  updateLocal({ practiceContent: value })
                }}
                placeholder="실습 내용"
              />
            </div>
          )}
        </div>

        <div className="learning-group">
          <div className="list-header">
            <label className="group-label">학습목표</label>
            <button
              className="btn-add-small"
              onClick={() => {
                const newObjectives = [...localData.learningObjectives, ""]
                updateLocal({ learningObjectives: newObjectives })
              }}
            >
              + 추가
            </button>
          </div>
          {localData.learningObjectives.map((objective, index) => {
            const isHtml = isHtmlContent(objective)
            return (
              <div key={index} className={isHtml ? "dynamic-item-vertical" : "dynamic-item"}>
                {isHtml && (
                  <div className="item-header">
                    <label>학습목표 {index + 1}</label>
                    {localData.learningObjectives.length > 1 && (
                      <button
                        className="btn-remove-small"
                        onClick={() => {
                          const newObjectives = localData.learningObjectives.filter((_, i) => i !== index)
                          updateLocal({ learningObjectives: newObjectives })
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                {isHtml ? (
                  <TinyMCEEditor
                    value={objective}
                    onChange={(value) => handleLearningObjectiveChange(index, value)}
                    placeholder={`학습목표 ${index + 1}`}
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder={`학습목표 ${index + 1}`}
                      value={objective}
                      onChange={(e) => handleLearningObjectiveChange(index, e.target.value)}
                    />
                    {localData.learningObjectives.length > 1 && (
                      <button
                        className="btn-remove-small"
                        onClick={() => {
                          const newObjectives = localData.learningObjectives.filter((_, i) => i !== index)
                          updateLocal({ learningObjectives: newObjectives })
                        }}
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default React.memo(PreparationSection)
