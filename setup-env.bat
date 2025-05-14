@echo off
echo 환경 변수 설정 파일 생성 스크립트

set /p API_KEY="Gemini API 키를 입력하세요: "

echo # Gemini API 설정 파일 > .env.local
echo NEXT_PUBLIC_GEMINI_API_KEY=%API_KEY% >> .env.local

echo .env.local 파일이 생성되었습니다.
echo 환경 변수가 성공적으로 설정되었습니다!
echo 이제 'npm run dev' 명령어로 개발 서버를 실행할 수 있습니다. 