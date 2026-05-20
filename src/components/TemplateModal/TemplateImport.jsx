import { useState } from 'react';
import './TemplateImport.css';

function TemplateImport({ onClose, onImport }) {
  const [jsonInput, setJsonInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setError('JSON 파일만 업로드할 수 있습니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonInput(event.target.result);
        setError('');
      };
      reader.onerror = () => {
        setError('파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setError('JSON 파일만 업로드할 수 있습니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonInput(event.target.result);
        setError('');
      };
      reader.onerror = () => {
        setError('파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (!jsonInput.trim()) {
      setError('JSON 데이터를 입력해주세요.');
      return;
    }

    try {
      const template = JSON.parse(jsonInput);

      // 기본 유효성 검증
      if (!template.name) {
        setError('템플릿 이름(name)이 필요합니다.');
        return;
      }

      if (!Array.isArray(template.sections) || template.sections.length === 0) {
        setError('최소 하나 이상의 섹션(sections)이 필요합니다.');
        return;
      }

      if (!template.features || typeof template.features !== 'object') {
        setError('기능 정보(features)가 필요합니다.');
        return;
      }

      onImport(template);
      onClose();
    } catch (err) {
      setError('유효하지 않은 JSON 형식입니다.');
    }
  };

  const handlePasteExample = () => {
    const example = {
      name: "예제 템플릿",
      description: "JSON 가져오기 예제 템플릿입니다.",
      sections: ["인트로", "준비하기", "학습하기", "정리하기"],
      features: {
        hasIntro: true,
        hasOrientation: true,
        hasTerm: true,
        hasObjectives: true,
        hasOpinion: false,
        hasLecture: true,
        hasPractice: false,
        hasCheck: true,
        hasExercise: true,
        hasTheorem: true,
        hasNext: true
      }
    };

    setJsonInput(JSON.stringify(example, null, 2));
    setError('');
  };

  return (
    <div className="template-import-overlay" onClick={onClose}>
      <div className="template-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-import-header">
          <h2>템플릿 가져오기</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="template-import-body">
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="drop-zone-text">
                JSON 파일을 드래그 앤 드롭하거나
              </p>
              <label className="file-select-btn">
                파일 선택
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="divider">
            <span>또는</span>
          </div>

          <div className="json-input-section">
            <div className="json-input-header">
              <label>JSON 직접 입력</label>
              <button className="example-btn" onClick={handlePasteExample}>
                예제 붙여넣기
              </button>
            </div>
            <textarea
              className="json-textarea"
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError('');
              }}
              placeholder='{\n  "name": "내 템플릿",\n  "description": "설명",\n  "sections": ["인트로", "학습하기"],\n  "features": {\n    "hasLecture": true\n  }\n}'
              rows={12}
            />
          </div>

          {error && (
            <div className="import-error">
              {error}
            </div>
          )}

          <div className="import-info">
            <strong>필수 필드:</strong> name (템플릿 이름), sections (섹션 배열), features (기능 객체)
          </div>
        </div>

        <div className="template-import-footer">
          <button className="cancel-btn" onClick={onClose}>취소</button>
          <button className="import-btn" onClick={handleImport}>가져오기</button>
        </div>
      </div>
    </div>
  );
}

export default TemplateImport;
