"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCamera, setUsingCamera] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setSolution(null);
      setError(null);
    };
    reader.onerror = () => {
      setError("이미지 로딩 중 오류가 발생했습니다.");
    };
    reader.readAsDataURL(file);
  };

  // 카메라 활성화
  const activateCamera = async () => {
    setUsingCamera(true);
    setSolution(null);
    setError(null);
    setImage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // 후면 카메라 사용
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError("카메라 접근에 실패했습니다. 권한을 확인해주세요.");
      setUsingCamera(false);
    }
  };

  // 사진 찍기
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 비디오 크기에 맞게 캔버스 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 캔버스에 현재 비디오 프레임 그리기
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 이미지 데이터 가져오기
    const imageData = canvas.toDataURL('image/jpeg');
    setImage(imageData);
    
    // 카메라 스트림 정지
    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setUsingCamera(false);
  };

  // 카메라 취소
  const cancelCamera = () => {
    if (!videoRef.current) return;
    
    // 카메라 스트림 정지
    const stream = videoRef.current.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setUsingCamera(false);
  };

  // 초기화 기능
  const resetAll = () => {
    setImage(null);
    setSolution(null);
    setError(null);
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 문제 분석 요청
  const analyzeProblem = async () => {
    if (!image) {
      setError("먼저 이미지를 업로드하거나 카메라로 문제를 찍어주세요.");
      return;
    }

    setLoading(true);
    setSolution(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze-problem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error("서버 응답에 문제가 있습니다.");
      }

      const data = await response.json();
      setSolution(data.solution);
    } catch {
      console.error("문제 분석 중 오류가 발생했습니다.");
      setError("문제 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* 상단 네비게이션 바 */}
      <nav className="bg-blue-600 text-white px-4 py-3 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold text-center">문제 해결사</h1>
      </nav>
      
      <div className="w-full max-w-md mx-auto flex-1 p-4 pb-8">
        <p className="text-center mb-6 text-gray-600 text-sm">
          문제를 카메라로 찍거나 이미지를 업로드하면 AI가 해결해드립니다.
        </p>

        {/* 카메라 뷰 */}
        {usingCamera && (
          <div className="fixed inset-0 bg-black z-20 flex flex-col">
            <div className="flex-1 relative">
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                autoPlay
              />
            </div>
            <div className="bg-black p-4 flex justify-center gap-4">
              <button
                onClick={cancelCamera}
                className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <span className="text-2xl">✕</span>
              </button>
              <button
                onClick={takePhoto}
                className="w-16 h-16 rounded-full border-4 border-white"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* 이미지 미리보기 및 분석 버튼 */}
        {image && (
          <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <div className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">미리보기</p>
              <div className="aspect-[3/4] w-full rounded-md overflow-hidden bg-gray-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {image && (
                    <Image
                      src={image}
                      alt="문제 이미지"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={resetAll}
                  className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100"
                >
                  초기화
                </button>
                <button
                  onClick={analyzeProblem}
                  disabled={loading}
                  className={`w-full py-3 rounded-lg text-white font-medium ${
                    loading
                      ? "bg-gray-400"
                      : "bg-blue-600 active:bg-blue-700"
                  }`}
                >
                  {loading ? "분석 중..." : "문제 분석하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 이미지가 없을 때 메인 버튼 영역 */}
        {!image && !usingCamera && !solution && (
          <div className="w-full bg-white rounded-xl shadow-sm p-4 mb-4">
            <h2 className="text-base font-medium mb-3 text-gray-700">문제 이미지 선택</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-200"
              >
                파일 직접 업로드
              </button>
              <button
                onClick={activateCamera}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                카메라로 촬영
              </button>
            </div>
            <input
              type="file"
              id="problem-image"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="w-full p-4 mb-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 분석 결과 */}
        {solution && (
          <div className="w-full bg-white rounded-xl shadow-sm p-4 mb-8">
            <h2 className="text-lg font-semibold mb-3">문제 해결 결과</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm">
              {solution}
            </div>
            <div className="mt-4">
              <button
                onClick={resetAll}
                className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100"
              >
                새로운 문제 풀기
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
