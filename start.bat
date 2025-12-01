@echo off
chcp 65001 >nul
echo ====================================
echo Content Builder 시작 스크립트
echo ====================================
echo.

REM 1. Python 설치 확인
echo [1/4] Python 설치 확인 중...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python이 설치되어 있지 않습니다.
    echo.
    echo Python 설치를 시도합니다...
    echo (관리자 권한이 필요할 수 있습니다)
    echo.

    REM winget으로 Python 설치 시도
    winget install Python.Python.3.12 --silent >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo ⚠️ 자동 설치 실패. 수동 설치가 필요합니다.
        echo.
        echo 다음 링크에서 Python을 다운로드하여 설치해주세요:
        echo https://www.python.org/downloads/
        echo.
        echo 설치 시 "Add Python to PATH" 옵션을 반드시 체크하세요!
        echo.
        pause
        exit /b 1
    ) else (
        echo ✅ Python 설치 완료
        echo.
        echo ⚠️ Python이 설치되었습니다.
        echo    명령 프롬프트를 다시 열고 이 스크립트를 재실행해주세요.
        pause
        exit /b 0
    )
) else (
    python --version
    echo ✅ Python 설치 확인 완료
)
echo.

REM 2. Node.js 설치 확인
echo [2/4] Node.js 설치 확인 중...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo.
    echo 다음 링크에서 Node.js를 다운로드하여 설치해주세요:
    echo https://nodejs.org/
    echo.
    echo (LTS 버전 권장)
    pause
    exit /b 1
) else (
    node --version
    echo ✅ Node.js 설치 확인 완료
)
echo.

REM 3. npm install 확인
echo [3/4] 패키지 설치 확인 중...
if not exist "node_modules\" (
    echo 📦 패키지를 설치합니다... (1-2분 소요)
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 패키지 설치 실패
        pause
        exit /b 1
    )
    echo ✅ 패키지 설치 완료
) else (
    echo ✅ 패키지가 이미 설치되어 있습니다
)
echo.

REM 4. 개발 서버 실행
echo [4/4] 개발 서버를 시작합니다...
echo.
echo 🚀 브라우저가 자동으로 열립니다.
echo 🛑 서버를 종료하려면 Ctrl+C를 누르거나 stop.bat을 실행하세요.
echo.

REM 3초 후 브라우저 오픈
timeout /t 3 /nobreak >nul
start http://localhost:5173

REM npm run dev 실행
call npm run dev
