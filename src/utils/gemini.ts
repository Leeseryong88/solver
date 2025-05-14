import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from 'marked';

// Gemini API 키 설정
const apiKey = "AIzaSyA24tR4uwVI1lTnvm0yxvDZguaX2t2xx48";

// Gemini 모델 초기화 (2.0 Flash 모델 사용)
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// 응답 텍스트를 파싱하고 형식화하는 함수
function formatResponse(text: string): string {
  try {
    // 마크다운 구문의 강조 표시(**text**)를 HTML <strong> 태그로 변환
    const formattedText = text
      // 섹션 분리와 형식화 개선
      .replace(/^#{2,3}\s+(.*?)$/gm, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>')
      // 번호가 매겨진 항목 형식화 (1., 2., 3. 등)
      .replace(/^\d+\.\s+(.+?)(\*\*.*?\*\*)(.+?)$/gm, (match, prefix, emphasizedText, suffix) => {
        const cleanEmphasis = emphasizedText.replace(/\*\*/g, '');
        return `<div class="my-2">
          <span class="font-medium">${prefix}</span>
          <span class="font-bold text-blue-600">${cleanEmphasis}</span>
          <span>${suffix}</span>
        </div>`;
      })
      // 일반 강조 텍스트 처리
      .replace(/\*\*(.*?)\*\*/g, '<span class="font-bold">$1</span>')
      // 분리선 처리
      .replace(/^-{3,}$/gm, '<hr class="my-4 border-gray-300" />')
      // 참고 사항이나 주요 내용 강조 (인용 블록 스타일)
      .replace(/^\[(.*?)\]$/gm, '<div class="bg-gray-100 p-2 rounded my-2 italic">$1</div>');

    return formattedText;
  } catch (error) {
    console.error('응답 파싱 중 오류 발생:', error);
    return text; // 오류 발생 시 원본 텍스트 반환
  }
}

// 구조화된 응답 객체 타입 정의
export interface FormattedSolution {
  html: string;         // HTML로 형식화된 전체 응답
  problemType?: string;  // 문제 유형
  problemText?: string;  // 문제 내용
  answer?: string;       // 정답
  confidence?: string;   // 신뢰도
}

// 이미지를 분석하고 문제 해결 함수
export async function analyzeProblemImage(imageBase64: string): Promise<FormattedSolution> {
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
    const rawText = response.text();
    
    // 응답 파싱 및 추출
    const problemTypeMatch = rawText.match(/## 문제 유형\s*\n([\s\S]*?)(?=\n##|$)/);
    const problemTextMatch = rawText.match(/## 문제 내용\s*\n([\s\S]*?)(?=\n##|$)/);
    const answerMatch = rawText.match(/## 정답\s*\n([\s\S]*?)(?=\n##|$)/);
    const confidenceMatch = rawText.match(/## 신뢰도\s*\n([\s\S]*?)(?=\n##|$)/);
    
    // 형식화된 HTML 생성
    const formattedHtml = formatResponse(rawText);
    
    // 구조화된 응답 객체 반환
    return {
      html: formattedHtml,
      problemType: problemTypeMatch ? problemTypeMatch[1].trim() : undefined,
      problemText: problemTextMatch ? problemTextMatch[1].trim() : undefined,
      answer: answerMatch ? answerMatch[1].trim() : undefined,
      confidence: confidenceMatch ? confidenceMatch[1].trim() : undefined
    };
  } catch (error) {
    console.error("Gemini API 호출 중 오류 발생:", error);
    return {
      html: "<div class='text-red-600'>이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.</div>"
    };
  }
} 