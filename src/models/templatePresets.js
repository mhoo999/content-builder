export const TEMPLATE_PRESETS = {
  "2018-standard": {
    id: "2018-standard",
    name: "2018 표준형",
    category: "standard",
    description: "4섹션(인트로, 준비, 학습, 정리)을 갖춘 2018년도 표준 학위 과정 템플릿입니다.",
    themes: [{id: "type-1", name: "Type-1 (블루)"}, {id: "type-2", name: "Type-2 (핑크)"}, {id: "type-3", name: "Type-3 (그린)"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: true, hasTerm: true, hasObjectives: true, hasOpinion: true, hasLecture: true, hasPractice: false, hasCheck: true, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2019-standard": {
    id: "2019-standard",
    name: "2019 표준형",
    category: "standard",
    description: "실습하기(Practice) 컴포넌트가 최초 도입된 2019년도 표준 템플릿입니다.",
    themes: [{id: "type-1", name: "Type-1 (블루)"}, {id: "type-2", name: "Type-2 (핑크)"}, {id: "type-3", name: "Type-3 (그린)"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: true, hasTerm: true, hasObjectives: true, hasOpinion: true, hasLecture: true, hasPractice: true, hasCheck: true, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2020-standard": {
    id: "2020-standard",
    name: "2020 표준형",
    category: "standard",
    description: "사회복지학과 등 일부 과목에 전용으로 쓰인 2020년도 템플릿입니다.",
    themes: [{id: "type-1", name: "Type-1 (기본)"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: true, hasTerm: true, hasObjectives: true, hasOpinion: true, hasLecture: true, hasPractice: false, hasCheck: true, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2021-standard": {
    id: "2021-standard",
    name: "2021 표준형",
    category: "standard",
    description: "전면 리뉴얼되어 실습하기 컴포넌트가 표준 탑재된 2021년도 템플릿입니다.",
    themes: [{id: "type-1", name: "Type-1 (기본)"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: true, hasTerm: true, hasObjectives: true, hasOpinion: true, hasLecture: true, hasPractice: true, hasCheck: true, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2022-standard": {
    id: "2022-standard",
    name: "2022 표준형",
    category: "standard",
    description: "가장 많이 사용된 학위 템플릿 중 하나로, 실습 섹션이 제외되었습니다.",
    themes: [{id: "type-1", name: "Type-1 (블루)"}, {id: "type-2", name: "Type-2 (코랄)"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: true, hasTerm: true, hasObjectives: true, hasOpinion: true, hasLecture: true, hasPractice: false, hasCheck: true, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2023-standard": {
    id: "2023-standard",
    name: "2023 표준형",
    category: "standard",
    description: "현재 빌더의 기본 출력 템플릿과 가장 유사한 원형 템플릿입니다.",
    themes: [{id: "type-1", name: "Type-1 (블루)"}, {id: "type-2", name: "Type-2 (코랄)"}, {id: "type-hrda", name: "Type-HRD (그레이)"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: true, hasTerm: true, hasObjectives: true, hasOpinion: true, hasLecture: true, hasPractice: false, hasCheck: true, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2025-standard": {
    id: "2025-standard",
    name: "2025 표준형 (최신)",
    category: "standard",
    description: "최신 CSS 레이아웃이 적용된 최신 4섹션 학위 템플릿입니다.",
    themes: [{id: "type-1", name: "Type-1 (네이비)"}, {id: "type-2", name: "Type-2 (오렌지)"}, {id: "type-3", name: "Type-3 (그린)"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: true, hasTerm: true, hasObjectives: true, hasOpinion: true, hasLecture: true, hasPractice: false, hasCheck: true, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2022-ct": {
    id: "2022-ct",
    name: "2022 자격증/특강형",
    category: "short",
    description: "영상 시청 하나만 제공하는 1섹션 초경량 템플릿입니다.",
    themes: [{id: "type-1", name: "Type-1 (블루)"}, {id: "type-2", name: "Type-2 (퍼플)"}],
    sections: ["학습하기"],
    features: { hasOrientation: false, hasTerm: false, hasObjectives: false, hasOpinion: false, hasLecture: true, hasPractice: false, hasCheck: false, hasExercise: false, hasTheorem: false, hasNext: false, hasIntro: false },
  },
  "onboard-dunamu": {
    id: "onboard-dunamu",
    name: "온보딩/사내교육형",
    category: "short",
    description: "기업 사내교육이나 온보딩용으로 제공되는 단일 영상 뷰어 템플릿입니다.",
    themes: [{id: "type-gr19-1", name: "네이비 테마"}, {id: "type-gr19-2", name: "오렌지 테마"}, {id: "type-gr19-3", name: "그린 테마"}],
    sections: ["학습하기"],
    features: { hasOrientation: false, hasTerm: false, hasObjectives: false, hasOpinion: false, hasLecture: true, hasPractice: false, hasCheck: false, hasExercise: false, hasTheorem: false, hasNext: false, hasIntro: false },
  },
  "2024-hrd": {
    id: "2024-hrd",
    name: "2024 HRD 직무형",
    category: "hrd",
    description: "국비지원 직무교육용으로 최적화된 4섹션 템플릿입니다. (사전평가 포함)",
    themes: [{id: "type-hrda", name: "기본형 (HRDA)"}, {id: "24hrdata", name: "데이터 분석 전용"}, {id: "24hrdgit", name: "Git 실무 전용"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: false, hasTerm: false, hasObjectives: true, hasOpinion: false, hasLecture: true, hasPractice: false, hasCheck: false, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2026-hrd": {
    id: "2026-hrd",
    name: "2026 HRD 직무형",
    category: "hrd",
    description: "학습목표와 사전평가 순서가 변경된 최신 HRD 직무 템플릿입니다.",
    themes: [{id: "26hraipr", name: "AI 활용 전용"}, {id: "26hrgpt", name: "GPT 실무 전용"}, {id: "26hrvibc", name: "비즈니스 전용"}],
    sections: ["인트로", "준비하기", "학습하기", "정리하기"],
    features: { hasOrientation: false, hasTerm: false, hasObjectives: true, hasOpinion: false, hasLecture: true, hasPractice: false, hasCheck: false, hasExercise: true, hasTheorem: true, hasNext: true, hasIntro: true },
  },
  "2022-legal": {
    id: "2022-legal",
    name: "2022 법정의무형",
    category: "legal",
    description: "성희롱 예방, 산업안전 등 법정의무교육을 위한 5섹션 고유 템플릿입니다.",
    themes: [{id: "gend", name: "성희롱예방 (블루)"}, {id: "hara", name: "직장내괴롭힘 (퍼플)"}, {id: "safe", name: "산업안전 (그린)"}],
    sections: ["인트로", "들어가기", "학습하기", "점검하기", "정리하기"],
    features: { hasOrientation: true, hasTerm: false, hasObjectives: false, hasOpinion: false, hasLecture: true, hasPractice: false, hasCheck: false, hasExercise: true, hasTheorem: true, hasNext: false, hasIntro: true },
  },
  "2026-hrc": {
    id: "2026-hrc",
    name: "2026 숏폼 퀴즈형",
    category: "short",
    description: "영상 시청 후 바로 퀴즈를 푸는 초경량 2섹션 미니 교육 템플릿입니다.",
    themes: [{id: "26hrc", name: "기본형 (블루)"}, {id: "26hrvibc", name: "비즈니스 (블랙)"}],
    sections: ["학습하기", "퀴즈"],
    features: { hasOrientation: false, hasTerm: false, hasObjectives: false, hasOpinion: false, hasLecture: true, hasPractice: false, hasCheck: false, hasExercise: true, hasTheorem: false, hasNext: false, hasIntro: false },
  }
};

export const detectTemplatePreset = (dataJson, htmlContent) => {
  if (!dataJson || !htmlContent) return "2025-standard";

  const sectionsStr = JSON.stringify(dataJson.sections || []);
  
  if (sectionsStr === JSON.stringify(["인트로", "들어가기", "학습하기", "점검하기", "정리하기"])) {
    return "2022-legal";
  }
  
  if (sectionsStr === JSON.stringify(["학습하기", "퀴즈"]) || sectionsStr === JSON.stringify(["학습하기", "연습문제"])) {
    return "2026-hrc";
  }
  
  if (sectionsStr === JSON.stringify(["학습하기"])) {
    if (htmlContent.includes("layout-dunamu21.css") || htmlContent.includes("layout-summary.js")) {
      return "onboard-dunamu";
    }
    return "2022-ct"; // 기본 특강형
  }
  
  if (sectionsStr === JSON.stringify(["인트로", "준비하기", "학습하기", "정리하기"])) {
    if (htmlContent.includes("layout-hrd.css") || htmlContent.includes("layout-nr.css") || htmlContent.includes("commons_hrd.js")) {
      if (htmlContent.includes("2026")) return "2026-hrd";
      return "2024-hrd";
    }
    
    if (htmlContent.includes("2025/layout.css")) return "2025-standard";
    if (htmlContent.includes("2023/base.css")) return "2023-standard";
    if (htmlContent.includes("2022/base.css")) return "2022-standard";
    if (htmlContent.includes("2021/base.css")) return "2021-standard";
    if (htmlContent.includes("2020/layout.css")) return "2020-standard";
    if (htmlContent.includes("2019/base.css")) return "2019-standard";
    if (htmlContent.includes("2018/base.css")) return "2018-standard";
  }
  
  return "2025-standard"; // Fallback
};

export const detectTemplateTheme = (presetId, htmlContent) => {
  if (!presetId || !htmlContent) return "type-1";
  
  const preset = TEMPLATE_PRESETS[presetId];
  if (!preset || !preset.themes || preset.themes.length === 0) return "type-1";
  
  for (const theme of preset.themes) {
    if (htmlContent.includes(`${theme.id}.css`)) {
      return theme.id;
    }
  }
  
  return preset.themes[0].id;
};
