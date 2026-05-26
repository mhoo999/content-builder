import React, { useMemo } from 'react';
import './StepBar.css';
import { validateLesson } from '../../utils/dataValidator';

/**
 * 수평 스텝바 컴포넌트
 * 준비하기 | 학습하기 | 정리하기 3단계 표시
 * 각 섹션 완료 여부 체크 표시, 클릭 시 해당 섹션으로 스크롤
 * validateLesson을 사용하여 미입력 필드가 있으면 미완료 표시
 */
const hasValue = (value) => {
  if (Array.isArray(value)) return value.some(hasValue);
  if (value && typeof value === 'object') return Object.values(value).some(hasValue);
  return String(value || '').replace(/<[^>]*>/g, '').trim().length > 0;
};

const countDone = (items) => {
  const total = items.length;
  const done = items.filter((item) => item.done).length;
  return { done, total, label: `${done}/${total}` };
};

const exercisesComplete = (exercises = []) =>
  exercises.length > 0 &&
  exercises.every((exercise) => {
    const optionsReady = exercise.type === 'multiple' ? (exercise.options || []).every(hasValue) : true;
    return hasValue(exercise.question) && hasValue(exercise.answer) && hasValue(exercise.commentary) && optionsReady;
  });

const StepBar = React.memo(({ lessonData, onSectionClick, courseType = 'general', activeSection = 'preparation' }) => {
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

  const preparationCount = courseType === 'social-work-practice'
    ? countDone([{ done: hasValue(lessonData?.practiceImage) }])
    : countDone([
        ...(lessonData?.hasOrientation ? [{ done: hasValue(lessonData.orientation?.videoUrl) && hasValue(lessonData.orientation?.subtitlePath) }] : []),
        { done: hasValue(lessonData?.terms) },
        { done: hasValue(lessonData?.learningContents) },
        { done: hasValue(lessonData?.learningObjectives) },
      ]);
  const learningCount = countDone([
    { done: hasValue(lessonData?.opinionQuestion) },
    { done: hasValue(lessonData?.lectureVideoUrl) && hasValue(lessonData?.lectureSubtitle) && hasValue(lessonData?.timestamps) },
    ...(lessonData?.hasPractice ? [{ done: hasValue(lessonData?.practiceContent) && hasValue(lessonData?.practiceVideoUrl) }] : []),
    { done: hasValue(lessonData?.professorThink) },
  ]);
  const summaryCount = countDone([
    { done: exercisesComplete(lessonData?.exercises) },
    { done: hasValue(lessonData?.summary) },
    { done: hasValue(lessonData?.instructionUrl) && hasValue(lessonData?.guideUrl) },
  ]);

  const steps = [
    {
      id: 'preparation',
      title: '준비하기',
      isComplete: isPreparationComplete(),
      count: preparationCount.label,
    },
    {
      id: 'learning',
      title: '학습하기',
      isComplete: isLearningComplete(),
      count: learningCount.label,
    },
    {
      id: 'summary',
      title: '정리하기',
      isComplete: isSummaryComplete(),
      count: summaryCount.label,
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
            className={`step-item ${step.isComplete ? 'complete' : ''} ${activeSection === step.id ? 'active' : ''}`}
            onClick={() => handleStepClick(step.id)}
            title={`${step.title}로 이동`}
          >
            <div className="step-icon">
              {step.isComplete ? '✓' : index + 1}
            </div>
            <div className="step-title">{step.title}</div>
            <span className="step-count">{step.count}</span>
          </div>
          {index < steps.length - 1 && <div className="step-divider" />}
        </React.Fragment>
      ))}
    </div>
  );
});

StepBar.displayName = 'StepBar';

export default StepBar;
