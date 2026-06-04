/**
 * HRD Family Parser
 *
 * Handles 2024-hrd and 2026-hrd templates (2 templates):
 * - 2024-hrd: intro, exercise_pre, objectives, lecture, exercise_post, theorem, next
 * - 2026-hrd: intro, objectives, exercise_pre, lecture, exercise_post, theorem, next
 *
 * Key differences from Standard:
 * - exercise split into exercise_pre and exercise_post
 * - 2024 vs 2026 have different component order (objectives/exercise_pre swap)
 * - No orientation, term, opinion, check, practice components
 *
 * Common structure: 4 sections (인트로, 준비하기, 학습하기, 정리하기)
 */

import {
  BaseParser,
  findPageByComponent,
  parseObjectivesData,
  parseLectureData,
  parseExerciseData,
  parseTheoremData,
  parseProfessorInfo
} from '../baseParser.js';

import { createContentModel, createPracticeWeekModel } from '../../models/contentModel.js';

export class HrdParser extends BaseParser {
  constructor() {
    super();
    this.name = "HrdParser";
  }

  /**
   * Check if this parser can handle the data
   */
  canParse(dataJson, htmlContent) {
    if (!dataJson || !htmlContent) return false;

    const sectionsStr = JSON.stringify(dataJson.sections || []);

    // HRD family has 4 sections (same as standard)
    if (sectionsStr !== JSON.stringify(["인트로", "준비하기", "학습하기", "정리하기"])) {
      return false;
    }

    // HRD templates have layout-hrd.css, layout-nr.css or commons_hrd.js
    return htmlContent.includes("layout-hrd.css") ||
           htmlContent.includes("layout-nr.css") ||
           htmlContent.includes("commons_hrd.js");
  }

  /**
   * Parse HRD template data
   */
  parse(dataJson, htmlContent, importedImages = {}, lessonNumber = 1) {
    // Detect specific HRD template year
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

    // Parse objectives
    const objectivesPage = findPageByComponent(pages, "objectives");
    const objectivesResult = parseObjectivesData(objectivesPage, importedImages);

    // Parse lecture
    const lecturePage = findPageByComponent(pages, "lecture");
    const lectureResult = parseLectureData(lecturePage);

    // Parse exercise_pre (사전평가)
    const exercisePrePage = findPageByComponent(pages, "exercise_pre");
    const exercisesPre = parseExerciseData(exercisePrePage, importedImages);

    // Parse exercise_post (사후평가)
    const exercisePostPage = findPageByComponent(pages, "exercise_post");
    const exercisesPost = parseExerciseData(exercisePostPage, importedImages);

    // Parse theorem (summary)
    const theoremPage = findPageByComponent(pages, "theorem");
    const theoremResult = parseTheoremData(theoremPage, importedImages);

    // Week and section numbers
    const weekNumber = dataJson.index || Math.ceil(lessonNumber / 2);
    const sectionInWeek = dataJson.section || ((lessonNumber - 1) % 2) + 1;

    // Create content model (using standard model structure but with HRD-specific data)
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
          career: professorInfo.career,
          _careerHadHtmlTags: professorInfo._careerHadHtmlTags
        }
      },

      hasOrientation: false,
      orientation: null,

      // HRD templates don't have term component
      terms: [{ title: "", content: [""] }],
      termDescription: "",
      termScript: "",

      learningContents: objectivesResult.learningContents,
      learningObjectives: objectivesResult.learningObjectives,
      objectivesDescription: objectivesResult.objectivesDescription,
      objectivesScript: objectivesResult.objectivesScript,

      // HRD templates don't have opinion/check
      opinionQuestion: "",
      professorThink: "",
      checkDescription: "",
      checkScript: "",

      lectureVideoUrl: lectureResult.lectureVideoUrl,
      lectureSubtitle: lectureResult.lectureSubtitle,
      timestamps: lectureResult.timestamps,

      // HRD templates don't have practice component
      hasPractice: false,
      practiceContent: "",
      practiceVideoUrl: "",
      practiceSubtitle: "",
      practiceTimestamps: [{ time: "0:00:04", title: "" }, { time: "0:00:00", title: "" }],

      // Store both pre and post exercises
      // Primary exercises field contains post exercises for backward compatibility
      exercises: exercisesPost,

      summary: theoremResult.summary,
      reference: theoremResult.reference,

      instructionUrl: dataJson.instruction || "",
      guideUrl: dataJson.guide || "",

      professor: {
        name: professorInfo.name,
        photo: professorInfo.photo,
        education: professorInfo.education,
        career: professorInfo.career,
        _careerHadHtmlTags: professorInfo._careerHadHtmlTags
      },

      _meta: {
        sourceTemplateId: templateId,
        importedAt: new Date().toISOString(),
        originalFormat: {
          sections: dataJson.sections || [],
          hasPages: true,
          isHrdTemplate: true,
          componentOrder: templateId === "2024-hrd"
            ? ["intro", "exercise_pre", "objectives", "lecture", "exercise_post", "theorem", "next"]
            : ["intro", "objectives", "exercise_pre", "lecture", "exercise_post", "theorem", "next"]
        },
        preservedFields: {
          // HRD-specific fields
          exercisesPre: exercisesPre, // Store pre-exercises separately
          exercisesPost: exercisesPost, // Store post-exercises separately

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
   * Detect specific HRD template year from HTML content
   */
  detectTemplateYear(htmlContent) {
    if (htmlContent.includes("2026/layout-hrd.css") ||
        htmlContent.includes("2026/modules-hrd.css") ||
        htmlContent.includes("2026/commons.js")) {
      return "2026-hrd";
    }

    if (htmlContent.includes("2024/layout-hrd.css") ||
        htmlContent.includes("2024/modules-hrd.css") ||
        htmlContent.includes("2024/commons_hrd.js")) {
      return "2024-hrd";
    }

    // Default to 2026 (latest)
    return "2026-hrd";
  }

  /**
   * Get template ID
   */
  getTemplateId() {
    return "hrd"; // Family ID
  }
}
