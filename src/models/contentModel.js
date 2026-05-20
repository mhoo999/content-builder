/**
 * Content Model - Template-Agnostic Internal Representation
 *
 * This module defines the neutral internal content model used by the builder.
 * It is format-independent and supports round-trip conversion to/from various template formats.
 */

/**
 * Creates a new content model with metadata for round-trip compatibility
 *
 * @param {Object} options - Content and metadata options
 * @returns {Object} Content model with _meta field
 */
export const createContentModel = ({
  // Core identification
  weekNumber = 1,
  lessonNumber = 1,
  lessonTitle = "",
  sectionInWeek = 1,

  // Intro section
  hasIntro = true,
  intro = null,

  // Orientation (standard templates)
  hasOrientation = false,
  orientation = null,

  // Term check
  terms = [{ title: "", content: [""] }],
  termDescription = "",
  termScript = "",

  // Learning objectives
  learningContents = ["", "", ""],
  learningObjectives = ["", "", ""],
  objectivesDescription = "",
  objectivesScript = "",

  // Opinion & Check
  opinionQuestion = "",
  professorThink = "",
  checkDescription = "",
  checkScript = "",

  // Lecture
  lectureVideoUrl = "",
  lectureSubtitle = "",
  timestamps = [{ time: "0:00:04", title: "" }, { time: "0:00:00", title: "" }],

  // Practice (optional)
  hasPractice = false,
  practiceContent = "",
  practiceVideoUrl = "",
  practiceSubtitle = "",
  practiceTimestamps = [{ time: "0:00:04", title: "" }, { time: "0:00:00", title: "" }],

  // Exercise
  exercises = [{
    type: "boolean",
    question: "",
    answer: "2",
    options: [],
    commentary: ""
  }],

  // Summary
  summary = ["", "", ""],
  reference = "",

  // Additional files
  instructionUrl = "",
  guideUrl = "",

  // Professor info (for intro page)
  professor = null,

  // Metadata for round-trip compatibility
  _meta = {}
} = {}) => {
  return {
    // Core data
    weekNumber,
    lessonNumber,
    lessonTitle,
    sectionInWeek,

    // Components
    hasIntro,
    intro: intro || {
      media: "",
      professor: {
        name: "",
        photo: "",
        education: [""],
        career: [{ period: "", startDate: "", endDate: "", description: "" }]
      }
    },

    hasOrientation,
    orientation: orientation || {
      videoUrl: "",
      subtitlePath: ""
    },

    terms,
    termDescription,
    termScript,

    learningContents,
    learningObjectives,
    objectivesDescription,
    objectivesScript,

    opinionQuestion,
    professorThink,
    checkDescription,
    checkScript,

    lectureVideoUrl,
    lectureSubtitle,
    timestamps,

    hasPractice,
    practiceContent,
    practiceVideoUrl,
    practiceSubtitle,
    practiceTimestamps,

    exercises,
    summary,
    reference,

    instructionUrl,
    guideUrl,

    professor: professor || {
      name: "",
      photo: "",
      education: [""],
      career: [{ period: "", startDate: "", endDate: "", description: "" }]
    },

    // Metadata for round-trip compatibility
    _meta: {
      sourceTemplateId: _meta.sourceTemplateId || null,
      sourceTheme: _meta.sourceTheme || null,
      importedAt: _meta.importedAt || new Date().toISOString(),
      originalFormat: _meta.originalFormat || {},
      preservedFields: _meta.preservedFields || {},
      ..._meta
    }
  };
};

/**
 * Validates a content model structure
 *
 * @param {Object} content - Content model to validate
 * @returns {boolean} True if valid
 */
export const validateContentModel = (content) => {
  if (!content || typeof content !== 'object') return false;

  // Check required fields
  const requiredFields = [
    'weekNumber',
    'lessonNumber',
    'lessonTitle',
    'sectionInWeek'
  ];

  for (const field of requiredFields) {
    if (!(field in content)) return false;
  }

  // Check _meta field
  if (!content._meta || typeof content._meta !== 'object') return false;

  return true;
};

/**
 * Merges content model with preserved fields from original format
 *
 * @param {Object} content - Content model
 * @param {Object} preservedFields - Fields to preserve from original
 * @returns {Object} Merged content model
 */
export const mergePreservedFields = (content, preservedFields) => {
  return {
    ...content,
    _meta: {
      ...content._meta,
      preservedFields: {
        ...content._meta.preservedFields,
        ...preservedFields
      }
    }
  };
};

/**
 * Extracts metadata from content model
 *
 * @param {Object} content - Content model
 * @returns {Object} Metadata object
 */
export const extractMetadata = (content) => {
  return content._meta || {};
};

/**
 * Creates a practice week content model (image-only)
 *
 * @param {Object} options - Practice week options
 * @returns {Object} Practice week content model
 */
export const createPracticeWeekModel = ({
  lessonNumber = 1,
  weekNumber = 1,
  weekTitle = "",
  practiceImage = "",
  _meta = {}
} = {}) => {
  return {
    isPracticeWeek: true,
    lessonNumber,
    weekNumber,
    weekTitle,
    lessonTitle: "",
    sectionInWeek: 1,
    practiceImage,

    _meta: {
      sourceTemplateId: _meta.sourceTemplateId || null,
      sourceTheme: _meta.sourceTheme || null,
      importedAt: _meta.importedAt || new Date().toISOString(),
      originalFormat: _meta.originalFormat || {},
      preservedFields: _meta.preservedFields || {},
      ..._meta
    }
  };
};

/**
 * Component type constants for different template families
 */
export const COMPONENT_TYPES = {
  // Standard family components
  INTRO: 'intro',
  ORIENTATION: 'orientation',
  TERM: 'term',
  OBJECTIVES: 'objectives',
  OPINION: 'opinion',
  LECTURE: 'lecture',
  PRACTICE: 'practice',
  CHECK: 'check',
  EXERCISE: 'exercise',
  THEOREM: 'theorem',
  NEXT: 'next',

  // HRD family components
  EXERCISE_PRE: 'exercise_pre',
  EXERCISE_POST: 'exercise_post',

  // Additional types can be added as needed
};

/**
 * Section mappings for different template families
 */
export const SECTION_MAPPINGS = {
  STANDARD: ["인트로", "준비하기", "학습하기", "정리하기"],
  HRD: ["인트로", "준비하기", "학습하기", "정리하기"],
  LEGAL: ["인트로", "들어가기", "학습하기", "점검하기", "정리하기"],
  SHORT: ["학습하기"],
  SHORT_QUIZ: ["학습하기", "퀴즈"]
};
