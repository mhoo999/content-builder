import React, { useMemo } from 'react';
import './StepBar.css';
import { validateLesson } from '../../utils/dataValidator';

/**
 * 수평 스텝바 컴포넌트
 * 준비하기 | 학습하기 | 정리하기 3단계 표시
 * 각 섹션 완료 여부 체크 표시, 클릭 시 해당 섹션으로 스크롤
 * validateLesson을 사용하여 미입력 필드가 있으면 미완료 표시
 */
const StepBar = React.memo(({ lessonData, onSectionClick, courseType = 'general' }) => {
  // validateLesson 결과를 메모이제이션
  const validationIssues = useMemo(() => {
    if (!lessonData) return [];
    return validateLesson(lessonData, 0, courseType);
  }, [lessonData, courseType]);

  // 섹션 완료 여부 판단 (validateLesson 결과 기반)
  const isPreparationComplete = () => {
    if (!lessonData) return false;
    // 준비하기 관련 이슈가 없으면 완료
    return !validationIssues.some(issue => issue.includes('준비하기'));
  };

  const isLearningComplete = () => {
    if (!lessonData) return false;
    // 학습하기 관련 이슈가 없으면 완료
    return !validationIssues.some(issue => issue.includes('학습하기'));
  };

  const isSummaryComplete = () => {
    if (!lessonData) return false;
    // 정리하기 관련 이슈가 없으면 완료
    return !validationIssues.some(issue => issue.includes('정리하기'));
  };

  const steps = [
    {
      id: 'preparation',
      title: '준비하기',
      isComplete: isPreparationComplete(),
    },
    {
      id: 'learning',
      title: '학습하기',
      isComplete: isLearningComplete(),
    },
    {
      id: 'summary',
      title: '정리하기',
      isComplete: isSummaryComplete(),
    },
  ];

  const handleStepClick = (stepId) => {
    if (onSectionClick) {
      onSectionClick(stepId);
    }
  };

  return (
    <div className="step-bar">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div
            className={`step-item ${step.isComplete ? 'complete' : ''}`}
            onClick={() => handleStepClick(step.id)}
            title={`${step.title}로 이동`}
          >
            <div className="step-icon">
              {step.isComplete ? '✓' : index + 1}
            </div>
            <div className="step-title">{step.title}</div>
          </div>
          {index < steps.length - 1 && <div className="step-divider" />}
        </React.Fragment>
      ))}
    </div>
  );
});

StepBar.displayName = 'StepBar';

export default StepBar;
