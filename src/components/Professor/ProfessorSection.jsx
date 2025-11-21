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
    
    // startDate나 endDate가 변경되면 period를 업데이트
    if (field === 'startDate' || field === 'endDate') {
      const startDate = field === 'startDate' ? value : (newCareer[index].startDate || '');
      const endDate = field === 'endDate' ? value : (newCareer[index].endDate || '');
      
      if (startDate && endDate) {
        // 날짜를 "YYYY년 MM월 ~ YYYY년 MM월" 형식으로 변환
        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          return `${year}년 ${month}월`;
        };
        newCareer[index].period = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
      } else if (startDate) {
        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          return `${year}년 ${month}월`;
        };
        newCareer[index].period = `${formatDate(startDate)} ~`;
      } else {
        newCareer[index].period = '';
      }
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
        {professor.career.map((car, index) => {
          const dates = parsePeriodToDates(car.period || '');
          return (
            <div key={index} className="career-item">
              <div className="career-inputs">
                <div className="form-group">
                  <label>시작일</label>
                  <input
                    type="date"
                    value={car.startDate || dates.startDate || ''}
                    onChange={(e) => updateCareer(index, 'startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>종료일</label>
                  <input
                    type="date"
                    value={car.endDate || dates.endDate || ''}
                    onChange={(e) => updateCareer(index, 'endDate', e.target.value)}
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
          );
        })}
      </div>
    </div>
  );
}

export default ProfessorSection;
