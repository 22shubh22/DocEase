import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// CSS pixels per centimeter at 96 DPI (standard screen resolution)
// 1 inch = 2.54 cm, 1 inch = 96 pixels, so 1 cm = 96/2.54 ≈ 37.8 pixels
const PIXELS_PER_CM = 37.795275591;

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH_PX = 595;  // 21cm
const A4_HEIGHT_PX = 842; // 29.7cm

// Validation constraints
const MAX_TOP_POSITION = 400;
const MAX_LEFT_POSITION = 200;

export default function PreferencesSettings({ user, updateUser }) {
  // Check if user has permission to edit print settings
  const canEditPrintSettings = user?.permissions?.can_edit_print_settings ?? false;

  const [printPosition, setPrintPosition] = useState({
    top: user?.printSettings?.top || 280,
    left: user?.printSettings?.left || 40,
  });

  // Debounced preview position for smooth updates
  const [previewPosition, setPreviewPosition] = useState(printPosition);

  // Loading state
  const [isSavingPrintSettings, setIsSavingPrintSettings] = useState(false);

  // Debounce preview updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewPosition(printPosition);
    }, 100);
    return () => clearTimeout(timer);
  }, [printPosition]);

  const savePrintSettings = async () => {
    setIsSavingPrintSettings(true);
    try {
      const updatedUser = {
        ...user,
        printSettings: printPosition
      };
      updateUser(updatedUser);
      toast.success('Print settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save print settings');
    } finally {
      setIsSavingPrintSettings(false);
    }
  };

  // Handle print position changes with clamping
  const handleTopChange = (value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(MAX_TOP_POSITION, numValue));
    setPrintPosition({ ...printPosition, top: clampedValue });
  };

  const handleLeftChange = (value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(MAX_LEFT_POSITION, numValue));
    setPrintPosition({ ...printPosition, left: clampedValue });
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
        Prescription Print Settings
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Configure where prescriptions will be printed on your pre-printed letterhead
      </p>

      {!canEditPrintSettings && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">
            You do not have permission to edit print settings. Please contact your clinic administrator.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label" id="top-label">Distance from Top</label>
          <input
            type="range"
            min="0"
            max={MAX_TOP_POSITION}
            value={printPosition.top}
            onChange={(e) => handleTopChange(e.target.value)}
            className="w-full"
            aria-labelledby="top-label"
            aria-valuemin="0"
            aria-valuemax={MAX_TOP_POSITION}
            aria-valuenow={printPosition.top}
            disabled={!canEditPrintSettings}
          />
          <div className="flex justify-between items-center mt-2">
            <input
              type="number"
              min="0"
              max={MAX_TOP_POSITION}
              value={printPosition.top}
              onChange={(e) => handleTopChange(e.target.value)}
              className="input w-24"
              aria-label="Distance from top in pixels"
              disabled={!canEditPrintSettings}
            />
            <span className="text-sm text-gray-600">{Math.round(printPosition.top / PIXELS_PER_CM)} cm</span>
          </div>
        </div>

        <div>
          <label className="label" id="left-label">Distance from Left</label>
          <input
            type="range"
            min="0"
            max={MAX_LEFT_POSITION}
            value={printPosition.left}
            onChange={(e) => handleLeftChange(e.target.value)}
            className="w-full"
            aria-labelledby="left-label"
            aria-valuemin="0"
            aria-valuemax={MAX_LEFT_POSITION}
            aria-valuenow={printPosition.left}
            disabled={!canEditPrintSettings}
          />
          <div className="flex justify-between items-center mt-2">
            <input
              type="number"
              min="0"
              max={MAX_LEFT_POSITION}
              value={printPosition.left}
              onChange={(e) => handleLeftChange(e.target.value)}
              className="input w-24"
              aria-label="Distance from left in pixels"
              disabled={!canEditPrintSettings}
            />
            <span className="text-sm text-gray-600">{Math.round(printPosition.left / PIXELS_PER_CM)} cm</span>
          </div>
        </div>
      </div>

      {/* A4 Preview */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-3">Preview on A4 Page</h3>
        <div className="bg-gray-200 p-4 rounded-lg overflow-x-auto">
          <div
            className="bg-white mx-auto shadow-lg"
            style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, position: 'relative', overflow: 'hidden' }}
            role="img"
            aria-label="A4 page preview showing print area position"
          >
            <div className="absolute inset-0 border-2 border-dashed border-blue-300 pointer-events-none"></div>
            <div
              className="absolute bg-yellow-50 border-2 border-blue-400 opacity-50 transition-all duration-100"
              style={{
                top: `${previewPosition.top}px`,
                left: `${previewPosition.left}px`,
                right: '40px',
                bottom: '40px',
              }}
            >
              <div className="text-center text-xs text-blue-600 mt-2">Print Area</div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-600 mt-2">A4 Page (21cm x 29.7cm)</p>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setPrintPosition({ top: 280, left: 40 })}
          className="text-sm px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canEditPrintSettings}
        >
          Default (Letterhead)
        </button>
        <button
          onClick={() => setPrintPosition({ top: 0, left: 40 })}
          className="text-sm px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canEditPrintSettings}
        >
          Full Page
        </button>
      </div>

      {/* Save Button */}
      <div className="mt-6 pt-4 border-t">
        <button
          onClick={savePrintSettings}
          className="btn btn-primary"
          disabled={isSavingPrintSettings || !canEditPrintSettings}
        >
          {isSavingPrintSettings ? 'Saving...' : 'Save Print Settings'}
        </button>
      </div>
    </div>
  );
}
