#!/usr/bin/env node
/**
 * 배치 round-trip 테스트
 * Usage: npm run test:round-trip [-- --source <path> --target <path>]
 *
 * Example:
 *   npm run test:round-trip
 *   npm run test:round-trip -- --source ~/Downloads/cb_test --target ~/IdeaProjects/contents_it/subjects
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 기본 경로
const DEFAULT_SOURCE = path.join(process.env.HOME, 'Downloads', 'cb_test');
const DEFAULT_TARGET = path.join(process.env.HOME, 'IdeaProjects', 'contents_it', 'subjects');
const TEMP_DIR = '/tmp/round-trip-test';

/**
 * 명령어 실행 (출력 포함)
 */
async function execCommand(command, cwd = process.cwd()) {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd, maxBuffer: 10 * 1024 * 1024 });
    return { stdout, stderr, success: true };
  } catch (error) {
    return { stdout: error.stdout || '', stderr: error.stderr || '', success: false, error };
  }
}

/**
 * Python 스크립트 실행 (실시간 출력)
 */
function runPythonScript(scriptPath, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [scriptPath, ...args], { cwd });

    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

/**
 * 과목 폴더 목록 가져오기
 */
async function getCourseFolders(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const folders = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderPath = path.join(sourceDir, entry.name);
      const subjectsJsonPath = path.join(folderPath, 'subjects.json');

      // subjects.json이 있는 폴더만 과목으로 간주
      if (fsSync.existsSync(subjectsJsonPath)) {
        folders.push({
          code: entry.name,
          path: folderPath,
        });
      }
    }
  }

  return folders.sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Git diff 분석
 */
async function analyzeGitDiff(targetDir, courseCode) {
  const coursePath = path.join(targetDir, courseCode);

  // git diff --stat
  const statResult = await execCommand(`git diff --stat ${courseCode}/`, targetDir);
  const stats = statResult.stdout.trim();

  // git diff --name-only
  const filesResult = await execCommand(`git diff --name-only ${courseCode}/`, targetDir);
  const changedFiles = filesResult.stdout.trim().split('\n').filter(Boolean);

  // git diff (전체 변경 내용)
  const diffResult = await execCommand(`git diff ${courseCode}/`, targetDir);
  const fullDiff = diffResult.stdout;

  // 변경 분석
  if (changedFiles.length === 0) {
    return {
      status: 'PASS',
      changedFiles: [],
      stats: '',
      fullDiff: '',
      message: '변경 사항 없음',
    };
  }

  // 공백/줄바꿈만 변경되었는지 확인
  const contentChanges = fullDiff.match(/^[+-](?![+-])/gm) || [];
  const onlyWhitespaceChanges = contentChanges.every((line) => {
    const trimmed = line.substring(1).trim();
    return trimmed === '' || /^[\s\t]+$/.test(line.substring(1));
  });

  if (onlyWhitespaceChanges && contentChanges.length > 0) {
    return {
      status: 'WARN',
      changedFiles,
      stats,
      fullDiff,
      message: '공백/포맷 차이만 있음',
    };
  }

  return {
    status: 'FAIL',
    changedFiles,
    stats,
    fullDiff,
    message: '콘텐츠 변경 발생',
  };
}

/**
 * 단일 과목 테스트
 */
async function testCourse(course, tempDir, targetDir, projectRoot) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 과목: ${course.code}`);
  console.log(`${'='.repeat(60)}`);

  const builderJsonPath = path.join(tempDir, `${course.code}_builder.json`);
  const importScript = path.join(projectRoot, 'cli', 'import.cjs');
  const exportScript = path.join(projectRoot, 'builder_to_subjects.py');

  try {
    // 1. Import: subjects → Builder JSON
    console.log(`\n1️⃣ Import 시작...`);
    const { importCourse } = require(importScript);
    await importCourse(course.path, builderJsonPath);

    // 2. Export: Builder JSON → subjects
    console.log(`\n2️⃣ Export 시작...`);
    await runPythonScript(exportScript, [builderJsonPath, targetDir], projectRoot);

    // 3. Git diff 분석
    console.log(`\n3️⃣ Git diff 분석...`);
    const gitParentDir = path.dirname(targetDir);
    const diffResult = await analyzeGitDiff(gitParentDir, course.code);

    return {
      courseCode: course.code,
      ...diffResult,
    };
  } catch (error) {
    console.error(`❌ 테스트 실패: ${error.message}`);
    return {
      courseCode: course.code,
      status: 'ERROR',
      changedFiles: [],
      stats: '',
      fullDiff: '',
      message: error.message,
    };
  }
}

/**
 * 결과 리포트 출력
 */
function printReport(results) {
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 Round-Trip Test 결과');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'PASS');
  const warned = results.filter((r) => r.status === 'WARN');
  const failed = results.filter((r) => r.status === 'FAIL');
  const errors = results.filter((r) => r.status === 'ERROR');

  console.log(`\n총 ${results.length}개 과목 테스트`);
  console.log(`  ✅ PASS:  ${passed.length}개`);
  console.log(`  ⚠️  WARN:  ${warned.length}개`);
  console.log(`  ❌ FAIL:  ${failed.length}개`);
  console.log(`  🔴 ERROR: ${errors.length}개`);

  // PASS
  if (passed.length > 0) {
    console.log(`\n✅ PASS (${passed.length}개):`);
    passed.forEach((r) => {
      console.log(`  - ${r.courseCode}: ${r.message}`);
    });
  }

  // WARN
  if (warned.length > 0) {
    console.log(`\n⚠️ WARN (${warned.length}개):`);
    warned.forEach((r) => {
      console.log(`  - ${r.courseCode}: ${r.message}`);
      console.log(`    변경된 파일: ${r.changedFiles.length}개`);
      if (r.stats) {
        console.log(`    ${r.stats.split('\n').join('\n    ')}`);
      }
    });
  }

  // FAIL
  if (failed.length > 0) {
    console.log(`\n❌ FAIL (${failed.length}개):`);
    failed.forEach((r) => {
      console.log(`  - ${r.courseCode}: ${r.message}`);
      console.log(`    변경된 파일: ${r.changedFiles.length}개`);
      if (r.stats) {
        console.log(`    ${r.stats.split('\n').join('\n    ')}`);
      }
    });
  }

  // ERROR
  if (errors.length > 0) {
    console.log(`\n🔴 ERROR (${errors.length}개):`);
    errors.forEach((r) => {
      console.log(`  - ${r.courseCode}: ${r.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // 상세 로그 파일 저장
  const logPath = path.join(process.cwd(), 'round-trip-test-results.json');
  fsSync.writeFileSync(logPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📝 상세 결과 저장: ${logPath}`);
}

/**
 * 메인 실행
 */
async function main() {
  // 명령줄 인자 파싱
  const args = process.argv.slice(2);
  let sourceDir = DEFAULT_SOURCE;
  let targetDir = DEFAULT_TARGET;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      sourceDir = path.resolve(args[i + 1].replace(/^~/, process.env.HOME));
      i++;
    } else if (args[i] === '--target' && args[i + 1]) {
      targetDir = path.resolve(args[i + 1].replace(/^~/, process.env.HOME));
      i++;
    }
  }

  console.log('🚀 Round-Trip Test 시작\n');
  console.log(`📂 Source: ${sourceDir}`);
  console.log(`📂 Target: ${targetDir}`);

  // 경로 검증
  if (!fsSync.existsSync(sourceDir)) {
    console.error(`❌ Source 경로가 존재하지 않습니다: ${sourceDir}`);
    process.exit(1);
  }

  if (!fsSync.existsSync(targetDir)) {
    console.error(`❌ Target 경로가 존재하지 않습니다: ${targetDir}`);
    process.exit(1);
  }

  // Temp 디렉토리 생성
  await fs.mkdir(TEMP_DIR, { recursive: true });
  console.log(`📁 Temp: ${TEMP_DIR}`);

  // 프로젝트 루트 디렉토리
  const projectRoot = path.resolve(__dirname, '..');

  // 과목 폴더 스캔
  console.log(`\n🔍 과목 폴더 스캔 중...`);
  const courses = await getCourseFolders(sourceDir);
  console.log(`✅ 발견된 과목: ${courses.length}개`);

  if (courses.length === 0) {
    console.log('⚠️ 테스트할 과목이 없습니다.');
    process.exit(0);
  }

  courses.forEach((c) => console.log(`  - ${c.code}`));

  // 각 과목 테스트
  const results = [];
  for (const course of courses) {
    const result = await testCourse(course, TEMP_DIR, targetDir, projectRoot);
    results.push(result);
  }

  // 결과 리포트
  printReport(results);

  // 종료 코드
  const hasFailed = results.some((r) => r.status === 'FAIL' || r.status === 'ERROR');
  process.exit(hasFailed ? 1 : 0);
}

// 실행
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 실행 실패:', error);
    process.exit(1);
  });
}

module.exports = { main };
