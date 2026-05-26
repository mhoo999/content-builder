import './ProfessorSection.css';
import ImageUploader from '../ImageUploader/ImageUploader';

function ProfessorSection({ professor, onUpdate, disabled = false }) {
  const addEducation = () => {
    onUpdate({
      ...professor,
      education: [...professor.education, '']
    });
  };

  const removeEducation = (index) => {
    onUpdate({
      ...professor,
      education: professor.education.filter((_, i) => i !== index)
    });
  };

  const updateEducation = (index, value) => {
    const newEducation = [...professor.education];
    newEducation[index] = value;
    onUpdate({ ...professor, education: newEducation });
  };

  const addCareer = () => {
    onUpdate({
      ...professor,
      career: [...professor.career, { period: '', startDate: '', endDate: '', description: '' }]
    });
  };

  const removeCareer = (index) => {
    onUpdate({
      ...professor,
      career: professor.career.filter((_, i) => i !== index)
    });
  };

  const updateCareer = (index, field, value) => {
    const newCareer = [...professor.career];
    newCareer[index] = { ...newCareer[index], [field]: value };
    
    // period가 변경되면 startDate와 endDate를 파싱하여 업데이트
    if (field === 'period') {
      const dates = parsePeriodToDates(value);
      newCareer[index].startDate = dates.startDate;
      newCareer[index].endDate = dates.endDate;
    }
    
    onUpdate({ ...professor, career: newCareer });
  };

  // period 문자열을 파싱하여 startDate와 endDate 추출
  const parsePeriodToDates = (period) => {
    if (!period) return { startDate: '', endDate: '' };
    
    // "YYYY년 MM월 ~ YYYY년 MM월" 형식 파싱
    const match = period.match(/(\d{4})년\s*(\d{1,2})월\s*~\s*(\d{4})년\s*(\d{1,2})월/);
    if (match) {
      const [, startYear, startMonth, endYear, endMonth] = match;
      return {
        startDate: `${startYear}-${String(startMonth).padStart(2, '0')}-01`,
        endDate: `${endYear}-${String(endMonth).padStart(2, '0')}-01`
      };
    }
    
    // "YYYY년 MM월 ~" 형식 파싱
    const singleMatch = period.match(/(\d{4})년\s*(\d{1,2})월\s*~/);
    if (singleMatch) {
      const [, year, month] = singleMatch;
      return {
        startDate: `${year}-${String(month).padStart(2, '0')}-01`,
        endDate: ''
      };
    }
    
    return { startDate: '', endDate: '' };
  };

  return (
    <div className="professor-section">
      <div className="professor-profile-head">
        <label className="professor-name-field">
          <span>교수명</span>
          <input
            type="text"
            placeholder="예: 곽후근"
            value={professor.name}
            onChange={(e) => onUpdate({ ...professor, name: e.target.value })}
            disabled={disabled}
          />
        </label>
      </div>

      <details className="professor-compact-details">
        <summary>교수 사진</summary>
        <ImageUploader
          onImageInsert={(imageHtml) => {
            onUpdate({ ...professor, photo: imageHtml });
          }}
          disabled={disabled}
        />
        {professor.photo && (
          <div className="current-image-preview">
            <small>현재 이미지</small>
            <div dangerouslySetInnerHTML={{ __html: professor.photo }} />
          </div>
        )}
      </details>

      {/* 학력 */}
      <div className="dynamic-list">
        <div className="list-header">
          <label>학력</label>
          <button className="btn-add-small" onClick={addEducation} disabled={disabled}>
            + 추가
          </button>
        </div>
        {professor.education.map((edu, index) => (
          <div key={index} className="dynamic-item">
            <input
              type="text"
              placeholder="예: 호서대학교 전자공학 학사"
              value={edu}
              onChange={(e) => updateEducation(index, e.target.value)}
              disabled={disabled}
            />
            <button
              className="btn-remove-small"
              onClick={() => removeEducation(index)}
              disabled={disabled}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 경력 */}
      <div className="dynamic-list">
        <div className="list-header">
          <label>경력</label>
          <button className="btn-add-small" onClick={addCareer} disabled={disabled}>
            + 추가
          </button>
        </div>
        {professor.career.map((car, index) => (
          <div key={index} className="career-item">
            <div className="career-inputs">
              <div className="form-group">
                <label>기간</label>
                <input
                  type="text"
                  placeholder="예: 2020년 1월 ~ 2023년 12월"
                  value={car.period || ''}
                  onChange={(e) => updateCareer(index, 'period', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="form-group">
                <label>내용</label>
                <input
                  type="text"
                  placeholder="예: 펌킨네트웍스 기술본부 이사"
                  value={car.description || ''}
                  onChange={(e) => updateCareer(index, 'description', e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
            <button
              className="btn-remove-small"
              onClick={() => removeCareer(index)}
              disabled={disabled}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfessorSection;
