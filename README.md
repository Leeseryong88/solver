# 문제 해결사 (Problem Solver)

이 애플리케이션은 문제 이미지를 업로드하면 Gemini AI를 사용하여 분석하고 해결책을 제공하는 웹 애플리케이션입니다.

## 주요 기능

- 문제 이미지 업로드
- Gemini AI를 사용한 이미지 분석
- 문제 해결 및 답변 제공

## 기술 스택

- Next.js
- TypeScript
- Tailwind CSS
- Google Gemini API

## 시작하기

### 사전 요구사항

- Node.js 18.0.0 이상
- Gemini API 키 (Google AI Studio에서 발급)

### 설치 방법

1. 저장소를 클론합니다:

```bash
git clone <저장소 URL>
cd problem-solver-app
```

2. 의존성을 설치합니다:

```bash
npm install
```

3. 환경 변수를 설정합니다 (두 가지 방법 중 선택):
   
   **방법 1: 수동으로 설정**
   
   프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

   > 주의: `your_api_key_here` 부분을 실제 Gemini API 키로 교체해야 합니다.

   **방법 2: 배치 스크립트 사용 (Windows)**
   
   제공된 배치 스크립트를 실행하여 환경 변수를 설정할 수 있습니다:

```bash
setup-env.bat
```

   프롬프트에 Gemini API 키를 입력하면 자동으로 `.env.local` 파일이 생성됩니다.

4. 개발 서버를 실행합니다:

```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

## 사용 방법

1. 메인 페이지에서 "문제 이미지 업로드" 버튼을 클릭하여 문제가 있는 이미지를 업로드합니다.
2. "문제 분석하기" 버튼을 클릭합니다.
3. Gemini AI가 이미지를 분석하고 문제에 대한 해결책을 제공할 때까지 기다립니다.
4. 결과를 확인합니다.

## 환경 변수 설정

애플리케이션이 올바르게 작동하려면 다음 환경 변수가 필요합니다:

- `NEXT_PUBLIC_GEMINI_API_KEY`: Gemini API 접근을 위한 API 키

이 변수는 `.env.local` 파일에 설정해야 합니다. 이 파일은 Git에 커밋되지 않으며, 로컬 개발 환경에서만 사용됩니다.

## 참고 사항

- Gemini API 키는 [Google AI Studio](https://ai.google.dev/)에서 발급받을 수 있습니다.
- 대용량 이미지의 경우 처리 시간이 길어질 수 있습니다.
- 이미지는 서버에 저장되지 않고 분석 후 삭제됩니다.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
