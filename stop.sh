#!/bin/bash

echo "===================================="
echo "Content Builder 종료 스크립트"
echo "===================================="
echo ""

# 5173 포트 확인 및 종료
echo "[1/2] 포트 5173 확인 중..."
PID=$(lsof -ti:5173 2>/dev/null)
if [ -z "$PID" ]; then
    echo "ℹ️ 포트 5173에서 실행 중인 프로세스가 없습니다."
else
    echo "✅ 포트 5173에서 실행 중인 프로세스 발견 (PID: $PID)"
    kill -9 $PID 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ 프로세스 종료 완료 (PID: $PID)"
    else
        echo "❌ 프로세스 종료 실패"
    fi
fi

echo ""

# 5174 포트 확인 및 종료
echo "[2/2] 포트 5174 확인 중..."
PID=$(lsof -ti:5174 2>/dev/null)
if [ -z "$PID" ]; then
    echo "ℹ️ 포트 5174에서 실행 중인 프로세스가 없습니다."
else
    echo "✅ 포트 5174에서 실행 중인 프로세스 발견 (PID: $PID)"
    kill -9 $PID 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ 프로세스 종료 완료 (PID: $PID)"
    else
        echo "❌ 프로세스 종료 실패"
    fi
fi

echo ""
echo "===================================="
echo "종료 완료"
echo "===================================="
