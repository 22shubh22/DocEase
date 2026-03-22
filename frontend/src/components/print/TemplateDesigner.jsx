import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import usePrintTemplateStore from '../../store/printTemplateStore';
import { clinicAPI } from '../../services/api';
import PresetCard from './PresetCard';
import TemplatePreview from './TemplatePreview';
import ImageUploader from '../common/ImageUploader';

const PIXELS_PER_CM = 37.795275591;
const MAX_TOP = 400;
const MAX_LEFT = 200;

export default function TemplateDesigner({ user }) {
  const { template, fetchTemplate, updateTemplate, applyPreset, isLoading } = usePrintTemplateStore();
  const canEdit = user?.permissions?.can_edit_print_settings ?? (user?.role === 'DOCTOR');

  // Local state for edits before saving
  const [localTemplate, setLocalTemplate] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch template and clinic data on mount
  useEffect(() => {
    fetchTemplate();
    loadClinicData();
  }, []);

  // Sync local state when template loads
  useEffect(() => {
    if (template) {
      setLocalTemplate(structuredClone(template));
      setHasChanges(false);
    }
  }, [template]);

  const loadClinicData = async () => {
    try {
      const [clinicRes, doctorRes] = await Promise.all([
        clinicAPI.getInfo(),
        clinicAPI.getDoctorProfile().catch(() => null),
      ]);
      const clinicData = clinicRes.data.clinic || clinicRes.data;
      setClinic({
        name: clinicData.name,
        address: clinicData.address,
        phone: clinicData.phone,
        email: clinicData.email,
        logo_url: clinicData.logo_url,
      });
      if (doctorRes?.data) {
        const doc = doctorRes.data.doctor || doctorRes.data;
        setDoctor({
          name: user?.full_name,
          qualification: doc.qualification,
          specialization: doc.specialization,
          registration_number: doc.registration_number,
          signature_url: doc.signature_url,
        });
      }
    } catch {
      // Non-critical, preview will just show placeholder text
    }
  };

  const updateLocalField = (field, value) => {
    setLocalTemplate(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateLocalConfig = (section, field, value) => {
    setLocalTemplate(prev => {
      const config = { ...(prev.template_config || {}) };
      config[section] = { ...(config[section] || {}), [field]: value };
      return { ...prev, template_config: config };
    });
    setHasChanges(true);
  };

  const handleModeToggle = (mode) => {
    updateLocalField('print_mode', mode);
  };

  const handlePresetSelect = async (presetId) => {
    if (!canEdit) return;
    const currentMode = localTemplate.print_mode;
    const result = await applyPreset(presetId);
    if (result.success) {
      // Preserve the local print_mode that may not have been saved yet
      setLocalTemplate(prev => ({ ...prev, print_mode: currentMode }));
      toast.success(`Applied "${presetId}" template`);
    } else {
      toast.error(result.error);
    }
  };

  const handleSave = async () => {
    if (!canEdit || !localTemplate) return;
    setIsSaving(true);
    try {
      const result = await updateTemplate({
        print_mode: localTemplate.print_mode,
        preset_id: localTemplate.preset_id,
        content_top_px: localTemplate.content_top_px,
        content_left_px: localTemplate.content_left_px,
        content_right_px: localTemplate.content_right_px,
        template_config: localTemplate.template_config,
      });
      if (result.success) {
        toast.success('Print template saved!');
        setHasChanges(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (dataUrl) => {
    try {
      await clinicAPI.update({ logo_url: dataUrl });
      setClinic(prev => ({ ...prev, logo_url: dataUrl }));
      toast.success('Logo updated');
    } catch {
      toast.error('Failed to upload logo');
    }
  };

  const handleSignatureUpload = async (dataUrl) => {
    try {
      await clinicAPI.updateDoctorProfile({ signature_url: dataUrl });
      setDoctor(prev => ({ ...prev, signature_url: dataUrl }));
      toast.success('Signature updated');
    } catch {
      toast.error('Failed to upload signature');
    }
  };

  if (isLoading && !localTemplate) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!localTemplate) return null;

  const isDigital = localTemplate.print_mode === 'digital';
  const headerConfig = localTemplate.template_config?.header || {};
  const footerConfig = localTemplate.template_config?.footer || {};
  const watermarkConfig = localTemplate.template_config?.watermark || {};

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Prescription Print Template</h2>
      <p className="text-sm text-gray-500 mb-6">Design how your prescriptions look when printed</p>

      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          <p className="text-sm">You do not have permission to edit print settings. Contact your clinic administrator.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-6">

          {/* Mode Toggle */}
          <div>
            <label className="label mb-2">Print Mode</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                type="button"
                onClick={() => handleModeToggle('letterhead')}
                disabled={!canEdit}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  !isDigital
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                } disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Pre-printed Letterhead
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('digital')}
                disabled={!canEdit}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  isDigital
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                } disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Digital Template
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isDigital
                ? 'Header & footer will be printed digitally - use plain paper'
                : 'Content positioned for your pre-printed letterhead paper'
              }
            </p>
          </div>

          {/* Digital Template Options */}
          {isDigital && (
            <>
              {/* Preset Selection */}
              <div>
                <label className="label mb-2">Choose a Layout</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['classic', 'modern', 'minimal', 'bold'].map(presetId => (
                    <PresetCard
                      key={presetId}
                      presetId={presetId}
                      isSelected={localTemplate.preset_id === presetId}
                      onSelect={handlePresetSelect}
                      disabled={!canEdit}
                    />
                  ))}
                </div>
              </div>

              {/* Header Customization */}
              <div>
                <label className="label mb-2">Header Settings</label>
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Clinic Logo</label>
                    <ImageUploader
                      currentUrl={clinic?.logo_url}
                      onUpload={handleLogoUpload}
                      label="Upload Logo"
                      maxHeight={60}
                    />
                  </div>

                  <ToggleRow label="Show clinic name" checked={headerConfig.show_clinic_name !== false} onChange={v => updateLocalConfig('header', 'show_clinic_name', v)} disabled={!canEdit} />
                  <ToggleRow label="Show address" checked={headerConfig.show_address !== false} onChange={v => updateLocalConfig('header', 'show_address', v)} disabled={!canEdit} />
                  <ToggleRow label="Show phone" checked={headerConfig.show_phone !== false} onChange={v => updateLocalConfig('header', 'show_phone', v)} disabled={!canEdit} />
                  <ToggleRow label="Show email" checked={!!headerConfig.show_email} onChange={v => updateLocalConfig('header', 'show_email', v)} disabled={!canEdit} />
                  <ToggleRow label="Show doctor name" checked={headerConfig.show_doctor_name !== false} onChange={v => updateLocalConfig('header', 'show_doctor_name', v)} disabled={!canEdit} />
                  <ToggleRow label="Show qualification" checked={headerConfig.show_qualification !== false} onChange={v => updateLocalConfig('header', 'show_qualification', v)} disabled={!canEdit} />
                  <ToggleRow label="Show registration number" checked={headerConfig.show_registration !== false} onChange={v => updateLocalConfig('header', 'show_registration', v)} disabled={!canEdit} />
                  <ToggleRow label="Show specialization" checked={headerConfig.show_specialization !== false} onChange={v => updateLocalConfig('header', 'show_specialization', v)} disabled={!canEdit} />

                  <div>
                    <label className="text-xs font-medium text-gray-600">Custom tagline</label>
                    <input
                      type="text"
                      value={headerConfig.custom_tagline || ''}
                      onChange={e => updateLocalConfig('header', 'custom_tagline', e.target.value)}
                      placeholder="e.g. Caring for your little ones"
                      className="input mt-1"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Customization */}
              <div>
                <label className="label mb-2">Footer Settings</label>
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Doctor Signature</label>
                    <ImageUploader
                      currentUrl={doctor?.signature_url}
                      onUpload={handleSignatureUpload}
                      label="Upload Signature"
                      maxHeight={50}
                    />
                  </div>

                  <ToggleRow label="Show signature line" checked={footerConfig.show_signature_line !== false} onChange={v => updateLocalConfig('footer', 'show_signature_line', v)} disabled={!canEdit} />
                  <ToggleRow label="Show doctor name in footer" checked={footerConfig.show_doctor_name !== false} onChange={v => updateLocalConfig('footer', 'show_doctor_name', v)} disabled={!canEdit} />
                  <ToggleRow label="Show clinic contact" checked={footerConfig.show_clinic_contact !== false} onChange={v => updateLocalConfig('footer', 'show_clinic_contact', v)} disabled={!canEdit} />

                  <div>
                    <label className="text-xs font-medium text-gray-600">Custom footer text</label>
                    <input
                      type="text"
                      value={footerConfig.custom_footer_text || ''}
                      onChange={e => updateLocalConfig('footer', 'custom_footer_text', e.target.value)}
                      placeholder="e.g. Wishing your child a speedy recovery"
                      className="input mt-1"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              {/* Watermark */}
              <div>
                <label className="label mb-2">Watermark</label>
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <ToggleRow label="Enable watermark" checked={!!watermarkConfig.enabled} onChange={v => updateLocalConfig('watermark', 'enabled', v)} disabled={!canEdit} />
                  {watermarkConfig.enabled && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Opacity</label>
                        <input
                          type="range"
                          min="0.01"
                          max="0.15"
                          step="0.01"
                          value={watermarkConfig.opacity || 0.05}
                          onChange={e => updateLocalConfig('watermark', 'opacity', parseFloat(e.target.value))}
                          className="w-full mt-1"
                          disabled={!canEdit}
                        />
                        <span className="text-xs text-gray-400">{Math.round((watermarkConfig.opacity || 0.05) * 100)}%</span>
                      </div>
                      <ToggleRow label="Use logo as watermark" checked={watermarkConfig.use_logo !== false} onChange={v => updateLocalConfig('watermark', 'use_logo', v)} disabled={!canEdit} />
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Content Position (both modes) */}
          <div>
            <label className="label mb-2">Content Position</label>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Distance from Top</span>
                  <span className="text-gray-400">{Math.round(localTemplate.content_top_px / PIXELS_PER_CM)} cm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={MAX_TOP}
                  value={localTemplate.content_top_px}
                  onChange={e => updateLocalField('content_top_px', parseInt(e.target.value))}
                  className="w-full"
                  disabled={!canEdit}
                />
                <input
                  type="number"
                  min="0"
                  max={MAX_TOP}
                  value={localTemplate.content_top_px}
                  onChange={e => updateLocalField('content_top_px', Math.min(MAX_TOP, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="input w-20 mt-1"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Distance from Left</span>
                  <span className="text-gray-400">{Math.round(localTemplate.content_left_px / PIXELS_PER_CM)} cm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={MAX_LEFT}
                  value={localTemplate.content_left_px}
                  onChange={e => updateLocalField('content_left_px', parseInt(e.target.value))}
                  className="w-full"
                  disabled={!canEdit}
                />
                <input
                  type="number"
                  min="0"
                  max={MAX_LEFT}
                  value={localTemplate.content_left_px}
                  onChange={e => updateLocalField('content_left_px', Math.min(MAX_LEFT, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="input w-20 mt-1"
                  disabled={!canEdit}
                />
              </div>
            </div>

            {!isDigital && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => { updateLocalField('content_top_px', 280); updateLocalField('content_left_px', 40); }}
                  className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={!canEdit}
                >
                  Default (Letterhead)
                </button>
                <button
                  type="button"
                  onClick={() => { updateLocalField('content_top_px', 0); updateLocalField('content_left_px', 40); }}
                  className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={!canEdit}
                >
                  Full Page
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          {canEdit && (
            <div className="pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="btn btn-primary w-full sm:w-auto"
              >
                {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <label className="label mb-2">Live Preview</label>
          <TemplatePreview
            template={localTemplate}
            clinic={clinic}
            doctor={doctor}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center justify-between ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`} />
      </button>
    </label>
  );
}
