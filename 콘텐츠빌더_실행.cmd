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
:: npm 설치 여부 확인
:: ==================================================
where npm >nul 2>&1

if errorlevel 1 (
    echo.
    echo [오류] npm을 찾을 수 없습니다.
    echo Node.js가 설치되어 있는지 확인해 주세요.
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

if not defined CHROME_PATH (
    echo.
    echo [오류] Google Chrome 실행 파일을 찾을 수 없습니다.
    echo Chrome 설치 여부를 확인해 주세요.
    echo.
    pause
    popd
    exit /b 1
)


:: ==================================================
:: 필요한 패키지 설치
:: ==================================================
if not exist "node_modules\.bin\vite.cmd" (
    echo.
    echo 콘텐츠 빌더 실행에 필요한 패키지를 설치합니다.
    echo 최초 실행 시에만 진행됩니다.
    echo.

    if exist "package-lock.json" (
        call npm ci
    ) else (
        call npm install
    )

    if errorlevel 1 (
        echo.
        echo [오류] 필요한 패키지를 설치하지 못했습니다.
        echo 위에 표시된 오류 내용을 개발 담당자에게 전달해 주세요.
        echo.
        pause
        popd
        exit /b 1
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
:: 업무용 Chrome Default 프로필로 열기
:: ==================================================
start "" "%CHROME_PATH%" ^
    --user-data-dir="%CHROME_USER_DATA%" ^
    --profile-directory="%CHROME_PROFILE%" ^
    --new-window ^
    "%APP_URL%"

popd
exit /b