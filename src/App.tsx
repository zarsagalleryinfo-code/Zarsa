import React, { useState, useEffect, useRef } from 'react';
import { 
  Coins, 
  Settings as SettingsIcon, 
  Download, 
  Copy, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Smartphone, 
  SlidersHorizontal, 
  Eye, 
  EyeOff, 
  Instagram, 
  Phone, 
  MapPin, 
  Calculator,
  Share2,
  Receipt,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Clock,
  ExternalLink,
  ChevronDown,
  Info,
  ShoppingBag,
  Bookmark,
  Save,
  Wand2,
  Upload,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { CoinCatalogItem, ParsianCatalogItem, StoreSettings, SaleInvoice, PurchaseInvoice, StoryPreset, ContactAccount } from './types';
import GoldenCalculator from './components/GoldenCalculator';
import { AdvancedCalculator } from './components/AdvancedCalculator';
import GoldPurchase from './components/GoldPurchase';
import SalesLog from './components/SalesLog';
import { downloadInvoicePNG } from './utils/invoicePng';
import { applyRounding } from './utils/rounding';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { useOnlineStatus } from './components/useOnlineStatus';

// Card visual formats
type CardFormat = 'square' | 'portrait' | 'full' | 'receipt' | 'story';

interface CardTheme {
  id: string;
  name: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  bgColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  accentColor: string;
  priceColor: string;
  tagBg: string;
}

const CARD_THEMES: CardTheme[] = [
  {
    id: 'luxury-gold',
    name: 'مشکی طلایی سلطنتی',
    bgGradientStart: '#141416',
    bgGradientEnd: '#08080a',
    bgColor: '#0c0c0e',
    cardBg: '#18181c',
    cardBorder: 'rgba(212, 175, 55, 0.35)',
    textColor: '#f5f2ed',
    accentColor: '#d4af37',
    priceColor: '#ffd700',
    tagBg: 'rgba(212, 175, 55, 0.15)'
  },
  {
    id: 'ivory-minimal',
    name: 'سفید مرواریدی لوکس',
    bgGradientStart: '#ffffff',
    bgGradientEnd: '#f4ede4',
    bgColor: '#faf8f5',
    cardBg: '#ffffff',
    cardBorder: 'rgba(180, 140, 40, 0.25)',
    textColor: '#262626',
    accentColor: '#8c6b1b',
    priceColor: '#70520a',
    tagBg: 'rgba(180, 140, 40, 0.1)'
  },
  {
    id: 'emerald-royal',
    name: 'سبز زمردی صرافی',
    bgGradientStart: '#062615',
    bgGradientEnd: '#021008',
    bgColor: '#03140a',
    cardBg: '#092415',
    cardBorder: 'rgba(16, 185, 129, 0.35)',
    textColor: '#f0fdf4',
    accentColor: '#10b981',
    priceColor: '#aeffc5',
    tagBg: 'rgba(16, 185, 129, 0.15)'
  },
  {
    id: 'sapphire-navy',
    name: 'سرمه‌ای اقیانوسی',
    bgGradientStart: '#061d33',
    bgGradientEnd: '#020c17',
    bgColor: '#030f1d',
    cardBg: '#082542',
    cardBorder: 'rgba(56, 189, 248, 0.35)',
    textColor: '#f0f9ff',
    accentColor: '#38bdf8',
    priceColor: '#bae6fd',
    tagBg: 'rgba(56, 189, 248, 0.15)'
  },
  {
    id: 'occasional-crimson',
    name: 'سرخ مناسبتی (یلدا/نوروز)',
    bgGradientStart: '#420412',
    bgGradientEnd: '#140106',
    bgColor: '#24020a',
    cardBg: '#3d030c',
    cardBorder: 'rgba(251, 191, 36, 0.45)',
    textColor: '#fffbeb',
    accentColor: '#fbbf24',
    priceColor: '#ffd700',
    tagBg: 'rgba(251, 191, 36, 0.2)'
  }
];

const BUILT_IN_STORY_PRESETS: StoryPreset[] = [
  {
    id: 'preset-comprehensive',
    name: '📊 تابلوی جامع نرخ بازار',
    themeId: 'luxury-gold',
    format: 'story',
    includeGoldRate: true,
    includeCoins: true,
    includeParsians: true,
    includeScrap: true,
    includeOunce: true,
    includeContact: true,
    includeNote: true,
    isCustom: false
  },
  {
    id: 'preset-morning',
    name: '☀️ نرخ روز و مظنه (صبحگاهی)',
    themeId: 'luxury-gold',
    format: 'story',
    includeGoldRate: true,
    includeCoins: false,
    includeParsians: false,
    includeScrap: false,
    includeOunce: true,
    includeContact: true,
    includeNote: true,
    isCustom: false
  },
  {
    id: 'preset-invest',
    name: '🪙 ویترین مسکوکات و سرمایه‌گذاری',
    themeId: 'emerald-royal',
    format: 'story',
    includeGoldRate: true,
    includeCoins: true,
    includeParsians: true,
    includeScrap: false,
    includeOunce: false,
    includeContact: true,
    includeNote: false,
    isCustom: false
  },
  {
    id: 'preset-minimal-ivory',
    name: '✨ استوری مینیمال سفید مرواریدی',
    themeId: 'ivory-minimal',
    format: 'story',
    includeGoldRate: true,
    includeCoins: true,
    includeParsians: false,
    includeScrap: true,
    includeOunce: true,
    includeContact: true,
    includeNote: false,
    isCustom: false
  },
  {
    id: 'preset-crimson',
    name: '🏮 تم ویژه سرخ مناسبتی',
    themeId: 'occasional-crimson',
    format: 'story',
    includeGoldRate: true,
    includeCoins: true,
    includeParsians: true,
    includeScrap: true,
    includeOunce: true,
    includeContact: true,
    includeNote: true,
    isCustom: false
  },
  {
    id: 'preset-receipt',
    name: '🧾 پیش‌فاکتور و استعلام مشتری',
    themeId: 'ivory-minimal',
    format: 'receipt',
    includeGoldRate: true,
    includeCoins: false,
    includeParsians: false,
    includeScrap: false,
    includeOunce: false,
    includeContact: true,
    includeNote: false,
    isCustom: false
  }
];

export default function App() {
  const isOnline = useOnlineStatus();
  // Mobile active tab: 'calculator' by default as requested by user
  const [activeTab, setActiveTab] = useState<'prices' | 'calculator' | 'purchase' | 'advanced' | 'sales' | 'catalog' | 'card' | 'settings'>('calculator');

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (e) {
        // Safe catch for vibration security restrictions
      }
    }
  };

  // Core rates synchronized with backend
  const [goldPrice, setGoldPrice] = useState(3450000);
  const [globalOunce, setGlobalOunce] = useState(2034.50);
  const [dailyNote, setDailyNote] = useState('اعتبار قیمت‌ها تا ساعت ۱۸ امروز معتبر است');
  const [taxEnabledGlobal, setTaxEnabledGlobal] = useState<boolean>(true);

  // Persistent Sales Invoices Log
  const [invoices, setInvoices] = useState<SaleInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('zarsa_sales_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('zarsa_sales_invoices', JSON.stringify(invoices));
    } catch (err) {
      console.error('Failed to save invoices to storage', err);
    }
  }, [invoices]);

  // Persistent Purchase Invoices Log (Centrally managed in App.tsx)
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() => {
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
      console.error('Failed to save purchase invoices to storage', err);
    }
  }, [purchases]);

  // Persistent Contact Accounts (Bazaari Subsidiary Ledger)
  const [accounts, setAccounts] = useState<ContactAccount[]>(() => {
    try {
      const saved = localStorage.getItem('zarsa_contact_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('zarsa_contact_accounts', JSON.stringify(accounts));
    } catch (err) {
      console.error('Failed to save contact accounts to storage', err);
    }
  }, [accounts]);

  const handleSaveInvoice = (newInv: SaleInvoice) => {
    setInvoices(prev => [newInv, ...prev]);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
    showNotification('فاکتور با موفقیت حذف شد', 'amber');
  };

  const handleDeletePurchase = (id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
    showNotification('رسید خرید با موفقیت حذف شد', 'amber');
  };

  const handleExportInvoicePNG = (inv: SaleInvoice) => {
    try {
      downloadInvoicePNG(inv, store);
      showNotification(`فاکتور #${inv.invoiceNumber} با کیفیت عالی دانلود شد`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('خطا در صدور فایل تصویری فاکتور', 'error');
    }
  };

  const [store, setStore] = useState<StoreSettings>(() => {
    const defaultPrintSettings = {
      showRawGoldRate: true,
      showRawGoldValue: true,
      showFee: true,
      showProfit: true,
      showTax: true,
      showQR: true,
      showTerms: true,
      showStamp: true,
      showFingerprint: true
    };

    try {
      const saved = localStorage.getItem('zarsa_store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.rounding) {
          parsed.rounding = { enabled: true, step: 1000, direction: 'nearest' };
        }
        if (!parsed.logo) {
          parsed.logo = '/assets/app-icon.svg';
        }
        if (!parsed.invoicePrintSettings) {
          parsed.invoicePrintSettings = defaultPrintSettings;
        }
        return parsed;
      }
    } catch {}
    return {
      name: 'گالری طلا زرسا',
      ownerName: 'محمدرضا خلیلی',
      address: 'تهران، بازار زرگران، پلاک ۱۲',
      postalCode: '۱۱۶۳۶۱۴۱۱۱',
      phone: '۰۲۱-۵۵۶۲۳۳۴۴',
      instagram: 'zarsa.gold',
      logo: '/assets/app-icon.svg',
      watermarkText: 'Zarsa Gold Gallery',
      stamp: 'گالری طلا زرسا - تایید و تسویه شد',
      signature: 'مهر و امضای مجاز فروشگاه',
      rounding: {
        enabled: true,
        step: 1000,
        direction: 'nearest'
      },
      invoicePrintSettings: defaultPrintSettings
    };
  });

  // Preloaded logo image for high-resolution canvas rendering
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = store.logo || '/assets/app-icon.svg';
    img.onload = () => {
      logoImageRef.current = img;
    };
  }, [store.logo]);

  const [coins, setCoins] = useState<CoinCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('zarsa_catalog_coins');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [parsians, setParsians] = useState<ParsianCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('zarsa_catalog_parsians');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    if (parsians.length > 0) {
      try {
        localStorage.setItem('zarsa_catalog_parsians', JSON.stringify(parsians));
      } catch {}
    }
  }, [parsians]);

  useEffect(() => {
    if (coins.length > 0) {
      try {
        localStorage.setItem('zarsa_catalog_coins', JSON.stringify(coins));
      } catch {}
    }
  }, [coins]);
  
  // Card share state
  const [selectedFormat, setSelectedFormat] = useState<CardFormat>('story');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('luxury-gold');
  const [isExiting, setIsExiting] = useState(false);
  const activeTheme = CARD_THEMES.find(t => t.id === selectedThemeId) || CARD_THEMES[0];

  const handleSelectFormat = (format: CardFormat) => {
    if (format === selectedFormat) return;
    setIsExiting(true);
    setTimeout(() => {
      setSelectedFormat(format);
      setIsExiting(false);
    }, 120);
  };

  const handleSelectTheme = (themeId: string) => {
    if (themeId === selectedThemeId) return;
    setIsExiting(true);
    setTimeout(() => {
      setSelectedThemeId(themeId);
      setIsExiting(false);
    }, 120);
  };
  const [includeGoldRateInCard, setIncludeGoldRateInCard] = useState(true);
  const [includeCoinsInCard, setIncludeCoinsInCard] = useState(true);
  const [includeParsiansInCard, setIncludeParsiansInCard] = useState(true);
  const [includeScrapInCard, setIncludeScrapInCard] = useState(true);
  const [includeOunceInCard, setIncludeOunceInCard] = useState(true);
  const [includeContactInCard, setIncludeContactInCard] = useState(true);
  const [includeNoteInCard, setIncludeNoteInCard] = useState(true);

  // Custom Story Presets
  const [customPresets, setCustomPresets] = useState<StoryPreset[]>(() => {
    try {
      const saved = localStorage.getItem('zarsa_story_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Resilient custom React-based confirm/prompt replacement state for sandboxed environments
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'prompt';
    title: string;
    message: string;
    defaultValue?: string;
    inputValue?: string;
    onConfirm: (val?: string) => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, callback: () => void) => {
    setModalDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        callback();
        setModalDialog(null);
      }
    });
  };

  const triggerPrompt = (title: string, message: string, defaultValue: string, callback: (val: string) => void) => {
    setModalDialog({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      defaultValue,
      inputValue: defaultValue,
      onConfirm: (val) => {
        if (val !== undefined) {
          callback(val);
        }
        setModalDialog(null);
      }
    });
  };
  const [activePresetId, setActivePresetId] = useState<string>('preset-comprehensive');
  const [showSavePresetModal, setShowSavePresetModal] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');

  const allPresets = [
    ...customPresets,
    ...BUILT_IN_STORY_PRESETS
  ];

  const handleApplyPreset = (preset: StoryPreset) => {
    setActivePresetId(preset.id);
    setIsExiting(true);
    setTimeout(() => {
      setSelectedFormat(preset.format);
      setSelectedThemeId(preset.themeId);
      setIncludeGoldRateInCard(preset.includeGoldRate);
      setIncludeCoinsInCard(preset.includeCoins);
      setIncludeParsiansInCard(preset.includeParsians);
      setIncludeScrapInCard(preset.includeScrap);
      setIncludeOunceInCard(preset.includeOunce);
      setIncludeContactInCard(preset.includeContact);
      setIncludeNoteInCard(preset.includeNote);
      setIsExiting(false);
      showNotification(`ترکیب «${preset.name}» با موفقیت بارگذاری شد`, 'success');
    }, 120);
  };

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim()) {
      showNotification('لطفاً یک نام برای این ترکیب وارد کنید', 'amber');
      return;
    }
    const newPreset: StoryPreset = {
      id: 'custom_preset_' + Date.now(),
      name: newPresetName.trim(),
      isCustom: true,
      themeId: selectedThemeId,
      format: selectedFormat,
      includeGoldRate: includeGoldRateInCard,
      includeCoins: includeCoinsInCard,
      includeParsians: includeParsiansInCard,
      includeScrap: includeScrapInCard,
      includeOunce: includeOunceInCard,
      includeContact: includeContactInCard,
      includeNote: includeNoteInCard
    };
    const updated = [newPreset, ...customPresets];
    setCustomPresets(updated);
    try {
      localStorage.setItem('zarsa_story_presets', JSON.stringify(updated));
    } catch {}
    setActivePresetId(newPreset.id);
    setNewPresetName('');
    setShowSavePresetModal(false);
    showNotification(`ترکیب «${newPreset.name}» با موفقیت ذخیره و فعال شد`, 'success');
  };

  const handleDeleteCustomPreset = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem('zarsa_story_presets', JSON.stringify(updated));
    } catch {}
    if (activePresetId === id) {
      setActivePresetId(BUILT_IN_STORY_PRESETS[0].id);
    }
    showNotification(`ترکیب «${name}» حذف شد`, 'amber');
  };

  // Jewelry Calculator state
  const [calcWeight, setCalcWeight] = useState<number>(3.5);
  const [calcFeeType, setCalcFeeType] = useState<'percentage' | 'fixed'>('percentage');
  const [calcFeePercent, setCalcFeePercent] = useState<number>(12);
  const [calcFeeFixed, setCalcFeeFixed] = useState<number>(250000);
  const [calcProfitPercent, setCalcProfitPercent] = useState<number>(7);
  const [calcTaxPercent, setCalcTaxPercent] = useState<number>(9);
  const [calcCustomerName, setCalcCustomerName] = useState<string>('');
  const [calcItemDescription, setCalcItemDescription] = useState<string>('دستبند کارتیه طلا ۱۸ عیار');

  // Catalog tab filtering
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'coins' | 'parsians'>('all');

  // New item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemType, setNewItemType] = useState<'coin' | 'parsian'>('coin');
  const [newItemName, setNewItemName] = useState('');
  const [newItemWeight, setNewItemWeight] = useState(1);
  const [newItemKarat, setNewItemKarat] = useState('22');
  const [newItemBubble, setNewItemBubble] = useState(500000);
  const [newItemFeeFixed, setNewItemFeeFixed] = useState(150000);

  // Status & notifications
  const [savingSettings, setSavingSettings] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'amber' | 'error' } | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Hidden canvas reference for rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persian date & time
  const getPersianDate = () => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return 'امروز';
    }
  };

  const getPersianTime = () => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date());
    } catch {
      return '۱۲:۰۰';
    }
  };

  const showNotification = (message: string, type: 'success' | 'amber' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Load settings on startup
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.goldPrice) setGoldPrice(data.goldPrice);
          if (data.globalOunce) setGlobalOunce(data.globalOunce);
          if (data.dailyNote) setDailyNote(data.dailyNote);
          if (data.store) {
            setStore(prev => {
              const updated = { 
                ...prev, 
                ...data.store,
                logo: data.store.logo || prev.logo || '/assets/app-icon.svg',
                invoicePrintSettings: data.store.invoicePrintSettings || prev.invoicePrintSettings || {
                  showRawGoldRate: true,
                  showRawGoldValue: true,
                  showFee: true,
                  showProfit: true,
                  showTax: true,
                  showQR: true,
                  showTerms: true,
                  showStamp: true,
                  showFingerprint: true
                }
              };
              localStorage.setItem('zarsa_store_settings', JSON.stringify(updated));
              return updated;
            });
          }
          if (data.coins) setCoins(data.coins);
          if (data.parsians) setParsians(data.parsians);
          if (data.accounts) setAccounts(data.accounts);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Save settings to backend and localStorage
  const handleSaveSettings = async (showToast = true) => {
    setSavingSettings(true);
    try {
      localStorage.setItem('zarsa_store_settings', JSON.stringify(store));
      const payload = {
        goldPrice,
        globalOunce,
        dailyNote,
        store,
        coins,
        parsians,
        accounts
      };
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (showToast) showNotification('اطلاعات فروشگاه با موفقیت ذخیره شد', 'success');
      } else {
        if (showToast) showNotification('اطلاعات در دستگاه ذخیره شد', 'success');
      }
    } catch {
      if (showToast) showNotification('اطلاعات در دستگاه ذخیره شد', 'success');
    } finally {
      setSavingSettings(false);
    }
  };

  // Price calculations for coins and parsians
  const calculateFinalPrice = (item: CoinCatalogItem | ParsianCatalogItem, isCoin: boolean) => {
    let itemKaratVal = 18;
    if (item.karat) {
      const parsedKarat = parseFloat(item.karat);
      if (!isNaN(parsedKarat) && parsedKarat > 0) {
        itemKaratVal = parsedKarat;
      }
    } else {
      itemKaratVal = isCoin ? 22 : 18;
    }

    const G = (goldPrice * itemKaratVal) / 18;
    const W = item.weight;
    let A = 0;
    if (item.feeType === 'percentage') {
      A = (G * item.feePercentage) / 100;
    } else {
      A = item.feeFixed;
    }

    const T = item.tax;
    const H = item.bubble;

    let preRoundValue = 0;
    if (item.stepEnabled) {
      const baseGramPrice = G + A;
      const baseWeightValue = baseGramPrice * W;
      const withTax = baseWeightValue * (1 + T);
      preRoundValue = withTax + H;
    } else {
      try {
        let expr = (item.manualFormula || '(G+A)*W*(1+T)+H')
          .toUpperCase()
          .replace(/G/g, String(G))
          .replace(/W/g, String(W))
          .replace(/A/g, String(A))
          .replace(/T/g, String(T))
          .replace(/H/g, String(H))
          .replace(/[^0-9+\-*/().\s]/g, '');
        const fn = Function(`"use strict"; return (${expr})`);
        preRoundValue = fn() || 0;
      } catch {
        preRoundValue = (G + A) * W * (1 + T) + H;
      }
    }

    if (isCoin) {
      return Math.round(preRoundValue / 10000) * 10000;
    } else {
      return Math.round(preRoundValue / 1000) * 1000;
    }
  };

  // Live gold jewelry calculation
  const calculateJewelryQuote = () => {
    const rawGoldValue = calcWeight * goldPrice;
    let feeValue = 0;
    if (calcFeeType === 'percentage') {
      feeValue = rawGoldValue * (calcFeePercent / 100);
    } else {
      feeValue = calcWeight * calcFeeFixed;
    }

    const profitValue = (rawGoldValue + feeValue) * (calcProfitPercent / 100);
    // Tax applies to fee + profit per current Iranian law
    const taxValue = (feeValue + profitValue) * (calcTaxPercent / 100);
    const finalTotal = rawGoldValue + feeValue + profitValue + taxValue;

    return {
      rawGoldValue: Math.round(rawGoldValue),
      feeValue: Math.round(feeValue),
      profitValue: Math.round(profitValue),
      taxValue: Math.round(taxValue),
      finalTotal: Math.round(finalTotal / 1000) * 1000
    };
  };

  const quote = calculateJewelryQuote();

  // Quick price adjuster
  const adjustGoldPrice = (diff: number) => {
    const next = Math.max(100000, goldPrice + diff);
    setGoldPrice(next);
  };

  // Convert number to Persian digits with separator
  const formatToman = (num: number) => {
    return num.toLocaleString('fa-IR') + ' تومان';
  };

  // Toggle item visibility in share cards
  const toggleItemVisibility = (id: string, isCoin: boolean) => {
    if (isCoin) {
      setCoins(coins.map(c => c.id === id ? { ...c, isHidden: !c.isHidden } : c));
    } else {
      setParsians(parsians.map(p => p.id === id ? { ...p, isHidden: !p.isHidden } : p));
    }
  };

  // Generate plain text summary for WhatsApp / Telegram
  const generateBroadcastText = () => {
    const dateStr = getPersianDate();
    const timeStr = getPersianTime();
    const mazaneh = Math.round((goldPrice * 4.6083 * 17) / 18);

    let text = `👑 ${store.name}\n`;
    text += `📅 ${dateStr} - ساعت ${timeStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🪙 نرخ هر گرم طلا ۱۸ عیار: ${goldPrice.toLocaleString('fa-IR')} تومان\n`;
    text += `📊 مظنه مثقال طلا: ${mazaneh.toLocaleString('fa-IR')} تومان\n`;
    if (includeOunceInCard) {
      text += `🌐 انس جهانی طلا: $${globalOunce.toLocaleString()}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━\n`;

    const activeCoins = coins.filter(c => !c.isHidden);
    if (activeCoins.length > 0 && includeCoinsInCard) {
      text += `💰 قیمت مسکوکات بانکی:\n`;
      activeCoins.forEach(c => {
        text += `▫️ ${c.name}: ${calculateFinalPrice(c, true).toLocaleString('fa-IR')} تومان\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
    }

    const activeParsians = parsians.filter(p => !p.isHidden);
    if (activeParsians.length > 0 && includeParsiansInCard) {
      text += `✨ قیمت شمش‌های پارسیان:\n`;
      activeParsians.forEach(p => {
        text += `▫️ ${p.name}: ${calculateFinalPrice(p, false).toLocaleString('fa-IR')} تومان\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
    }

    if (dailyNote && includeNoteInCard) {
      text += `📌 ${dailyNote}\n\n`;
    }

    if (includeContactInCard) {
      text += `📞 تلفن: ${store.phone}\n`;
      text += `📲 اینستاگرام: @${store.instagram}\n`;
      text += `📍 ${store.address}\n`;
    }

    return text;
  };

  // Copy broadcast text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateBroadcastText());
      setCopiedText(true);
      showNotification('متن قیمت‌ها در حافظه کپی شد', 'success');
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      showNotification('خطا در کپی متن', 'error');
    }
  };

  // Draw high-resolution canvas for card export with generous spacing, zero clipping & large fonts
  const renderCardToCanvas = (): HTMLCanvasElement | null => {
    const currentTheme = CARD_THEMES.find(t => t.id === selectedThemeId) || CARD_THEMES[0];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const fontBase = 'Vazirmatn, sans-serif';

    // RENDER: RECEIPT / QUOTE SLIP
    if (selectedFormat === 'receipt') {
      const width = 1100;
      const height = 1500;
      canvas.width = width;
      canvas.height = height;

      // Draw background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, currentTheme.bgGradientStart);
      bgGrad.addColorStop(1, currentTheme.bgGradientEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient golden radial glow
      const radial = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, width * 0.85);
      radial.addColorStop(0, 'rgba(212, 175, 55, 0.16)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // Outer luxury double border
      ctx.strokeStyle = currentTheme.cardBorder;
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, width - 80, height - 80);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 50, width - 100, height - 100);

      ctx.textAlign = 'center';
      
      // Store Header & Logo
      const currentLogo = logoImageRef.current;
      if (currentLogo && currentLogo.complete && currentLogo.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, 95, 36, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(currentLogo, width / 2 - 36, 95 - 36, 72, 72);
        ctx.restore();

        ctx.strokeStyle = currentTheme.accentColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(width / 2, 95, 36, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = currentTheme.accentColor;
        ctx.font = `bold 44px ${fontBase}`;
        ctx.fillText(store.name, width / 2, 175);

        ctx.fillStyle = currentTheme.textColor;
        ctx.font = `bold 22px ${fontBase}`;
        ctx.fillText('پیش‌فاکتور و استعلام رسمی قیمت طلا', width / 2, 218);

        ctx.fillStyle = '#a1a1aa';
        ctx.font = `normal 19px ${fontBase}`;
        ctx.fillText(`${getPersianDate()} · ساعت ${getPersianTime()}`, width / 2, 255);
      } else {
        ctx.fillStyle = currentTheme.accentColor;
        ctx.font = `bold 48px ${fontBase}`;
        ctx.fillText(store.name, width / 2, 130);

        ctx.fillStyle = currentTheme.textColor;
        ctx.font = `bold 24px ${fontBase}`;
        ctx.fillText('پیش‌فاکتور و استعلام رسمی قیمت طلا', width / 2, 185);

        ctx.fillStyle = '#a1a1aa';
        ctx.font = `normal 20px ${fontBase}`;
        ctx.fillText(`${getPersianDate()} · ساعت ${getPersianTime()}`, width / 2, 230);
      }

      // Receipt Card Box
      const boxX = 75;
      const boxY = 275;
      const boxW = width - 150;
      const boxH = 920;

      ctx.fillStyle = currentTheme.cardBg;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 28);
      ctx.fill();
      ctx.strokeStyle = currentTheme.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Customer / Item row
      const startY = boxY + 70;
      ctx.textAlign = 'right';
      ctx.fillStyle = currentTheme.textColor;
      ctx.font = `bold 26px ${fontBase}`;
      ctx.fillText('شرح قطعه طلا:', boxX + boxW - 35, startY);
      ctx.textAlign = 'left';
      ctx.font = `bold 26px ${fontBase}`;
      ctx.fillText(calcItemDescription || 'قطعه طلا ۱۸ عیار', boxX + 35, startY);

      if (calcCustomerName) {
        ctx.textAlign = 'right';
        ctx.font = `bold 24px ${fontBase}`;
        ctx.fillText('نام مشتری:', boxX + boxW - 35, startY + 55);
        ctx.textAlign = 'left';
        ctx.font = `normal 24px ${fontBase}`;
        ctx.fillText(calcCustomerName, boxX + 35, startY + 55);
      }

      // Divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(boxX + 35, startY + (calcCustomerName ? 95 : 55));
      ctx.lineTo(boxX + boxW - 35, startY + (calcCustomerName ? 95 : 55));
      ctx.stroke();

      // Calculation breakdown rows
      const rows = [
        { label: 'وزن خالص طلا', value: `${calcWeight.toLocaleString('fa-IR')} گرم` },
        { label: 'نرخ پایه هر گرم (۱۸ عیار)', value: `${goldPrice.toLocaleString('fa-IR')} تومان` },
        { label: 'ارزش طلای خام', value: `${quote.rawGoldValue.toLocaleString('fa-IR')} تومان` },
        { label: 'اجرت ساخت', value: `${quote.feeValue.toLocaleString('fa-IR')} تومان` },
        { label: `سود قانونی گالری (${calcProfitPercent}٪)`, value: `${quote.profitValue.toLocaleString('fa-IR')} تومان` },
        { label: `مالیات ارزش‌افزوده (${calcTaxPercent}٪)`, value: `${quote.taxValue.toLocaleString('fa-IR')} تومان` },
      ];

      const rowBaseY = startY + (calcCustomerName ? 150 : 110);
      rows.forEach((r, idx) => {
        const rowY = rowBaseY + idx * 72;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#a1a1aa';
        ctx.font = `normal 24px ${fontBase}`;
        ctx.fillText(r.label, boxX + boxW - 35, rowY);

        ctx.textAlign = 'left';
        ctx.fillStyle = currentTheme.textColor;
        ctx.font = `900 26px ${fontBase}`;
        ctx.fillText(r.value, boxX + 35, rowY);
      });

      // Total Final Highlight Bar
      const totalY = rowBaseY + rows.length * 72 + 25;
      ctx.fillStyle = currentTheme.tagBg;
      ctx.beginPath();
      ctx.roundRect(boxX + 25, totalY, boxW - 50, 115, 20);
      ctx.fill();
      ctx.strokeStyle = currentTheme.accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = `bold 28px ${fontBase}`;
      ctx.fillText('مبلغ کل قابل پرداخت:', boxX + boxW - 55, totalY + 68);

      ctx.textAlign = 'left';
      ctx.fillStyle = currentTheme.priceColor;
      ctx.font = `900 38px ${fontBase}`;
      ctx.fillText(`${quote.finalTotal.toLocaleString('fa-IR')} تومان`, boxX + 55, totalY + 70);

      // Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `normal 22px ${fontBase}`;
      ctx.fillText(`تلفن: ${store.phone}   |   اینستاگرام: @${store.instagram}`, width / 2, height - 160);
      ctx.fillText(store.address, width / 2, height - 118);
      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = `italic 20px ${fontBase}`;
      ctx.fillText(`اعتبار استعلام بر اساس نرخ روز: ${getPersianDate()}`, width / 2, height - 76);

      return canvas;
    }

    // RENDER: INSTAGRAM STORY (Locked strictly to 1080x1920 HD)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (selectedThemeId === 'occasional-crimson') {
      bgGrad.addColorStop(0, '#5e0517');
      bgGrad.addColorStop(0.5, '#300109');
      bgGrad.addColorStop(1, '#140106');
    } else {
      bgGrad.addColorStop(0, currentTheme.bgGradientStart);
      bgGrad.addColorStop(1, currentTheme.bgGradientEnd);
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient golden radial glow
    const radial = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, width * 0.9);
    radial.addColorStop(0, 'rgba(212, 175, 55, 0.16)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // Occasional / Holiday Decorative elements
    if (selectedThemeId === 'occasional-crimson') {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
      const starCoords = [[150, 200], [920, 250], [120, 1500], [950, 1600], [880, 800], [180, 1050], [450, 1300], [700, 140]];
      starCoords.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - 15, y); ctx.lineTo(x + 15, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x, y + 15); ctx.stroke();
      });

      // Special top decorative circle
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, 0, 320, 0, Math.PI);
      ctx.stroke();
    }

    // Outer double luxury border
    ctx.strokeStyle = currentTheme.cardBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, width - 72, height - 72);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(46, 46, width - 92, height - 92);

    // 1. Header Zone
    ctx.textAlign = 'center';
    
    // Store Logo
    const logoY = 160;
    const currentLogo = logoImageRef.current;
    if (currentLogo && currentLogo.complete && currentLogo.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, logoY, 48, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(currentLogo, width / 2 - 48, logoY - 48, 96, 96);
      ctx.restore();

      // Outer gold glowing border
      ctx.strokeStyle = currentTheme.accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, logoY, 48, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = currentTheme.accentColor;
      ctx.beginPath();
      ctx.arc(width / 2, logoY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0a0c';
      ctx.font = `900 36px ${fontBase}`;
      ctx.textBaseline = 'middle';
      ctx.fillText('Z', width / 2, logoY + 3);
      ctx.textBaseline = 'alphabetic';
    }

    // Store Name
    ctx.fillStyle = currentTheme.accentColor;
    ctx.font = `bold 52px ${fontBase}`;
    ctx.fillText(store.name, width / 2, logoY + 95);

    // Special occasional banner text if crimson theme
    if (selectedThemeId === 'occasional-crimson') {
      ctx.fillStyle = '#fef08a';
      ctx.font = `bold 24px ${fontBase}`;
      ctx.fillText('❄️ آغاز فصلی نو با درخشش طلای زرسا ❄️', width / 2, logoY + 140);
    } else {
      ctx.fillStyle = currentTheme.textColor;
      ctx.font = `bold 26px ${fontBase}`;
      ctx.fillText('اطلاع‌رسانی رسمی و روزانه نرخ طلا و مسکوکات', width / 2, logoY + 140);
    }

    // Shamsi Date & Time (Persian)
    ctx.fillStyle = '#a1a1aa';
    ctx.font = `bold 24px ${fontBase}`;
    ctx.fillText(`${getPersianDate()} · ساعت ${getPersianTime()}`, width / 2, logoY + 185);

    // 2. Sections stack positioning
    let currentY = logoY + 230;
    const boxW = width - 160;
    const boxX = 80;

    // SECTION A: 18k Gold Rate (Gold hero card)
    if (includeGoldRateInCard) {
      const boxH = 220;
      ctx.fillStyle = currentTheme.cardBg;
      ctx.beginPath();
      ctx.roundRect(boxX, currentY, boxW, boxH, 26);
      ctx.fill();
      ctx.strokeStyle = currentTheme.cardBorder;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Labels
      ctx.textAlign = 'right';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `bold 24px ${fontBase}`;
      ctx.fillText('قیمت هر گرم طلای ۱۸ عیار:', boxX + boxW - 35, currentY + 55);

      ctx.textAlign = 'left';
      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = `bold 24px ${fontBase}`;
      const mazaneh = Math.round((goldPrice * 4.6083 * 17) / 18);
      ctx.fillText(`مظنه مثقال: ${mazaneh.toLocaleString('fa-IR')} ت`, boxX + 35, currentY + 55);

      // Gold rate large number
      ctx.textAlign = 'right';
      ctx.fillStyle = currentTheme.priceColor;
      ctx.font = `900 64px ${fontBase}`;
      ctx.fillText(`${goldPrice.toLocaleString('fa-IR')} تومان`, boxX + boxW - 35, currentY + 145);

      if (includeOunceInCard) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#a1a1aa';
        ctx.font = `bold 26px ${fontBase}`;
        ctx.fillText(`انس جهانی: $${globalOunce.toLocaleString()}`, boxX + 35, currentY + 145);
      }

      currentY += boxH + 30;
    }

    // SECTION B & C: Coins & Parsians (100% of all active items displayed)
    const activeCoins = coins.filter(c => !c.isHidden);
    const activeParsians = parsians.filter(p => !p.isHidden);

    if (includeCoinsInCard && includeParsiansInCard && activeCoins.length > 0 && activeParsians.length > 0 && activeParsians.length <= 16 && activeCoins.length <= 12) {
      // Clean side-by-side columns inside a single unified card box
      const rowCount = Math.max(activeCoins.length, activeParsians.length);
      const rowH = rowCount > 12 ? 38 : rowCount > 10 ? 42 : rowCount > 8 ? 48 : rowCount > 6 ? 54 : rowCount > 5 ? 62 : 72;
      const boxH = 75 + rowCount * rowH;
      
      ctx.fillStyle = currentTheme.cardBg;
      ctx.beginPath();
      ctx.roundRect(boxX, currentY, boxW, boxH, 26);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const colW = (boxW - 60) / 2;

      // 1. RIGHT COLUMN: Coins (سکه ها)
      const rightColX = boxX + colW + 60;
      ctx.textAlign = 'right';
      ctx.fillStyle = currentTheme.accentColor;
      const colHeaderSize = rowCount > 10 ? 19 : rowCount > 7 ? 21 : 24;
      ctx.font = `bold ${colHeaderSize}px ${fontBase}`;
      ctx.fillText('🪙 مسکوکات بانکی بازار', rightColX + colW - 20, currentY + 48);

      const itemFontSize = rowCount > 12 ? 15 : rowCount > 10 ? 17 : rowCount > 8 ? 19 : 21;
      const priceFontSize = rowCount > 12 ? 17 : rowCount > 10 ? 19 : rowCount > 8 ? 21 : 24;

      activeCoins.forEach((c, idx) => {
        const ry = currentY + (rowCount > 8 ? 100 : 112) + idx * rowH;
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.beginPath(); ctx.moveTo(rightColX + 15, ry - rowH / 2 - 4); ctx.lineTo(rightColX + colW - 15, ry - rowH / 2 - 4); ctx.stroke();
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = currentTheme.textColor;
        ctx.font = `bold ${itemFontSize}px ${fontBase}`;
        let displayName = c.name;
        if (displayName.length > 15) displayName = displayName.substring(0, 14) + '...';
        ctx.fillText(displayName, rightColX + colW - 20, ry);

        ctx.textAlign = 'left';
        ctx.fillStyle = currentTheme.priceColor;
        ctx.font = `900 ${priceFontSize}px ${fontBase}`;
        ctx.fillText(`${calculateFinalPrice(c, true).toLocaleString('fa-IR')} ت`, rightColX + 20, ry);
      });

      // Middle divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(boxX + colW + 30, currentY + 25);
      ctx.lineTo(boxX + colW + 30, currentY + boxH - 25);
      ctx.stroke();

      // 2. LEFT COLUMN: Parsians (پارسیان ها)
      const leftColX = boxX;
      ctx.textAlign = 'right';
      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = `bold ${colHeaderSize}px ${fontBase}`;
      ctx.fillText('✨ شمش‌های مینی پارسیان', leftColX + colW - 20, currentY + 48);

      activeParsians.forEach((p, idx) => {
        const ry = currentY + (rowCount > 8 ? 100 : 112) + idx * rowH;
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.beginPath(); ctx.moveTo(leftColX + 15, ry - rowH / 2 - 4); ctx.lineTo(leftColX + colW - 15, ry - rowH / 2 - 4); ctx.stroke();
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = currentTheme.textColor;
        ctx.font = `bold ${itemFontSize}px ${fontBase}`;
        let displayName = p.name;
        if (displayName.length > 15) displayName = displayName.substring(0, 14) + '...';
        ctx.fillText(displayName, leftColX + colW - 20, ry);

        ctx.textAlign = 'left';
        ctx.fillStyle = currentTheme.priceColor;
        ctx.font = `900 ${priceFontSize}px ${fontBase}`;
        ctx.fillText(`${calculateFinalPrice(p, false).toLocaleString('fa-IR')} ت`, leftColX + 20, ry);
      });

      currentY += boxH + 30;
    } else {
      // SECTION B: Coins Prices list (Shows ALL active coins without truncation)
      if (includeCoinsInCard && activeCoins.length > 0) {
        const rowCount = activeCoins.length;
        const rowH = rowCount > 6 ? 54 : rowCount > 5 ? 60 : 68;
        const boxH = 75 + rowCount * rowH;

        ctx.fillStyle = currentTheme.cardBg;
        ctx.beginPath();
        ctx.roundRect(boxX, currentY, boxW, boxH, 26);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillStyle = currentTheme.accentColor;
        ctx.font = `bold 26px ${fontBase}`;
        ctx.fillText('🪙 مسکوکات بانکی بازار تهران', boxX + boxW - 30, currentY + 48);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#71717a';
        ctx.font = `normal 20px ${fontBase}`;
        ctx.fillText('قیمت با احتساب حباب روز', boxX + 30, currentY + 48);

        activeCoins.forEach((c, idx) => {
          const ry = currentY + 112 + idx * rowH;
          if (idx > 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath(); ctx.moveTo(boxX + 25, ry - rowH / 2 - 4); ctx.lineTo(boxX + boxW - 25, ry - rowH / 2 - 4); ctx.stroke();
          }

          ctx.textAlign = 'right';
          ctx.fillStyle = currentTheme.textColor;
          ctx.font = `bold 24px ${fontBase}`;
          ctx.fillText(c.name + (c.karat ? ` (${c.karat})` : ''), boxX + boxW - 30, ry);

          ctx.textAlign = 'left';
          ctx.fillStyle = currentTheme.priceColor;
          ctx.font = `900 28px ${fontBase}`;
          ctx.fillText(`${calculateFinalPrice(c, true).toLocaleString('fa-IR')} ت`, boxX + 30, ry);
        });

        currentY += boxH + 28;
      }

      // SECTION C: Parsian bars (Shows ALL active parsians, using a 2-column grid when > 4 items)
      if (includeParsiansInCard && activeParsians.length > 0) {
        const isMultiCol = activeParsians.length > 4;
        const numCols = isMultiCol ? 2 : 1;
        const numRows = Math.ceil(activeParsians.length / numCols);
        const rowH = numRows > 6 ? 48 : numRows > 5 ? 52 : 58;
        const boxH = 75 + numRows * rowH;

        ctx.fillStyle = currentTheme.cardBg;
        ctx.beginPath();
        ctx.roundRect(boxX, currentY, boxW, boxH, 26);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillStyle = currentTheme.accentColor;
        ctx.font = `bold 25px ${fontBase}`;
        ctx.fillText('✨ شمش‌های طلا و پارسیان (عیار ۱۸)', boxX + boxW - 30, currentY + 48);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#71717a';
        ctx.font = `normal 19px ${fontBase}`;
        ctx.fillText(`${activeParsians.length} وزن موجود`, boxX + 30, currentY + 48);

        if (isMultiCol) {
          const colW = (boxW - 60) / 2;
          const half = Math.ceil(activeParsians.length / 2);
          const rightParsians = activeParsians.slice(0, half);
          const leftParsians = activeParsians.slice(half);

          // Divider
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(boxX + colW + 30, currentY + 25);
          ctx.lineTo(boxX + colW + 30, currentY + boxH - 25);
          ctx.stroke();

          // Right Column
          const rightColX = boxX + colW + 60;
          rightParsians.forEach((p, idx) => {
            const ry = currentY + 110 + idx * rowH;
            if (idx > 0) {
              ctx.strokeStyle = 'rgba(255,255,255,0.04)';
              ctx.beginPath();
              ctx.moveTo(rightColX + 10, ry - rowH / 2 - 2);
              ctx.lineTo(rightColX + colW - 10, ry - rowH / 2 - 2);
              ctx.stroke();
            }

            ctx.textAlign = 'right';
            ctx.fillStyle = currentTheme.textColor;
            ctx.font = `bold 20px ${fontBase}`;
            let displayName = p.name;
            if (displayName.length > 17) displayName = displayName.substring(0, 16) + '...';
            ctx.fillText(displayName, rightColX + colW - 15, ry);

            ctx.textAlign = 'left';
            ctx.fillStyle = currentTheme.priceColor;
            ctx.font = `900 22px ${fontBase}`;
            ctx.fillText(`${calculateFinalPrice(p, false).toLocaleString('fa-IR')} ت`, rightColX + 15, ry);
          });

          // Left Column
          const leftColX = boxX;
          leftParsians.forEach((p, idx) => {
            const ry = currentY + 110 + idx * rowH;
            if (idx > 0) {
              ctx.strokeStyle = 'rgba(255,255,255,0.04)';
              ctx.beginPath();
              ctx.moveTo(leftColX + 10, ry - rowH / 2 - 2);
              ctx.lineTo(leftColX + colW - 10, ry - rowH / 2 - 2);
              ctx.stroke();
            }

            ctx.textAlign = 'right';
            ctx.fillStyle = currentTheme.textColor;
            ctx.font = `bold 20px ${fontBase}`;
            let displayName = p.name;
            if (displayName.length > 17) displayName = displayName.substring(0, 16) + '...';
            ctx.fillText(displayName, leftColX + colW - 15, ry);

            ctx.textAlign = 'left';
            ctx.fillStyle = currentTheme.priceColor;
            ctx.font = `900 22px ${fontBase}`;
            ctx.fillText(`${calculateFinalPrice(p, false).toLocaleString('fa-IR')} ت`, leftColX + 15, ry);
          });
        } else {
          activeParsians.forEach((p, idx) => {
            const ry = currentY + 112 + idx * rowH;
            if (idx > 0) {
              ctx.strokeStyle = 'rgba(255,255,255,0.05)';
              ctx.beginPath(); ctx.moveTo(boxX + 25, ry - rowH / 2 - 4); ctx.lineTo(boxX + boxW - 25, ry - rowH / 2 - 4); ctx.stroke();
            }

            ctx.textAlign = 'right';
            ctx.fillStyle = currentTheme.textColor;
            ctx.font = `bold 24px ${fontBase}`;
            ctx.fillText(p.name, boxX + boxW - 30, ry);

            ctx.textAlign = 'left';
            ctx.fillStyle = currentTheme.priceColor;
            ctx.font = `900 28px ${fontBase}`;
            ctx.fillText(`${calculateFinalPrice(p, false).toLocaleString('fa-IR')} ت`, boxX + 30, ry);
          });
        }

        currentY += boxH + 28;
      }
    }

    // SECTION D: Scrap purchase and replacement (خرید متفرقه و تعویض)
    if (includeScrapInCard) {
      const boxH = 175;
      ctx.fillStyle = currentTheme.cardBg;
      ctx.beginPath();
      ctx.roundRect(boxX, currentY, boxW, boxH, 26);
      ctx.fill();
      ctx.strokeStyle = currentTheme.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Header label
      ctx.textAlign = 'right';
      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = `bold 25px ${fontBase}`;
      ctx.fillText('📋 نرخ معاملات طلا مستعمل و تعویض گالری', boxX + boxW - 30, currentY + 45);

      // Scrap purchase price calculation: goldPrice * 740/750
      const scrapBuyPrice = Math.round(goldPrice * (740 / 750));
      // Replacement exchange price calculation: goldPrice * 0.98
      const exchangePrice = Math.round(goldPrice * 0.98);

      // Left Column: Replacement exchange
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `normal 20px ${fontBase}`;
      ctx.fillText('نرخ تعویض طلا با نو (هر گرم):', boxX + 30, currentY + 95);
      ctx.fillStyle = currentTheme.priceColor;
      ctx.font = `900 26px ${fontBase}`;
      ctx.fillText(`${exchangePrice.toLocaleString('fa-IR')} تومان`, boxX + 30, currentY + 135);

      // Right Column: Scrap buy (740)
      ctx.textAlign = 'right';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `normal 20px ${fontBase}`;
      ctx.fillText('خرید طلای متفرقه (عیار ۷۴۰):', boxX + boxW - 30, currentY + 95);
      ctx.fillStyle = currentTheme.priceColor;
      ctx.font = `900 26px ${fontBase}`;
      ctx.fillText(`${scrapBuyPrice.toLocaleString('fa-IR')} تومان`, boxX + boxW - 30, currentY + 135);

      currentY += boxH + 30;
    }

    // SECTION E: Daily Quote Note
    if (dailyNote && includeNoteInCard) {
      const boxH = 65;
      ctx.fillStyle = currentTheme.tagBg;
      ctx.beginPath();
      ctx.roundRect(boxX, currentY, boxW, boxH, 18);
      ctx.fill();
      ctx.strokeStyle = currentTheme.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = currentTheme.textColor;
      ctx.font = `italic 22px ${fontBase}`;
      ctx.fillText(`📌 ${dailyNote}`, width / 2, currentY + 41);

      currentY += boxH + 30;
    }

    // Footer contact info
    if (includeContactInCard) {
      const footY = 1770;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `normal 24px ${fontBase}`;
      ctx.fillText(`تلفن گالری: ${store.phone}   |   اینستاگرام: @${store.instagram}`, width / 2, footY);
      
      ctx.fillStyle = '#71717a';
      ctx.font = `normal 20px ${fontBase}`;
      ctx.fillText(store.address, width / 2, footY + 45);
    }

    return canvas;
  };

  const ensureLogoLoaded = async () => {
    if (!logoImageRef.current || !logoImageRef.current.complete) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = store.logo || '/assets/app-icon.svg';
        img.onload = () => {
          logoImageRef.current = img;
          resolve();
        };
        img.onerror = () => resolve();
      });
    }
  };

  // Direct share to WhatsApp, Telegram, or phone apps via Web Share API
  const handleNativeShare = async () => {
    setIsExporting(true);
    try {
      await ensureLogoLoaded();
      const canvas = renderCardToCanvas();
      if (!canvas) throw new Error('Canvas render failed');

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsExporting(false);
          return;
        }

        const fileName = `Zarsa_Gold_${new Date().toISOString().slice(0, 10)}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `${store.name} - نرخ روز طلا`,
              text: generateBroadcastText(),
              files: [file]
            });
            showNotification('تصویر در برنامه‌های گوشی به اشتراک گذاشته شد', 'success');
          } catch (e: any) {
            if (e.name !== 'AbortError') {
              // Fallback download if share was canceled or failed
              downloadBlob(blob, fileName);
            }
          }
        } else if (navigator.share) {
          // Share text if files unsupported
          await navigator.share({
            title: `${store.name} - نرخ روز طلا`,
            text: generateBroadcastText()
          });
          downloadBlob(blob, fileName);
        } else {
          // Direct download on unsupported platforms (like desktop)
          downloadBlob(blob, fileName);
        }
        setIsExporting(false);
      }, 'image/png');
    } catch {
      showNotification('خطا در آماده‌سازی اشتراک‌گذاری', 'error');
      setIsExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('تصویر باکیفیت ذخیره شد', 'success');
  };

  // Download image button
  const handleDownloadImage = async () => {
    setIsExporting(true);
    await ensureLogoLoaded();
    const canvas = renderCardToCanvas();
    if (!canvas) {
      setIsExporting(false);
      return;
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const fileName = `GoldCard_${selectedFormat}_${new Date().toISOString().slice(0, 10)}.png`;
        downloadBlob(blob, fileName);
      }
      setIsExporting(false);
    }, 'image/png');
  };

  // Add new item to catalog
  const handleAddNewItem = () => {
    if (!newItemName.trim()) {
      showNotification('نام آیتم را وارد کنید', 'amber');
      return;
    }

    if (newItemType === 'coin') {
      const newCoin: CoinCatalogItem = {
        id: 'coin_' + Date.now(),
        name: newItemName.trim(),
        weight: newItemWeight,
        karat: newItemKarat,
        feeType: 'percentage',
        feeFixed: 0,
        feePercentage: 0,
        tax: 0,
        bubble: newItemBubble,
        stepEnabled: true,
        manualFormula: '(G+A)*W*(1+T)+H',
        isHidden: false
      };
      setCoins([...coins, newCoin]);
      showNotification(`سکه «${newItemName}» اضافه شد`, 'success');
    } else {
      const newParsian: ParsianCatalogItem = {
        id: 'parsian_' + Date.now(),
        name: newItemName.trim(),
        weight: newItemWeight,
        karat: '18',
        feeType: 'per-gram',
        feeFixed: newItemFeeFixed,
        feePercentage: 0,
        tax: 0,
        bubble: 0,
        stepEnabled: true,
        manualFormula: '(G+A)*W*(1+T)',
        isHidden: false
      };
      setParsians([...parsians, newParsian]);
      showNotification(`شمش «${newItemName}» اضافه شد`, 'success');
    }

    setShowAddModal(false);
    setNewItemName('');
  };

  // Delete item from catalog
  const handleDeleteItem = (id: string, isCoin: boolean) => {
    if (isCoin) {
      setCoins(coins.filter(c => c.id !== id));
    } else {
      setParsians(parsians.filter(p => p.id !== id));
    }
    showNotification('آیتم حذف شد', 'success');
  };

  return (
    <div className="min-h-screen bg-[#070709] text-[#f4f4f5] flex flex-col justify-between selection:bg-[#d4af37] selection:text-black antialiased font-sans" dir="rtl">
      
      {/* Centered Android Phone Shell Container */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col bg-[#0b0b0e] sm:border-x sm:border-zinc-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative pb-24 overflow-hidden">
        
        {/* PREMIUM BACKDROP GLOW */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-emerald-500/3 rounded-full blur-[100px] pointer-events-none" />

        {/* TOP MOBILE APP BAR */}
        <header className="sticky top-0 z-30 bg-[#0b0b0e]/90 backdrop-blur-xl border-b border-zinc-900/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-[#d4af37]/40 flex items-center justify-center shadow-lg shadow-[#d4af37]/10 overflow-hidden shrink-0 transition-transform active:scale-95 duration-100 p-0.5">
              <img 
                src={store.logo || '/assets/app-icon.svg'} 
                alt={store.name} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/app-icon.svg';
                }}
              />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-tight flex items-center gap-1.5">
                <span>{store.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} title={isOnline ? 'متصل و آنلاین' : 'آفلاین (بدون اینترنت)'} />
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                {getPersianDate()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveSettings(true)}
              disabled={savingSettings}
              className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-xs font-black text-[#d4af37] border border-[#d4af37]/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              {savingSettings ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>ذخیره تغییرات</span>
            </button>
          </div>
        </header>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="fixed top-16 left-4 right-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-top-4 duration-200">
            <div className={`p-3.5 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-3 border backdrop-blur-xl ${
              notification.type === 'success' 
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/30'
                : notification.type === 'amber'
                ? 'bg-amber-950/95 text-amber-200 border-amber-500/30'
                : 'bg-red-950/95 text-red-200 border-red-500/30'
            }`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                notification.type === 'success' ? 'bg-emerald-500/20' : notification.type === 'amber' ? 'bg-amber-500/20' : 'bg-red-500/20'
              }`}>
                <Check className="w-4 h-4" />
              </div>
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT BASED ON ACTIVE TAB */}
        <main className="p-4 space-y-4 flex-1">
          
          {/* TAB 1: PRICES & JEWELRY BOARD */}
          {activeTab === 'prices' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* HERO RATE CARD */}
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/8 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-xs font-black text-zinc-300">نرخ مبنای طلای ۱۸ عیار (هر گرم)</span>
                  </div>
                  {/* Clean unboxed text metadata - zero pill */}
                  <div className="text-[10px] text-zinc-500 font-bold tracking-wider">
                    استاندارد رسمی ۷۵۰
                  </div>
                </div>

                {/* Direct Manual Rate Input & Display */}
                <div className="space-y-2">
                  <div className="relative flex items-center bg-zinc-950/80 border border-zinc-800/80 rounded-2xl h-16 transition-all focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/15">
                    <input 
                      type="number"
                      value={goldPrice || ''}
                      onChange={(e) => setGoldPrice(parseInt(e.target.value) || 0)}
                      placeholder="نرخ هر گرم طلا ۱۸ عیار..."
                      className="w-full h-full bg-transparent pl-16 pr-4 text-2xl sm:text-3xl font-black text-[#ffd700] font-mono tracking-tight outline-none"
                    />
                    <span className="absolute left-4 text-xs font-black text-zinc-400">تومان</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 px-1 font-bold">
                    <span>ورود مستقیم با لمس کادر بالا</span>
                    <span className="font-mono text-amber-200">{(goldPrice || 0).toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>

                {/* Step Adjusters for Fast Mobile Typing */}
                <div className="flex items-center gap-2 pt-3.5 border-t border-zinc-900/60 overflow-x-auto no-scrollbar text-xs">
                  <span className="text-[10px] text-zinc-500 font-bold shrink-0">تنظیم سریع (تومان):</span>
                  <button 
                    onClick={() => adjustGoldPrice(50000)}
                    className="h-8 px-3 rounded-xl bg-zinc-900/90 text-emerald-400 font-black font-mono border border-zinc-800 hover:border-emerald-500/20 active:scale-95 transition-all shrink-0"
                  >
                    +۵۰,۰۰۰
                  </button>
                  <button 
                    onClick={() => adjustGoldPrice(10000)}
                    className="h-8 px-3 rounded-xl bg-zinc-900/90 text-emerald-400 font-black font-mono border border-zinc-800 hover:border-emerald-500/20 active:scale-95 transition-all shrink-0"
                  >
                    +۱۰,۰۰۰
                  </button>
                  <button 
                    onClick={() => adjustGoldPrice(-10000)}
                    className="h-8 px-3 rounded-xl bg-zinc-900/90 text-rose-400 font-black font-mono border border-zinc-800 hover:border-rose-500/20 active:scale-95 transition-all shrink-0"
                  >
                    -۱۰,۰۰۰
                  </button>
                  <button 
                    onClick={() => adjustGoldPrice(-50000)}
                    className="h-8 px-3 rounded-xl bg-zinc-900/90 text-rose-400 font-black font-mono border border-zinc-800 hover:border-rose-500/20 active:scale-95 transition-all shrink-0"
                  >
                    -۵۰,۰۰۰
                  </button>
                </div>

                {/* Sub rates: Mazaneh & Global Ounce */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-zinc-900/60 text-xs">
                  <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900/60">
                    <span className="text-zinc-500 text-[10px] font-bold block">مظنه مثقال طلا (۱۷ عیار)</span>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-base font-black text-zinc-100 font-mono">
                        {Math.round((goldPrice * 4.6083 * 17) / 18).toLocaleString('fa-IR')}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold">تومان</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900/60 flex flex-col justify-between">
                    <span className="text-zinc-500 text-[10px] font-bold block">انس جهانی طلا ($)</span>
                    <div className="flex items-center gap-1.5 mt-1 border-b border-zinc-800/80 focus-within:border-[#d4af37]">
                      <span className="text-zinc-500 font-mono text-xs font-bold">$</span>
                      <input 
                        type="number"
                        step="0.5"
                        value={globalOunce || ''}
                        onChange={(e) => setGlobalOunce(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent h-7 font-black text-[#ffd700] font-mono outline-none"
                        placeholder="2034.50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK LAUNCH BANNER TO GOLDEN CALCULATOR */}
              <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-4 rounded-3xl border border-zinc-800/80 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/6 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20 shrink-0">
                      <Calculator className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-white">ماشین‌حساب فروش طلای زرسا</h2>
                      <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
                        محاسبه طلای ساخته‌شده (اجرت، سود، مالیات)، سکه پارسیان، مسکوکات و آبشده
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('calculator')}
                    className="h-10 px-3.5 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black text-xs flex items-center gap-1 active:scale-95 transition-all shadow-md shrink-0"
                  >
                    <span>باز کردن</span>
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* DAILY NOTE INPUT */}
              <div className="bg-zinc-900/30 p-3.5 rounded-3xl border border-zinc-900/80 text-xs">
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5">یادداشت و هشدار اعتبار قیمت‌ها</label>
                <input 
                  type="text"
                  value={dailyNote}
                  onChange={(e) => setDailyNote(e.target.value)}
                  placeholder="مثال: اعتبار قیمت‌ها تا ساعت ۱۸ امروز معتبر است"
                  className="w-full h-10 px-3.5 bg-zinc-950/60 border border-zinc-900 rounded-xl text-zinc-200 text-xs focus:border-[#d4af37] outline-none transition-all"
                />
              </div>

            </div>
          )}

          {/* TAB: GOLDEN CALCULATOR (SUB-SECTIONS: JEWELRY, PARSIAN, COIN, MELTED) */}
          {activeTab === 'calculator' && (
            <GoldenCalculator
              goldPrice={goldPrice}
              setGoldPrice={setGoldPrice}
              coins={coins}
              parsians={parsians}
              store={store}
              taxEnabledGlobal={taxEnabledGlobal}
              onSaveInvoice={handleSaveInvoice}
              onExportPNG={handleExportInvoicePNG}
              showNotification={showNotification}
              getPersianDate={getPersianDate}
              getPersianTime={getPersianTime}
              onOpenSalesLog={() => setActiveTab('sales')}
              onOpenAdvancedCalculator={() => setActiveTab('advanced')}
              onOpenPurchase={() => setActiveTab('purchase')}
              salesCount={invoices.length}
              accounts={accounts}
              setAccounts={setAccounts}
            />
          )}

          {/* TAB: GOLD PURCHASE (BUY FROM CUSTOMER: SCRAP JEWELRY 740, PARSIAN, MELTED GOLD) */}
          {activeTab === 'purchase' && (
            <GoldPurchase
              goldPrice={goldPrice}
              store={store}
              showNotification={showNotification}
              getPersianDate={getPersianDate}
              getPersianTime={getPersianTime}
              onOpenRegularCalculator={() => setActiveTab('calculator')}
              purchasesProp={purchases}
              setPurchasesProp={setPurchases}
              accounts={accounts}
              setAccounts={setAccounts}
            />
          )}

          {/* TAB: ADVANCED GOLD CALCULATOR (BUDGET, REVERSE RATE, REVERSE WEIGHT, REVERSE FEE/PROFIT) */}
          {activeTab === 'advanced' && (
            <AdvancedCalculator
              goldPrice={goldPrice}
              setGoldPrice={setGoldPrice}
              store={store}
              taxEnabledGlobal={taxEnabledGlobal}
              showNotification={showNotification}
              onOpenRegularCalculator={() => setActiveTab('calculator')}
            />
          )}

          {/* TAB: SALES LOG & SAVED INVOICES */}
          {activeTab === 'sales' && (
            <SalesLog
              invoices={invoices}
              setInvoices={setInvoices}
              purchases={purchases}
              setPurchases={setPurchases}
              onDeleteInvoice={handleDeleteInvoice}
              onDeletePurchase={handleDeletePurchase}
              onExportPNG={handleExportInvoicePNG}
              store={store}
              showNotification={showNotification}
              goldPrice={goldPrice}
              accounts={accounts}
              setAccounts={setAccounts}
              getPersianDate={getPersianDate}
              getPersianTime={getPersianTime}
            />
          )}

          {/* TAB 2: COINS & PARSIANS CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-3">
              
              {/* Header with segmented filter & Add button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setCatalogFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      catalogFilter === 'all' ? 'bg-[#d4af37] text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => setCatalogFilter('coins')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      catalogFilter === 'coins' ? 'bg-[#d4af37] text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    سکه‌ها ({coins.length})
                  </button>
                  <button
                    onClick={() => setCatalogFilter('parsians')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      catalogFilter === 'parsians' ? 'bg-[#d4af37] text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    پارسیان ({parsians.length})
                  </button>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="h-9 px-3 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black text-xs font-bold flex items-center gap-1 shadow-lg shadow-[#d4af37]/15 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>آیتم جدید</span>
                </button>
              </div>

              {/* LIST OF COINS */}
              {(catalogFilter === 'all' || catalogFilter === 'coins') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-zinc-400">مسکوکات بانکی بازار تهران</span>
                    <span className="text-[10px] text-zinc-500">قیمت نهایی با احتساب حباب</span>
                  </div>

                  {coins.map((coin) => {
                    const price = calculateFinalPrice(coin, true);
                    return (
                      <div 
                        key={coin.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          coin.isHidden 
                            ? 'bg-zinc-950/40 border-zinc-900 opacity-60' 
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{coin.name}</span>
                              {coin.karat && (
                                <span className="text-[10px] text-[#d4af37] font-normal">
                                  ({coin.karat} عیار)
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                              <span>وزن: {coin.weight} گرم</span>
                              <span>·</span>
                              <span>حباب: {coin.bubble ? coin.bubble.toLocaleString('fa-IR') + ' ت' : 'صفر'}</span>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-base font-black text-[#ffd700] font-mono block">
                              {price.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[10px] text-zinc-500">تومان</span>
                          </div>
                        </div>

                        {/* Row Quick Controls */}
                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-800/60 text-xs">
                          <button
                            onClick={() => toggleItemVisibility(coin.id, true)}
                            className={`flex items-center gap-1 text-[11px] ${
                              coin.isHidden ? 'text-zinc-500' : 'text-emerald-400'
                            }`}
                          >
                            {coin.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{coin.isHidden ? 'پنهان در کارت' : 'نمایش در کارت'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                triggerPrompt(
                                  'ویرایش حباب سکه',
                                  `میزان حباب جدید برای سکه «${coin.name}» را به تومان وارد کنید:`,
                                  String(coin.bubble || 0),
                                  (val) => {
                                    const parsed = parseInt(val) || 0;
                                    setCoins(coins.map(c => c.id === coin.id ? { ...c, bubble: parsed } : c));
                                    showNotification('حباب سکه با موفقیت به روز شد', 'success');
                                  }
                                );
                              }}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                            >
                              ویرایش حباب
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(coin.id, true)}
                              className="p-1 hover:text-red-400 text-zinc-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LIST OF PARSIAN BARS */}
              {(catalogFilter === 'all' || catalogFilter === 'parsians') && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-zinc-400">شمش‌های مینیاتوری پارسیان</span>
                    <span className="text-[10px] text-zinc-500">عیار ۱۸ استاندارد</span>
                  </div>

                  {parsians.map((parsian) => {
                    const price = calculateFinalPrice(parsian, false);
                    return (
                      <div 
                        key={parsian.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          parsian.isHidden 
                            ? 'bg-zinc-950/40 border-zinc-900 opacity-60' 
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              {parsian.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                              <span>وزن: {parsian.weight} گرم</span>
                              <span>·</span>
                              <span>اجرت: {parsian.feeFixed.toLocaleString('fa-IR')} ت</span>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-base font-black text-amber-200 font-mono block">
                              {price.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[10px] text-zinc-500">تومان</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-800/60 text-xs">
                          <button
                            onClick={() => toggleItemVisibility(parsian.id, false)}
                            className={`flex items-center gap-1 text-[11px] ${
                              parsian.isHidden ? 'text-zinc-500' : 'text-emerald-400'
                            }`}
                          >
                            {parsian.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{parsian.isHidden ? 'پنهان در کارت' : 'نمایش در کارت'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                triggerPrompt(
                                  'ویرایش اجرت ساخت شمش',
                                  `میزان اجرت ساخت جدید شمش «${parsian.name}» را به تومان وارد کنید:`,
                                  String(parsian.feeFixed || 0),
                                  (val) => {
                                    const parsed = parseInt(val) || 0;
                                    setParsians(parsians.map(p => p.id === parsian.id ? { ...p, feeFixed: parsed } : p));
                                    showNotification('اجرت ساخت شمش با موفقیت به روز شد', 'success');
                                  }
                                );
                              }}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                            >
                              ویرایش اجرت
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(parsian.id, false)}
                              className="p-1 hover:text-red-400 text-zinc-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MODERN CARD SHARE SUITE (Replacing the Old Story Template) */}
          {activeTab === 'card' && (
            <div className="space-y-4">
              
              {/* STORY PRESETS BAR (ONE-CLICK CONFIGURATION LOADER & SAVER) */}
              <div className="bg-zinc-900/80 p-3 sm:p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-xs font-black text-white">ترکیب‌های آماده و سفارشی استوری</span>
                    <span className="text-[10px] text-zinc-500 font-bold hidden sm:inline">
                      (تغییر رنگ و المان‌ها با ۱ کلیک)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSavePresetModal(!showSavePresetModal)}
                    className="h-7 px-2.5 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#ffd700] border border-[#d4af37]/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>ذخیره ترکیب فعلی</span>
                  </button>
                </div>

                {/* Inline Save Preset Form */}
                {showSavePresetModal && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-[#d4af37]/30 space-y-2.5 animate-fade-in-up text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                      <span>نام ترکیب سفارشی را وارد کنید:</span>
                      <span className="text-[10px] text-zinc-500 font-normal">
                        (شامل پوسته «{activeTheme.name}» و المان‌های فعال فعلی)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="مثال: استوری عصرانه پیج، ویترین طلاهای کم‌اجرت..."
                        className="flex-1 h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs outline-none focus:border-[#d4af37]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveCurrentAsPreset();
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveCurrentAsPreset}
                        className="h-9 px-3.5 rounded-lg bg-[#d4af37] text-black font-black text-xs cursor-pointer active:scale-95 transition-all shadow-sm"
                      >
                        ذخیره
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSavePresetModal(false);
                          setNewPresetName('');
                        }}
                        className="h-9 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 text-xs cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>

                    {/* Quick Suggestions Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                      <span className="text-zinc-500 self-center">پیشنهاد نام:</span>
                      {['استوری عصرانه پیج', 'ویترین طلا و مظنه', 'پست هفتگی سکه‌ها', 'اطلاعیه فروش ویژه'].map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setNewPresetName(suggestion)}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Presets List (Horizontal Scrolling Pills / Cards) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {allPresets.map(preset => {
                    const presetTheme = CARD_THEMES.find(t => t.id === preset.themeId) || CARD_THEMES[0];
                    const isActive = activePresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className={`group px-3 py-2 rounded-xl border shrink-0 transition-all cursor-pointer flex items-center gap-2 relative ${
                          isActive
                            ? 'border-[#d4af37] bg-[#d4af37]/15 shadow-sm shadow-[#d4af37]/15'
                            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        {/* Theme dot indicator */}
                        <span
                          className="w-3 h-3 rounded-full border border-white/20 shrink-0 shadow-sm"
                          style={{ backgroundColor: presetTheme.accentColor }}
                        />

                        {/* Title & metadata */}
                        <div className="text-right">
                          <span className={`block font-bold text-[11px] whitespace-nowrap ${
                            isActive ? 'text-[#ffd700]' : 'text-zinc-200 group-hover:text-white'
                          }`}>
                            {preset.name}
                          </span>
                          <span className="text-[9px] text-zinc-500 block truncate max-w-[130px]">
                            {preset.isCustom ? '⭐ سفارشی شما' : presetTheme.name}
                          </span>
                        </div>

                        {/* Delete button for custom presets */}
                        {preset.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomPreset(e, preset.id, preset.name)}
                            className="w-5 h-5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer transition-all ml-0.5"
                            title="حذف ترکیب سفارشی"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Format Selector Bar */}
              <div className="bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSelectFormat('story')}
                  className={`py-3 px-2 rounded-xl font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    selectedFormat === 'story'
                      ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-black'
                      : 'text-zinc-400 hover:text-white bg-zinc-950/40'
                  }`}
                >
                  <span className="text-xs">استوری اینستاگرام (۹:۱۶)</span>
                  <span className="text-[10px] opacity-75 font-normal">مناسب اعلان روزانه پیج</span>
                </button>

                <button
                  onClick={() => handleSelectFormat('receipt')}
                  className={`py-3 px-2 rounded-xl font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    selectedFormat === 'receipt'
                      ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-black'
                      : 'text-zinc-400 hover:text-white bg-zinc-950/40'
                  }`}
                >
                  <span className="text-xs">رسید استعلام قیمت</span>
                  <span className="text-[10px] opacity-75 font-normal">برای ارسال مستقیم به مشتری</span>
                </button>
              </div>

              {/* Theme Palette Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] text-zinc-500 shrink-0">رنگ پوسته:</span>
                {CARD_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedThemeId === theme.id
                        ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#ffd700]'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.accentColor }} 
                    />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>

              {/* Resolution Info Banner */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-800">
                <span className="flex items-center gap-1 text-[#d4af37]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ابعاد استوری: ۱۰۸۰ × ۱۹۲۰ پیکسل HD</span>
                </span>
                <span className="text-zinc-500">مخصوص استوری اینستاگرام</span>
              </div>

              {/* LIVE CARD PREVIEW CONTAINER (UNCLIPPED, SPACIOUS & READABLE) */}
              <div className="bg-black/90 p-3 sm:p-5 rounded-3xl border border-zinc-800/90 shadow-2xl relative flex flex-col items-center">
                
                {/* Visual Preview Box with Natural Height and Generous Spacing */}
                <div 
                  key={`${selectedThemeId}_${selectedFormat}`}
                  className={`w-full max-w-[320px] aspect-[9/16] rounded-[2rem] p-5 sm:p-6 border transition-all text-right relative shadow-2xl flex flex-col justify-between overflow-y-auto ${
                    isExiting ? 'animate-fade-out-down' : 'animate-fade-in-up'
                  }`}
                  style={{
                    backgroundColor: CARD_THEMES.find(t => t.id === selectedThemeId)?.bgColor || '#0c0c0e',
                    borderColor: CARD_THEMES.find(t => t.id === selectedThemeId)?.cardBorder || 'rgba(212,175,55,0.3)',
                    color: CARD_THEMES.find(t => t.id === selectedThemeId)?.textColor || '#ffffff',
                    backgroundImage: selectedThemeId === 'occasional-crimson'
                      ? 'radial-gradient(circle at top, #5e0517 0%, #140106 100%)'
                      : `linear-gradient(to bottom, ${CARD_THEMES.find(t => t.id === selectedThemeId)?.bgGradientStart}, ${CARD_THEMES.find(t => t.id === selectedThemeId)?.bgGradientEnd})`
                  }}
                >
                  {/* Subtle top ambient glow */}
                  <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Occasional Crimson Star decorations */}
                  {selectedThemeId === 'occasional-crimson' && (
                    <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
                      <div className="absolute top-4 left-4 text-amber-400/30 text-xs">✦</div>
                      <div className="absolute top-12 right-12 text-amber-400/40 text-sm">✦</div>
                      <div className="absolute bottom-24 left-10 text-amber-400/30 text-xs">✦</div>
                      <div className="absolute bottom-16 right-6 text-amber-400/40 text-sm">✦</div>
                      <div className="absolute top-1/2 left-1/3 text-amber-400/20 text-xs">✦</div>
                    </div>
                  )}

                  {/* PREVIEW: RECEIPT FORMAT */}
                  {selectedFormat === 'receipt' ? (
                    <div 
                      key={`${selectedThemeId}_${selectedFormat}`}
                      className={`space-y-3.5 flex-1 flex flex-col justify-between h-full ${
                        isExiting ? 'animate-fade-out-down' : 'animate-fade-in-up'
                      }`}
                    >
                      {/* Store Header */}
                      <div className="text-center pb-2 border-b border-white/10 shrink-0">
                        <div className="w-11 h-11 rounded-2xl border border-[#d4af37]/40 overflow-hidden mx-auto mb-1.5 shadow-lg shadow-[#d4af37]/20 bg-zinc-950 flex items-center justify-center p-0.5">
                          <img 
                            src={store.logo || '/assets/app-icon.svg'} 
                            alt={store.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/app-icon.svg';
                            }}
                          />
                        </div>
                        <h2 className="text-base font-black text-[#d4af37]">{store.name}</h2>
                        <p className="text-[10px] text-zinc-300 font-bold mt-0.5">پیش‌فاکتور و استعلام رسمی قیمت طلا</p>
                        <p className="text-[9px] text-zinc-400 font-mono mt-0.5">{getPersianDate()} · {getPersianTime()}</p>
                      </div>

                      {/* Receipt Card Box */}
                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10 space-y-2 flex-1 my-2 overflow-y-auto">
                        <div className="flex justify-between items-center pb-1.5 border-b border-white/10 text-[11px]">
                          <span className="font-bold text-zinc-200">شرح کالا: {calcItemDescription || 'طلا ۱۸ عیار'}</span>
                          <span className="font-mono font-bold text-amber-300">{calcWeight} گرم</span>
                        </div>

                        {calcCustomerName && (
                          <div className="flex justify-between items-center text-[10px] pb-1.5 border-b border-white/10 text-zinc-300">
                            <span>مشتری:</span>
                            <span className="font-bold">{calcCustomerName}</span>
                          </div>
                        )}

                        <div className="space-y-1.5 text-[10px] pt-1">
                          <div className="flex justify-between text-zinc-300">
                            <span>ارزش طلای خام:</span>
                            <span className="font-mono">{quote.rawGoldValue.toLocaleString('fa-IR')} ت</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>اجرت ساخت:</span>
                            <span className="font-mono">{quote.feeValue.toLocaleString('fa-IR')} ت</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>سود گالری ({calcProfitPercent}٪):</span>
                            <span className="font-mono">{quote.profitValue.toLocaleString('fa-IR')} ت</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>مالیات ({calcTaxPercent}٪):</span>
                            <span className="font-mono">{quote.taxValue.toLocaleString('fa-IR')} ت</span>
                          </div>
                        </div>

                        {/* Total Highlight */}
                        <div className="pt-2 mt-2 border-t border-[#d4af37]/30 flex justify-between items-center bg-[#d4af37]/10 p-2.5 rounded-lg border border-[#d4af37]/20">
                          <span className="text-[10px] font-black text-[#d4af37]">مبلغ کل:</span>
                          <span className="text-sm font-black text-[#ffd700] font-mono">
                            {quote.finalTotal.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>

                      {/* Receipt Footer */}
                      <div className="text-center pt-1 text-[10px] text-zinc-400 space-y-0.5 border-t border-white/10 shrink-0">
                        <p>تلفن: {store.phone} · @{store.instagram}</p>
                        <p className="text-[9px] text-[#d4af37] italic">معتبر بر اساس نرخ روز: {getPersianDate()}</p>
                      </div>
                    </div>
                  ) : (
                    /* PREVIEW: STORY FORMAT (Locked Aspect Ratio Viewport Mock) */
                    <div 
                      key={`${selectedThemeId}_${selectedFormat}`}
                      className={`flex flex-col justify-between h-full flex-1 ${
                        isExiting ? 'animate-fade-out-down' : 'animate-fade-in-up'
                      }`}
                    >
                      {/* Top Brand Header */}
                      <div className="text-center pb-2 shrink-0">
                        <div className="w-11 h-11 rounded-2xl border border-[#d4af37]/40 overflow-hidden mx-auto mb-1.5 shadow-lg shadow-[#d4af37]/20 bg-zinc-950 flex items-center justify-center p-0.5">
                          <img 
                            src={store.logo || '/assets/app-icon.svg'} 
                            alt={store.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/app-icon.svg';
                            }}
                          />
                        </div>
                        <h2 className="text-base font-black text-[#d4af37]">{store.name}</h2>
                        {selectedThemeId === 'occasional-crimson' ? (
                          <p className="text-[9px] text-amber-200 font-bold">❄️ آغاز فصلی نو با درخشش طلای زرسا ❄️</p>
                        ) : (
                          <p className="text-[9px] text-zinc-400">اطلاع‌رسانی روزانه طلا و مسکوکات</p>
                        )}
                        <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
                          {getPersianDate()} · ساعت {getPersianTime()}
                        </p>
                      </div>

                      {/* Main gold rate section (Only if checked) */}
                      {includeGoldRateInCard && (
                        <div className="bg-white/[0.05] p-3 rounded-xl border border-white/10 text-center relative overflow-hidden space-y-1 shrink-0 my-1">
                          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-300 font-bold">
                            <Sparkles className="w-3.5 h-3.5" style={{ color: activeTheme.accentColor }} />
                            <span>قیمت هر گرم طلای ۱۸ عیار</span>
                          </div>
                          <div className="text-2xl font-black text-[#ffd700] font-mono tracking-tight py-0.5">
                            {goldPrice.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-zinc-300">تومان</span>
                          </div>
                          
                          {includeOunceInCard && (
                            <div className="flex justify-between items-center text-[9px] text-zinc-300 pt-1.5 border-t border-white/10 font-mono">
                              <span>انس: ${globalOunce.toLocaleString()}</span>
                              <span>مثقال: {Math.round((goldPrice * 4.6083 * 17) / 18).toLocaleString('fa-IR')} ت</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Coins & Parsians Combined Layout (100% of all items shown) */}
                      {includeCoinsInCard && includeParsiansInCard && coins.filter(c => !c.isHidden).length > 0 && parsians.filter(p => !p.isHidden).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 my-1 shrink-0">
                          {/* Right Column: Coins (First in RTL) */}
                          <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/10 space-y-1.5">
                            <div className="text-[10px] font-black flex items-center justify-between pb-1 border-b border-white/10" style={{ color: activeTheme.accentColor }}>
                              <div className="flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5" style={{ color: activeTheme.accentColor }} />
                                <span>سکه بهار آزادی</span>
                              </div>
                              <span className="text-[8px] text-zinc-400 font-normal">({coins.filter(c => !c.isHidden).length})</span>
                            </div>
                            <div className="space-y-1">
                              {coins.filter(c => !c.isHidden).map((c) => (
                                <div key={c.id} className="text-[9px] flex justify-between items-center border-b border-white/5 last:border-b-0 pb-0.5 last:pb-0">
                                  <span className="font-bold text-zinc-100 truncate max-w-[65px]">{c.name.replace('سکه', '').trim()}</span>
                                  <span className="font-mono font-black text-[#ffd700]">
                                    {calculateFinalPrice(c, true).toLocaleString('fa-IR')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Left Column: Parsians */}
                          <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/10 space-y-1.5">
                            <div className="text-[10px] font-black flex items-center justify-between pb-1 border-b border-white/10" style={{ color: activeTheme.accentColor }}>
                              <div className="flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5" style={{ color: activeTheme.accentColor }} />
                                <span>شمش پارسیان</span>
                              </div>
                              <span className="text-[8px] text-zinc-400 font-normal">({parsians.filter(p => !p.isHidden).length})</span>
                            </div>
                            <div className="space-y-1">
                              {parsians.filter(p => !p.isHidden).map((p) => (
                                <div key={p.id} className="text-[9px] flex justify-between items-center border-b border-white/5 last:border-b-0 pb-0.5 last:pb-0">
                                  <span className="font-bold text-zinc-100 truncate max-w-[65px]">{p.name.replace('پارسیان', '').trim()}</span>
                                  <span className="font-mono font-black text-amber-200">
                                    {calculateFinalPrice(p, false).toLocaleString('fa-IR')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Coins Section with Generous Vertical Clearance */}
                          {includeCoinsInCard && coins.filter(c => !c.isHidden).length > 0 && (
                            <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10 space-y-2 my-1 shrink-0">
                              <div className="text-[11px] font-black flex items-center justify-between pb-1 border-b border-white/10" style={{ color: activeTheme.accentColor }}>
                                <div className="flex items-center gap-1">
                                  <Coins className="w-3.5 h-3.5" style={{ color: activeTheme.accentColor }} />
                                  <span>مسکوکات بانکی بازار</span>
                                </div>
                                <span className="text-[9px] text-zinc-400 font-normal">
                                  {coins.filter(c => !c.isHidden).length} مورد
                                </span>
                              </div>
                              
                              <div className="space-y-1.5">
                                {coins.filter(c => !c.isHidden).map((c) => (
                                  <div key={c.id} className="text-[11px] flex justify-between items-center border-b border-white/5 last:border-b-0 pb-1 last:pb-0">
                                    <span className="font-bold text-zinc-100">{c.name}</span>
                                    <span className="font-mono font-black text-[#ffd700]">
                                      {calculateFinalPrice(c, true).toLocaleString('fa-IR')} ت
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Parsian Section with 2-Column Responsive Layout */}
                          {includeParsiansInCard && parsians.filter(p => !p.isHidden).length > 0 && (
                            <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10 space-y-2 my-1 shrink-0">
                              <div className="text-[11px] font-black flex items-center justify-between pb-1 border-b border-white/10" style={{ color: activeTheme.accentColor }}>
                                <div className="flex items-center gap-1">
                                  <Layers className="w-3.5 h-3.5" style={{ color: activeTheme.accentColor }} />
                                  <span>شمش‌های مینی پارسیان</span>
                                </div>
                                <span className="text-[9px] text-zinc-400 font-normal">
                                  {parsians.filter(p => !p.isHidden).length} وزن موجود (عیار ۱۸)
                                </span>
                              </div>

                              <div className={parsians.filter(p => !p.isHidden).length > 4 ? "grid grid-cols-2 gap-x-2.5 gap-y-1" : "space-y-1.5"}>
                                {parsians.filter(p => !p.isHidden).map((p) => (
                                  <div key={p.id} className="text-[10px] flex justify-between items-center border-b border-white/5 pb-1">
                                    <span className="font-bold text-zinc-100 truncate max-w-[70px]">{p.name.replace('پارسیان', '').trim()}</span>
                                    <span className="font-mono font-black text-amber-200">
                                      {calculateFinalPrice(p, false).toLocaleString('fa-IR')} ت
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Scrap and exchange prices rate card */}
                      {includeScrapInCard && (
                        <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/10 space-y-1.5 my-1 text-[10px] shrink-0">
                          <div className="font-bold flex items-center justify-center gap-1 pb-1 border-b border-white/10 text-center text-[10px]" style={{ color: activeTheme.accentColor }}>
                            <TrendingUp className="w-3.5 h-3.5" style={{ color: activeTheme.accentColor }} />
                            <span>نرخ معاملات طلای مستعمل و تعویض</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-right">
                            <div>
                              <span className="text-zinc-400 block text-[9px]">خرید طلای متفرقه (۷۴۰):</span>
                              <span className="font-mono font-black text-amber-100">{Math.round(goldPrice * (740 / 750)).toLocaleString('fa-IR')} ت</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-[9px]">تعویض طلا با نو:</span>
                              <span className="font-mono font-black text-amber-100">{Math.round(goldPrice * 0.98).toLocaleString('fa-IR')} ت</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Daily Note Highlight Box */}
                      {dailyNote && includeNoteInCard && (
                        <div className="p-2 rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 text-[10px] text-zinc-200 text-center italic shrink-0 my-1 truncate">
                          📌 {dailyNote}
                        </div>
                      )}

                      {/* Footer Info */}
                      {includeContactInCard && (
                        <div className="text-center pt-2 text-[10px] text-zinc-400 border-t border-white/10 space-y-0.5 shrink-0">
                          <p className="font-bold text-zinc-300">تلفن: {store.phone}</p>
                          <p className="text-[9px] text-zinc-500 truncate">اینستاگرام: @{store.instagram}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD CUSTOMIZATION TOGGLES */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2.5 text-xs">
                <span className="text-xs font-bold text-zinc-300 block mb-1">تعیین قیمت‌ها و المان‌های فعال در استوری:</span>
                
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeGoldRateInCard}
                      onChange={(e) => setIncludeGoldRateInCard(e.target.checked)}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نرخ طلای ۱۸ عیار</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeCoinsInCard}
                      onChange={(e) => setIncludeCoinsInCard(e.target.checked)}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>لیست قیمت سکه‌ها ({coins.filter(c => !c.isHidden).length} سکه)</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeParsiansInCard}
                      onChange={(e) => setIncludeParsiansInCard(e.target.checked)}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>لیست شمش پارسیان ({parsians.filter(p => !p.isHidden).length} شمش فعال)</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeScrapInCard}
                      onChange={(e) => setIncludeScrapInCard(e.target.checked)}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نرخ خرید متفرقه و تعویض</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeOunceInCard}
                      onChange={(e) => setIncludeOunceInCard(e.target.checked)}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>انس جهانی و مظنه طلا</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={includeNoteInCard}
                      onChange={(e) => setIncludeNoteInCard(e.target.checked)}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>یادداشت اعتبار نرخ‌ها</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer col-span-2 border-t border-zinc-800/60 pt-2 mt-1">
                    <input 
                      type="checkbox"
                      checked={includeContactInCard}
                      onChange={(e) => setIncludeContactInCard(e.target.checked)}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش برند گالری، تلفن و اینستاگرام</span>
                  </label>
                </div>
              </div>

              {/* DIRECT INLINE PARSIAN LIST MANAGER */}
              <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-[#d4af37]" />
                    <span className="text-xs font-black text-white">مدیریت مستقیم شمش‌های پارسیان در استوری</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    {parsians.length} آیتم در لیست
                  </span>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  سریعاً می‌توانید شمش‌ها را پنهان/نمایش دهید، اجرت آن‌ها را ویرایش کنید یا شمش جدید اضافه کنید تا نرخ‌ها فوراً روی استوری به‌روز شوند:
                </p>

                {/* Inline Scrolling Container of Parsians */}
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 no-scrollbar border-t border-zinc-800/60 pt-2.5">
                  {parsians.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-zinc-950/60 border border-zinc-900 rounded-xl p-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleItemVisibility(p.id, false)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                            p.isHidden 
                              ? 'border-zinc-800 text-zinc-600 bg-zinc-900/40' 
                              : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                          }`}
                          title={p.isHidden ? "پنهان شده (لمس جهت نمایش)" : "درحال نمایش (لمس جهت پنهان‌سازی)"}
                        >
                          {p.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <span className="font-bold text-zinc-200 block text-[11px] truncate max-w-[150px]">{p.name}</span>
                          <span className="text-[9px] text-zinc-500 font-bold block mt-0.5">
                            وزن: {p.weight} گرم · اجرت: {p.feeFixed.toLocaleString('fa-IR')} ت
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            triggerPrompt(
                              'ویرایش اجرت شمش پارسیان',
                              `اجرت ساخت جدید شمش «${p.name}» را به تومان وارد کنید:`,
                              String(p.feeFixed || 0),
                              (val) => {
                                const parsed = parseInt(val) || 0;
                                setParsians(parsians.map(item => item.id === p.id ? { ...item, feeFixed: parsed } : item));
                                showNotification(`اجرت ساخت شمش ${p.name} با موفقیت ویرایش شد`, 'success');
                                handleSaveSettings(false);
                              }
                            );
                          }}
                          className="h-7 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-[#d4af37] rounded-lg text-[10px] font-black border border-zinc-800 active:scale-95 transition-all cursor-pointer"
                        >
                          ویرایش اجرت
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerConfirm(
                              'حذف شمش پارسیان',
                              `آیا از حذف شمش پارسیان «${p.name}» از لیست استوری مطمئن هستید؟ این عمل فورا بر کارت‌ساز تاثیر می‌گذارد.`,
                              () => {
                                handleDeleteItem(p.id, false);
                                handleSaveSettings(false);
                              }
                            );
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 hover:text-red-400 text-zinc-500 border border-zinc-850 cursor-pointer"
                          title="حذف شمش"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Quick Creator for Parsian Bar */}
                <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#d4af37]">➕ افزودن سریع شمش پارسیان جدید به لیست:</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold block mb-1">وزن شمش (گرم)</label>
                      <input 
                        type="number"
                        step="0.001"
                        placeholder="مثلا 0.350"
                        id="inline-p-weight"
                        className="w-full h-8 px-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold block mb-1">اجرت ساخت (تومان)</label>
                      <input 
                        type="number"
                        step="5000"
                        placeholder="مثلا 75000"
                        id="inline-p-fee"
                        className="w-full h-8 px-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:border-[#d4af37] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const weightInput = document.getElementById('inline-p-weight') as HTMLInputElement;
                      const feeInput = document.getElementById('inline-p-fee') as HTMLInputElement;
                      
                      const weight = parseFloat(weightInput?.value || '0');
                      const fee = parseInt(feeInput?.value || '0');

                      if (!weight || weight <= 0) {
                        showNotification('وزن شمش را به درستی وارد کنید', 'amber');
                        return;
                      }

                      const soot = Math.round(weight * 1000);
                      const name = `پارسیان ${weight} گرم (${soot} سوت)`;
                      
                      const newParsian: ParsianCatalogItem = {
                        id: 'parsian_' + Date.now(),
                        name,
                        weight,
                        karat: '18',
                        feeType: 'per-gram',
                        feeFixed: fee,
                        feePercentage: 0,
                        tax: 0,
                        bubble: 0,
                        stepEnabled: true,
                        manualFormula: '(G+A)*W*(1+T)',
                        isHidden: false
                      };

                      setParsians([...parsians, newParsian]);
                      showNotification(`شمش «${name}» با موفقیت افزوده و فعال شد`, 'success');
                      
                      // Clear inputs
                      if (weightInput) weightInput.value = '';
                      if (feeInput) feeInput.value = '';

                      handleSaveSettings(false);
                    }}
                    className="w-full h-8.5 rounded-lg bg-[#d4af37] hover:bg-[#b89320] text-black font-black text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن مستقیم شمش به لیست استوری</span>
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS (MOBILE SHARING & DOWNLOAD) */}
              <div className="space-y-2 pt-1">
                {/* 1. Direct Phone Sharing (Web Share API) */}
                <button
                  onClick={handleNativeShare}
                  disabled={isExporting}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89320] text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Share2 className="w-5 h-5" />
                  <span>اشتراک‌گذاری در استوری اینستاگرام و واتساپ</span>
                </button>

                {/* 2. Download Image and Copy Text */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={handleDownloadImage}
                    disabled={isExporting}
                    className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#d4af37]" />
                    <span>دانلود تصویر استوری</span>
                  </button>

                  <button
                    onClick={handleCopyText}
                    className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-emerald-400" />
                    <span>کپی متن قیمت‌ها</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: STORE SETTINGS & PWA */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              
              {/* Store & App Logo Management Section */}
              <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                    <div>
                      <h2 className="text-xs font-black text-white">لوگوی اختصاصی برنامه و فروشگاه</h2>
                      <p className="text-[10px] text-zinc-400">لوگوی فعال در نوار بالای برنامه، استوری‌ها، فاکتورها و آیکون اپلیکیشن</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/30 font-bold">
                    {store.logo && store.logo !== '/assets/app-icon.svg' ? '⭐ لوگو سفارشی' : '✓ نشان رسمی زرسا'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80">
                  {/* Logo live preview */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl border-2 border-[#d4af37]/50 overflow-hidden bg-zinc-900 shadow-xl shadow-[#d4af37]/10 flex items-center justify-center p-1">
                      <img 
                        src={store.logo || '/assets/app-icon.svg'} 
                        alt="لوگو فروشگاه زرسا" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/app-icon.svg';
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-right w-full">
                    <p className="text-[11px] text-zinc-300 font-bold leading-relaxed">
                      این لوگو به عنوان نشان رسمی گالری در تمامی خروجی‌ها (استوری اینستاگرام، سربرگ فاکتور و رسید خرید A5، بالای برنامه و آیکون موبایل) قرار می‌گیرد.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      <label className="h-8 px-3 rounded-lg bg-[#d4af37] hover:bg-[#b89320] text-black font-black text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md">
                        <Upload className="w-3.5 h-3.5" />
                        <span>بارگذاری لوگوی جدید</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                showNotification('حجم فایل تصویر نباید بیشتر از ۵ مگابایت باشد', 'error');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const base64 = ev.target?.result as string;
                                const updated = { ...store, logo: base64 };
                                setStore(updated);
                                localStorage.setItem('zarsa_store_settings', JSON.stringify(updated));
                                showNotification('لوگوی جدید با موفقیت اعمال و ذخیره شد', 'success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {store.logo && store.logo !== '/assets/app-icon.svg' && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...store, logo: '/assets/app-icon.svg' };
                            setStore(updated);
                            localStorage.setItem('zarsa_store_settings', JSON.stringify(updated));
                            showNotification('لوگو به نشان رسمی طلایی زرسا بازگردانده شد', 'amber');
                          }}
                          className="h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>بازنشانی به لوگوی طلایی زرسا</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Profile Card */}
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-[#d4af37]" />
                  <h2 className="text-xs font-black text-white">مشخصات و برندینگ گالری</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">نام گالری طلا</label>
                    <input 
                      type="text"
                      value={store.name}
                      onChange={(e) => setStore({ ...store, name: e.target.value })}
                      placeholder="گالری طلا زرسا"
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">نام صاحب امتیاز / مدیریت</label>
                    <input 
                      type="text"
                      value={store.ownerName || ''}
                      onChange={(e) => setStore({ ...store, ownerName: e.target.value })}
                      placeholder="مثال: محمدرضا خلیلی"
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">تلفن تماس / همراه</label>
                    <input 
                      type="text"
                      value={store.phone}
                      onChange={(e) => setStore({ ...store, phone: e.target.value })}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:border-[#d4af37] outline-none text-left"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">آیدی اینستاگرام / پیام‌رسان</label>
                    <input 
                      type="text"
                      value={store.instagram}
                      onChange={(e) => setStore({ ...store, instagram: e.target.value })}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:border-[#d4af37] outline-none text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-zinc-400 block mb-1">آدرس دقیق فروشگاه</label>
                    <input 
                      type="text"
                      value={store.address}
                      onChange={(e) => setStore({ ...store, address: e.target.value })}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">کد پستی ۱۰ رقمی</label>
                    <input 
                      type="text"
                      value={store.postalCode || ''}
                      onChange={(e) => setStore({ ...store, postalCode: e.target.value })}
                      placeholder="۱۱۶۳۶۱۴۱۱۱"
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:border-[#d4af37] outline-none text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">متن مهر رسمی فاکتور</label>
                    <input 
                      type="text"
                      value={store.stamp || ''}
                      onChange={(e) => setStore({ ...store, stamp: e.target.value })}
                      placeholder="گالری زرسا - تایید و تسویه شد"
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">عنوان امضای فاکتور</label>
                    <input 
                      type="text"
                      value={store.signature || ''}
                      onChange={(e) => setStore({ ...store, signature: e.target.value })}
                      placeholder="امضاء و مهر رسمی فروشنده"
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">متن واترمارک پس‌زمینه فاکتور</label>
                  <input 
                    type="text"
                    value={store.watermarkText || ''}
                    onChange={(e) => setStore({ ...store, watermarkText: e.target.value })}
                    placeholder="Zarsa Gold Gallery"
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:border-[#d4af37] outline-none"
                  />
                </div>

                {/* Global Tax Setting for Gold Calculator */}
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-xs font-bold text-white block">وضعیت پیش‌فرض مالیات در ماشین‌حساب</span>
                    <span className="text-[10px] text-zinc-400">مالیات ارزش‌افزوده ۹٪ روی سود و اجرت</span>
                  </div>
                  <button
                    onClick={() => {
                      setTaxEnabledGlobal(!taxEnabledGlobal);
                      showNotification(taxEnabledGlobal ? 'مالیات ارزش‌افزوده غیرفعال شد' : 'مالیات ارزش‌افزوده فعال شد', 'amber');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      taxEnabledGlobal 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {taxEnabledGlobal ? 'فعال (۹٪)' : 'غیرفعال / معاف'}
                  </button>
                </div>

                {/* Rounding / گرد کردن مبلغ نهایی (User Request) */}
                <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#d4af37]" />
                      <div>
                        <span className="text-xs font-bold text-white block">رُند کردن خودکار مبلغ نهایی فاکتور و کارت‌خوان</span>
                        <span className="text-[10px] text-zinc-400">گرد کردن ارقام پرداختی برای تسویه سریع‌تر با مشتری</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentRounding = store.rounding || { enabled: false, step: 1000, direction: 'nearest' };
                        const updated = { ...store, rounding: { ...currentRounding, enabled: !currentRounding.enabled } };
                        setStore(updated);
                        localStorage.setItem('zarsa_store_settings', JSON.stringify(updated));
                        showNotification(!currentRounding.enabled ? 'رُند کردن خودکار مبلغ فعال شد' : 'رُند کردن خودکار غیرفعال شد', 'amber');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        store.rounding?.enabled 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {store.rounding?.enabled ? 'فعال' : 'غیرفعال (مبلغ دقیق)'}
                    </button>
                  </div>

                  {store.rounding?.enabled && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800/80 animate-in fade-in duration-150">
                      {/* Rounding Step Options */}
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1.5 font-bold">میزان یا پله رُند کردن (مضرب تومان):</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                          {[1000, 5000, 10000, 50000, 100000].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => {
                                const current = store.rounding || { enabled: true, step: 1000, direction: 'nearest' };
                                const updated = { ...store, rounding: { ...current, step } };
                                setStore(updated);
                                localStorage.setItem('zarsa_store_settings', JSON.stringify(updated));
                              }}
                              className={`py-2 px-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                                store.rounding?.step === step
                                  ? 'bg-[#d4af37] text-black font-black shadow-md shadow-[#d4af37]/20'
                                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                              }`}
                            >
                              {step.toLocaleString('fa-IR')} ت
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rounding Direction: Up, Down, Nearest */}
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1.5 font-bold">جهت گرد کردن مبلغ نهایی:</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const current = store.rounding || { enabled: true, step: 1000, direction: 'nearest' };
                              const updated = { ...store, rounding: { ...current, direction: 'up' } };
                              setStore(updated);
                              localStorage.setItem('zarsa_store_settings', JSON.stringify(updated));
                            }}
                            className={`py-2 px-2 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              store.rounding?.direction === 'up'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span>🔼 رو به بالا (سقف)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const current = store.rounding || { enabled: true, step: 1000, direction: 'nearest' };
                              const updated = { ...store, rounding: { ...current, direction: 'down' } };
                              setStore(updated);
                              localStorage.setItem('zarsa_store_settings', JSON.stringify(updated));
                            }}
                            className={`py-2 px-2 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              store.rounding?.direction === 'down'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-black'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span>🔽 رو به پایین (تخفیف)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const current = store.rounding || { enabled: true, step: 1000, direction: 'nearest' };
                              const updated = { ...store, rounding: { ...current, direction: 'nearest' } };
                              setStore(updated);
                              localStorage.setItem('zarsa_store_settings', JSON.stringify(updated));
                            }}
                            className={`py-2 px-2 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              store.rounding?.direction === 'nearest'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-black'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span>⚖️ به نزدیک‌ترین</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Example Indicator */}
                      <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>مثال زنده: مبلغ ۱,۵۴۷,۲۰۰ تومان</span>
                        <span className="font-mono font-bold text-[#ffd700]">
                          تبدیل می‌شود به: {applyRounding(1547200, store.rounding).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSaveSettings(true)}
                  disabled={savingSettings}
                  className="w-full h-10 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer mt-2"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات فروشگاه</span>
                </button>
              </div>

              {/* Bazaar & Official Invoice Print Settings */}
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 space-y-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#d4af37]" />
                  <div>
                    <h2 className="text-xs font-black text-white">تنظیمات بازار و نمایش رسمی فاکتورها</h2>
                    <p className="text-[10px] text-zinc-400">ستون‌ها و بخش‌هایی را که می‌خواهید روی فاکتور رسمی چاپ یا پنهان شوند انتخاب کنید</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showRawGoldRate ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showRawGoldRate: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش نرخ طلا خام (هر گرم)</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showRawGoldValue ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showRawGoldValue: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش ارزش کل طلای خام</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer border-t border-zinc-900/60 pt-2 sm:border-0 sm:pt-0">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showFee ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showFee: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش ستون اجرت ساخت طلا</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer border-t border-zinc-900/60 pt-2 sm:border-0 sm:pt-0">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showProfit ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showProfit: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش ستون سود قانونی گالری</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer border-t border-zinc-900/60 pt-2 sm:col-span-2">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showTax ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showTax: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش ستون مالیات ارزش‌افزوده (۹٪)</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer border-t border-zinc-900/60 pt-2">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showQR ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showQR: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش بارکد تایید اصالت فاکتور</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer border-t border-zinc-900/60 pt-2">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showTerms ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showTerms: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش کادر قوانین صنف طلا</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer border-t border-zinc-900/60 pt-2">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showStamp ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showStamp: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش کادر مهر رسمی فروشگاه</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer border-t border-zinc-900/60 pt-2">
                    <input 
                      type="checkbox"
                      checked={store.invoicePrintSettings?.showFingerprint ?? true}
                      onChange={(e) => {
                        const current = store.invoicePrintSettings || { showRawGoldRate: true, showRawGoldValue: true, showFee: true, showProfit: true, showTax: true, showQR: true, showTerms: true, showStamp: true, showFingerprint: true };
                        setStore({ ...store, invoicePrintSettings: { ...current, showFingerprint: e.target.checked } });
                      }}
                      className="accent-[#d4af37] w-4 h-4 rounded"
                    />
                    <span>نمایش کادر اثر انگشت خریدار</span>
                  </label>
                </div>
              </div>

              {/* PWA Interactive Install Card */}
              <PWAInstallButton mode="settings" />

              {/* Single File Offline HTML and ZIP Download Card */}
              <div className="bg-gradient-to-br from-[#d4af37]/10 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-[#d4af37]/30 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <h4 className="font-black text-white">دریافت نسخه ۱۰۰٪ آفلاین (بدون نیاز به اینترنت)</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">برنامه قیمت‌یار به همراه تمامی محاسبات، کدها و استایل‌ها درون یک فایل واحد فشرده شده است.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="/zarsa-offline.html"
                    download="zarsa-offline.html"
                    className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold text-center flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>دانلود تک‌فایل HTML</span>
                  </a>
                  <a
                    href="/zarsa-offline.zip"
                    download="zarsa-offline.zip"
                    className="h-10 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black text-center flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-[#d4af37]/10"
                  >
                    <span>دانلود فایل ZIP</span>
                  </a>
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal">
                  💡 <strong>نحوه استفاده آفلاین:</strong> پس از دانلود فایل زیپ یا تک‌فایل HTML، آن را روی کامپیوتر، تبلت یا گوشی خود منتقل کنید. سپس بدون نیاز به اینترنت و حتی با خاموش کردن وای‌فای، روی فایل کلیک کنید تا زرسا فوراً اجرا شود.
                </p>
              </div>

              {/* Mobile PWA Installation Guide */}
              <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60 space-y-2">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Smartphone className="w-4 h-4 text-[#d4af37]" />
                  <h3 className="text-xs font-bold text-white">راهنمای استفاده و نصب روی گوشی (PWA)</h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  برای استفاده از این برنامه مانند یک اپلیکیشن بومی روی گوشی موبایل بدون نیاز به دانلود از بازار یا گوگل‌پلی:
                </p>
                <div className="space-y-1.5 pt-1 text-[11px] text-zinc-300">
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-[9px] flex items-center justify-center font-bold text-[#d4af37]">۱</span>
                    <span>در مرورگر گوشی (کروم یا سافاری)، دکمه منو یا اشتراک‌گذاری (Share) را بزنید.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-[9px] flex items-center justify-center font-bold text-[#d4af37]">۲</span>
                    <span>گزینه <strong>«افزودن به صفحه اصلی» (Add to Home Screen)</strong> را انتخاب کنید.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-[9px] flex items-center justify-center font-bold text-[#d4af37]">۳</span>
                    <span>آیکون زرسا به لیست اپ‌های گوشی اضافه شده و فول‌اسکرین اجرا می‌شود.</span>
                  </p>
                </div>
              </div>

              {/* Complete Clean Up & Reset Data Card */}
              <div className="bg-rose-950/20 p-4 rounded-2xl border border-rose-500/25 space-y-3.5 mt-2">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <Trash2 className="w-5 h-5 stroke-[2.5]" />
                  <div>
                    <h3 className="text-xs font-black">پاکسازی کامل برنامه و شروع کار واقعی (ریست اطلاعات)</h3>
                    <p className="text-[10px] text-zinc-400">تمام فاکتورهای فروش، فاکتورهای خرید، تراکنش‌ها و حساب معین اشخاص همکار به حالت اولیه بازگردانده شده و پاکسازی می‌شوند.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerConfirm(
                      '⚠️ هشدار بسیار جدی پاکسازی کامل اطلاعات',
                      'آیا مطمئن هستید که می‌خواهید تمام داده‌های ثبت‌شده در برنامه زرسا طلا (شامل کل فاکتورهای فروش، رسیدهای خرید، حساب همکاران و تراکنش‌ها) را حذف کنید؟\nاین عملیات به هیچ وجه قابل بازیابی و بازگشت نخواهد بود.',
                      () => {
                        triggerConfirm(
                          'تایید نهایی پاکسازی نهایی',
                          'تایید نهایی: با زدن این دکمه برنامه کاملاً پاکسازی شده و آماده برای شروع کار گالری خواهد شد. آیا مایل به ادامه هستید؟',
                          () => {
                            localStorage.removeItem('zarsa_sales_invoices');
                            localStorage.removeItem('zarsa_purchase_invoices');
                            localStorage.removeItem('zarsa_contact_accounts');
                            localStorage.removeItem('zarsa_shop_gold_manufactured');
                            localStorage.removeItem('zarsa_shop_gold_second_hand');
                            localStorage.removeItem('zarsa_shop_gold_melted');
                            localStorage.removeItem('zarsa_shop_gold_coins');
                            setInvoices([]);
                            setPurchases([]);
                            setAccounts([]);
                            showNotification('برنامه با موفقیت پاکسازی شد و آماده استفاده واقعی گالری است.', 'success');
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          }
                        );
                      }
                    );
                  }}
                  className="w-full h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <span>پاکسازی تمام فاکتورها، خریدها و دفاتر معین</span>
                </button>
              </div>

              {/* Developer Note */}
              <div className="text-center text-[10px] text-zinc-500 pt-2">
                <p>سامانه مدیریت و کارت‌ساز قیمت طلا و سکه گالری زرسا</p>
                <p className="font-mono mt-0.5">نسخه اپ موبایل ۳.۰ · توسعه یافته برای گوشی‌های هوشمند</p>
              </div>

            </div>
          )}

        </main>

        {/* ERGONOMIC MOBILE BOTTOM TAB BAR (THUMB REACH ZONE) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0d]/90 backdrop-blur-xl border-t border-zinc-800/40 pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
          <div className="max-w-lg mx-auto grid grid-cols-7 items-center h-16 px-1">
            
            <button
              onClick={() => { triggerHaptic(); setActiveTab('prices'); }}
              className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all active:scale-92 active:opacity-85 duration-100 android-ripple-active cursor-pointer ${
                activeTab === 'prices' ? 'text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'prices' ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'text-zinc-500'
              }`}>
                <Coins className="w-5 h-5" />
              </div>
              <span className={`text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors ${
                activeTab === 'prices' ? 'text-[#d4af37] font-black' : 'text-zinc-500'
              }`}>تابلو</span>
            </button>

            <button
              onClick={() => { triggerHaptic(); setActiveTab('calculator'); }}
              className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all active:scale-92 active:opacity-85 duration-100 android-ripple-active cursor-pointer relative ${
                activeTab === 'calculator' ? 'text-[#ffd700]' : 'text-zinc-400 hover:text-[#d4af37]'
              }`}
            >
              <div className={`px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'calculator' ? 'bg-[#d4af37]/15 text-[#ffd700]' : 'text-zinc-400'
              }`}>
                <Calculator className="w-5 h-5" />
              </div>
              <span className={`text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors ${
                activeTab === 'calculator' ? 'text-[#ffd700] font-black' : 'text-zinc-500'
              }`}>فروش</span>
            </button>

            <button
              onClick={() => { triggerHaptic(); setActiveTab('purchase'); }}
              className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all active:scale-92 active:opacity-85 duration-100 android-ripple-active cursor-pointer relative ${
                activeTab === 'purchase' ? 'text-[#ffd700]' : 'text-zinc-400 hover:text-[#d4af37]'
              }`}
            >
              <div className={`px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'purchase' ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-400'
              }`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className={`text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors ${
                activeTab === 'purchase' ? 'text-amber-400 font-black' : 'text-zinc-500'
              }`}>خرید طلا</span>
            </button>

            <button
              onClick={() => { triggerHaptic(); setActiveTab('advanced'); }}
              className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all active:scale-92 active:opacity-85 duration-100 android-ripple-active cursor-pointer relative ${
                activeTab === 'advanced' ? 'text-[#ffd700]' : 'text-zinc-400 hover:text-[#d4af37]'
              }`}
            >
              <div className={`px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'advanced' ? 'bg-[#d4af37]/15 text-[#ffd700]' : 'text-zinc-400'
              }`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <span className={`text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors ${
                activeTab === 'advanced' ? 'text-[#ffd700] font-black' : 'text-zinc-500'
              }`}>پیشرفته</span>
            </button>

            <button
              onClick={() => { triggerHaptic(); setActiveTab('sales'); }}
              className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all active:scale-92 active:opacity-85 duration-100 android-ripple-active cursor-pointer relative ${
                activeTab === 'sales' ? 'text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`px-3 py-1 rounded-full flex items-center justify-center transition-all relative ${
                activeTab === 'sales' ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'text-zinc-400'
              }`}>
                <Receipt className="w-5 h-5" />
                {invoices.length > 0 && (
                  <span className="absolute top-0 right-1.5 bg-[#d4af37] text-black text-[8px] font-black px-1 rounded-full min-w-[12px] h-3 flex items-center justify-center">
                    {invoices.length}
                  </span>
                )}
              </div>
              <span className={`text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors ${
                activeTab === 'sales' ? 'text-[#d4af37] font-black' : 'text-zinc-500'
              }`}>دفتر</span>
            </button>

            <button
              onClick={() => { triggerHaptic(); setActiveTab('card'); }}
              className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all active:scale-92 active:opacity-85 duration-100 android-ripple-active cursor-pointer ${
                activeTab === 'card' ? 'text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'card' ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'text-zinc-400'
              }`}>
                <Share2 className="w-5 h-5" />
              </div>
              <span className={`text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors ${
                activeTab === 'card' ? 'text-[#d4af37] font-black' : 'text-zinc-500'
              }`}>کارت‌ساز</span>
            </button>

            <button
              onClick={() => { triggerHaptic(); setActiveTab('settings'); }}
              className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all active:scale-92 active:opacity-85 duration-100 android-ripple-active cursor-pointer ${
                activeTab === 'settings' ? 'text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                activeTab === 'settings' ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'text-zinc-400'
              }`}>
                <SettingsIcon className="w-5 h-5" />
              </div>
              <span className={`text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors ${
                activeTab === 'settings' ? 'text-[#d4af37] font-black' : 'text-zinc-500'
              }`}>تنظیمات</span>
            </button>

          </div>
        </nav>

        {/* MODAL: ADD NEW ITEM TO CATALOG */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#141418] max-w-sm w-full rounded-3xl p-5 border border-zinc-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white">افزودن آیتم جدید به ویترین</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-500 hover:text-white text-xs font-bold px-2 py-1"
                >
                  بستن
                </button>
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setNewItemType('coin')}
                  className={`py-2 rounded-xl font-bold border transition-colors ${
                    newItemType === 'coin' 
                      ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]' 
                      : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  مسکوک بانکی
                </button>
                <button
                  onClick={() => setNewItemType('parsian')}
                  className={`py-2 rounded-xl font-bold border transition-colors ${
                    newItemType === 'parsian' 
                      ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]' 
                      : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  شمش پارسیان
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">نام آیتم</label>
                  <input 
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="مثلاً: سکه ۲ گرمی سفارشی"
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">وزن (گرم)</label>
                    <input 
                      type="number"
                      step="0.001"
                      value={newItemWeight}
                      onChange={(e) => setNewItemWeight(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37] font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">عیار</label>
                    <input 
                      type="text"
                      value={newItemKarat}
                      onChange={(e) => setNewItemKarat(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37] font-mono text-center"
                    />
                  </div>
                </div>

                {newItemType === 'coin' ? (
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">حباب اولیه (تومان)</label>
                    <input 
                      type="number"
                      step="50000"
                      value={newItemBubble}
                      onChange={(e) => setNewItemBubble(parseInt(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37] font-mono text-center"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">اجرت بسته‌بندی (تومان)</label>
                    <input 
                      type="number"
                      step="10000"
                      value={newItemFeeFixed}
                      onChange={(e) => setNewItemFeeFixed(parseInt(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37] font-mono text-center"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  onClick={handleAddNewItem}
                  className="flex-1 h-10 rounded-xl bg-[#d4af37] text-black text-xs font-black shadow-lg shadow-[#d4af37]/20"
                >
                  ثبت آیتم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM RESILIENT INTERACTIVE MODAL DIALOG (Bypassing browser confirm/prompt blockers) */}
        {modalDialog && modalDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#121216] max-w-sm w-full rounded-3xl p-5 border border-zinc-800 shadow-2xl space-y-4 text-xs text-right">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-[#d4af37]">
                <Info className="w-4 h-4" />
                <h3 className="text-sm font-black text-white">{modalDialog.title}</h3>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-line">{modalDialog.message}</p>
              
              {modalDialog.type === 'prompt' && (
                <div>
                  <input
                    type="text"
                    value={modalDialog.inputValue ?? ''}
                    onChange={(e) => setModalDialog({ ...modalDialog, inputValue: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        modalDialog.onConfirm(modalDialog.inputValue);
                      }
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setModalDialog(null)}
                  className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold border border-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => modalDialog.onConfirm(modalDialog.inputValue)}
                  className="flex-1 h-10 rounded-xl bg-[#d4af37] text-black font-black active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#d4af37]/10"
                >
                  تأیید
                </button>
              </div>
            </div>
          </div>
        )}

        <OfflineIndicator />
      </div>
    </div>
  );
}
