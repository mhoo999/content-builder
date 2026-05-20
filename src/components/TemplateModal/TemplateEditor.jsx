import { useState, useEffect } from 'react';
import './TemplateEditor.css';

const AVAILABLE_SECTIONS = [
  '인트로',
  '준비하기',
  '들어가기',
  '학습하기',
  '실습하기',
  '점검하기',
  '정리하기',
  '퀴즈',
  '연습문제',
];

const AVAILABLE_FEATURES = [
  { key: 'hasIntro', label: '인트로 섹션' },
  { key: 'hasOrientation', label: '학습안내' },
  { key: 'hasTerm', label: '용어설명' },
  { key: 'hasObjectives', label: '학습목표' },
  { key: 'hasOpinion', label: '생각해보기' },
  { key: 'hasLecture', label: '강의영상' },
  { key: 'hasPractice', label: '실습하기' },
  { key: 'hasCheck', label: '점검하기' },
  { key: 'hasExercise', label: '연습문제' },
  { key: 'hasTheorem', label: '사전평가' },
  { key: 'hasNext', label: '다음차시' },
];

function TemplateEditor({ onClose, onSave, initialTemplate = null }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);
  const [features, setFeatures] = useState({});

  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name || '');
      setDescription(initialTemplate.description || '');
      setSelectedSections(initialTemplate.sections || []);
      setFeatures(initialTemplate.features || {});
    }
  }, [initialTemplate]);

  const handleSectionToggle = (section) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleFeatureToggle = (featureKey) => {
    setFeatures((prev) => ({
      ...prev,
      [featureKey]: !prev[featureKey],
    }));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }

    if (selectedSections.length === 0) {
      alert('최소 하나 이상의 섹션을 선택해주세요.');
      return;
    }

    const template = {
      name: name.trim(),
      description: description.trim(),
      sections: selectedSections,
      features: {
        ...AVAILABLE_FEATURES.reduce((acc, f) => ({ ...acc, [f.key]: false }), {}),
        ...features,
      },
    };

    onSave(template, initialTemplate?.id);
    onClose();
  };

  return (
    <div className="template-editor-overlay" onClick={onClose}>
      <div className="template-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-editor-header">
          <h2>{initialTemplate ? '템플릿 편집' : '새 템플릿 만들기'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="template-editor-body">
          <div className="form-group">
            <label htmlFor="template-name">템플릿 이름 *</label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 내 커스텀 템플릿"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="template-description">설명</label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="템플릿에 대한 간단한 설명을 입력하세요."
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>섹션 구성 *</label>
            <div className="checkbox-grid">
              {AVAILABLE_SECTIONS.map((section) => (
                <label key={section} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(section)}
                    onChange={() => handleSectionToggle(section)}
                  />
                  <span>{section}</span>
                </label>
              ))}
            </div>
            <div className="section-preview">
              {selectedSections.length > 0 ? (
                <div className="section-order">
                  순서: {selectedSections.map((s, i) => (
                    <span key={i}>
                      {i > 0 && ' → '}
                      <strong>{s}</strong>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="placeholder-text">섹션을 선택하면 순서가 표시됩니다</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>기능 구성</label>
            <div className="checkbox-grid">
              {AVAILABLE_FEATURES.map((feature) => (
                <label key={feature.key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={features[feature.key] || false}
                    onChange={() => handleFeatureToggle(feature.key)}
                  />
                  <span>{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="template-note">
            <strong>참고:</strong> 커스텀 템플릿은 기본 테마 1개만 지원됩니다.
          </div>
        </div>

        <div className="template-editor-footer">
          <button className="cancel-btn" onClick={onClose}>취소</button>
          <button className="save-btn" onClick={handleSubmit}>
            {initialTemplate ? '저장' : '생성'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateEditor;
