import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 키 설정
const apiKey = "AIzaSyA24tR4uwVI1lTnvm0yxvDZguaX2t2xx48";

// Gemini 모델 초기화 (2.0 Flash 모델 사용)
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// 이미지를 분석하고 문제 해결 함수
export async function analyzeProblemImage(imageBase64: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("Gemini API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_GEMINI_API_KEY를 설정해주세요.");
    }

    // 이미지를 Gemini API 형식으로 변환
    const imageData = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
        mimeType: "image/jpeg",
      },
    };

    // 프롬프트 설정
    const prompt = `다음에 제시될 다이빙 관련 시험 문제 이미지를 분석하고, 문제에 제시된 조건을 고려하여 가능한 모든 정답을 찾으시오. 정답은 2개 이상일 수 있습니다. 각 정답에 대해 간결하고 명확한 풀이 과정을 함께 제시하되, 다음과 같은 형식을 따르시오.

정답: [영어 정답 (영문 문제의 경우)] / [한국어 정답 (영문 외 문제의 경우)]

해설: [정답에 대한 간략하고 명확한 설명 (한국어)]`;
    
    // Gemini API 호출
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Gemini API 호출 중 오류 발생:", error);
    return "이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.";
  }
} 