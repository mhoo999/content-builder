/**
 * 강의계획서 마크다운 파서
 * 마크다운 테이블 형식의 강의계획서를 파싱하여 차시별 페이지를 자동 생성
 *
 * 문서 구조 (4열 테이블):
 * | 학습과정명 | 인터넷보안 |  |  |
 * | 주별 | 차시 | 수업 내용 | 과제 |
 * | 제 1 주 암호... | 1 | [내용 셀] | ... |
 * |  | 2 | [내용 셀] | ... |  ← 주별 셀 비어있음 (병합)
 */

// 원문자 매핑
const CIRCLED_NUMBERS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

/**
 * 마크다운에서 과정명 추출
 * "| 학습과정명 | 인터넷보안 |" 형식에서 추출
 * @param {string} markdown - 마크다운 텍스트
 * @returns {string} - 과정명 (찾지 못하면 빈 문자열)
 */
export function extractCourseName(markdown) {
  if (!markdown || typeof markdown !== 'string') return '';

  // "| 학습과정명 | 과정명 |" 형식에서 추출
  const tableMatch = markdown.match(/\|\s*학습과정명\s*\|\s*([^|]+)\s*\|/);
  if (tableMatch) {
    return tableMatch[1].trim();
  }

  // 대안: "| 과목명 | 인터넷보안 |" 또는 "| 교과목명 | 인터넷보안 |"
  const altMatch = markdown.match(/\|\s*(?:과목명|교과목명|교과목)\s*\|\s*([^|]+)\s*\|/);
  if (altMatch) {
    return altMatch[1].trim();
  }

  // 대안: 헤딩 형식 "# 과정명"
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^#\s+(.+)$/);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
    // 테이블 시작 전까지만 검색
    if (trimmed.startsWith('|')) {
      break;
    }
  }

  return '';
}

/**
 * 원문자가 포함된 텍스트를 배열로 분리
 * "①항목1②항목2③항목3" → ["항목1", "항목2", "항목3"]
 * @param {string} text - 원문자 포함 텍스트
 * @returns {string[]} - 분리된 항목 배열
 */
export function parseCircledNumbers(text) {
  if (!text || typeof text !== 'string') return [];

  const trimmed = text.trim();
  if (!trimmed) return [];

  // 원문자 정규식
  const circledPattern = /[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/;

  // 원문자가 없으면 전체 텍스트를 하나의 항목으로
  if (!circledPattern.test(trimmed)) {
    return trimmed ? [trimmed] : [];
  }

  // 원문자로 분리
  const parts = trimmed.split(/[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/);

  // 빈 문자열 제거하고 트림
  return parts
    .map(part => part.trim())
    .filter(part => part.length > 0);
}

/**
 * 주차 헤더 파싱
 * @param {string} weekText - "제 1 주 암호 기술 개요" 또는 "제 8 주 중간고사"
 * @returns {{ weekNumber: number, weekTitle: string } | null}
 */
export function parseWeekHeader(weekText) {
  if (!weekText || typeof weekText !== 'string') return null;

  const trimmed = weekText.trim();

  // "제 N 주" 패턴 매칭 (공백 유동적)
  const match = trimmed.match(/제\s*(\d+)\s*주\s*(.*)/);
  if (!match) return null;

  return {
    weekNumber: parseInt(match[1], 10),
    weekTitle: match[2].trim() || ''
  };
}

/**
 * 시험 주차 감지
 * @param {string} weekText - 주차 텍스트
 * @returns {boolean}
 */
export function isExamWeek(weekText) {
  if (!weekText) return false;

  const examKeywords = ['중간고사', '기말고사', '중간시험', '기말시험', '시험'];
  return examKeywords.some(keyword => weekText.includes(keyword));
}

/**
 * 내용 셀 파싱 (핵심 함수)
 *
 * 일반형:
 * 1) 강의제목: 암호학의 기본 개념
 * 2) 강의주제: ① 암호에 사용하는 용어 ② 암호화/복호화
 * 3) 강의내용(학습목표): ① 암호에 사용하는 용어를 구분할 수 있다.
 *
 * 실습 포함형:
 * 1) 강의제목: 컴퓨터 통신과 인터넷
 * 2) 강의주제: ① 컴퓨터 통신 개념 ② 통신 시스템의 기본 구성
 * 3) 실습: ① 내 컴퓨터 IP 주소 확인하기
 * 4) 강의내용(학습목표): ① 컴퓨터 통신의 개념과 특성을 설명할 수 있다.
 *
 * @param {string} content - 내용 셀 텍스트
 * @returns {{ title: string, topics: string[], practice: string[], objectives: string[] }}
 */
export function parseContentCell(content) {
  if (!content || typeof content !== 'string') {
    return { title: '', topics: [], practice: [], objectives: [] };
  }

  // 이스케이프 문자 제거 (마크다운에서 괄호 이스케이프)
  const cleaned = content.replace(/\\([()])/g, '$1');

  // 1) 강의제목: 추출
  const titleMatch = cleaned.match(/1\)\s*강의제목\s*:\s*(.+?)(?=2\)|$)/s);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // 2) 강의주제: 추출
  const topicMatch = cleaned.match(/2\)\s*강의주제\s*:\s*(.+?)(?=3\)|$)/s);
  const topics = parseCircledNumbers(topicMatch ? topicMatch[1] : '');

  // 3) 실습: 또는 3) 강의내용(학습목표): 확인
  let practice = [];
  let objectives = [];

  const practiceMatch = cleaned.match(/3\)\s*실습\s*:\s*(.+?)(?=4\)|$)/s);
  if (practiceMatch) {
    practice = parseCircledNumbers(practiceMatch[1]);
    // 4) 강의내용(학습목표):
    const objMatch = cleaned.match(/4\)\s*강의내용\s*\(?\s*학습목표\s*\)?\s*:\s*(.+?)$/s);
    objectives = parseCircledNumbers(objMatch ? objMatch[1] : '');
  } else {
    // 3) 강의내용(학습목표):
    const objMatch = cleaned.match(/3\)\s*강의내용\s*\(?\s*학습목표\s*\)?\s*:\s*(.+?)$/s);
    objectives = parseCircledNumbers(objMatch ? objMatch[1] : '');
  }

  return { title, topics, practice, objectives };
}

/**
 * 테이블 구분선 여부 확인
 * 구분선은 | --- | --- | 또는 |:---:|:---:| 형태 (반드시 - 또는 : 포함)
 * |  | 2 | 같은 빈 셀은 구분선이 아님
 * @param {string} row - 테이블 행
 * @returns {boolean}
 */
function isTableSeparator(row) {
  const trimmed = row.trim();
  // 구분선은 반드시 - 를 포함해야 함
  if (!trimmed.includes('-')) return false;
  // | 로 시작하고 | 로 끝나며, 내용이 공백, -, : 만으로 구성
  return /^\|[\s\-:|]+\|$/.test(trimmed);
}

/**
 * 헤더 행 여부 확인 (주별, 차시, 수업 내용 등)
 * 첫 번째 셀이 "주별"인 경우만 헤더로 판단
 * @param {string} row - 테이블 행
 * @returns {boolean}
 */
function isHeaderRow(row) {
  const cells = row.split('|').slice(1, -1).map(c => c.trim());
  if (cells.length < 2) return false;

  const firstCell = cells[0].toLowerCase();
  const secondCell = cells[1].toLowerCase();

  // 첫 번째 셀이 "주별" 또는 "주차"이고, 두 번째 셀이 "차시"인 경우 헤더
  return (firstCell === '주별' || firstCell === '주차') && secondCell === '차시';
}

/**
 * 메타데이터 행 여부 확인 (학습과정명, ■ 주차별 등)
 * @param {string} row - 테이블 행
 * @returns {boolean}
 */
function isMetadataRow(row) {
  return row.includes('학습과정명') ||
         row.includes('■') ||
         row.includes('주차별 수업');
}

/**
 * 강의계획서 마크다운 파싱
 * @param {string} markdown - 마크다운 텍스트
 * @returns {ParsedSyllabus}
 */
export function parseSyllabusMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return {
      documentType: 'general',
      hasPractice: false,
      courseName: '',
      rows: [],
      examWeeks: [],
      totalLessons: 0,
      totalWeeks: 0
    };
  }

  // 과정명 추출
  const courseName = extractCourseName(markdown);

  const lines = markdown.split('\n').filter(line => line.trim());

  // 테이블 행만 추출
  const tableLines = lines.filter(line => line.includes('|'));
  if (tableLines.length < 3) {
    return {
      documentType: 'general',
      hasPractice: false,
      courseName,
      rows: [],
      examWeeks: [],
      totalLessons: 0,
      totalWeeks: 0
    };
  }

  const rows = [];
  const examWeeks = [];
  let previousWeekInfo = null;
  let currentSessionNumber = 0;
  let hasPractice = false;

  // 모든 테이블 행 파싱
  for (const line of tableLines) {
    // 메타데이터, 헤더, 구분선 건너뛰기
    if (isMetadataRow(line) || isHeaderRow(line) || isTableSeparator(line)) {
      continue;
    }

    // 4열 테이블 파싱: | 주별 | 차시 | 내용 | 과제 |
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 3) continue;

    const weekCell = cells[0] || '';  // 주차 ("제 1 주 암호 기술 개요" 또는 빈 문자열)
    const sessionCell = cells[1] || '';  // 차시 번호 ("1" 또는 "2")
    const contentCell = cells[2] || '';  // 내용 셀 (파싱 대상)
    // cells[3]: 과제 (무시)

    // 차시 번호 확인 (숫자가 아니면 데이터 행이 아님)
    const sessionNum = parseInt(sessionCell, 10);
    if (isNaN(sessionNum)) continue;

    // 주차 정보 파싱
    let weekInfo;
    if (weekCell.trim()) {
      weekInfo = parseWeekHeader(weekCell);
      if (weekInfo) {
        previousWeekInfo = weekInfo;

        // 시험 주차 체크
        if (isExamWeek(weekInfo.weekTitle)) {
          examWeeks.push({
            weekNumber: weekInfo.weekNumber,
            weekTitle: weekInfo.weekTitle
          });
          continue; // 시험 주차는 건너뜀
        }
      }
    } else {
      // 병합 셀: 이전 주차 정보 상속
      weekInfo = previousWeekInfo;
    }

    if (!weekInfo) continue;

    // 시험 주차면 건너뛰기
    if (isExamWeek(weekInfo.weekTitle)) continue;

    currentSessionNumber++;

    // 내용 셀 파싱
    const parsed = parseContentCell(contentCell);

    // 실습 내용이 있으면 플래그 설정
    if (parsed.practice && parsed.practice.length > 0) {
      hasPractice = true;
    }

    rows.push({
      weekNumber: weekInfo.weekNumber,
      weekTitle: weekInfo.weekTitle,
      sessionNumber: currentSessionNumber,
      sessionInWeek: sessionNum,  // 주차 내 차시 번호 (1 또는 2)
      lectureTitle: parsed.title,
      learningContents: parsed.topics,
      learningObjectives: parsed.objectives,
      practiceContent: parsed.practice
    });
  }

  // 통계 계산
  const weekNumbers = [...new Set(rows.map(r => r.weekNumber))];

  return {
    documentType: hasPractice ? 'practice-included' : 'general',
    hasPractice,
    courseName,
    rows,
    examWeeks,
    totalLessons: rows.length,
    totalWeeks: weekNumbers.length
  };
}

/**
 * 파싱된 강의계획서를 레슨 구조로 변환
 * @param {ParsedSyllabus} syllabus - 파싱된 강의계획서
 * @param {object} options - 변환 옵션
 * @returns {LessonStructure[]}
 */
export function convertToLessonStructure(syllabus, options = {}) {
  if (!syllabus || !syllabus.rows) return [];

  return syllabus.rows.map((row, index) => ({
    lessonNumber: index + 1,
    weekNumber: row.weekNumber,
    weekTitle: row.weekTitle,
    sessionInWeek: row.sessionInWeek,
    title: row.lectureTitle || `${row.weekNumber}주차 ${row.sessionInWeek || (index + 1)}차시`,
    learningContents: row.learningContents,
    learningObjectives: row.learningObjectives,
    practiceContent: row.practiceContent,
    hasPractice: row.practiceContent && row.practiceContent.length > 0
  }));
}

/**
 * @typedef {Object} ParsedRow
 * @property {number} weekNumber
 * @property {string} weekTitle
 * @property {number} sessionNumber
 * @property {number} sessionInWeek - 주차 내 차시 번호 (1 또는 2)
 * @property {string} lectureTitle
 * @property {string[]} learningContents
 * @property {string[]} learningObjectives
 * @property {string[]} practiceContent
 */

/**
 * @typedef {Object} ExamWeek
 * @property {number} weekNumber
 * @property {string} weekTitle
 */

/**
 * @typedef {Object} ParsedSyllabus
 * @property {'general' | 'practice-included'} documentType
 * @property {boolean} hasPractice
 * @property {string} courseName
 * @property {ParsedRow[]} rows
 * @property {ExamWeek[]} examWeeks
 * @property {number} totalLessons
 * @property {number} totalWeeks
 */

/**
 * @typedef {Object} LessonStructure
 * @property {number} lessonNumber
 * @property {number} weekNumber
 * @property {string} weekTitle
 * @property {number} sessionInWeek
 * @property {string} title
 * @property {string[]} learningContents
 * @property {string[]} learningObjectives
 * @property {string[]} practiceContent
 * @property {boolean} hasPractice
 */

export default {
  parseCircledNumbers,
  parseWeekHeader,
  isExamWeek,
  extractCourseName,
  parseContentCell,
  parseSyllabusMarkdown,
  convertToLessonStructure
};
