import { useState } from 'react';
import './ProfessorSection.css';
import ImageUploader from '../ImageUploader/ImageUploader';

function ProfessorSection({ professor, onUpdate }) {
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
      career: [...professor.career, { period: '', description: '' }]
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
    onUpdate({ ...professor, career: newCareer });
  };

  return (
    <div className="professor-section">
      <div className="form-group">
        <label>교수명</label>
        <input
          type="text"
          placeholder="예: 곽후근"
          value={professor.name}
          onChange={(e) => onUpdate({ ...professor, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>교수 사진</label>
        <ImageUploader
          onImageInsert={(imageHtml) => {
            onUpdate({ ...professor, photo: imageHtml });
          }}
        />
        {professor.photo && (
          <div className="current-image-preview">
            <small>현재 이미지:</small>
            <div dangerouslySetInnerHTML={{ __html: professor.photo }} />
          </div>
        )}
      </div>

      {/* 학력 */}
      <div className="dynamic-list">
        <div className="list-header">
          <label>학력</label>
          <button className="btn-add-small" onClick={addEducation}>
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
            />
            <button
              className="btn-remove-small"
              onClick={() => removeEducation(index)}
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
          <button className="btn-add-small" onClick={addCareer}>
            + 추가
          </button>
        </div>
        {professor.career.map((car, index) => (
          <div key={index} className="career-item">
            <div className="career-inputs">
              <div className="form-group">
                <label>연도</label>
                <input
                  type="text"
                  placeholder="예: 2003년 6월 ~ 2013년 9월"
                  value={car.period || ''}
                  onChange={(e) => updateCareer(index, 'period', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>내용</label>
                <input
                  type="text"
                  placeholder="예: 펌킨네트웍스 기술본부 이사"
                  value={car.description || ''}
                  onChange={(e) => updateCareer(index, 'description', e.target.value)}
                />
              </div>
            </div>
            <button
              className="btn-remove-small"
              onClick={() => removeCareer(index)}
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
