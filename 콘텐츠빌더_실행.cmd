@echo off
chcp 65001 >nul
title 콘텐츠 빌더 실행

:: ==================================================
:: 콘텐츠 빌더 설정
:: ==================================================

:: 이 CMD 파일이 있는 폴더를 콘텐츠 빌더 폴더로 자동 지정
set "PROJECT_DIR=%~dp0"

:: 콘텐츠 빌더 접속 주소
set "APP_URL=http://localhost:5173"

:: 업무용 Chrome 프로필
set "CHROME_PROFILE=Default"

:: Chrome 사용자 데이터 폴더
set "CHROME_USER_DATA=%LOCALAPPDATA%\Google\Chrome\User Data"


:: ==================================================
:: 콘텐츠 빌더 폴더 확인
:: ==================================================
if not exist "%PROJECT_DIR%package.json" (
    echo.
    echo [오류] package.json 파일을 찾을 수 없습니다.
    echo.
    echo 이 실행 파일을 콘텐츠 빌더 프로그램 폴더 안으로
    echo 이동한 후 다시 실행해 주세요.
    echo.
    echo 현재 실행 파일 위치:
    echo %PROJECT_DIR%
    echo.
    pause
    exit /b 1
)

pushd "%PROJECT_DIR%"

if errorlevel 1 (
    echo.
    echo [오류] 콘텐츠 빌더 폴더로 이동하지 못했습니다.
    echo.
    pause
    exit /b 1
)


:: ==================================================
:: 설치 여부 확인
:: ==================================================
if not exist "node_modules\.bin\vite.cmd" (
    echo.
    echo [오류] 콘텐츠 빌더가 설치되지 않았습니다.
    echo.
    echo "콘텐츠빌더_설치.cmd"를 먼저 실행해 주세요.
    echo.
    pause
    popd
    exit /b 1
)


:: ==================================================
:: Chrome 실행 파일 자동 확인
:: ==================================================
set "CHROME_PATH="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME_PATH (
    if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
        set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    )
)

if not defined CHROME_PATH (
    if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
        set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
    )
)


:: ==================================================
:: 콘텐츠 빌더 서버 실행
:: ==================================================
echo.
echo 콘텐츠 빌더 서버를 실행합니다.
echo 실행된 서버 창은 사용 중에 닫지 마세요.
echo.

start "콘텐츠 빌더 개발 서버" cmd /k "npm run dev"


:: ==================================================
:: 서버 실행 대기
:: ==================================================
echo 서버가 실행될 때까지 기다리고 있습니다...
timeout /t 5 /nobreak >nul


:: ==================================================
:: 브라우저로 열기
:: ==================================================
if defined CHROME_PATH (
    start "" "%CHROME_PATH%" ^
        --user-data-dir="%CHROME_USER_DATA%" ^
        --profile-directory="%CHROME_PROFILE%" ^
        --new-window ^
        "%APP_URL%"
) else (
    echo Chrome을 찾을 수 없어 기본 브라우저로 엽니다.
    start "" "%APP_URL%"
)

popd
exit /b
