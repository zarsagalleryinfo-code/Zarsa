import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Coins, 
  Flame, 
  Sparkles, 
  Receipt, 
  Copy, 
  Download, 
  RotateCcw, 
  Check, 
  X, 
  User, 
  Phone, 
  Scale,
  Percent,
  Tag,
  FileCheck,
  Eye,
  Printer,
  Share2,
  Send,
  MessageCircle,
  Smartphone,
  ShieldCheck,
  QrCode,
  ShoppingBag,
  Search,
  ChevronDown
} from 'lucide-react';
import { CoinCatalogItem, ParsianCatalogItem, SaleInvoice, StoreSettings, ContactAccount } from '../types';
import { downloadInvoicePNG, shareInvoiceImage, downloadInvoicePDF } from '../utils/invoicePng';
import { applyRounding } from '../utils/rounding';
import { 
  toPersianDigits, 
  toEnglishDigits, 
  formatTomanAmount, 
  parseCleanNumber, 
  parseCleanFloat 
} from '../utils/numberFormat';

interface Props {
  goldPrice: number;
  setGoldPrice: (price: number) => void;
  coins: CoinCatalogItem[];
  parsians: ParsianCatalogItem[];
  store: StoreSettings;
  taxEnabledGlobal: boolean;
  onSaveInvoice: (invoice: SaleInvoice) => void;
  onExportPNG: (invoice: SaleInvoice) => void;
  showNotification: (msg: string, type?: 'success' | 'amber' | 'error') => void;
  getPersianDate: () => string;
  getPersianTime: () => string;
  onOpenSalesLog?: () => void;
  onOpenAdvancedCalculator?: () => void;
  onOpenPurchase?: () => void;
  salesCount?: number;
  accounts?: ContactAccount[];
  setAccounts?: React.Dispatch<React.SetStateAction<ContactAccount[]>>;
}

// 22 Exact Parsian Presets requested by user
const DEFAULT_PARSIAN_PRESETS = [
  { name: 'پارسیان ۰.۰۳۰ گرم (۳۰ سوت)', weight: 0.030, soot: 30 },
  { name: 'پارسیان ۰.۰۴۰ گرم (۴۰ سوت)', weight: 0.040, soot: 40 },
  { name: 'پارسیان ۰.۰۵۰ گرم (۵۰ سوت)', weight: 0.050, soot: 50 },
  { name: 'پارسیان ۰.۰۷۰ گرم (۷۰ سوت)', weight: 0.070, soot: 70 },
  { name: 'پارسیان ۰.۰۹۰ گرم (۹۰ سوت)', weight: 0.090, soot: 90 },
  { name: 'پارسیان ۰.۱۰۰ گرم (۱۰۰ سوت)', weight: 0.100, soot: 100 },
  { name: 'پارسیان ۰.۱۲۰ گرم (۱۲۰ سوت)', weight: 0.120, soot: 120 },
  { name: 'پارسیان ۰.۱۵۰ گرم (۱۵۰ سوت)', weight: 0.150, soot: 150 },
  { name: 'پارسیان ۰.۱۷۰ گرم (۱۷۰ سوت)', weight: 0.170, soot: 170 },
  { name: 'پارسیان ۰.۲۰۰ گرم (۲۰۰ سوت)', weight: 0.200, soot: 200 },
  { name: 'پارسیان ۰.۲۵۰ گرم (۲۵۰ سوت)', weight: 0.250, soot: 250 },
  { name: 'پارسیان ۰.۳۰۰ گرم (۳۰۰ سوت)', weight: 0.300, soot: 300 },
  { name: 'پارسیان ۰.۳۵۰ گرم (۳۵۰ سوت)', weight: 0.350, soot: 350 },
  { name: 'پارسیان ۰.۴۰۰ گرم (۴۰۰ سوت)', weight: 0.400, soot: 400 },
  { name: 'پارسیان ۰.۴۵۰ گرم (۴۵۰ سوت)', weight: 0.450, soot: 450 },
  { name: 'پارسیان ۰.۵۰۰ گرم (نیم گرم)', weight: 0.500, soot: 500 },
  { name: 'پارسیان ۰.۶۰۰ گرم (۶۰۰ سوت)', weight: 0.600, soot: 600 },
  { name: 'پارسیان ۰.۷۰۰ گرم (۷۰۰ سوت)', weight: 0.700, soot: 700 },
  { name: 'پارسیان ۰.۸۰۰ گرم (۸۰۰ سوت)', weight: 0.800, soot: 800 },
  { name: 'پارسیان ۰.۹۰۰ گرم (۹۰۰ سوت)', weight: 0.900, soot: 900 },
  { name: 'پارسیان ۱.۰۰۰ گرم (۱ گرم)', weight: 1.000, soot: 1000 },
  { name: 'پارسیان ۱.۲۰۰ گرم (۱.۲ گرم)', weight: 1.200, soot: 1200 },
];

export default function GoldenCalculator({
  goldPrice,
  setGoldPrice,
  coins,
  parsians,
  store,
  taxEnabledGlobal,
  onSaveInvoice,
  onExportPNG,
  showNotification,
  getPersianDate,
  getPersianTime,
  onOpenSalesLog,
  onOpenAdvancedCalculator,
  onOpenPurchase,
  salesCount = 0,
  accounts = [],
  setAccounts
}: Props) {
  // Sub-tabs: 'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted'
  const [subTab, setSubTab] = useState<'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted'>('jewelry');

  // --- 1. JEWELRY CALCULATOR STATE ---
  const [jWeight, setJWeight] = useState<number>(3.5);
  const [jFeeType, setJFeeType] = useState<'percentage' | 'fixed_total'>('percentage');
  const [jFeePercent, setJFeePercent] = useState<number>(10);
  const [jFeeTotal, setJFeeTotal] = useState<number>(500000);
  const [jProfitPercent, setJProfitPercent] = useState<number>(7);
  const [jTaxActive, setJTaxActive] = useState<boolean>(taxEnabledGlobal);
  const [jTaxPercent, setJTaxPercent] = useState<number>(9);
  const [jDiscountType, setJDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [jDiscountValue, setJDiscountValue] = useState<number>(0);

  // Result state for jewelry
  const [jCalculated, setJCalculated] = useState<boolean>(true);
  const [jResult, setJResult] = useState<{
    rawGold: number;
    fee: number;
    profit: number;
    tax: number;
    discount: number;
    total: number;
  }>({ rawGold: 0, fee: 0, profit: 0, tax: 0, discount: 0, total: 0 });

  // --- 2. PARSIAN CALCULATOR STATE (DEFAULT 5% FEE AS REQUESTED) ---
  const [pWeight, setPWeight] = useState<number>(0.500);
  const [pFeeType, setPFeeType] = useState<'fixed' | 'percentage'>('percentage');
  const [pFeePercent, setPFeePercent] = useState<number>(5); // default 5%
  const [pFeeFixed, setPFeeFixed] = useState<number>(50000);
  const [pSelectedPresetName, setPSelectedPresetName] = useState<string>('پارسیان ۰.۵۰۰ گرم (نیم گرم)');

  // --- 3. COIN CALCULATOR STATE (MAZANEH BASED) ---
  // Initial mazaneh derived from goldPrice or default: mazaneh = goldPrice * 4.3318
  const [cMazaneh, setCMazaneh] = useState<number>(() => Math.round(goldPrice * 4.3318));
  const [cSelectedType, setCSelectedType] = useState<'tamam' | 'nim' | 'rob'>('tamam');
  const [cCount, setCCount] = useState<number>(1);
  const [cFeeFixed, setCFeeFixed] = useState<number>(100000); // Toman cash fee

  // --- 3.5. COIN PURCHASE CALCULATOR STATE (خرید سکه از مشتری) ---
  const [cpMazaneh, setCpMazaneh] = useState<number>(() => Math.round(goldPrice * 4.3318));
  const [cpSelectedType, setCpSelectedType] = useState<'tamam' | 'nim' | 'rob'>('tamam');
  const [cpCount, setCpCount] = useState<number>(1);
  const [cpFeeFixed, setCpFeeFixed] = useState<number>(100000); // Toman cash fee (to subtract)

  // Sync mazaneh if goldPrice changes externally
  useEffect(() => {
    if (goldPrice > 0 && Math.abs(cMazaneh - Math.round(goldPrice * 4.3318)) > 100000) {
      setCMazaneh(Math.round(goldPrice * 4.3318));
    }
  }, [goldPrice]);

  // When mazaneh is entered manually, update goldPrice per user rule: mazaneh / 4.3318
  const handleMazanehChange = (val: number) => {
    setCMazaneh(val);
    if (val > 0) {
      const derivedGold18 = Math.round(val / 4.3318);
      setGoldPrice(derivedGold18);
    }
  };

  // --- 4. MELTED GOLD CALCULATOR STATE ---
  const [mAmountToman, setMAmountToman] = useState<number>(50000000); // 50 million Toman
  const [mFeeMode, setMFeeMode] = useState<'deduct' | 'add'>('deduct'); // deduct from amount or add to amount
  const [mFeeType, setMFeeType] = useState<'percentage' | 'per_gram'>('percentage');
  const [mFeePercent, setMFeePercent] = useState<number>(1.5); // 1.5%
  const [mFeePerGram, setMFeePerGram] = useState<number>(50000); // 50,000 Toman/gram

  // --- MODAL STATE FOR RECORDING SALE (OPTIONAL CUSTOMER INFO) ---
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [previewInvoice, setPreviewInvoice] = useState<SaleInvoice | null>(null);

  const [invoiceTypeToSave, setInvoiceTypeToSave] = useState<'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted'>('jewelry');
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [itemTitleInput, setItemTitleInput] = useState<string>('');
  const [saleType, setSaleType] = useState<'sell' | 'buy'>('sell');
  
  // Subsidiary Ledger contact assignment states
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('');
  const [showContactDropdown, setShowContactDropdown] = useState<boolean>(false);
  const [autoPostToLedger, setAutoPostToLedger] = useState<boolean>(true);
  const [instantCashSettle, setInstantCashSettle] = useState<boolean>(true);

  // Live Synchronous Jewelry Calculation: computes instantly on every render
  const liveA = (jWeight || 0) * (goldPrice || 0);
  const liveFeeVal = jFeeType === 'percentage' 
    ? (liveA * ((jFeePercent || 0) / 100)) 
    : (jFeeTotal || 0);
  
  const liveB = liveA + liveFeeVal;
  const liveProfitVal = liveB * ((jProfitPercent || 0) / 100);
  const liveTaxVal = jTaxActive ? ((liveFeeVal + liveProfitVal) * ((jTaxPercent || 0) / 100)) : 0;
  const liveGross = liveA + liveFeeVal + liveProfitVal + liveTaxVal;
  const jDiscount = jDiscountType === 'fixed'
    ? (jDiscountValue || 0)
    : Math.round(liveGross * ((jDiscountValue || 0) / 100));
  const liveFinalTotal = Math.max(0, liveGross - jDiscount);

  const currentJResult = {
    rawGold: Math.round(liveA),
    fee: Math.round(liveFeeVal),
    profit: Math.round(liveProfitVal),
    tax: Math.round(liveTaxVal),
    discount: Math.round(jDiscount),
    total: applyRounding(liveFinalTotal, store.rounding)
  };

  // Exact Jewelry calculation
  const calculateJewelry = () => {
    setJResult(currentJResult);
    setJCalculated(true);
    return currentJResult;
  };

  useEffect(() => {
    setJResult(currentJResult);
    setJCalculated(true);
  }, [goldPrice, jWeight, jFeeType, jFeePercent, jFeeTotal, jProfitPercent, jTaxActive, jTaxPercent, jDiscountType, jDiscountValue, store.rounding]);

  const handleResetJewelry = () => {
    setJWeight(0);
    setJFeePercent(10);
    setJFeeTotal(0);
    setJDiscountType('fixed');
    setJDiscountValue(0);
    setJResult({ rawGold: 0, fee: 0, profit: 0, tax: 0, discount: 0, total: 0 });
    showNotification('فرم محاسبه پاکسازی شد', 'amber');
  };

  // Parsian Calculation: وزن × نرخ طلا + کارمزد
  const calculateParsianPrice = (weight: number, feeFixed = pFeeFixed, feeType = pFeeType, feePercent = pFeePercent) => {
    const rawGold = weight * goldPrice;
    const fee = feeType === 'fixed' ? feeFixed : (rawGold * (feePercent / 100));
    return applyRounding(rawGold + fee, store.rounding);
  };

  // Coin Calculation via Mazaneh
  const rawTamamPrice = Math.round((cMazaneh || 0) * 2.253);
  const getCoinRawPrice = (type: 'tamam' | 'nim' | 'rob') => {
    if (type === 'tamam') return rawTamamPrice;
    if (type === 'nim') return Math.round(rawTamamPrice / 2);
    return Math.round(rawTamamPrice / 4);
  };

  const getCoinFinalPrice = (type: 'tamam' | 'nim' | 'rob', count = 1, fee = cFeeFixed) => {
    const unitRaw = getCoinRawPrice(type);
    const unitTotal = unitRaw + fee;
    return applyRounding(unitTotal * count, store.rounding);
  };

  // Sync cpMazaneh if goldPrice changes externally
  useEffect(() => {
    if (goldPrice > 0 && Math.abs(cpMazaneh - Math.round(goldPrice * 4.3318)) > 100000) {
      setCpMazaneh(Math.round(goldPrice * 4.3318));
    }
  }, [goldPrice]);

  const handleCpMazanehChange = (val: number) => {
    setCpMazaneh(val);
    if (val > 0) {
      const derivedGold18 = Math.round(val / 4.3318);
      setGoldPrice(derivedGold18);
    }
  };

  // Coin Purchase Calculation via Mazaneh & 2.253 and manual fee subtraction
  const cpRawTamamPrice = Math.round((cpMazaneh || 0) * 2.253);
  const getCpCoinRawPrice = (type: 'tamam' | 'nim' | 'rob') => {
    if (type === 'tamam') return cpRawTamamPrice;
    if (type === 'nim') return Math.round(cpRawTamamPrice / 2);
    return Math.round(cpRawTamamPrice / 4);
  };

  const getCpCoinFinalPrice = (type: 'tamam' | 'nim' | 'rob', count = 1, fee = cpFeeFixed) => {
    const unitRaw = getCpCoinRawPrice(type);
    const unitTotal = Math.max(0, unitRaw - fee);
    return applyRounding(unitTotal * count, store.rounding);
  };

  // Melted Gold Calculation
  const calculateMeltedResult = () => {
    const rate = goldPrice || Math.round((cMazaneh || 0) / 4.3318) || 3500000;
    const amt = mAmountToman || 0;

    let goldGrams = 0;
    let feeAmount = 0;
    let finalPayable = amt;
    let rawGoldValue = amt;

    if (mFeeMode === 'deduct') {
      if (mFeeType === 'percentage') {
        const pct = mFeePercent || 0;
        rawGoldValue = Math.round(amt / (1 + pct / 100));
        feeAmount = amt - rawGoldValue;
        goldGrams = Number((rawGoldValue / rate).toFixed(3));
      } else {
        const feePerG = mFeePerGram || 0;
        goldGrams = Number((amt / (rate + feePerG)).toFixed(3));
        feeAmount = Math.round(goldGrams * feePerG);
        rawGoldValue = amt - feeAmount;
      }
      finalPayable = amt;
    } else {
      goldGrams = Number((amt / rate).toFixed(3));
      rawGoldValue = amt;
      if (mFeeType === 'percentage') {
        feeAmount = Math.round(amt * ((mFeePercent || 0) / 100));
      } else {
        feeAmount = Math.round(goldGrams * (mFeePerGram || 0));
      }
      finalPayable = rawGoldValue + feeAmount;
    }

    return {
      rate,
      goldGrams,
      rawGoldValue: Math.round(rawGoldValue),
      feeAmount: Math.round(feeAmount),
      finalPayable: applyRounding(finalPayable, store.rounding)
    };
  };

  const meltedResult = calculateMeltedResult();

  // Build current active invoice on demand
  const buildCurrentInvoice = (type: 'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted', withCustomer = true): SaleInvoice => {
    const invNum = String(Math.floor(1000 + Math.random() * 9000));
    const dateFa = getPersianDate();
    const timeFa = getPersianTime();

    const getRaw = (): SaleInvoice => {
      if (type === 'jewelry') {
      return {
        id: 'inv_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'jewelry',
        itemTitle: itemTitleInput.trim() || 'طلای ساخته‌شده ۱۸ عیار',
        customerName: withCustomer && custName.trim() ? custName.trim() : undefined,
        customerPhone: withCustomer && custPhone.trim() ? custPhone.trim() : undefined,
        weight: jWeight,
        karat: '18',
        goldPrice,
        rawGoldAmount: currentJResult.rawGold,
        feeType: jFeeType,
        feePercent: jFeeType === 'percentage' ? jFeePercent : undefined,
        feeAmount: currentJResult.fee,
        profitPercent: jProfitPercent,
        profitAmount: currentJResult.profit,
        taxPercent: jTaxActive ? jTaxPercent : 0,
        taxAmount: currentJResult.tax,
        discountAmount: currentJResult.discount,
        totalAmount: currentJResult.total,
        note: saleType === 'buy' ? 'خرید از مشتری' : 'فروش به مشتری'
      };
    } else if (type === 'parsian') {
      const price = calculateParsianPrice(pWeight);
      const raw = Math.round(pWeight * goldPrice);
      return {
        id: 'inv_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'parsian',
        itemTitle: itemTitleInput.trim() || pSelectedPresetName || `شمش پارسیان ${pWeight} گرم`,
        customerName: withCustomer && custName.trim() ? custName.trim() : undefined,
        customerPhone: withCustomer && custPhone.trim() ? custPhone.trim() : undefined,
        weight: pWeight,
        karat: '18',
        goldPrice,
        rawGoldAmount: raw,
        feeAmount: price - raw,
        profitAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: price,
        note: saleType === 'buy' ? 'خرید از مشتری' : 'فروش به مشتری'
      };
    } else if (type === 'coin') {
      const unitRaw = getCoinRawPrice(cSelectedType);
      const totalRaw = unitRaw * cCount;
      const totalFee = cFeeFixed * cCount;
      const total = totalRaw + totalFee;
      const coinName = cSelectedType === 'tamam' ? 'سکه تمام' : (cSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه');
      const w750 = cSelectedType === 'tamam' ? 9.759 : (cSelectedType === 'nim' ? 4.880 : 2.440);
      return {
        id: 'inv_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'coin',
        itemTitle: itemTitleInput.trim() || `${cCount > 1 ? `${cCount} عدد ` : ''}${coinName}`,
        customerName: withCustomer && custName.trim() ? custName.trim() : undefined,
        customerPhone: withCustomer && custPhone.trim() ? custPhone.trim() : undefined,
        weight: Number((w750 * cCount).toFixed(3)),
        karat: '18 (معادل ۷۵۰)',
        goldPrice,
        rawGoldAmount: totalRaw,
        feeAmount: totalFee,
        profitAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: total,
        note: saleType === 'buy' ? 'خرید از مشتری' : 'فروش به مشتری'
      };
    } else if (type === 'coin_purchase') {
      const unitRaw = getCpCoinRawPrice(cpSelectedType);
      const totalRaw = unitRaw * cpCount;
      const totalFee = cpFeeFixed * cpCount;
      const total = Math.max(0, totalRaw - totalFee);
      const coinName = cpSelectedType === 'tamam' ? 'خرید سکه تمام (از مشتری)' : (cpSelectedType === 'nim' ? 'خرید نیم سکه (از مشتری)' : 'خرید ربع سکه (از مشتری)');
      const w750 = cpSelectedType === 'tamam' ? 9.759 : (cpSelectedType === 'nim' ? 4.880 : 2.440);
      return {
        id: 'inv_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'coin',
        itemTitle: itemTitleInput.trim() || `${cpCount > 1 ? `${cpCount} عدد ` : ''}${coinName}`,
        customerName: withCustomer && custName.trim() ? custName.trim() : 'فروشنده (مشتری حضوری)',
        customerPhone: withCustomer && custPhone.trim() ? custPhone.trim() : undefined,
        weight: Number((w750 * cpCount).toFixed(3)),
        karat: '18 (معادل ۷۵۰)',
        goldPrice,
        rawGoldAmount: totalRaw,
        feeAmount: -totalFee,
        profitAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: total,
        note: 'خرید از مشتری'
      };
    } else {
      return {
        id: 'inv_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'melted',
        itemTitle: itemTitleInput.trim() || `طلای آب‌شده ۱۸ عیار (${meltedResult.goldGrams} گرم)`,
        customerName: withCustomer && custName.trim() ? custName.trim() : undefined,
        customerPhone: withCustomer && custPhone.trim() ? custPhone.trim() : undefined,
        weight: meltedResult.goldGrams,
        karat: '18',
        goldPrice: meltedResult.rate,
        rawGoldAmount: meltedResult.rawGoldValue,
        feeAmount: meltedResult.feeAmount,
        profitAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: meltedResult.finalPayable,
        note: saleType === 'buy' ? 'خرید از مشتری' : 'فروش به مشتری'
      };
    }
    };
    
    const finalInv = getRaw();
    if (withCustomer && selectedContactId) {
      finalInv.accountId = selectedContactId;
    }
    return finalInv;
  };

  // Open Live Invoice Preview Modal
  const handleOpenPreview = (type: 'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted') => {
    const inv = buildCurrentInvoice(type, true);
    setPreviewInvoice(inv);
    setShowPreviewModal(true);
  };

  // Save Modal Trigger
  const openSaveInvoiceModal = (type: 'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted', defaultTitle = '') => {
    setInvoiceTypeToSave(type);
    setItemTitleInput(defaultTitle);
    setSelectedContactId('');
    setContactSearchQuery('');
    setShowContactDropdown(false);
    setShowSaveModal(true);
  };

  const postToLedger = (newInv: SaleInvoice) => {
    if (selectedContactId && setAccounts && accounts) {
      const contact = accounts.find(acc => acc.id === selectedContactId);
      if (contact) {
        let goldDebtor = 0;
        let goldCreditor = 0;
        let rialDebtor = 0;
        let rialCreditor = 0;

        let desc = '';
        if (saleType === 'sell') {
          goldDebtor = newInv.weight || 0;
          rialDebtor = newInv.totalAmount;
          if (instantCashSettle) {
            rialCreditor = newInv.totalAmount;
            desc = `فروش ${newInv.itemTitle} - فاکتور #${newInv.invoiceNumber} (تسویه نقدی فوری)`;
          } else {
            desc = `فروش ${newInv.itemTitle} - فاکتور #${newInv.invoiceNumber}`;
          }
        } else {
          // buy
          goldCreditor = newInv.weight || 0;
          rialCreditor = newInv.totalAmount;
          if (instantCashSettle) {
            rialDebtor = newInv.totalAmount;
            desc = `خرید ${newInv.itemTitle} - فاکتور #${newInv.invoiceNumber} (تسویه نقدی فوری)`;
          } else {
            desc = `خرید ${newInv.itemTitle} - فاکتور #${newInv.invoiceNumber}`;
          }
        }

        const newGoldBalance = contact.currentGoldBalance + (goldCreditor - goldDebtor);
        const newRialBalance = contact.currentRialBalance + (rialCreditor - rialDebtor);

        const newTx = {
          id: 'tx_auto_' + Date.now(),
          dateFa: newInv.dateFa,
          timeFa: newInv.timeFa,
          description: desc,
          goldRate: newInv.goldPrice || goldPrice,
          goldDebtor,
          goldCreditor,
          goldBalance: newGoldBalance,
          goldStatus: (newGoldBalance > 0 ? 'creditor' : newGoldBalance < 0 ? 'debtor' : 'balanced') as 'creditor' | 'debtor' | 'balanced',
          rialDebtor,
          rialCreditor,
          rialBalance: newRialBalance,
          rialStatus: (newRialBalance > 0 ? 'creditor' : newRialBalance < 0 ? 'debtor' : 'balanced') as 'creditor' | 'debtor' | 'balanced'
        };

        const updated = accounts.map(acc => {
          if (acc.id === contact.id) {
            return {
              ...acc,
              currentGoldBalance: newGoldBalance,
              currentGoldStatus: (newGoldBalance > 0 ? 'creditor' : newGoldBalance < 0 ? 'debtor' : 'balanced') as 'creditor' | 'debtor' | 'balanced',
              currentRialBalance: newRialBalance,
              currentRialStatus: (newRialBalance > 0 ? 'creditor' : newRialBalance < 0 ? 'debtor' : 'balanced') as 'creditor' | 'debtor' | 'balanced',
              transactions: [...acc.transactions, newTx]
            };
          }
          return acc;
        });
        setAccounts(updated);
      }
    }
  };

  // Confirm Invoice Save (with customer details)
  const handleConfirmSaveInvoice = () => {
    const newInv = buildCurrentInvoice(invoiceTypeToSave, true);
    onSaveInvoice(newInv);
    if (autoPostToLedger) {
      postToLedger(newInv);
    }
    setShowSaveModal(false);
    setCustName('');
    setCustPhone('');
    setItemTitleInput('');
    setSelectedContactId('');
    showNotification(`فاکتور شماره #${newInv.invoiceNumber} در دفتر فروش ثبت گردید`, 'success');
  };

  // Skip Customer Info and Save Directly
  const handleSkipSaveInvoice = () => {
    const newInv = buildCurrentInvoice(invoiceTypeToSave, false);
    onSaveInvoice(newInv);
    setShowSaveModal(false);
    setCustName('');
    setCustPhone('');
    setItemTitleInput('');
    setSelectedContactId('');
    showNotification(`فاکتور شماره #${newInv.invoiceNumber} بدون اطلاعات مشتری ثبت شد`, 'success');
  };

  // Share Handlers for WhatsApp, Telegram, Rubika and SMS
  const handleShareWhatsApp = (inv: SaleInvoice) => {
    const text = generateInvoiceText(inv.type, inv);
    const cleanPhone = inv.customerPhone ? toEnglishDigits(inv.customerPhone).replace(/^0/, '98') : '';
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareTelegram = (inv: SaleInvoice) => {
    const text = generateInvoiceText(inv.type, inv);
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://' + (store.instagram || 'zarsa.gold'))}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareRubika = async (inv: SaleInvoice) => {
    const shared = await shareInvoiceImage(inv, store);
    if (!shared) {
      const text = generateInvoiceText(inv.type, inv);
      navigator.clipboard.writeText(text);
      showNotification('متن فاکتور کپی شد؛ در پیام‌رسان روبیکا الصاق نمایید', 'success');
      window.location.href = 'rubika://';
    }
  };

  const handleSendSMS = (inv: SaleInvoice) => {
    const text = generateInvoiceText(inv.type, inv);
    const cleanPhone = inv.customerPhone ? toEnglishDigits(inv.customerPhone) : '';
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
  };

  // Text generator with support for customer information & security barcode
  const generateInvoiceText = (type: 'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted', inv?: SaleInvoice) => {
    let t = `👑 ${store.name}\n`;
    if (store.ownerName) t += `با مدیریت: ${store.ownerName}\n`;
    t += `📅 تاریخ: ${inv?.dateFa || getPersianDate()} · ساعت ${inv?.timeFa || getPersianTime()}\n`;
    t += `🧾 شماره فاکتور: #${inv?.invoiceNumber || Math.floor(1000 + Math.random() * 9000)}\n`;
    t += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (inv?.customerName && inv.customerName.trim()) {
      t += `👤 خریدار: ${inv.customerName.trim()}\n`;
    }
    if (inv?.customerPhone && inv.customerPhone.trim()) {
      t += `📱 تلفن همراه: ${inv.customerPhone.trim()}\n`;
    }
    if ((inv?.customerName && inv.customerName.trim()) || (inv?.customerPhone && inv.customerPhone.trim())) {
      t += `─────────────────────\n`;
    }

    if (type === 'jewelry') {
      t += `💍 شرح کالا: ${inv?.itemTitle || 'طلای ساخته‌شده ۱۸ عیار'}\n`;
      t += `⚖️ وزن خالص: ${inv ? inv.weight : jWeight} گرم\n`;
      t += `🪙 نرخ هر گرم طلا: ${(inv ? inv.goldPrice : goldPrice).toLocaleString('fa-IR')} تومان\n`;
      t += `─────────────────────\n`;
      t += `▫️ بهای طلای خام: ${(inv ? inv.rawGoldAmount : jResult.rawGold).toLocaleString('fa-IR')} تومان\n`;
      t += `▫️ اجرت ساخت: ${(inv ? inv.feeAmount : jResult.fee).toLocaleString('fa-IR')} تومان\n`;
      t += `▫️ سود طلافروشی (${inv?.profitPercent ?? jProfitPercent}٪): ${(inv ? inv.profitAmount : jResult.profit).toLocaleString('fa-IR')} تومان\n`;
      if ((inv ? (inv.taxAmount > 0) : jTaxActive)) {
        t += `▫️ مالیات ارزش‌افزوده (${inv?.taxPercent ?? jTaxPercent}٪): ${(inv ? inv.taxAmount : jResult.tax).toLocaleString('fa-IR')} تومان\n`;
      }
      if ((inv ? inv.discountAmount : jDiscount) > 0) {
        t += `▫️ تخفیف ویژه: -${(inv ? inv.discountAmount : jDiscount).toLocaleString('fa-IR')} تومان\n`;
      }
      t += `━━━━━━━━━━━━━━━━━━━━━\n`;
      t += `💰 مبلغ قابل پرداخت: ${(inv ? inv.totalAmount : jResult.total).toLocaleString('fa-IR')} تومان\n`;
    } else if (type === 'parsian') {
      const price = inv ? inv.totalAmount : calculateParsianPrice(pWeight);
      const raw = inv ? inv.rawGoldAmount : Math.round(pWeight * goldPrice);
      const fee = inv ? inv.feeAmount : (price - raw);
      t += `✨ شرح: ${inv?.itemTitle || pSelectedPresetName || `شمش پارسیان`}\n`;
      t += `⚖️ وزن: ${inv ? inv.weight : pWeight} گرم\n`;
      t += `🪙 نرخ روز: ${(inv ? inv.goldPrice : goldPrice).toLocaleString('fa-IR')} تومان\n`;
      t += `▫️ ارزش طلا: ${raw.toLocaleString('fa-IR')} تومان\n`;
      t += `▫️ کارمزد: ${fee.toLocaleString('fa-IR')} تومان\n`;
      t += `━━━━━━━━━━━━━━━━━━━━━\n`;
      t += `💰 قیمت تمام‌شده: ${price.toLocaleString('fa-IR')} تومان\n`;
    } else if (type === 'coin') {
      const coinName = cSelectedType === 'tamam' ? 'سکه تمام' : (cSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه');
      const w750 = cSelectedType === 'tamam' ? 9.759 : (cSelectedType === 'nim' ? 4.880 : 2.440);
      const price = inv ? inv.totalAmount : getCoinFinalPrice(cSelectedType, cCount);
      t += `🟡 ${inv?.itemTitle || `${cCount} عدد ${coinName}`}\n`;
      t += `⚖️ وزن ۷۵۰: ${(inv ? inv.weight : Number((w750 * cCount).toFixed(3)))} گرم\n`;
      t += `📊 مظنه مثقال: ${cMazaneh.toLocaleString('fa-IR')} تومان\n`;
      t += `▫️ کارمزد: ${(inv ? inv.feeAmount : (cFeeFixed * cCount)).toLocaleString('fa-IR')} تومان\n`;
      t += `━━━━━━━━━━━━━━━━━━━━━\n`;
      t += `💰 مبلغ نهایی: ${price.toLocaleString('fa-IR')} تومان\n`;
    } else if (type === 'coin_purchase') {
      const coinName = cpSelectedType === 'tamam' ? 'سکه تمام' : (cpSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه');
      const w750 = cpSelectedType === 'tamam' ? 9.759 : (cpSelectedType === 'nim' ? 4.880 : 2.440);
      const price = inv ? inv.totalAmount : getCpCoinFinalPrice(cpSelectedType, cpCount);
      t += `🪙 ${inv?.itemTitle || `${cpCount} عدد خرید ${coinName} از مشتری`}\n`;
      t += `⚖️ وزن ۷۵۰: ${(inv ? inv.weight : Number((w750 * cpCount).toFixed(3)))} گرم\n`;
      t += `📊 مظنه مثقال: ${cpMazaneh.toLocaleString('fa-IR')} تومان\n`;
      t += `▫️ کارمزد کسر شده: ${(inv ? -inv.feeAmount : (cpFeeFixed * cpCount)).toLocaleString('fa-IR')} تومان\n`;
      t += `━━━━━━━━━━━━━━━━━━━━━\n`;
      t += `💰 مبلغ پرداختی به مشتری: ${price.toLocaleString('fa-IR')} تومان\n`;
    } else {
      t += `⚖️ ${inv?.itemTitle || 'طلای آب‌شده'}\n`;
      t += `⚖️ وزن طلا: ${inv ? inv.weight : meltedResult.goldGrams} گرم\n`;
      t += `🪙 نرخ هر گرم: ${(inv ? inv.goldPrice : meltedResult.rate).toLocaleString('fa-IR')} تومان\n`;
      t += `▫️ ارزش طلا: ${(inv ? inv.rawGoldAmount : meltedResult.rawGoldValue).toLocaleString('fa-IR')} تومان\n`;
      t += `▫️ کارمزد: ${(inv ? inv.feeAmount : meltedResult.feeAmount).toLocaleString('fa-IR')} تومان\n`;
      t += `━━━━━━━━━━━━━━━━━━━━━\n`;
      t += `💰 مبلغ نهایی: ${(inv ? inv.totalAmount : meltedResult.finalPayable).toLocaleString('fa-IR')} تومان\n`;
    }

    t += `━━━━━━━━━━━━━━━━━━━━━\n`;
    const contactParts = [];
    if (store.phone) contactParts.push(`📞 ${store.phone}`);
    if (store.instagram) contactParts.push(`@${store.instagram}`);
    if (contactParts.length) t += contactParts.join('  |  ') + '\n';
    if (store.address) t += `📍 ${store.address}\n`;
    t += `🔐 شناسه رهگیری امنیتی: IR-GOLD-${inv?.invoiceNumber || '1001'}\n`;
    return t;
  };

  const handleCopyInvoice = (type: 'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted') => {
    const text = generateInvoiceText(type);
    navigator.clipboard.writeText(text);
    showNotification('متن فاکتور در حافظه کپی شد', 'success');
  };

  const handleExportCurrentPNG = (type: 'jewelry' | 'parsian' | 'coin' | 'coin_purchase' | 'melted') => {
    const invNum = String(Math.floor(1000 + Math.random() * 9000));
    const dateFa = getPersianDate();
    const timeFa = getPersianTime();

    let inv: SaleInvoice;
    if (type === 'jewelry') {
      inv = {
        id: 'tmp_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'jewelry',
        itemTitle: 'طلای ساخته‌شده ۱۸ عیار',
        customerName: custName.trim() || 'مشتری محترم حضوری',
        customerPhone: custPhone.trim() || undefined,
        weight: jWeight,
        karat: '18',
        goldPrice,
        rawGoldAmount: jResult.rawGold,
        feeType: jFeeType,
        feePercent: jFeeType === 'percentage' ? jFeePercent : undefined,
        feeAmount: jResult.fee,
        profitPercent: jProfitPercent,
        profitAmount: jResult.profit,
        taxPercent: jTaxActive ? jTaxPercent : 0,
        taxAmount: jResult.tax,
        discountAmount: jResult.discount,
        totalAmount: jResult.total
      };
    } else if (type === 'parsian') {
      const price = calculateParsianPrice(pWeight);
      const raw = Math.round(pWeight * goldPrice);
      inv = {
        id: 'tmp_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'parsian',
        itemTitle: pSelectedPresetName || `شمش پارسیان ${pWeight} گرم`,
        customerName: custName.trim() || 'مشتری محترم حضوری',
        customerPhone: custPhone.trim() || undefined,
        weight: pWeight,
        karat: '18',
        goldPrice,
        rawGoldAmount: raw,
        feeAmount: price - raw,
        profitAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: price
      };
    } else if (type === 'coin') {
      const coinName = cSelectedType === 'tamam' ? 'سکه تمام' : (cSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه');
      const w750 = cSelectedType === 'tamam' ? 9.759 : (cSelectedType === 'nim' ? 4.880 : 2.440);
      const unitRaw = getCoinRawPrice(cSelectedType);
      const totalRaw = unitRaw * cCount;
      const totalFee = cFeeFixed * cCount;
      inv = {
        id: 'tmp_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'coin',
        itemTitle: `${cCount > 1 ? `${cCount} عدد ` : ''}${coinName}`,
        customerName: custName.trim() || 'مشتری محترم حضوری',
        customerPhone: custPhone.trim() || undefined,
        weight: Number((w750 * cCount).toFixed(3)),
        karat: '18 (معادل ۷۵۰)',
        goldPrice,
        rawGoldAmount: totalRaw,
        feeAmount: totalFee,
        profitAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: totalRaw + totalFee
      };
    } else if (type === 'coin_purchase') {
      const coinName = cpSelectedType === 'tamam' ? 'سکه تمام' : (cpSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه');
      const w750 = cpSelectedType === 'tamam' ? 9.759 : (cpSelectedType === 'nim' ? 4.880 : 2.440);
      const unitRaw = getCpCoinRawPrice(cpSelectedType);
      const totalRaw = unitRaw * cpCount;
      const totalFee = cpFeeFixed * cpCount;
      inv = {
        id: 'tmp_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'coin',
        itemTitle: `خرید ${cpCount > 1 ? `${cpCount} عدد ` : ''}${coinName} (از مشتری)`,
        customerName: custName.trim() || 'فروشنده (مشتری حضوری)',
        customerPhone: custPhone.trim() || undefined,
        weight: Number((w750 * cpCount).toFixed(3)),
        karat: '18 (معادل ۷۵۰)',
        goldPrice,
        rawGoldAmount: totalRaw,
        feeAmount: -totalFee,
        profitAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: Math.max(0, totalRaw - totalFee),
        note: 'خرید از مشتری'
      };
    } else {
      inv = {
        id: 'tmp_' + Date.now(),
        invoiceNumber: invNum,
        createdAt: new Date().toISOString(),
        dateFa,
        timeFa,
        type: 'melted',
        itemTitle: `طلای آب‌شده ۱۸ عیار (${meltedResult.goldGrams} گرم)`,
        customerName: custName.trim() || 'مشتری محترم حضوری',
        customerPhone: custPhone.trim() || undefined,
        weight: meltedResult.goldGrams,
        karat: '18',
        goldPrice: meltedResult.rate,
        rawGoldAmount: meltedResult.rawGoldValue,
        feeAmount: meltedResult.feeAmount,
        profitAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: meltedResult.finalPayable
      };
    }

    try {
      downloadInvoicePNG(inv, store);
      showNotification('تصویر باکیفیت PNG فاکتور با موفقیت دانلود شد', 'success');
    } catch {
      onExportPNG(inv);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* HEADER BAR WITH QUICK LOG ACCESS */}
      <div className="flex items-center justify-between bg-zinc-900/70 px-3.5 py-2.5 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ffd700] to-[#b89320] flex items-center justify-center text-black font-black shadow-md">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black text-white">ماشین‌حساب طلایی زرسا</h1>
            <p className="text-[10px] text-zinc-400">محاسبه سریع جلوی مشتری با ثبت فاکتور</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenPurchase && (
            <button
              type="button"
              onClick={onOpenPurchase}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-[#ffd700] border border-amber-500/40 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
              title="خرید طلا، متفرقه (۷۴۰)، پارسیان و آب‌شده از مشتری"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#ffd700]" />
              <span>خرید طلا</span>
            </button>
          )}

          {onOpenAdvancedCalculator && (
            <button
              type="button"
              onClick={onOpenAdvancedCalculator}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
              title="ماشین‌حساب پیشرفته (بودجه مشتری، کشف نرخ و اجرت)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" />
              <span>پیشرفته</span>
            </button>
          )}

          {onOpenSalesLog && (
            <button
              onClick={onOpenSalesLog}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>فروش ({salesCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 SUB-TABS SELECTOR */}
      <div className="bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 grid grid-cols-2 sm:grid-cols-5 gap-1 text-xs">
        <button
          onClick={() => setSubTab('jewelry')}
          className={`py-2.5 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all active:scale-98 cursor-pointer ${
            subTab === 'jewelry'
              ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/25 font-black'
              : 'text-zinc-400 hover:text-white bg-zinc-950/40'
          }`}
        >
          <span className="text-xs">💍 طلای ساخته‌شده</span>
          <span className="text-[10px] opacity-80 font-normal">اجرت، سود، مالیات</span>
        </button>

        <button
          onClick={() => setSubTab('parsian')}
          className={`py-2.5 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all active:scale-98 cursor-pointer ${
            subTab === 'parsian'
              ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/25 font-black'
              : 'text-zinc-400 hover:text-white bg-zinc-950/40'
          }`}
        >
          <span className="text-xs">🪙 سکه پارسیان</span>
          <span className="text-[10px] opacity-80 font-normal">۲۲ وزن پیش‌فرض (۵٪)</span>
        </button>

        <button
          onClick={() => setSubTab('coin')}
          className={`py-2.5 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all active:scale-98 cursor-pointer ${
            subTab === 'coin'
              ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/25 font-black'
              : 'text-zinc-400 hover:text-white bg-zinc-950/40'
          }`}
        >
          <span className="text-xs">🟡 فروش سکه</span>
          <span className="text-[10px] opacity-80 font-normal">تمام، نیم، ربع (مظنه)</span>
        </button>

        <button
          onClick={() => setSubTab('coin_purchase')}
          className={`py-2.5 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all active:scale-98 cursor-pointer ${
            subTab === 'coin_purchase'
              ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/25 font-black'
              : 'text-zinc-400 hover:text-white bg-zinc-950/40'
          }`}
        >
          <span className="text-xs">🪙 خرید سکه</span>
          <span className="text-[10px] opacity-80 font-normal">فرمول ۲.۲۵۳، کسر کارمزد</span>
        </button>

        <button
          onClick={() => setSubTab('melted')}
          className={`py-2.5 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all active:scale-98 cursor-pointer ${
            subTab === 'melted'
              ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/25 font-black'
              : 'text-zinc-400 hover:text-white bg-zinc-950/40'
          }`}
        >
          <span className="text-xs">⚖️ طلای آب‌شده</span>
          <span className="text-[10px] opacity-80 font-normal">مبلغ به گرم و کارمزد</span>
        </button>
      </div>

      {/* ----------------- SUB-TAB 1: MANUFACTURED JEWELRY ----------------- */}
      {subTab === 'jewelry' && (
        <div className="bg-zinc-900/70 p-3 sm:p-5 rounded-3xl border border-zinc-800 space-y-3.5">
          
          {/* BASE 18K GOLD RATE (SYNCHRONIZED WITH MAIN PAGE - NO MANUAL RATE BOX NEEDED) */}
          <div className="flex items-center justify-between bg-zinc-950/80 px-3.5 py-2.5 rounded-2xl border border-zinc-800 text-xs">
            <span className="text-zinc-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>نرخ مبنای ۱۸ عیار (هماهنگ با صفحه اصلی):</span>
            </span>
            <span className="font-black text-[#ffd700] font-mono text-sm">
              {formatTomanAmount(goldPrice)} تومان
            </span>
          </div>

          {/* CLEAN UNCLUTTERED INPUTS (NO CLUTTER / NO UNNECESSARY HELPERS) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            
            {/* 1. Weight */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/90 flex flex-col justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>وزن طلا</span>
              </span>
              <div className="relative">
                <input 
                  type="text"
                  inputMode="decimal"
                  value={toPersianDigits(jWeight || '')}
                  onChange={(e) => setJWeight(parseCleanFloat(e.target.value))}
                  placeholder="۰"
                  className="w-full h-11 pl-9 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-black text-white font-mono text-center focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-2.5 top-3 text-[10px] text-zinc-400 font-mono">گرم</span>
              </div>
            </div>

            {/* 2. Craftsmanship Fee */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/90 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>اجرت ساخت</span>
                </span>
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setJFeeType('percentage')}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      jFeeType === 'percentage' ? 'bg-[#d4af37] text-black' : 'text-zinc-400'
                    }`}
                  >
                    درصدی ٪
                  </button>
                  <button
                    type="button"
                    onClick={() => setJFeeType('fixed_total')}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      jFeeType === 'fixed_total' ? 'bg-[#d4af37] text-black' : 'text-zinc-400'
                    }`}
                  >
                    تومانی
                  </button>
                </div>
              </div>

              {jFeeType === 'percentage' ? (
                <div className="relative">
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={toPersianDigits(jFeePercent || '')}
                    onChange={(e) => setJFeePercent(parseCleanFloat(e.target.value))}
                    placeholder="درصد"
                    className="w-full h-11 pl-7 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-2.5 top-2.5 text-zinc-400 font-mono text-xs">٪</span>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={formatTomanAmount(jFeeTotal)}
                    onChange={(e) => setJFeeTotal(parseCleanNumber(e.target.value))}
                    placeholder="مبلغ اجرت..."
                    className="w-full h-11 pl-12 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-2 top-3 text-zinc-400 text-[10px]">تومان</span>
                </div>
              )}
            </div>

            {/* 3. Profit Percentage */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/90 flex flex-col justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-400" />
                <span>سود طلافروش</span>
              </span>
              <div className="relative">
                <input 
                  type="text"
                  inputMode="decimal"
                  value={toPersianDigits(jProfitPercent || '')}
                  onChange={(e) => setJProfitPercent(parseCleanFloat(e.target.value))}
                  placeholder="۷"
                  className="w-full h-11 pl-7 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-2.5 top-2.5 text-zinc-400 font-mono text-xs">٪</span>
              </div>
            </div>

            {/* 4. Customer Discount (Optional) */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/90 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>تخفیف مشتری</span>
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setJDiscountType('fixed');
                        setJDiscountValue(0);
                      }}
                      className={`px-1.5 py-0.5 text-[9px] rounded font-bold transition-all cursor-pointer ${
                        jDiscountType === 'fixed'
                          ? 'bg-purple-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      تومان
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setJDiscountType('percent');
                        setJDiscountValue(0);
                      }}
                      className={`px-1.5 py-0.5 text-[9px] rounded font-bold transition-all cursor-pointer ${
                        jDiscountType === 'percent'
                          ? 'bg-purple-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      درصد ٪
                    </button>
                  </div>
                  {jDiscountValue > 0 && (
                    <button 
                      type="button" 
                      onClick={() => setJDiscountValue(0)} 
                      className="text-[10px] text-red-400 hover:underline cursor-pointer"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  inputMode={jDiscountType === 'fixed' ? "numeric" : "decimal"}
                  value={jDiscountType === 'fixed' ? formatTomanAmount(jDiscountValue) : toPersianDigits(jDiscountValue || '')}
                  onChange={(e) => {
                    const val = jDiscountType === 'fixed'
                      ? parseCleanNumber(e.target.value)
                      : parseCleanFloat(e.target.value);
                    setJDiscountValue(val);
                  }}
                  placeholder={jDiscountType === 'fixed' ? "۰ تومان" : "۰ ٪"}
                  className="w-full h-11 pl-12 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-2.5 top-3 text-zinc-400 text-[10px]">
                  {jDiscountType === 'fixed' ? 'تومان' : 'درصد ٪'}
                </span>
              </div>
              {jDiscountType === 'percent' && jDiscountValue > 0 && (
                <span className="text-[10px] text-purple-400 font-bold mt-1.5 text-right font-mono block">
                  معادل ریالی: {formatTomanAmount(jDiscount)} تومان
                </span>
              )}
            </div>

          </div>

          {/* 5. TAX TOGGLE & CONDITIONAL INPUT BOX (HIDDEN COMPLETELY WHEN INACTIVE) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-zinc-950/80 px-3 py-2.5 rounded-2xl border border-zinc-800 text-xs">
              <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>مالیات ارزش‌افزوده ({jTaxActive ? `${toPersianDigits(jTaxPercent)}٪` : 'غیرفعال / معاف'})</span>
              </span>
              <button
                type="button"
                onClick={() => setJTaxActive(!jTaxActive)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  jTaxActive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
                }`}
              >
                {jTaxActive ? 'روشن (۹٪)' : '+ فعال‌سازی مالیات'}
              </button>
            </div>

            {/* CONDITIONAL BOX: ONLY APPEARS IF TAX IS ACTIVE */}
            {jTaxActive && (
              <div className="bg-zinc-950 p-3 rounded-2xl border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in duration-200">
                <span className="text-zinc-200 font-bold">درصد مالیات ارزش‌افزوده:</span>
                <div className="relative w-24">
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={toPersianDigits(jTaxPercent || '')}
                    onChange={(e) => setJTaxPercent(parseCleanFloat(e.target.value))}
                    className="w-full h-9 pl-6 pr-2 bg-zinc-900 border border-emerald-500/40 rounded-xl text-sm font-bold text-white font-mono text-center focus:border-emerald-400 outline-none"
                  />
                  <span className="absolute left-2 top-1.5 text-zinc-400 font-mono text-xs">٪</span>
                </div>
              </div>
            )}
          </div>

          {/* RESULTS BREAKDOWN CARD (DETAILED BREAKDOWN WITH LIVE AMOUNTS) */}
          <div className="bg-zinc-950 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/70 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 font-bold text-zinc-300">
                <Calculator className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>تفکیک دقیق اقلام فاکتور</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                محاسبه زنده
              </span>
            </div>

            {/* 3 Live KPI Cards: Summary values integrated inline */}
            <div className="grid grid-cols-3 gap-1.5 text-center pt-1 pb-2">
              {/* 1. اجرت ساخت */}
              <div className="bg-zinc-900/90 py-2 px-1 rounded-xl border border-zinc-800/80 flex flex-col justify-center">
                <span className="text-[9.5px] text-amber-400 font-bold truncate">اجرت ساخت</span>
                <span className="text-xs sm:text-sm font-black text-amber-300 font-mono truncate mt-0.5">
                  {currentJResult.fee.toLocaleString('fa-IR')} <span className="text-[8px] font-normal text-zinc-400">ت</span>
                </span>
              </div>

              {/* 2. سود طلا */}
              <div className="bg-zinc-900/90 py-2 px-1 rounded-xl border border-zinc-800/80 flex flex-col justify-center">
                <span className="text-[9.5px] text-sky-400 font-bold truncate">سود طلا ({toPersianDigits(jProfitPercent)}٪)</span>
                <span className="text-xs sm:text-sm font-black text-sky-300 font-mono truncate mt-0.5">
                  {currentJResult.profit.toLocaleString('fa-IR')} <span className="text-[8px] font-normal text-zinc-400">ت</span>
                </span>
              </div>

              {/* 3. مبلغ کل نهایی */}
              <div className="bg-gradient-to-br from-[#d4af37]/20 via-zinc-900 to-black py-2 px-1 rounded-xl border border-[#d4af37]/40 flex flex-col justify-center shadow-inner">
                <span className="text-[9.5px] text-[#ffd700] font-black truncate">مبلغ کل فاکتور</span>
                <span className="text-xs sm:text-sm font-black text-[#ffd700] font-mono truncate mt-0.5">
                  {currentJResult.total.toLocaleString('fa-IR')} <span className="text-[8px] font-normal text-zinc-300">ت</span>
                </span>
              </div>
            </div>

            <div className="border-b border-zinc-900/80 pb-1 flex justify-between items-center text-[10px] text-zinc-400">
              <span>جزئیات تفکیکی حساب:</span>
              <span className="font-mono text-zinc-500">خالصی طلا: {currentJResult.rawGold.toLocaleString('fa-IR')} ت</span>
            </div>

            <div className="flex justify-between items-center py-1 text-zinc-300">
              <span>مبلغ خالصی طلا (A):</span>
              <span className="font-mono font-bold text-white text-sm">{formatTomanAmount(currentJResult.rawGold)} تومان</span>
            </div>

            <div className="flex justify-between items-center py-1 text-zinc-300">
              <span>مبلغ خالصی اجرت (B - A):</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{formatTomanAmount(currentJResult.fee)} تومان</span>
            </div>

            <div className="flex justify-between items-center py-1 text-zinc-300">
              <span>مبلغ خالصی سود ({toPersianDigits(jProfitPercent)}٪):</span>
              <span className="font-mono font-bold text-sky-300 text-sm">{formatTomanAmount(currentJResult.profit)} تومان</span>
            </div>

            <div className="flex justify-between items-center py-1 text-zinc-300">
              <span>مبلغ خالصی مالیات ({jTaxActive ? `${toPersianDigits(jTaxPercent)}٪` : 'غیرفعال'}):</span>
              <span className="font-mono font-bold text-white text-sm">{formatTomanAmount(currentJResult.tax)} تومان</span>
            </div>

            {currentJResult.discount > 0 && (
              <div className="flex justify-between items-center py-1 text-red-400">
                <span>تخفیف فروشگاه:</span>
                <span className="font-mono font-bold text-sm">-{formatTomanAmount(currentJResult.discount)} تومان</span>
              </div>
            )}

            {/* Total Payable Amount */}
            <div className="pt-2.5 mt-2 border-t border-zinc-800 flex items-center justify-between bg-gradient-to-r from-[#d4af37]/15 to-transparent p-3 rounded-xl border border-[#d4af37]/30">
              <div>
                <span className="text-xs font-black text-[#d4af37] block">مبلغ کل قابل پرداخت:</span>
                <span className="text-[10px] text-zinc-400">تسویه نهایی با مشتری</span>
                {store.rounding?.enabled && store.rounding.step > 1 && (
                  <span className="text-[9px] text-amber-300/90 font-medium block mt-0.5">
                    رُند شده به {store.rounding.step.toLocaleString('fa-IR')} ت ({store.rounding.direction === 'up' ? 'رو به بالا' : store.rounding.direction === 'down' ? 'رو به پایین' : 'نزدیک‌ترین'})
                  </span>
                )}
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-black text-[#ffd700] font-mono">
                  {formatTomanAmount(currentJResult.total)}
                </span>
                <span className="text-xs font-bold text-zinc-300 mr-1">تومان</span>
              </div>
            </div>
          </div>

          {/* STATIC INLINE ACTION BUTTONS */}
          <div className="space-y-2 pt-1">
            
            {/* Primary Actions Row: Save Invoice & Live Preview */}
            <div className="grid grid-cols-12 gap-2">
              <button
                type="button"
                onClick={() => openSaveInvoiceModal('jewelry', 'طلای ساخته‌شده ۱۸ عیار')}
                className="col-span-7 h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer group"
              >
                <FileCheck className="w-4 h-4 text-white stroke-[2.5]" />
                <span>ثبت و ذخیره فاکتور</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPreview('jewelry')}
                className="col-span-5 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#ffd700] border border-[#d4af37]/40 hover:border-[#d4af37] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer group"
              >
                <Eye className="w-4 h-4 text-[#ffd700]" />
                <span>پیش‌نمایش فاکتور</span>
              </button>
            </div>

            {/* Secondary Actions Row: Reset, Copy Text & Export PNG */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={handleResetJewelry}
                className="h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-rose-300 border border-zinc-800 hover:border-rose-500/50 font-medium flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400 stroke-[2.2]" />
                <span>پاکسازی</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyInvoice('jewelry')}
                className="h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-medium flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
                <span>کپی متن</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportCurrentPNG('jewelry')}
                className="h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#d4af37]/40 font-medium flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#ffd700] stroke-[2.2]" />
                <span>صدور PNG</span>
              </button>
            </div>

          </div>



        </div>
      )}

      {/* ----------------- SUB-TAB 2: PARSIAN COIN CALCULATOR (DEFAULT 5%) ----------------- */}
      {subTab === 'parsian' && (
        <div className="bg-zinc-900/70 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#d4af37]" />
              <span>محاسبه و قیمت تمام‌شده سکه پارسیان</span>
            </h2>
            <span className="text-[11px] font-mono text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-lg border border-[#d4af37]/30">
              کارمزد پیش‌فرض ۵٪
            </span>
          </div>

          {/* Synchronized Gold Rate from Main Page (No manual rate box needed) */}
          <div className="flex items-center justify-between bg-zinc-950/80 px-3.5 py-2.5 rounded-2xl border border-zinc-800 text-xs">
            <span className="text-zinc-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>نرخ مبنای ۱۸ عیار (هماهنگ با صفحه اصلی):</span>
            </span>
            <span className="font-black text-[#ffd700] font-mono text-sm">
              {formatTomanAmount(goldPrice)} تومان
            </span>
          </div>

          {/* Fee Configuration Bar */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-200">میزان کارمزد سکه پارسیان</label>
              <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPFeeType('percentage')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                    pFeeType === 'percentage' ? 'bg-[#d4af37] text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  درصدی (پیش‌فرض ۵٪)
                </button>
                <button
                  type="button"
                  onClick={() => setPFeeType('fixed')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                    pFeeType === 'fixed' ? 'bg-[#d4af37] text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  مقطوع (تومانی)
                </button>
              </div>
            </div>

            {pFeeType === 'percentage' ? (
              <div className="relative">
                <input 
                  type="text"
                  inputMode="decimal"
                  value={toPersianDigits(pFeePercent || '')}
                  onChange={(e) => setPFeePercent(parseCleanFloat(e.target.value))}
                  placeholder="درصد کارمزد (پیش‌فرض ۵)"
                  className="w-full h-11 pl-8 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-3 top-2.5 text-sm text-zinc-400 font-mono">٪</span>
              </div>
            ) : (
              <div className="relative">
                <input 
                  type="text"
                  inputMode="numeric"
                  value={formatTomanAmount(pFeeFixed)}
                  onChange={(e) => setPFeeFixed(parseCleanNumber(e.target.value))}
                  placeholder="مبلغ کارمزد به تومان..."
                  className="w-full h-11 pl-14 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-3 top-3 text-xs text-zinc-400">تومان</span>
              </div>
            )}
          </div>

          {/* Custom Weight Box */}
          <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-2 text-xs">
            <span className="text-xs font-bold text-zinc-200 block">محاسبه وزن دلخواه و سفارشی پارسیان:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input 
                  type="text"
                  inputMode="decimal"
                  value={toPersianDigits(pWeight || '')}
                  onChange={(e) => {
                    const val = parseCleanFloat(e.target.value);
                    setPWeight(val);
                    setPSelectedPresetName(val > 0 ? `شمش پارسیان سفارشی ${toPersianDigits(val)} گرم` : '');
                  }}
                  className="w-full h-11 pl-10 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                  placeholder="وزن دلخواه به گرم..."
                />
                <span className="absolute left-3 top-3 text-xs text-zinc-400 font-mono">گرم</span>
              </div>

              <div className="bg-zinc-900 px-3 h-11 rounded-xl border border-zinc-700/80 flex items-center justify-between">
                <span className="text-xs text-zinc-400">قیمت تمام‌شده:</span>
                <span className="text-base font-black text-[#ffd700] font-mono">
                  {formatTomanAmount(calculateParsianPrice(pWeight))} <span className="text-[10px] text-zinc-400 font-normal">ت</span>
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE SELECTED RESULT */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-4 rounded-xl border border-[#d4af37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">{pSelectedPresetName || `پارسیان ${toPersianDigits(pWeight)} گرم`}</span>
                <span className="text-[10px] font-mono bg-[#d4af37]/20 text-[#ffd700] px-1.5 py-0.5 rounded font-bold">
                  {toPersianDigits(pWeight)} گرم ({toPersianDigits(Math.round(pWeight * 1000))} سوت)
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                خالص طلا: {formatTomanAmount(Math.round(pWeight * goldPrice))} ت + کارمزد: {pFeeType === 'percentage' ? `${toPersianDigits(pFeePercent)}٪` : `${formatTomanAmount(pFeeFixed)} ت`}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="text-left">
                <span className="text-xs text-zinc-400 block">قیمت تمام‌شده:</span>
                <span className="text-xl sm:text-2xl font-black text-[#ffd700] font-mono">
                  {formatTomanAmount(calculateParsianPrice(pWeight))}
                </span>
                <span className="text-[10px] text-zinc-400 mr-1">تومان</span>
              </div>

              <button
                onClick={() => openSaveInvoiceModal('parsian', pSelectedPresetName || `شمش پارسیان ${pWeight} گرم`)}
                className="h-11 px-4 rounded-xl bg-[#d4af37] text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#d4af37]/25 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>ثبت فاکتور</span>
              </button>
            </div>
          </div>

          {/* Quick Buttons: Preview, Copy, PNG */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleOpenPreview('parsian')}
              className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#ffd700] border border-[#d4af37]/40 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#ffd700]" />
              <span>پیش‌نمایش فاکتور</span>
            </button>

            <button
              onClick={() => handleCopyInvoice('parsian')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>کپی متن رسید</span>
            </button>

            <button
              onClick={() => handleExportCurrentPNG('parsian')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span>خروجی PNG</span>
            </button>
          </div>

          {/* EXACT 22 DEFAULT PARSIAN PRESETS WITH LIVE TOTAL PRICES */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>قیمت تمام‌شده ۲۲ سکه پارسیان پیش‌فرض (با کارمزد ۵٪):</span>
              </span>
              <span className="text-[10px] text-zinc-500">برای انتخاب و ثبت لمس کنید</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEFAULT_PARSIAN_PRESETS.map((item, idx) => {
                const totalPrice = calculateParsianPrice(item.weight);
                const isSelected = pWeight === item.weight;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setPWeight(item.weight);
                      setPSelectedPresetName(item.name);
                    }}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer active:scale-95 ${
                      isSelected 
                        ? 'border-[#d4af37] bg-[#d4af37]/20 shadow-lg shadow-[#d4af37]/15 ring-1 ring-[#d4af37]'
                        : 'border-zinc-800/90 bg-zinc-950/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white truncate">{item.name}</span>
                      <span className="text-[10px] font-mono text-[#d4af37] font-bold shrink-0">{item.weight}g</span>
                    </div>

                    <div className="text-left font-mono font-black text-sm text-[#ffd700] mt-1">
                      {totalPrice.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-zinc-400">ت</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 3: BANK COINS (MAZANEH BASED) ----------------- */}
      {subTab === 'coin' && (
        <div className="bg-zinc-900/70 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>محاسبه مسکوکات (تمام، نیم، ربع) بر اساس مظنه</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              قیمت طلا ۷۵۰: {(cMazaneh ? Math.round(cMazaneh / 4.3318) : goldPrice).toLocaleString('fa-IR')} ت
            </span>
          </div>

          {/* Mazaneh & Cash Fee Inputs */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-zinc-200">ورود دستی مظنه طلا (تومان)</label>
                <span className="text-[10px] text-zinc-500">مثقال ۱۷ عیار</span>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  inputMode="numeric"
                  value={formatTomanAmount(cMazaneh)}
                  onChange={(e) => handleMazanehChange(parseCleanNumber(e.target.value))}
                  placeholder="مظنه طلا به تومان..."
                  className="w-full h-11 pl-16 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-lg font-black text-[#ffd700] font-mono text-center focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-3 top-3 text-xs font-bold text-zinc-400">تومان</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-zinc-200">کارمزد پولی سکه (تومان)</label>
                <span className="text-[10px] text-zinc-500">اضافه به قیمت خالص</span>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  inputMode="numeric"
                  value={formatTomanAmount(cFeeFixed)}
                  onChange={(e) => setCFeeFixed(parseCleanNumber(e.target.value))}
                  placeholder="کارمزد هر سکه..."
                  className="w-full h-11 pl-14 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-3 top-3 text-xs text-zinc-400">تومان</span>
              </div>
            </div>
          </div>

          {/* 3 COIN CARDS: TAMAM, NIM, ROB (WITH 750 EQUIVALENT WEIGHT) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Tamam Coin */}
            <button
              type="button"
              onClick={() => setCSelectedType('tamam')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer active:scale-98 ${
                cSelectedType === 'tamam'
                  ? 'border-[#d4af37] bg-[#d4af37]/20 shadow-lg shadow-[#d4af37]/15 ring-1 ring-[#d4af37]'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-black text-white">سکه تمام</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                  غیربانکی
                </span>
              </div>
              <div className="text-zinc-400 text-[11px] mb-1">
                قیمت خالص: {getCoinRawPrice('tamam').toLocaleString('fa-IR')} ت
              </div>
              <div className="text-left font-mono font-black text-lg text-[#ffd700] my-1">
                {getCoinFinalPrice('tamam').toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-zinc-400">تومان</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-amber-300 font-bold">
                <span>وزن ۷۵۰ سکه:</span>
                <span className="font-mono">۹.۷۵۹ گرم</span>
              </div>
            </button>

            {/* Nim Coin */}
            <button
              type="button"
              onClick={() => setCSelectedType('nim')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer active:scale-98 ${
                cSelectedType === 'nim'
                  ? 'border-[#d4af37] bg-[#d4af37]/20 shadow-lg shadow-[#d4af37]/15 ring-1 ring-[#d4af37]'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-black text-white">نیم سکه</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                  غیربانکی
                </span>
              </div>
              <div className="text-zinc-400 text-[11px] mb-1">
                قیمت خالص: {getCoinRawPrice('nim').toLocaleString('fa-IR')} ت
              </div>
              <div className="text-left font-mono font-black text-lg text-[#ffd700] my-1">
                {getCoinFinalPrice('nim').toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-zinc-400">تومان</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-amber-300 font-bold">
                <span>وزن ۷۵۰ سکه:</span>
                <span className="font-mono">۴.۸۸۰ گرم</span>
              </div>
            </button>

            {/* Rob Coin */}
            <button
              type="button"
              onClick={() => setCSelectedType('rob')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer active:scale-98 ${
                cSelectedType === 'rob'
                  ? 'border-[#d4af37] bg-[#d4af37]/20 shadow-lg shadow-[#d4af37]/15 ring-1 ring-[#d4af37]'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-black text-white">ربع سکه</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                  غیربانکی
                </span>
              </div>
              <div className="text-zinc-400 text-[11px] mb-1">
                قیمت خالص: {getCoinRawPrice('rob').toLocaleString('fa-IR')} ت
              </div>
              <div className="text-left font-mono font-black text-lg text-[#ffd700] my-1">
                {getCoinFinalPrice('rob').toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-zinc-400">تومان</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-amber-300 font-bold">
                <span>وزن ۷۵۰ سکه:</span>
                <span className="font-mono">۲.۴۴۰ گرم</span>
              </div>
            </button>
          </div>

          {/* Count Selector & Total Display */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-300">تعداد:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCCount(Math.max(1, cCount - 1))}
                  className="w-9 h-9 rounded-lg bg-zinc-800 text-white font-bold flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <input 
                  type="number"
                  min="1"
                  value={cCount}
                  onChange={(e) => setCCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 h-9 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono font-black text-center text-sm"
                />
                <button
                  type="button"
                  onClick={() => setCCount(cCount + 1)}
                  className="w-9 h-9 rounded-lg bg-zinc-800 text-white font-bold flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  +
                </button>
              </div>

              <span className="text-xs text-zinc-400 font-bold mr-2">
                {cSelectedType === 'tamam' ? 'سکه تمام' : (cSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه')}
              </span>
            </div>

            <div className="text-left">
              <span className="text-xs text-zinc-400 block">مبلغ کل قابل پرداخت ({cCount} عدد):</span>
              <span className="text-2xl font-black text-[#ffd700] font-mono">
                {getCoinFinalPrice(cSelectedType, cCount).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-zinc-300 mr-1">تومان</span>
            </div>
          </div>

          {/* Buttons: Save, Preview, Copy, PNG */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => openSaveInvoiceModal('coin', `${cCount > 1 ? `${cCount} عدد ` : ''}${cSelectedType === 'tamam' ? 'سکه تمام' : (cSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه')}`)}
              className="h-11 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ثبت فاکتور سکه</span>
            </button>

            <button
              onClick={() => handleOpenPreview('coin')}
              className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#ffd700] border border-[#d4af37]/40 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#ffd700]" />
              <span>پیش‌نمایش فاکتور</span>
            </button>

            <button
              onClick={() => handleCopyInvoice('coin')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>کپی متن رسید</span>
            </button>

            <button
              onClick={() => handleExportCurrentPNG('coin')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span>خروجی PNG</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 3.5: COIN PURCHASE (خرید سکه از مشتری) ----------------- */}
      {subTab === 'coin_purchase' && (
        <div className="bg-zinc-900/70 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#ffd700]" />
              <span>محاسبه خرید مسکوکات طلا از مشتری (بر مبنای مظنه)</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              فرمول ذاتی سکه تمام: مظنه × ۲.۲۵۳
            </span>
          </div>

          {/* Mazaneh & Cash Fee Inputs */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-zinc-200">ورود دستی مظنه طلا مبنا (تومان)</label>
                <span className="text-[10px] text-zinc-500">مثقال ۱۷ عیار</span>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  inputMode="numeric"
                  value={formatTomanAmount(cpMazaneh)}
                  onChange={(e) => handleCpMazanehChange(parseCleanNumber(e.target.value))}
                  placeholder="مظنه طلا به تومان..."
                  className="w-full h-11 pl-16 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-lg font-black text-[#ffd700] font-mono text-center focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-3 top-3 text-xs font-bold text-zinc-400">تومان</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-zinc-200">مبلغ کارمزد کسر شده از هر سکه (تومان)</label>
                <span className="text-[10px] text-red-400 font-bold">کسر از قیمت ذاتی</span>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  inputMode="numeric"
                  value={formatTomanAmount(cpFeeFixed)}
                  onChange={(e) => setCpFeeFixed(parseCleanNumber(e.target.value))}
                  placeholder="کارمزد خرید کسر شده..."
                  className="w-full h-11 pl-14 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-base font-bold text-red-400 font-mono text-center focus:border-red-500 outline-none"
                />
                <span className="absolute left-3 top-3 text-xs text-zinc-400">تومان</span>
              </div>
            </div>
          </div>

          {/* 3 COIN CARDS SHOWING MUTUAL COMPUTATION IN REAL-TIME */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Tamam Coin */}
            <button
              type="button"
              onClick={() => setCpSelectedType('tamam')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between h-32 active:scale-98 ${
                cpSelectedType === 'tamam'
                  ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-xs font-black text-white">خرید سکه تمام</span>
                {cpSelectedType === 'tamam' && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-black text-[9px] font-black">✓</span>
                )}
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] block">ارزش ذاتی: {formatTomanAmount(cpRawTamamPrice)} تومان</span>
                <span className="text-[10px] text-zinc-500 block">ضریب: ۲.۲۵۳ | وزن: ۸.۱۳۳ گرم</span>
              </div>
              <div className="text-left font-mono font-black text-base text-amber-400 mt-1">
                {formatTomanAmount(Math.max(0, cpRawTamamPrice - cpFeeFixed))} <span className="text-[9px] font-normal text-zinc-400">ت خرید</span>
              </div>
            </button>

            {/* Nim Coin */}
            <button
              type="button"
              onClick={() => setCpSelectedType('nim')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between h-32 active:scale-98 ${
                cpSelectedType === 'nim'
                  ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-xs font-black text-white">خرید نیم سکه</span>
                {cpSelectedType === 'nim' && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-black text-[9px] font-black">✓</span>
                )}
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] block">ارزش ذاتی: {formatTomanAmount(Math.round(cpRawTamamPrice / 2))} تومان</span>
                <span className="text-[10px] text-zinc-500 block">نصف تمام | وزن: ۴.۰۶۶ گرم</span>
              </div>
              <div className="text-left font-mono font-black text-base text-amber-400 mt-1">
                {formatTomanAmount(Math.max(0, Math.round(cpRawTamamPrice / 2) - cpFeeFixed))} <span className="text-[9px] font-normal text-zinc-400">ت خرید</span>
              </div>
            </button>

            {/* Rob Coin */}
            <button
              type="button"
              onClick={() => setCpSelectedType('rob')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between h-32 active:scale-98 ${
                cpSelectedType === 'rob'
                  ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-xs font-black text-white">خرید ربع سکه</span>
                {cpSelectedType === 'rob' && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-black text-[9px] font-black">✓</span>
                )}
              </div>
              <div className="space-y-0.5">
                <span className="text-zinc-500 text-[10px] block">ارزش ذاتی: {formatTomanAmount(Math.round(cpRawTamamPrice / 4))} تومان</span>
                <span className="text-[10px] text-zinc-500 block">یک‌چهارم تمام | وزن: ۲.۰۳۳ گرم</span>
              </div>
              <div className="text-left font-mono font-black text-base text-amber-400 mt-1">
                {formatTomanAmount(Math.max(0, Math.round(cpRawTamamPrice / 4) - cpFeeFixed))} <span className="text-[9px] font-normal text-zinc-400">ت خرید</span>
              </div>
            </button>
          </div>

          {/* Quantity and Final Math Panel */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-300">تعداد:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCpCount(Math.max(1, cpCount - 1))}
                  className="w-9 h-9 rounded-lg bg-zinc-800 text-white font-bold flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <input 
                  type="number"
                  min="1"
                  value={cpCount}
                  onChange={(e) => setCpCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 h-9 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono font-black text-center text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCpCount(cpCount + 1)}
                  className="w-9 h-9 rounded-lg bg-zinc-800 text-white font-bold flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  +
                </button>
              </div>

              <span className="text-xs text-zinc-400 font-bold mr-2">
                خرید {cpSelectedType === 'tamam' ? 'سکه تمام' : (cpSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه')}
              </span>
            </div>

            <div className="text-left">
              <span className="text-xs text-zinc-400 block">مبلغ نهایی پرداختی به مشتری ({cpCount} عدد):</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {getCpCoinFinalPrice(cpSelectedType, cpCount).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-zinc-300 mr-1">تومان</span>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => openSaveInvoiceModal('coin_purchase', `${cpCount > 1 ? `${cpCount} عدد ` : ''}خرید ${cpSelectedType === 'tamam' ? 'سکه تمام' : (cpSelectedType === 'nim' ? 'نیم سکه' : 'ربع سکه')} (از مشتری)`)}
              className="h-11 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ثبت فاکتور خرید</span>
            </button>

            <button
              onClick={() => handleOpenPreview('coin_purchase')}
              className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#ffd700] border border-[#d4af37]/40 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#ffd700]" />
              <span>پیش‌نمایش فاکتور</span>
            </button>

            <button
              onClick={() => handleCopyInvoice('coin_purchase')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>کپی متن رسید</span>
            </button>

            <button
              onClick={() => handleExportCurrentPNG('coin_purchase')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span>خروجی PNG</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 4: MELTED GOLD (AMOUNT TO GRAMS & FEE) ----------------- */}
      {subTab === 'melted' && (
        <div className="bg-zinc-900/70 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>محاسبه طلای آب‌شده (تبدیل مبلغ به وزن طلا)</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              نرخ طلا: {meltedResult.rate.toLocaleString('fa-IR')} ت
            </span>
          </div>

          {/* Amount input */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-200">ورود مبلغ مورد نظر برای معامله طلا (تومان)</label>
              <span className="text-[10px] text-zinc-500">برنامه گرم طلا را محاسبه می‌کند</span>
            </div>
            <div className="relative">
              <input 
                type="text"
                inputMode="numeric"
                value={formatTomanAmount(mAmountToman)}
                onChange={(e) => setMAmountToman(parseCleanNumber(e.target.value))}
                placeholder="مثلاً: ۵۰,۰۰۰,۰۰۰ تومان..."
                className="w-full h-12 pl-16 pr-4 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xl font-black text-[#ffd700] font-mono text-center focus:border-[#d4af37] outline-none"
              />
              <span className="absolute left-3 top-3 text-xs font-bold text-zinc-400">تومان</span>
            </div>

            {/* Quick Amount Step Buttons */}
            <div className="flex gap-1.5 overflow-x-auto pt-1 text-[10px]">
              <button 
                type="button"
                onClick={() => setMAmountToman((mAmountToman || 0) + 10000000)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-mono"
              >
                +۱۰ میلیون
              </button>
              <button 
                type="button"
                onClick={() => setMAmountToman((mAmountToman || 0) + 50000000)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-mono"
              >
                +۵۰ میلیون
              </button>
              <button 
                type="button"
                onClick={() => setMAmountToman((mAmountToman || 0) + 100000000)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-mono"
              >
                +۱۰۰ میلیون
              </button>
              <button 
                type="button"
                onClick={() => setMAmountToman(0)}
                className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-500"
              >
                صفر
              </button>
            </div>
          </div>

          {/* Fee Mode (Deduct or Add) & Fee Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            
            {/* Fee Direction: Deduct from Amount or Add to Amount */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-200 block">نحوه اعمال کارمزد معامله</span>
              <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMFeeMode('deduct')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all text-center ${
                    mFeeMode === 'deduct' 
                      ? 'bg-[#d4af37] text-black shadow' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  کسر از مبلغ (خالصی طلا)
                </button>
                <button
                  type="button"
                  onClick={() => setMFeeMode('add')}
                  className={`py-2 px-2 rounded-lg font-bold transition-all text-center ${
                    mFeeMode === 'add' 
                      ? 'bg-[#d4af37] text-black shadow' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  اضافه به مبلغ پرداختی
                </button>
              </div>
            </div>

            {/* Fee Type: Percentage or Fixed Per Gram */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-200">میزان کارمزد آبشده</span>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setMFeeType('percentage')}
                    className={`px-2 py-0.5 rounded font-bold ${mFeeType === 'percentage' ? 'bg-[#d4af37] text-black' : 'text-zinc-500'}`}
                  >
                    درصدی
                  </button>
                  <button
                    type="button"
                    onClick={() => setMFeeType('per_gram')}
                    className={`px-2 py-0.5 rounded font-bold ${mFeeType === 'per_gram' ? 'bg-[#d4af37] text-black' : 'text-zinc-500'}`}
                  >
                    پولی هر گرم
                  </button>
                </div>
              </div>

              {mFeeType === 'percentage' ? (
                <div className="relative">
                  <input 
                    type="number"
                    step="0.1"
                    value={mFeePercent || ''}
                    onChange={(e) => setMFeePercent(parseFloat(e.target.value) || 0)}
                    placeholder="درصد کارمزد..."
                    className="w-full h-10 pl-8 pr-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-mono">٪</span>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={formatTomanAmount(mFeePerGram)}
                    onChange={(e) => setMFeePerGram(parseCleanNumber(e.target.value))}
                    placeholder="تومان به ازای هر گرم..."
                    className="w-full h-10 pl-14 pr-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm font-bold text-white font-mono text-center focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-400">تومان/گرم</span>
                </div>
              )}
            </div>

          </div>

          {/* MELTED RESULT CARD */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 text-zinc-300">
              <span className="text-sm font-bold text-white">وزن طلای خالص محاسبه‌شده:</span>
              <span className="font-mono font-black text-xl text-emerald-400">{toPersianDigits(meltedResult.goldGrams)} گرم</span>
            </div>

            <div className="flex justify-between items-center py-1 text-zinc-300">
              <span>ارزش بهای طلای خام:</span>
              <span className="font-mono font-bold text-white">{formatTomanAmount(meltedResult.rawGoldValue)} تومان</span>
            </div>

            <div className="flex justify-between items-center py-1 text-zinc-300">
              <span>مبلغ کارمزد معامله:</span>
              <span className="font-mono font-bold text-white">{formatTomanAmount(meltedResult.feeAmount)} تومان</span>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between bg-gradient-to-r from-[#d4af37]/15 to-transparent p-3 rounded-xl border border-[#d4af37]/30">
              <span className="text-xs font-black text-[#d4af37]">مبلغ کل نهایی معامله:</span>
              <span className="text-2xl font-black text-[#ffd700] font-mono">
                {formatTomanAmount(meltedResult.finalPayable)} <span className="text-xs font-normal text-zinc-300">تومان</span>
              </span>
            </div>
          </div>

          {/* Buttons: Save, Preview, Copy, PNG */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => openSaveInvoiceModal('melted', `طلای آب‌شده ۱۸ عیار (${meltedResult.goldGrams} گرم)`)}
              className="h-11 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ثبت فاکتور آبشده</span>
            </button>

            <button
              onClick={() => handleOpenPreview('melted')}
              className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#ffd700] border border-[#d4af37]/40 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#ffd700]" />
              <span>پیش‌نمایش فاکتور</span>
            </button>

            <button
              onClick={() => handleCopyInvoice('melted')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>کپی متن رسید</span>
            </button>

            <button
              onClick={() => handleExportCurrentPNG('melted')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span>خروجی PNG</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: RECORD SALE / CUSTOMER INFO (OPTIONAL) ----------------- */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#141418] max-w-sm w-full rounded-3xl p-5 border border-zinc-800 shadow-2xl space-y-4 text-xs">
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#d4af37]" />
                <span>ثبت فاکتور در دفترچه فروش</span>
              </h3>
              <button 
                onClick={() => setShowSaveModal(false)} 
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              مشخصات مشتری اختیاری است. می‌توانید با زدن <strong>«رد کردن و ثبت»</strong> بدون اتلاف وقت فوراً فاکتور را ثبت کنید:
            </p>

            <div className="grid grid-cols-2 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setSaleType('sell')}
                className={`py-1.5 rounded-lg font-bold transition-colors ${
                  saleType === 'sell' ? 'bg-[#d4af37] text-black' : 'text-zinc-400'
                }`}
              >
                فروش به مشتری
              </button>
              <button
                type="button"
                onClick={() => setSaleType('buy')}
                className={`py-1.5 rounded-lg font-bold transition-colors ${
                  saleType === 'buy' ? 'bg-[#d4af37] text-black' : 'text-zinc-400'
                }`}
              >
                خرید از مشتری
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] text-zinc-300 block mb-1 font-bold">نوع و نام کالا</label>
                <input 
                  type="text"
                  value={itemTitleInput}
                  onChange={(e) => setItemTitleInput(e.target.value)}
                  placeholder="شرح کالا..."
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Optional Contact Selector from Subsidiary Ledger */}
              {accounts && accounts.length > 0 && (
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 space-y-2 text-right">
                  <label className="text-[11px] text-zinc-300 font-bold block">👤 انتخاب طرف حساب معین اشخاص (اختیاری):</label>
                  
                  <div className="relative">
                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setShowContactDropdown(!showContactDropdown)}
                      className="w-full h-10 px-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl text-white text-xs flex items-center justify-between outline-none focus:border-[#d4af37] transition-all cursor-pointer relative z-10"
                    >
                      <span className="truncate">
                        {selectedContactId 
                          ? (() => {
                              const contact = accounts.find(a => a.id === selectedContactId);
                              return contact 
                                ? `${contact.name} ${contact.shopName ? `(${contact.shopName})` : ''} · ${contact.accountCode}`
                                : 'انتخاب شده'
                            })()
                          : '-- مشتری آزاد / نقدی حضوری --'
                        }
                      </span>
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>

                    {/* Overlay Backdrop for click-outs */}
                    {showContactDropdown && (
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setShowContactDropdown(false)} 
                      />
                    )}

                    {/* Searchable Dropdown List */}
                    {showContactDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 p-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl space-y-2 max-h-64 flex flex-col text-right">
                        {/* Search Bar */}
                        <div className="relative shrink-0">
                          <input
                            type="text"
                            placeholder="جستجوی نام، تلفن یا کد حساب..."
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="w-full h-9 pl-3 pr-8 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-[#d4af37] text-right"
                            autoFocus
                          />
                          <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-3" />
                        </div>

                        {/* Options Scroll Container */}
                        <div className="overflow-y-auto max-h-40 divide-y divide-zinc-800/60 custom-scrollbar pr-1 space-y-0.5">
                          {/* Option: Free Customer */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedContactId('');
                              setCustName('');
                              setCustPhone('');
                              setContactSearchQuery('');
                              setShowContactDropdown(false);
                            }}
                            className={`w-full text-right px-2.5 py-2 text-[11px] rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                              !selectedContactId ? 'bg-zinc-800/70 text-[#ffd700] font-bold' : 'text-zinc-300 hover:bg-zinc-800/40'
                            }`}
                          >
                            <span>-- مشتری آزاد / نقدی حضوری --</span>
                            {!selectedContactId && <Check className="w-3.5 h-3.5 text-[#ffd700]" />}
                          </button>

                          {/* Filtered List */}
                          {(() => {
                            const query = contactSearchQuery.trim().toLowerCase();
                            const filtered = accounts.filter(acc => {
                              if (!query) return true;
                              return (
                                acc.name.toLowerCase().includes(query) ||
                                (acc.phone && acc.phone.toLowerCase().includes(query)) ||
                                (acc.shopName && acc.shopName.toLowerCase().includes(query)) ||
                                (acc.accountCode && acc.accountCode.toLowerCase().includes(query))
                              );
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="py-4 text-center text-[10px] text-zinc-500 font-bold">
                                  نتیجه‌ای یافت نشد 🔍
                                </div>
                              );
                            }

                            return filtered.map(acc => {
                              const isSelected = selectedContactId === acc.id;
                              return (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedContactId(acc.id);
                                    setCustName(acc.name);
                                    setCustPhone(acc.phone || '');
                                    setContactSearchQuery('');
                                    setShowContactDropdown(false);
                                  }}
                                  className={`w-full text-right px-2.5 py-2 text-[11px] rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                                    isSelected ? 'bg-[#d4af37]/20 text-[#ffd700] font-bold border border-[#d4af37]/20' : 'text-zinc-300 hover:bg-zinc-800/40'
                                  }`}
                                >
                                  <div className="flex flex-col gap-0.5 text-right">
                                    <span className="font-bold">{acc.name} {acc.shopName ? `(${acc.shopName})` : ''}</span>
                                    <span className="text-[9px] text-zinc-400 font-mono">
                                      کد حساب: {acc.accountCode} {acc.phone ? ` · همراه: ${acc.phone}` : ''}
                                    </span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-[#ffd700]" />}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedContactId && (
                    <div className="space-y-1.5 pt-1 text-[10px] text-zinc-400">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoPostToLedger}
                          onChange={(e) => setAutoPostToLedger(e.target.checked)}
                          className="accent-[#d4af37] rounded"
                        />
                        <span>ثبت اتوماتیک سند فروش/خرید در دفتر معین</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={instantCashSettle}
                          onChange={(e) => setInstantCashSettle(e.target.checked)}
                          className="accent-[#d4af37] rounded"
                        />
                        <span>تسویه نقدی فوری ریالی (بدون ایجاد بدهی)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[11px] text-zinc-300 block mb-1">نام مشتری (اختیاری)</label>
                <input 
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="اختیاری..."
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-300 block mb-1">شماره تماس مشتری (اختیاری)</label>
                <input 
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="۰۹۱۲..."
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-left outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmSaveInvoice}
                className="flex-1 h-11 rounded-xl bg-[#d4af37] text-black font-black text-xs shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأیید و ذخیره فاکتور</span>
              </button>

              <button
                type="button"
                onClick={handleSkipSaveInvoice}
                className="px-3 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold cursor-pointer transition-colors"
                title="ذخیره بدون پر کردن نام و مشخصات مشتری"
              >
                رد کردن و ثبت سریع
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSaveModal(false);
                handleOpenPreview(invoiceTypeToSave);
              }}
              className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#ffd700] border border-[#d4af37]/40 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#ffd700]" />
              <span>مشاهده پیش‌نمایش فاکتور قبل از ثبت</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: COMPREHENSIVE INVOICE PREVIEW ----------------- */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#18181b] max-w-xl w-full rounded-3xl border border-[#d4af37]/40 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-xs sm:text-sm font-black text-white">پیش‌نمایش زنده فاکتور الکترونیک و امنیتی طلا</h3>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* INVOICE VISUAL PAPER SHEET */}
            <div className="p-3 sm:p-5 max-h-[70vh] overflow-y-auto space-y-4">
              
              <div className="bg-[#fdfbf7] text-[#1c1917] p-4 sm:p-6 rounded-2xl border-2 border-[#d4af37] shadow-xl relative overflow-hidden text-xs select-none">
                
                {/* Center Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-25deg]">
                  <span className="text-4xl sm:text-6xl font-black text-[#b89320] whitespace-nowrap">
                    {store.watermarkText || store.name}
                  </span>
                </div>

                {/* 1. Header & Branding */}
                <div className="text-center relative z-10 space-y-1 pb-3 border-b-2 border-[#d4af37]/40">
                  <div className="w-11 h-11 rounded-2xl border border-[#d4af37]/40 overflow-hidden mx-auto mb-1.5 shadow-sm bg-white flex items-center justify-center p-0.5">
                    <img 
                      src={store.logo || '/assets/app-icon.svg'} 
                      alt={store.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/app-icon.svg';
                      }}
                    />
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-[#1c1917]">{store.name}</h1>
                  {store.ownerName && (
                    <p className="text-[11px] text-[#78716c] font-bold">با مدیریت: {store.ownerName}</p>
                  )}
                  <p className="text-[11px] font-bold text-[#b89320]">فاکتور رسمی و شناسنامه فروش طلا و مسکوکات</p>
                </div>

                {/* 2. Invoice Meta Bar */}
                <div className="my-2.5 bg-[#d4af37]/10 p-2 sm:p-2.5 rounded-xl border border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold text-[#292524] relative z-10">
                  <span>شماره فاکتور: <strong className="font-mono text-black">#{toPersianDigits(previewInvoice.invoiceNumber)}</strong></span>
                  <span>تاریخ: <strong className="font-mono">{previewInvoice.dateFa}</strong> - ساعت <strong className="font-mono">{previewInvoice.timeFa}</strong></span>
                  <span>نرخ ۱۸: <strong className="font-mono text-[#854d0e]">{formatTomanAmount(previewInvoice.goldPrice)} ت</strong></span>
                </div>

                {/* 3. Customer Info */}
                <div className="my-2 p-2.5 bg-white rounded-xl border border-[#e7e5e4] flex justify-between items-center text-[11px] relative z-10">
                  <div>
                    <span className="text-[#78716c] font-medium">خریدار محترم: </span>
                    <strong className="text-[#1c1917]">
                      {previewInvoice.customerName?.trim() || '................................................'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#78716c] font-medium">شماره تماس: </span>
                    <strong className="font-mono text-[#1c1917]">
                      {previewInvoice.customerPhone ? toPersianDigits(previewInvoice.customerPhone) : '................................'}
                    </strong>
                  </div>
                </div>

                {/* 4. Table */}
                <div className="my-2.5 rounded-xl border border-[#d6d3d1] overflow-hidden relative z-10">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-[#1c1917] text-[#ffd700] text-[10px] sm:text-[11px]">
                      <tr>
                        <th className="p-2 font-bold">شرح کالا</th>
                        <th className="p-2 font-bold text-center">وزن (گرم)</th>
                        <th className="p-2 font-bold text-center">عیار</th>
                        <th className="p-2 font-bold text-left">ارزش طلا خام</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-200">
                      <tr>
                        <td className="p-2 font-bold text-[#1c1917]">{previewInvoice.itemTitle}</td>
                        <td className="p-2 text-center font-mono font-bold text-[#1c1917]">{toPersianDigits(previewInvoice.weight)} g</td>
                        <td className="p-2 text-center font-mono font-bold text-[#1c1917]">{toPersianDigits(previewInvoice.karat || '۱۸')}</td>
                        <td className="p-2 text-left font-mono font-bold text-[#1c1917]">{formatTomanAmount(previewInvoice.rawGoldAmount)} ت</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Breakdown */}
                <div className="my-2.5 p-3 bg-white rounded-xl border border-[#e7e5e4] space-y-1.5 text-[11px] text-[#44403c] relative z-10">
                  <div className="flex justify-between items-center">
                    <span>اجرت ساخت کارگاه:</span>
                    <span className="font-mono font-bold text-[#854d0e]">{formatTomanAmount(previewInvoice.feeAmount)} تومان</span>
                  </div>

                  {previewInvoice.profitAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span>سود قانونی طلافروش ({toPersianDigits(previewInvoice.profitPercent || 7)}٪):</span>
                      <span className="font-mono font-bold">{formatTomanAmount(previewInvoice.profitAmount)} تومان</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>مالیات ارزش‌افزوده ({previewInvoice.taxAmount > 0 ? `${toPersianDigits(previewInvoice.taxPercent || 9)}٪` : 'معاف'}):</span>
                    <span className="font-mono font-bold">
                      {previewInvoice.taxAmount > 0 ? `${formatTomanAmount(previewInvoice.taxAmount)} تومان` : 'معاف / عدم احتساب'}
                    </span>
                  </div>

                  {previewInvoice.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-red-600 font-bold">
                      <span>تخفیف ویژه فروشگاه:</span>
                      <span className="font-mono">-{formatTomanAmount(previewInvoice.discountAmount)} تومان</span>
                    </div>
                  )}
                </div>

                {/* 6. Total Hero Box */}
                <div className="my-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-[#1c1917] to-[#0c0a09] border-2 border-[#d4af37] text-white flex items-center justify-between relative z-10">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-[#d4af37] block">مبلغ کل قابل پرداخت:</span>
                    <span className="text-[10px] text-zinc-400">تسویه نهایی و رسمی</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-xl sm:text-2xl font-black text-[#ffd700]">
                      {formatTomanAmount(previewInvoice.totalAmount)}
                    </span>
                    <span className="text-xs text-zinc-300 mr-1.5 font-sans">تومان</span>
                  </div>
                </div>

                {/* 7. Guarantee & Security Elements */}
                <div className="my-2 pt-2 border-t border-[#d4af37]/30 text-[10px] text-[#78716c] leading-relaxed relative z-10">
                  <p>تعهدنامه اصالت: کلیه اقلام این فاکتور با عیار استاندارد ۷۵۰ (۱۸ عیار) طبق موازین اتحادیه صادر شده است.</p>
                  
                  {/* Barcode, Hologram & Stamp Row */}
                  <div className="mt-3 grid grid-cols-3 items-center gap-2 text-center pt-2 border-t border-zinc-200">
                    
                    {/* Security Barcode */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-0.5 h-7">
                        <div className="w-1 h-full bg-zinc-900" />
                        <div className="w-0.5 h-full bg-zinc-900" />
                        <div className="w-1.5 h-full bg-zinc-900" />
                        <div className="w-0.5 h-full bg-zinc-900" />
                        <div className="w-2 h-full bg-zinc-900" />
                        <div className="w-0.5 h-full bg-zinc-900" />
                        <div className="w-1 h-full bg-zinc-900" />
                        <div className="w-1.5 h-full bg-zinc-900" />
                        <div className="w-0.5 h-full bg-zinc-900" />
                        <div className="w-1 h-full bg-zinc-900" />
                        <div className="w-2 h-full bg-zinc-900" />
                        <div className="w-0.5 h-full bg-zinc-900" />
                        <div className="w-1 h-full bg-zinc-900" />
                      </div>
                      <span className="font-mono text-[9px] font-bold text-zinc-700 mt-1">
                        IR-GOLD-{previewInvoice.invoiceNumber}
                      </span>
                    </div>

                    {/* Official Stamp & Signature */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="border border-dashed border-red-500 rounded-lg p-1.5 text-red-600 rotate-[-3deg] bg-red-500/5">
                        <span className="text-[10px] font-bold block">{store.stamp || store.name}</span>
                        <span className="text-[8px] block opacity-80">تایید و تسویه شد</span>
                      </div>
                      <span className="text-[9px] text-[#44403c] mt-1 font-bold">
                        {store.signature || 'امضاء فروشنده'}
                      </span>
                    </div>

                    {/* Security Hologram */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#b8860b] via-[#ffd700] to-[#8b6914] p-0.5 shadow-md flex items-center justify-center relative">
                        <div className="w-11 h-11 rounded-full border border-dashed border-white/80 flex flex-col items-center justify-center text-center leading-none text-[#3a2802]">
                          <span className="text-[7px] font-black">ضمانت اصالت</span>
                          <span className="text-[9px] font-black my-0.5">★ ۷۵۰ ★</span>
                          <span className="text-[6px] font-bold">هولوگرام</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-[#854d0e] mt-1">شناسنامه امنیتی</span>
                    </div>

                  </div>
                </div>

                {/* 8. Footer Contact */}
                <div className="mt-3 pt-2 border-t border-[#d4af37]/30 text-center text-[10px] text-[#57534e] space-y-0.5 relative z-10">
                  <p className="font-bold">
                    {[
                      store.phone ? `تلفن: ${toPersianDigits(store.phone)}` : '',
                      store.postalCode ? `کد پستی: ${toPersianDigits(store.postalCode)}` : '',
                      store.instagram ? `اینستاگرام: @${store.instagram}` : '',
                      store.address ? `نشانی: ${store.address}` : ''
                    ].filter(Boolean).join('  ·  ')}
                  </p>
                </div>

              </div>

            </div>

            {/* ACTION TOOLBAR: WHATSAPP, TELEGRAM, RUBIKA, SMS, PNG, COPY */}
            <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
              
              {/* PRIMARY ACTION: LIVE PRINT PREVIEW & PRINT */}
              <button
                type="button"
                onClick={() => {
                  setShowPrintPreview(true);
                }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-yellow-500 via-[#d4af37] to-amber-500 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/10 hover:shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-4.5 h-4.5 text-black stroke-[2.5]" />
                <span>🖨️ مشاهده پیش‌نمایش چاپی و چاپ فاکتور رسمی (پرینت A5)</span>
              </button>

              <div className="border-t border-zinc-900 my-1" />
              
              <span className="text-[11px] font-bold text-zinc-400 block mb-1">گزینه‌های اشتراک‌گذاری و صدور:</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* 1. Download PDF */}
                <button
                  type="button"
                  onClick={() => {
                    downloadInvoicePDF(previewInvoice, store);
                    showNotification('فایل رسمی PDF فاکتور با موفقیت دانلود شد', 'success');
                  }}
                  className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-[#d4af37] text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>دانلود PDF رسمی</span>
                </button>

                {/* 1.2. Download PNG */}
                <button
                  type="button"
                  onClick={() => {
                    downloadInvoicePNG(previewInvoice, store);
                    showNotification('فایل تصویری PNG فاکتور با موفقیت دانلود شد', 'success');
                  }}
                  className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#ffd700] border border-[#d4af37]/40 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#ffd700]" />
                  <span>دانلود عکس PNG</span>
                </button>

                {/* 2. WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(previewInvoice)}
                  className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  title="ارسال مستقیم به شماره مشتری در واتساپ"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>واتساپ (WhatsApp)</span>
                </button>

                {/* 3. Telegram */}
                <button
                  type="button"
                  onClick={() => handleShareTelegram(previewInvoice)}
                  className="h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>تلگرام (Telegram)</span>
                </button>

                {/* 4. Rubika */}
                <button
                  type="button"
                  onClick={() => handleShareRubika(previewInvoice)}
                  className="h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  title="ارسال تصویر فاکتور در روبیکا"
                >
                  <Share2 className="w-4 h-4" />
                  <span>روبیکا (Rubika)</span>
                </button>
              </div>

              {/* Secondary Row: SMS, Copy, Close */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSendSMS(previewInvoice)}
                  className="h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="ارسال خودکار پیامک متنی فاکتور به شماره تلفن مشتری"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>ارسال پیامک SMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyInvoice(previewInvoice.type)}
                  className="h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>کپی متن فاکتور</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  بستن پیش‌نمایش
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ----------------- CUSTOM PRINT PREVIEW MODAL & HIDDEN PRINT CONTAINER ----------------- */}
      {showPrintPreview && previewInvoice && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200" dir="rtl">
            
            {/* 1. Preview Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-850">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-xs sm:text-sm font-black text-white">پیش‌نمایش زنده صفحه چاپی (اندازه A5 استاندارد)</h3>
              </div>
              <button 
                onClick={() => setShowPrintPreview(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Paper Simulator Scrolling Box */}
            <div className="p-4 overflow-y-auto bg-zinc-950/60 flex-1 flex justify-center custom-scrollbar">
              
              {/* Virtual Paper Sheet */}
              <div className="bg-white text-black p-4 sm:p-6 w-full max-w-[450px] shadow-2xl border border-zinc-200 rounded-none relative text-[8.5px] leading-relaxed space-y-3.5 select-none" style={{ aspectRatio: '1/1.414' }}>
                
                {/* Center Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-25deg]">
                  <span className="text-3xl sm:text-5xl font-black text-zinc-500 whitespace-nowrap">
                    {store.watermarkText || store.name}
                  </span>
                </div>

                {/* 1. Print Header */}
                <div className="flex items-start justify-between border-b border-black pb-2 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 border border-black p-0.5 bg-white shrink-0 flex items-center justify-center">
                      <img 
                        src={store.logo || '/assets/app-icon.svg'} 
                        alt={store.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/app-icon.svg';
                        }}
                      />
                    </div>
                    <div className="space-y-0.5 text-right">
                      <h4 className="text-[11px] font-black text-black leading-none">{store.name}</h4>
                      <p className="text-[7.5px] text-zinc-800 font-bold">مدیریت: {store.ownerName || 'خلیلی'}</p>
                    </div>
                  </div>

                  {(store.invoicePrintSettings?.showQR ?? true) && (
                    <div className="flex flex-col items-center justify-center border border-black p-0.5 bg-white shrink-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                          `سند مالی فاکتور فروش\nگالری: ${store.name}\nشماره: ${previewInvoice.invoiceNumber}\nمشتری: ${previewInvoice.customerName || 'حضورى'}\nکالا: ${previewInvoice.itemTitle}\nوزن: ${(previewInvoice.weight || 0).toFixed(3)} گرم\nمبلغ: ${previewInvoice.totalAmount.toLocaleString('fa-IR')} تومان`
                        )}&color=000000&bgcolor=ffffff`}
                        alt="Verification QR"
                        className="w-8 h-8"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[5px] font-bold text-black mt-0.5">اصالت‌سنجی</span>
                    </div>
                  )}

                  <div className="text-left space-y-0.5 font-mono text-[7px] text-black">
                    <div className="bg-zinc-100 px-1 py-0.5 text-center text-black font-black text-[8px] mb-1 border border-black">
                      فاکتور فروش طلا
                    </div>
                    <div className="flex justify-between gap-1">
                      <span>شماره:</span>
                      <strong className="font-bold">#{toPersianDigits(previewInvoice.invoiceNumber)}</strong>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span>تاریخ:</span>
                      <strong className="font-bold">{previewInvoice.dateFa}</strong>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span>ساعت:</span>
                      <strong className="font-bold">{previewInvoice.timeFa}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Customer Info Row */}
                <div className="border border-black overflow-hidden text-[7.5px] bg-white relative z-10">
                  <div className="grid grid-cols-2 bg-zinc-100 border-b border-black font-bold text-center">
                    <div className="p-0.5 border-l border-black text-right pr-1">مشخصات طرف معامله</div>
                    <div className="p-0.5 text-right pr-1">مشخصات گالری صادرکننده</div>
                  </div>
                  <div className="grid grid-cols-2 text-black">
                    <div className="p-1 border-l border-black space-y-0.5 text-right">
                      <div>نام مشتری: <strong className="font-black">{previewInvoice.customerName || 'مشتری حضوری'}</strong></div>
                      <div>تلفن همراه: <strong className="font-mono">{previewInvoice.customerPhone ? toPersianDigits(previewInvoice.customerPhone) : 'ثبت نشده'}</strong></div>
                      <div>کد ملی خریدار: <span className="text-zinc-400">..............................</span></div>
                    </div>
                    <div className="p-1 space-y-0.5 text-right">
                      <div>گالری: <strong>{store.name}</strong></div>
                      <div>تلفن: <strong className="font-mono">{store.phone}</strong></div>
                      <div className="truncate">نشانی: {store.address || 'بازار طلا'}</div>
                    </div>
                  </div>
                </div>

                {/* 3. Specifications Table */}
                <div className="border border-black overflow-hidden bg-white relative z-10">
                  <table className="w-full text-right text-[7px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-black font-black text-center text-black">
                        <th className="p-0.5 border-l border-black w-5">ردیف</th>
                        <th className="p-0.5 border-l border-black text-right pr-1">شرح مصنوعات طلا و جواهر</th>
                        <th className="p-0.5 border-l border-black w-12 text-center">وزن (گرم)</th>
                        <th className="p-0.5 border-l border-black w-8 text-center">عیار</th>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <th className="p-0.5 border-l border-black w-14 text-center">نرخ (تومان)</th>}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <th className="p-0.5 border-l border-black w-16 text-center">ارزش خام (ت)</th>}
                        {(store.invoicePrintSettings?.showFee ?? true) && <th className="p-0.5 border-l border-black w-10 text-center">اجرت</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black text-center text-black font-medium">
                        <td className="p-1 border-l border-black">۱</td>
                        <td className="p-1 border-l border-black text-right pr-1 font-bold">{previewInvoice.itemTitle}</td>
                        <td className="p-1 border-l border-black font-mono">{toPersianDigits(previewInvoice.weight.toFixed(3))}</td>
                        <td className="p-1 border-l border-black">{previewInvoice.karat || '۱۸ (۷۵۰)'}</td>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-1 border-l border-black font-mono">{previewInvoice.goldPrice.toLocaleString('fa-IR')}</td>}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-1 border-l border-black font-mono">{previewInvoice.rawGoldAmount.toLocaleString('fa-IR')}</td>}
                        {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-1 border-l border-black font-mono">{previewInvoice.feeAmount.toLocaleString('fa-IR')}</td>}
                      </tr>
                      <tr className="text-center text-zinc-400">
                        <td className="p-0.5 border-l border-black font-mono">۲</td>
                        <td className="p-0.5 border-l border-black text-right pr-1">-</td>
                        <td className="p-0.5 border-l border-black font-sans">-</td>
                        <td className="p-0.5 border-l border-black font-sans">-</td>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                        {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Financial Breakdown Row */}
                <div className="grid grid-cols-2 gap-2 text-[7.5px] relative z-10">
                  {/* Left Column: QR and official details */}
                  <div className="border border-black p-1 space-y-0.5 bg-zinc-50 flex flex-col justify-center text-right pr-1.5 text-[6.5px]">
                    <span className="font-bold text-black">سامانه حسابداری زرسا</span>
                    <span className="truncate">شناسه فاکتور: {previewInvoice.id}</span>
                    <span>ثبت همزمان در معین اشخاص همکار: بله ✓</span>
                  </div>

                  {/* Right Column: Financial details */}
                  <div className="border border-black p-1 space-y-1 bg-white font-mono text-left pl-1.5">
                    <div className="flex justify-between gap-1 text-black font-sans text-[7px] font-bold">
                      <span className="font-sans">مبلغ کل محاسبه‌شده:</span>
                      <strong>{previewInvoice.totalAmount.toLocaleString('fa-IR')} تومان</strong>
                    </div>
                    <div className="flex justify-between gap-1 text-[6.5px] text-zinc-500">
                      <span className="font-sans">تخفیف / کسورات توافقی:</span>
                      <span>{(previewInvoice.discountAmount || 0).toLocaleString('fa-IR')} ت</span>
                    </div>
                    <div className="flex justify-between gap-1 text-[7px] font-bold text-red-600 border-t border-black/10 pt-1">
                      <span className="font-sans">مبلغ نهایی تسویه شده:</span>
                      <strong>{previewInvoice.totalAmount.toLocaleString('fa-IR')} ت</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Terms, Stamps & Signatures */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-[7px] relative z-10">
                  {/* Store Stamp Box */}
                  {(store.invoicePrintSettings?.showStamp ?? true) ? (
                    <div className="flex flex-col items-center justify-between min-h-[65px] border border-black p-1 text-center bg-white relative">
                      <span className="font-bold text-black leading-none">مهر و امضای فروشگاه</span>
                      <div className="border border-dashed border-red-500/60 p-1 text-center w-full my-0.5 rounded text-red-600 rotate-[-3deg] bg-red-500/5 leading-none">
                        <span className="text-[7.5px] font-black block">{store.name}</span>
                        <span className="text-[6px] block opacity-80 mt-0.5">تایید و تسویه شد</span>
                      </div>
                      <span className="text-[6.5px] text-zinc-600 font-mono leading-none">{store.signature || 'مدیریت گالری'}</span>
                    </div>
                  ) : (
                    <div className="min-h-[65px] border border-transparent" />
                  )}

                  {/* Customer Sign Box */}
                  {(store.invoicePrintSettings?.showFingerprint ?? true) ? (
                    <div className="flex flex-col items-center justify-between min-h-[65px] border border-black p-1 text-center bg-white">
                      <span className="font-bold text-black">امضاء و اثر انگشت</span>
                      <p className="text-[5.5px] text-zinc-500 leading-tight px-0.5 text-justify">
                        بدینوسیله صحت مصنوعات جدول فوق تسلیم خریدار گردید و اصالت آن مورد تایید است.
                      </p>
                      <div className="w-6 h-6 rounded border border-zinc-300 border-dashed flex items-center justify-center text-[5px] text-zinc-400 bg-zinc-50/20 leading-none">
                        اثر انگشت
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[65px] border border-transparent" />
                  )}

                  {/* Rules Box */}
                  {(store.invoicePrintSettings?.showTerms ?? true) ? (
                    <div className="border border-black p-1 rounded-none text-right text-[5.8px] text-zinc-700 space-y-0.5 bg-white leading-tight pr-1">
                      <span className="font-bold text-black block border-b border-black pb-0.5 mb-1 text-center">مقررات قانونی</span>
                      <p>۱. ارائه این فاکتور رسمی جهت مبادلات بعدی طلا الزامیست.</p>
                      <p>۲. عیار کلیه مصنوعات طلا ۱۸ عیار (۷۵۰) تضمین می‌شود.</p>
                      <p>۳. سند مجهز به بارکد رهگیری حسابداری زرسا است.</p>
                    </div>
                  ) : (
                    <div className="min-h-[65px] border border-transparent" />
                  )}
                </div>

                {/* 6. Contact Footer */}
                <div className="border-t border-black pt-1.5 text-center text-[7px] text-black space-y-0.5 font-sans leading-none relative z-10">
                  <p className="font-bold">
                    نشانی: {store.address} · تلفن تماس: {store.phone}
                  </p>
                  <p className="text-[6px] text-zinc-500 font-mono leading-none pt-0.5">
                    شناسه حسابداری زرسا: IR-GOLD-{previewInvoice.invoiceNumber}
                  </p>
                </div>

              </div>

            </div>

            {/* 3. Preview Footer Toolbar */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-850 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPrintPreview(false);
                  setTimeout(() => {
                    window.print();
                  }, 250);
                }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-[#d4af37] text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ تایید و ارسال به پرینتر (Print)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadInvoicePDF(previewInvoice, store);
                  showNotification('فایل رسمی PDF فاکتور دانلود شد', 'success');
                }}
                className="px-4 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-[#ffd700] border border-[#d4af37]/30 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-[#ffd700]" />
                <span>دانلود PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="px-4 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN PORTRAIT A5 PRINT COMPONENT: RENDERED FOR PRINT MEDIA ONLY */}
      {/* ========================================================================= */}
      {previewInvoice && (
        <div id="invoice-print-container" className="print-visible text-black bg-white" dir="rtl">
          <div className="relative z-10 space-y-3.5">
            
            {/* 1. PRINT HEADER */}
            <div className="flex items-start justify-between border-b-2 border-black pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 border border-black p-0.5 bg-white shrink-0 flex items-center justify-center">
                  <img 
                    src={store.logo || '/assets/app-icon.svg'} 
                    alt={store.name} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/app-icon.svg';
                    }}
                  />
                </div>
                <div className="space-y-0.5 text-right">
                  <h2 className="text-sm font-black font-sans text-black">{store.name}</h2>
                  <p className="text-[8.5px] text-zinc-800 font-bold leading-none">مدیریت گالری: {store.ownerName || 'خلیلی'}</p>
                  <p className="text-[7.5px] text-zinc-500">اتوماسیون صدور اسناد طلا و مسکوک زرسا</p>
                </div>
              </div>

              {(store.invoicePrintSettings?.showQR ?? true) && (
                <div className="flex flex-col items-center justify-center border border-black p-0.5 bg-white shrink-0">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                      `سند مالی فاکتور فروش\nگالری: ${store.name}\nشماره: ${previewInvoice.invoiceNumber}\nمشتری: ${previewInvoice.customerName || 'حضورى'}\nکالا: ${previewInvoice.itemTitle}\nوزن: ${(previewInvoice.weight || 0).toFixed(3)} گرم\nمبلغ: ${previewInvoice.totalAmount.toLocaleString('fa-IR')} تومان`
                    )}&color=000000&bgcolor=ffffff`}
                    alt="Verification QR"
                    className="w-8 h-8"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[5px] font-bold text-black mt-0.5">اصالت‌سنجی</span>
                </div>
              )}

              <div className="text-left space-y-0.5 font-mono text-[8px] text-black">
                <div className="bg-zinc-100 px-1 py-0.5 text-center text-black font-black text-[9px] mb-1.5 border border-black">
                  فاکتور فروش طلا
                </div>
                <div className="flex justify-between gap-1">
                  <span>شماره فاکتور:</span>
                  <strong className="font-bold">#{toPersianDigits(previewInvoice.invoiceNumber)}</strong>
                </div>
                <div className="flex justify-between gap-1">
                  <span>تاریخ صدور:</span>
                  <strong className="font-bold">{previewInvoice.dateFa}</strong>
                </div>
                <div className="flex justify-between gap-1">
                  <span>ساعت صدور:</span>
                  <strong className="font-bold">{previewInvoice.timeFa}</strong>
                </div>
              </div>
            </div>

            {/* 2. CUSTOMER INFO ROW */}
            <div className="border-2 border-black overflow-hidden text-[8.5px] bg-white">
              <div className="grid grid-cols-2 bg-zinc-100 border-b-2 border-black font-bold text-center">
                <div className="p-1 border-l-2 border-black text-right pr-2">مشخصات خریدار</div>
                <div className="p-1 text-right pr-2">مشخصات فروشنده</div>
              </div>
              <div className="grid grid-cols-2 text-black">
                <div className="p-1.5 border-l-2 border-black space-y-1 text-right">
                  <div>نام مشتری: <strong className="font-black text-[9.5px]">{previewInvoice.customerName || 'مشتری حضوری'}</strong></div>
                  <div>تلفن همراه: <strong className="font-mono">{previewInvoice.customerPhone ? toPersianDigits(previewInvoice.customerPhone) : 'ثبت نشده'}</strong></div>
                  <div>کد ملی خریدار: <span className="text-zinc-400">.............................................</span></div>
                </div>
                <div className="p-1.5 space-y-1 text-right">
                  <div>نام واحد تجاری: <strong className="text-[9.5px]">{store.name}</strong></div>
                  <div>تلفن تماس: <strong className="font-mono">{store.phone}</strong></div>
                  <div>نشانی گالری: {store.address || 'بازار طلا'}</div>
                </div>
              </div>
            </div>

            {/* 3. SPECIFICATIONS TABLE */}
            <div className="border-2 border-black overflow-hidden bg-white">
              <table className="w-full text-right text-[8px] border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b-2 border-black font-black text-center text-black text-[8.5px]">
                    <th className="p-1 border-l-2 border-black w-6">ردیف</th>
                    <th className="p-1 border-l-2 border-black text-right pr-2">شرح مصنوعات طلا و جواهر / مسکوکات</th>
                    <th className="p-1 border-l-2 border-black w-16 text-center">وزن (گرم)</th>
                    <th className="p-1 border-l-2 border-black w-10 text-center">عیار</th>
                    {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <th className="p-1 border-l-2 border-black w-18 text-center">نرخ (تومان)</th>}
                    {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <th className="p-1 border-l-2 border-black w-20 text-center">ارزش طلا (ت)</th>}
                    {(store.invoicePrintSettings?.showFee ?? true) && <th className="p-1 border-l-2 border-black w-12 text-center">اجرت</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b-2 border-black text-center text-black font-bold text-[8.5px]">
                    <td className="p-1.5 border-l-2 border-black">۱</td>
                    <td className="p-1.5 border-l-2 border-black text-right pr-2 font-black">{previewInvoice.itemTitle}</td>
                    <td className="p-1.5 border-l-2 border-black font-mono text-[9px]">{toPersianDigits(previewInvoice.weight.toFixed(3))}</td>
                    <td className="p-1.5 border-l-2 border-black">{previewInvoice.karat || '۱۸ (۷۵۰)'}</td>
                    {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-1.5 border-l-2 border-black font-mono">{previewInvoice.goldPrice.toLocaleString('fa-IR')}</td>}
                    {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-1.5 border-l-2 border-black font-mono">{previewInvoice.rawGoldAmount.toLocaleString('fa-IR')}</td>}
                    {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-1.5 border-l-2 border-black font-mono">{previewInvoice.feeAmount.toLocaleString('fa-IR')}</td>}
                  </tr>
                  <tr className="text-center text-zinc-400">
                    <td className="p-1 border-l-2 border-black font-mono">۲</td>
                    <td className="p-1 border-l-2 border-black text-right pr-2">-</td>
                    <td className="p-1 border-l-2 border-black font-sans">-</td>
                    <td className="p-1 border-l-2 border-black font-sans">-</td>
                    {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-1 border-l-2 border-black font-sans">-</td>}
                    {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-1 border-l-2 border-black font-sans">-</td>}
                    {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-1 border-l-2 border-black font-sans">-</td>}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. FINANCIAL SUMMARY */}
            <div className="grid grid-cols-2 gap-3 text-[8.5px]">
              <div className="border-2 border-black p-1.5 space-y-1 bg-zinc-50 flex flex-col justify-center text-right pr-2">
                <span className="font-bold text-black text-[9px]">اتوماسیون حسابداری زرسا</span>
                <span>اندازه سند چاپی: A5 پرتره</span>
                <span>شناسه سند الکترونیک: {previewInvoice.id}</span>
              </div>
              <div className="border-2 border-black p-1.5 space-y-1 bg-white font-mono text-left pl-2">
                <div className="flex justify-between gap-1 text-black font-sans text-[9px] font-black">
                  <span>مبلغ کل فاکتور:</span>
                  <strong>{previewInvoice.totalAmount.toLocaleString('fa-IR')} تومان</strong>
                </div>
                <div className="flex justify-between gap-1 text-zinc-500 font-sans text-[8px]">
                  <span>تخفیف مشتری:</span>
                  <span>{(previewInvoice.discountAmount || 0).toLocaleString('fa-IR')} تومان</span>
                </div>
                <div className="flex justify-between gap-1 text-[9px] font-black text-red-600 border-t border-black/20 pt-1.5">
                  <span className="font-sans">مبلغ نهایی پرداخت شده:</span>
                  <strong>{previewInvoice.totalAmount.toLocaleString('fa-IR')} ت</strong>
                </div>
              </div>
            </div>

            {/* 5. LEGAL RULES, STAMPS & SIGNATURES */}
            <div className="grid grid-cols-3 gap-3 pt-1 text-[8px]">
              {(store.invoicePrintSettings?.showStamp ?? true) ? (
                <div className="flex flex-col items-center justify-between min-h-[75px] border-2 border-black p-1 bg-white relative">
                  <span className="font-bold text-black text-[8.5px]">مهر و امضای گالری</span>
                  <div className="border border-dashed border-red-500 p-1 text-center w-full my-0.5 rounded text-red-600 rotate-[-4deg] bg-red-500/5 leading-none">
                    <span className="text-[8px] font-black block">{store.name}</span>
                    <span className="text-[6.5px] block opacity-80 mt-0.5">تایید و تسویه شد</span>
                  </div>
                  <span className="text-[7.5px] text-zinc-600 font-mono">{store.signature || 'مدیریت گالری'}</span>
                </div>
              ) : (
                <div className="min-h-[75px] border border-transparent" />
              )}

              {(store.invoicePrintSettings?.showFingerprint ?? true) ? (
                <div className="flex flex-col items-center justify-between min-h-[75px] border-2 border-black p-1 text-center bg-white">
                  <span className="font-bold text-black text-[8.5px]">امضا و اثر انگشت خریدار</span>
                  <p className="text-[6px] text-zinc-600 leading-normal px-0.5 text-justify">
                    صحت اطلاعات و اصالت کالا مورد تایید است و مصنوعات دریافت گردید.
                  </p>
                  <div className="w-7 h-7 rounded border border-zinc-400 border-dashed flex items-center justify-center text-[5.5px] text-zinc-400 bg-zinc-50/20">
                    اثر انگشت
                  </div>
                </div>
              ) : (
                <div className="min-h-[75px] border border-transparent" />
              )}

              {(store.invoicePrintSettings?.showTerms ?? true) ? (
                <div className="border-2 border-black p-1 rounded-none text-right text-[6.5px] text-zinc-700 space-y-1 bg-white leading-normal pr-1.5">
                  <span className="font-bold text-black block border-b border-black pb-0.5 text-center text-[7.5px]">تعهدات قانونی</span>
                  <p>۱. ارائه فاکتور جهت مبادلات بعدی الزامیست.</p>
                  <p>۲. عیار مصنوعات ۱۸ عیار (۷۵۰) تضمین می‌شود.</p>
                  <p>۳. سند مجهز به سیستم رهگیری زرسا است.</p>
                </div>
              ) : (
                <div className="min-h-[75px] border border-transparent" />
              )}
            </div>

            {/* 6. STORE ADDRESS CONTACT */}
            <div className="border-t border-black pt-2 text-center text-[8px] text-black space-y-0.5 font-sans leading-none">
              <p className="font-bold">
                نشانی: {store.address} · تلفن تماس: {store.phone}
              </p>
              <p className="text-[6.5px] text-zinc-500 font-mono tracking-wide pt-0.5">
                تأییدیه الکترونیک اصالت فاکتور زرسا: IR-GOLD-{previewInvoice.invoiceNumber}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
