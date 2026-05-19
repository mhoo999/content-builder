import { useState, useEffect } from 'react';
import { TEMPLATE_PRESETS } from '../../models/templatePresets';
import './TemplateModal.css';

const CATEGORY_NAMES = {
  standard: "표준형 (4섹션)",
  short: "단기특강/퀴즈형",
  hrd: "HRD직무형",
  legal: "법정의무형"
};

function TemplateModal({ onClose, activePreset, activeTheme, onApply }) {
  const [selectedCategory, setSelectedCategory] = useState('standard');
  const [selectedPreset, setSelectedPreset] = useState(activePreset);
  const [selectedTheme, setSelectedTheme] = useState(activeTheme);

  // 현재 프리셋이 속한 카테고리로 탭 초기화
  useEffect(() => {
    if (TEMPLATE_PRESETS[activePreset]) {
      setSelectedCategory(TEMPLATE_PRESETS[activePreset].category);
      setSelectedPreset(activePreset);
      setSelectedTheme(activeTheme);
    }
  }, [activePreset, activeTheme]);

  // 카테고리별 프리셋 필터링
  const presetsInCategory = Object.values(TEMPLATE_PRESETS).filter(p => p.category === selectedCategory);
  
  // 현재 선택된 프리셋 객체
  const currentPresetObj = TEMPLATE_PRESETS[selectedPreset];

  const handleApply = () => {
    onApply(selectedPreset, selectedTheme);
    onClose();
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    // 프리셋이 바뀌면 해당 프리셋의 첫 번째 테마로 자동 선택
    const presetObj = TEMPLATE_PRESETS[presetId];
    if (presetObj && presetObj.themes && presetObj.themes.length > 0) {
      setSelectedTheme(presetObj.themes[0].id);
    }
  };

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-header">
          <h2>템플릿 레이아웃 & 디자인 선택</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="template-modal-body">
          {/* 좌측: 카테고리 탭 */}
          <div className="template-sidebar">
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
              <button 
                key={key} 
                className={`category-tab ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
              >
                {name}
              </button>
            ))}
          </div>

          {/* 우측: 프리셋 리스트 및 테마 선택 */}
          <div className="template-content">
            <div className="preset-grid">
              {presetsInCategory.map(preset => (
                <div 
                  key={preset.id} 
                  className={`preset-card ${selectedPreset === preset.id ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(preset.id)}
                >
                  <div className="preset-thumbnail-placeholder">
                    <span className="preset-section-badge">{preset.sections.length}섹션</span>
                    <div className="preset-sections-list">
                      {preset.sections.map((sec, i) => (
                        <span key={i} className="sec-item">{sec}</span>
                      ))}
                    </div>
                  </div>
                  <div className="preset-info">
                    <h3>{preset.name}</h3>
                    <p>{preset.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 하단: 선택된 템플릿의 디자인 테마 선택 */}
            {currentPresetObj && (
              <div className="theme-selection-area">
                <h4>🎨 디자인 테마 선택</h4>
                <div className="theme-options">
                  {currentPresetObj.themes.map(theme => (
                    <label key={theme.id} className={`theme-radio-label ${selectedTheme === theme.id ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="theme" 
                        value={theme.id} 
                        checked={selectedTheme === theme.id}
                        onChange={() => setSelectedTheme(theme.id)}
                      />
                      {theme.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="template-modal-footer">
          <div className="selected-summary">
            선택됨: <strong>{currentPresetObj?.name}</strong> + <strong>{currentPresetObj?.themes.find(t => t.id === selectedTheme)?.name || selectedTheme}</strong>
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>취소</button>
            <button className="create-btn" onClick={handleApply}>적용하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateModal;
