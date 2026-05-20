/**
 * Standard Family Parser
 *
 * Handles 2018-2025 standard templates (7 templates):
 * - 2018-standard (no practice, special JSON format with whitespace separator)
 * - 2019-standard (with practice)
 * - 2020-standard (no practice)
 * - 2021-standard (with practice)
 * - 2022-standard (no practice)
 * - 2023-standard (no practice)
 * - 2025-standard (no practice)
 *
 * Common structure: 4 sections (인트로, 준비하기, 학습하기, 정리하기)
 * Components: intro, orientation, term, objectives, opinion, lecture, practice?, check, exercise, theorem, next
 */

import {
  BaseParser,
  findPageByComponent,
  parseTermData,
  parseObjectivesData,
  parseOpinionCheckData,
  parseLectureData,
  parsePracticeData,
  parseExerciseData,
  parseTheoremData,
  parseProfessorInfo
} from '../baseParser.js';

import { createContentModel, createPracticeWeekModel } from '../../models/contentModel.js';

export class StandardParser extends BaseParser {
  constructor() {
    super();
    this.name = "StandardParser";
  }

  /**
   * Check if this parser can handle the data
   */
  canParse(dataJson, htmlContent) {
    if (!dataJson || !htmlContent) return false;

    const sectionsStr = JSON.stringify(dataJson.sections || []);

    // Standard family has 4 sections
    if (sectionsStr !== JSON.stringify(["인트로", "준비하기", "학습하기", "정리하기"])) {
      return false;
    }

    // Exclude HRD templates
    if (htmlContent.includes("layout-hrd.css") ||
        htmlContent.includes("layout-nr.css") ||
        htmlContent.includes("commons_hrd.js")) {
      return false;
    }

    // Check for standard template CSS markers
    return htmlContent.includes("2018/base.css") ||
           htmlContent.includes("2019/base.css") ||
           htmlContent.includes("2020/layout.css") ||
           htmlContent.includes("2021/base.css") ||
           htmlContent.includes("2022/base.css") ||
           htmlContent.includes("2023/base.css") ||
           htmlContent.includes("2025/layout.css") ||
           true; // Default to standard if 4 sections and not HRD
  }

  /**
   * Parse standard template data
   */
  parse(dataJson, htmlContent, importedImages = {}, lessonNumber = 1) {
    // Detect specific template year
    const templateId = this.detectTemplateYear(htmlContent);

    // Check for practice week (image-only)
    if (dataJson.image && !dataJson.pages) {
      return createPracticeWeekModel({
        lessonNumber: lessonNumber,
        weekNumber: Math.ceil(lessonNumber / 2),
        weekTitle: "",
        practiceImage: dataJson.image,
        _meta: {
          sourceTemplateId: templateId
        }
      });
    }

    const pages = dataJson.pages || [];

    // Parse intro page (professor info)
    const introPage = findPageByComponent(pages, "intro");
    const hasIntro = !!introPage;
    const professorInfo = parseProfessorInfo(introPage, importedImages);

    // Parse orientation
    const orientationPage = findPageByComponent(pages, "orientation");
    const hasOrientation = !!orientationPage;
    const orientation = hasOrientation ? {
      videoUrl: orientationPage?.media || "",
      subtitlePath: orientationPage?.caption?.[0]?.src || ""
    } : null;

    // Parse term check
    const termPage = findPageByComponent(pages, "term");
    const termResult = parseTermData(termPage, importedImages);

    // Parse objectives
    const objectivesPage = findPageByComponent(pages, "objectives");
    const objectivesResult = parseObjectivesData(objectivesPage, importedImages);

    // Parse opinion & check
    const opinionPage = findPageByComponent(pages, "opinion");
    const checkPage = findPageByComponent(pages, "check");
    const opinionCheckResult = parseOpinionCheckData(opinionPage, checkPage);

    // Parse lecture
    const lecturePage = findPageByComponent(pages, "lecture");
    const lectureResult = parseLectureData(lecturePage);

    // Parse practice (if exists)
    const practicePage = findPageByComponent(pages, "practice");
    const practiceResult = parsePracticeData(
      practicePage,
      objectivesResult.learningContents,
      importedImages
    );

    // Parse exercise
    const exercisePage = findPageByComponent(pages, "exercise");
    const exercises = parseExerciseData(exercisePage, importedImages);

    // Parse theorem (summary)
    const theoremPage = findPageByComponent(pages, "theorem");
    const theoremResult = parseTheoremData(theoremPage, importedImages);

    // Parse next page (preserve original data)
    const nextPage = findPageByComponent(pages, "next");
    const nextData = nextPage?.data || [];

    // Week and section numbers
    const weekNumber = dataJson.index || Math.ceil(lessonNumber / 2);
    const sectionInWeek = dataJson.section || ((lessonNumber - 1) % 2) + 1;

    // Create content model
    return createContentModel({
      weekNumber,
      lessonNumber,
      lessonTitle: "", // Will be filled from subjects.json
      sectionInWeek,

      hasIntro,
      intro: {
        media: professorInfo.introMedia,
        professor: {
          name: professorInfo.name,
          photo: professorInfo.photo,
          education: professorInfo.education,
          career: professorInfo.career
        }
      },

      hasOrientation,
      orientation,

      terms: termResult.terms,
      termDescription: termResult.termDescription,
      termScript: termResult.termScript,

      learningContents: practiceResult.learningContents,
      learningObjectives: objectivesResult.learningObjectives,
      objectivesDescription: objectivesResult.objectivesDescription,
      objectivesScript: objectivesResult.objectivesScript,

      opinionQuestion: opinionCheckResult.opinionQuestion,
      professorThink: opinionCheckResult.professorThink,
      checkDescription: opinionCheckResult.checkDescription,
      checkScript: opinionCheckResult.checkScript,

      lectureVideoUrl: lectureResult.lectureVideoUrl,
      lectureSubtitle: lectureResult.lectureSubtitle,
      timestamps: lectureResult.timestamps,

      hasPractice: practiceResult.hasPractice,
      practiceContent: practiceResult.practiceContent,
      practiceVideoUrl: practiceResult.practiceVideoUrl,
      practiceSubtitle: practiceResult.practiceSubtitle,
      practiceTimestamps: practiceResult.practiceTimestamps,

      exercises,

      summary: theoremResult.summary,
      reference: theoremResult.reference,
      summaryOriginalHtml: theoremResult.summaryOriginalHtml,

      nextWeekTitles: nextData,

      instructionUrl: dataJson.instruction || "",
      guideUrl: dataJson.guide || "",

      professor: {
        name: professorInfo.name,
        photo: professorInfo.photo,
        education: professorInfo.education,
        career: professorInfo.career
      },

      _meta: {
        sourceTemplateId: templateId,
        importedAt: new Date().toISOString(),
        originalFormat: {
          sections: dataJson.sections || [],
          hasPages: true,
          is2018Format: templateId === "2018-standard",
          // Preserve original component data structures for round-trip compatibility
          originalTermData: termResult._originalTermData || [],
          originalNextData: nextData,
          originalTheoremData: theoremPage?.data || {}
        },
        preservedFields: {
          // Preserve any unknown fields from original data.json
          ...Object.keys(dataJson)
            .filter(key => !['pages', 'sections', 'index', 'section', 'instruction', 'guide', 'image'].includes(key))
            .reduce((acc, key) => {
              acc[key] = dataJson[key];
              return acc;
            }, {})
        }
      }
    });
  }

  /**
   * Detect specific template year from HTML content
   */
  detectTemplateYear(htmlContent) {
    if (htmlContent.includes("2025/layout.css")) return "2025-standard";
    if (htmlContent.includes("2023/base.css")) return "2023-standard";
    if (htmlContent.includes("2022/base.css")) return "2022-standard";
    if (htmlContent.includes("2021/base.css")) return "2021-standard";
    if (htmlContent.includes("2020/layout.css")) return "2020-standard";
    if (htmlContent.includes("2019/base.css")) return "2019-standard";
    if (htmlContent.includes("2018/base.css")) return "2018-standard";

    // Default to latest
    return "2025-standard";
  }

  /**
   * Get template ID
   */
  getTemplateId() {
    return "standard"; // Family ID
  }
}
