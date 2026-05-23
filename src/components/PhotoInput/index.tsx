import { useEffect, useRef, useState } from 'react';

interface PhotoInputProps {
  onImagesChange: (images: string[]) => void;
}

export default function PhotoInput({ onImagesChange }: PhotoInputProps) {
  const [mode, setMode] = useState<'upload' | 'webcam'>('upload');
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    onImagesChange(images);
  }, [images, onImagesChange]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStream(null);
    setWebcamError(null);
  };

  const handleModeChange = (newMode: 'upload' | 'webcam') => {
    if (newMode !== 'webcam') stopWebcam();
    setMode(newMode);
  };

  const readFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    Promise.all(
      imageFiles.map(
        f =>
          new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target!.result as string);
            reader.readAsDataURL(f);
          })
      )
    ).then(newImages => setImages(prev => [...prev, ...newImages]));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    readFiles(Array.from(e.dataTransfer.files));
  };

  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = s;
      setStream(s);
    } catch {
      setWebcamError('카메라에 접근할 수 없습니다.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    setImages(prev => [...prev, canvas.toDataURL('image/jpeg')]);
  };

  const startCountdown = () => {
    let n = 3;
    setCountdown(n);
    const id = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(id);
        setCountdown(null);
        capturePhoto();
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white">
      <div className="flex border border-[#E5E5E5] rounded-xl overflow-hidden">
        {(['upload', 'webcam'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`flex-1 py-3 text-sm font-medium min-h-[44px] ${
              mode === m ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]'
            }`}
          >
            {m === 'upload' ? '파일 업로드' : '웹캠 촬영'}
          </button>
        ))}
      </div>

      {mode === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 min-h-[160px] rounded-xl border-2 border-dashed cursor-pointer ${
            isDragging ? 'border-[#1A1A1A] bg-[#F5F5F5]' : 'border-[#E5E5E5] bg-white'
          }`}
        >
          <span className="text-[#8A8A8A] text-sm">사진을 여기에 끌어다 놓거나</span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="min-h-[44px] px-6 border border-[#1A1A1A] rounded-xl text-sm font-medium text-[#1A1A1A]"
          >
            파일 선택
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && readFiles(Array.from(e.target.files))}
          />
        </div>
      )}

      {mode === 'webcam' && (
        <div className="flex flex-col gap-3">
          {!stream && (
            <button
              type="button"
              onClick={startWebcam}
              className="min-h-[44px] bg-[#1A1A1A] text-white rounded-xl text-sm font-medium"
            >
              카메라 시작
            </button>
          )}
          {webcamError && (
            <p className="text-[#8A8A8A] text-sm text-center">{webcamError}</p>
          )}
          {stream && (
            <>
              <div className="relative rounded-xl overflow-hidden bg-[#F5F5F5]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-white text-7xl font-medium">{countdown}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={startCountdown}
                disabled={countdown !== null}
                className="min-h-[44px] bg-[#1A1A1A] text-white rounded-xl text-sm font-medium disabled:opacity-40"
              >
                {countdown !== null ? '촬영 중...' : '촬영'}
              </button>
            </>
          )}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[#8A8A8A] text-sm">{images.length}장 선택됨</p>
          <div className="grid grid-cols-4 gap-2">
            {images.map((src, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#F5F5F5]">
                <img src={src} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
