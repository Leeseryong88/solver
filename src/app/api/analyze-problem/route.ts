import { NextRequest, NextResponse } from "next/server";
import { analyzeProblemImage } from "@/utils/gemini";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "이미지가 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // Gemini API를 사용하여 이미지 분석
    const solution = await analyzeProblemImage(image);

    return NextResponse.json({ solution });
  } catch (error) {
    console.error("API 라우트 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 