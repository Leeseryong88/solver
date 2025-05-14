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
    const prompt = `다음 이미지에 있는 문제를 분석하고 해결해주세요. 정확성을 높이기 위해 다음 단계에 따라 체계적으로 접근하세요:

1. 문제 인식 및 분류:
   - 이미지에서 문제 텍스트를 정확히 식별하세요
   - 문제 유형(수학, 물리, 화학, 생물학, 다이빙 등)을 파악하세요
   - 필요한 공식이나 원칙을 명시하세요

2. 단계별 해결 과정:
   - 첫 단계: 문제를 더 작은 부분으로 분해하세요
   - 중간 단계: 각 부분을 순차적으로 해결하세요
   - 최종 단계: 각 부분의 해결책을 종합하세요

3. 검증 및 교차 확인:
   - 다른 방법으로도 문제를 풀어보세요
   - 결과가 논리적으로 타당한지 검토하세요
   - 단위와 수치가 올바른지 확인하세요

4. 신뢰도 평가:
   - 확실한 답변: 90% 이상 확신하는 경우
   - 가능성 높은 답변: 70-90% 확신하는 경우
   - 가능한 답변: 50-70% 확신하는 경우
   - 확신할 수 없음: 50% 미만으로 확신하는 경우

아래 형식으로 답변을 제공하세요:

---------------------------------------
## 문제 유형
[문제의 주제 분야]

## 문제 내용
[이미지에서 식별된 문제 텍스트]

## 해결 과정
[단계별 상세한 풀이 과정]

## 정답
[최종 답안]

## 신뢰도
[확실한 답변/가능성 높은 답변/가능한 답변/확신할 수 없음]

## 대안적 접근
[다른 방법으로 문제를 해결했을 때의 결과, 필요한 경우]

## 참고 사항
[풀이에 사용된 공식, 이론, 개념 등의 추가 설명]
---------------------------------------

답변은 한국어로 제공하시고, 최대한 정확하고 상세하게 설명해주세요.`;
    
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