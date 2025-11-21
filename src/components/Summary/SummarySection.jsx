import './SummarySection.css';

function SummarySection({ lessonData, onUpdate }) {
  // 연습문제 1 (OX) 업데이트
  const handleExercise1Change = (field, value) => {
    onUpdate({
      ...lessonData,
      exercise1: { ...lessonData.exercise1, [field]: value }
    });
  };

  // 연습문제 2 (4지선다) 업데이트
  const handleExercise2Change = (field, value) => {
    onUpdate({
      ...lessonData,
      exercise2: { ...lessonData.exercise2, [field]: value }
    });
  };

  const handleExercise2OptionChange = (index, value) => {
    const newOptions = [...lessonData.exercise2.options];
    newOptions[index] = value;
    onUpdate({
      ...lessonData,
      exercise2: { ...lessonData.exercise2, options: newOptions }
    });
  };

  // 연습문제 3 (4지선다) 업데이트
  const handleExercise3Change = (field, value) => {
    onUpdate({
      ...lessonData,
      exercise3: { ...lessonData.exercise3, [field]: value }
    });
  };

  const handleExercise3OptionChange = (index, value) => {
    const newOptions = [...lessonData.exercise3.options];
    newOptions[index] = value;
    onUpdate({
      ...lessonData,
      exercise3: { ...lessonData.exercise3, options: newOptions }
    });
  };

  // 학습정리 업데이트
  const handleSummaryChange = (index, value) => {
    const newSummary = [...lessonData.summary];
    newSummary[index] = value;
    onUpdate({ ...lessonData, summary: newSummary });
  };

  // 다운로드 URL 업데이트
  const handleDownloadChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value });
  };

  return (
    <div className="form-section">
      <h3>✅ 정리하기</h3>

      {/* 연습문제 */}
      <div className="subsection">
        <h4>연습문제</h4>

        {/* 문제 1: OX (고정) */}
        <div className="exercise-item">
          <div className="exercise-header">
            <span className="exercise-number">문제 1</span>
            <span className="exercise-type">OX 문제</span>
          </div>
          <div className="form-group">
            <label>문항</label>
            <textarea
              placeholder="예: 암호 알고리즘은 비밀로 하여야 한다."
              value={lessonData.exercise1.question}
              onChange={(e) => handleExercise1Change('question', e.target.value)}
              rows={2}
            />
          </div>
          <div className="form-group">
            <label>정답</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="exercise1_answer"
                  value="1"
                  checked={lessonData.exercise1.answer === '1'}
                  onChange={(e) => handleExercise1Change('answer', e.target.value)}
                />
                <span>O (참)</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="exercise1_answer"
                  value="2"
                  checked={lessonData.exercise1.answer === '2'}
                  onChange={(e) => handleExercise1Change('answer', e.target.value)}
                />
                <span>X (거짓)</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>해설</label>
            <textarea
              placeholder="예: 암호 알고리즘은 공개해도 상관없다. 비밀로 해야 하는 것은 키(Key)이다."
              value={lessonData.exercise1.commentary}
              onChange={(e) => handleExercise1Change('commentary', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* 문제 2: 4지선다 (고정) */}
        <div className="exercise-item">
          <div className="exercise-header">
            <span className="exercise-number">문제 2</span>
            <span className="exercise-type">4지선다</span>
          </div>
          <div className="form-group">
            <label>문항</label>
            <textarea
              placeholder="예: 다음 중 암호 해독자의 의미로 보기 어려운 것은 무엇인가?"
              value={lessonData.exercise2.question}
              onChange={(e) => handleExercise2Change('question', e.target.value)}
              rows={2}
            />
          </div>
          <div className="options-group">
            <label className="group-label">선택지</label>
            {lessonData.exercise2.options.map((option, index) => (
              <div key={index} className="form-group">
                <input
                  type="text"
                  placeholder={`선택지 ${index + 1}`}
                  value={option}
                  onChange={(e) => handleExercise2OptionChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label>정답 번호</label>
            <select
              value={lessonData.exercise2.answer}
              onChange={(e) => handleExercise2Change('answer', e.target.value)}
            >
              <option value="1">1번</option>
              <option value="2">2번</option>
              <option value="3">3번</option>
              <option value="4">4번</option>
            </select>
          </div>
          <div className="form-group">
            <label>해설</label>
            <textarea
              placeholder="정답에 대한 해설을 작성하세요"
              value={lessonData.exercise2.commentary}
              onChange={(e) => handleExercise2Change('commentary', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* 문제 3: 4지선다 (고정) */}
        <div className="exercise-item">
          <div className="exercise-header">
            <span className="exercise-number">문제 3</span>
            <span className="exercise-type">4지선다</span>
          </div>
          <div className="form-group">
            <label>문항</label>
            <textarea
              placeholder="문제를 입력하세요"
              value={lessonData.exercise3.question}
              onChange={(e) => handleExercise3Change('question', e.target.value)}
              rows={2}
            />
          </div>
          <div className="options-group">
            <label className="group-label">선택지</label>
            {lessonData.exercise3.options.map((option, index) => (
              <div key={index} className="form-group">
                <input
                  type="text"
                  placeholder={`선택지 ${index + 1}`}
                  value={option}
                  onChange={(e) => handleExercise3OptionChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label>정답 번호</label>
            <select
              value={lessonData.exercise3.answer}
              onChange={(e) => handleExercise3Change('answer', e.target.value)}
            >
              <option value="1">1번</option>
              <option value="2">2번</option>
              <option value="3">3번</option>
              <option value="4">4번</option>
            </select>
          </div>
          <div className="form-group">
            <label>해설</label>
            <textarea
              placeholder="정답에 대한 해설을 작성하세요"
              value={lessonData.exercise3.commentary}
              onChange={(e) => handleExercise3Change('commentary', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* 학습정리 */}
      <div className="subsection">
        <h4>학습정리 (3개)</h4>
        {lessonData.summary.map((sum, index) => (
          <div key={index} className="form-group">
            <label>정리 {index + 1}</label>
            <textarea
              placeholder={`학습정리 내용 ${index + 1}`}
              value={sum}
              onChange={(e) => handleSummaryChange(index, e.target.value)}
              rows={4}
            />
            <small className="hint">💡 이미지, 표 삽입 지원 예정</small>
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
            placeholder="https://cdn-it.livestudy.com/mov/2025/25itinse/down/25itinse_mp3_01.zip"
            value={lessonData.instructionUrl}
            onChange={(e) => handleDownloadChange('instructionUrl', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>교안 ZIP URL</label>
          <input
            type="url"
            placeholder="https://cdn-it.livestudy.com/mov/2025/25itinse/down/25itinse_book_01.zip"
            value={lessonData.guideUrl}
            onChange={(e) => handleDownloadChange('guideUrl', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default SummarySection;
