import { RoundingSettings } from '../types';

export const DEFAULT_ROUNDING: RoundingSettings = {
  enabled: true,
  step: 1000,
  direction: 'nearest',
};

/**
 * Applies rounding to an amount based on RoundingSettings.
 *
 * @param amount - The raw amount in Toman
 * @param settings - The rounding settings from store configuration
 * @returns The rounded amount
 */
export function applyRounding(amount: number, settings?: RoundingSettings): number {
  if (!amount || isNaN(amount)) return 0;
  if (!settings || !settings.enabled || !settings.step || settings.step <= 1) {
    return Math.round(amount);
  }

  const { step, direction } = settings;

  switch (direction) {
    case 'up':
      return Math.ceil(amount / step) * step;
    case 'down':
      return Math.floor(amount / step) * step;
    case 'nearest':
    default:
      return Math.round(amount / step) * step;
  }
}

/**
 * Returns a human-friendly description of the rounding rule.
 */
export function getRoundingDescription(settings?: RoundingSettings): string {
  if (!settings || !settings.enabled) {
    return 'رُند کردن غیرفعال (مبلغ دقیق)';
  }
  const dirText =
    settings.direction === 'up'
      ? 'رو به بالا (سقف)'
      : settings.direction === 'down'
      ? 'رو به پایین (کف)'
      : 'نزدیک‌ترین مضرب';

  const stepFa = settings.step.toLocaleString('fa-IR');
  return `رُند کردن به ${stepFa} تومان ${dirText}`;
}
