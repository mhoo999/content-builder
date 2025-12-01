#!/bin/bash

echo "===================================="
echo "Content Builder 시작 스크립트"
echo "===================================="
echo ""

# 1. Python 설치 확인
echo "[1/4] Python 설치 확인 중..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3가 설치되어 있지 않습니다."
    echo ""
    echo "macOS에는 기본적으로 Python3가 설치되어 있어야 합니다."
    echo "Homebrew를 사용하여 설치하려면:"
    echo "  brew install python3"
    echo ""
    exit 1
else
    python3 --version
    echo "✅ Python 설치 확인 완료"
fi
echo ""

# 2. Node.js 설치 확인
echo "[2/4] Node.js 설치 확인 중..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo ""
    echo "Homebrew를 사용하여 설치하려면:"
    echo "  brew install node"
    echo ""
    echo "또는 다음 링크에서 다운로드:"
    echo "https://nodejs.org/"
    echo ""
    exit 1
else
    node --version
    echo "✅ Node.js 설치 확인 완료"
fi
echo ""

# 3. npm install 확인
echo "[3/4] 패키지 설치 확인 중..."
if [ ! -d "node_modules" ]; then
    echo "📦 패키지를 설치합니다... (1-2분 소요)"
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 패키지 설치 실패"
        exit 1
    fi
    echo "✅ 패키지 설치 완료"
else
    echo "✅ 패키지가 이미 설치되어 있습니다"
fi
echo ""

# 4. 개발 서버 실행
echo "[4/4] 개발 서버를 시작합니다..."
echo ""
echo "🚀 브라우저가 자동으로 열립니다."
echo "🛑 서버를 종료하려면 Ctrl+C를 누르거나 ./stop.sh를 실행하세요."
echo ""

# 3초 후 브라우저 오픈
sleep 3
open http://localhost:5173 &

# npm run dev 실행
npm run dev
