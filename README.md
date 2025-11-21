# Content Builder

IT 학위 콘텐츠 제작을 위한 비주얼 빌더 도구 (토스 스타일 UI)

## ✨ 기능

- 📝 직관적인 폼 기반 콘텐츠 입력
- 🎨 토스 스타일 UI (깔끔한 블루 컬러)
- 📚 차시별 탭 관리
- 💾 JSON export/import
- 🔄 **subjects 폴더 구조 자동 생성** (브라우저에서 바로!)
- 📂 폴더 Import 기능 (기존 subjects 폴더 불러오기)

## 📦 지원 콘텐츠 타입

- **표준형 학위**: 4 섹션 (인트로 → 준비하기 → 학습하기 → 정리하기)
  - 오리엔테이션 (1주1차시만)
  - 용어체크 (3개)
  - 학습목표 (학습내용 + 학습목표)
  - 생각묻기 & 점검하기
  - 강의보기 (타임스탬프 3개)
  - 연습문제 (OX 1개 + 4지선다 2개)
  - 학습정리 (3개)

## 🚀 사용 방법

### 1. 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (localhost:5173)
npm run dev
```

### 2. 콘텐츠 작성

1. 브라우저에서 http://localhost:5173/ 접속
2. 과목 정보 입력 (과목 코드, 과정명)
3. "새 차시" 버튼으로 차시 추가
4. 각 섹션별로 내용 입력:
   - 📝 기본 정보 (차시명)
   - 📖 준비하기 (오리엔테이션, 용어, 학습목표)
   - 🎓 학습하기 (생각묻기, 강의, 점검하기)
   - ✅ 정리하기 (연습문제, 학습정리, 다운로드)

### 3. Export 및 폴더 구조 생성

#### 방법 1: Export to Subjects (추천) ⭐

브라우저에서 바로 폴더 구조를 생성할 수 있습니다:

1. **"📁 Export to Subjects"** 버튼 클릭
2. 출력 경로 입력 (예: `~/IdeaProjects/contents_it/subjects`)
3. 자동으로 폴더 구조 생성 완료! 🎉

**장점:**
- JSON 다운로드 + 폴더 구조 생성이 한 번에!
- 터미널 명령어 입력 불필요
- Python 스크립트가 자동으로 실행됨

#### 방법 2: 수동 변환 (고급 사용자용)

JSON 파일을 다운로드한 후 수동으로 변환:

1. **"📤 Export JSON"** 버튼으로 JSON 파일 다운로드
2. 터미널에서 Python 스크립트 실행:

```bash
# Builder JSON을 subjects 폴더 구조로 변환
python3 builder_to_subjects.py <builder_json_file> [output_dir]

# 예시
python3 builder_to_subjects.py 25itinse_builder.json ~/IdeaProjects/contents_it/subjects
```

생성되는 구조:
```
subjects/
  └── {과목코드}/              # 예: 25itinse
      ├── subjects.json        # 주차/차시 목록
      ├── subtitles/           # 자막 파일들
      ├── images/              # 이미지 파일들
      ├── 01/                  # 1차시
      │   └── assets/
      │       └── data/
      │           └── data.json
      ├── 02/                  # 2차시
      ...
```

## 📂 프로젝트 구조

```
content-builder/
├── src/
│   ├── components/
│   │   ├── Preparation/     # 준비하기 섹션
│   │   ├── Learning/        # 학습하기 섹션
│   │   └── Summary/         # 정리하기 섹션
│   ├── models/
│   │   └── dataModel.js     # 데이터 모델
│   ├── App.jsx              # 메인 앱
│   └── App.css              # 토스 스타일
├── builder_to_subjects.py   # 변환 스크립트
└── README.md
```

## 🎨 UI 디자인

- 토스 스타일 블루 컬러 (#3182f6)
- 깔끔한 카드 레이아웃
- 사이드바 + 에디터 2단 구조
- 반응형 폼 컴포넌트

## 🔧 데이터 모델

Export된 JSON 구조:
```json
{
  "courseCode": "25itinse",
  "courseName": "인터넷보안",
  "professor": { ... },
  "lessons": [
    {
      "weekNumber": 1,
      "lessonNumber": 1,
      "lessonTitle": "암호학의 기본 개념",
      "hasOrientation": true,
      "terms": [ ... ],
      "learningContents": [ ... ],
      "learningObjectives": [ ... ],
      "opinionQuestion": "...",
      "professorThink": "...",
      "lectureVideoUrl": "...",
      "timestamps": [ ... ],
      "exercise1": { ... },
      "exercise2": { ... },
      "exercise3": { ... },
      "summary": [ ... ]
    }
  ]
}
```

## 🚧 향후 계획

- [ ] 리치 텍스트 에디터 (이미지, 표 삽입)
- [ ] 이미지 업로드 기능
- [ ] 미리보기 모드
- [ ] 간소형 학위 지원
- [ ] 교수 정보 관리 UI

## 📝 라이센스

MIT
