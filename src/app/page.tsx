"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FormattedSolution } from "@/utils/gemini";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<FormattedSolution | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCamera, setUsingCamera] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false); // 이미지 편집 모드
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 }); // 크롭 영역
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 }); // 드래그 시작점
  const [isDragging, setIsDragging] = useState(false); // 드래그 중 여부
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [resizeMode, setResizeMode] = useState<string | null>(null);

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      setError("파일 크기가 너무 큽니다. 10MB 이하의 이미지를 업로드해주세요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      
      // 이미지 압축 및 크기 조정
      const img = new window.Image(); // window 객체를 사용하여 명시적 타입 제공
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 최대 크기 설정 (너비/높이 1200px 제한)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.floor(height * (maxDimension / width));
            width = maxDimension;
          } else {
            width = Math.floor(width * (maxDimension / height));
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        
        // 압축된 이미지 데이터 (품질 0.85)
        const compressedImage = canvas.toDataURL('image/jpeg', 0.85);
        setImage(compressedImage);
        setSolution(null);
        setError(null);
      };
      
      img.src = imageData;
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
    const originalWidth = video.videoWidth;
    const originalHeight = video.videoHeight;
    
    // 최대 크기 설정 (너비/높이 1200px 제한)
    let width = originalWidth;
    let height = originalHeight;
    const maxDimension = 1200;
    
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.floor(height * (maxDimension / width));
        width = maxDimension;
      } else {
        width = Math.floor(width * (maxDimension / height));
        height = maxDimension;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // 캔버스에 현재 비디오 프레임 그리기
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, width, height);
    
    // 이미지 데이터 가져오기 (압축 품질 0.85)
    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setImage(imageData);
    
    // 카메라 스트림 정지
    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setUsingCamera(false);
    
    // 이미지 편집 모드 활성화
    setIsEditing(true);
  };

  // 이미지 편집 관련 함수들
  useEffect(() => {
    if (isEditing && image && editCanvasRef.current) {
      const canvas = editCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // 이미지 로드
      const img = new window.Image();
      img.onload = () => {
        console.log("이미지 로드 완료:", img.width, img.height);
        
        // 브라우저 창 크기에 맞게 조정
        const maxWidth = Math.min(window.innerWidth * 0.9, 800);
        const maxHeight = window.innerHeight * 0.6;
        
        // 이미지 비율 유지하면서 최대 크기 설정
        let drawWidth, drawHeight;
        const imgRatio = img.width / img.height;
        
        if (imgRatio > 1) {
          // 가로가 더 긴 이미지
          drawWidth = maxWidth;
          drawHeight = drawWidth / imgRatio;
          
          // 높이가 최대 높이를 초과하면 다시 조정
          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = drawHeight * imgRatio;
          }
        } else {
          // 세로가 더 긴 이미지
          drawHeight = maxHeight;
          drawWidth = drawHeight * imgRatio;
          
          // 너비가 최대 너비를 초과하면 다시 조정
          if (drawWidth > maxWidth) {
            drawWidth = maxWidth;
            drawHeight = drawWidth / imgRatio;
          }
        }
        
        // 캔버스 크기 설정
        canvas.width = drawWidth;
        canvas.height = drawHeight;
        
        // 캔버스 스타일 설정
        canvas.style.width = `${drawWidth}px`;
        canvas.style.height = `${drawHeight}px`;
        canvas.style.display = 'block';
        
        // 이미지 그리기 - 배경색 없이 이미지만 그리기
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
        
        // 기본 크롭 영역 설정 (이미지 중앙 70%)
        setCropArea({
          x: drawWidth * 0.15,
          y: drawHeight * 0.15,
          width: drawWidth * 0.7,
          height: drawHeight * 0.7
        });
        
        // 이미지 참조 저장
        imageRef.current = img;
        
        // 크롭 영역 표시 함수 호출
        setTimeout(() => {
          drawCropOverlay();
        }, 50);
      };
      
      img.crossOrigin = "anonymous"; // CORS 오류 방지
      img.src = image;
      
      // 이미지 로드 오류 처리
      img.onerror = (e) => {
        console.error('이미지 로드 실패', e);
        setError('이미지를 로드하는 데 실패했습니다.');
        setIsEditing(false);
      };
    }
  }, [isEditing, image]);
  
  // 크롭 오버레이 그리기 함수
  const drawCropOverlay = () => {
    if (!editCanvasRef.current || !imageRef.current) {
      console.error("캔버스 또는 이미지 참조 없음");
      return;
    }
    
    const canvas = editCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // 원본 이미지 다시 그리기 (배경 초기화)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    // 전체 화면에 반투명 오버레이 추가
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 선택 영역은 완전 투명하게 (오버레이 제거)
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // 크롭 영역에 테두리 추가
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // 코너 핸들 추가
    const handleSize = 12; // 핸들 크기 약간 키움
    ctx.fillStyle = 'white';
    
    // 좌상단
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    // 우상단
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    // 좌하단
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
    // 우하단
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
  };
  
  // 마우스/터치 위치가 핸들 위에 있는지 확인
  const getResizeHandle = (x: number, y: number) => {
    const handleSize = 14; // 조금 더 큰 영역으로 터치 허용
    
    // 각 핸들 위치 확인
    const topLeft = Math.abs(x - cropArea.x) < handleSize/2 && Math.abs(y - cropArea.y) < handleSize/2;
    const topRight = Math.abs(x - (cropArea.x + cropArea.width)) < handleSize/2 && Math.abs(y - cropArea.y) < handleSize/2;
    const bottomLeft = Math.abs(x - cropArea.x) < handleSize/2 && Math.abs(y - (cropArea.y + cropArea.height)) < handleSize/2;
    const bottomRight = Math.abs(x - (cropArea.x + cropArea.width)) < handleSize/2 && Math.abs(y - (cropArea.y + cropArea.height)) < handleSize/2;
    
    if (topLeft) return 'topLeft';
    if (topRight) return 'topRight';
    if (bottomLeft) return 'bottomLeft';
    if (bottomRight) return 'bottomRight';
    
    // 영역 내부인지 확인
    const isInside = x >= cropArea.x && x <= cropArea.x + cropArea.width && 
                     y >= cropArea.y && y <= cropArea.y + cropArea.height;
    
    return isInside ? 'inside' : null;
  };
  
  // 캔버스에 크롭 영역 그리기
  useEffect(() => {
    if (isEditing && editCanvasRef.current && cropArea.width > 0 && imageRef.current) {
      drawCropOverlay();
    }
  }, [isEditing, cropArea]);
  
  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editCanvasRef.current) return;
    e.preventDefault();
    
    const canvas = editCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // 클릭한 위치가 핸들 위인지 확인
    const handle = getResizeHandle(x, y);
    setResizeMode(handle);
    
    setStartPoint({ x, y });
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !editCanvasRef.current) return;
    e.preventDefault();
    
    const canvas = editCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // 시작점과 현재 위치의 차이 계산
    const dx = x - startPoint.x;
    const dy = y - startPoint.y;
    
    if (resizeMode === 'inside') {
      // 이동 모드 - 전체 영역 이동
      const newX = Math.max(0, Math.min(cropArea.x + dx, canvas.width - cropArea.width));
      const newY = Math.max(0, Math.min(cropArea.y + dy, canvas.height - cropArea.height));
      
      setCropArea(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (resizeMode) {
      // 크기 조절 모드
      let newX = cropArea.x;
      let newY = cropArea.y;
      let newWidth = cropArea.width;
      let newHeight = cropArea.height;
      
      // 핸들에 따라 다른 동작
      if (resizeMode === 'topLeft') {
        newX = Math.min(cropArea.x + dx, cropArea.x + cropArea.width - 30);
        newY = Math.min(cropArea.y + dy, cropArea.y + cropArea.height - 30);
        newWidth = cropArea.width - (newX - cropArea.x);
        newHeight = cropArea.height - (newY - cropArea.y);
      } else if (resizeMode === 'topRight') {
        newY = Math.min(cropArea.y + dy, cropArea.y + cropArea.height - 30);
        newWidth = Math.max(30, cropArea.width + dx);
        newHeight = cropArea.height - (newY - cropArea.y);
      } else if (resizeMode === 'bottomLeft') {
        newX = Math.min(cropArea.x + dx, cropArea.x + cropArea.width - 30);
        newWidth = cropArea.width - (newX - cropArea.x);
        newHeight = Math.max(30, cropArea.height + dy);
      } else if (resizeMode === 'bottomRight') {
        newWidth = Math.max(30, cropArea.width + dx);
        newHeight = Math.max(30, cropArea.height + dy);
      }
      
      // 최대 범위 제한
      if (newX < 0) {
        newWidth += newX;
        newX = 0;
      }
      if (newY < 0) {
        newHeight += newY;
        newY = 0;
      }
      if (newX + newWidth > canvas.width) {
        newWidth = canvas.width - newX;
      }
      if (newY + newHeight > canvas.height) {
        newHeight = canvas.height - newY;
      }
      
      // 최소 크기 제한
      newWidth = Math.max(30, newWidth);
      newHeight = Math.max(30, newHeight);
      
      setCropArea({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
    
    setStartPoint({ x, y });
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setResizeMode(null);
  };
  
  // 터치 이벤트 핸들러 (마우스 이벤트와 유사)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!editCanvasRef.current || e.touches.length === 0) return;
    e.preventDefault();
    
    const canvas = editCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    // 터치한 위치가 핸들 위인지 확인
    const handle = getResizeHandle(x, y);
    setResizeMode(handle);
    
    setStartPoint({ x, y });
    setIsDragging(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !editCanvasRef.current || e.touches.length === 0) return;
    e.preventDefault();
    
    const canvas = editCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    // 시작점과 현재 위치의 차이 계산
    const dx = x - startPoint.x;
    const dy = y - startPoint.y;
    
    if (resizeMode === 'inside') {
      // 이동 모드 - 전체 영역 이동
      const newX = Math.max(0, Math.min(cropArea.x + dx, canvas.width - cropArea.width));
      const newY = Math.max(0, Math.min(cropArea.y + dy, canvas.height - cropArea.height));
      
      setCropArea(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (resizeMode) {
      // 크기 조절 모드 - 마우스 이벤트와 동일한 로직
      let newX = cropArea.x;
      let newY = cropArea.y;
      let newWidth = cropArea.width;
      let newHeight = cropArea.height;
      
      if (resizeMode === 'topLeft') {
        newX = Math.min(cropArea.x + dx, cropArea.x + cropArea.width - 30);
        newY = Math.min(cropArea.y + dy, cropArea.y + cropArea.height - 30);
        newWidth = cropArea.width - (newX - cropArea.x);
        newHeight = cropArea.height - (newY - cropArea.y);
      } else if (resizeMode === 'topRight') {
        newY = Math.min(cropArea.y + dy, cropArea.y + cropArea.height - 30);
        newWidth = Math.max(30, cropArea.width + dx);
        newHeight = cropArea.height - (newY - cropArea.y);
      } else if (resizeMode === 'bottomLeft') {
        newX = Math.min(cropArea.x + dx, cropArea.x + cropArea.width - 30);
        newWidth = cropArea.width - (newX - cropArea.x);
        newHeight = Math.max(30, cropArea.height + dy);
      } else if (resizeMode === 'bottomRight') {
        newWidth = Math.max(30, cropArea.width + dx);
        newHeight = Math.max(30, cropArea.height + dy);
      }
      
      // 범위 제한
      if (newX < 0) {
        newWidth += newX;
        newX = 0;
      }
      if (newY < 0) {
        newHeight += newY;
        newY = 0;
      }
      if (newX + newWidth > canvas.width) {
        newWidth = canvas.width - newX;
      }
      if (newY + newHeight > canvas.height) {
        newHeight = canvas.height - newY;
      }
      
      newWidth = Math.max(30, newWidth);
      newHeight = Math.max(30, newHeight);
      
      setCropArea({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
    
    setStartPoint({ x, y });
  };
  
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setResizeMode(null);
  };
  
  // 편집 완료 처리
  const finishEditing = () => {
    if (!editCanvasRef.current || !imageRef.current) return;
    
    const canvas = editCanvasRef.current;
    const img = imageRef.current;
    
    // 원본 이미지에서의 비율 계산
    const scaleX = img.width / canvas.width;
    const scaleY = img.height / canvas.height;
    
    // 원본 이미지에서의 자르기 영역 계산
    const srcX = cropArea.x * scaleX;
    const srcY = cropArea.y * scaleY;
    const srcWidth = cropArea.width * scaleX;
    const srcHeight = cropArea.height * scaleY;
    
    // 임시 캔버스에 잘라낸 이미지 그리기
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = srcWidth;
    tempCanvas.height = srcHeight;
    
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      img,
      srcX, srcY, srcWidth, srcHeight, // 소스 영역
      0, 0, srcWidth, srcHeight        // 대상 영역
    );
    
    // 잘라낸 이미지를 base64로 변환
    const croppedImage = tempCanvas.toDataURL('image/jpeg', 0.85);
    setImage(croppedImage);
    
    // 편집 모드 종료
    setIsEditing(false);
  };
  
  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
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
        
        {/* 이미지 편집 뷰 */}
        {isEditing && image && (
          <div className="fixed inset-0 bg-black z-20 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative overflow-hidden">
                <canvas 
                  ref={editCanvasRef}
                  className="block"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
            </div>
            <div className="p-2 bg-gray-900">
              <p className="text-white text-sm mb-2 text-center">
                선택 영역을 드래그하여 위치를 조정하고, 모서리 핸들을 드래그하여 크기를 조절하세요
              </p>
            </div>
            <div className="bg-gray-900 p-4 flex justify-center gap-4">
              <button
                onClick={cancelEditing}
                className="flex-1 py-3 rounded-lg bg-red-500 text-white font-medium"
              >
                취소
              </button>
              <button
                onClick={finishEditing}
                className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium"
              >
                적용
              </button>
            </div>
          </div>
        )}

        {/* 이미지 미리보기 및 분석 버튼 */}
        {!isEditing && image && (
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
        {!image && !usingCamera && !solution && !isEditing && (
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
            
            {solution.problemType && (
              <div className="mb-3">
                <span className="text-gray-700 font-medium">문제 유형:</span> 
                <span className="ml-2">{solution.problemType}</span>
              </div>
            )}
            
            <div 
              className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-md text-sm"
              dangerouslySetInnerHTML={{ __html: solution.html }}
            />
            
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
