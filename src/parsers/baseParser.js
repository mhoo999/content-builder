/**
 * Base Parser - Common parsing utilities for all template parsers
 *
 * This module provides shared functionality used by specific template family parsers.
 */

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

  // <p class='main-title'><strong>내용</strong></p> → <h1>내용</h1> 변환 (Import 시)
  html = html.replace(
    /<p\s+class=['"]main-title['"][^>]*><strong>(.*?)<\/strong><\/p>/gi,
    "<h1>$1</h1>"
  );

  // ol 태그를 H3로 변환 (Import 시)
  html = html.replace(
    /<ol\s+style=['"]color:#000;margin-bottom:\s*4px;['"]>(.*?)<\/ol>/gi,
    (match, content) => {
      const cleaned = content.replace(/^\d+\)\s*/, "").trim();
      return `<h3>${cleaned}</h3>`;
    }
  );

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

  // 번호 제거 전 원본 형식 기록
  const hadNumbering = /^\d+\.\s*/.test(cleaned);

  // 넘버링 제거 (예: "1. 내용" -> "내용")
  cleaned = cleaned.replace(/^\d+\.\s*/, "").trim();

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

  const timestamps = Array.isArray(lecturePage?.data)
    ? lecturePage.data.map((item) => ({
        time: item.time || "",
        title: item.title || ""
      }))
    : [{ time: "0:00:04", title: "" }, { time: "0:00:00", title: "" }];

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

  const practiceTimestamps = Array.isArray(practicePage?.data)
    ? practicePage.data.map((item) => ({
        time: item.time || "",
        title: item.title || ""
      }))
    : [{ time: "0:00:04", title: "" }, { time: "0:00:00", title: "" }];

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

    const match = period.match(/(\d{4})년\s*(\d{1,2})월\s*~\s*(\d{4})년\s*(\d{1,2})월/);
    if (match) {
      const [, startYear, startMonth, endYear, endMonth] = match;
      return {
        startDate: `${startYear}-${String(startMonth).padStart(2, "0")}-01`,
        endDate: `${endYear}-${String(endMonth).padStart(2, "0")}-01`
      };
    }

    const singleMatch = period.match(/(\d{4})년\s*(\d{1,2})월\s*~/);
    if (singleMatch) {
      const [, year, month] = singleMatch;
      return {
        startDate: `${year}-${String(month).padStart(2, "0")}-01`,
        endDate: ""
      };
    }

    return { startDate: "", endDate: "" };
  };

  const careerContent = careerItem?.content || [];
  const parsedCareer = careerContent.map((careerStr) => {
    if (typeof careerStr === "string") {
      const boldMatch = careerStr.match(/<b>(.*?)<\/b><br\s*\/?>(.*)/)
      if (boldMatch) {
        const period = boldMatch[1].trim();
        const dates = parsePeriodToDates(period);
        return {
          period: period,
          startDate: dates.startDate,
          endDate: dates.endDate,
          description: boldMatch[2].trim()
        };
      }

      const boldOnlyMatch = careerStr.match(/<b>(.*?)<\/b>/);
      if (boldOnlyMatch) {
        const period = boldOnlyMatch[1].trim();
        const dates = parsePeriodToDates(period);
        return {
          period: period,
          startDate: dates.startDate,
          endDate: dates.endDate,
          description: ""
        };
      }

      return {
        period: "",
        startDate: "",
        endDate: "",
        description: careerStr
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
    introMedia: introPage?.media || ""
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
