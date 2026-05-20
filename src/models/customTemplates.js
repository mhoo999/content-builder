const STORAGE_KEY = 'content-builder-templates';

// 커스텀 템플릿 기본 구조
const createTemplateStructure = (name, description, sections, features) => ({
  id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name,
  category: 'custom',
  description,
  themes: [{ id: 'default', name: '기본형' }],
  sections,
  features,
  isCustom: true,
  createdAt: new Date().toISOString(),
});

// localStorage에서 커스텀 템플릿 목록 가져오기
export const getCustomTemplates = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load custom templates:', error);
    return [];
  }
};

// 커스텀 템플릿 저장
export const saveCustomTemplate = (template) => {
  try {
    const templates = getCustomTemplates();

    // 템플릿 구조 생성
    const newTemplate = createTemplateStructure(
      template.name,
      template.description || '',
      template.sections || [],
      template.features || {}
    );

    templates.push(newTemplate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

    return { success: true, template: newTemplate };
  } catch (error) {
    console.error('Failed to save custom template:', error);
    return { success: false, error: error.message };
  }
};

// 커스텀 템플릿 업데이트
export const updateCustomTemplate = (id, updates) => {
  try {
    const templates = getCustomTemplates();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) {
      return { success: false, error: 'Template not found' };
    }

    templates[index] = {
      ...templates[index],
      ...updates,
      id: templates[index].id, // ID는 변경 불가
      isCustom: true, // isCustom은 항상 true
      category: 'custom', // category는 항상 custom
      themes: [{ id: 'default', name: '기본형' }], // themes는 고정
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

    return { success: true, template: templates[index] };
  } catch (error) {
    console.error('Failed to update custom template:', error);
    return { success: false, error: error.message };
  }
};

// 커스텀 템플릿 삭제
export const deleteCustomTemplate = (id) => {
  try {
    const templates = getCustomTemplates();
    const filtered = templates.filter(t => t.id !== id);

    if (filtered.length === templates.length) {
      return { success: false, error: 'Template not found' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    return { success: true };
  } catch (error) {
    console.error('Failed to delete custom template:', error);
    return { success: false, error: error.message };
  }
};

// JSON에서 커스텀 템플릿 가져오기
export const importCustomTemplate = (jsonData) => {
  try {
    const template = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    // 유효성 검증
    if (!template.name || typeof template.name !== 'string') {
      return { success: false, error: 'Template name is required' };
    }

    if (!Array.isArray(template.sections) || template.sections.length === 0) {
      return { success: false, error: 'At least one section is required' };
    }

    if (!template.features || typeof template.features !== 'object') {
      return { success: false, error: 'Template features are required' };
    }

    // 템플릿 저장
    return saveCustomTemplate({
      name: template.name,
      description: template.description || '',
      sections: template.sections,
      features: template.features,
    });
  } catch (error) {
    console.error('Failed to import custom template:', error);
    return { success: false, error: 'Invalid JSON format' };
  }
};

// 커스텀 템플릿을 JSON으로 내보내기
export const exportCustomTemplate = (id) => {
  try {
    const templates = getCustomTemplates();
    const template = templates.find(t => t.id === id);

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // 내보내기용 템플릿 (불필요한 메타데이터 제거)
    const exportData = {
      name: template.name,
      description: template.description,
      sections: template.sections,
      features: template.features,
    };

    return { success: true, data: JSON.stringify(exportData, null, 2) };
  } catch (error) {
    console.error('Failed to export custom template:', error);
    return { success: false, error: error.message };
  }
};

// ID로 커스텀 템플릿 조회
export const getCustomTemplateById = (id) => {
  const templates = getCustomTemplates();
  return templates.find(t => t.id === id);
};
