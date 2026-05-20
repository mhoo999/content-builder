/**
 * Parser Router - Auto-detects template format and routes to appropriate parser
 *
 * This module automatically detects the template format and delegates parsing
 * to the appropriate family-specific parser.
 */

import { StandardParser } from './families/standardParser.js';
import { HrdParser } from './families/hrdParser.js';
import { LegalParser } from './families/legalParser.js';
import { ShortParser } from './families/shortParser.js';
import { ShortQuizParser } from './families/shortQuizParser.js';

/**
 * Priority-based parser list
 * Parsers are tested in order until one returns true for canParse()
 */
const PARSERS = [
  LegalParser, // 5-section unique structure (highest priority)
  ShortQuizParser, // 2-section: lecture + exercise
  ShortParser, // 1-section: lecture only
  HrdParser, // HRD components check
  StandardParser, // Default fallback
];

/**
 * Detect template format from data.json and HTML content
 *
 * @param {Object} dataJson - Parsed data.json content
 * @param {string} htmlContent - HTML file content as string
 * @returns {string} Template ID (e.g., "2018-standard", "2024-hrd")
 */
export const detectTemplateFormat = (dataJson, htmlContent) => {
  if (!dataJson || !htmlContent) return "2025-standard";

  const sectionsStr = JSON.stringify(dataJson.sections || []);

  // Legal family (5 sections)
  if (sectionsStr === JSON.stringify(["인트로", "들어가기", "학습하기", "점검하기", "정리하기"])) {
    return "2022-legal";
  }

  // Short Quiz family (2 sections)
  if (sectionsStr === JSON.stringify(["학습하기", "퀴즈"]) ||
      sectionsStr === JSON.stringify(["학습하기", "연습문제"])) {
    return "2026-hrc";
  }

  // Short family (1 section)
  if (sectionsStr === JSON.stringify(["학습하기"])) {
    if (htmlContent.includes("layout-dunamu21.css") ||
        htmlContent.includes("layout-summary.js")) {
      return "onboard-dunamu";
    }
    return "2022-ct";
  }

  // Standard or HRD family (4 sections)
  if (sectionsStr === JSON.stringify(["인트로", "준비하기", "학습하기", "정리하기"])) {
    // HRD family detection
    if (htmlContent.includes("layout-hrd.css") ||
        htmlContent.includes("layout-nr.css") ||
        htmlContent.includes("commons_hrd.js")) {
      if (htmlContent.includes("2026")) return "2026-hrd";
      return "2024-hrd";
    }

    // Standard family detection (by year)
    if (htmlContent.includes("2025/layout.css")) return "2025-standard";
    if (htmlContent.includes("2023/base.css")) return "2023-standard";
    if (htmlContent.includes("2022/base.css")) return "2022-standard";
    if (htmlContent.includes("2021/base.css")) return "2021-standard";
    if (htmlContent.includes("2020/layout.css")) return "2020-standard";
    if (htmlContent.includes("2019/base.css")) return "2019-standard";
    if (htmlContent.includes("2018/base.css")) return "2018-standard";
  }

  // Fallback to latest standard
  return "2025-standard";
};

/**
 * Detect template theme from HTML content
 *
 * @param {string} templateId - Template ID
 * @param {string} htmlContent - HTML file content
 * @returns {string} Theme ID (e.g., "type-1", "type-2")
 */
export const detectTemplateTheme = (templateId, htmlContent) => {
  if (!templateId || !htmlContent) return "type-1";

  // Standard family themes
  if (templateId.includes("standard")) {
    if (htmlContent.includes("type-3.css")) return "type-3";
    if (htmlContent.includes("type-2.css")) return "type-2";
    return "type-1";
  }

  // HRD family themes
  if (templateId === "2024-hrd") {
    if (htmlContent.includes("type-hrda.css")) return "type-hrda";
    return "type-hrda";
  }

  if (templateId === "2026-hrd") {
    return "26hrd";
  }

  // Legal family themes
  if (templateId === "2022-legal") {
    if (htmlContent.includes("safe.css")) return "safe";
    if (htmlContent.includes("hara.css")) return "hara";
    if (htmlContent.includes("gend.css")) return "gend";
    return "gend";
  }

  // Short family themes
  if (templateId === "2022-ct") {
    if (htmlContent.includes("type-2.css")) return "type-2";
    return "type-1";
  }

  if (templateId === "onboard-dunamu") {
    return "type-gr19-3";
  }

  if (templateId === "2026-hrc") {
    return "26hrc";
  }

  return "type-1";
};

/**
 * Parse template data using auto-detected parser
 *
 * @param {Object} dataJson - Parsed data.json content
 * @param {string} htmlContent - HTML file content as string
 * @param {Object} importedImages - Object mapping image paths to base64 data
 * @param {number} lessonNumber - Current lesson number
 * @returns {Object} Parsed content model
 */
export const parseTemplate = (dataJson, htmlContent, importedImages = {}, lessonNumber = 1) => {
  // Detect template format
  const templateId = detectTemplateFormat(dataJson, htmlContent);
  const theme = detectTemplateTheme(templateId, htmlContent);

  // Find appropriate parser
  for (const ParserClass of PARSERS) {
    const parser = new ParserClass();
    if (parser.canParse(dataJson, htmlContent)) {
      const content = parser.parse(dataJson, htmlContent, importedImages, lessonNumber);

      // Add metadata
      content._meta = {
        ...content._meta,
        sourceTemplateId: templateId,
        sourceTheme: theme,
        importedAt: new Date().toISOString(),
        originalFormat: {
          sections: dataJson.sections || [],
          hasPages: !!dataJson.pages
        }
      };

      return content;
    }
  }

  // If no parser found, throw error
  throw new Error(`No parser found for template: ${templateId}`);
};

/**
 * Parse subjects.json to extract lesson and week titles
 *
 * @param {Object} subjectsJson - Parsed subjects.json content
 * @param {number} startLessonNumber - Starting lesson number (default: 1)
 * @returns {Object} { lessonTitles, weekTitles, examWeeks }
 */
export const parseSubjectsJson = (subjectsJson, startLessonNumber = 1) => {
  const lessonTitles = {};
  const weekTitles = {};
  const examWeeks = [];
  let lessonCounter = startLessonNumber;

  const subjects = subjectsJson.subjects || [];

  subjects.forEach((subject) => {
    // Extract week number from title
    let weekNumberMatch = subject.title?.match(/<span[^>]*>(\d+)주<\/span>/);
    if (!weekNumberMatch) {
      weekNumberMatch = subject.title?.match(/(\d+)주/);
    }
    const weekNumber = weekNumberMatch ? parseInt(weekNumberMatch[1], 10) : null;

    // Extract week title
    let weekTitle = subject.title || "";
    if (typeof weekTitle === "string") {
      weekTitle = weekTitle
        .replace(/<span[^>]*>.*?<\/span>\s*/g, "")
        .replace(/^\d+주\s*/, "")
        .replace(/<[^>]+>/g, "")
        .trim();
    }

    if (weekTitle && weekNumber) {
      weekTitles[weekNumber] = weekTitle;
    }

    const lists = subject.lists || [];

    // Exam weeks (no lists)
    if (lists.length === 0 && weekNumber) {
      examWeeks.push({
        weekNumber: weekNumber,
        weekTitle: weekTitle
      });
    }

    lists.forEach((listItem) => {
      let title = listItem;

      if (typeof listItem === "string") {
        title = listItem
          .replace(/<span[^>]*>.*?<\/span>\s*/g, "")
          .replace(/^\d+차\s+/, "")
          .trim();
      }

      if (title) {
        lessonTitles[lessonCounter] = title;
        lessonCounter++;
      }
    });
  });

  return { lessonTitles, weekTitles, examWeeks };
};

/**
 * Check if data represents a practice week (image-only)
 *
 * @param {Object} dataJson - Parsed data.json content
 * @returns {boolean} True if practice week
 */
export const isPracticeWeek = (dataJson) => {
  return dataJson.image && !dataJson.pages;
};
