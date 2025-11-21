# Content Builder

IT 학위 컨텐츠 제작을 위한 비주얼 빌더 도구

## 기능

- 📝 직관적인 폼 기반 콘텐츠 입력
- 📸 이미지 업로드 및 미리보기
- 👁️ 실시간 콘텐츠 미리보기
- 💾 JSON export/import
- 🎨 섹션별 탭 UI (인트로, 준비하기, 학습하기, 정리하기)

## 지원 콘텐츠 타입

- **표준형 학위**: 4 섹션 (인트로 → 준비하기 → 학습하기 → 정리하기)
- **간소형 학위**: 1 섹션 (학습하기)

## 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (localhost:5173)
npm run dev

# 빌드
npm run build
```

## 프로젝트 구조

```
src/
├── components/          # UI 컴포넌트
│   ├── Intro/          # 인트로 섹션
│   ├── Preparation/    # 준비하기 섹션
│   ├── Learning/       # 학습하기 섹션
│   ├── Summary/        # 정리하기 섹션
│   └── Preview/        # 미리보기
├── models/             # 데이터 모델
├── utils/              # 유틸리티 함수
└── App.jsx             # 메인 앱
```

## 데이터 구조

생성된 JSON은 content-generator와 호환되며, 바로 폴더 구조 생성에 사용 가능합니다.
