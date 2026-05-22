import React from 'react';
import './StepBar.css';

/**
 * 수평 스텝바 컴포넌트
 * 준비하기 | 학습하기 | 정리하기 3단계 표시
 * 각 섹션 완료 여부 체크 표시, 클릭 시 해당 섹션으로 스크롤
 */
const StepBar = React.memo(({ lessonData, onSectionClick }) => {
  // 섹션 완료 여부 판단
  const isPreparationComplete = () => {
    if (!lessonData) return false;

    // 용어(terms) 중 제목과 내용이 입력된 항목이 1개 이상
    const terms = lessonData.terms || [];
    const hasValidTerms = terms.some(term =>
      term.title && term.title.trim() !== '' &&
      term.content && term.content.length > 0 &&
      term.content.some(c => c && c.trim() !== '')
    );

    return hasValidTerms;
  };

  const isLearningComplete = () => {
    if (!lessonData) return false;

    // 강의영상 URL 입력
    return lessonData.lectureVideoUrl && lessonData.lectureVideoUrl.trim() !== '';
  };

  const isSummaryComplete = () => {
    if (!lessonData) return false;

    // 연습문제(exercises) 중 question이 입력된 항목 또는 학습정리(summary) 중 내용이 입력된 항목이 1개 이상
    const exercises = lessonData.exercises || [];
    const summary = lessonData.summary || [];

    const hasValidExercise = exercises.some(ex => ex.question && ex.question.trim() !== '');
    const hasValidSummary = summary.some(s => s && s.trim() !== '');

    return hasValidExercise || hasValidSummary;
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
