/**
 * Test Phase 4 Templates
 * Tests HRD, Legal, Short, and ShortQuiz family parsers
 */

import fs from 'fs';
import path from 'path';
import { parseTemplate, detectTemplateFormat, detectTemplateTheme } from './src/parsers/index.js';

// Test cases for Phase 4 templates
const testCases = [
  // HRD Family
  {
    name: "2026-hrd (AI 프롬프트)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/26hraipr/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/26hraipr/01/index.html",
    expectedTemplate: "2026-hrd",
    expectedTheme: "26hrd"
  },
  {
    name: "2024-hrd (Git)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/24hrdgit/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/24hrdgit/01/index.html",
    expectedTemplate: "2024-hrd",
    expectedTheme: "type-hrda"
  },
  // Legal Family
  {
    name: "2022-legal (성희롱)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/22mzgend/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/22mzgend/01/index.html",
    expectedTemplate: "2022-legal",
    expectedTheme: "gend"
  },
  // Short Family
  {
    name: "2022-ct (Spring)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24ctsping1/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24ctsping1/01/index.html",
    expectedTemplate: "2022-ct",
    expectedTheme: "type-1"
  },
  {
    name: "onboard-dunamu",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24onse4/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24onse4/01/index.html",
    expectedTemplate: "onboard-dunamu",
    expectedTheme: "type-gr19-3"
  },
  // ShortQuiz Family
  {
    name: "2026-hrc (장애인인식)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/26hrcdisa/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/26hrcdisa/01/index.html",
    expectedTemplate: "2026-hrc",
    expectedTheme: "26hrc"
  }
];

console.log("🚀 Testing Phase 4 Templates\n");
console.log("=" .repeat(80));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\n📝 Testing: ${testCase.name}`);
  console.log("-".repeat(80));

  try {
    // Check if files exist
    if (!fs.existsSync(testCase.dataPath)) {
      console.log(`⚠️  SKIP: data.json not found at ${testCase.dataPath}`);
      continue;
    }
    if (!fs.existsSync(testCase.htmlPath)) {
      console.log(`⚠️  SKIP: index.html not found at ${testCase.htmlPath}`);
      continue;
    }

    // Read files
    const dataJson = JSON.parse(fs.readFileSync(testCase.dataPath, 'utf-8'));
    const htmlContent = fs.readFileSync(testCase.htmlPath, 'utf-8');

    // Test template detection
    const detectedTemplate = detectTemplateFormat(dataJson, htmlContent);
    const detectedTheme = detectTemplateTheme(detectedTemplate, htmlContent);

    console.log(`  Template ID: ${detectedTemplate} (expected: ${testCase.expectedTemplate})`);
    console.log(`  Theme: ${detectedTheme} (expected: ${testCase.expectedTheme})`);

    // Verify detection
    let testPassed = true;
    if (detectedTemplate !== testCase.expectedTemplate) {
      console.log(`  ❌ Template detection failed!`);
      testPassed = false;
    }
    if (detectedTheme !== testCase.expectedTheme) {
      console.log(`  ❌ Theme detection failed!`);
      testPassed = false;
    }

    // Test parsing
    const contentModel = parseTemplate(dataJson, htmlContent, {}, 1);

    // Verify _meta field
    if (!contentModel._meta) {
      console.log(`  ❌ Missing _meta field!`);
      testPassed = false;
    } else {
      console.log(`  ✓ _meta.sourceTemplateId: ${contentModel._meta.sourceTemplateId}`);
      console.log(`  ✓ _meta.sourceTheme: ${contentModel._meta.sourceTheme}`);
      console.log(`  ✓ _meta.importedAt: ${contentModel._meta.importedAt}`);
    }

    // Verify sections
    if (contentModel._meta?.originalFormat?.sections) {
      console.log(`  ✓ Sections: ${JSON.stringify(contentModel._meta.originalFormat.sections)}`);
    }

    // Display parsed content summary
    console.log(`  ✓ Week ${contentModel.weekNumber}, Lesson ${contentModel.lessonNumber}`);
    if (contentModel.hasIntro) {
      console.log(`  ✓ Has intro`);
    }
    if (contentModel.hasOrientation) {
      console.log(`  ✓ Has orientation`);
    }
    if (contentModel.lectureVideoUrl) {
      console.log(`  ✓ Has lecture video`);
    }
    if (contentModel.hasPractice) {
      console.log(`  ✓ Has practice`);
    }
    if (contentModel.exercises && contentModel.exercises.length > 0) {
      console.log(`  ✓ Has ${contentModel.exercises.length} exercise(s)`);
    }

    if (testPassed) {
      console.log(`\n✅ PASSED`);
      passed++;
    } else {
      console.log(`\n❌ FAILED`);
      failed++;
    }

  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    console.log(error.stack);
    failed++;
  }
}

console.log("\n" + "=".repeat(80));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("\n🎉 ALL TESTS PASSED! 🎉\n");
  process.exit(0);
} else {
  console.log("\n❌ SOME TESTS FAILED\n");
  process.exit(1);
}
