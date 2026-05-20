/**
 * Legal Family Parser
 *
 * Handles 2022-legal template (1 template):
 * - 2022-legal: intro, orientation, lecture, practice, exercise, theorem
 *
 * Key differences from Standard:
 * - 5 sections (unique structure): 인트로, 들어가기, 학습하기, 점검하기, 정리하기
 * - No term, objectives, opinion, check, next components
 * - Has practice component (always included)
 *
 * Themes: gend (성희롱), hara (장애인인식), safe (산업안전)
 */

import {
  BaseParser,
  findPageByComponent,
  parseLectureData,
  parsePracticeData,
  parseExerciseData,
  parseTheoremData,
  parseProfessorInfo
} from '../baseParser.js';

import { createContentModel, createPracticeWeekModel } from '../../models/contentModel.js';

export class LegalParser extends BaseParser {
  constructor() {
    super();
    this.name = "LegalParser";
  }

  /**
   * Check if this parser can handle the data
   */
  canParse(dataJson, htmlContent) {
    if (!dataJson || !htmlContent) return false;

    const sectionsStr = JSON.stringify(dataJson.sections || []);

    // Legal family has unique 5-section structure
    return sectionsStr === JSON.stringify(["인트로", "들어가기", "학습하기", "점검하기", "정리하기"]);
  }

  /**
   * Parse Legal template data
   */
  parse(dataJson, htmlContent, importedImages = {}, lessonNumber = 1) {
    const templateId = "2022-legal";

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

    // Parse lecture
    const lecturePage = findPageByComponent(pages, "lecture");
    const lectureResult = parseLectureData(lecturePage);

    // Parse practice (always included in Legal templates)
    const practicePage = findPageByComponent(pages, "practice");
    // Legal templates don't have objectives, so use empty learning contents
    const practiceResult = parsePracticeData(
      practicePage,
      [], // No objectives in Legal templates
      importedImages
    );

    // Parse exercise
    const exercisePage = findPageByComponent(pages, "exercise");
    const exercises = parseExerciseData(exercisePage, importedImages);

    // Parse theorem (summary)
    const theoremPage = findPageByComponent(pages, "theorem");
    const theoremResult = parseTheoremData(theoremPage, importedImages);

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

      // Legal templates don't have term component
      terms: [{ title: "", content: [""] }],
      termDescription: "",
      termScript: "",

      // Legal templates don't have objectives component
      learningContents: [],
      learningObjectives: [],
      objectivesDescription: "",
      objectivesScript: "",

      // Legal templates don't have opinion/check
      opinionQuestion: "",
      professorThink: "",
      checkDescription: "",
      checkScript: "",

      lectureVideoUrl: lectureResult.lectureVideoUrl,
      lectureSubtitle: lectureResult.lectureSubtitle,
      timestamps: lectureResult.timestamps,

      // Legal templates always have practice component
      hasPractice: practiceResult.hasPractice,
      practiceContent: practiceResult.practiceContent,
      practiceVideoUrl: practiceResult.practiceVideoUrl,
      practiceSubtitle: practiceResult.practiceSubtitle,
      practiceTimestamps: practiceResult.practiceTimestamps,

      exercises,

      summary: theoremResult.summary,
      reference: theoremResult.reference,

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
          isLegalTemplate: true,
          componentOrder: ["intro", "orientation", "lecture", "practice", "exercise", "theorem"]
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
    return "legal"; // Family ID
  }
}
