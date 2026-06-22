import archiver from 'archiver';
import { Readable } from 'stream';
import crypto from 'crypto';

// 템플릿 프리셋 정의
const TEMPLATE_PRESETS = {
  "2018-standard": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/2018/base.css">

	<link rel="stylesheet" href="../../../resources/scripts/videojs/video-js.min.css">

	<link rel="stylesheet" href="../../../resources/styles/2018/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2018/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/mediaquery.css">

	<link rel="stylesheet" href="../../../resources/styles/2018/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/templates/layout.js"></script>
	<script src="../../../resources/scripts/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/commons.js"></script>`,
    components: ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
  },
  "2019-standard": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/2019/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2019/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2019/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2019/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2019/templates/layout.js"></script>
	<script src="../../../resources/scripts/2019/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2019/commons.js"></script>`,
    components: ["intro", "orientation", "term", "objectives", "opinion", "lecture", "practice", "check", "exercise", "theorem", "next"]
  },
  "2020-standard": {
    html_head: `	<link rel="stylesheet" href="../../../resources/scripts/videojs/video-js.min.css">

	<link rel="stylesheet" href="../../../resources/styles/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2020/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2020/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2020/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2020/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2019/templates/layout.js"></script>
	<script src="../../../resources/scripts/2019/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2019/commons.js"></script>`,
    components: ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
  },
  "2021-standard": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/2021/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2021/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2021/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2021/templates/layout.js"></script>
	<script src="../../../resources/scripts/2021/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2021/commons.js"></script>`,
    components: ["intro", "orientation", "term", "objectives", "opinion", "lecture", "practice", "check", "exercise", "theorem", "next"]
  },
  "2022-standard": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/2022/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2022/templates/layout.js"></script>
	<script src="../../../resources/scripts/2022/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2022/commons.js"></script>`,
    components: ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
  },
  "2023-standard": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/2023/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2025/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2023/templates/layout.js"></script>
	<script src="../../../resources/scripts/2023/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2023/commons.js"></script>`,
    components: ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
  },
  "2025-standard": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/2023/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2025/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2025/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2023/templates/layout.js"></script>
	<script src="../../../resources/scripts/2023/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2023/commons.js"></script>`,
    components: ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
  },
  "2022-ct": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/2022/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/layout_ct.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2022/templates/layout_ct.js"></script>
	<script src="../../../resources/scripts/2022/templates/defaults_ct.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2022/commons_ct.js"></script>`,
    components: ["lecture"]
  },
  "onboard-dunamu": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/base-gr19.css">
	<link rel="stylesheet" href="../../../resources/styles/layout-dunamu21.css">
	<link rel="stylesheet" href="../../../resources/styles/modules-gr25.css">
	<link rel="stylesheet" href="../../../resources/styles/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/templates/layout-summary.js"></script>
	<script src="../../../resources/scripts/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/commons.js"></script>`,
    components: ["lecture"]
  },
  "2024-hrd": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/base-gr19.css">
	<link rel="stylesheet" href="../../../resources/styles/2024/layout-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2024/modules-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2024/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2024/templates/layout-hrd.js"></script>
	<script src="../../../resources/scripts/2024/templates/defaults-hrd.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2024/commons_hrd.js"></script>`,
    components: ["intro", "exercise_pre", "objectives", "lecture", "exercise_post", "theorem", "next"]
  },
  "2026-hrd": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/base-gr19.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/layout-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/modules-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2026/templates/layout-hrd.js"></script>
	<script src="../../../resources/scripts/2026/templates/defaults-hrd.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2026/commons.js"></script>`,
    components: ["intro", "objectives", "exercise_pre", "lecture", "exercise_post", "theorem", "next"]
  },
  "2022-legal": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/base.css">
	<link rel="stylesheet" href="../../../resources/styles/layout-legal.css">
	<link rel="stylesheet" href="../../../resources/styles/modules-legal.css">
	<link rel="stylesheet" href="../../../resources/styles/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/templates/layout.js"></script>
	<script src="../../../resources/scripts/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/commons.js"></script>`,
    components: ["intro", "orientation", "lecture", "practice", "exercise", "theorem"]
  },
  "2026-hrc": {
    html_head: `	<link rel="stylesheet" href="../../../resources/styles/base-gr19.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/layout-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/modules-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/{theme}.css">`,
    html_head_scripts: `	<script src="../../../resources/scripts/2026/templates/layout-hrd.js"></script>
	<script src="../../../resources/scripts/2026/templates/defaults-hrd.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>`,
    html_body_scripts: `	<script src="../../../resources/scripts/2026/commons.js"></script>`,
    components: ["lecture", "exercise"]
  }
};

// 레거시 JSON 직렬화 (2018 템플릿용)
function legacyJsonDumps(obj, useSpaceSeparator = true) {
  const separator = useSpaceSeparator ? ' : ' : ': ';

  function serializeValue(value, level = 0) {
    const indent = '\t'.repeat(level);
    const nextIndent = '\t'.repeat(level + 1);

    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }
    if (Array.isArray(value)) {
      if (value.every(item => typeof item === 'string') && value.length <= 4) {
        const items = value.map(item => serializeValue(item, 0)).join(', ');
        return `[${items}]`;
      }
      if (value.length === 0) return '[]';
      const items = value.map(item => `${nextIndent}${serializeValue(item, level + 1)}`);
      return '[\n' + items.join(',\n') + `\n${indent}]`;
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      const items = keys.map(key => {
        const val = serializeValue(value[key], level + 1);
        return `${nextIndent}"${key}"${separator}${val}`;
      });
      return '{\n' + items.join(',\n') + `\n${indent}}`;
    }
    return 'null';
  }

  return serializeValue(obj);
}

// HTML 정리 함수
function cleanHtmlForExport(htmlContent) {
  if (!htmlContent) return htmlContent;

  // data-original-src가 있으면 src를 교체
  htmlContent = htmlContent.replace(
    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)data-original-src=["']([^"']+)["']([^>]*)>/g,
    (match, before, src, middle, originalSrc, after) => {
      return `<img${before}src='${originalSrc}'${middle}${after}>`;
    }
  );

  // notion-image 클래스 제거
  htmlContent = htmlContent.replace(
    /<img[^>]*class=["']notion-image["'][^>]*>/g,
    (match) => {
      const srcMatch = match.match(/src=["']([^"']*)["']/);
      if (srcMatch) {
        return `<img src='${srcMatch[1]}' alt='' />`;
      }
      return match;
    }
  );

  // 실습 항목 변환
  htmlContent = htmlContent.replace(
    /<ul[^>]*class=['"]practice['"][^>]*>.*?<\/ul>/gs,
    (match) => {
      let content = match;
      content = content.replace(/<li[^>]*>(.*?)<\/li>/gs, (liMatch, liContent) => {
        let cleaned = liContent;
        while (cleaned.includes('<p>')) {
          cleaned = cleaned.replace(/<p>(.*?)<\/p>/gs, '$1');
        }
        cleaned = cleaned.replace(/<p><\/p>/g, '').trim();
        return `<li>${cleaned}</li>`;
      });
      content = content.replace(/<ul[^>]*class=['"]practice['"][^>]*>/, "<div class='practice'><ul>");
      content = content.replace('</ul>', '</ul></div>');
      return content;
    }
  );

  // 체크 불릿 변환
  htmlContent = htmlContent.replace(
    /<ul[^>]*class=["']check-bullet["'][^>]*>.*?<\/ul>/gs,
    (match) => {
      const liMatches = match.match(/<li[^>]*>(.*?)<\/li>/gs) || [];
      const pTags = liMatches.map(li => {
        let content = li.replace(/<li[^>]*>(.*?)<\/li>/s, '$1').trim();
        content = content.replace(/^\s*<p>(.*?)<\/p>\s*$/s, '$1');
        if (content.startsWith('✓')) {
          return `<p>${content}</p>`;
        }
        return `<p>✓ ${content}</p>`;
      });
      return pTags.join('');
    }
  );

  // H3 -> OL 변환
  let h3Counter = 0;
  htmlContent = htmlContent.replace(/<h3>(.*?)<\/h3>/gs, (match, content) => {
    const trimmed = content.trim();
    if (/^\d+\)\s/.test(trimmed)) {
      return `<ol style='color:#000;margin-bottom: 4px;'>${trimmed}</ol>`;
    }
    h3Counter++;
    return `<ol style='color:#000;margin-bottom: 4px;'>${h3Counter}) ${trimmed}</ol>`;
  });

  // 큰따옴표를 작은따옴표로 변환
  htmlContent = htmlContent.replace(
    /(<[^>]*?)\s+([a-zA-Z-]+)="([^"]*?)"/g,
    "$1 $2='$3'"
  );

  return htmlContent;
}

// 이미지 저장 및 경로 변환
function processImages(htmlContent, courseCode, imageCounter, imageCache, images) {
  if (!htmlContent) return htmlContent;

  htmlContent = cleanHtmlForExport(htmlContent);

  // base64 이미지 패턴
  const pattern = /<img\s+([^>]*?)src=["'](data:image\/([^;]+);base64,([^"']+))["']([^>]*?)>/g;

  htmlContent = htmlContent.replace(pattern, (match, before, fullDataUrl, imageType, base64Data, after) => {
    const imageHash = crypto.createHash('md5').update(base64Data).digest('hex');

    if (imageCache[imageHash]) {
      return `<img ${before}src="${imageCache[imageHash]}"${after}>`;
    }

    imageCounter.count++;
    const ext = imageType === 'png' ? 'png' : (imageType === 'jpeg' || imageType === 'jpg' ? 'jpg' : imageType);
    const filename = `${courseCode}_img_${String(imageCounter.count).padStart(3, '0')}.${ext}`;
    const relativePath = `../images/${filename}`;

    // 이미지 데이터 저장
    images.push({
      filename,
      data: Buffer.from(base64Data, 'base64')
    });

    imageCache[imageHash] = relativePath;
    return `<img ${before}src="${relativePath}"${after}>`;
  });

  return htmlContent;
}

// 인트로 페이지 생성
function createIntroPage(professor, processedPhoto, is2018Template) {
  const photo = processedPhoto || professor.photo || '';
  const introMedia = professor.introMedia || '../../../resources/media/common_start.mp3';

  const careerHadHtmlTags = professor._careerHadHtmlTags !== false;
  const careerContent = [];

  if (Array.isArray(professor.career)) {
    for (const item of professor.career) {
      if (typeof item === 'object' && item !== null) {
        const period = (item.period || '').trim();
        const description = (item.description || '').trim();
        if (period || description) {
          if (careerHadHtmlTags) {
            if (period && description) careerContent.push(`<b>${period}</b><br />${description}`);
            else if (period) careerContent.push(`<b>${period}</b>`);
            else careerContent.push(description);
          } else {
            if (period && description) careerContent.push(`${period} ${description}`);
            else careerContent.push(period || description);
          }
        }
      } else if (typeof item === 'string' && item.trim()) {
        careerContent.push(item);
      }
    }
  }

  const eduTitle = is2018Template ? "학 력" : "학　력";
  const careerTitle = is2018Template ? "경 력" : "경　력";

  return {
    path: "",
    section: 0,
    title: "인트로",
    component: "intro",
    media: introMedia,
    data: {
      professor: {
        name: professor.name,
        photo: photo,
        profile: [
          { title: eduTitle, content: professor.education || [] },
          { title: careerTitle, content: careerContent }
        ]
      }
    }
  };
}

// 오리엔테이션 페이지 생성
function createOrientationPage(orientation, courseCode, year) {
  let videoUrl = orientation.videoUrl || '';
  if (!videoUrl && courseCode && year) {
    videoUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4`;
  }

  let subtitlePath = orientation.subtitlePath || '';
  if (!subtitlePath && courseCode) {
    subtitlePath = `../subtitles/${courseCode}_ot.vtt`;
  }

  const description = orientation.description ?? "본격적인 학습에 앞서 교수님의 오리엔테이션을 먼저 들어주세요.";
  const script = orientation.script ?? "본격적인 학습에 앞서 교수님의 오리엔테이션을 먼저 들어주세요.";

  return {
    path: "/orientation",
    section: 1,
    title: "오리엔테이션",
    description,
    script,
    component: "orientation",
    media: videoUrl,
    caption: [{
      src: subtitlePath,
      lable: "한국어",
      language: "ko",
      kind: "subtitles"
    }],
    data: {}
  };
}

// 용어체크 페이지 생성
function createTermPage(terms, courseCode, imageCounter, imageCache, images, isLegacy, description, script) {
  const termData = [];

  for (const term of terms) {
    if (term.title || term.content) {
      let title = term.title || '';
      if (title) title = title.replace(/\n/g, '<br />');

      let contentList = term.content || [];
      if (typeof contentList === 'string') {
        contentList = contentList ? [contentList] : [];
      }

      const processedContent = contentList.map(item => {
        if (item) {
          return processImages(item, courseCode, imageCounter, imageCache, images);
        }
        return item;
      }).filter(Boolean);

      if (isLegacy && processedContent.length > 0) {
        termData.push({ title, content: processedContent[0] });
      } else {
        termData.push({ title, content: processedContent });
      }
    }
  }

  return {
    path: "/term",
    section: 1,
    title: "용어체크",
    description: description || "이번 시간에 다룰 주요 용어를 체크해보세요.",
    script: script || "이번 시간에 다룰 주요 용어를 체크해보세요.",
    component: "term",
    media: "../../../resources/media/common_word.mp3",
    data: termData
  };
}

// 학습목표 페이지 생성
function createObjectivesPage(contents, objectives, courseCode, imageCounter, imageCache, images, description, script) {
  const isPracticeEmpty = (content) => {
    if (!content || typeof content !== 'string') return true;
    if (!content.includes("class='practice'") && !content.includes('class="practice"')) return false;
    const text = content.replace(/<[^>]+>/g, '').trim();
    return !text;
  };

  const filteredContents = contents.filter(c => c && !isPracticeEmpty(c)).map(c =>
    processImages(c, courseCode, imageCounter, imageCache, images)
  );

  const processedObjectives = objectives.filter(Boolean).map(o =>
    processImages(o, courseCode, imageCounter, imageCache, images)
  );

  // 넘버링 추가
  let contentNum = 1;
  const finalContents = filteredContents.map(c => {
    if (c.includes("class='practice'") || c.includes('class="practice"')) return c;
    if (/^\d+[\.\)]\s/.test(c)) return c;
    return `${contentNum++}. ${c}`;
  });

  let objNum = 1;
  const finalObjectives = processedObjectives.map(o => {
    if (/^\d+[\.\)]\s/.test(o)) return o;
    return `${objNum++}. ${o}`;
  });

  return {
    path: "/objectives",
    section: 1,
    title: "학습목표",
    description: description || "주요 학습내용과 학습목표를 살펴보세요.",
    script: script || "이번 시간에 학습할 주요 학습 내용과 학습목표를 확인해보세요.",
    component: "objectives",
    media: "../../../resources/media/common_goal.mp3",
    data: [
      { title: "학습내용", contents: finalContents },
      { title: "학습목표", contents: finalObjectives }
    ]
  };
}

// 생각묻기 페이지 생성
function createOpinionPage(question) {
  return {
    path: "/opinion",
    section: 2,
    title: "생각묻기",
    description: "다음의 질문에 답해보세요.",
    script: "본격적인 학습을 시작하기 전 다음의 질문에 답해보세요.",
    component: "opinion",
    media: "../../../resources/media/common_question.mp3",
    data: { title: question }
  };
}

// 강의보기 페이지 생성
function createLecturePage(lesson, courseCode, year) {
  let videoUrl = lesson.lectureVideoUrl || '';
  if (!videoUrl && courseCode && year) {
    const lessonNum = String(lesson.lessonNumber).padStart(2, '0');
    videoUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_${lessonNum}.mp4`;
  }

  let subtitle = lesson.lectureSubtitle || '';
  if (!subtitle && courseCode) {
    const lessonNum = String(lesson.lessonNumber).padStart(2, '0');
    subtitle = `../subtitles/${courseCode}_${lessonNum}.vtt`;
  }

  const timestamps = (lesson.timestamps || []).filter(Boolean).map(ts => {
    if (typeof ts === 'object') {
      const entry = { time: ts.time || '' };
      if (ts.title) entry.title = ts.title;
      return entry;
    }
    return { time: ts };
  });

  return {
    path: "/lecture",
    section: 2,
    title: "강의보기",
    description: "교수님의 강의에 맞춰 주도적으로 학습하세요.",
    script: "영상페이지에서는 내레이션을 제공하지 않습니다",
    component: "lecture",
    media: videoUrl,
    caption: [{
      src: subtitle,
      lable: "한국어",
      language: "ko",
      kind: "subtitles"
    }],
    data: timestamps
  };
}

// 실습하기 페이지 생성
function createPracticePage(lesson, courseCode, year) {
  let videoUrl = lesson.practiceVideoUrl || '';
  if (!videoUrl) {
    const lectureUrl = lesson.lectureVideoUrl || '';
    if (lectureUrl) {
      videoUrl = lectureUrl.replace('.mp4', '_P.mp4');
    } else if (courseCode && year) {
      const lessonNum = String(lesson.lessonNumber).padStart(2, '0');
      videoUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_${lessonNum}_P.mp4`;
    }
  }

  let subtitle = lesson.practiceSubtitle || '';
  if (!subtitle) {
    const lectureSubtitle = lesson.lectureSubtitle || '';
    if (lectureSubtitle) {
      subtitle = lectureSubtitle.replace('.vtt', '_P.vtt');
    } else if (courseCode) {
      const lessonNum = String(lesson.lessonNumber).padStart(2, '0');
      subtitle = `../subtitles/${courseCode}_${lessonNum}_P.vtt`;
    }
  }

  const timestamps = (lesson.practiceTimestamps || []).filter(Boolean).map(ts => {
    if (typeof ts === 'object') {
      const entry = { time: ts.time || '' };
      if (ts.title) entry.title = ts.title;
      return entry;
    }
    return { time: ts };
  });

  return {
    path: "/practice",
    section: 2,
    title: "실습하기",
    description: "실습영상을 따라 하며 다양한 기능을 익혀보세요.",
    script: "실습영상을 따라 하며 다양한 기능을 익혀보세요. ",
    component: "practice",
    media: videoUrl,
    caption: [{
      src: subtitle,
      lable: "한국어",
      language: "ko",
      kind: "subtitles"
    }],
    data: timestamps
  };
}

// 점검하기 페이지 생성
function createCheckPage(lesson, courseCode, imageCounter, imageCache, images, description, script) {
  let professorThink = lesson.professorThink || '';
  if (professorThink) {
    professorThink = processImages(professorThink, courseCode, imageCounter, imageCache, images);
  }

  let professorThinkImage = lesson.professorThinkImage || '';
  let processedThinkImage = '../images/professor-02.png';

  if (professorThinkImage) {
    if (professorThinkImage.startsWith('data:image/')) {
      const match = professorThinkImage.match(/data:image\/([^;]+);base64,(.+)/);
      if (match) {
        const ext = match[1] === 'png' ? 'png' : 'jpg';
        images.push({
          filename: `professor-02.${ext}`,
          data: Buffer.from(match[2], 'base64')
        });
        processedThinkImage = `../images/professor-02.${ext}`;
      }
    } else {
      processedThinkImage = professorThinkImage;
    }
  }

  return {
    path: "/check",
    section: 2,
    title: "점검하기",
    description: description || "질문에 대한 교수님의 생각을 확인해보세요.",
    script: script || "질문에 대한 교수님의 생각을 확인해보세요.",
    component: "check",
    media: "../../../resources/media/common_check.mp3",
    data: {
      title: lesson.opinionQuestion,
      photo: processedThinkImage,
      think: professorThink
    }
  };
}

// 연습문제 페이지 생성
function createExercisePage(lesson, courseCode, imageCounter, imageCache, images) {
  const exercises = [];

  const processList = lesson.exercises || [];

  for (const ex of processList) {
    let question = ex.question || '';
    let commentary = ex.commentary || '';
    let options = ex.options || ['', '', '', ''];

    if (question) {
      question = processImages(question, courseCode, imageCounter, imageCache, images);
      if (question.startsWith('<p>') && question.endsWith('</p>') && (question.match(/<p>/g) || []).length === 1) {
        question = question.replace(/<\/?p>/g, '');
      }
    }

    if (commentary) {
      commentary = processImages(commentary, courseCode, imageCounter, imageCache, images);
      if (commentary.startsWith('<p>') && commentary.endsWith('</p>') && (commentary.match(/<p>/g) || []).length === 1) {
        commentary = commentary.replace(/<\/?p>/g, '');
      }
    }

    if (ex.type === 'multiple') {
      options = options.map(opt => {
        if (opt) {
          let processed = processImages(opt, courseCode, imageCounter, imageCache, images);
          processed = processed.replace(/<\/p>\s*<p>/g, '<br />');
          processed = processed.replace(/<\/?p>/g, '');
          processed = processed.replace(/\n/g, '<br />');
          return processed;
        }
        return opt;
      });
    }

    if (question) {
      if (ex.type === 'boolean') {
        exercises.push({
          type: 'boolean',
          subject: question,
          value: ['O', 'X'],
          answer: ex.answer || '2',
          commentary
        });
      } else {
        exercises.push({
          type: 'multiple',
          subject: question,
          value: options,
          answer: ex.answer || '1',
          commentary
        });
      }
    }
  }

  return {
    path: "/exercise",
    section: 3,
    title: "연습문제",
    description: "학습한 내용을 토대로 다음의 문제를 풀어보세요.",
    script: "학습한 내용을 얼마나 이해했는지 문제를 풀며 확인해보세요.",
    component: "exercise",
    media: "../../../resources/media/common_quiz.mp3",
    data: exercises
  };
}

// 학습정리 페이지 생성
function createTheoremPage(lesson, courseCode, imageCounter, imageCache, images) {
  let summary;

  if (lesson.summaryOriginalHtml !== undefined && lesson.summaryOriginalHtml !== null) {
    summary = lesson.summaryOriginalHtml.map(s =>
      s ? processImages(s, courseCode, imageCounter, imageCache, images) : s
    );
  } else {
    summary = (lesson.summary || []).filter(Boolean).map(s =>
      processImages(s, courseCode, imageCounter, imageCache, images)
    );
  }

  return {
    path: "/theorem",
    section: 3,
    title: "학습정리",
    description: "학습한 내용을 다시 한번 정리해보세요.",
    script: "학습한 내용을 다시 한번 정리해보세요.",
    component: "theorem",
    media: "../../../resources/media/common_summary.mp3",
    data: {
      theorem: summary,
      reference: lesson.reference || ''
    }
  };
}

// 다음안내 페이지 생성
function createNextPage(weekTitlesList, lessonNextData) {
  const nextData = (lessonNextData && lessonNextData.length > 0) ? lessonNextData : (weekTitlesList || []);

  return {
    path: "/next",
    section: 3,
    title: "다음안내",
    description: "다음시간 주제를 확인하고, 미리 준비해보세요.",
    script: "이것으로 이번 시간 강의를 마쳤습니다. 수고하셨습니다.",
    component: "next",
    media: "../../../resources/media/common_out.mp3",
    data: nextData
  };
}

// index.html 템플릿 생성
function getIndexHtmlTemplate(presetId, theme) {
  const preset = TEMPLATE_PRESETS[presetId] || TEMPLATE_PRESETS["2025-standard"];

  if (!theme && preset.themes && preset.themes.length > 0) {
    theme = preset.themes[0].id;
  } else if (!theme) {
    theme = "type-1";
  }

  const htmlHead = (preset.html_head || '').replace(/{theme}/g, theme);
  const htmlHeadScripts = preset.html_head_scripts || '';
  const htmlBodyScripts = preset.html_body_scripts || '';

  const isLegacy = ["2018", "2019", "2020", "2021"].some(p => presetId.startsWith(p));

  if (isLegacy) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, user-scalable=no" />
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title> 원격교육원 </title>
	<script src="../../../resources/scripts/jquery/jquery.js"></script>
	<script src="../../../resources/scripts/vue/vue.min.js"></script>
	<script src="../../../resources/scripts/vue/vue-router.min.js"></script>

${htmlHeadScripts}

	<link rel="stylesheet" href="../../../resources/scripts/videojs/video-js.min.css">

${htmlHead}
	<link rel="stylesheet" media="print" type="text/css" href="../../../resources/styles/print.css">
</head>
<body>
	<div id="app"></div>
	<script src="../../../resources/scripts/app.js"></script>
${htmlBodyScripts}
	<script src="../../../resources/scripts/videojs/video.min.js"></script>
	<script src="../../../resources/scripts/videojs/videojs-contrib-hls.min.js"></script>
	<script src="../../../resources/scripts/videojs/videojs.hotkeys.min.js"></script>
</body>
</html>
`;
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, user-scalable=no" />
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>메가존아이티평생교육원</title>
	<script src="../../../resources/scripts/jquery/jquery.js"></script>
	<script src="../../../resources/scripts/vue/vue.min.js"></script>
	<script src="../../../resources/scripts/vue/vue-router.min.js"></script>

${htmlHeadScripts}

	<link rel="stylesheet" href="../../../resources/scripts/videojs/video-js.min.css">

${htmlHead}

	<link rel="stylesheet" media="print" type="text/css" href="../../../resources/styles/print.css">
</head>
<body>
	<div id="app"></div>
	<script src="../../../resources/scripts/app.js"></script>
	<script src="../../../resources/scripts/videojs/video.min.js"></script>

${htmlBodyScripts}
	<script src="../../../resources/scripts/videojs/videojs-contrib-hls.min.js"></script>
	<script src="../../../resources/scripts/videojs/videojs.hotkeys.min.js"></script>
</body>
</html>`;
}

// subjects.json 생성
function createSubjectsJson(courseData, presetId) {
  const isLegacy = ["2018", "2019", "2020", "2021"].some(p => presetId.startsWith(p));

  const weeks = {};
  for (const lesson of courseData.lessons) {
    const weekNum = lesson.weekNumber;
    if (!weeks[weekNum]) {
      weeks[weekNum] = {
        weekNumber: weekNum,
        weekTitle: lesson.weekTitle || '',
        lessons: [],
        isPracticeWeek: lesson.isPracticeWeek || false
      };
    }

    if (!lesson.isPracticeWeek) {
      weeks[weekNum].lessons.push({
        number: lesson.lessonNumber,
        title: lesson.lessonTitle
      });
    }

    if (!weeks[weekNum].weekTitle && lesson.weekTitle) {
      weeks[weekNum].weekTitle = lesson.weekTitle;
    }
  }

  let maxWeek = Math.max(...Object.keys(weeks).map(Number), 0);

  // examWeeks 처리
  const examWeeks = courseData.examWeeks || [];
  for (const exam of examWeeks) {
    const weekNum = exam.weekNumber;
    if (weekNum && !weeks[weekNum]) {
      weeks[weekNum] = {
        weekNumber: weekNum,
        weekTitle: exam.weekTitle || '',
        lessons: [],
        isPracticeWeek: false
      };
      maxWeek = Math.max(maxWeek, weekNum);
    }
  }

  // 15주 과정 자동 추가
  if (maxWeek >= 14) {
    if (!weeks[8]) {
      weeks[8] = { weekNumber: 8, weekTitle: "중간고사", lessons: [], isPracticeWeek: false };
    }
    if (!weeks[15]) {
      weeks[15] = { weekNumber: 15, weekTitle: "기말고사", lessons: [], isPracticeWeek: false };
    }
  }

  const subjects = [];
  const sortedWeeks = Object.keys(weeks).map(Number).sort((a, b) => a - b);

  for (const weekNum of sortedWeeks) {
    const week = weeks[weekNum];
    const lists = week.lessons.map((lesson, idx) => {
      const title = lesson.title || `${lesson.number}차시`;
      if (isLegacy) {
        return `${idx + 1}차 ${title}`;
      }
      return `<span>${idx + 1}차</span> ${title}`;
    });

    let titleStr;
    if (week.weekTitle) {
      titleStr = isLegacy ? `${weekNum}주 ${week.weekTitle}` : `<span>${weekNum}주</span> ${week.weekTitle}`;
    } else {
      titleStr = isLegacy ? `${weekNum}주` : `<span>${weekNum}주</span>`;
    }

    const entry = { title: titleStr };
    if (lists.length > 0) {
      entry.lists = lists;
    }
    subjects.push(entry);
  }

  return { subjects };
}

// 메인 변환 함수
function convertBuilderToSubjects(courseData) {
  const courseCode = courseData.courseCode;
  const courseName = courseData.courseName;
  const courseType = courseData.courseType || 'general';
  const year = courseData.year || '';
  const professor = courseData.professor;
  const presetId = courseData.templatePreset || '2025-standard';
  const theme = courseData.templateTheme || 'type-1';
  const importedImages = courseData.importedImages || {};
  const importedSubtitles = courseData.importedSubtitles || {};

  const isLegacyTemplate = presetId.startsWith('2018');
  const is2018 = presetId === '2018-standard';

  const preset = TEMPLATE_PRESETS[presetId] || TEMPLATE_PRESETS["2025-standard"];
  const components = preset.components || ["intro", "orientation", "term", "objectives", "opinion", "lecture", "practice", "check", "exercise", "theorem", "next"];

  // 파일 저장용 배열
  const files = [];
  const images = [];

  // 이미지 카운터 및 캐시
  let maxImgNumber = 0;
  for (const path of Object.values(importedImages)) {
    const match = path.match(new RegExp(`${courseCode}_img_(\\d+)`));
    if (match) {
      maxImgNumber = Math.max(maxImgNumber, parseInt(match[1]));
    }
  }
  const imageCounter = { count: maxImgNumber };
  const imageCache = {};

  // Import된 이미지 저장
  for (const [relPath, base64Data] of Object.entries(importedImages)) {
    const filename = relPath.split('/').pop();
    if (!filename) continue;

    let actualBase64 = base64Data;
    let ext = 'png';

    if (base64Data.includes(',')) {
      const [header, data] = base64Data.split(',');
      actualBase64 = data;
      const typeMatch = header.match(/data:image\/([^;]+)/);
      if (typeMatch) {
        ext = typeMatch[1] === 'png' ? 'png' : (typeMatch[1] === 'jpeg' ? 'jpg' : typeMatch[1]);
      }
    }

    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    const actualFilename = `${nameWithoutExt}.${ext}`;

    images.push({
      filename: actualFilename,
      data: Buffer.from(actualBase64, 'base64')
    });
  }

  // 교수 사진 처리
  let processedProfessorPhoto = professor.photo || '';
  if (processedProfessorPhoto) {
    if (processedProfessorPhoto.includes('<img') && processedProfessorPhoto.includes('data:image/')) {
      const srcMatch = processedProfessorPhoto.match(/src=["']([^"']+)["']/);
      if (srcMatch) {
        const match = srcMatch[1].match(/data:image\/([^;]+);base64,(.+)/);
        if (match) {
          images.push({
            filename: 'professor.png',
            data: Buffer.from(match[2], 'base64')
          });
          processedProfessorPhoto = '../images/professor.png';
        }
      }
    } else if (processedProfessorPhoto.startsWith('data:image/')) {
      const match = processedProfessorPhoto.match(/data:image\/([^;]+);base64,(.+)/);
      if (match) {
        images.push({
          filename: 'professor.png',
          data: Buffer.from(match[2], 'base64')
        });
        processedProfessorPhoto = '../images/professor.png';
      }
    }
  }

  // subjects.json 생성
  const subjectsJson = createSubjectsJson(courseData, presetId);

  if (isLegacyTemplate) {
    let lines = ['{', '\t"subjects" : [{'];
    subjectsJson.subjects.forEach((subj, i) => {
      if (i > 0) lines.push('\t},{');
      lines.push(`\t\t"title" : "${subj.title}"`);
      if (subj.lists) {
        lines[lines.length - 1] += ',';
        lines.push('\t\t"lists" : [');
        subj.lists.forEach((item, j) => {
          const comma = j < subj.lists.length - 1 ? ',' : '';
          lines.push(`\t\t\t"${item}"${comma}`);
        });
        lines.push('\t\t]');
      }
    });
    lines.push('\t}]', '}');
    files.push({
      path: `${courseCode}/subjects.json`,
      content: lines.join('\n') + '\n'
    });
  } else {
    files.push({
      path: `${courseCode}/subjects.json`,
      content: JSON.stringify(subjectsJson, null, 2)
    });
  }

  // 자막 파일 복사
  for (const [filename, content] of Object.entries(importedSubtitles)) {
    files.push({
      path: `${courseCode}/subtitles/${filename}`,
      content
    });
  }

  // 주차 제목 리스트 생성
  const weekTitlesList = subjectsJson.subjects.map(s => {
    let title = s.title;
    title = title.replace(/<span[^>]*>.*?<\/span>\s*/g, '');
    title = title.replace(/^\d+주\s*/, '');
    return title;
  });

  // 각 차시별 data.json 생성
  for (const lesson of courseData.lessons) {
    const lessonNum = String(lesson.lessonNumber).padStart(2, '0');

    // 현장실습 주차
    if (lesson.isPracticeWeek) {
      files.push({
        path: `${courseCode}/${lessonNum}/assets/data/data.json`,
        content: JSON.stringify({ image: lesson.practiceImage || '' }, null, 2)
      });
      files.push({
        path: `${courseCode}/${lessonNum}/index.html`,
        content: getIndexHtmlTemplate(presetId, theme)
      });
      continue;
    }

    // 페이지 생성
    const pages = [];

    for (const comp of components) {
      if (comp === 'intro') {
        pages.push(createIntroPage(professor, processedProfessorPhoto, is2018));
      } else if (comp === 'orientation') {
        if (lesson.hasOrientation) {
          pages.push(createOrientationPage(lesson.orientation, courseCode, year));
        }
      } else if (comp === 'term') {
        if (courseType === 'general') {
          pages.push(createTermPage(
            lesson.terms || [],
            courseCode, imageCounter, imageCache, images,
            isLegacyTemplate,
            lesson.termDescription,
            lesson.termScript
          ));
        }
      } else if (comp === 'objectives') {
        const learningContents = [...(lesson.learningContents || [])];
        if (lesson.hasPractice) {
          let practiceContent = lesson.practiceContent || '';
          if (!practiceContent) {
            for (const content of learningContents) {
              if (typeof content === 'string' && content.includes("class='practice'")) {
                practiceContent = content;
                break;
              }
            }
          }
          const isPracticeEmpty = (c) => {
            if (!c || typeof c !== 'string') return true;
            if (!c.includes("class='practice'") && !c.includes('class="practice"')) return false;
            return !c.replace(/<[^>]+>/g, '').trim();
          };
          if (practiceContent && !isPracticeEmpty(practiceContent)) {
            learningContents.push(practiceContent);
          }
        }
        pages.push(createObjectivesPage(
          learningContents,
          lesson.learningObjectives || [],
          courseCode, imageCounter, imageCache, images,
          lesson.objectivesDescription,
          lesson.objectivesScript
        ));
      } else if (comp === 'opinion') {
        pages.push(createOpinionPage(lesson.opinionQuestion || ''));
      } else if (comp === 'lecture') {
        pages.push(createLecturePage(lesson, courseCode, year));
      } else if (comp === 'practice') {
        if (lesson.hasPractice) {
          let practiceContent = lesson.practiceContent || '';
          if (!practiceContent) {
            for (const content of (lesson.learningContents || [])) {
              if (typeof content === 'string' && content.includes("class='practice'")) {
                practiceContent = content;
                break;
              }
            }
          }
          const isPracticeEmpty = (c) => {
            if (!c || typeof c !== 'string') return true;
            if (!c.includes("class='practice'") && !c.includes('class="practice"')) return false;
            return !c.replace(/<[^>]+>/g, '').trim();
          };
          if (practiceContent && !isPracticeEmpty(practiceContent)) {
            pages.push(createPracticePage(lesson, courseCode, year));
          }
        }
      } else if (comp === 'check') {
        pages.push(createCheckPage(
          lesson,
          courseCode, imageCounter, imageCache, images,
          lesson.checkDescription,
          lesson.checkScript
        ));
      } else if (comp === 'exercise' || comp === 'exercise_pre' || comp === 'exercise_post') {
        if (courseType === 'general') {
          pages.push(createExercisePage(lesson, courseCode, imageCounter, imageCache, images));
        }
      } else if (comp === 'theorem') {
        pages.push(createTheoremPage(lesson, courseCode, imageCounter, imageCache, images));
      } else if (comp === 'next') {
        pages.push(createNextPage(weekTitlesList, lesson.nextWeekTitles));
      }
    }

    // index.html 생성
    files.push({
      path: `${courseCode}/${lessonNum}/index.html`,
      content: getIndexHtmlTemplate(presetId, theme)
    });

    // 다운로드 URL 자동 생성
    let instructionUrl = lesson.instructionUrl || '';
    if (!instructionUrl && courseCode && year) {
      instructionUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/down/${courseCode}_mp3_${lessonNum}.zip`;
    }

    let guideUrl = lesson.guideUrl || '';
    if (!guideUrl && courseCode && year) {
      guideUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/down/${courseCode}_book_${lessonNum}.zip`;
    }

    const sectionInWeek = lesson.sectionInWeek ?? (((lesson.lessonNumber - 1) % 2) + 1);

    // data.json 생성
    const dataJson = {
      subject: courseName,
      index: lesson.weekNumber,
      section: sectionInWeek,
      instruction: instructionUrl,
      guide: guideUrl,
      sections: ["인트로", "준비하기", "학습하기", "정리하기"],
      pages
    };

    if (isLegacyTemplate) {
      const useSpaceSep = presetId === '2018-standard';
      files.push({
        path: `${courseCode}/${lessonNum}/assets/data/data.json`,
        content: legacyJsonDumps(dataJson, useSpaceSep) + '\n'
      });
    } else {
      files.push({
        path: `${courseCode}/${lessonNum}/assets/data/data.json`,
        content: JSON.stringify(dataJson, null, 2)
      });
    }
  }

  return { files, images };
}

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { courseData } = req.body;

    if (!courseData) {
      res.status(400).json({ error: 'courseData is required' });
      return;
    }

    const courseCode = courseData.courseCode || 'export';

    // 변환 실행
    const { files, images } = convertBuilderToSubjects(courseData);

    // ZIP 생성
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${courseCode}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    // 파일 추가
    for (const file of files) {
      archive.append(file.content, { name: file.path });
    }

    // 이미지 추가
    for (const img of images) {
      archive.append(img.data, { name: `${courseCode}/images/${img.filename}` });
    }

    await archive.finalize();

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
}
