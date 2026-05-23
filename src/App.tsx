import { useCallback, useState } from 'react';
import PhotoInput from './components/PhotoInput';

function App() {
  const [images, setImages] = useState<string[]>([]);
  const handleImagesChange = useCallback((imgs: string[]) => setImages(imgs), []);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden border border-[#E5E5E5]">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h1 className="text-lg font-medium text-[#1A1A1A]">4컷 사진</h1>
        </div>
        <PhotoInput onImagesChange={handleImagesChange} />
        {images.length > 0 && (
          <p className="px-4 pb-4 text-[#8A8A8A] text-sm">
            {images.length}장 준비됨
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
