export interface BankBin {
  bin: string;
  name: string;
  shortName: string;
  color: string;
}

export const IRANIAN_BANKS: BankBin[] = [
  { bin: '603799', name: 'بانک ملی ایران', shortName: 'ملی', color: '#1d4ed8' },
  { bin: '610433', name: 'بانک ملت', shortName: 'ملت', color: '#b91c1c' },
  { bin: '627353', name: 'بانک تجارت', shortName: 'تجارت', color: '#0369a1' },
  { bin: '603769', name: 'بانک صادرات ایران', shortName: 'صادرات', color: '#15803d' },
  { bin: '589210', name: 'بانک سپه', shortName: 'سپه', color: '#d97706' },
  { bin: '621986', name: 'بانک سامان', shortName: 'سامان', color: '#0ea5e9' },
  { bin: '502229', name: 'بانک پاسارگاد', shortName: 'پاسارگاد', color: '#eab308' },
  { bin: '622106', name: 'بانک پارسیان', shortName: 'پارسیان', color: '#9333ea' },
  { bin: '639346', name: 'بانک سینا', shortName: 'سینا', color: '#059669' },
  { bin: '504706', name: 'بانک شهر', shortName: 'شهر', color: '#e11d48' },
  { bin: '502806', name: 'بانک شهر', shortName: 'شهر', color: '#e11d48' },
  { bin: '636214', name: 'بانک آینده', shortName: 'آینده', color: '#7c3aed' },
  { bin: '603770', name: 'بانک کشاورزی', shortName: 'کشاورزی', color: '#16a34a' },
  { bin: '589463', name: 'بانک رفاه کارگران', shortName: 'رفاه', color: '#2563eb' },
  { bin: '628023', name: 'بانک مسکن', shortName: 'مسکن', color: '#ea580c' },
  { bin: '504172', name: 'بانک رسالت', shortName: 'رسالت', color: '#0d9488' },
  { bin: '606373', name: 'بانک مهر ایران', shortName: 'مهر ایران', color: '#10b981' },
  { bin: '861986', name: 'بلوبانک (سامان)', shortName: 'بلوبانک', color: '#38bdf8' },
  { bin: '627412', name: 'بانک اقتصاد نوین', shortName: 'اقتصاد نوین', color: '#6366f1' },
  { bin: '505416', name: 'بانک گردشگری', shortName: 'گردشگری', color: '#f43f5e' },
  { bin: '505785', name: 'بانک ایران زمین', shortName: 'ایران زمین', color: '#8b5cf6' },
  { bin: '639607', name: 'بانک سرمایه', shortName: 'سرمایه', color: '#0284c7' },
  { bin: '627760', name: 'پست بانک ایران', shortName: 'پست بانک', color: '#059669' },
  { bin: '639599', name: 'بانک قوامین (سپه)', shortName: 'قوامین', color: '#d97706' },
  { bin: '627381', name: 'بانک انصار (سپه)', shortName: 'انصار', color: '#b45309' },
  { bin: '502908', name: 'بانک توسعه تعاون', shortName: 'توسعه تعاون', color: '#047857' },
  { bin: '636949', name: 'بانک حکمت (سپه)', shortName: 'حکمت', color: '#b45309' },
  { bin: '627961', name: 'بانک صنعت و معدن', shortName: 'صنعت و معدن', color: '#475569' },
  { bin: '505801', name: 'بانک کوثر (سپه)', shortName: 'کوثر', color: '#d97706' },
  { bin: '639217', name: 'بانک کشاورزی', shortName: 'کشاورزی', color: '#16a34a' }
];

export function detectBankFromCardNumber(card: string): string {
  const clean = card.replace(/[^0-9]/g, '');
  if (clean.length < 6) return '';
  const prefix = clean.substring(0, 6);
  const found = IRANIAN_BANKS.find(b => b.bin === prefix);
  return found ? found.name : '';
}

export function formatCardNumber(card: string): string {
  const clean = card.replace(/[^0-9]/g, '').slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.join(' - ');
}

export function formatShabaNumber(shaba: string): string {
  let clean = shaba.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean.startsWith('IR') && clean.length > 0) {
    clean = 'IR' + clean;
  }
  clean = clean.slice(0, 26);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.join(' ');
}
