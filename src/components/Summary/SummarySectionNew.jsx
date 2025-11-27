import './SummarySection.css';
import RichTextEditor from '../RichTextEditor';

function SummarySection({ lessonData, onUpdate, courseCode, year }) {
  // 차시 번호를 2자리 문자열로 변환 (01, 02, ...)
  const lessonNumStr = String(lessonData.lessonNumber).padStart(2, '0');
  
  // 자동 생성된 다운로드 URL들
  const autoInstructionUrl = courseCode && year 
    ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/down/${courseCode}_mp3_${lessonNumStr}.zip`
    : '';
  const autoGuideUrl = courseCode && year 
    ? `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/down/${courseCode}_book_${lessonNumStr}.zip`
    : '';
  // 연습문제 추가
  const addExercise = () => {
    onUpdate({
      ...lessonData,
      exercises: [
        ...lessonData.exercises,
        {
          type: 'boolean',
          question: '',
          answer: '', // 기본 선택 없음
          options: [],
          commentary: ''
        }
      ]
    });
  };

  // 연습문제 삭제
  const removeExercise = (index) => {
    onUpdate({
      ...lessonData,
      exercises: lessonData.exercises.filter((_, i) => i !== index)
    });
  };

  // 연습문제 타입 변경
  const changeExerciseType = (index, newType) => {
    const newExercises = [...lessonData.exercises];
    newExercises[index] = {
      ...newExercises[index],
      type: newType,
      answer: '', // 기본 선택 없음
      options: newType === 'multiple' ? ['', '', '', ''] : []
    };
    onUpdate({ ...lessonData, exercises: newExercises });
  };

  // 연습문제 업데이트
  const updateExercise = (index, field, value) => {
    const newExercises = [...lessonData.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    onUpdate({ ...lessonData, exercises: newExercises });
  };

  // 연습문제 선택지 업데이트
  const updateExerciseOption = (exerciseIndex, optionIndex, value) => {
    const newExercises = [...lessonData.exercises];
    const newOptions = [...newExercises[exerciseIndex].options];
    newOptions[optionIndex] = value;
    newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], options: newOptions };
    onUpdate({ ...lessonData, exercises: newExercises });
  };

  // 학습정리 추가
  const addSummary = () => {
    onUpdate({
      ...lessonData,
      summary: [...lessonData.summary, '']
    });
  };

  // 학습정리 삭제
  const removeSummary = (index) => {
    onUpdate({
      ...lessonData,
      summary: lessonData.summary.filter((_, i) => i !== index)
    });
  };

  // 학습정리 업데이트
  const updateSummary = (index, value) => {
    const newSummary = [...lessonData.summary];
    newSummary[index] = value;
    onUpdate({ ...lessonData, summary: newSummary });
  };

  // 다운로드 URL 업데이트
  const handleDownloadChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value });
  };

  // exercises가 없거나 비어있을 때 기본 3개 제공
  const exercises = lessonData.exercises && lessonData.exercises.length > 0
    ? lessonData.exercises
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
      ];

  // exercises가 비어있을 때 자동으로 초기화
  if (!lessonData.exercises || lessonData.exercises.length === 0) {
    onUpdate({
      ...lessonData,
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
    });
  }

  return (
    <div className="form-section">
      <h3>✅ 정리하기</h3>

      {/* 연습문제 */}
      <div className="subsection">
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
                  <button
                    className="btn-remove-inline"
                    onClick={() => removeExercise(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>문항</label>
              <RichTextEditor
                value={exercise.question}
                onChange={(value) => updateExercise(index, 'question', value)}
                placeholder="문제를 입력하세요"
              />
            </div>

            {exercise.type === 'multiple' && (
              <div className="options-group">
                <label className="group-label">선택지</label>
                {exercise.options.map((option, optIndex) => (
                  <div key={optIndex} className="form-group">
                    <label>선택지 {optIndex + 1}</label>
                    <RichTextEditor
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
              {exercise.type === 'boolean' ? (
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name={`exercise${index}_answer`}
                      value="1"
                      checked={exercise.answer === '1'}
                      onChange={(e) => updateExercise(index, 'answer', e.target.value)}
                    />
                    <span>O (참)</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`exercise${index}_answer`}
                      value="2"
                      checked={exercise.answer === '2'}
                      onChange={(e) => updateExercise(index, 'answer', e.target.value)}
                    />
                    <span>X (거짓)</span>
                  </label>
                </div>
              ) : (
                <select
                  value={exercise.answer || ''}
                  onChange={(e) => updateExercise(index, 'answer', e.target.value)}
                >
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
              <RichTextEditor
                value={exercise.commentary}
                onChange={(value) => updateExercise(index, 'commentary', value)}
                placeholder="정답에 대한 해설을 작성하세요"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 학습정리 */}
      <div className="subsection">
        <div className="list-header">
          <h4>학습정리</h4>
          <button className="btn-add-small" onClick={addSummary}>
            + 추가
          </button>
        </div>
        {lessonData.summary.map((sum, index) => (
          <div key={index} className="dynamic-item-vertical">
            <div className="item-header">
              <label>정리 {index + 1}</label>
              {lessonData.summary.length > 1 && (
                <button
                  className="btn-remove-inline"
                  onClick={() => removeSummary(index)}
                >
                  ×
                </button>
              )}
            </div>
            <RichTextEditor
              key={`summary-editor-${index}-${lessonData.lessonNumber}`}
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
            placeholder={autoInstructionUrl || "https://cdn-it.livestudy.com/mov/{연도}/{코드명}/down/{코드명}_mp3_{차시번호}.zip"}
            value={lessonData.instructionUrl || autoInstructionUrl}
            onChange={(e) => handleDownloadChange('instructionUrl', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>교안 ZIP URL</label>
          <input
            type="url"
            placeholder={autoGuideUrl || "https://cdn-it.livestudy.com/mov/{연도}/{코드명}/down/{코드명}_book_{차시번호}.zip"}
            value={lessonData.guideUrl || autoGuideUrl}
            onChange={(e) => handleDownloadChange('guideUrl', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default SummarySection;
