/**
 * Subjects 폴더 구조 파싱 유틸리티
 * subjects/{code}/{lesson}/assets/data/data.json 구조를 파싱하여
 * Builder 데이터 형식으로 변환
 */

/**
 * HTML 문자열에서 상대경로 이미지에 data-original-src 속성 추가 및 임시 base64 변환
 * (표시용으로 base64 사용, export 시 상대경로로 변환)
 * 배열인 경우 각 항목에 대해 처리
 * + ol 태그를 H3로 변환 (Import 시)
 */
export const markRelativeImages = (html, importedImages = {}) => {
  if (!html) return html

  // 배열인 경우 각 항목에 대해 재귀적으로 처리
  if (Array.isArray(html)) {
    return html.map((item) => markRelativeImages(item, importedImages))
  }

  // 문자열이 아닌 경우 그대로 반환
  if (typeof html !== "string") {
    return html
  }

  // ol 태그를 H3로 변환 (Import 시)
  // <ol style='color:#000;margin-bottom: 4px;'>1) 제목</ol> → <h3>1) 제목</h3>
  html = html.replace(
    /<ol\s+style=['"]color:#000;margin-bottom:\s*4px;['"]>(.*?)<\/ol>/gi,
    "<h3>$1</h3>",
  )

  // ../images/filename.png 또는 images/filename.png 패턴 찾기
  // 더 유연한 패턴: ../images/ 또는 images/로 시작하는 경로
  const pattern = /<img\s+([^>]*)src=["']([^"']*images\/[^"']+)["']([^>]*)>/gi

  return html.replace(pattern, (match, before, fullPath, after) => {
    // 이미 data-original-src가 있으면 base64로 변환만 시도
    if (match.includes("data-original-src")) {
      const originalSrcMatch = match.match(/data-original-src=["']([^"']+)["']/)
      if (originalSrcMatch) {
        const originalSrc = originalSrcMatch[1]
        // importedImages는 이미 base64로 변환된 데이터
        const base64 = importedImages[originalSrc]
        if (base64) {
          return match.replace(/src=["'][^"']+["']/, `src="${base64}"`)
        }
      }
      return match
    }

    // 경로 정규화: images/로 시작하면 ../images/로 변환
    let normalizedPath = fullPath
    if (normalizedPath.startsWith("images/")) {
      normalizedPath = "../" + normalizedPath
    } else if (!normalizedPath.startsWith("../images/")) {
      // ../images/로 시작하지 않으면 그대로 유지 (다른 형식일 수 있음)
    }

    // importedImages에서 base64 찾기 (정규화된 경로와 원본 경로 모두 시도)
    let base64 = importedImages[normalizedPath] || importedImages[fullPath]

    if (base64) {
      // base64로 표시하되 data-original-src에 원본 경로 저장
      return `<img ${before}src="${base64}" data-original-src="${normalizedPath}"${after}>`
    } else {
      // base64가 없으면 경로만 유지하고 data-original-src 속성 추가
      return `<img ${before}src="${normalizedPath}" data-original-src="${normalizedPath}"${after}>`
    }
  })
}

/**
 * 페이지 배열에서 특정 컴포넌트 타입의 페이지 찾기
 */
const findPageByComponent = (pages, componentType) => {
  return pages.find((page) => page.component === componentType)
}

/**
 * 페이지 배열에서 특정 컴포넌트 타입의 모든 페이지 찾기
 */
const findAllPagesByComponent = (pages, componentType) => {
  return pages.filter((page) => page.component === componentType)
}

/**
 * data.json 파일을 Builder 형식으로 변환
 */
export const convertDataJsonToBuilderFormat = (dataJson, lessonNumber) => {
  // 현장실습 주차 감지 (이미지만 있는 경우)
  if (dataJson.image && !dataJson.pages) {
    return {
      isPracticeWeek: true,
      practiceImage: dataJson.image,
      lessonNumber: lessonNumber,
      weekNumber: Math.ceil(lessonNumber / 2),
      weekTitle: "",
      lessonTitle: "",
      sectionInWeek: 1,
    }
  }

  const pages = dataJson.pages || []

  // 오리엔테이션 확인 (1주1차시만 가능)
  const orientationPage = findPageByComponent(pages, "orientation")
  const hasOrientation = !!orientationPage

  // 용어체크 파싱
  const termPage = findPageByComponent(pages, "term")
  const terms = termPage?.data?.map((term) => {
    // title의 <br /> 또는 <br> 태그를 줄바꿈(\n)으로 변환
    let title = term.title || ""
    // HTML 엔티티 디코딩 (&lt; → <, &gt; → >, &amp; → &, &quot; → ", &#39; → ')
    title = title
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim()

    // content 처리: 배열인 경우 불릿(•) 제거 후 배열로 유지
    let content = []
    if (Array.isArray(term.content)) {
      content = term.content
        .map((item) => {
          // 불릿(•) 제거
          if (typeof item === "string") {
            return item.replace(/^•\s*/, "").trim()
          }
          return item
        })
        .filter((item) => item) // 빈 항목 제거
    } else if (term.content) {
      // 문자열인 경우 (기존 형식 호환) 불릿 제거 후 배열로 변환
      const cleaned = term.content.replace(/^•\s*/, "").trim()
      content = cleaned ? [cleaned] : [""]
    } else {
      content = [""]
    }

    return {
      title: title,
      content: content.length > 0 ? content : [""],
    }
  }) || [{ title: "", content: [""] }]

  // 학습목표 파싱
  const objectivesPage = findPageByComponent(pages, "objectives")
  const learningContentsRaw = objectivesPage?.data?.[0]?.contents || ["", "", ""]
  const learningObjectivesRaw = objectivesPage?.data?.[1]?.contents || ["", "", ""]

  // HTML 엔티티 디코딩 및 넘버링 제거 헬퍼 함수 (HTML 태그는 유지)
  const cleanText = (text) => {
    if (typeof text !== "string") return text
    let cleaned = text
    // HTML 엔티티 디코딩
    cleaned = cleaned
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    // 넘버링 제거 (예: "1. 내용" -> "내용")
    // HTML 태그가 포함된 경우에도 넘버링만 제거
    cleaned = cleaned.replace(/^\d+\.\s*/, "").trim()
    return cleaned
  }

  // 넘버링 제거 (HTML 태그는 유지하여 에디터로 표시)
  let learningContents = learningContentsRaw.map(cleanText)
  const learningObjectives = learningObjectivesRaw.map(cleanText)

  // 생각묻기 & 점검하기 파싱
  const opinionPage = findPageByComponent(pages, "opinion")
  const checkPage = findPageByComponent(pages, "check")
  const opinionQuestion = opinionPage?.data?.title || ""
  const professorThink = checkPage?.data?.think || ""

  // 강의보기 파싱
  const lecturePage = findPageByComponent(pages, "lecture")
  const lectureVideoUrl = lecturePage?.media || ""
  const lectureSubtitle = lecturePage?.caption?.[0]?.src || ""
  const timestamps = lecturePage?.data?.map((item) => item.time || "") || ["0:00:04", "0:00:00"]

  // 실습 파싱
  const practicePage = findPageByComponent(pages, "practice")
  const hasPractice = !!practicePage
  const practiceVideoUrl = practicePage?.media || ""
  const practiceSubtitle = practicePage?.caption?.[0]?.src || ""
  const practiceTimestamps = practicePage?.data?.map((item) => item.time || "") || ["0:00:04", "0:00:00"]

  // 실습 내용 추출 (학습내용에서 실습 항목 찾기)
  let practiceContent = ""
  // 학습내용에서 실습 항목 찾기 (기존 데이터에서 import)
  // class='practice' 또는 class="practice" 모두 감지
  const practiceContentInLearning = learningContents.find(
    (content) =>
      typeof content === "string" && (content.includes("class='practice'") || content.includes('class="practice"')),
  )

  if (practiceContentInLearning) {
    // 학습내용에서 실습 항목을 찾았으면 practiceContent로 설정
    // <div class='practice'> 형식을 <ul class='practice'> 형식으로 변환 (에디터 호환)
    if (practiceContentInLearning.includes("<div class='practice'>")) {
      // <div class='practice'><ul>...</ul></div> → <ul class='practice'>...</ul>
      practiceContent = practiceContentInLearning
        .replace(/<div class=['"]practice['"]>\s*<ul>/gi, "<ul class='practice'>")
        .replace(/<\/ul>\s*<\/div>/gi, "</ul>")
    } else if (practiceContentInLearning.includes('<div class="practice">')) {
      practiceContent = practiceContentInLearning
        .replace(/<div class=['"]practice['"]>\s*<ul>/gi, "<ul class='practice'>")
        .replace(/<\/ul>\s*<\/div>/gi, "</ul>")
    } else {
      // 이미 <ul class='practice'> 형식이면 그대로 사용
      practiceContent = practiceContentInLearning
    }
  } else if (hasPractice) {
    // 실습 페이지는 있지만 학습내용에 실습 항목이 없으면 기본값 설정
    practiceContent = "<ul class='practice'><li></li></ul>"
  }

  // 학습내용에서 실습 항목 제거 (기존 데이터 마이그레이션)
  // class='practice' 또는 class="practice" 모두 제거
  learningContents = learningContents.filter(
    (content) =>
      !(typeof content === "string" && (content.includes("class='practice'") || content.includes('class="practice"'))),
  )

  // 연습문제 파싱
  const exercisePage = findPageByComponent(pages, "exercise")
  const exercisesData = exercisePage?.data || []
  const exercises = exercisesData.map((ex) => {
    if (ex.type === "boolean") {
      return {
        type: "boolean",
        question: ex.subject || "",
        answer: ex.answer || "2",
        options: [],
        commentary: ex.commentary || "",
      }
    } else if (ex.type === "multiple") {
      return {
        type: "multiple",
        question: ex.subject || "",
        answer: ex.answer || "1",
        options: ex.value || ["", "", "", ""],
        commentary: ex.commentary || "",
      }
    }
    return {
      type: "boolean",
      question: "",
      answer: "2",
      options: [],
      commentary: "",
    }
  })

  // 최소 1개의 연습문제 보장
  if (exercises.length === 0) {
    exercises.push({
      type: "boolean",
      question: "",
      answer: "2",
      options: [],
      commentary: "",
    })
  }

  // 학습정리 파싱
  const theoremPage = findPageByComponent(pages, "theorem")
  const summaryRaw = theoremPage?.data?.theorem || ["", "", ""]
  // HTML 엔티티 디코딩 (RichTextEditor용이므로 HTML 태그는 유지)
  const summary = summaryRaw.map((item) => {
    if (typeof item !== "string") return item
    return item
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  })

  // 주차 및 주차 내 순서 추출
  const weekNumber = dataJson.index || Math.ceil(lessonNumber / 2)
  const sectionInWeek = dataJson.section || ((lessonNumber - 1) % 2) + 1

  return {
    weekNumber: weekNumber,
    lessonNumber: lessonNumber,
    lessonTitle: "", // subjects.json에서 가져와야 함
    sectionInWeek: sectionInWeek,

    hasOrientation: hasOrientation,
    orientation: hasOrientation
      ? {
          videoUrl: orientationPage?.media || "",
          subtitlePath: orientationPage?.caption?.[0]?.src || "",
        }
      : {
          videoUrl: "",
          subtitlePath: "",
        },

    terms: terms,
    learningContents: learningContents,
    learningObjectives: learningObjectives,

    opinionQuestion: opinionQuestion,
    professorThink: professorThink,

    lectureVideoUrl: lectureVideoUrl,
    lectureSubtitle: lectureSubtitle,
    timestamps: timestamps.length > 0 ? timestamps : ["0:00:04", "0:00:00"],

    hasPractice: hasPractice,
    practiceContent: practiceContent,
    practiceVideoUrl: practiceVideoUrl,
    practiceSubtitle: practiceSubtitle,
    practiceTimestamps: practiceTimestamps.length > 0 ? practiceTimestamps : ["0:00:04", "0:00:00"],

    exercises: exercises,
    summary: summary,

    instructionUrl: dataJson.instruction || "",
    guideUrl: dataJson.guide || "",
  }
}

/**
 * subjects.json 파일 파싱하여 주차별 차시 정보 추출
 * subjects.json 구조: { "subjects": [{ "title": "...", "lists": ["<span>1차</span> 제목", ...] }] }
 *
 * @param {Object} subjectsJson - subjects.json 데이터
 * @param {number} startLessonNumber - 시작 차시 번호 (기본값: 1)
 */
export const parseSubjectsJson = (subjectsJson, startLessonNumber = 1) => {
  const lessonTitles = {}
  const weekTitles = {} // 주차별 타이틀
  let lessonCounter = startLessonNumber

  // subjects 배열 파싱
  const subjects = subjectsJson.subjects || []

  subjects.forEach((subject) => {
    // 주차 번호 추출: "<span>9주</span> 암호 프로토콜..." -> 9
    const weekNumberMatch = subject.title?.match(/<span[^>]*>(\d+)주<\/span>/)
    const weekNumber = weekNumberMatch ? parseInt(weekNumberMatch[1], 10) : null

    // 주차 타이틀 추출: "<span>1주</span> 컴퓨터통신, 인터넷, 웹" -> "컴퓨터통신, 인터넷, 웹"
    let weekTitle = subject.title || ""
    if (typeof weekTitle === "string") {
      // <span>...</span> 태그 제거
      weekTitle = weekTitle.replace(/<span[^>]*>.*?<\/span>\s*/g, "").trim()
      // 다른 HTML 태그도 제거
      weekTitle = weekTitle.replace(/<[^>]+>/g, "").trim()
    }

    // 주차 타이틀 저장 (주차 번호를 키로 사용)
    if (weekTitle && weekNumber) {
      weekTitles[weekNumber] = weekTitle
    }

    const lists = subject.lists || []

    lists.forEach((listItem) => {
      // HTML 태그 제거: "<span>1차</span> 제목" -> "제목"
      // 또는 단순 문자열인 경우 그대로 사용
      let title = listItem

      if (typeof listItem === "string") {
        // <span>...</span> 태그 제거
        title = listItem.replace(/<span[^>]*>.*?<\/span>\s*/g, "").trim()
        // 다른 HTML 태그도 제거
        title = title.replace(/<[^>]+>/g, "").trim()
      }

      if (title) {
        lessonTitles[lessonCounter] = title
        lessonCounter++
      }
    })
  })

  return { lessonTitles, weekTitles }
}

/**
 * 교수 정보 파싱 (intro 페이지에서 추출)
 */
export const parseProfessorInfo = (dataJson) => {
  const pages = dataJson.pages || []
  const introPage = findPageByComponent(pages, "intro")

  if (!introPage || !introPage.data || !introPage.data.professor) {
    return {
      name: "",
      photo: "",
      education: [""],
      career: [""],
    }
  }

  const prof = introPage.data.professor
  const profile = prof.profile || []

  const educationItem = profile.find((item) => item.title && item.title.includes("학"))
  const careerItem = profile.find((item) => item.title && item.title.includes("경"))

  // 경력 변환: ['<b>연도</b><br />내용'] → [{ period: '연도', startDate: '', endDate: '', description: '내용' }]
  const careerContent = careerItem?.content || []

  // period 문자열을 파싱하여 startDate와 endDate 추출하는 헬퍼 함수
  const parsePeriodToDates = (period) => {
    if (!period) return { startDate: "", endDate: "" }

    // "YYYY년 MM월 ~ YYYY년 MM월" 형식 파싱
    const match = period.match(/(\d{4})년\s*(\d{1,2})월\s*~\s*(\d{4})년\s*(\d{1,2})월/)
    if (match) {
      const [, startYear, startMonth, endYear, endMonth] = match
      return {
        startDate: `${startYear}-${String(startMonth).padStart(2, "0")}-01`,
        endDate: `${endYear}-${String(endMonth).padStart(2, "0")}-01`,
      }
    }

    // "YYYY년 MM월 ~" 형식 파싱
    const singleMatch = period.match(/(\d{4})년\s*(\d{1,2})월\s*~/)
    if (singleMatch) {
      const [, year, month] = singleMatch
      return {
        startDate: `${year}-${String(month).padStart(2, "0")}-01`,
        endDate: "",
      }
    }

    return { startDate: "", endDate: "" }
  }

  const parsedCareer = careerContent.map((careerStr) => {
    if (typeof careerStr === "string") {
      // <b>연도</b><br />내용 또는 <b>연도</b><br>내용 형식 파싱
      const boldMatch = careerStr.match(/<b>(.*?)<\/b><br\s*\/?>(.*)/)
      if (boldMatch) {
        const period = boldMatch[1].trim()
        const dates = parsePeriodToDates(period)
        return {
          period: period,
          startDate: dates.startDate,
          endDate: dates.endDate,
          description: boldMatch[2].trim(),
        }
      }
      // <b>연도</b> 형식만 있는 경우
      const boldOnlyMatch = careerStr.match(/<b>(.*?)<\/b>/)
      if (boldOnlyMatch) {
        const period = boldOnlyMatch[1].trim()
        const dates = parsePeriodToDates(period)
        return {
          period: period,
          startDate: dates.startDate,
          endDate: dates.endDate,
          description: "",
        }
      }
      // 일반 문자열인 경우 (기존 형식 호환)
      return {
        period: "",
        startDate: "",
        endDate: "",
        description: careerStr,
      }
    }
    // 이미 객체 형식인 경우
    if (typeof careerStr === "object" && careerStr !== null) {
      const period = careerStr.period || ""
      const dates = parsePeriodToDates(period)
      return {
        period: period,
        startDate: careerStr.startDate || dates.startDate,
        endDate: careerStr.endDate || dates.endDate,
        description: careerStr.description || "",
      }
    }
    return { period: "", startDate: "", endDate: "", description: "" }
  })

  return {
    name: prof.name || "",
    photo: prof.photo || "",
    education: educationItem?.content || [""],
    career: parsedCareer.length > 0 ? parsedCareer : [{ period: "", description: "" }],
    introMedia: introPage?.media || "", // 인트로 페이지 media 경로 저장
  }
}
