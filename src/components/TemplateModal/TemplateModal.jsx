import { useState, useEffect } from 'react';
import { TEMPLATE_PRESETS } from '../../models/templatePresets';
import { useCustomTemplates } from '../../hooks/useCustomTemplates';
import TemplateEditor from './TemplateEditor';
import TemplateImport from './TemplateImport';
import './TemplateModal.css';

const CATEGORY_NAMES = {
  standard: "표준형 (4섹션)",
  short: "단기특강/퀴즈형",
  hrd: "HRD직무형",
  legal: "법정의무형",
  custom: "내 템플릿"
};

function TemplateModal({ onClose, activePreset, activeTheme, onApply }) {
  const [selectedCategory, setSelectedCategory] = useState('standard');
  const [selectedPreset, setSelectedPreset] = useState(activePreset);
  const [selectedTheme, setSelectedTheme] = useState(activeTheme);
  const [showEditor, setShowEditor] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const {
    templates: customTemplates,
    addTemplate,
    editTemplate,
    removeTemplate,
    importTemplate,
    exportTemplate,
  } = useCustomTemplates();

  // 현재 프리셋이 속한 카테고리로 탭 초기화
  useEffect(() => {
    if (TEMPLATE_PRESETS[activePreset]) {
      setSelectedCategory(TEMPLATE_PRESETS[activePreset].category);
      setSelectedPreset(activePreset);
      setSelectedTheme(activeTheme);
    } else {
      // 커스텀 템플릿인 경우
      const customTemplate = customTemplates.find(t => t.id === activePreset);
      if (customTemplate) {
        setSelectedCategory('custom');
        setSelectedPreset(activePreset);
        setSelectedTheme(activeTheme || 'default');
      }
    }
  }, [activePreset, activeTheme, customTemplates]);

  // 카테고리별 프리셋 필터링
  const presetsInCategory =
    selectedCategory === 'custom'
      ? customTemplates
      : Object.values(TEMPLATE_PRESETS).filter((p) => p.category === selectedCategory);

  // 현재 선택된 프리셋 객체
  const currentPresetObj =
    TEMPLATE_PRESETS[selectedPreset] || customTemplates.find((t) => t.id === selectedPreset);

  const handleApply = () => {
    onApply(selectedPreset, selectedTheme);
    onClose();
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    // 프리셋이 바뀌면 해당 프리셋의 첫 번째 테마로 자동 선택
    const presetObj = TEMPLATE_PRESETS[presetId] || customTemplates.find((t) => t.id === presetId);
    if (presetObj && presetObj.themes && presetObj.themes.length > 0) {
      setSelectedTheme(presetObj.themes[0].id);
    }
  };

  const handleSaveTemplate = (template, templateId) => {
    if (templateId) {
      // 편집 모드
      const result = editTemplate(templateId, template);
      if (result.success) {
        alert('템플릿이 수정되었습니다.');
      } else {
        alert(`수정 실패: ${result.error}`);
      }
    } else {
      // 생성 모드
      const result = addTemplate(template);
      if (result.success) {
        alert('새 템플릿이 생성되었습니다.');
      } else {
        alert(`생성 실패: ${result.error}`);
      }
    }
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const handleImportTemplate = (jsonData) => {
    const result = importTemplate(jsonData);
    if (result.success) {
      alert('템플릿을 가져왔습니다.');
    } else {
      alert(`가져오기 실패: ${result.error}`);
    }
    setShowImport(false);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('이 템플릿을 삭제하시겠습니까?')) {
      const result = removeTemplate(templateId);
      if (result.success) {
        alert('템플릿이 삭제되었습니다.');
        // 삭제한 템플릿이 현재 선택된 템플릿이면 첫 번째 커스텀 템플릿으로 변경
        if (selectedPreset === templateId && customTemplates.length > 1) {
          const remaining = customTemplates.filter((t) => t.id !== templateId);
          if (remaining.length > 0) {
            handlePresetSelect(remaining[0].id);
          }
        }
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleExportTemplate = (templateId) => {
    const result = exportTemplate(templateId);
    if (result.success) {
      // JSON 파일로 다운로드
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${templateId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(`내보내기 실패: ${result.error}`);
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
            {selectedCategory === 'custom' && (
              <div className="custom-template-actions">
                <button className="action-btn create-btn" onClick={() => setShowEditor(true)}>
                  + 새 템플릿
                </button>
                <button className="action-btn import-btn" onClick={() => setShowImport(true)}>
                  가져오기
                </button>
              </div>
            )}

            {selectedCategory === 'custom' && customTemplates.length === 0 ? (
              <div className="empty-custom-templates">
                <p>아직 커스텀 템플릿이 없습니다.</p>
                <p className="empty-hint">새 템플릿을 만들거나 JSON 파일을 가져와보세요.</p>
              </div>
            ) : (
              <div className="preset-grid">
                {presetsInCategory.map((preset) => (
                  <div
                    key={preset.id}
                    className={`preset-card ${selectedPreset === preset.id ? 'active' : ''} ${
                      preset.isCustom ? 'custom' : ''
                    }`}
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    <div className="preset-thumbnail-placeholder">
                      {!preset.isCustom && (
                        <img
                          key={`${preset.id}-${
                            selectedPreset === preset.id ? selectedTheme : preset.themes[0].id
                          }`}
                          src={`/templates/${preset.id}-${
                            selectedPreset === preset.id ? selectedTheme : preset.themes[0].id
                          }.png`}
                          alt={`${preset.name} 썸네일`}
                          className="preset-thumbnail-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          onLoad={(e) => {
                            e.target.style.display = 'block';
                          }}
                        />
                      )}
                      <div className="fallback-placeholder">
                        {preset.isCustom ? '커스텀 템플릿' : '미리보기 준비중'}
                      </div>
                      <span className="preset-section-badge">{preset.sections.length}섹션</span>
                    </div>
                    <div className="preset-info">
                      <div className="preset-sections-list">
                        {preset.sections.map((sec, i) => (
                          <span key={i} className="sec-item">
                            {sec}
                          </span>
                        ))}
                      </div>
                      <h3>{preset.name}</h3>
                      <p>{preset.description || '설명 없음'}</p>
                    </div>
                    <div className="card-theme-options">
                      {preset.themes.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          className={`card-theme-btn ${
                            selectedPreset === preset.id && selectedTheme === theme.id ? 'selected' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPreset(preset.id);
                            setSelectedTheme(theme.id);
                          }}
                        >
                          {theme.name.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                    {preset.isCustom && (
                      <div className="custom-template-buttons">
                        <button
                          className="edit-template-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(preset);
                          }}
                          title="편집"
                        >
                          편집
                        </button>
                        <button
                          className="export-template-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportTemplate(preset.id);
                          }}
                          title="내보내기"
                        >
                          내보내기
                        </button>
                        <button
                          className="delete-template-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(preset.id);
                          }}
                          title="삭제"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 하단 테마 선택 영역은 카드 내부로 이동됨 */}
          </div>
        </div>

        <div className="template-modal-footer">
          <div className="selected-summary">
            선택됨: <strong>{currentPresetObj?.name}</strong> +{' '}
            <strong>{currentPresetObj?.themes.find((t) => t.id === selectedTheme)?.name || selectedTheme}</strong>
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button className="create-btn" onClick={handleApply}>
              적용하기
            </button>
          </div>
        </div>
      </div>

      {showEditor && (
        <TemplateEditor
          onClose={() => {
            setShowEditor(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveTemplate}
          initialTemplate={editingTemplate}
        />
      )}

      {showImport && <TemplateImport onClose={() => setShowImport(false)} onImport={handleImportTemplate} />}
    </div>
  );
}

export default TemplateModal;
