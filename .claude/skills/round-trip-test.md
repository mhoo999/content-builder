# Round-Trip Test Skill

배치 round-trip 테스트를 실행하여 템플릿의 import → export 정합성을 검증합니다.

## 설명

이 스킬은 cb_test 폴더의 과목들을 import하고 다시 export하여 원본과 비교함으로써, 템플릿 시스템의 round-trip compatibility를 검증합니다.

## 사용법

```bash
npm run test:round-trip
```

## 옵션

기본값을 변경하려면 다음과 같이 옵션을 전달할 수 있습니다:

```bash
npm run test:round-trip -- --source <source_path> --target <target_path>
```

### 옵션 목록

- `--source <path>`: 소스 폴더 경로 (기본값: `~/Downloads/cb_test`)
- `--target <path>`: 타겟 폴더 경로 (기본값: `~/IdeaProjects/contents_it/subjects`)

## 실행 흐름

1. **과목 스캔**: source 폴더에서 subjects.json이 있는 과목 폴더 탐색
2. **Import**: 각 과목 폴더를 Builder JSON으로 변환 (`cli/import.js`)
3. **Export**: Builder JSON을 다시 subjects 폴더로 변환 (`builder_to_subjects.py`)
4. **Git Diff**: target 폴더에서 git diff로 변경 사항 확인
5. **결과 분석**: 변경 사항에 따라 PASS/WARN/FAIL 판정

## 판정 기준

### ✅ PASS
- git diff에서 변경 사항이 전혀 없음
- 완벽한 round-trip compatibility 달성

### ⚠️ WARN
- 공백, 줄바꿈, 포맷만 변경됨
- 실제 콘텐츠는 동일하므로 허용 가능한 차이

### ❌ FAIL
- 실제 콘텐츠가 변경됨
- HTML 태그, 텍스트, 구조 등의 변경 발생
- 수정 필요

### 🔴 ERROR
- Import 또는 Export 과정에서 에러 발생
- 스크립트 실행 실패

## 결과 확인

테스트 완료 후 다음과 같은 결과를 확인할 수 있습니다:

1. **콘솔 출력**: 각 과목의 테스트 결과 요약
2. **상세 로그**: `round-trip-test-results.json` 파일에 전체 diff 결과 저장
3. **Git 상태**: target 폴더에서 `git status` 및 `git diff`로 직접 확인

## 검증 명령어

테스트 후 수동으로 결과를 확인하려면:

```bash
# target 폴더로 이동
cd ~/IdeaProjects/contents_it

# 변경된 파일 목록
git status

# 변경 통계
git diff --stat

# 특정 과목의 상세 변경 내역
git diff subjects/<course_code>/

# 변경 사항 초기화 (필요시)
git restore subjects/<course_code>/
```

## Claude 사용 시 워크플로우

1. **테스트 실행**
   ```bash
   npm run test:round-trip
   ```

2. **결과 분석**
   - PASS: 문제 없음, 다음 단계 진행
   - WARN: 공백 차이만 있으므로 일반적으로 무시 가능
   - FAIL: 상세 조사 필요

3. **FAIL 항목 상세 조사**
   ```bash
   # 상세 diff 확인
   cd ~/IdeaProjects/contents_it
   git diff subjects/<failed_course_code>/

   # 특정 파일만 확인
   git diff subjects/<failed_course_code>/01/assets/data/data.json
   ```

4. **원인 분석 및 수정**
   - Parser 또는 Exporter의 버그 확인
   - 템플릿별 특수 처리 로직 검증
   - 메타데이터 보존 여부 확인

5. **재테스트**
   ```bash
   # 변경 사항 초기화
   git restore subjects/<course_code>/

   # 수정 후 재실행
   npm run test:round-trip
   ```

## 주의사항

- **Git 필수**: target 폴더는 반드시 git repository여야 합니다
- **Clean State**: 테스트 전 target 폴더는 깨끗한 상태(커밋된 상태)여야 정확한 비교가 가능합니다
- **백업**: 중요한 데이터는 테스트 전 백업하세요
- **Python 환경**: `python3` 명령어가 사용 가능해야 합니다

## 트러블슈팅

### Python 스크립트 실행 실패
```bash
# Python 버전 확인
python3 --version

# 필요한 패키지 설치 (필요시)
pip3 install <required_packages>
```

### Git diff 명령 실패
```bash
# target 폴더가 git repository인지 확인
cd ~/IdeaProjects/contents_it
git status
```

### Import 실패
- subjects.json 파일 존재 여부 확인
- 폴더 구조가 올바른지 확인 (01/assets/data/data.json)
- 권한 문제 확인

## 예제

### 기본 실행
```bash
npm run test:round-trip
```

### 커스텀 경로 지정
```bash
npm run test:round-trip -- --source ~/test/courses --target ~/output/subjects
```

### 결과 예시
```
📊 Round-Trip Test 결과
============================================================

총 5개 과목 테스트
  ✅ PASS:  3개
  ⚠️  WARN:  1개
  ❌ FAIL:  1개
  🔴 ERROR: 0개

✅ PASS (3개):
  - 18italgo: 변경 사항 없음
  - 19webdev: 변경 사항 없음
  - 20database: 변경 사항 없음

⚠️ WARN (1개):
  - 21python: 공백/포맷 차이만 있음
    변경된 파일: 2개
    subjects/21python/01/assets/data/data.json | 1 +
    subjects/21python/02/assets/data/data.json | 1 +

❌ FAIL (1개):
  - 22react: 콘텐츠 변경 발생
    변경된 파일: 1개
    subjects/22react/01/assets/data/data.json | 3 ++-
```

## 관련 파일

- `/cli/import.js`: Import 로직
- `/cli/round-trip-test.js`: 배치 테스트 스크립트
- `/builder_to_subjects.py`: Export 로직
- `/src/parsers/`: 템플릿별 Parser
- `/exporters/`: 템플릿별 Exporter
