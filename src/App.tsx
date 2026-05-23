import { useCallback, useState } from 'react';
import PhotoInput from './components/PhotoInput';
import CanvasPreview from './components/CanvasPreview';
import { frames } from './frames/definitions';

const frame = frames[0]; // portrait-strip, 임시 고정

function App() {
  const [images, setImages] = useState<string[]>([]);
  const handleImagesChange = useCallback((imgs: string[]) => setImages(imgs), []);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden border border-[#E5E5E5]">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h1 className="text-lg font-medium text-[#1A1A1A]">4컷 사진</h1>
        </div>
        <div className="p-4 bg-[#F5F5F5] flex justify-center">
          <div style={{ width: '200px' }}>
            <CanvasPreview frame={frame} images={images} />
          </div>
        </div>
        <PhotoInput onImagesChange={handleImagesChange} />
      </div>
    </div>
  );
}

export default App;
