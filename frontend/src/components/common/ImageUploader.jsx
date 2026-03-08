import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

const MAX_FILE_SIZE = 200 * 1024; // 200KB

export default function ImageUploader({ currentUrl, onUpload, label = 'Upload Image', maxHeight = 80 }) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be less than 200KB');
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      onUpload(dataUrl);
    } catch {
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={currentUrl}
            alt={label}
            className="border rounded bg-gray-50"
            style={{ height: `${maxHeight}px`, maxWidth: '160px', objectFit: 'contain' }}
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary-600 hover:text-primary-700"
              disabled={isProcessing}
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onUpload('')}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-sm text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {isProcessing ? 'Processing...' : label}
        </button>
      )}
      <p className="text-xs text-gray-400 mt-1">Max 200KB. PNG, JPG supported.</p>
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
