/**
 * 데이터 검증 유틸리티
 * 미입력 필드를 찾아서 콘솔에 출력
 */

/**
 * 차시 데이터 검증
 * @param {Object} lessonData 차시 데이터
 * @param {number} lessonIndex 차시 인덱스 (0부터 시작)
 * @param {string} courseType 과정 유형 ('general' | 'social-work-practice')
 * @returns {Array} 미입력 필드 목록
 */
export function validateLesson(lessonData, lessonIndex, courseType = 'general') {
  const issues = []
  const lessonNum = lessonIndex + 1

  // 준비하기
  if (courseType === 'general') {
    // 용어체크
    const terms = lessonData.terms || []
    if (terms.length === 0 || terms.every(t => !t.title || !t.content?.some(c => c?.trim()))) {
      issues.push(`${lessonNum}차시 > 준비하기 > 용어체크: 용어가 입력되지 않았습니다.`)
    } else {
      terms.forEach((term, idx) => {
        if (!term.title || !term.title.trim()) {
          issues.push(`${lessonNum}차시 > 준비하기 > 용어체크 > 용어 ${idx + 1}: 제목이 비어있습니다.`)
        }
        if (!term.content || !term.content.some(c => c && c.trim())) {
          issues.push(`${lessonNum}차시 > 준비하기 > 용어체크 > 용어 ${idx + 1}: 내용이 비어있습니다.`)
        }
      })
    }
  }

  // 학습내용
  const learningContents = (lessonData.learningContents || []).filter(
    c => !(typeof c === 'string' && c.includes("class='practice'"))
  )
  if (learningContents.length === 0 || learningContents.every(c => !c || c.trim() === '')) {
    issues.push(`${lessonNum}차시 > 준비하기 > 학습내용: 입력되지 않았습니다.`)
  }

  // 학습목표
  const learningObjectives = lessonData.learningObjectives || []
  if (learningObjectives.length === 0 || learningObjectives.every(o => !o || o.trim() === '')) {
    issues.push(`${lessonNum}차시 > 준비하기 > 학습목표: 입력되지 않았습니다.`)
  }

  // 학습하기
  // 생각묻기
  if (!lessonData.opinionQuestion || !lessonData.opinionQuestion.trim()) {
    issues.push(`${lessonNum}차시 > 학습하기 > 생각묻기: 질문이 입력되지 않았습니다.`)
  }

  // 강의영상 URL
  if (!lessonData.lectureVideoUrl || !lessonData.lectureVideoUrl.trim()) {
    issues.push(`${lessonNum}차시 > 학습하기 > 강의보기: 강의영상 URL이 입력되지 않았습니다.`)
  }

  // 교수님 의견
  if (!lessonData.professorThink || !lessonData.professorThink.trim()) {
    issues.push(`${lessonNum}차시 > 학습하기 > 점검하기: 교수님 의견이 입력되지 않았습니다.`)
  }

  // 정리하기
  if (courseType === 'general') {
    // 연습문제
    const exercises = lessonData.exercises || []
    if (exercises.length === 0 || exercises.every(e => !e.question || e.question.trim() === '')) {
      issues.push(`${lessonNum}차시 > 정리하기 > 연습문제: 문제가 입력되지 않았습니다.`)
    } else {
      exercises.forEach((ex, idx) => {
        if (!ex.question || ex.question.trim() === '') {
          issues.push(`${lessonNum}차시 > 정리하기 > 연습문제 ${idx + 1}: 문항이 비어있습니다.`)
        }
        if (!ex.answer || ex.answer.trim() === '') {
          issues.push(`${lessonNum}차시 > 정리하기 > 연습문제 ${idx + 1}: 정답이 선택되지 않았습니다.`)
        }
        if (ex.type === 'multiple' && ex.options.some(o => !o || o.trim() === '')) {
          issues.push(`${lessonNum}차시 > 정리하기 > 연습문제 ${idx + 1}: 선택지가 비어있습니다.`)
        }
      })
    }
  }

  // 학습정리
  const summary = lessonData.summary || []
  if (summary.length === 0 || summary.every(s => !s || s.trim() === '')) {
    issues.push(`${lessonNum}차시 > 정리하기 > 학습정리: 입력되지 않았습니다.`)
  }

  return issues
}

/**
 * 전체 과정 데이터 검증
 * @param {Object} courseData 과정 데이터
 * @returns {Object} { hasIssues: boolean, issues: Array, summary: string }
 */
export function validateCourseData(courseData) {
  const allIssues = []

  // 과정 기본 정보
  if (!courseData.courseCode || !courseData.courseCode.trim()) {
    allIssues.push('과목 코드가 입력되지 않았습니다.')
  }
  if (!courseData.courseName || !courseData.courseName.trim()) {
    allIssues.push('과정명이 입력되지 않았습니다.')
  }

  // 교수 정보
  if (!courseData.professor?.name || !courseData.professor.name.trim()) {
    allIssues.push('교수 정보 > 이름이 입력되지 않았습니다.')
  }

  // 각 차시 검증
  courseData.lessons.forEach((lesson, index) => {
    const lessonIssues = validateLesson(lesson, index, courseData.courseType)
    allIssues.push(...lessonIssues)
  })

  const hasIssues = allIssues.length > 0

  // 요약 메시지
  let summary = ''
  if (hasIssues) {
    summary = `❌ 검증 결과: ${allIssues.length}개의 미입력 필드가 발견되었습니다.`
  } else {
    summary = '✅ 검증 완료: 모든 필수 필드가 입력되었습니다.'
  }

  return {
    hasIssues,
    issues: allIssues,
    summary,
  }
}

/**
 * 검증 결과를 콘솔에 출력
 * @param {Object} validationResult validateCourseData의 결과
 */
export function logValidationResult(validationResult) {
  console.group('📋 데이터 검증 결과')

  if (validationResult.hasIssues) {
    console.warn(validationResult.summary)
    console.group('미입력 필드 목록:')
    validationResult.issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue}`)
    })
    console.groupEnd()
  } else {
    console.log('%c' + validationResult.summary, 'color: green; font-weight: bold;')
  }

  console.groupEnd()
}

/**
 * 검증 결과를 alert용 메시지로 포맷
 * @param {Object} validationResult validateCourseData의 결과
 * @returns {string}
 */
export function formatValidationMessage(validationResult) {
  if (!validationResult.hasIssues) {
    return validationResult.summary
  }

  const lines = [
    validationResult.summary,
    '',
    '미입력 필드:',
    ...validationResult.issues.slice(0, 10).map((issue, idx) => `${idx + 1}. ${issue}`),
  ]

  if (validationResult.issues.length > 10) {
    lines.push(`... 외 ${validationResult.issues.length - 10}개`)
  }

  lines.push('')
  lines.push('💡 자세한 내용은 브라우저 콘솔(F12)을 확인하세요.')

  return lines.join('\n')
}
