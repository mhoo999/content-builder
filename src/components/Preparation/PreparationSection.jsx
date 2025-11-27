import './PreparationSection.css';

function PreparationSection({ lessonData, onUpdate, courseCode, year }) {
  const isFirstLesson = lessonData.weekNumber === 1 && lessonData.lessonNumber === 1;

  // 1강 1주차 1차시인 경우 오리엔테이션 자동 활성화 및 URL 자동 생성
  if (isFirstLesson) {
    if (!lessonData.hasOrientation) {
      const autoVideoUrl = courseCode && year ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4` : '';
      const autoSubtitlePath = courseCode ? `../subtitles/${courseCode}_ot.vtt` : '';
      onUpdate({ 
        ...lessonData, 
        hasOrientation: true,
        orientation: {
          videoUrl: autoVideoUrl,
          subtitlePath: autoSubtitlePath
        }
      });
    } else if (courseCode && year && !lessonData.orientation.videoUrl) {
      // 이미 활성화되어 있지만 URL이 없는 경우 자동 생성
      const autoVideoUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4`;
      const autoSubtitlePath = `../subtitles/${courseCode}_ot.vtt`;
      onUpdate({
        ...lessonData,
        orientation: {
          videoUrl: autoVideoUrl,
          subtitlePath: autoSubtitlePath
        }
      });
    }
  }

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

  const handleTermContentChange = (termIndex, contentIndex, value) => {
    const newTerms = [...lessonData.terms];
    const newContent = [...(newTerms[termIndex].content || [])];
    newContent[contentIndex] = value;
    newTerms[termIndex] = { ...newTerms[termIndex], content: newContent };
    onUpdate({ ...lessonData, terms: newTerms });
  };

  const addTermContent = (termIndex) => {
    const newTerms = [...lessonData.terms];
    const newContent = [...(newTerms[termIndex].content || []), ''];
    newTerms[termIndex] = { ...newTerms[termIndex], content: newContent };
    onUpdate({ ...lessonData, terms: newTerms });
  };

  const removeTermContent = (termIndex, contentIndex) => {
    const newTerms = [...lessonData.terms];
    const newContent = (newTerms[termIndex].content || []).filter((_, i) => i !== contentIndex);
    newTerms[termIndex] = { ...newTerms[termIndex], content: newContent };
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

      {/* 오리엔테이션 (1주1차시만, 자동 활성화) */}
      {isFirstLesson && (
        <div className="subsection">
          <div className="form-group">
            <label>오리엔테이션 영상 URL</label>
            <input
              type="url"
              placeholder={courseCode && year ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4` : "https://cdn-it.livestudy.com/mov/{연도}/{코드명}/{코드명}_ot.mp4"}
              value={lessonData.orientation.videoUrl || (courseCode && year ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4` : '')}
              onChange={(e) => handleOrientationChange('videoUrl', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>자막 파일 경로</label>
            <input
              type="text"
              placeholder={courseCode ? `../subtitles/${courseCode}_ot.vtt` : "../subtitles/{코드명}_ot.vtt"}
              value={lessonData.orientation.subtitlePath || (courseCode ? `../subtitles/${courseCode}_ot.vtt` : '')}
              onChange={(e) => handleOrientationChange('subtitlePath', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 용어체크 */}
      <div className="subsection">
        <div className="list-header">
          <h4>용어체크</h4>
          <button
            className="btn-add-small"
            onClick={() => {
              const newTerms = [...lessonData.terms, { title: '', content: [''] }];
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
              <div className="list-header">
                <label>내용</label>
                <button
                  className="btn-add-small"
                  onClick={() => addTermContent(index)}
                  type="button"
                >
                  + 추가
                </button>
              </div>
              {(term.content || ['']).map((contentItem, contentIndex) => (
                <div key={contentIndex} className="dynamic-item">
                  <input
                    type="text"
                    placeholder={`내용 ${contentIndex + 1}`}
                    value={contentItem}
                    onChange={(e) => handleTermContentChange(index, contentIndex, e.target.value)}
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
