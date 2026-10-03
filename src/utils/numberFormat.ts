/**
 * Utility for Persian number formatting, commas separation, and keyboard input normalization.
 */

// Convert any English digits to Persian digits
export const toPersianDigits = (val: string | number): string => {
  if (val === undefined || val === null) return '';
  return String(val).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
};

// Convert Persian and Arabic digits to standard English digits and strip commas/slashes
export const toEnglishDigits = (val: string | number): string => {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[,،/]/g, '')
    .trim();
};

// Format a number or numeric string with 3-digit comma separators and Persian digits
export const formatTomanAmount = (val: number | string): string => {
  if (val === '' || val === undefined || val === null) return '';
  const clean = toEnglishDigits(val);
  const num = parseInt(clean, 10);
  if (isNaN(num)) return '';
  return toPersianDigits(num.toLocaleString('en-US'));
};

// Parse an input string (with Persian/English digits and commas) to a clean integer
export const parseCleanNumber = (val: string | number): number => {
  const clean = toEnglishDigits(val);
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
};

// Parse floating number (for weight in grams)
export const parseCleanFloat = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const clean = String(val)
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[,،]/g, '.')
    .trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};
