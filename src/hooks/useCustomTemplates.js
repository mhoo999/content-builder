import { useState, useEffect, useCallback } from 'react';
import {
  getCustomTemplates,
  saveCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  importCustomTemplate,
  exportCustomTemplate,
  getCustomTemplateById,
} from '../models/customTemplates';

export const useCustomTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // 템플릿 목록 로드
  const loadTemplates = useCallback(() => {
    setLoading(true);
    try {
      const customTemplates = getCustomTemplates();
      setTemplates(customTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 템플릿 로드
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // 템플릿 추가
  const addTemplate = useCallback(
    (template) => {
      const result = saveCustomTemplate(template);
      if (result.success) {
        loadTemplates();
      }
      return result;
    },
    [loadTemplates]
  );

  // 템플릿 수정
  const editTemplate = useCallback(
    (id, updates) => {
      const result = updateCustomTemplate(id, updates);
      if (result.success) {
        loadTemplates();
      }
      return result;
    },
    [loadTemplates]
  );

  // 템플릿 삭제
  const removeTemplate = useCallback(
    (id) => {
      const result = deleteCustomTemplate(id);
      if (result.success) {
        loadTemplates();
      }
      return result;
    },
    [loadTemplates]
  );

  // 템플릿 가져오기
  const importTemplate = useCallback(
    (jsonData) => {
      const result = importCustomTemplate(jsonData);
      if (result.success) {
        loadTemplates();
      }
      return result;
    },
    [loadTemplates]
  );

  // 템플릿 내보내기
  const exportTemplate = useCallback((id) => {
    return exportCustomTemplate(id);
  }, []);

  // ID로 템플릿 조회
  const getTemplateById = useCallback((id) => {
    return getCustomTemplateById(id);
  }, []);

  return {
    templates,
    loading,
    addTemplate,
    editTemplate,
    removeTemplate,
    importTemplate,
    exportTemplate,
    getTemplateById,
    refresh: loadTemplates,
  };
};
