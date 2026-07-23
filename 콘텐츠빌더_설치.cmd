@echo off
chcp 65001 >nul
title 콘텐츠 빌더 설치

:: ==================================================
:: 콘텐츠 빌더 설치 스크립트
:: ==================================================

:: 이 CMD 파일이 있는 폴더를 콘텐츠 빌더 폴더로 자동 지정
set "PROJECT_DIR=%~dp0"

echo.
echo ========================================
echo   콘텐츠 빌더 설치
echo ========================================
echo.


:: ==================================================
:: 콘텐츠 빌더 폴더 확인
:: ==================================================
if not exist "%PROJECT_DIR%package.json" (
    echo [오류] package.json 파일을 찾을 수 없습니다.
    echo.
    echo 이 설치 파일을 콘텐츠 빌더 프로그램 폴더 안으로
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
    echo [오류] 콘텐츠 빌더 폴더로 이동하지 못했습니다.
    echo.
    pause
    exit /b 1
)


:: ==================================================
:: npm 설치 여부 확인
:: ==================================================
echo [1/3] Node.js 설치 확인 중...

where npm >nul 2>&1

if errorlevel 1 (
    echo.
    echo [오류] npm을 찾을 수 없습니다.
    echo Node.js가 설치되어 있는지 확인해 주세요.
    echo.
    echo 다운로드: https://nodejs.org/
    echo.
    pause
    popd
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo       Node.js %NODE_VERSION% 확인됨


:: ==================================================
:: Chrome 실행 파일 자동 확인
:: ==================================================
echo [2/3] Chrome 설치 확인 중...

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
    echo [경고] Google Chrome을 찾을 수 없습니다.
    echo 콘텐츠 빌더 실행 시 다른 브라우저를 사용해 주세요.
    echo.
) else (
    echo       Chrome 확인됨
)


:: ==================================================
:: 패키지 설치
:: ==================================================
echo [3/3] 패키지 설치 중...
echo.

if exist "package-lock.json" (
    call npm ci
) else (
    call npm install
)

if errorlevel 1 (
    echo.
    echo [오류] 패키지 설치에 실패했습니다.
    echo 위에 표시된 오류 내용을 개발 담당자에게 전달해 주세요.
    echo.
    pause
    popd
    exit /b 1
)


:: ==================================================
:: 설치 완료
:: ==================================================
echo.
echo ========================================
echo   설치 완료!
echo ========================================
echo.
echo 이제 "콘텐츠빌더_실행.cmd"를 실행하여
echo 콘텐츠 빌더를 사용할 수 있습니다.
echo.

popd
pause
exit /b 0
