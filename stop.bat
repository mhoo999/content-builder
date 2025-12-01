@echo off
chcp 65001 >nul
echo ====================================
echo Content Builder 종료 스크립트
echo ====================================
echo.

REM 5173 포트 확인 및 종료
echo [1/2] 포트 5173 확인 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    set PID=%%a
    goto :found5173
)
echo ℹ️ 포트 5173에서 실행 중인 프로세스가 없습니다.
goto :check5174

:found5173
echo ✅ 포트 5173에서 실행 중인 프로세스 발견 (PID: %PID%)
taskkill /F /PID %PID% >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 프로세스 종료 완료 (PID: %PID%)
) else (
    echo ❌ 프로세스 종료 실패 (관리자 권한이 필요할 수 있습니다)
)

:check5174
echo.
echo [2/2] 포트 5174 확인 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    set PID=%%a
    goto :found5174
)
echo ℹ️ 포트 5174에서 실행 중인 프로세스가 없습니다.
goto :done

:found5174
echo ✅ 포트 5174에서 실행 중인 프로세스 발견 (PID: %PID%)
taskkill /F /PID %PID% >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 프로세스 종료 완료 (PID: %PID%)
) else (
    echo ❌ 프로세스 종료 실패 (관리자 권한이 필요할 수 있습니다)
)

:done
echo.
echo ====================================
echo 종료 완료
echo ====================================
pause
