/**
 * Base Parser - Common parsing utilities for all template parsers
 *
 * This module provides shared functionality used by specific template family parsers.
 */

/**
 * H 태그 감지 및 정규화
 * 다양한 H1/H2/H3 패턴을 감지하여 표준 H 태그로 변환
 */
export const normalizeHeadings = (html) => {
  if (!html || typeof html !== 'string') return html;

  let result = html;

  // 1. 기존 H1/H2/H3 태그는 그대로 유지 (이미 올바른 형식)
  // <h1>내용</h1>, <h2>내용</h2>, <h3>내용</h3> - 변환 불필요

  // 2. main-title 클래스 → H1 (strong 태그 있거나 없거나 모두 처리)
  result = result.replace(
    /<p\s+class=['"]main-title['"][^>]*>(?:<strong>)?(.*?)(?:<\/strong>)?<\/p>/gi,
    '<h1>$1</h1>'
  );

  // 3. h1, h2, h3 클래스 → 해당 태그
  result = result.replace(
    /<(?:p|div|span)\s+class=['"]h1['"][^>]*>(.*?)<\/(?:p|div|span)>/gi,
    '<h1>$1</h1>'
  );
  result = result.replace(
    /<(?:p|div|span)\s+class=['"]h2['"][^>]*>(.*?)<\/(?:p|div|span)>/gi,
    '<h2>$1</h2>'
  );
  result = result.replace(
    /<(?:p|div|span)\s+class=['"]h3['"][^>]*>(.*?)<\/(?:p|div|span)>/gi,
    '<h3>$1</h3>'
  );

  // 4. 특정 스타일의 ol/p → H3 (기존 패턴 + 유연화)
  result = result.replace(
    /<ol\s+style=['"][^'"]*color:\s*#000[^'"]*['"][^>]*>(.*?)<\/ol>/gi,
    (match, content) => {
      const cleaned = content.replace(/^\d+\)\s*/, '').trim();
      return `<h3>${cleaned}</h3>`;
    }
  );

  // 5. 큰 폰트 + bold 조합 감지 (font-size: 18px+ 또는 1.2em+)
  // 5-1. font-size + font-weight 순서
  result = result.replace(
    /<(?:p|div|span)[^>]*style=['"][^'"]*font-size:\s*(?:1[89]|[2-9]\d)px[^'"]*font-weight:\s*bold[^'"]*['"][^>]*>(.*?)<\/(?:p|div|span)>/gi,
    '<h3>$1</h3>'
  );
  // 5-2. font-weight + font-size 순서
  result = result.replace(
    /<(?:p|div|span)[^>]*style=['"][^'"]*font-weight:\s*bold[^'"]*font-size:\s*(?:1[89]|[2-9]\d)px[^'"]*['"][^>]*>(.*?)<\/(?:p|div|span)>/gi,
    '<h3>$1</h3>'
  );

  // 6. sub-title 클래스 → H3
  result = result.replace(
    /<(?:p|div|span)\s+class=['"]sub-title['"][^>]*>(.*?)<\/(?:p|div|span)>/gi,
    '<h3>$1</h3>'
  );

  // 7. title 클래스 → H3 (modules.css의 .title 스타일과 일치)
  result = result.replace(
    /<(?:p|div|span)\s+class=['"]title['"][^>]*>(.*?)<\/(?:p|div|span)>/gi,
    '<h3>$1</h3>'
  );

  return result;
};

/**
 * HTML 문자열에서 상대경로 이미지에 data-original-src 속성 추가 및 임시 base64 변환
 * (표시용으로 base64 사용, export 시 상대경로로 변환)
 */
export const markRelativeImages = (html, importedImages = {}) => {
  if (!html) return html;

  // 배열인 경우 각 항목에 대해 재귀적으로 처리
  if (Array.isArray(html)) {
    return html.map((item) => markRelativeImages(item, importedImages));
  }

  // 문자열이 아닌 경우 그대로 반환
  if (typeof html !== "string") {
    return html;
  }

  // H 태그 정규화 (Import 시 에디터 호환을 위해 변환, Export 시 역변환으로 라운드트립 보장)
  html = normalizeHeadings(html);

  // ../images/filename.png 또는 images/filename.png 패턴 찾기
  const pattern = /<img\s+([^>]*)src=["']([^"']*images\/[^"']+)["']([^>]*)>/gi;

  return html.replace(pattern, (match, before, fullPath, after) => {
    // 이미 data-original-src가 있으면 base64로 변환만 시도
    if (match.includes("data-original-src")) {
      const originalSrcMatch = match.match(/data-original-src=["']([^"']+)["']/);
      if (originalSrcMatch) {
        const originalSrc = originalSrcMatch[1];
        const base64 = importedImages[originalSrc];
        if (base64) {
          return match.replace(/src=["'][^"']+["']/, `src="${base64}"`);
        }
      }
      return match;
    }

    // 경로 정규화: images/로 시작하면 ../images/로 변환
    let normalizedPath = fullPath;
    if (normalizedPath.startsWith("images/")) {
      normalizedPath = "../" + normalizedPath;
    }

    // importedImages에서 base64 찾기
    let base64 = importedImages[normalizedPath] || importedImages[fullPath];

    if (base64) {
      return `<img ${before}src="${base64}" data-original-src="${normalizedPath}"${after}>`;
    } else {
      return `<img ${before}src="${normalizedPath}" data-original-src="${normalizedPath}"${after}>`;
    }
  });
};

/**
 * 페이지 배열에서 특정 컴포넌트 타입의 페이지 찾기
 */
export const findPageByComponent = (pages, componentType) => {
  return pages.find((page) => page.component === componentType);
};

/**
 * 페이지 배열에서 특정 컴포넌트 타입의 모든 페이지 찾기
 */
export const findAllPagesByComponent = (pages, componentType) => {
  return pages.filter((page) => page.component === componentType);
};

/**
 * HTML 엔티티 디코딩 및 넘버링 제거
 * @param {string} text - 처리할 텍스트
 * @param {object} options - 옵션 { returnMetadata: boolean }
 * @returns {string|object} 기본적으로 문자열 반환, returnMetadata=true이면 {text, hadNumbering} 객체 반환
 */
export const cleanText = (text, options = {}) => {
  if (typeof text !== "string") return options.returnMetadata ? { text, hadNumbering: false } : text;

  let cleaned = text;

  // HTML 엔티티 디코딩
  cleaned = cleaned
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 번호 제거 전 원본 형식 기록 (내보낼 때 항상 숫자를 붙이므로 기록용)
  const hadNumbering = /^\d+[\.\)]\s*/.test(cleaned);

  // 넘버링 제거 (예: "1. 내용", "1) 내용" -> "내용")
  cleaned = cleaned.replace(/^\d+[\.\)]\s*/, "").trim();

  if (options.returnMetadata) {
    return { text: cleaned, hadNumbering };
  }

  return cleaned;
};

/**
 * HTML 엔티티 디코딩 (넘버링 제거 없음)
 */
export const decodeHtmlEntities = (text) => {
  if (typeof text !== "string") return text;

  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

/**
 * Parse term component data
 */
export const parseTermData = (termPage, importedImages = {}) => {
  const termData = Array.isArray(termPage?.data) ? termPage.data : [];
  const termDescription = termPage?.description || "";
  const termScript = termPage?.script || "";

  // Preserve original term data structure for round-trip compatibility
  const originalTermData = termData.map((term) => ({
    title: term.title || "",
    content: term.content,
    _wasArray: Array.isArray(term.content)
  }));

  const terms = termData.map((term) => {
    let title = term.title || "";

    // HTML 엔티티 디코딩
    title = decodeHtmlEntities(title)
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();

    // content 처리: 배열인 경우 불릿(•) 제거 후 배열로 유지
    let content = [];
    if (Array.isArray(term.content)) {
      content = term.content
        .map((item) => {
          if (typeof item === "string") {
            return markRelativeImages(item.replace(/^•\s*/, "").trim(), importedImages);
          }
          return item;
        })
        .filter((item) => item);
    } else if (term.content) {
      const cleaned = markRelativeImages(term.content.replace(/^•\s*/, "").trim(), importedImages);
      content = cleaned ? [cleaned] : [""];
    } else {
      content = [""];
    }

    return {
      title: title,
      content: content.length > 0 ? content : [""]
    };
  });

  return {
    terms: terms.length > 0 ? terms : [{ title: "", content: [""] }],
    termDescription,
    termScript,
    _originalTermData: originalTermData  // Preserve for export
  };
};

/**
 * Parse objectives component data
 */
export const parseObjectivesData = (objectivesPage, importedImages = {}) => {
  const learningContentsRaw = objectivesPage?.data?.[0]?.contents || ["", "", ""];
  const learningObjectivesRaw = objectivesPage?.data?.[1]?.contents || ["", "", ""];
  const objectivesDescription = objectivesPage?.description || "";
  const objectivesScript = objectivesPage?.script || "";

  // 넘버링 제거 및 이미지 처리
  const learningContents = learningContentsRaw.map(text =>
    markRelativeImages(cleanText(text), importedImages)
  );
  const learningObjectives = learningObjectivesRaw.map(text =>
    markRelativeImages(cleanText(text), importedImages)
  );

  return {
    learningContents,
    learningObjectives,
    objectivesDescription,
    objectivesScript
  };
};

/**
 * Parse opinion and check component data
 */
export const parseOpinionCheckData = (opinionPage, checkPage) => {
  const opinionQuestion = opinionPage?.data?.title || "";
  const professorThink = checkPage?.data?.think || "";
  const checkDescription = checkPage?.description || "";
  const checkScript = checkPage?.script || "";

  return {
    opinionQuestion,
    professorThink,
    checkDescription,
    checkScript
  };
};

/**
 * Parse lecture component data
 */
export const parseLectureData = (lecturePage) => {
  const lectureVideoUrl = lecturePage?.media || "";
  const lectureSubtitle = lecturePage?.caption?.[0]?.src || "";

  // 타임스탬프는 time 값만 문자열 배열로 반환 (title은 사용하지 않음)
  const timestamps = Array.isArray(lecturePage?.data)
    ? lecturePage.data.map((item) => item.time || "0:00:00")
    : ["0:00:04", "0:00:00"];

  return {
    lectureVideoUrl,
    lectureSubtitle,
    timestamps
  };
};

/**
 * Parse practice component data
 */
export const parsePracticeData = (practicePage, learningContents, importedImages = {}) => {
  const hasPractice = !!practicePage;
  const practiceVideoUrl = practicePage?.media || "";
  const practiceSubtitle = practicePage?.caption?.[0]?.src || "";

  // 실습 타임스탬프도 time 값만 문자열 배열로 반환
  const practiceTimestamps = Array.isArray(practicePage?.data)
    ? practicePage.data.map((item) => item.time || "0:00:00")
    : ["0:00:04", "0:00:00"];

  // 실습 내용 추출 (학습내용에서 실습 항목 찾기)
  let practiceContent = "";
  const practiceContentInLearning = learningContents.find(
    (content) =>
      typeof content === "string" &&
      (content.includes("class='practice'") || content.includes('class="practice"'))
  );

  if (practiceContentInLearning) {
    // <div class='practice'> 형식을 <ul class='practice'> 형식으로 변환
    if (practiceContentInLearning.includes("<div class='practice'>") ||
        practiceContentInLearning.includes('<div class="practice">')) {
      practiceContent = practiceContentInLearning
        .replace(/<div class=['"]practice['"]>\s*<ul>/gi, "<ul class='practice'>")
        .replace(/<\/ul>\s*<\/div>/gi, "</ul>");
    } else {
      practiceContent = practiceContentInLearning;
    }
  } else if (hasPractice) {
    practiceContent = "<ul class='practice'><li></li></ul>";
  }

  // 학습내용에서 실습 항목 제거
  const filteredLearningContents = learningContents.filter(
    (content) =>
      !(typeof content === "string" &&
        (content.includes("class='practice'") || content.includes('class="practice"')))
  );

  return {
    hasPractice,
    practiceContent,
    practiceVideoUrl,
    practiceSubtitle,
    practiceTimestamps,
    learningContents: filteredLearningContents
  };
};

/**
 * Parse exercise component data
 */
export const parseExerciseData = (exercisePage, importedImages = {}) => {
  const exercisesData = exercisePage?.data || [];

  const exercises = exercisesData.map((ex) => {
    if (ex.type === "boolean") {
      return {
        type: "boolean",
        question: markRelativeImages(ex.subject || "", importedImages),
        answer: ex.answer || "2",
        options: [],
        commentary: markRelativeImages(ex.commentary || "", importedImages)
      };
    } else if (ex.type === "multiple") {
      return {
        type: "multiple",
        question: markRelativeImages(ex.subject || "", importedImages),
        answer: ex.answer || "1",
        options: (ex.value || ["", "", "", ""]).map(opt =>
          markRelativeImages(opt, importedImages)
        ),
        commentary: markRelativeImages(ex.commentary || "", importedImages)
      };
    }
    return {
      type: "boolean",
      question: "",
      answer: "2",
      options: [],
      commentary: ""
    };
  });

  // 최소 1개의 연습문제 보장
  if (exercises.length === 0) {
    exercises.push({
      type: "boolean",
      question: "",
      answer: "2",
      options: [],
      commentary: ""
    });
  }

  return exercises;
};

/**
 * Parse theorem (summary) component data
 */
export const parseTheoremData = (theoremPage, importedImages = {}) => {
  const summaryRaw = theoremPage?.data?.theorem || ["", "", ""];

  // Preserve original HTML for round-trip compatibility
  const summaryOriginalHtml = summaryRaw.length > 0 ? [...summaryRaw] : null;

  const summary = summaryRaw.map((item) => {
    if (typeof item !== "string") return item;
    return markRelativeImages(decodeHtmlEntities(item), importedImages);
  });

  const reference = theoremPage?.data?.reference || "";

  return {
    summary,
    reference,
    summaryOriginalHtml
  };
};

/**
 * Parse intro page for professor information
 */
export const parseProfessorInfo = (introPage, importedImages = {}) => {
  if (!introPage || !introPage.data || !introPage.data.professor) {
    return {
      name: "",
      photo: "",
      education: [""],
      career: [{ period: "", startDate: "", endDate: "", description: "" }],
      introMedia: ""
    };
  }

  const prof = introPage.data.professor;
  const profile = prof.profile || [];

  const educationItem = profile.find((item) => item.title && item.title.includes("학"));
  const careerItem = profile.find((item) => item.title && item.title.includes("경"));

  // period 문자열을 파싱하여 startDate와 endDate 추출
  const parsePeriodToDates = (period) => {
    if (!period) return { startDate: "", endDate: "" };

    // 전체 범위: YYYY년 M월 ~ YYYY년 M월
    const fullRangeMatch = period.match(/(\d{4})년\s*(\d{1,2})월\s*~\s*(\d{4})년\s*(\d{1,2})월/);
    if (fullRangeMatch) {
      const [, startYear, startMonth, endYear, endMonth] = fullRangeMatch;
      return {
        startDate: `${startYear}-${String(startMonth).padStart(2, "0")}-01`,
        endDate: `${endYear}-${String(endMonth).padStart(2, "0")}-01`
      };
    }

    // 시작만: YYYY년 M월 ~ (진행중)
    const startOnlyMatch = period.match(/(\d{4})년\s*(\d{1,2})월\s*~/);
    if (startOnlyMatch) {
      const [, year, month] = startOnlyMatch;
      return {
        startDate: `${year}-${String(month).padStart(2, "0")}-01`,
        endDate: "" // 종료일 없음 (현재 재직중)
      };
    }

    // 단일 날짜: YYYY년 M월 (기간 표시 없이)
    const singleDateMatch = period.match(/(\d{4})년\s*(\d{1,2})월/);
    if (singleDateMatch) {
      const [, year, month] = singleDateMatch;
      return {
        startDate: `${year}-${String(month).padStart(2, "0")}-01`,
        endDate: ""
      };
    }

    return { startDate: "", endDate: "" };
  };

  const careerContent = careerItem?.content || [];

  // 원본 형식 감지: HTML 태그(<b>, <br> 등)가 있는지 확인
  const hasHtmlInCareer = careerContent.some((item) => {
    if (typeof item === "string") {
      return /<(?:b|strong|br)[^>]*>/i.test(item);
    }
    return false;
  });

  const parsedCareer = careerContent.map((careerStr, idx) => {
    if (typeof careerStr === "string") {
      // HTML 엔티티 디코딩
      let decoded = careerStr
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // 먼저 <b> 또는 <strong> 태그로 기간 추출
      const boldRegex = /<(?:b|strong)>(.*?)<\/(?:b|strong)>/i;
      const boldMatch = decoded.match(boldRegex);

      if (boldMatch) {
        const period = boldMatch[1].trim();

        // bold 태그 이후의 모든 내용 추출
        const boldEndIndex = decoded.indexOf(boldMatch[0]) + boldMatch[0].length;
        let afterBold = decoded.substring(boldEndIndex);

        // <br> 또는 <br/> 제거
        afterBold = afterBold.replace(/<br\s*\/?>/gi, ' ');

        // 나머지 HTML 태그 제거
        const description = afterBold.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

        const dates = parsePeriodToDates(period);
        return {
          period: period,
          startDate: dates.startDate,
          endDate: dates.endDate,
          description: description
        };
      }

      // bold 태그 없는 경우 - HTML 태그 모두 제거하고 텍스트로 파싱
      const cleanText = decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // 기간 패턴으로 직접 감지: "YYYY년 M월 ~ YYYY년 M월 내용"
      const periodPattern = /^(\d{4}년\s*\d{1,2}월\s*~\s*(?:\d{4}년\s*\d{1,2}월|현재|재직중)?)\s+(.+)$/;
      const periodMatch = cleanText.match(periodPattern);

      if (periodMatch) {
        const period = periodMatch[1].trim();
        const description = periodMatch[2].trim();
        const dates = parsePeriodToDates(period);
        return {
          period: period,
          startDate: dates.startDate,
          endDate: dates.endDate,
          description: description
        };
      }

      // 매칭 실패: 전체를 description으로 처리
      return {
        period: "",
        startDate: "",
        endDate: "",
        description: cleanText
      };
    }

    if (typeof careerStr === "object" && careerStr !== null) {
      const period = careerStr.period || "";
      const dates = parsePeriodToDates(period);
      return {
        period: period,
        startDate: careerStr.startDate || dates.startDate,
        endDate: careerStr.endDate || dates.endDate,
        description: careerStr.description || ""
      };
    }

    return { period: "", startDate: "", endDate: "", description: "" };
  });

  return {
    name: prof.name || "",
    photo: prof.photo || "",
    education: educationItem?.content || [""],
    career: parsedCareer.length > 0 ? parsedCareer : [{ period: "", startDate: "", endDate: "", description: "" }],
    introMedia: introPage?.media || "",
    _careerHadHtmlTags: hasHtmlInCareer  // 원본 형식 메타데이터 보존
  };
};

/**
 * Base Parser class that all specific parsers should extend
 */
export class BaseParser {
  constructor() {
    this.name = "BaseParser";
  }

  /**
   * Detect if this parser can handle the given data
   * @param {Object} dataJson - The data.json content
   * @param {string} htmlContent - The index.html content
   * @returns {boolean} True if this parser can handle the data
   */
  canParse(dataJson, htmlContent) {
    throw new Error("canParse() must be implemented by subclass");
  }

  /**
   * Parse the data into content model
   * @param {Object} dataJson - The data.json content
   * @param {string} htmlContent - The index.html content
   * @param {Object} importedImages - Imported images as base64
   * @param {number} lessonNumber - Lesson number
   * @returns {Object} Content model
   */
  parse(dataJson, htmlContent, importedImages, lessonNumber) {
    throw new Error("parse() must be implemented by subclass");
  }

  /**
   * Get template ID that this parser handles
   * @returns {string} Template ID
   */
  getTemplateId() {
    throw new Error("getTemplateId() must be implemented by subclass");
  }
}
