/**
 * Comprehensive Test for All 13 Templates
 * Tests all 5 template families (Standard, HRD, Legal, Short, ShortQuiz)
 */

import fs from 'fs';
import path from 'path';
import { parseTemplate, detectTemplateFormat, detectTemplateTheme } from './src/parsers/index.js';

// Test cases for all 13 templates
const testCases = [
  // Standard Family (7 templates)
  {
    family: "Standard",
    name: "2018-standard (Type-1 블루)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/18itdaba/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/18itdaba/01/index.html",
    expectedTemplate: "2018-standard",
    expectedTheme: "type-1"
  },
  {
    family: "Standard",
    name: "2019-standard (Type-1 블루)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/19itmult/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/19itmult/01/index.html",
    expectedTemplate: "2019-standard",
    expectedTheme: "type-1"
  },
  {
    family: "Standard",
    name: "2020-standard (Type-1)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/23itdeve/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/23itdeve/01/index.html",
    expectedTemplate: "2020-standard",
    expectedTheme: "type-1"
  },
  {
    family: "Standard",
    name: "2021-standard (Type-1)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24itPinpr/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24itPinpr/01/index.html",
    expectedTemplate: "2021-standard",
    expectedTheme: "type-1"
  },
  {
    family: "Standard",
    name: "2022-standard (Type-1 블루)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/22itPjapr/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/22itPjapr/01/index.html",
    expectedTemplate: "2022-standard",
    expectedTheme: "type-1"
  },
  {
    family: "Standard",
    name: "2023-standard (Type-1 블루)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/23itment/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/23itment/01/index.html",
    expectedTemplate: "2023-standard",
    expectedTheme: "type-1"
  },
  {
    family: "Standard",
    name: "2025-standard (Type-1 네이비)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/25itPpypr/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/25itPpypr/01/index.html",
    expectedTemplate: "2025-standard",
    expectedTheme: "type-1"
  },

  // HRD Family (2 templates)
  {
    family: "HRD",
    name: "2024-hrd (Git)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/24hrdgit/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/24hrdgit/01/index.html",
    expectedTemplate: "2024-hrd",
    expectedTheme: "type-hrda"
  },
  {
    family: "HRD",
    name: "2026-hrd (AI 프롬프트)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/26hraipr/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/26hraipr/01/index.html",
    expectedTemplate: "2026-hrd",
    expectedTheme: "26hrd"
  },

  // Legal Family (1 template)
  {
    family: "Legal",
    name: "2022-legal (성희롱)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/22mzgend/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/22mzgend/01/index.html",
    expectedTemplate: "2022-legal",
    expectedTheme: "gend"
  },

  // Short Family (2 templates)
  {
    family: "Short",
    name: "2022-ct (Spring)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24ctsping1/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24ctsping1/01/index.html",
    expectedTemplate: "2022-ct",
    expectedTheme: "type-1"
  },
  {
    family: "Short",
    name: "onboard-dunamu",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24onse4/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/24onse4/01/index.html",
    expectedTemplate: "onboard-dunamu",
    expectedTheme: "type-gr19-3"
  },

  // ShortQuiz Family (1 template)
  {
    family: "ShortQuiz",
    name: "2026-hrc (장애인인식)",
    dataPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/26hrcdisa/01/assets/data/data.json",
    htmlPath: "/Users/mz01-badjyonin/IdeaProjects/contents_ehrd/subjects/26hrcdisa/01/index.html",
    expectedTemplate: "2026-hrc",
    expectedTheme: "26hrc"
  }
];

console.log("🚀 Comprehensive Test for All 13 Templates");
console.log("Testing 5 Template Families\n");
console.log("=" .repeat(80));

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  byFamily: {}
};

for (const testCase of testCases) {
  results.total++;

  if (!results.byFamily[testCase.family]) {
    results.byFamily[testCase.family] = { total: 0, passed: 0, failed: 0, skipped: 0 };
  }
  results.byFamily[testCase.family].total++;

  console.log(`\n📝 [${testCase.family}] ${testCase.name}`);
  console.log("-".repeat(80));

  try {
    // Check if files exist
    if (!fs.existsSync(testCase.dataPath)) {
      console.log(`  ⚠️  SKIP: data.json not found`);
      results.skipped++;
      results.byFamily[testCase.family].skipped++;
      continue;
    }
    if (!fs.existsSync(testCase.htmlPath)) {
      console.log(`  ⚠️  SKIP: index.html not found`);
      results.skipped++;
      results.byFamily[testCase.family].skipped++;
      continue;
    }

    // Read files
    const dataJson = JSON.parse(fs.readFileSync(testCase.dataPath, 'utf-8'));
    const htmlContent = fs.readFileSync(testCase.htmlPath, 'utf-8');

    // Test template detection
    const detectedTemplate = detectTemplateFormat(dataJson, htmlContent);
    const detectedTheme = detectTemplateTheme(detectedTemplate, htmlContent);

    console.log(`  Template: ${detectedTemplate} (expected: ${testCase.expectedTemplate})`);
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
    }

    // Verify sections
    if (contentModel._meta?.originalFormat?.sections) {
      console.log(`  ✓ Sections: ${JSON.stringify(contentModel._meta.originalFormat.sections)}`);
    }

    // Display component summary
    const components = [];
    if (contentModel.hasIntro) components.push('intro');
    if (contentModel.hasOrientation) components.push('orientation');
    if (contentModel.terms?.[0]?.title) components.push('term');
    if (contentModel.learningObjectives?.[0]) components.push('objectives');
    if (contentModel.opinionQuestion) components.push('opinion');
    if (contentModel.lectureVideoUrl) components.push('lecture');
    if (contentModel.hasPractice) components.push('practice');
    if (contentModel.professorThink) components.push('check');
    if (contentModel.exercises?.[0]?.question) components.push('exercise');
    if (contentModel.summary?.[0]) components.push('theorem');

    console.log(`  ✓ Components: [${components.join(', ')}]`);

    if (testPassed) {
      console.log(`  ✅ PASSED`);
      results.passed++;
      results.byFamily[testCase.family].passed++;
    } else {
      console.log(`  ❌ FAILED`);
      results.failed++;
      results.byFamily[testCase.family].failed++;
    }

  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    results.failed++;
    results.byFamily[testCase.family].failed++;
  }
}

// Print summary
console.log("\n" + "=".repeat(80));
console.log("\n📊 Test Summary\n");

console.log("By Family:");
for (const [family, stats] of Object.entries(results.byFamily)) {
  const status = stats.failed === 0 && stats.skipped === 0 ? "✅" : (stats.failed > 0 ? "❌" : "⚠️");
  console.log(`  ${status} ${family}: ${stats.passed}/${stats.total} passed, ${stats.failed} failed, ${stats.skipped} skipped`);
}

console.log(`\nOverall: ${results.passed}/${results.total} passed, ${results.failed} failed, ${results.skipped} skipped`);

if (results.failed === 0 && results.skipped === 0) {
  console.log("\n🎉 ALL 13 TEMPLATES WORKING PERFECTLY! 🎉\n");
  process.exit(0);
} else if (results.failed === 0) {
  console.log("\n✅ All available templates passed (some skipped)\n");
  process.exit(0);
} else {
  console.log("\n❌ SOME TESTS FAILED\n");
  process.exit(1);
}
