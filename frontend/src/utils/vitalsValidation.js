/**
 * Validates blood pressure in "systolic/diastolic" format.
 * Returns true if valid, or an error message string if invalid.
 * Empty/blank values are allowed (field is optional).
 */
export function validateBP(value) {
  if (!value || value.trim() === '') return true;

  const bpRegex = /^\d{2,3}\/\d{2,3}$/;
  if (!bpRegex.test(value.trim())) {
    return 'BP must be in format like 120/80';
  }

  const [systolic, diastolic] = value.trim().split('/').map(Number);

  if (systolic < 50 || systolic > 300) {
    return 'Systolic BP must be between 50 and 300';
  }
  if (diastolic < 20 || diastolic > 200) {
    return 'Diastolic BP must be between 20 and 200';
  }
  if (diastolic >= systolic) {
    return 'Diastolic must be less than systolic';
  }

  return true;
}

/**
 * Validates temperature value (as text input).
 * Accepts decimal values. Range: 90-110 °F.
 */
export function validateTemperature(value) {
  if (!value || value.toString().trim() === '') return true;

  const num = parseFloat(value);
  if (isNaN(num)) {
    return 'Temperature must be a valid number';
  }
  if (num < 90 || num > 110) {
    return 'Temperature must be between 90 and 110 °F';
  }

  return true;
}

/**
 * Validates pulse value. Range: 20-300 bpm.
 */
export function validatePulse(value) {
  if (!value || value.toString().trim() === '') return true;
  const num = parseFloat(value);
  if (isNaN(num)) return 'Pulse must be a valid number';
  if (num < 20 || num > 300) return 'Pulse must be between 20 and 300 bpm';
  return true;
}

/**
 * Validates weight value. Range: 0.5-500 kg.
 */
export function validateWeight(value) {
  if (!value || value.toString().trim() === '') return true;
  const num = parseFloat(value);
  if (isNaN(num)) return 'Weight must be a valid number';
  if (num < 0.5 || num > 500) return 'Weight must be between 0.5 and 500 kg';
  return true;
}

/**
 * Validates height value. Range: 10-300 cm.
 */
export function validateHeight(value) {
  if (!value || value.toString().trim() === '') return true;
  const num = parseFloat(value);
  if (isNaN(num)) return 'Height must be a valid number';
  if (num < 10 || num > 300) return 'Height must be between 10 and 300 cm';
  return true;
}

/**
 * Validates SpO2 value. Range: 0-100%.
 */
export function validateSpO2(value) {
  if (!value || value.toString().trim() === '') return true;
  const num = parseFloat(value);
  if (isNaN(num)) return 'SpO2 must be a valid number';
  if (num < 0 || num > 100) return 'SpO2 must be between 0 and 100%';
  return true;
}
