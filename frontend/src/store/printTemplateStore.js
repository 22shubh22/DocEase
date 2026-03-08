import { create } from 'zustand';
import { printTemplateAPI } from '../services/api';

const DEFAULT_TEMPLATE = {
  print_mode: 'letterhead',
  preset_id: 'classic',
  content_top_px: 280,
  content_left_px: 40,
  content_right_px: 40,
  template_config: {
    header: {
      show_logo: true,
      show_clinic_name: true,
      show_address: true,
      show_phone: true,
      show_email: false,
      show_doctor_name: true,
      show_qualification: true,
      show_registration: true,
      show_specialization: true,
      logo_position: 'left',
      custom_tagline: '',
    },
    footer: {
      show_signature_image: true,
      show_signature_line: true,
      show_doctor_name: true,
      show_clinic_contact: true,
      custom_footer_text: '',
    },
    watermark: {
      enabled: false,
      opacity: 0.05,
      use_logo: true,
    },
  },
};

const usePrintTemplateStore = create((set, get) => ({
  template: null,
  isLoading: false,
  error: null,

  // Initialize from login response data
  initFromLogin: (printTemplateData) => {
    if (printTemplateData) {
      set({ template: printTemplateData });
    }
  },

  // Fetch template from API
  fetchTemplate: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await printTemplateAPI.get();
      set({ template: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.errorMessage || 'Failed to load print template', isLoading: false });
      return null;
    }
  },

  // Update template
  updateTemplate: async (data) => {
    try {
      const response = await printTemplateAPI.update(data);
      set({ template: response.data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.errorMessage || 'Failed to update template' };
    }
  },

  // Switch mode
  switchMode: async (mode) => {
    try {
      const response = await printTemplateAPI.switchMode(mode);
      set({ template: response.data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.errorMessage || 'Failed to switch mode' };
    }
  },

  // Apply preset
  applyPreset: async (presetId) => {
    try {
      const response = await printTemplateAPI.applyPreset(presetId);
      set({ template: response.data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.errorMessage || 'Failed to apply preset' };
    }
  },

  // Get effective template (with defaults fallback)
  getEffectiveTemplate: () => {
    return get().template || DEFAULT_TEMPLATE;
  },

  // Clear store on logout
  clear: () => {
    set({ template: null, isLoading: false, error: null });
  },
}));

export default usePrintTemplateStore;
