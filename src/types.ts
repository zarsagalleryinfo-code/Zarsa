/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FeeType = 'per-gram' | 'percentage';

export interface CoinCatalogItem {
  id: string;
  name: string;
  weight: number; // in grams
  karat?: string; // karat value e.g., '22 عیار' or '18 عیار'
  feeType: FeeType;
  feeFixed: number; // Toman
  feePercentage: number; // percentage (e.g., 5 meaning 5%)
  tax: number; // rate (e.g., 0.09 meaning 9%)
  bubble: number; // Toman (for coins)
  stepEnabled: boolean; // default formulas
  manualFormula: string; // custom algebraic formula
  isHidden: boolean;
}

export interface ParsianCatalogItem {
  id: string;
  name: string;
  weight: number; // in grams
  karat?: string; // karat value e.g. '18 عیار'
  feeType: FeeType;
  feeFixed: number; // Toman
  feePercentage: number; // percentage
  tax: number; // rate
  bubble: number; // Usually 0 for Parsians but let's keep it
  stepEnabled: boolean;
  manualFormula: string;
  isHidden: boolean;
}

export interface BankInfo {
  bankName?: string;
  cardNumber?: string;
  shabaNumber?: string;
  accountNumber?: string;
  accountOwnerName?: string;
  cardImage?: string; // Base64 data URL
}

export interface PurchaseInvoice {
  id: string;
  receiptNumber: string;
  createdAt: string;
  dateFa: string;
  timeFa: string;
  type: 'scrap_jewelry' | 'parsian' | 'melted' | 'coin';
  itemTitle: string;
  customerName?: string;
  customerPhone?: string;
  accountId?: string; // شناسه حساب شخص (طرف حساب)
  bankInfo?: BankInfo;
  rawWeight: number; // وزن ناخالص به گرم
  sourceKarat: number; // عیار مبدا: ۷۴۰ برای طلا ساخته شده، دلخواه برای آبشده، ۷۵۰ برای پارسیان
  standardWeight750: number; // وزن معادل عیار ۷۵۰
  goldPriceUsed: number; // نرخ هر گرم ۱۸ عیار
  discountPercent?: number; // درصد کسر (مثلاً ۴٪ برای پارسیان)
  discountAmount?: number;
  totalPayable: number; // مبلغ پرداختی نهایی به مشتری
  engCode?: string; // کد انگ آبشده
  labName?: string; // نام آزمایشگاه ری‌گیری
  labPhone?: string; // شماره آزمایشگاه
  note?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  dateFa: string;
  timeFa: string;
  type: 'jewelry' | 'parsian' | 'coin' | 'melted';
  itemTitle: string;
  customerName?: string;
  customerPhone?: string;
  accountId?: string; // شناسه حساب شخص (طرف حساب)
  weight: number;
  karat?: string;
  goldPrice: number;
  rawGoldAmount: number;
  feeType?: 'percentage' | 'fixed_total' | 'fixed_gram';
  feePercent?: number;
  feeAmount: number;
  profitPercent?: number;
  profitAmount: number;
  taxPercent?: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  note?: string;
}

export type BlockType =
  | 'store-header'
  | 'gold-price'
  | 'coins-list'
  | 'parsian-list'
  | 'footer'
  | 'watermark'
  | 'note'
  | 'date'
  | 'time'
  | 'static-text'
  | 'image'
  | 'line'
  | 'dotted-line'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'badge'
  | 'price-tag'
  | 'qr-placeholder';

export interface LayoutBlock {
  id: string;
  type: BlockType;
  name: string;
  x: number; // percentage or pixels, let's store absolute px on a virtual 1080 canvas
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  borderRadius: number; // pixels
  content: string; // text or image relative/base64 URL
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number; // 0 to 1
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  padding: number;
  isLocked: boolean;
  isHidden: boolean;
  textAlign: 'right' | 'center' | 'left';
  verticalAlign: 'top' | 'middle' | 'bottom';
  groupId?: string;
}

export interface RoundingSettings {
  enabled: boolean;
  step: number; // e.g. 1000, 5000, 10000, 50000, 100000
  direction: 'up' | 'down' | 'nearest'; // رو به بالا, رو به پایین, به نزدیک‌ترین
}

export interface InvoicePrintSettings {
  showRawGoldRate: boolean;   // نمایش نرخ خام هر گرم طلا
  showRawGoldValue: boolean;  // نمایش ارزش خام طلا
  showFee: boolean;          // نمایش ستون اجرت ساخت طلا
  showProfit: boolean;       // نمایش ستون سود گالری
  showTax: boolean;          // نمایش ستون مالیات ارزش‌افزوده (۹٪)
  showQR: boolean;           // نمایش بارکد اصالت سنجی (QR Code)
  showTerms: boolean;        // نمایش کادر قوانین و تعهدات رسمی
  showStamp: boolean;        // نمایش کادر مهر و امضای رسمی گالری
  showFingerprint: boolean;  // نمایش کادر امضا و اثر انگشت خریدار
}

export interface StoreSettings {
  name: string;
  ownerName?: string;
  address: string;
  postalCode?: string;
  phone: string;
  instagram: string;
  logo: string; // Base64 or local asset
  watermarkText: string;
  stamp?: string;
  signature?: string;
  rounding?: RoundingSettings;
  invoicePrintSettings?: InvoicePrintSettings;
}

export interface CanvasPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  useGradient: boolean;
  backgroundImage: string;
  titleColor: string;
  priceColor: string;
  labelColor: string;
  cardColor: string;
  cardBorderColor: string;
  cardOpacity: number;
  watermarkOpacity: number;
}

export interface StoryPreset {
  id: string;
  name: string;
  isCustom?: boolean;
  themeId: string;
  format: 'story' | 'receipt';
  includeGoldRate: boolean;
  includeCoins: boolean;
  includeParsians: boolean;
  includeScrap: boolean;
  includeOunce: boolean;
  includeContact: boolean;
  includeNote: boolean;
}

// Preset visual themes
export interface ThemePreset {
  id: string;
  name: string;
  backgroundColor: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  useGradient: boolean;
  backgroundImage: string;
  fontFamily: string;
  textColor: string;
  cardColor: string;
  cardBorderColor: string;
  accentColor: string;
}

export interface LedgerTransaction {
  id: string;
  dateFa: string;
  timeFa: string;
  description: string;
  goldRate: number; // نرخ مبنای طلا (تومان)
  
  // تراکنش طلایی (بر حسب گرم ۱۸ عیار)
  goldDebtor: number; // بدهکار طلایی (خروجی طلا / دریافت شخص)
  goldCreditor: number; // بستانکار طلایی (ورودی طلا / پرداخت شخص)
  goldBalance: number; // مانده طلایی پس از تراکنش
  goldStatus: 'debtor' | 'creditor' | 'balanced'; // تشخیص مانده طلایی
  
  // تراکنش ریالی (بر حسب تومان)
  rialDebtor: number; // بدهکار ریالی (پرداخت ریالی به شخص)
  rialCreditor: number; // بستانکار ریالی (دریافت ریالی از شخص)
  rialBalance: number; // مانده ریالی پس از تراکنش
  rialStatus: 'debtor' | 'creditor' | 'balanced'; // تشخیص مانده ریالی

  // مشخصات طلا فیزیکی (اختیاری)
  physicalGold?: {
    engCode?: string; // کد انگ
    labName?: string; // نام آزمایشگاه ری‌گیری
    carat?: number; // عیار (مثلا ۷۴۰، ۷۵۰، ۹۹۹)
    rawWeight?: number; // وزن خام (گرم)
    standardWeight750?: number; // وزن به عیار ۷۵۰ (گرم)
    direction?: 'received' | 'delivered'; // دریافت یا تحویل
  };

  // مشخصات بانکی / تسویه ریالی (اختیاری)
  bankInfo?: {
    cardNumber?: string; // شماره کارت
    bankName?: string; // نام بانک
    direction?: 'paid' | 'received'; // پرداخت به او یا دریافت از او
  };
}

export interface ContactAccount {
  id: string;
  accountCode: string; // کد حساب معین (مثال: زر-۱۰۰۱)
  name: string;
  phone: string;
  shopName?: string;
  createdAt: string;
  
  // مانده اولیه
  initialGoldBalance: number; // مقدار طلایی اولیه به گرم
  initialGoldStatus: 'debtor' | 'creditor' | 'balanced'; // بدهکار یا بستانکار بودن طلایی
  initialRialBalance: number; // مقدار ریالی اولیه به تومان
  initialRialStatus: 'debtor' | 'creditor' | 'balanced'; // بدهکار یا بستانکار بودن ریالی
  
  // مانده فعلی (آنی)
  currentGoldBalance: number;
  currentGoldStatus: 'debtor' | 'creditor' | 'balanced';
  currentRialBalance: number;
  currentRialStatus: 'debtor' | 'creditor' | 'balanced';
  
  transactions: LedgerTransaction[];
}
