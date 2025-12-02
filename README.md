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

---

## 📦 설치 및 실행 가이드

### 1단계: Node.js 설치

Content Builder를 실행하려면 Node.js가 필요합니다.

#### Windows (윈도우)

1. **Node.js 다운로드**
   - https://nodejs.org/ 접속
   - **LTS** (Long Term Support) 버전 다운로드 (권장)
   - 다운로드한 `.msi` 파일 실행

2. **설치 과정**
   - "Next" 클릭하여 진행
   - "Add to PATH" 옵션이 **체크되어 있는지 확인** (기본값)
   - 설치 완료까지 진행

3. **설치 확인**
   - `Windows 키 + R` → `cmd` 입력 → Enter
   - 명령 프롬프트에서 다음 명령어 입력:
   ```cmd
   node --version
   npm --version
   ```
   - 버전 번호가 표시되면 설치 성공!

4. **환경변수 확인 (자동 설정됨)**
   - 설치 시 자동으로 PATH에 등록됨
   - 만약 `node`가 인식되지 않으면:
     - `Windows 키` → "환경 변수" 검색
     - "시스템 환경 변수 편집" 클릭
     - "환경 변수" 버튼 클릭
     - "시스템 변수" 섹션에서 `Path` 선택 → "편집"
     - 다음 경로가 있는지 확인:
       - `C:\Program Files\nodejs\`
     - 없으면 "새로 만들기"로 추가
     - 확인 후 명령 프롬프트 재시작

#### macOS (맥)

1. **Node.js 다운로드**
   - https://nodejs.org/ 접속
   - **LTS** 버전 다운로드 (권장)
   - 다운로드한 `.pkg` 파일 실행

2. **설치 과정**
   - 안내에 따라 설치 진행
   - 관리자 암호 입력

3. **설치 확인**
   - `Spotlight` (⌘ + Space) → "터미널" 입력
   - 터미널에서 다음 명령어 입력:
   ```bash
   node --version
   npm --version
   ```
   - 버전 번호가 표시되면 설치 성공!

#### Linux (우분투/데비안)

```bash
# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Node.js 설치
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

---

### 2단계: Python 설치 (Export 기능 사용 시 필요)

#### Windows (윈도우)

1. **Python 다운로드**
   - https://www.python.org/downloads/ 접속
   - 최신 **Python 3.x** 버전 다운로드
   - 다운로드한 설치 파일 실행

2. **설치 과정 (중요!)**
   - ⚠️ **"Add Python to PATH" 체크박스를 반드시 체크!**
   - "Install Now" 클릭
   - 설치 완료

3. **설치 확인**
   - 명령 프롬프트에서:
   ```cmd
   python --version
   ```
   - 버전 번호가 표시되면 설치 성공!

4. **환경변수 수동 설정 (설치 시 체크 안 한 경우)**
   - `Windows 키` → "환경 변수" 검색
   - "시스템 환경 변수 편집" 클릭
   - "환경 변수" 버튼 클릭
   - "시스템 변수" 섹션에서 `Path` 선택 → "편집"
   - 다음 경로 추가 (Python 설치 경로에 따라 다를 수 있음):
     - `C:\Users\사용자명\AppData\Local\Programs\Python\Python3xx\`
     - `C:\Users\사용자명\AppData\Local\Programs\Python\Python3xx\Scripts\`
   - 확인 후 명령 프롬프트 재시작

#### macOS (맥)

Python 3는 macOS에 기본 설치되어 있습니다.

```bash
# 확인
python3 --version
```

최신 버전이 필요한 경우:
```bash
# Homebrew 설치 (없는 경우)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python 3 설치
brew install python3
```

#### Linux (우분투/데비안)

```bash
# Python 3 설치
sudo apt-get update
sudo apt-get install -y python3 python3-pip

# 설치 확인
python3 --version
```

---

### 3단계: Content Builder 설치

1. **프로젝트 폴더로 이동**

   Windows:
   ```cmd
   cd C:\경로\content-builder
   ```

   macOS/Linux:
   ```bash
   cd /경로/content-builder
   ```

2. **필요한 패키지 설치**

   ```bash
   npm install
   ```

   - 이 명령어는 프로젝트에 필요한 모든 라이브러리를 자동으로 다운로드합니다
   - 인터넷 연결이 필요합니다
   - 1-2분 정도 소요됩니다

---

### 4단계: 실행

1. **개발 서버 시작**

   ```bash
   npm run dev
   ```

   - 이 명령어로 개발 서버가 시작됩니다
   - 다음과 같은 메시지가 표시됩니다:
     ```
     VITE v5.x.x  ready in xxx ms

     ➜  Local:   http://localhost:5173/
     ```

2. **브라우저에서 접속**

   - 자동으로 브라우저가 열리지 않는 경우
   - 브라우저를 열고 주소창에 입력: `http://localhost:5173/`

3. **서버 종료**

   - 터미널에서 **Ctrl+C** (Windows/macOS/Linux 공통)
   - 서버가 종료되고 브라우저에서 페이지가 작동하지 않게 됩니다

---

## 💡 처음 사용하시는 분들을 위한 팁

### 명령 프롬프트 / 터미널이란?

- **Windows**: 명령 프롬프트 (CMD) 또는 PowerShell
  - 여는 방법: `Windows 키 + R` → `cmd` 입력 → Enter
- **macOS**: 터미널
  - 여는 방법: `Spotlight (⌘ + Space)` → "터미널" 입력 → Enter
- **Linux**: 터미널
  - 여는 방법: `Ctrl + Alt + T`

### 폴더 이동 방법

명령어를 입력하기 전에 content-builder 폴더로 이동해야 합니다:

**Windows 쉬운 방법:**
1. content-builder 폴더를 탐색기에서 열기
2. 주소 표시줄에 `cmd` 입력 후 Enter
3. 해당 폴더에서 명령 프롬프트가 자동으로 열립니다!

**macOS 쉬운 방법:**
1. Finder에서 content-builder 폴더 찾기
2. 폴더를 우클릭 → "폴더에서 새로운 터미널" (또는 Services → New Terminal at Folder)

**수동으로 이동:**
```bash
# Windows
cd C:\Users\사용자명\Documents\content-builder

# macOS/Linux
cd /Users/사용자명/Documents/content-builder
```

### 명령어 입력 시 주의사항

- 명령어는 정확하게 입력해야 합니다 (대소문자 구분!)
- `npm install` 실행 중에는 기다려야 합니다
- 오류가 발생하면 메시지를 잘 읽어보세요

---

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

## 문제 해결

### 서버가 종료되지 않거나 포트가 이미 사용 중일 때

터미널을 실수로 닫았거나 서버가 제대로 종료되지 않은 경우, 포트 5173이 계속 점유될 수 있습니다.

**해결 방법:**

#### Windows (PowerShell 또는 CMD)

```powershell
# 방법 1: kill-port 사용 (권장)
npx kill-port 5173

# 방법 2: 직접 프로세스 종료
netstat -ano | findstr :5173
# PID 확인 후
taskkill /PID <PID번호> /F
```

#### macOS / Linux

```bash
# 방법 1: kill-port 사용 (권장)
npx kill-port 5173

# 방법 2: 직접 프로세스 종료
lsof -ti:5173 | xargs kill -9

# 또는
lsof -i :5173  # PID 확인
kill -9 <PID번호>
```

### Node.js 또는 Python이 인식되지 않을 때

**증상:**
- `'node'은(는) 내부 또는 외부 명령... 아닙니다` (Windows)
- `command not found: node` (macOS/Linux)
- `'python'은(는) 내부 또는 외부 명령... 아닙니다` (Windows)

**해결:**
1. 프로그램이 설치되어 있는지 확인
2. 환경변수 PATH에 추가되어 있는지 확인 (위의 설치 가이드 참고)
3. 명령 프롬프트/터미널을 **재시작**해야 환경변수가 적용됩니다

### npm install 오류

**증상:**
- 패키지 설치 중 오류 발생

**해결:**
```bash
# 캐시 정리
npm cache clean --force

# 다시 설치
npm install
```

### 포트 5173이 이미 사용 중일 때

**증상:**
- `Port 5173 is already in use`

**해결:**
다른 포트를 사용하거나 기존 프로세스를 종료합니다 (위의 "서버가 종료되지 않거나..." 섹션 참고)

## 라이센스

MIT
