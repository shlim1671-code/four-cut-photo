import { useCallback, useState } from 'react';
import PhotoInput from './components/PhotoInput';
import CanvasPreview from './components/CanvasPreview';
import FramePicker from './components/FramePicker';
import { frames } from './frames/definitions';
import type { FrameDefinition } from './frames/types';

function App() {
  const [images, setImages] = useState<string[]>([]);
  const [frame, setFrame] = useState<FrameDefinition>(frames[0]);
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
        <div className="border-t border-[#E5E5E5]">
          <p className="px-4 pt-4 text-[13px] text-[#8A8A8A]">프레임 선택</p>
          <FramePicker selectedId={frame.id} onSelect={setFrame} />
        </div>
      </div>
    </div>
  );
}

export default App;
