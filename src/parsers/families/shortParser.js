/**
 * Short Family Parser
 *
 * Handles short-form templates (2 templates):
 * - 2022-ct: Minimal CT (Computational Thinking) template
 * - onboard-dunamu: Corporate onboarding template
 *
 * Key characteristics:
 * - 1 section only: 학습하기
 * - lecture component only (no other components)
 * - Minimal structure for quick content
 *
 * Themes:
 * - 2022-ct: type-1 (블루), type-2 (퍼플)
 * - onboard-dunamu: type-gr19-3 (그린)
 */

import {
  BaseParser,
  findPageByComponent,
  parseLectureData
} from '../baseParser.js';

import { createContentModel, createPracticeWeekModel } from '../../models/contentModel.js';

export class ShortParser extends BaseParser {
  constructor() {
    super();
    this.name = "ShortParser";
  }

  /**
   * Check if this parser can handle the data
   */
  canParse(dataJson, htmlContent) {
    if (!dataJson || !htmlContent) return false;

    const sectionsStr = JSON.stringify(dataJson.sections || []);

    // Short family has single section
    return sectionsStr === JSON.stringify(["학습하기"]);
  }

  /**
   * Parse Short template data
   */
  parse(dataJson, htmlContent, importedImages = {}, lessonNumber = 1) {
    // Detect specific template
    const templateId = this.detectTemplateVariant(htmlContent);

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

    // Parse lecture (only component in Short templates)
    const lecturePage = findPageByComponent(pages, "lecture");
    const lectureResult = parseLectureData(lecturePage);

    // Week and section numbers
    const weekNumber = dataJson.index || Math.ceil(lessonNumber / 2);
    const sectionInWeek = dataJson.section || ((lessonNumber - 1) % 2) + 1;

    // Create minimal content model (lecture only)
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

      // Lecture component only
      lectureVideoUrl: lectureResult.lectureVideoUrl,
      lectureSubtitle: lectureResult.lectureSubtitle,
      timestamps: lectureResult.timestamps,

      // No practice
      hasPractice: false,
      practiceContent: "",
      practiceVideoUrl: "",
      practiceSubtitle: "",
      practiceTimestamps: [{ time: "0:00:04", title: "" }, { time: "0:00:00", title: "" }],

      // No exercises
      exercises: [{
        type: "boolean",
        question: "",
        answer: "2",
        options: [],
        commentary: ""
      }],

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
          isShortTemplate: true,
          componentOrder: ["lecture"]
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
   * Detect specific Short template variant from HTML content
   */
  detectTemplateVariant(htmlContent) {
    // Check for onboard-dunamu markers
    if (htmlContent.includes("layout-dunamu21.css") ||
        htmlContent.includes("layout-summary.js")) {
      return "onboard-dunamu";
    }

    // Check for 2022-ct markers
    if (htmlContent.includes("layout_ct.css") ||
        htmlContent.includes("defaults_ct.js") ||
        htmlContent.includes("commons_ct.js")) {
      return "2022-ct";
    }

    // Default to 2022-ct
    return "2022-ct";
  }

  /**
   * Get template ID
   */
  getTemplateId() {
    return "short"; // Family ID
  }
}
