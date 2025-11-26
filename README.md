# Content Builder

IT 학위 콘텐츠 제작을 위한 비주얼 빌더 도구

## 기능

- 직관적인 폼 기반 콘텐츠 입력
- 노션 스타일 리치 텍스트 에디터 (이미지, 표, 서식 지원)
- 차시별 탭 관리
- JSON export/import
- **subjects 폴더 구조 자동 생성**
- **기존 subjects 폴더 Import** (이미지 포함)

## 지원 콘텐츠 타입

- **표준형 학위**: 4 섹션 (인트로 → 준비하기 → 학습하기 → 정리하기)
  - 오리엔테이션 (1주1차시만)
  - 용어체크 (동적 추가/삭제)
  - 학습목표 (학습내용 + 학습목표)
  - 생각묻기 & 점검하기
  - 강의보기 (타임스탬프)
  - 연습문제 (OX/4지선다, 동적 추가/삭제)
  - 학습정리 (동적 추가/삭제)

## 설치 및 실행

### 1. Python 설치 (Windows만 해당)

**macOS/Linux**: Python 3가 기본 설치되어 있어 건너뛰어도 됩니다.

**Windows**: Export 기능 사용을 위해 Python 3 설치 필요

#### 터미널 설치 (권장)
```powershell
# winget 사용 (Windows 10/11 기본 제공)
winget install Python.Python.3.12
```

#### 수동 설치
https://www.python.org/downloads/ 에서 다운로드 후 설치
- 설치 시 **"Add Python to PATH"** 체크 필수

#### 설치 확인
```bash
# Windows
python --version

# macOS/Linux
python3 --version
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173/ 접속

## 사용 방법

### 새 콘텐츠 작성

1. **과목 정보 입력** (오른쪽 사이드바)
   - 과목 코드: `25itinse` 형식
   - 과정명: `인터넷보안` 등

2. **교수 정보 입력** (오른쪽 사이드바)
   - 이름, 사진 URL
   - 학력 (여러 줄 가능)
   - 경력 (시작일/종료일 선택 + 내용)

3. **차시 추가 및 편집** (왼쪽 사이드바)
   - "새 차시" 버튼으로 추가
   - 각 섹션별 내용 입력

### 리치 텍스트 에디터 사용법

용어 내용, 교수님 의견, 연습문제, 학습정리 필드에서 사용 가능:

- **서식**: 굵게(B), 기울임(I), 밑줄(U), 취소선(S)
- **제목**: H1, H2, H3
- **목록**: 글머리 기호, 번호 매기기
- **기타**: 인용, 코드 블록, 표
- **이미지 삽입**:
  - 툴바의 "이미지" 버튼 클릭
  - 드래그 앤 드롭
  - 클립보드에서 붙여넣기 (Ctrl+V)

### 기존 콘텐츠 Import

1. **"Import Folder"** 버튼 클릭
2. subjects 폴더 내의 **과목코드 폴더** 선택 (예: `25itinse/`)
3. 자동으로 모든 차시와 이미지가 로드됨

**Import 시 자동 처리:**
- `data.json` 파싱 및 변환
- `subjects.json`에서 차시명 추출
- `images/` 폴더의 이미지 저장 (Export 시 복원됨)
- 교수 정보 추출

### Export (폴더 구조 생성)

**자동 방식** (개발 서버 실행 중)

1. **"Export to Subjects"** 버튼 클릭
2. 출력 경로 입력 (기본: `~/Documents`)
3. ✅ 폴더 구조 자동 생성 완료!

**수동 방식** (JSON 파일이 다운로드된 경우)

터미널에서 Python 스크립트 실행:

```bash
# macOS/Linux
python3 builder_to_subjects.py <다운로드된_json> <출력_경로>

# 예시 (macOS/Linux)
python3 builder_to_subjects.py ~/Downloads/25itinse_builder.json ~/Documents
```

```powershell
# Windows PowerShell (UTF-8 인코딩 설정)
$env:PYTHONIOENCODING="utf-8"
python builder_to_subjects.py <다운로드된_json> <출력_경로>

# 예시 (Windows)
$env:PYTHONIOENCODING="utf-8"
python builder_to_subjects.py $env:USERPROFILE\Downloads\25itinse_builder.json $env:USERPROFILE\Documents
```

**생성되는 구조:**
```
~/Documents/
└── 25itinse/                    # 과목코드 폴더
    ├── subjects.json            # 주차/차시 목록
    ├── subtitles/               # 자막 폴더
    ├── images/                  # 이미지 폴더
    │   ├── 25itinse_img_001.jpg # Import된 이미지 복원
    │   ├── 25itinse_img_002.png # 새로 추가한 이미지
    │   └── ...
    ├── 01/                      # 1차시
    │   ├── index.html           # 메인 HTML
    │   └── assets/
    │       └── data/
    │           └── data.json    # 차시 데이터
    ├── 02/                      # 2차시
    │   └── ...
    └── ...
```

**서버 호환성:**
- img 태그가 서버 형식으로 자동 변환됨: `<img src='...' alt='' />`
- `class="notion-image"`, `data-original-src` 등 에디터 속성 제거됨

## 이미지 처리

### Import 시
- `images/` 폴더의 이미지를 메모리에 저장
- 에디터에는 경로만 표시 (파란 점선 테두리)
- 마우스 호버 시 원본 경로 확인 가능

### Export 시
- Import된 이미지: 원본 파일명으로 복원
- 새로 추가한 이미지: `{과목코드}_img_{번호}.{확장자}`로 저장
- HTML의 base64 이미지 → 파일로 추출

## 프로젝트 구조

```
content-builder/
├── src/
│   ├── components/
│   │   ├── RichTextEditor/    # 노션 스타일 에디터
│   │   ├── Professor/         # 교수 정보
│   │   ├── Preparation/       # 준비하기 섹션
│   │   ├── Learning/          # 학습하기 섹션
│   │   └── Summary/           # 정리하기 섹션
│   ├── models/
│   │   └── dataModel.js       # 데이터 모델
│   ├── utils/
│   │   └── folderParser.js    # Import 파싱 유틸
│   ├── App.jsx                # 메인 앱
│   └── App.css                # 스타일
├── builder_to_subjects.py     # Export 변환 스크립트
├── BRIEFING.md                # 작업자 브리핑 문서
└── README.md
```

## 기술 스택

- **Frontend**: React 18 + Vite
- **에디터**: TipTap (ProseMirror 기반)
- **변환 스크립트**: Python 3

## 데이터 모델

Export된 JSON 구조:
```json
{
  "courseCode": "25itinse",
  "courseName": "인터넷보안",
  "professor": {
    "name": "홍길동",
    "photo": "https://...",
    "education": ["학력1", "학력2"],
    "career": [
      { "period": "2020년 1월 ~ 2023년 12월", "startDate": "2020-01-01", "endDate": "2023-12-01", "description": "경력 내용" }
    ]
  },
  "lessons": [...],
  "importedImages": {
    "../images/25itinse_img_001.jpg": "data:image/jpeg;base64,..."
  }
}
```

## 라이센스

MIT
