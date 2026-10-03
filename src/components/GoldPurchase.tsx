import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Coins, 
  Scale, 
  Sparkles, 
  Receipt, 
  Check, 
  Copy, 
  Download, 
  Trash2, 
  User, 
  Phone, 
  CreditCard, 
  Camera, 
  Upload, 
  X, 
  FileText, 
  Search, 
  TrendingUp, 
  Percent, 
  Sliders, 
  Clock, 
  ExternalLink, 
  Share2, 
  MessageCircle, 
  Send,
  Building,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Eye,
  Smartphone,
  Scan,
  Loader2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { PurchaseInvoice, StoreSettings, ContactAccount } from '../types';
import { detectBankFromCardNumber, formatCardNumber, formatShabaNumber, IRANIAN_BANKS } from '../utils/bankHelper';
import { downloadPurchaseReceiptPNG, downloadPurchaseReceiptPDF } from '../utils/purchaseReceiptPng';
import { toPersianDigits, toEnglishDigits, formatTomanAmount, parseCleanNumber, parseCleanFloat } from '../utils/numberFormat';
import { applyRounding } from '../utils/rounding';

interface GoldPurchaseProps {
  goldPrice: number; // نرخ تابلوی روز
  store: StoreSettings;
  showNotification: (msg: string, type?: 'success' | 'amber' | 'error') => void;
  getPersianDate: () => string;
  getPersianTime: () => string;
  onOpenRegularCalculator?: () => void;
  purchasesProp?: PurchaseInvoice[];
  setPurchasesProp?: React.Dispatch<React.SetStateAction<PurchaseInvoice[]>>;
  accounts?: ContactAccount[];
  setAccounts?: React.Dispatch<React.SetStateAction<ContactAccount[]>>;
}

type PurchaseSubTab = 'scrap_jewelry' | 'parsian' | 'melted' | 'coin' | 'history';

// 22 Standard Parsian presets for fast selection
const PARSIAN_BUY_PRESETS = [
  { name: 'پارسیان ۰.۰۵۰ گرم (۵۰ سوت)', weight: 0.050 },
  { name: 'پارسیان ۰.۱۰۰ گرم (۱۰۰ سوت)', weight: 0.100 },
  { name: 'پارسیان ۰.۱۵۰ گرم (۱۵۰ سوت)', weight: 0.150 },
  { name: 'پارسیان ۰.۲۰۰ گرم (۲۰۰ سوت)', weight: 0.200 },
  { name: 'پارسیان ۰.۲۵۰ گرم (۲۵۰ سوت)', weight: 0.250 },
  { name: 'پارسیان ۰.۳۰۰ گرم (۳۰۰ سوت)', weight: 0.300 },
  { name: 'پارسیان ۰.۴۰۰ گرم (۴۰۰ سوت)', weight: 0.400 },
  { name: 'پارسیان ۰.۵۰۰ گرم (نیم گرم)', weight: 0.500 },
  { name: 'پارسیان ۰.۶۰۰ گرم (۶۰۰ سوت)', weight: 0.600 },
  { name: 'پارسیان ۰.۷۰۰ گرم (۷۰۰ سوت)', weight: 0.700 },
  { name: 'پارسیان ۰.۸۰۰ گرم (۸۰۰ سوت)', weight: 0.800 },
  { name: 'پارسیان ۰.۹۰۰ گرم (۹۰۰ سوت)', weight: 0.900 },
  { name: 'پارسیان ۱.۰۰۰ گرم (۱ گرم)', weight: 1.000 },
  { name: 'پارسیان ۱.۲۰۰ گرم', weight: 1.200 },
  { name: 'پارسیان ۱.۵۰۰ گرم', weight: 1.500 },
  { name: 'پارسیان ۲.۰۰۰ گرم (۲ گرم)', weight: 2.000 },
];

export const GoldPurchase: React.FC<GoldPurchaseProps> = ({
  goldPrice,
  store,
  showNotification,
  getPersianDate,
  getPersianTime,
  onOpenRegularCalculator,
  purchasesProp,
  setPurchasesProp,
  accounts = [],
  setAccounts
}) => {
  // Main Sub-Tab: 'scrap_jewelry' | 'parsian' | 'melted' | 'history'
  const [subTab, setSubTab] = useState<PurchaseSubTab>('scrap_jewelry');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('');
  const [showContactDropdown, setShowContactDropdown] = useState<boolean>(false);

  // Purchase Invoices History (Persistent in localStorage, synced with props)
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() => {
    if (purchasesProp) return purchasesProp;
    try {
      const saved = localStorage.getItem('zarsa_purchase_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('zarsa_purchase_invoices', JSON.stringify(purchases));
    } catch (err) {
      console.error('Failed to save purchase invoices', err);
    }
    if (setPurchasesProp) {
      setPurchasesProp(purchases);
    }
  }, [purchases, setPurchasesProp]);

  // Sync state if props change from outside
  useEffect(() => {
    if (purchasesProp && JSON.stringify(purchasesProp) !== JSON.stringify(purchases)) {
      setPurchases(purchasesProp);
    }
  }, [purchasesProp]);

  // =========================================================================
  // 1. SUB-TAB 1: SCRAP JEWELRY (طلای ساخته‌شده / متفرقه / دست‌دوم)
  // Formula: Weight * 740 / 750 * LiveGoldRate
  // =========================================================================
  const [sWeight, setSWeight] = useState<number>(5.250);
  const [sTitle, setSTitle] = useState<string>('طلای ساخته‌شده مستعمل (۷۴۰)');

  // Calculation for scrap jewelry
  const sWeight750 = Number(((sWeight * 740) / 750).toFixed(3));
  const sRawTotal = Math.round(sWeight750 * (goldPrice || 0));
  const sFinalTotal = applyRounding(sRawTotal, store.rounding);

  // =========================================================================
  // 2. SUB-TAB 2: PARSIAN BUYING (خرید پارسیان)
  // Formula: Weight * LiveGoldRate - 4% (Discount customizable / can be disabled)
  // =========================================================================
  const [pWeight, setPWeight] = useState<number>(0.500);
  const [pDiscountPercent, setPDiscountPercent] = useState<number>(4); // default 4%
  const [pDiscountEnabled, setPDiscountEnabled] = useState<boolean>(true);
  const [pSelectedPreset, setPSelectedPreset] = useState<string>('پارسیان ۰.۵۰۰ گرم (نیم گرم)');

  const pRawAmount = Math.round((pWeight || 0) * (goldPrice || 0));
  const pDiscountAmount = pDiscountEnabled ? Math.round(pRawAmount * ((pDiscountPercent || 0) / 100)) : 0;
  const pPayable = Math.max(0, pRawAmount - pDiscountAmount);
  const pFinalTotal = applyRounding(pPayable, store.rounding);

  // =========================================================================
  // 3. SUB-TAB 3: MELTED GOLD BUYING (خرید طلای آب‌شده)
  // Formula: Weight * (Karat / 750) * ManualGoldRate (NOT from live board!)
  // =========================================================================
  const [mWeight, setMWeight] = useState<number>(10.000);
  const [mKarat, setMKarat] = useState<number>(750); // Karat entered by jeweler
  const [mManualRate, setMManualRate] = useState<number>(() => goldPrice ? goldPrice - 30000 : 3420000); // independent manual rate
  const [mEngCode, setMEngCode] = useState<string>(''); // کد انگ
  const [mLabName, setMLabName] = useState<string>(''); // آزمایشگاه ری‌گیری
  const [mLabPhone, setMLabPhone] = useState<string>(''); // تلفن آزمایشگاه

  const mWeight750 = Number(((mWeight * (mKarat || 750)) / 750).toFixed(3));
  const mRawTotal = Math.round(mWeight750 * (mManualRate || 0));
  const mFinalTotal = applyRounding(mRawTotal, store.rounding);

  // =========================================================================
  // 4. SUB-TAB 4: COIN BUYING (خرید سکه از مشتری)
  // Formula:
  // - Raw Full Coin = Mazaneh * 2.253
  // - Raw Half Coin = (Mazaneh * 2.253) / 2
  // - Raw Quarter Coin = (Mazaneh * 2.253) / 4
  // - Final Price = (Raw Coin Price - coinFee) * coinQuantity
  // =========================================================================
  const [coinMazaneh, setCoinMazaneh] = useState<number>(() => {
    return goldPrice ? Math.round(goldPrice * 4.6083 * 705 / 750) : 15000000;
  });
  const [coinType, setCoinType] = useState<'full' | 'half' | 'quarter'>('full');
  const [coinQuantity, setCoinQuantity] = useState<number>(1);
  const [coinFee, setCoinFee] = useState<number>(100000); // 100,000 Toman default fee subtracted per coin

  const rawFullPrice = Math.round(coinMazaneh * 2.253);
  const rawHalfPrice = Math.round((coinMazaneh * 2.253) / 2);
  const rawQuarterPrice = Math.round((coinMazaneh * 2.253) / 4);

  const coinRawPricePerUnit = 
    coinType === 'full' ? rawFullPrice : 
    coinType === 'half' ? rawHalfPrice : 
    rawQuarterPrice;

  const coinFinalPricePerUnit = Math.max(0, coinRawPricePerUnit - coinFee);
  const coinFinalTotal = applyRounding(coinFinalPricePerUnit * coinQuantity, store.rounding);

  // =========================================================================
  // MODAL: RECORD PURCHASE & CUSTOMER BANK INFO
  // =========================================================================
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<PurchaseInvoice | null>(null);

  // Form Fields for Customer & Bank details
  const [targetPurchaseType, setTargetPurchaseType] = useState<'scrap_jewelry' | 'parsian' | 'melted' | 'coin'>('scrap_jewelry');
  const [cName, setCName] = useState<string>('');
  const [cPhone, setCPhone] = useState<string>('');
  const [cBankName, setCBankName] = useState<string>('');
  const [cCardNumber, setCCardNumber] = useState<string>('');
  const [cShaba, setCShaba] = useState<string>('');
  const [cAccountOwner, setCAccountOwner] = useState<string>('');
  const [cCardImage, setCCardImage] = useState<string>(''); // Base64
  const [cNote, setCNote] = useState<string>('');
  const [isScanningCard, setIsScanningCard] = useState<boolean>(false);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [autoPostToLedger, setAutoPostToLedger] = useState<boolean>(true);
  const [instantCashSettle, setInstantCashSettle] = useState<boolean>(true);
  const [ocrSuccessFields, setOcrSuccessFields] = useState<{
    card?: boolean;
    shaba?: boolean;
    owner?: boolean;
    bank?: boolean;
  }>({});

  // Direct camera & gallery file input refs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Live in-app Camera Viewfinder states
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-detect bank name when card number changes
  const handleCardNumberChange = (raw: string) => {
    const clean = raw.replace(/[^0-9]/g, '').slice(0, 16);
    setCCardNumber(clean);
    const detected = detectBankFromCardNumber(clean);
    if (detected && !cBankName) {
      setCBankName(detected);
    }
  };

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Launch live camera or fallback to native device camera
  const startLiveCamera = async (facing: 'environment' | 'user' = 'environment') => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      triggerNativeCamera();
      return;
    }

    setIsCameraStarting(true);
    setIsLiveCameraOpen(true);
    setCameraFacingMode(facing);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
    } catch (err: any) {
      console.warn('Camera stream error, falling back to system camera:', err);
      stopLiveCamera();
      showNotification('دوربین سیستم فعال شد (جهت ثبت عکس کارت)', 'amber');
      triggerNativeCamera();
    } finally {
      setIsCameraStarting(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraOpen(false);
    setIsCameraStarting(false);
  };

  const captureLiveSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopLiveCamera();
    setCCardImage(dataUrl);
    processCardImageOCR(dataUrl);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    startLiveCamera(nextFacing);
  };

  const triggerNativeCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const triggerGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  // Process Card Image through Server AI OCR
  const processCardImageOCR = async (base64Image: string) => {
    setIsScanningCard(true);
    setOcrSuccessFields({});
    showNotification('در حال اسکن و استخراج هوشمند شماره کارت و شبا...', 'amber');
    try {
      const res = await fetch('/api/ocr-bank-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const { cardNumber, shabaNumber, accountOwnerName, bankName } = json.data;
          const detectedSuccess: { card?: boolean; shaba?: boolean; owner?: boolean; bank?: boolean } = {};

          if (cardNumber && cardNumber.length >= 16) {
            setCCardNumber(cardNumber);
            detectedSuccess.card = true;
            const detected = detectBankFromCardNumber(cardNumber);
            if (detected) {
              setCBankName(detected);
              detectedSuccess.bank = true;
            }
          }

          if (shabaNumber && shabaNumber.length > 5) {
            setCShaba(shabaNumber);
            detectedSuccess.shaba = true;
          }

          if (accountOwnerName) {
            setCAccountOwner(accountOwnerName);
            if (!cName) setCName(accountOwnerName);
            detectedSuccess.owner = true;
          }

          if (bankName && !cBankName) {
            setCBankName(bankName);
            detectedSuccess.bank = true;
          }

          setOcrSuccessFields(detectedSuccess);
          showNotification('مشخصات کارت بانکی با موفقیت خوانده و ثبت شد ✓', 'success');
        } else {
          showNotification(json.message || 'عکس کارت ضمیمه شد (شماره کارت را دستی کنترل کنید)', 'amber');
        }
      } else {
        showNotification('عکس کارت با کیفیت بالا ضمیمه شد', 'amber');
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      showNotification('عکس کارت با کیفیت بالا ذخیره شد', 'amber');
    } finally {
      setIsScanningCard(false);
    }
  };

  // Open modal with pre-filled parameters based on current sub-tab
  const openRecordModal = (type: 'scrap_jewelry' | 'parsian' | 'melted' | 'coin') => {
    setTargetPurchaseType(type);
    setOcrSuccessFields({});
    setSelectedContactId('');
    setContactSearchQuery('');
    setShowContactDropdown(false);
    setCName('');
    setCPhone('');
    setShowRecordModal(true);
  };

  // Open modal and immediately initiate camera scan
  const openRecordModalWithCamera = (type: 'scrap_jewelry' | 'parsian' | 'melted' | 'coin') => {
    setTargetPurchaseType(type);
    setOcrSuccessFields({});
    setSelectedContactId('');
    setContactSearchQuery('');
    setShowContactDropdown(false);
    setCName('');
    setCPhone('');
    setShowRecordModal(true);
    setTimeout(() => {
      startLiveCamera('environment');
    }, 150);
  };

  // Handle Image Upload / Camera Capture for Customer Card
  const handleCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setCCardImage(base64);
        processCardImageOCR(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create & Save Purchase Invoice
  const savePurchaseInvoice = (skipCustomer = false) => {
    const receiptNum = `PR-${Date.now().toString().slice(-6)}`;
    const dateFa = getPersianDate();
    const timeFa = getPersianTime();

    let rawWeight = 0;
    let sourceKarat = 750;
    let standardWeight750 = 0;
    let goldPriceUsed = goldPrice;
    let totalPayable = 0;
    let itemTitle = '';
    let discountPercent = 0;
    let discountAmount = 0;

    if (targetPurchaseType === 'scrap_jewelry') {
      rawWeight = sWeight;
      sourceKarat = 740;
      standardWeight750 = sWeight750;
      goldPriceUsed = goldPrice;
      totalPayable = sFinalTotal;
      itemTitle = sTitle || 'طلای ساخته‌شده مستعمل (عیار ۷۴۰)';
    } else if (targetPurchaseType === 'parsian') {
      rawWeight = pWeight;
      sourceKarat = 750;
      standardWeight750 = pWeight;
      goldPriceUsed = goldPrice;
      totalPayable = pFinalTotal;
      itemTitle = pSelectedPreset || `شمش پارسیان ${pWeight} گرم`;
      discountPercent = pDiscountEnabled ? pDiscountPercent : 0;
      discountAmount = pDiscountAmount;
    } else if (targetPurchaseType === 'coin') {
      rawWeight = Number(((coinType === 'full' ? 8.133 : coinType === 'half' ? 4.066 : 2.033) * coinQuantity).toFixed(3));
      sourceKarat = 900;
      standardWeight750 = Number(((rawWeight * 900) / 750).toFixed(3));
      goldPriceUsed = Math.round(coinMazaneh * 2.253);
      totalPayable = coinFinalTotal;
      itemTitle = coinType === 'full' 
        ? `سکه تمام بهار آزادی (تعداد: ${coinQuantity} عدد)` 
        : coinType === 'half' 
          ? `نیم سکه بهار آزادی (تعداد: ${coinQuantity} عدد)` 
          : `ربع سکه بهار آزادی (تعداد: ${coinQuantity} عدد)`;
      discountAmount = coinFee * coinQuantity;
      discountPercent = coinRawPricePerUnit > 0 ? Math.round((coinFee / coinRawPricePerUnit) * 100) : 0;
    } else {
      rawWeight = mWeight;
      sourceKarat = mKarat;
      standardWeight750 = mWeight750;
      goldPriceUsed = mManualRate;
      totalPayable = mFinalTotal;
      itemTitle = `طلای آب‌شده عیار ${mKarat} ${mEngCode ? `(انگ: ${mEngCode})` : ''}`;
    }

    const newInvoice: PurchaseInvoice = {
      id: `purch-${Date.now()}`,
      receiptNumber: receiptNum,
      createdAt: new Date().toISOString(),
      dateFa,
      timeFa,
      type: targetPurchaseType,
      itemTitle,
      customerName: skipCustomer ? 'مشتری حضوری (فروشنده)' : (cName || 'مشتری حضوری'),
      customerPhone: skipCustomer ? '' : cPhone,
      accountId: skipCustomer ? undefined : (selectedContactId || undefined),
      bankInfo: skipCustomer ? undefined : {
        bankName: cBankName,
        cardNumber: cCardNumber ? formatCardNumber(cCardNumber) : '',
        shabaNumber: cShaba ? formatShabaNumber(cShaba) : '',
        accountNumber: '',
        accountOwnerName: cAccountOwner || cName || 'مطابق کارت',
        cardImage: cCardImage || ''
      },
      rawWeight,
      sourceKarat,
      standardWeight750,
      goldPriceUsed,
      discountPercent,
      discountAmount,
      totalPayable,
      engCode: targetPurchaseType === 'melted' ? mEngCode : undefined,
      labName: targetPurchaseType === 'melted' ? mLabName : undefined,
      labPhone: targetPurchaseType === 'melted' ? mLabPhone : undefined,
      note: cNote
    };

    if (!skipCustomer && selectedContactId && setAccounts && accounts) {
      const contact = accounts.find(acc => acc.id === selectedContactId);
      if (contact) {
        const goldCreditor = newInvoice.standardWeight750 || 0;
        const goldDebtor = 0;
        const rialCreditor = newInvoice.totalPayable;
        let rialDebtor = 0;
        let desc = '';
        if (instantCashSettle) {
          rialDebtor = newInvoice.totalPayable;
          desc = `خرید ${newInvoice.itemTitle} - رسید #${newInvoice.receiptNumber} (تسویه نقدی فوری)`;
        } else {
          desc = `خرید ${newInvoice.itemTitle} - رسید #${newInvoice.receiptNumber}`;
        }

        const newGoldBalance = contact.currentGoldBalance + (goldCreditor - goldDebtor);
        const newRialBalance = contact.currentRialBalance + (rialCreditor - rialDebtor);

        const newTx = {
          id: 'tx_auto_' + Date.now(),
          dateFa: newInvoice.dateFa,
          timeFa: newInvoice.timeFa,
          description: desc,
          goldRate: newInvoice.goldPriceUsed || goldPrice,
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

    setPurchases(prev => [newInvoice, ...prev]);
    setShowRecordModal(false);
    setActiveReceipt(newInvoice);
    setShowReceiptModal(true);
    showNotification(`رسید خرید #${receiptNum} با موفقیت ثبت شد`, 'success');

    // Reset customer modal form
    setCName('');
    setCPhone('');
    setCBankName('');
    setCCardNumber('');
    setCShaba('');
    setCAccountOwner('');
    setCCardImage('');
    setCNote('');
    setSelectedContactId('');
  };

  // Delete invoice
  const handleDeleteInvoice = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDeleteInvoice = (id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
    showNotification('رسید خرید حذف شد', 'amber');
    setDeleteConfirmId(null);
  };

  // Search filter for history
  const [historySearch, setHistorySearch] = useState<string>('');
  const filteredPurchases = purchases.filter(p => {
    const q = historySearch.toLowerCase();
    return (
      p.receiptNumber.toLowerCase().includes(q) ||
      (p.customerName && p.customerName.toLowerCase().includes(q)) ||
      (p.customerPhone && p.customerPhone.includes(q)) ||
      (p.bankInfo?.cardNumber && p.bankInfo.cardNumber.includes(q)) ||
      (p.itemTitle && p.itemTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-amber-950/40 to-zinc-950 p-4 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-36 h-36 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#ffd700] shadow-md shadow-amber-500/10">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>سامانه خرید طلا از مشتری</span>
                <span className="text-[10px] bg-amber-500/20 text-[#ffd700] border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                  تسویه و صدور رسید
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                محاسبه قیمت خرید طلای متفرقه (۷۴۰)، شمش پارسیان، آب‌شده و انواع سکه با ثبت مشخصات بانکی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
            <span className="text-zinc-500 text-[10px]">نرخ تابلوی ۱۸ عیار:</span>
            <span className="font-mono font-black text-[#ffd700]">{formatTomanAmount(goldPrice)}</span>
            <span className="text-[10px] text-zinc-500">تومان</span>
          </div>
        </div>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs">
        <button
          onClick={() => setSubTab('scrap_jewelry')}
          className={`py-2.5 px-2 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'scrap_jewelry'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <span className="text-sm">💍</span>
          <span>طلای ساخته‌شده (۷۴۰)</span>
        </button>

        <button
          onClick={() => setSubTab('parsian')}
          className={`py-2.5 px-2 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'parsian'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Coins className="w-4 h-4 shrink-0" />
          <span>خرید پارسیان</span>
        </button>

        <button
          onClick={() => setSubTab('melted')}
          className={`py-2.5 px-2 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'melted'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Scale className="w-4 h-4 shrink-0" />
          <span>خرید آب‌شده</span>
        </button>

        <button
          onClick={() => setSubTab('coin')}
          className={`py-2.5 px-2 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'coin'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <span className="text-sm">🪙</span>
          <span>خرید سکه</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`py-2.5 px-2 rounded-xl font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer relative ${
            subTab === 'history'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Receipt className="w-4 h-4 shrink-0" />
          <span>دفتر خریدها</span>
          {purchases.length > 0 && (
            <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
              {purchases.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB: SCRAP JEWELRY BUYING */}
      {/* ========================================================================= */}
      {subTab === 'scrap_jewelry' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-lg">💍</span>
                <div>
                  <h3 className="text-sm font-black text-white">خرید طلای ساخته‌شده و متفرقه از مشتری</h3>
                  <span className="text-[10px] text-zinc-400">فرمول استاندارد بازار: وزن × ۷۴۰ ÷ ۷۵۰ × نرخ تابلوی ۱۸ عیار</span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#ffd700] bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800 font-bold">
                خط ۷۴۰ بازار
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Weight Input */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-300">وزن ناخالص طلا (گرم)</label>
                  <span className="font-mono text-[#ffd700] font-bold">
                    معادل ۷۵۰: {sWeight750.toLocaleString('fa-IR', { minimumFractionDigits: 3 })} گرم
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    value={sWeight || ''}
                    onChange={(e) => setSWeight(parseCleanFloat(e.target.value))}
                    placeholder="مثال: ۵.۲۵۰"
                    className="w-full h-12 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xl font-black text-[#ffd700] font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-zinc-400">گرم</span>
                </div>
                <div className="flex gap-1 pt-1 overflow-x-auto">
                  {[1, 2.5, 5, 10, 15, 20].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSWeight(w)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-bold font-mono"
                    >
                      {w} گرم
                    </button>
                  ))}
                </div>
              </div>

              {/* Gold Rate (Taken from Board) */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-300">نرخ مبنای طلای ۱۸ عیار</label>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    هماهنگ با تابلوی اصلی
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={formatTomanAmount(goldPrice)}
                    className="w-full h-12 px-3 bg-zinc-900/70 border border-zinc-800 rounded-xl text-lg font-black text-white font-mono outline-none"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-zinc-400">تومان</span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  نرخ از تابلوی مغازه خوانده می‌شود و نیاز به ورود دستی ندارد.
                </p>
              </div>

            </div>

            {/* Title / Description */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-xs">
              <label className="text-[11px] text-zinc-400 block mb-1 font-bold">عنوان قطعه طلا (اختیاری جهت درج در رسید)</label>
              <input
                type="text"
                value={sTitle}
                onChange={(e) => setSTitle(e.target.value)}
                placeholder="مثال: النگو و انگشتر دست‌دوم مستعمل"
                className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
              />
            </div>

          </div>

          {/* RESULT CARD */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#ffd700]" />
                <span>مبلغ نهایی خرید طلا از مشتری</span>
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full font-mono">
                تسویه نقدی / حواله
              </span>
            </div>

            <div className="bg-[#d4af37]/10 p-4 rounded-2xl border border-[#d4af37]/30 text-center space-y-1">
              <span className="text-xs font-bold text-amber-200">مبلغ پرداختی به مشتری (تومان):</span>
              <div className="text-3xl sm:text-4xl font-black text-[#ffd700] font-mono tracking-tight">
                {formatTomanAmount(sFinalTotal)} <span className="text-lg font-bold text-white">تومان</span>
              </div>
              <div className="text-xs text-zinc-300 pt-1 font-mono">
                محاسبه: {sWeight} گرم × ۷۴۰ ÷ ۷۵۰ = {sWeight750} گرم × {formatTomanAmount(goldPrice)} ت
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openRecordModalWithCamera('scrap_jewelry')}
                className="h-12 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#d4af37]/25 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-[#ffd700] border border-[#d4af37]/50 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/10 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#ffd700]" />
                <span>📷 اسکن دوربین و ثبت سریع کارت</span>
              </button>

              <button
                type="button"
                onClick={() => openRecordModal('scrap_jewelry')}
                className="h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89320] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>ثبت خرید و دریافت اطلاعات بانکی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: PARSIAN BUYING */}
      {/* ========================================================================= */}
      {subTab === 'parsian' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#ffd700]" />
                <div>
                  <h3 className="text-sm font-black text-white">خرید شمش‌های مینیاتوری پارسیان</h3>
                  <span className="text-[10px] text-zinc-400">وزن × نرخ روز طلا منهای ۴٪ کسر خرید (قابل تغییر)</span>
                </div>
              </div>
              <span className="text-[11px] bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800 font-mono text-zinc-400">
                عیار ۱۸ استاندارد
              </span>
            </div>

            {/* Fast Presets Grid */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[11px] text-zinc-400 block font-bold">انتخاب سریع شمش پارسیان:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
                {PARSIAN_BUY_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setPWeight(p.weight);
                      setPSelectedPreset(p.name);
                    }}
                    className={`p-2 rounded-xl text-right text-xs font-bold transition-all cursor-pointer ${
                      pWeight === p.weight
                        ? 'bg-[#d4af37] text-black font-black'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="block truncate">{p.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">{p.weight} گرم</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Custom Weight & Discount % */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Weight */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <label className="font-bold text-zinc-300 block">وزن شمش پارسیان (گرم)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={pWeight || ''}
                    onChange={(e) => {
                      const val = parseCleanFloat(e.target.value);
                      setPWeight(val);
                      setPSelectedPreset(`پارسیان ${val} گرم`);
                    }}
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-lg font-black text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-xs text-zinc-400">گرم</span>
                </div>
              </div>

              {/* Discount / کسر خرید پارسیان (Default 4% as requested) */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-300">درصد کسر خرید پارسیان</label>
                  <button
                    type="button"
                    onClick={() => setPDiscountEnabled(!pDiscountEnabled)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      pDiscountEnabled ? 'bg-amber-500/20 text-[#ffd700]' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {pDiscountEnabled ? 'فعال (۴٪)' : 'غیرفعال (بدون کسر)'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      disabled={!pDiscountEnabled}
                      value={pDiscountEnabled ? pDiscountPercent : 0}
                      onChange={(e) => setPDiscountPercent(parseCleanFloat(e.target.value))}
                      className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm font-black text-white font-mono disabled:opacity-50 focus:border-[#d4af37] outline-none"
                    />
                    <span className="absolute left-3 top-3 text-xs text-zinc-400">٪</span>
                  </div>
                  <div className="flex gap-1">
                    {[2, 3, 4, 5].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setPDiscountPercent(d);
                          setPDiscountEnabled(true);
                        }}
                        className={`px-2.5 h-11 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          pDiscountEnabled && pDiscountPercent === d
                            ? 'bg-[#d4af37] text-black font-black'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {d}٪
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* PARSIAN RESULT */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#ffd700]" />
                <span>مبلغ نهایی خرید پارسیان</span>
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                {pSelectedPreset}
              </span>
            </div>

            <div className="bg-[#d4af37]/10 p-4 rounded-2xl border border-[#d4af37]/30 text-center space-y-1">
              <span className="text-xs font-bold text-amber-200">مبلغ نهایی پرداختی به مشتری:</span>
              <div className="text-3xl sm:text-4xl font-black text-[#ffd700] font-mono tracking-tight">
                {formatTomanAmount(pFinalTotal)} <span className="text-lg font-bold text-white">تومان</span>
              </div>
              <div className="text-xs text-zinc-300 pt-1 font-mono">
                ارزش خام: {formatTomanAmount(pRawAmount)} ت {pDiscountEnabled ? `| کسر ${pDiscountPercent}٪: -${formatTomanAmount(pDiscountAmount)} ت` : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openRecordModalWithCamera('parsian')}
                className="h-12 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#d4af37]/25 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-[#ffd700] border border-[#d4af37]/50 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/10 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#ffd700]" />
                <span>📷 اسکن دوربین و ثبت سریع کارت</span>
              </button>

              <button
                type="button"
                onClick={() => openRecordModal('parsian')}
                className="h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89320] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>ثبت خرید پارسیان و اطلاعات واریز</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: MELTED GOLD BUYING (خرید آب‌شده) */}
      {/* ========================================================================= */}
      {subTab === 'melted' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#ffd700]" />
                <div>
                  <h3 className="text-sm font-black text-white">خرید طلای آب‌شده از مشتری</h3>
                  <span className="text-[10px] text-zinc-400">فرمول: وزن × عیار ÷ ۷۵۰ × نرخ توافقی خرید آب‌شده</span>
                </div>
              </div>
              <span className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                نرخ دستی مستقل از تابلو
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              {/* Weight */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-300">وزن آب‌شده (گرم)</label>
                  <span className="font-mono text-[#ffd700] text-[11px] font-bold">
                    معادل ۷۵۰: {mWeight750} گرم
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    value={mWeight || ''}
                    onChange={(e) => setMWeight(parseCleanFloat(e.target.value))}
                    placeholder="مثال: ۱۰.۲۴۰"
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-lg font-black text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-xs text-zinc-400">گرم</span>
                </div>
              </div>

              {/* Karat (عیار) */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-300">عیار ری‌گیری</label>
                  <span className="font-mono text-zinc-400 text-[11px]">{mKarat}/1000</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={mKarat || ''}
                    onChange={(e) => setMKarat(parseInt(e.target.value) || 0)}
                    placeholder="۷۵۰"
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-lg font-black text-white font-mono focus:border-[#d4af37] outline-none text-center"
                  />
                  <span className="absolute left-3 top-3 text-xs text-zinc-400">عیار</span>
                </div>
                <div className="flex gap-1 pt-1 justify-center">
                  {[735, 740, 750, 760].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMKarat(k)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        mKarat === k ? 'bg-[#d4af37] text-black font-black' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Gold Rate (As requested: DOES NOT read from board) */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-amber-200">نرخ دستی خرید آب‌شده</label>
                  <button
                    type="button"
                    onClick={() => setMManualRate(goldPrice)}
                    className="text-[10px] text-zinc-400 hover:text-[#d4af37] underline"
                  >
                    کپی از تابلو
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatTomanAmount(mManualRate)}
                    onChange={(e) => setMManualRate(parseCleanNumber(e.target.value))}
                    placeholder="نرخ توافقی خرید..."
                    className="w-full h-11 px-3 bg-zinc-900 border border-amber-500/40 rounded-xl text-base font-black text-[#ffd700] font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-xs text-zinc-400">تومان</span>
                </div>
                <span className="text-[10px] text-zinc-500 block">
                  دستی وارد کنید (از تابلو خوانده نمی‌شود)
                </span>
              </div>

            </div>

            {/* Melted Specific Fields: Eng Code, Lab Name, Lab Phone */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <span className="text-zinc-300 font-bold block text-xs">مشخصات ری‌گیری و آزمایشگاه آب‌شده:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">کد انگ (Eng Code)</label>
                  <input
                    type="text"
                    value={mEngCode}
                    onChange={(e) => setMEngCode(e.target.value)}
                    placeholder="مثال: ۸۹۷۲۳۴"
                    className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:border-[#d4af37] outline-none text-left"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">نام آزمایشگاه ری‌گیری</label>
                  <input
                    type="text"
                    value={mLabName}
                    onChange={(e) => setMLabName(e.target.value)}
                    placeholder="مثال: ری‌گیری زرفام / حبیب"
                    className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">شماره تماس آزمایشگاه</label>
                  <input
                    type="text"
                    value={mLabPhone}
                    onChange={(e) => setMLabPhone(e.target.value)}
                    placeholder="۰۲۱-۵۵..."
                    className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:border-[#d4af37] outline-none text-left"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* MELTED RESULT */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#ffd700]" />
                <span>مبلغ نهایی خرید آب‌شده</span>
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                {mWeight750} گرم عیار ۷۵۰
              </span>
            </div>

            <div className="bg-[#d4af37]/10 p-4 rounded-2xl border border-[#d4af37]/30 text-center space-y-1">
              <span className="text-xs font-bold text-amber-200">مبلغ پرداختی به مشتری (تومان):</span>
              <div className="text-3xl sm:text-4xl font-black text-[#ffd700] font-mono tracking-tight">
                {formatTomanAmount(mFinalTotal)} <span className="text-lg font-bold text-white">تومان</span>
              </div>
              <div className="text-xs text-zinc-300 pt-1 font-mono">
                {mWeight} گرم × {mKarat} ÷ ۷۵۰ = {mWeight750} گرم ۷۵۰ × {formatTomanAmount(mManualRate)} تومان
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openRecordModalWithCamera('melted')}
                className="h-12 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#d4af37]/25 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-[#ffd700] border border-[#d4af37]/50 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/10 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#ffd700]" />
                <span>📷 اسکن دوربین و ثبت سریع کارت</span>
              </button>

              <button
                type="button"
                onClick={() => openRecordModal('melted')}
                className="h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89320] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>ثبت خرید آب‌شده و صدور رسید</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3.5. SUB-TAB: COIN BUYING (خرید سکه بهار آزادی) */}
      {/* ========================================================================= */}
      {subTab === 'coin' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪙</span>
                <div>
                  <h3 className="text-sm font-black text-white">خرید مسکوکات بهار آزادی از مشتری</h3>
                  <span className="text-[10px] text-zinc-400">محاسبه بر اساس ضریب رسمی ۲.۲۵۳ به همراه کسر کارمزد دستی خرید</span>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Input 1: مظنه طلا (تومان) */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <label className="text-[11px] text-zinc-400 font-bold block">مظنه طلا مبنا (تومان - ۱۷ عیار):</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCoinMazaneh(prev => Math.max(0, prev - 50000))}
                    className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 flex items-center justify-center cursor-pointer active:scale-95"
                    title="کاهش ۵۰ هزار تومان"
                  >
                    -۵۰ک
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={toPersianDigits(coinMazaneh.toLocaleString())}
                      onChange={(e) => {
                        const val = parseCleanNumber(toEnglishDigits(e.target.value));
                        setCoinMazaneh(val || 0);
                      }}
                      className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                    />
                    <span className="absolute left-3 top-2.5 text-[10px] text-zinc-500">تومان</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCoinMazaneh(prev => prev + 50000)}
                    className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 flex items-center justify-center cursor-pointer active:scale-95"
                    title="افزایش ۵۰ هزار تومان"
                  >
                    +۵۰ک
                  </button>
                </div>
                <div className="text-center pt-0.5">
                  <span className="text-[10px] bg-[#d4af37]/10 text-[#ffd700] px-2.5 py-0.5 rounded-full font-mono border border-amber-500/20">
                    قیمت معادل ۱ گرم ۱۸ عیار: {formatTomanAmount(Math.round(coinMazaneh / 4.6083 * (750 / 705)))} تومان
                  </span>
                </div>
              </div>

              {/* Input 2: کارمزد یا کسر خرید دستی (تومان) */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <label className="text-[11px] text-zinc-400 font-bold block">مبلغ کسر کارمزد خرید از هر سکه (تومان):</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCoinFee(prev => Math.max(0, prev - 10000))}
                    className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    -۱۰ک
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={toPersianDigits(coinFee.toLocaleString())}
                      onChange={(e) => {
                        const val = parseCleanNumber(toEnglishDigits(e.target.value));
                        setCoinFee(val || 0);
                      }}
                      className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm font-bold text-red-400 font-mono focus:border-red-500 outline-none"
                    />
                    <span className="absolute left-3 top-2.5 text-[10px] text-zinc-500">تومان</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCoinFee(prev => prev + 10000)}
                    className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    +۱۰ک
                  </button>
                </div>
                <p className="text-center text-[10px] text-zinc-500">مبلغ سود گالری یا حباب و کارمزدی که از ارزش ذاتی سکه کسر می‌گردد</p>
              </div>

            </div>

            {/* Intrinsic Coin Values - Selectable Cards */}
            <div className="space-y-2">
              <span className="text-[11px] text-zinc-400 font-bold block">انتخاب سکه جهت معامله (ارزش ذاتی محاسبه شده بر اساس فرمول ۲.۲۵۳):</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. سکه تمام بهار */}
                <button
                  type="button"
                  onClick={() => setCoinType('full')}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between h-28 ${
                    coinType === 'full'
                      ? 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xs font-bold text-white">سکه تمام بهار (امامی)</span>
                    {coinType === 'full' && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-black text-[9px] font-black">✓</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">ارزش ذاتی: {formatTomanAmount(rawFullPrice)} تومان</span>
                    <span className="text-[10px] text-zinc-500 block">وزن استاندارد: ۸.۱۳۳ گرم</span>
                  </div>
                  <div className="text-xs font-black text-amber-400 font-mono">
                    {formatTomanAmount(Math.max(0, rawFullPrice - coinFee))} ت <span className="text-[9px] text-zinc-400">خرید</span>
                  </div>
                </button>

                {/* 2. نیم سکه بهار */}
                <button
                  type="button"
                  onClick={() => setCoinType('half')}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between h-28 ${
                    coinType === 'half'
                      ? 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xs font-bold text-white">نیم سکه بهار آزادی</span>
                    {coinType === 'half' && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-black text-[9px] font-black">✓</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">ارزش ذاتی: {formatTomanAmount(rawHalfPrice)} تومان</span>
                    <span className="text-[10px] text-zinc-500 block">وزن استاندارد: ۴.۰۶۶ گرم</span>
                  </div>
                  <div className="text-xs font-black text-amber-400 font-mono">
                    {formatTomanAmount(Math.max(0, rawHalfPrice - coinFee))} ت <span className="text-[9px] text-zinc-400">خرید</span>
                  </div>
                </button>

                {/* 3. ربع سکه بهار */}
                <button
                  type="button"
                  onClick={() => setCoinType('quarter')}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative flex flex-col justify-between h-28 ${
                    coinType === 'quarter'
                      ? 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xs font-bold text-white">ربع سکه بهار آزادی</span>
                    {coinType === 'quarter' && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-black text-[9px] font-black">✓</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">ارزش ذاتی: {formatTomanAmount(rawQuarterPrice)} تومان</span>
                    <span className="text-[10px] text-zinc-500 block">وزن استاندارد: ۲.۰۳۳ گرم</span>
                  </div>
                  <div className="text-xs font-black text-amber-400 font-mono">
                    {formatTomanAmount(Math.max(0, rawQuarterPrice - coinFee))} ت <span className="text-[9px] text-zinc-400">خرید</span>
                  </div>
                </button>

              </div>
            </div>

            {/* Quantity Input */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">تعداد سکه معامله شده:</span>
                <span className="text-[10px] text-zinc-500">چند عدد سکه از این نوع خریداری می‌گردد؟</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCoinQuantity(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-lg border border-zinc-800 flex items-center justify-center cursor-pointer active:scale-95"
                >
                  -
                </button>
                <input
                  type="text"
                  value={toPersianDigits(coinQuantity.toString())}
                  onChange={(e) => {
                    const val = parseInt(toEnglishDigits(e.target.value)) || 1;
                    setCoinQuantity(Math.max(1, val));
                  }}
                  className="w-14 h-10 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm font-bold text-white font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCoinQuantity(prev => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-lg border border-zinc-800 flex items-center justify-center cursor-pointer active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Results Display */}
            <div className="bg-gradient-to-l from-amber-500/10 to-transparent p-4 rounded-2xl border border-amber-500/20 text-center space-y-1">
              <span className="text-xs font-bold text-amber-200 block">مبلغ خالص پرداختی به مشتری بابت سکه (تومان):</span>
              <div className="text-3xl sm:text-4xl font-black text-[#ffd700] font-mono tracking-tight">
                {formatTomanAmount(coinFinalTotal)} <span className="text-lg font-bold text-white">تومان</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                محاسبه: (ارزش ذاتی: {formatTomanAmount(coinRawPricePerUnit)} تومان - کارمزد خرید کسر شده: {formatTomanAmount(coinFee)} تومان) × {coinQuantity} عدد = {formatTomanAmount(coinFinalTotal)} تومان
              </div>
            </div>

            {/* Shutter / Record buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openRecordModalWithCamera('coin')}
                className="h-12 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#d4af37]/25 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-[#ffd700] border border-[#d4af37]/50 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/10 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#ffd700]" />
                <span>📷 اسکن دوربین و ثبت سریع کارت</span>
              </button>

              <button
                type="button"
                onClick={() => openRecordModal('coin')}
                className="h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89320] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>ثبت خرید سکه و صدور رسید</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: PURCHASE HISTORY LOG (دفتر خریدهای ثبت‌شده) */}
      {/* ========================================================================= */}
      {subTab === 'history' && (
        <div className="space-y-3">
          
          {/* Search Bar */}
          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="جستجو در خریدهای ثبت‌شده (نام مشتری، شماره فاکتور، کارت...)"
                className="w-full h-9 pr-9 pl-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-[#d4af37] outline-none"
              />
            </div>
            <span className="text-[11px] text-zinc-400 shrink-0 font-mono">
              تعداد: {filteredPurchases.length}
            </span>
          </div>

          {/* List of Purchases */}
          {filteredPurchases.length === 0 ? (
            <div className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-400">هنوز رسیدی در این بخش ثبت نشده است.</p>
              <p className="text-[11px] text-zinc-500">
                با ثبت اولین خرید طلا از مشتری، اطلاعات و رسید آن در اینجا آرشیو می‌شود.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPurchases.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-[#ffd700] text-[10px] font-bold">
                        {inv.type === 'scrap_jewelry' ? '💍 طلا متفرقه' : inv.type === 'parsian' ? '🪙 پارسیان' : inv.type === 'coin' ? '🪙 سکه بهار' : '⚖️ آب‌شده'}
                      </span>
                      <h4 className="font-bold text-white text-xs">{inv.itemTitle}</h4>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {inv.dateFa} - {inv.timeFa}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-300 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">فروشنده (مشتری):</span>
                      <span className="font-bold text-white">{inv.customerName || 'مشتری حضوری'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">وزن ناخالص / ۷۵۰:</span>
                      <span className="font-mono">{inv.rawWeight} گ / {inv.standardWeight750} گ</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">شماره کارت بانکی:</span>
                      <span className="font-mono text-zinc-300">{inv.bankInfo?.cardNumber || 'ثبت نشده'}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-zinc-500 block text-[10px]">مبلغ پرداختی:</span>
                      <span className="font-mono font-black text-[#ffd700] text-sm">
                        {formatTomanAmount(inv.totalPayable)} ت
                      </span>
                    </div>
                  </div>

                  {/* Actions for this invoice */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[10px] text-zinc-500">#{inv.receiptNumber}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReceipt(inv);
                          setShowReceiptModal(true);
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>مشاهده رسید</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadPurchaseReceiptPDF(inv, store);
                          showNotification('فایل رسمی PDF رسید خرید با موفقیت دانلود شد', 'success');
                        }}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                        title="دانلود فایل PDF رسید رسمی"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadPurchaseReceiptPNG(inv, store)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                        title="دانلود تصویر رسید"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="p-1.5 bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 rounded-lg cursor-pointer"
                        title="حذف رسید"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD PURCHASE & CUSTOMER BANK DETAILS */}
      {/* ========================================================================= */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 overflow-y-auto">
          <div className="bg-[#141418] max-w-lg w-full rounded-3xl p-5 border border-zinc-800 shadow-2xl space-y-4 my-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-[#ffd700] flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">ثبت اطلاعات فروشنده و حساب بانکی</h3>
                  <p className="text-[10px] text-zinc-400">واریز وجه و تسویه حساب خرید طلا</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRecordModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary of What We Are Buying */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px]">مبلغ نهایی واریزی به مشتری:</span>
                <span className="text-base font-black text-[#ffd700] font-mono">
                  {formatTomanAmount(
                    targetPurchaseType === 'scrap_jewelry' ? sFinalTotal : targetPurchaseType === 'parsian' ? pFinalTotal : mFinalTotal
                  )}{' '}
                  تومان
                </span>
              </div>
              <span className="text-[11px] bg-zinc-900 text-zinc-300 px-2.5 py-1 rounded-xl border border-zinc-800">
                {targetPurchaseType === 'scrap_jewelry' ? `طلای ۷۴۰ (${sWeight} گرم)` : targetPurchaseType === 'parsian' ? `پارسیان (${pWeight} گرم)` : `آب‌شده (${mWeight} گرم)`}
              </span>
            </div>

            {/* Customer Inputs */}
            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              
              {/* Optional Contact Selector from Subsidiary Ledger */}
              {accounts && accounts.length > 0 && (
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 space-y-2 text-right">
                  <label className="text-[11px] text-zinc-300 font-bold block">👤 انتخاب طرف حساب معین اشخاص (اختیاری):</label>
                  
                  <div className="relative">
                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setShowContactDropdown(!showContactDropdown)}
                      className="w-full h-10 px-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl text-white text-xs flex items-center justify-between outline-none focus:border-[#d4af37] transition-all cursor-pointer relative z-10 text-right"
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
                              setCName('');
                              setCPhone('');
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
                                    setCName(acc.name);
                                    setCPhone(acc.phone || '');
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
                        <span>ثبت اتوماتیک خرید در دفتر معین</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={instantCashSettle}
                          onChange={(e) => setInstantCashSettle(e.target.checked)}
                          className="accent-[#d4af37] rounded"
                        />
                        <span>تسویه نقدی فوری ریالی (پرداخت به مشتری)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-300 font-bold block mb-1">نام و نام خانوادگی مشتری</label>
                  <input
                    type="text"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="مثال: علی احمدی"
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-300 font-bold block mb-1">شماره همراه مشتری</label>
                  <input
                    type="text"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:border-[#d4af37] outline-none text-left"
                  />
                </div>
              </div>

              {/* Row 2: Bank Card Number with Auto-Bank Detection & Fast Camera Scan Button */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-zinc-300 font-bold">شماره کارت بانکی (۱۶ رقمی)</label>
                  <div className="flex items-center gap-1.5">
                    {cBankName && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        بانک مقصد: {cBankName}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startLiveCamera('environment')}
                      className="flex items-center gap-1 text-[11px] bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-[#ffd700] hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-0.5 rounded-lg font-bold cursor-pointer active:scale-95 transition-all shadow-sm shadow-amber-500/10"
                      title="اسکن خودکار شماره کارت با دوربین"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>اسکن با دوربین</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCardNumber(cCardNumber)}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    placeholder="۶۰۳۷ - ۹۹۱۸ - ...."
                    className="w-full h-11 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-sm tracking-wider focus:border-[#d4af37] outline-none text-left"
                  />
                  <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                </div>
                {ocrSuccessFields.card && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>شماره کارت ۱۶ رقمی با موفقیت از تصویر کارت استخراج شد</span>
                  </span>
                )}
              </div>

              {/* Row 3: Bank Name & Account Owner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-zinc-300 font-bold block">نام بانک</label>
                    {ocrSuccessFields.bank && (
                      <span className="text-[9px] text-emerald-400 font-bold">✓ تشخیص از کارت</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={cBankName}
                    onChange={(e) => setCBankName(e.target.value)}
                    placeholder="مثال: بانک ملت / ملی"
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-zinc-300 font-bold block">نام صاحب حساب</label>
                    {ocrSuccessFields.owner && (
                      <span className="text-[9px] text-emerald-400 font-bold">✓ استخراج از کارت</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={cAccountOwner}
                    onChange={(e) => setCAccountOwner(e.target.value)}
                    placeholder="مطابق روی کارت..."
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Sheba Number */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-zinc-300 font-bold">شماره شبا (IBAN)</label>
                  {ocrSuccessFields.shaba && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>شماره شبا از عکس استخراج شد</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={cShaba}
                  onChange={(e) => setCShaba(e.target.value)}
                  placeholder="IR00 0000 0000 0000 0000 0000 00"
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:border-[#d4af37] outline-none text-left uppercase"
                />
              </div>

              {/* Row 5: Card Photo Capture & Upload with Dedicated Camera Access Button */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-[#ffd700] flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-white block">عکس کارت بانکی مشتری:</span>
                      <span className="text-[9px] text-zinc-400">جهت استخراج اتوماتیک شماره کارت، شبا و نام صاحب حساب</span>
                    </div>
                  </div>
                  {cCardImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setCCardImage('');
                        setOcrSuccessFields({});
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف عکس</span>
                    </button>
                  )}
                </div>

                {/* Hidden Native File Inputs for direct system camera and gallery */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleCardImageUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={galleryInputRef}
                  onChange={handleCardImageUpload}
                  className="hidden"
                />

                {cCardImage ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden border border-zinc-700 max-h-44 bg-black flex items-center justify-center group">
                      <img src={cCardImage} alt="کارت مشتری" className="max-h-44 w-full object-contain" />
                      
                      {/* Animated Scanning Beam during OCR */}
                      {isScanningCard && (
                        <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent animate-pulse shadow-[0_0_15px_#ffd700]" />
                          <Loader2 className="w-7 h-7 text-[#ffd700] animate-spin" />
                          <span className="text-xs font-bold text-[#ffd700] bg-black/80 px-3 py-1 rounded-full border border-amber-500/40">
                            در حال استخراج هوشمند شماره کارت و شبا...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* OCR Results Badge Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                      {ocrSuccessFields.card && (
                        <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> شماره کارت استخراج شد
                        </span>
                      )}
                      {ocrSuccessFields.shaba && (
                        <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> شماره شبا استخراج شد
                        </span>
                      )}
                      {ocrSuccessFields.owner && (
                        <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> نام صاحب حساب
                        </span>
                      )}
                      {ocrSuccessFields.bank && (
                        <span className="bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/30 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> {cBankName}
                        </span>
                      )}
                    </div>

                    {/* Actions when photo is present */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startLiveCamera('environment')}
                        className="h-9 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#ffd700]" />
                        <span>عکس‌برداری مجدد با دوربین</span>
                      </button>

                      <button
                        type="button"
                        disabled={isScanningCard}
                        onClick={() => processCardImageOCR(cCardImage)}
                        className="h-9 px-2 bg-amber-500/15 hover:bg-amber-500/25 text-[#ffd700] border border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isScanningCard ? 'در حال اسکن...' : 'اسکن مجدد هوشمند'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No photo yet: Dedicated Camera access button + options */
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => startLiveCamera('environment')}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500/20 via-[#d4af37]/25 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-[#ffd700] border-2 border-dashed border-[#d4af37]/60 hover:border-[#ffd700] rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-amber-500/10 active:scale-98"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700] to-[#b89320] text-black flex items-center justify-center shadow-md shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="text-right flex-1">
                        <div className="font-black text-sm text-white flex items-center gap-1.5">
                          <span>دسترسی به دوربین و عکس از کارت</span>
                          <span className="text-[10px] bg-amber-500/30 text-[#ffd700] border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">اسکن زنده</span>
                        </div>
                        <div className="text-[10px] text-zinc-300 font-normal mt-0.5">
                          عکاسی مستقیم با دوربین و استخراج اتوماتیک شماره کارت ۱۶ رقمی، شبا (IR) و نام بانک
                        </div>
                      </div>
                    </button>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={triggerNativeCamera}
                        className="h-10 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                        <span>دوربین مستقیم گوشی</span>
                      </button>

                      <button
                        type="button"
                        onClick={triggerGallery}
                        className="h-10 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-zinc-400" />
                        <span>انتخاب از گالری / فایل</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Two Action Buttons: Full Confirm vs Skip & Quick Save (As explicitly requested by user) */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => savePurchaseInvoice(false)}
                className="flex-1 h-12 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ثبت خرید و صدور رسید رسمی</span>
              </button>

              <button
                type="button"
                onClick={() => savePurchaseInvoice(true)}
                className="h-12 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                title="ثبت فوری خرید بدون وارد کردن نام و شماره کارت"
              >
                <span>رد کردن و ثبت سریع (Skip)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIVE CAMERA VIEWFINDER MODAL (دوربین زنده اسکن کارت بانکی مشتری) */}
      {/* ========================================================================= */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-60 flex flex-col bg-black/95 backdrop-blur-lg animate-in fade-in duration-200">
          {/* Viewfinder Header */}
          <div className="flex items-center justify-between p-4 bg-zinc-950/90 border-b border-zinc-800 text-white z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-[#ffd700] flex items-center justify-center shadow-md">
                <Camera className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>دوربین اسکن هوشمند کارت مشتری</span>
                  <span className="text-[10px] bg-amber-500/20 text-[#ffd700] border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                    هوش مصنوعی
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400">کارت بانکی را داخل کادر طلایی نگه دارید تا مشخصات خوانده شود</p>
              </div>
            </div>
            <button
              type="button"
              onClick={stopLiveCamera}
              className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video & Card Guide Overlay */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black p-4 select-none">
            {isCameraStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 bg-black/75 text-white text-xs">
                <Loader2 className="w-8 h-8 text-[#ffd700] animate-spin" />
                <span className="font-bold">در حال اتصال و راه‌اندازی دوربین...</span>
              </div>
            )}

            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full max-h-[75vh] object-cover rounded-3xl"
            />

            {/* Target Card Overlay Rectangle (Credit Card Proportions 85.6mm x 53.98mm) */}
            <div className="absolute pointer-events-none w-[90%] max-w-sm aspect-[85.6/53.98] border-2 border-[#ffd700] rounded-2xl shadow-[0_0_35px_rgba(212,175,55,0.4)] flex flex-col justify-between p-3.5 bg-black/10 backdrop-contrast-105">
              {/* Top guide */}
              <div className="flex justify-between items-center text-[10px] text-[#ffd700] font-mono">
                <span className="bg-black/70 px-2 py-0.5 rounded-lg border border-amber-500/30 backdrop-blur-sm">لوگوی بانک</span>
                <span className="bg-black/70 px-2 py-0.5 rounded-lg border border-amber-500/30 backdrop-blur-sm">عضو شتاب</span>
              </div>

              {/* Center Card Number Scan Line Guide */}
              <div className="space-y-1.5">
                <div className="h-0.5 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent animate-pulse shadow-[0_0_12px_#ffd700]" />
                <div className="text-center">
                  <span className="text-[11px] font-bold text-white bg-black/80 px-3.5 py-1 rounded-full border border-amber-500/60 shadow-lg backdrop-blur-md inline-block">
                    کادر شماره کارت ۱۶ رقمی و شماره شبا
                  </span>
                </div>
              </div>

              {/* Bottom guide */}
              <div className="flex justify-between items-center text-[10px] text-zinc-300">
                <span className="bg-black/70 px-2 py-0.5 rounded-lg border border-zinc-700 backdrop-blur-sm">نام دارنده کارت</span>
                <span className="bg-black/70 px-2 py-0.5 rounded-lg border border-zinc-700 backdrop-blur-sm">IR...</span>
              </div>
            </div>
          </div>

          {/* Viewfinder Bottom Controls */}
          <div className="p-4 bg-zinc-950/95 border-t border-zinc-800 flex items-center justify-around z-10 pb-safe">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white text-[10px] cursor-pointer active:scale-95 transition-all"
              title="چرخش دوربین جلو / پشت"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-zinc-300" />
              </div>
              <span className="font-bold">تغییر دوربین</span>
            </button>

            {/* Main Shutter Button */}
            <button
              type="button"
              onClick={captureLiveSnapshot}
              disabled={isCameraStarting}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#ffd700] to-amber-300 p-1.5 shadow-2xl shadow-amber-500/40 active:scale-90 transition-all cursor-pointer disabled:opacity-50"
              title="ثبت عکس کارت و استخراج خودکار مشخصات"
            >
              <div className="w-full h-full rounded-full border-4 border-black/40 bg-white/20 flex items-center justify-center">
                <Camera className="w-9 h-9 text-black" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                stopLiveCamera();
                triggerNativeCamera();
              }}
              className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white text-[10px] cursor-pointer active:scale-95 transition-all"
              title="باز کردن دوربین پیش‌فرض سیستم"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-zinc-300" />
              </div>
              <span className="font-bold">دوربین گوشی</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LIVE PURCHASE RECEIPT PREVIEW (رسید خرید رسمی طلا) */}
      {/* ========================================================================= */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 overflow-y-auto">
          <div className="bg-[#18181c] max-w-lg w-full rounded-3xl p-4 sm:p-5 border border-zinc-700 shadow-2xl space-y-4 my-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#ffd700]" />
                <h3 className="text-sm font-black text-white">رسید رسمی خرید طلا #{activeReceipt.receiptNumber}</h3>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* RECEIPT PAPER CONTAINER (LUXURY PARCHMENT EFFECT) */}
            <div className="bg-gradient-to-b from-[#fdfbf7] to-[#f6f2e8] text-zinc-900 p-4 sm:p-5 rounded-2xl border-2 border-[#d4af37] shadow-xl space-y-3.5 text-xs relative overflow-hidden">
              
              {/* Header */}
              <div className="text-center pb-2 border-b border-zinc-300">
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
                <h3 className="text-base font-black text-zinc-900">{store.name}</h3>
                <p className="text-[11px] font-bold text-amber-800">رسید رسمی خرید طلا و تسویه حساب</p>
                <div className="flex justify-between items-center text-[10px] text-zinc-600 mt-1">
                  <span>رسید: #{activeReceipt.receiptNumber}</span>
                  <span>{activeReceipt.dateFa} - {activeReceipt.timeFa}</span>
                </div>
              </div>

              {/* Customer and Bank Info */}
              <div className="bg-white/80 p-2.5 rounded-xl border border-zinc-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">فروشنده (مشتری):</span>
                  <span className="font-bold">{activeReceipt.customerName || 'مشتری حضوری'}</span>
                </div>
                {activeReceipt.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">تلفن همراه:</span>
                    <span className="font-mono">{activeReceipt.customerPhone}</span>
                  </div>
                )}
                {activeReceipt.bankInfo?.cardNumber && (
                  <div className="flex justify-between pt-1 border-t border-zinc-100">
                    <span className="text-zinc-500">شماره کارت بانکی:</span>
                    <span className="font-mono font-bold text-blue-900">{activeReceipt.bankInfo.cardNumber}</span>
                  </div>
                )}
                {activeReceipt.bankInfo?.bankName && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">بانک و صاحب حساب:</span>
                    <span>{activeReceipt.bankInfo.bankName} - {activeReceipt.bankInfo.accountOwnerName}</span>
                  </div>
                )}
                {activeReceipt.bankInfo?.shabaNumber && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">شماره شبا:</span>
                    <span className="font-mono text-[10px]">{activeReceipt.bankInfo.shabaNumber}</span>
                  </div>
                )}
              </div>

              {/* Gold Specifications */}
              <div className="space-y-1.5 bg-white/90 p-3 rounded-xl border border-zinc-200">
                <div className="flex justify-between font-bold">
                  <span>شرح طلا:</span>
                  <span>{activeReceipt.itemTitle}</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>وزن ناخالص:</span>
                  <span className="font-mono font-bold">{activeReceipt.rawWeight} گرم (عیار {activeReceipt.sourceKarat})</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>وزن معادل ۷۵۰ استاندارد:</span>
                  <span className="font-mono font-bold text-amber-900">{activeReceipt.standardWeight750} گرم</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>نرخ هر گرم ۱۸ عیار:</span>
                  <span className="font-mono">{formatTomanAmount(activeReceipt.goldPriceUsed)} ت</span>
                </div>
                {activeReceipt.discountAmount && activeReceipt.discountAmount > 0 ? (
                  <div className="flex justify-between text-red-700">
                    <span>کسر خرید ({activeReceipt.discountPercent}٪):</span>
                    <span className="font-mono">-{formatTomanAmount(activeReceipt.discountAmount)} ت</span>
                  </div>
                ) : null}
                {activeReceipt.engCode && (
                  <div className="flex justify-between text-zinc-700 text-[10px] pt-1 border-t border-zinc-100">
                    <span>کد انگ و آزمایشگاه:</span>
                    <span className="font-mono font-bold">{activeReceipt.engCode} - {activeReceipt.labName || '---'}</span>
                  </div>
                )}
              </div>

              {/* Total Banner */}
              <div className="bg-amber-100/90 p-3 rounded-xl border border-amber-300 flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-amber-950 block">مبلغ کل پرداخت‌شده به مشتری:</span>
                  <span className="text-[9px] text-zinc-600">تسویه و تایید شده</span>
                </div>
                <span className="text-xl font-black text-amber-950 font-mono">
                  {formatTomanAmount(activeReceipt.totalPayable)} تومان
                </span>
              </div>

              {/* Stamp and Store Guarantee */}
              <div className="pt-2 border-t border-zinc-300 flex justify-between items-end text-[10px] text-zinc-500">
                <div>
                  <p>امضاء و اثر انگشت فروشنده</p>
                  <div className="h-8 w-24 border border-dashed border-zinc-400 rounded mt-1" />
                </div>
                <div className="text-center">
                  <div className="w-20 h-10 border border-red-500/70 rounded-full flex items-center justify-center text-[9px] font-black text-red-600 rotate-[-4deg]">
                    تایید و تسویه شد
                  </div>
                </div>
              </div>

            </div>

            {/* SHARE & DOWNLOAD ACTIONS */}
            <div className="space-y-2 pt-1 text-xs">
              
              {/* Row 0: Download Standard PDF */}
              <button
                type="button"
                onClick={() => {
                  downloadPurchaseReceiptPDF(activeReceipt, store);
                  showNotification('فایل رسمی PDF رسید خرید با موفقیت دانلود شد', 'success');
                }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-[#d4af37] text-black font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>📥 دانلود فایل PDF رسمی رسید (نسخه A4 استاندارد)</span>
              </button>

              {/* Row 1: Download PNG & SMS */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => downloadPurchaseReceiptPNG(activeReceipt, store)}
                  className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4 text-[#d4af37]" />
                  <span>دانلود عکس رسید (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const smsText = `رسید خرید طلا - ${store.name}\n` +
                      `شماره رسید: ${activeReceipt.receiptNumber}\n` +
                      `شرح: ${activeReceipt.itemTitle}\n` +
                      `وزن: ${activeReceipt.rawWeight} گرم\n` +
                      `مبلغ پرداختی: ${formatTomanAmount(activeReceipt.totalPayable)} تومان\n` +
                      `تسویه و تایید گردید.`;
                    const cleanPhone = activeReceipt.customerPhone ? toEnglishDigits(activeReceipt.customerPhone).replace(/[^0-9]/g, '') : '';
                    window.location.href = cleanPhone ? `sms:${cleanPhone}?body=${encodeURIComponent(smsText)}` : `sms:?body=${encodeURIComponent(smsText)}`;
                  }}
                  className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>ارسال پیامک (SMS)</span>
                </button>
              </div>

              {/* Row 2: WhatsApp & Telegram */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `رسید خرید طلا - گالری ${store.name}\n` +
                      `شماره رسید: ${activeReceipt.receiptNumber}\n` +
                      `فروشنده: ${activeReceipt.customerName || 'مشتری'}\n` +
                      `شرح: ${activeReceipt.itemTitle}\n` +
                      `وزن: ${activeReceipt.rawWeight} گرم (معادل ۷۵۰: ${activeReceipt.standardWeight750} گرم)\n` +
                      `مبلغ واریز شده: ${formatTomanAmount(activeReceipt.totalPayable)} تومان\n` +
                      `حساب/کارت: ${activeReceipt.bankInfo?.cardNumber || 'تسویه نقدی'}`;
                    const phone = activeReceipt.customerPhone ? toEnglishDigits(activeReceipt.customerPhone).replace(/^0/, '98') : '';
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-900/60"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>اشتراک در واتساپ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = `رسید خرید طلا - گالری ${store.name}\n` +
                      `رسید: ${activeReceipt.receiptNumber}\n` +
                      `مبلغ: ${formatTomanAmount(activeReceipt.totalPayable)} تومان\n` +
                      `شرح: ${activeReceipt.itemTitle}`;
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="h-10 rounded-xl bg-sky-950/60 border border-sky-500/30 text-sky-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-sky-900/60"
                >
                  <Send className="w-4 h-4" />
                  <span>اشتراک در تلگرام</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* CUSTOM DIALOG: DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (() => {
        const docToDel = purchases.find(p => p.id === deleteConfirmId);
        if (!docToDel) return null;
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#141418] max-w-sm w-full rounded-3xl p-5 border border-zinc-800 shadow-2xl space-y-4 text-xs text-right">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-rose-500">
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <h3 className="text-sm font-black text-white">حذف قطعی رسید خرید</h3>
              </div>
              
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                آیا از حذف دائمی رسید خرید به شماره‌ی <strong className="text-white font-mono">#{docToDel.receiptNumber}</strong> اطمینان کامل دارید؟
                <br />
                <span className="text-rose-400 font-bold block mt-1.5">⚠️ هشدار: این عملیات به صورت مستقیم از سیستم حسابداری معین پاک می‌شود و غیر قابل بازگشت است.</span>
              </p>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold border border-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteInvoice(deleteConfirmId)}
                  className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-600/10"
                >
                  تأیید و حذف نهایی
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
export default GoldPurchase;
