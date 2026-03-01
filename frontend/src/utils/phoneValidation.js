function extractDigits(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }
  return cleaned;
}

export function validatePhone(value, isRequired = true) {
  if (!value || value.trim() === '') {
    return isRequired ? 'Phone number is required' : true;
  }
  if (!/^[+\d\s\-()]+$/.test(value)) {
    return 'Phone number can only contain digits, +, spaces, hyphens, and parentheses';
  }
  const digits = extractDigits(value);
  if (!/^\d{10}$/.test(digits)) {
    return 'Phone number must be exactly 10 digits (e.g., 9876543210 or +91 9876543210)';
  }
  return true;
}

export const validatePhoneRequired = (value) => validatePhone(value, true);
export const validatePhoneOptional = (value) => validatePhone(value, false);
