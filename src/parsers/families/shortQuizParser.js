/**
 * ShortQuiz Family Parser
 *
 * Handles 2026-hrc template (1 template):
 * - 2026-hrc: Short-form quiz template with lecture + exercise
 *
 * Key characteristics:
 * - 2 sections: 학습하기, 퀴즈 (or 연습문제)
 * - lecture and exercise components only
 * - Minimal structure for quick assessment
 *
 * Theme: 26hrc
 */

import {
  BaseParser,
  findPageByComponent,
  parseLectureData,
  parseExerciseData
} from '../baseParser.js';

import { createContentModel, createPracticeWeekModel } from '../../models/contentModel.js';

export class ShortQuizParser extends BaseParser {
  constructor() {
    super();
    this.name = "ShortQuizParser";
  }

  /**
   * Check if this parser can handle the data
   */
  canParse(dataJson, htmlContent) {
    if (!dataJson || !htmlContent) return false;

    const sectionsStr = JSON.stringify(dataJson.sections || []);

    // ShortQuiz family has 2 sections
    return sectionsStr === JSON.stringify(["학습하기", "퀴즈"]) ||
           sectionsStr === JSON.stringify(["학습하기", "연습문제"]);
  }

  /**
   * Parse ShortQuiz template data
   */
  parse(dataJson, htmlContent, importedImages = {}, lessonNumber = 1) {
    const templateId = "2026-hrc";

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

    // Parse lecture
    const lecturePage = findPageByComponent(pages, "lecture");
    const lectureResult = parseLectureData(lecturePage);

    // Parse exercise
    const exercisePage = findPageByComponent(pages, "exercise");
    const exercises = parseExerciseData(exercisePage, importedImages);

    // Week and section numbers
    const weekNumber = dataJson.index || Math.ceil(lessonNumber / 2);
    const sectionInWeek = dataJson.section || ((lessonNumber - 1) % 2) + 1;

    // Create minimal content model (lecture + exercise only)
    return createContentModel({
      weekNumber,
      lessonNumber,
      lessonTitle: "", // Will be filled from subjects.json
      sectionInWeek,

      // No intro
      hasIntro: false,
      intro: {
        media: "",
        professor: {
          name: "",
          photo: "",
          education: [""],
          career: [{ period: "", startDate: "", endDate: "", description: "" }]
        }
      },

      // No orientation
      hasOrientation: false,
      orientation: null,

      // No term
      terms: [{ title: "", content: [""] }],
      termDescription: "",
      termScript: "",

      // No objectives
      learningContents: [],
      learningObjectives: [],
      objectivesDescription: "",
      objectivesScript: "",

      // No opinion/check
      opinionQuestion: "",
      professorThink: "",
      checkDescription: "",
      checkScript: "",

      // Lecture component
      lectureVideoUrl: lectureResult.lectureVideoUrl,
      lectureSubtitle: lectureResult.lectureSubtitle,
      timestamps: lectureResult.timestamps,

      // No practice
      hasPractice: false,
      practiceContent: "",
      practiceVideoUrl: "",
      practiceSubtitle: "",
      practiceTimestamps: [{ time: "0:00:04", title: "" }, { time: "0:00:00", title: "" }],

      // Exercise component
      exercises,

      // No summary
      summary: ["", "", ""],
      reference: "",

      instructionUrl: dataJson.instruction || "",
      guideUrl: dataJson.guide || "",

      professor: {
        name: "",
        photo: "",
        education: [""],
        career: [{ period: "", startDate: "", endDate: "", description: "" }]
      },

      _meta: {
        sourceTemplateId: templateId,
        importedAt: new Date().toISOString(),
        originalFormat: {
          sections: dataJson.sections || [],
          hasPages: true,
          isShortQuizTemplate: true,
          componentOrder: ["lecture", "exercise"]
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
   * Get template ID
   */
  getTemplateId() {
    return "short-quiz"; // Family ID
  }
}
