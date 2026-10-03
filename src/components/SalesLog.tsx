import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Trash2, 
  Copy, 
  Download, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  Search, 
  TrendingUp, 
  Check, 
  X, 
  Edit, 
  Scale, 
  Coins, 
  Eye, 
  Percent,
  SlidersHorizontal,
  ArrowUpRight,
  TrendingDown,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  Printer,
  Share2
} from 'lucide-react';
import { SaleInvoice, PurchaseInvoice, StoreSettings, ContactAccount } from '../types';
import { formatTomanAmount, toPersianDigits, toEnglishDigits, parseCleanNumber, parseCleanFloat } from '../utils/numberFormat';
import { applyRounding } from '../utils/rounding';
import { downloadInvoicePNG, downloadInvoicePDF } from '../utils/invoicePng';
import { downloadPurchaseReceiptPNG, downloadPurchaseReceiptPDF } from '../utils/purchaseReceiptPng';
import ContactsLedger from './ContactsLedger';

// High-fidelity number-to-Persian-words converter for formal financial bills
export function numberToPersianWords(num: number): string {
  if (num === 0) return 'صفر';
  const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const thousands = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];
  
  function convertSection(n: number): string {
    let res = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (h > 0) {
      res += hundreds[h];
    }
    
    if (t > 0) {
      if (res !== '') res += ' و ';
      if (t === 1) {
        res += teens[u];
        return res;
      } else {
        res += tens[t];
      }
    }
    
    if (u > 0) {
      if (res !== '') res += ' و ';
      res += units[u];
    }
    
    return res;
  }
  
  let result = '';
  let tempNum = num;
  let unitIndex = 0;
  
  while (tempNum > 0) {
    const section = tempNum % 1000;
    if (section > 0) {
      const sectionStr = convertSection(section);
      const unitStr = thousands[unitIndex];
      const combined = sectionStr + (unitStr ? ' ' + unitStr : '');
      if (result !== '') {
        result = combined + ' و ' + result;
      } else {
        result = combined;
      }
    }
    tempNum = Math.floor(tempNum / 1000);
    unitIndex++;
  }
  
  return result;
}

interface Props {
  invoices: SaleInvoice[];
  setInvoices: React.Dispatch<React.SetStateAction<SaleInvoice[]>>;
  purchases: PurchaseInvoice[];
  setPurchases: React.Dispatch<React.SetStateAction<PurchaseInvoice[]>>;
  onDeleteInvoice: (id: string) => void;
  onDeletePurchase: (id: string) => void;
  onExportPNG: (invoice: SaleInvoice) => void;
  store: StoreSettings;
  showNotification: (msg: string, type?: 'success' | 'amber' | 'error') => void;
  goldPrice: number;
  
  // Contacts Accounts Props
  accounts: ContactAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<ContactAccount[]>>;
  getPersianDate: () => string;
  getPersianTime: () => string;
}

export default function SalesLog({
  invoices,
  setInvoices,
  purchases,
  setPurchases,
  onDeleteInvoice,
  onDeletePurchase,
  onExportPNG,
  store,
  showNotification,
  goldPrice,
  accounts,
  setAccounts,
  getPersianDate,
  getPersianTime
}: Props) {
  // Ledger sub-tabs: 'documents' (دفتر اسناد) | 'reports' (گزارشات و سود) | 'contacts' (حساب معین اشخاص)
  const [activeSubTab, setActiveSubTab] = useState<'documents' | 'reports' | 'contacts'>('documents');

  // Filters for ledger of documents
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'sell' | 'buy'>('all');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | 'jewelry' | 'coin' | 'parsian' | 'melted'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'weekly' | 'monthly'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Physical Gold Inventory in Shop States (persisted in localStorage)
  const [shopGoldManufactured, setShopGoldManufactured] = useState<number>(() => {
    return Number(localStorage.getItem('zarsa_shop_gold_manufactured') || '0');
  });
  const [shopGoldSecondHand, setShopGoldSecondHand] = useState<number>(() => {
    return Number(localStorage.getItem('zarsa_shop_gold_second_hand') || '0');
  });
  const [shopGoldMelted, setShopGoldMelted] = useState<number>(() => {
    return Number(localStorage.getItem('zarsa_shop_gold_melted') || '0');
  });
  const [shopGoldCoins, setShopGoldCoins] = useState<number>(() => {
    return Number(localStorage.getItem('zarsa_shop_gold_coins') || '0');
  });

  const updateShopGold = (type: 'manufactured' | 'second_hand' | 'melted' | 'coins', val: number) => {
    if (type === 'manufactured') {
      setShopGoldManufactured(val);
      localStorage.setItem('zarsa_shop_gold_manufactured', String(val));
    } else if (type === 'second_hand') {
      setShopGoldSecondHand(val);
      localStorage.setItem('zarsa_shop_gold_second_hand', String(val));
    } else if (type === 'melted') {
      setShopGoldMelted(val);
      localStorage.setItem('zarsa_shop_gold_melted', String(val));
    } else if (type === 'coins') {
      setShopGoldCoins(val);
      localStorage.setItem('zarsa_shop_gold_coins', String(val));
    }
  };

  // Selected document modal viewing
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<any | null>(null);

  const handleShareDoc = (messenger: 'whatsapp' | 'telegram' | 'eitaa' | 'bale', doc: any) => {
    const docTypeLabel = doc.docType === 'sell' ? 'فاکتور رسمی فروش طلا' : 'رسید رسمی خرید طلا';
    const numberStr = doc.docType === 'sell' ? doc.invoiceNumber : doc.receiptNumber;
    const finalAmount = doc.docType === 'sell' ? doc.totalAmount : doc.totalPayable;
    const itemsText = `${doc.itemTitle} (وزن: ${(doc.weight || doc.rawWeight || 0).toFixed(3)} گرم)`;
    
    const text = `📜 *${docTypeLabel} - ${store.name}*
----------------------------------------
📅 تاریخ: ${doc.dateFa}
🔢 شماره سند: #${numberStr}
👤 مشتری: ${doc.customerName || 'مشتری حضوری'}
----------------------------------------
🛍️ شرح کالا:
${itemsText}
----------------------------------------
💰 مبلغ نهایی تسویه شده:
*${finalAmount.toLocaleString('fa-IR')} تومان*
(${numberToPersianWords(finalAmount)} تومان تمام)
----------------------------------------
📍 آدرس: ${store.address}
📞 تلفن: ${store.phone}
🌐 اینستاگرام: @${store.instagram}`;

    const encodedText = encodeURIComponent(text);
    let url = '';
    if (messenger === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodedText}`;
    } else if (messenger === 'telegram') {
      url = `https://t.me/share/url?text=${encodedText}`;
    } else if (messenger === 'eitaa') {
      url = `https://eitaa.com/share/url?text=${encodedText}`;
    } else if (messenger === 'bale') {
      url = `https://ble.ir/share/link?text=${encodedText}`;
    }
    
    if (url) {
      window.open(url, '_blank');
      showNotification(`در حال انتقال به پیام‌رسان...`, 'success');
    }
  };

  // Editing document state & form
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editCustomerPhone, setEditCustomerPhone] = useState<string>('');
  const [editItemTitle, setEditItemTitle] = useState<string>('');
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editGoldPrice, setEditGoldPrice] = useState<number>(0);
  const [editFeeAmount, setEditFeeAmount] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>('');
  
  // Bank fields for purchases
  const [editBankName, setEditBankName] = useState<string>('');
  const [editCardNumber, setEditCardNumber] = useState<string>('');
  const [editShabaNumber, setEditShabaNumber] = useState<string>('');
  const [editAccountOwnerName, setEditAccountOwnerName] = useState<string>('');

  // Unified list of all documents sorted by creation date
  const unifiedDocuments = useMemo(() => {
    const sellDocs = invoices.map(i => ({
      ...i,
      docType: 'sell' as const,
      timestamp: new Date(i.createdAt).getTime() || Date.now()
    }));
    
    const buyDocs = purchases.map(p => ({
      ...p,
      docType: 'buy' as const,
      timestamp: new Date(p.createdAt).getTime() || Date.now()
    }));

    return [...sellDocs, ...buyDocs].sort((a, b) => b.timestamp - a.timestamp);
  }, [invoices, purchases]);

  // Filtered documents for the ledger list
  const filteredDocuments = useMemo(() => {
    return unifiedDocuments.filter(doc => {
      // 1. Doc Type Filter
      const matchDocType = docTypeFilter === 'all' || doc.docType === docTypeFilter;
      
      // 2. Asset Type Filter (handles scrap_jewelry & jewelry as both matching 'jewelry')
      let matchAssetType = true;
      if (assetTypeFilter !== 'all') {
        if (assetTypeFilter === 'jewelry') {
          matchAssetType = doc.type === 'jewelry' || doc.type === 'scrap_jewelry';
        } else {
          matchAssetType = doc.type === assetTypeFilter;
        }
      }

      // 3. Date Range Filter
      let matchDate = true;
      if (dateRangeFilter !== 'all') {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const age = now - doc.timestamp;
        if (dateRangeFilter === 'today' && age >= oneDay) matchDate = false;
        if (dateRangeFilter === 'weekly' && age >= 7 * oneDay) matchDate = false;
        if (dateRangeFilter === 'monthly' && age >= 30 * oneDay) matchDate = false;
      }
      
      // 4. Advanced Search Query
      const q = searchQuery.trim().toLowerCase();
      const qEnglish = toEnglishDigits(q);
      const qPersian = toPersianDigits(q);
      
      const numToMatch = doc.docType === 'sell' ? (doc as any).invoiceNumber : (doc as any).receiptNumber;
      const numToMatchStr = String(numToMatch || '').toLowerCase();
      const numToMatchEng = toEnglishDigits(numToMatchStr);
      const numToMatchPer = toPersianDigits(numToMatchStr);

      const customerNameNormal = doc.customerName ? doc.customerName.toLowerCase() : '';
      const itemTitleNormal = doc.itemTitle ? doc.itemTitle.toLowerCase() : '';
      const customerPhoneNormal = doc.customerPhone ? String(doc.customerPhone) : '';

      const matchSearch = !q || 
        itemTitleNormal.includes(q) ||
        itemTitleNormal.includes(qPersian) ||
        customerNameNormal.includes(q) ||
        customerNameNormal.includes(qPersian) ||
        customerPhoneNormal.includes(q) ||
        customerPhoneNormal.includes(qEnglish) ||
        customerPhoneNormal.includes(qPersian) ||
        doc.dateFa.includes(q) ||
        doc.dateFa.includes(qPersian) ||
        numToMatchStr.includes(q) ||
        numToMatchEng.includes(qEnglish) ||
        numToMatchPer.includes(qPersian) ||
        (doc.docType === 'buy' && (doc as any).bankInfo?.cardNumber?.includes(qEnglish));

      return matchDocType && matchAssetType && matchDate && matchSearch;
    });
  }, [unifiedDocuments, docTypeFilter, assetTypeFilter, dateRangeFilter, searchQuery]);

  const reportStats = useMemo(() => {
    // 1. SELL STATS
    let totalSalesWeight = 0;
    let totalSalesRevenue = 0;
    let totalSalesProfitRial = 0;
    let totalSalesWagesReceived = 0;
    
    // Sell subcategories
    let profitJewelry = 0;
    let profitJewelryGold = 0;
    let profitCoin = 0;
    let profitParsian = 0;
    let profitMelted = 0;

    invoices.forEach(inv => {
      totalSalesWeight += inv.weight || 0;
      totalSalesRevenue += inv.totalAmount;
      totalSalesWagesReceived += inv.feeAmount || 0;

      let pRial = 0;
      if (inv.type === 'jewelry') {
        pRial = inv.profitAmount || 0;
        profitJewelry += pRial;
        const rate = inv.goldPrice || goldPrice;
        if (rate > 0) {
          profitJewelryGold += pRial / rate;
        }
      } else if (inv.type === 'parsian') {
        pRial = inv.feeAmount || 0; // for parsian, fee acts as mark-up profit
        profitParsian += pRial;
      } else if (inv.type === 'coin') {
        pRial = inv.feeAmount || 0; // coin fee acts as mark-up profit
        profitCoin += pRial;
      } else {
        pRial = inv.feeAmount || 0; // melted fee acts as mark-up profit
        profitMelted += pRial;
      }
      totalSalesProfitRial += pRial;
    });

    // 2. BUY STATS
    let totalPurchasedWeight = 0;
    let totalPurchasedPayments = 0;
    let totalPurchasedProfitRial = 0;
    
    // Special Purchase Profit variables as requested by the user
    let totalPurchasedGoldGramsReceived = 0;
    let totalPurchasedGoldGramsPaidEquivalent = 0;
    let totalPurchasedWagesDeducted = 0;
    let totalPurchasedProfitRialSpecial = 0;
    let totalPurchasedProfitGoldSpecial = 0;

    purchases.forEach(p => {
      totalPurchasedWeight += p.rawWeight || 0;
      totalPurchasedPayments += p.totalPayable;

      // Profit from purchase = actual 18k gold value received - paid amount
      const gPrice = p.goldPriceUsed || goldPrice;
      const stdW = p.standardWeight750 || 0;
      const paid = p.totalPayable;

      totalPurchasedGoldGramsReceived += stdW;
      
      const paidEq = gPrice > 0 ? (paid / gPrice) : 0;
      totalPurchasedGoldGramsPaidEquivalent += paidEq;

      const pRial = (stdW * gPrice) - paid;
      totalPurchasedProfitRialSpecial += pRial;

      const pGold = stdW - paidEq;
      totalPurchasedProfitGoldSpecial += pGold;

      totalPurchasedWagesDeducted += p.discountAmount || 0;
      totalPurchasedProfitRial += Math.max(0, pRial);
    });

    // Totals combined
    const overallProfitRial = totalSalesProfitRial + totalPurchasedProfitRialSpecial;

    // Convert profits to gold grams equivalent at today's rate (or respective transaction rate)
    const overallProfitGoldGrams = goldPrice > 0 ? (overallProfitRial / goldPrice) : 0;
    const salesProfitGoldGrams = goldPrice > 0 ? (totalSalesProfitRial / goldPrice) : 0;
    const purchasesProfitGoldGrams = goldPrice > 0 ? (totalPurchasedProfitRialSpecial / goldPrice) : 0;

    // Time-based stats (Daily, Weekly, Monthly)
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;

    let dailyProfit = 0;
    let weeklyProfit = 0;
    let monthlyProfit = 0;

    // Last 7 days daily profit list for chart
    const dailyProfitList = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('fa-IR', { weekday: 'short' });
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = dayStart + oneDay;

      let rProfit = 0;
      invoices.forEach(inv => {
        const time = new Date(inv.createdAt).getTime();
        if (time >= dayStart && time < dayEnd) {
          if (inv.type === 'jewelry') rProfit += inv.profitAmount || 0;
          else rProfit += inv.feeAmount || 0;
        }
      });
      purchases.forEach(p => {
        const time = new Date(p.createdAt).getTime();
        if (time >= dayStart && time < dayEnd) {
          const goldVal = (p.standardWeight750 || 0) * (p.goldPriceUsed || goldPrice);
          rProfit += Math.max(0, goldVal - p.totalPayable);
        }
      });

      return {
        label: dayStr,
        profit: rProfit,
        goldGrams: goldPrice > 0 ? Number((rProfit / goldPrice).toFixed(3)) : 0
      };
    }).reverse();

    // 3. CURRENT MONTH CATEGORY PROFITS (GOLD, COIN, PARSIAN)
    let currentMonthProfitGold = 0;
    let currentMonthProfitCoin = 0;
    let currentMonthProfitParsian = 0;

    const currentPersianDate = getPersianDate ? getPersianDate() : "۱۴۰۵/۰۷/۰۱";
    const normCurrentDate = toEnglishDigits(currentPersianDate);
    const dateParts = normCurrentDate.split('/');
    const currentYear = dateParts[0];
    const currentMonth = dateParts[1];

    invoices.forEach(inv => {
      const normDate = toEnglishDigits(inv.dateFa);
      const itemParts = normDate.split('/');
      const isCurrentMonth = itemParts[0] === currentYear && itemParts[1] === currentMonth;

      if (isCurrentMonth) {
        if (inv.type === 'jewelry' || inv.type === 'melted') {
          const pRial = inv.type === 'jewelry' ? (inv.profitAmount || 0) : (inv.feeAmount || 0);
          currentMonthProfitGold += pRial;
        } else if (inv.type === 'coin') {
          currentMonthProfitCoin += inv.feeAmount || 0;
        } else if (inv.type === 'parsian') {
          currentMonthProfitParsian += inv.feeAmount || 0;
        }
      }
    });

    purchases.forEach(p => {
      const normDate = toEnglishDigits(p.dateFa);
      const itemParts = normDate.split('/');
      const isCurrentMonth = itemParts[0] === currentYear && itemParts[1] === currentMonth;

      if (isCurrentMonth) {
        const gPrice = p.goldPriceUsed || goldPrice;
        const stdW = p.standardWeight750 || 0;
        const paid = p.totalPayable;
        const pRial = (stdW * gPrice) - paid;
        const finalProfit = Math.max(0, pRial);

        if (p.type === 'scrap_jewelry' || p.type === 'melted' || !p.type) {
          currentMonthProfitGold += finalProfit;
        } else if (p.type === 'coin') {
          currentMonthProfitCoin += finalProfit;
        } else if (p.type === 'parsian') {
          currentMonthProfitParsian += finalProfit;
        }
      }
    });

    unifiedDocuments.forEach(doc => {
      const docTime = doc.timestamp;
      const age = now - docTime;

      let pRial = 0;
      if (doc.docType === 'sell') {
        const inv = doc as any;
        if (inv.type === 'jewelry') pRial = inv.profitAmount || 0;
        else pRial = inv.feeAmount || 0;
      } else {
        const p = doc as any;
        const goldVal = (p.standardWeight750 || 0) * (p.goldPriceUsed || goldPrice);
        pRial = Math.max(0, goldVal - p.totalPayable);
      }

      if (age < oneDay) dailyProfit += pRial;
      if (age < sevenDays) weeklyProfit += pRial;
      if (age < thirtyDays) monthlyProfit += pRial;
    });

    return {
      totalSalesWeight,
      totalSalesRevenue,
      totalSalesProfitRial,
      salesProfitGoldGrams,
      totalSalesWagesReceived,
      
      profitJewelry,
      profitJewelryGold,
      profitCoin,
      profitParsian,
      profitMelted,
      
      totalPurchasedWeight,
      totalPurchasedPayments,
      totalPurchasedProfitRial,
      purchasesProfitGoldGrams,
      
      totalPurchasedGoldGramsReceived,
      totalPurchasedGoldGramsPaidEquivalent,
      totalPurchasedWagesDeducted,
      totalPurchasedProfitRialSpecial,
      totalPurchasedProfitGoldSpecial,

      overallProfitRial,
      overallProfitGoldGrams,

      dailyProfit,
      weeklyProfit,
      monthlyProfit,
      dailyProfitList,

      currentMonthProfitGold,
      currentMonthProfitCoin,
      currentMonthProfitParsian
    };
  }, [invoices, purchases, goldPrice]);

  // Calculations for Physical Gold Ownership Balance Sheet
  const totalPhysicalGoldInShop = shopGoldManufactured + shopGoldSecondHand + shopGoldMelted + shopGoldCoins;

  const { totalGoldOwedToOthers, totalGoldOwedByOthers } = useMemo(() => {
    let owedToOthers = 0; // بدهی طلایی ما به دیگران (امانت دیگران نزد ما) -> حساب معین همکار بستانکار
    let owedByOthers = 0; // طلب طلایی ما از دیگران -> حساب معین همکار بدهکار

    accounts.forEach(acc => {
      if (acc.currentGoldBalance > 0) {
        owedToOthers += acc.currentGoldBalance;
      } else if (acc.currentGoldBalance < 0) {
        owedByOthers += Math.abs(acc.currentGoldBalance);
      }
    });

    return {
      totalGoldOwedToOthers: owedToOthers,
      totalGoldOwedByOthers: owedByOthers
    };
  }, [accounts]);

  // طلا ملکی = کل طلای فیزیکی مغازه + طلب‌های طلایی ما - بدهی‌های طلایی ما
  const netOwnedGoldEquity = totalPhysicalGoldInShop + totalGoldOwedByOthers - totalGoldOwedToOthers;

  // Percentages
  const ownedPercent = totalPhysicalGoldInShop > 0 ? Math.max(0, Math.min(100, (netOwnedGoldEquity / totalPhysicalGoldInShop) * 100)) : 0;
  const consignedPercent = totalPhysicalGoldInShop > 0 ? Math.max(0, Math.min(100, (totalGoldOwedToOthers / totalPhysicalGoldInShop) * 100)) : 0;

  // Open Document view
  const handleOpenDoc = (doc: any) => {
    setSelectedDoc(doc);
  };

  // Trigger edit document form
  const handleStartEdit = (doc: any) => {
    setEditingDoc(doc);
    setEditCustomerName(doc.customerName || '');
    setEditCustomerPhone(doc.customerPhone || '');
    setEditItemTitle(doc.itemTitle || '');
    setEditWeight(doc.docType === 'sell' ? doc.weight : doc.rawWeight);
    setEditGoldPrice(doc.goldPriceUsed || doc.goldPrice || goldPrice);
    setEditFeeAmount(doc.feeAmount || 0);
    setEditNote(doc.note || '');

    if (doc.docType === 'buy' && doc.bankInfo) {
      setEditBankName(doc.bankInfo.bankName || '');
      setEditCardNumber(doc.bankInfo.cardNumber?.replace(/[^0-9]/g, '') || '');
      setEditShabaNumber(doc.bankInfo.shabaNumber || '');
      setEditAccountOwnerName(doc.bankInfo.accountOwnerName || '');
    } else {
      setEditBankName('');
      setEditCardNumber('');
      setEditShabaNumber('');
      setEditAccountOwnerName('');
    }
    
    // Close the viewing modal first
    setSelectedDoc(null);
  };

  // Submit document modifications
  const handleSaveDocEdits = () => {
    if (!editingDoc) return;

    if (editingDoc.docType === 'sell') {
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === editingDoc.id) {
          const updatedRaw = Math.round(editWeight * editGoldPrice);
          let updatedTotal = updatedRaw + editFeeAmount;
          if (inv.type === 'jewelry') {
            // Recalculate profit if jewelry type is 7%
            const profitVal = Math.round((updatedRaw + editFeeAmount) * 0.07);
            const taxVal = inv.taxPercent ? Math.round((editFeeAmount + profitVal) * (inv.taxPercent / 100)) : 0;
            updatedTotal = updatedRaw + editFeeAmount + profitVal + taxVal - (inv.discountAmount || 0);
            return {
              ...inv,
              customerName: editCustomerName || undefined,
              customerPhone: editCustomerPhone || undefined,
              itemTitle: editItemTitle,
              weight: editWeight,
              goldPrice: editGoldPrice,
              rawGoldAmount: updatedRaw,
              feeAmount: editFeeAmount,
              profitAmount: profitVal,
              taxAmount: taxVal,
              totalAmount: applyRounding(updatedTotal, store.rounding),
              note: editNote
            };
          }

          return {
            ...inv,
            customerName: editCustomerName || undefined,
            customerPhone: editCustomerPhone || undefined,
            itemTitle: editItemTitle,
            weight: editWeight,
            goldPrice: editGoldPrice,
            rawGoldAmount: updatedRaw,
            feeAmount: editFeeAmount,
            totalAmount: applyRounding(updatedTotal, store.rounding),
            note: editNote
          };
        }
        return inv;
      });
      setInvoices(updatedInvoices);
      localStorage.setItem('zarsa_sales_invoices', JSON.stringify(updatedInvoices));
    } else {
      // Purchase
      const updatedPurchases = purchases.map(p => {
        if (p.id === editingDoc.id) {
          const stdWeight750 = Number(((editWeight * p.sourceKarat) / 750).toFixed(3));
          const rawTotal = Math.round(stdWeight750 * editGoldPrice);
          
          let payable = rawTotal;
          if (p.type === 'parsian' || p.type === 'coin') {
            payable = rawTotal - editFeeAmount; // fee acted as deduction
          }

          return {
            ...p,
            customerName: editCustomerName,
            customerPhone: editCustomerPhone,
            itemTitle: editItemTitle,
            rawWeight: editWeight,
            standardWeight750: stdWeight750,
            goldPriceUsed: editGoldPrice,
            discountAmount: p.type === 'coin' || p.type === 'parsian' ? editFeeAmount : p.discountAmount,
            totalPayable: applyRounding(payable, store.rounding),
            bankInfo: p.bankInfo ? {
              ...p.bankInfo,
              bankName: editBankName,
              cardNumber: editCardNumber ? editCardNumber.replace(/(\d{4})/g, '$1-').slice(0, 19).replace(/-$/, '') : '',
              shabaNumber: editShabaNumber,
              accountOwnerName: editAccountOwnerName || editCustomerName
            } : undefined,
            note: editNote
          };
        }
        return p;
      });
      setPurchases(updatedPurchases);
      localStorage.setItem('zarsa_purchase_invoices', JSON.stringify(updatedPurchases));
    }

    setEditingDoc(null);
    showNotification('سند مالی با موفقیت ویرایش و بروزرسانی شد', 'success');
  };

  // Handle Document Delete
  const handleConfirmDelete = (doc: any) => {
    setDeleteConfirmDoc(doc);
  };

  const executeDeleteDoc = (doc: any) => {
    if (doc.docType === 'sell') {
      onDeleteInvoice(doc.id);
    } else {
      onDeletePurchase(doc.id);
    }
    setDeleteConfirmDoc(null);
    setSelectedDoc(null);
  };

  // Copy textual receipt summary
  const copyDocText = (doc: any) => {
    let t = '';
    if (doc.docType === 'sell') {
      t = `🧾 فاکتور فروش طلا - ${store.name}\n` +
          `شماره فاکتور: #${doc.invoiceNumber}\n` +
          `📅 تاریخ: ${doc.dateFa} · ساعت ${doc.timeFa}\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          (doc.customerName ? `👤 مشتری: ${doc.customerName}${doc.customerPhone ? ` (${doc.customerPhone})` : ''}\n` : '') +
          `💍 شرح کالا: ${doc.itemTitle}\n` +
          `⚖️ وزن خالص: ${doc.weight} گرم\n` +
          `🪙 نرخ هر گرم ۱۸ عیار: ${doc.goldPrice.toLocaleString('fa-IR')} تومان\n` +
          `─────────────────────\n` +
          (doc.rawGoldAmount ? `▫️ ارزش طلای خام: ${doc.rawGoldAmount.toLocaleString('fa-IR')} تومان\n` : '') +
          (doc.feeAmount > 0 ? `▫️ اجرت ساخت/کارمزد: ${doc.feeAmount.toLocaleString('fa-IR')} تومان\n` : '') +
          (doc.profitAmount > 0 ? `▫️ سود گالری (${doc.profitPercent || 7}٪): ${doc.profitAmount.toLocaleString('fa-IR')} تومان\n` : '') +
          (doc.taxAmount > 0 ? `▫️ مالیات ارزش‌افزوده: ${doc.taxAmount.toLocaleString('fa-IR')} تومان\n` : '') +
          (doc.discountAmount > 0 ? `▫️ تخفیف: -${doc.discountAmount.toLocaleString('fa-IR')} تومان\n` : '') +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 مبلغ کل فاکتور: ${doc.totalAmount.toLocaleString('fa-IR')} تومان\n`;
    } else {
      t = `🧾 رسید رسمی خرید طلا - ${store.name}\n` +
          `شماره رسید: #${doc.receiptNumber}\n` +
          `📅 تاریخ: ${doc.dateFa} · ساعت ${doc.timeFa}\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 فروشنده: ${doc.customerName || 'مشتری حضوری'}\n` +
          `💍 شرح کالا: ${doc.itemTitle}\n` +
          `⚖️ وزن طلا: ${doc.rawWeight} گرم (عیار ${doc.sourceKarat})\n` +
          `⚖️ وزن معادل ۱۸ عیار: ${doc.standardWeight750} گرم\n` +
          `🪙 نرخ روز مبنا: ${doc.goldPriceUsed.toLocaleString('fa-IR')} تومان\n` +
          (doc.bankInfo?.cardNumber ? `💳 شماره کارت واریز: ${doc.bankInfo.cardNumber} (${doc.bankInfo.bankName || 'شتاب'})\n` : '') +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 مبلغ پرداختی نهایی به مشتری: ${doc.totalPayable.toLocaleString('fa-IR')} تومان\n`;
    }

    t += `━━━━━━━━━━━━━━━━━━━━━\n` +
         `🔐 شناسه رهگیری حسابداری زرسا: IR-GOLD-${doc.invoiceNumber || doc.receiptNumber}\n`;

    navigator.clipboard.writeText(t);
    showNotification('متن سند مالی در حافظه کپی شد', 'success');
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* LEDGER HEADER SUB-TABS SELECTOR */}
      <div className="bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 grid grid-cols-3 gap-1.5 text-xs">
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeSubTab === 'documents'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/15'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">دفتر اسناد</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contacts')}
          className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeSubTab === 'contacts'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/15'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">حساب اشخاص (معین)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeSubTab === 'reports'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/15'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">گزارش سود</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW TAB: FINANCIAL DOCUMENTS LEDGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'documents' && (
        <div className="space-y-3">
          
          {/* SEARCH & DOC FILTER BAR */}
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-zinc-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در فاکتورها، نام مشتری، تاریخ، شماره فاکتور، کارت بانکی..."
                className="w-full h-10 pr-9 pl-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:border-[#d4af37] outline-none"
              />
            </div>

            {/* Segmented type filter */}
            <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl text-[11px] border border-zinc-850">
              <button
                onClick={() => setDocTypeFilter('all')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  docTypeFilter === 'all' ? 'bg-[#d4af37] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                همه اسناد ({unifiedDocuments.length})
              </button>
              <button
                onClick={() => setDocTypeFilter('sell')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  docTypeFilter === 'sell' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                <span>فروش ({invoices.length})</span>
              </button>
              <button
                onClick={() => setDocTypeFilter('buy')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  docTypeFilter === 'buy' ? 'bg-red-500/20 text-red-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span>خرید ({purchases.length})</span>
              </button>
            </div>

            {/* Advanced selectors row */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Asset type dropdown */}
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">نوع طلا / معامله:</label>
                <select
                  value={assetTypeFilter}
                  onChange={(e) => setAssetTypeFilter(e.target.value as any)}
                  className="w-full h-9 px-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none focus:border-[#d4af37]"
                >
                  <option value="all">💎 همه دارایی‌ها</option>
                  <option value="jewelry">💍 طلای ساخته‌شده/متفرقه</option>
                  <option value="coin">🪙 سکه بهار آزادی</option>
                  <option value="parsian">💳 شمش پارسیان</option>
                  <option value="melted">🧪 طلای آب‌شده</option>
                </select>
              </div>

              {/* Date range filter */}
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">محدوده تاریخ معامله:</label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value as any)}
                  className="w-full h-9 px-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none focus:border-[#d4af37]"
                >
                  <option value="all">📅 کل تاریخچه ثبت‌شده</option>
                  <option value="today">📅 معاملات امروز</option>
                  <option value="weekly">📅 ۷ روز گذشته</option>
                  <option value="monthly">📅 ۳۰ روز گذشته</option>
                </select>
              </div>
            </div>
          </div>

          {/* LIST OF TRANSACTION DOCUMENTS */}
          <div className="space-y-2.5">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-16 bg-zinc-950/40 rounded-3xl border border-zinc-800/80 space-y-2">
                <Receipt className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-xs font-bold text-zinc-400">هیچ سندی یافت نشد.</p>
                <p className="text-[11px] text-zinc-500">تنظیمات فیلتر یا متن جستجو را تغییر دهید.</p>
              </div>
            ) : (
              filteredDocuments.map((doc, idx) => {
                const isSell = doc.docType === 'sell';
                const totalAmount = isSell ? (doc as any).totalAmount : (doc as any).totalPayable;
                const docNum = isSell ? (doc as any).invoiceNumber : (doc as any).receiptNumber;
                
                // Calculate individual document profit
                const getDocProfit = (d: any) => {
                  if (d.docType === 'sell') {
                    if (d.type === 'jewelry') {
                      return {
                        rial: d.profitAmount || 0,
                        gold: d.goldPrice > 0 ? (d.profitAmount || 0) / d.goldPrice : 0
                      };
                    } else {
                      return {
                        rial: d.feeAmount || 0,
                        gold: d.goldPrice > 0 ? (d.feeAmount || 0) / d.goldPrice : 0
                      };
                    }
                  } else {
                    const gPrice = d.goldPriceUsed || goldPrice;
                    const stdW = d.standardWeight750 || 0;
                    const paid = d.totalPayable;
                    const value = stdW * gPrice;
                    const rialProfit = Math.max(0, value - paid);
                    const goldProfit = gPrice > 0 ? rialProfit / gPrice : 0;
                    return {
                      rial: rialProfit,
                      gold: goldProfit
                    };
                  }
                };

                const profit = getDocProfit(doc);
                
                return (
                  <div
                    key={`${doc.docType}-${doc.id}-${idx}`}
                    onClick={() => handleOpenDoc(doc)}
                    className="bg-zinc-900/60 hover:bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs group"
                  >
                    {/* Content Section */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider ${
                          isSell ? 'bg-emerald-500/25 text-emerald-400' : 'bg-red-500/25 text-red-400'
                        }`}>
                          {isSell ? 'فروش' : 'خرید'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono font-bold">#{docNum}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{doc.dateFa} · {doc.timeFa}</span>
                        <span className="text-[10px] text-zinc-500">
                          {doc.type === 'jewelry' || doc.type === 'scrap_jewelry' ? '💍 ساخته‌شده/متفرقه' : 
                           doc.type === 'coin' ? '🪙 سکه طلا' : 
                           doc.type === 'parsian' ? '💳 شمش پارسیان' : '🧪 آب‌شده'}
                        </span>
                      </div>
                      
                      <h4 className="font-black text-white truncate text-xs sm:text-sm">{doc.itemTitle}</h4>
                      
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{doc.customerName || 'مشتری حضوری'}</span>
                        </div>
                        {doc.customerPhone && (
                          <div className="flex items-center gap-1 font-mono">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{doc.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Explicit Profit per invoice */}
                      <div className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-zinc-500 font-normal">سود فاکتور:</span>
                        <span className="font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded text-emerald-300">{formatTomanAmount(profit.rial)} ت</span>
                        <span className="text-zinc-600">·</span>
                        <span className="font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded text-emerald-300">{profit.gold.toFixed(3)} گرم ۱۸ عیار</span>
                      </div>
                    </div>

                    {/* Numeric info & management actions */}
                    <div className="flex sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-zinc-800/80 pt-3 md:pt-0 shrink-0">
                      <div className="text-right">
                        <span className={`text-base font-black font-mono block ${
                          isSell ? 'text-[#ffd700]' : 'text-red-400'
                        }`}>
                          {isSell ? '+' : '-'}{formatTomanAmount(totalAmount)} تومان
                        </span>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          <span>{doc.rawWeight || (doc as any).weight} گرم طلا</span>
                          {doc.sourceKarat && (
                            <span className="mr-1">({doc.sourceKarat} عیار)</span>
                          )}
                        </div>
                      </div>

                      {/* Explicit Row Actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDoc(doc)}
                          title="مشاهده سند"
                          className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-zinc-800/80 active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(doc)}
                          title="ویرایش فاکتور"
                          className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer border border-zinc-800/80 active:scale-95"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(doc)}
                          title="حذف سند"
                          className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer border border-zinc-800/80 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {activeSubTab === 'contacts' && (
        <ContactsLedger
          accounts={accounts}
          setAccounts={setAccounts}
          goldPrice={goldPrice}
          showNotification={showNotification}
          getPersianDate={getPersianDate}
          getPersianTime={getPersianTime}
          store={store}
          purchases={purchases}
          setPurchases={setPurchases}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. REPORT TAB: FINANCIAL STATS & PROFIT REPORTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          
          {/* PROFIT SUMMARY OVERVIEW GRID */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Rial Profit */}
            <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4 rounded-3xl border border-[#d4af37]/45 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl" />
              <span className="text-[11px] text-zinc-400 font-bold block mb-1">کل سود ریالی حاصله:</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                {formatTomanAmount(reportStats.overallProfitRial)}
              </span>
              <span className="text-[10px] text-zinc-500 mr-1 block sm:inline">تومان</span>
              <span className="text-[9px] text-zinc-500 block mt-1">تراکنش‌های ثبت شده خرید و فروش</span>
            </div>

            {/* Gold Profit */}
            <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4 rounded-3xl border border-[#d4af37]/45 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />
              <span className="text-[11px] text-zinc-400 font-bold block mb-1">معادل سود طلایی کسب‌شده:</span>
              <span className="text-lg sm:text-2xl font-black text-[#ffd700] font-mono">
                {reportStats.overallProfitGoldGrams.toLocaleString('fa-IR', { maximumFractionDigits: 3 })}
              </span>
              <span className="text-[10px] text-zinc-500 mr-1 block sm:inline">گرم ۱۸ عیار</span>
              <span className="text-[9px] text-amber-500/60 block mt-1">در صورت تبدیل پول سود به طلا طلا</span>
            </div>
          </div>

          {/* NEW SECTION: ANALYTICAL CATEGORY PROFIT DASHBOARD & BAR CHART */}
          {(() => {
            const mGold = reportStats.currentMonthProfitGold || 0;
            const mCoin = reportStats.currentMonthProfitCoin || 0;
            const mParsian = reportStats.currentMonthProfitParsian || 0;
            const mTotal = mGold + mCoin + mParsian;

            const gPct = mTotal > 0 ? (mGold / mTotal) * 100 : 0;
            const cPct = mTotal > 0 ? (mCoin / mTotal) * 100 : 0;
            const pPct = mTotal > 0 ? (mParsian / mTotal) * 100 : 0;

            const currentPersianDate = getPersianDate ? getPersianDate() : "۱۴۰۵/۰۷/۰۱";
            const normCurrentDate = toEnglishDigits(currentPersianDate);
            const dateParts = normCurrentDate.split('/');
            const monthIdx = parseInt(dateParts[1], 10) - 1;
            const monthsName = [
              'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
              'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
            ];
            const currentMonthName = monthIdx >= 0 && monthIdx < 12 ? monthsName[monthIdx] : 'جاری';

            return (
              <div className="bg-zinc-900/60 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5 font-display text-[13px] tracking-wide">
                    <TrendingUp className="w-4 h-4 text-[#ffd700]" />
                    <span>داشبورد تحلیلی تفکیک سود ماه {currentMonthName}</span>
                  </h3>
                  <span className="text-[9.5px] bg-[#d4af37]/10 text-[#ffd700] border border-[#d4af37]/25 px-2 py-1 rounded-xl font-mono">
                    کل سود ماه: {formatTomanAmount(mTotal)} ت
                  </span>
                </div>

                <p className="text-[10px] text-zinc-500 leading-relaxed text-right">
                  نمودار مقایسه‌ای سهم هر یک از رسته‌های طلای نو/آب‌شده، سکه بهار آزادی و شمش پارسیان از کل سود خالص گالری در ماه {currentMonthName} سال {toPersianDigits(dateParts[0])}
                </p>

                {/* Visual Vertical Bar Chart Dashboard */}
                {(() => {
                  const maxProfit = Math.max(mGold, mCoin, mParsian, 1);
                  const goldHeight = (mGold / maxProfit) * 100;
                  const coinHeight = (mCoin / maxProfit) * 100;
                  const parsianHeight = (mParsian / maxProfit) * 100;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                      
                      {/* Left Column: Visual Vertical Bar Graph */}
                      <div className="md:col-span-7 bg-zinc-950/85 p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between h-[280px]">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-900 pb-2">
                          <span>نمودار میله‌ای سود خالص ماه جاری</span>
                          <span className="font-mono text-emerald-400">سقف: {formatTomanAmount(maxProfit)} ت</span>
                        </div>
                        
                        {/* Graph Viewport */}
                        <div className="relative flex-1 flex items-end justify-around pt-8 pb-2 px-2 gap-4">
                          
                          {/* Grid Horizontal Guide Lines */}
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] text-zinc-700/60 font-mono" dir="ltr">
                            <div className="border-b border-zinc-800/30 w-full pt-6 flex justify-between">
                              <span>100%</span>
                              <span className="h-px bg-zinc-800/10 flex-1 mx-2 mt-1"></span>
                            </div>
                            <div className="border-b border-zinc-800/30 w-full flex justify-between">
                              <span>75%</span>
                              <span className="h-px bg-zinc-800/10 flex-1 mx-2 mt-1"></span>
                            </div>
                            <div className="border-b border-zinc-800/30 w-full flex justify-between">
                              <span>50%</span>
                              <span className="h-px bg-zinc-800/10 flex-1 mx-2 mt-1"></span>
                            </div>
                            <div className="border-b border-zinc-800/30 w-full flex justify-between">
                              <span>25%</span>
                              <span className="h-px bg-zinc-800/10 flex-1 mx-2 mt-1"></span>
                            </div>
                            <div className="w-full flex justify-between">
                              <span>0%</span>
                              <span className="h-px bg-zinc-800/10 flex-1 mx-2 mt-1"></span>
                            </div>
                          </div>

                          {/* Bar 1: Gold */}
                          <div className="flex flex-col items-center flex-1 h-full justify-end relative z-10 group">
                            {/* Always visible values, formatted beautifully */}
                            <div className="absolute -top-1 opacity-90 group-hover:opacity-100 transition-opacity bg-zinc-900 text-[#ffd700] border border-[#d4af37]/35 text-[8.5px] font-black px-1.5 py-0.5 rounded-md shadow-lg pointer-events-none mb-1 font-mono">
                              {formatTomanAmount(mGold)} ت
                            </div>
                            {/* Vertical Bar */}
                            <div 
                              className="w-8 sm:w-12 bg-gradient-to-t from-amber-600 via-amber-500 to-[#d4af37] rounded-t-xl shadow-[0_0_20px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] transition-all duration-500 ease-out relative overflow-hidden"
                              style={{ height: `${Math.max(4, goldHeight)}%` }}
                            >
                              <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                            </div>
                            <span className="text-[9px] font-bold text-zinc-300 mt-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                              <span>طلا</span>
                            </span>
                          </div>

                          {/* Bar 2: Coin */}
                          <div className="flex flex-col items-center flex-1 h-full justify-end relative z-10 group">
                            {/* Tooltip on top of bar */}
                            <div className="absolute -top-1 opacity-90 group-hover:opacity-100 transition-opacity bg-zinc-900 text-amber-400 border border-amber-500/35 text-[8.5px] font-black px-1.5 py-0.5 rounded-md shadow-lg pointer-events-none mb-1 font-mono">
                              {formatTomanAmount(mCoin)} ت
                            </div>
                            {/* Vertical Bar */}
                            <div 
                              className="w-8 sm:w-12 bg-gradient-to-t from-orange-600 via-amber-600 to-amber-500 rounded-t-xl shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all duration-500 ease-out relative overflow-hidden"
                              style={{ height: `${Math.max(4, coinHeight)}%` }}
                            >
                              <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                            </div>
                            <span className="text-[9px] font-bold text-zinc-300 mt-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>سکه</span>
                            </span>
                          </div>

                          {/* Bar 3: Parsian */}
                          <div className="flex flex-col items-center flex-1 h-full justify-end relative z-10 group">
                            {/* Tooltip on top of bar */}
                            <div className="absolute -top-1 opacity-90 group-hover:opacity-100 transition-opacity bg-zinc-900 text-yellow-400 border border-yellow-500/35 text-[8.5px] font-black px-1.5 py-0.5 rounded-md shadow-lg pointer-events-none mb-1 font-mono">
                              {formatTomanAmount(mParsian)} ت
                            </div>
                            {/* Vertical Bar */}
                            <div 
                              className="w-8 sm:w-12 bg-gradient-to-t from-yellow-600 via-yellow-500 to-[#ffd700] rounded-t-xl shadow-[0_0_20px_rgba(250,204,21,0.15)] group-hover:shadow-[0_0_25px_rgba(250,204,21,0.3)] transition-all duration-500 ease-out relative overflow-hidden"
                              style={{ height: `${Math.max(4, parsianHeight)}%` }}
                            >
                              <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                            </div>
                            <span className="text-[9px] font-bold text-zinc-300 mt-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                              <span>پارسیان</span>
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Right Column: Detailed Breakdowns */}
                      <div className="md:col-span-5 flex flex-col justify-around gap-2 bg-zinc-950/40 p-3 rounded-2xl border border-zinc-800/40" dir="rtl">
                        <span className="text-[10px] text-zinc-400 font-bold block">سهم سود خالص رده‌ها:</span>
                        
                        {/* Category 1: Gold */}
                        <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-900/60 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10.5px] font-bold text-zinc-300 block">✨ طلا و آب‌شده</span>
                            <span className="text-[9.5px] text-[#ffd700] font-mono block">{formatTomanAmount(mGold)} تومان</span>
                          </div>
                          <span className="text-xs font-black text-[#ffd700] font-mono bg-[#d4af37]/10 px-2 py-1 rounded-lg">
                            {gPct.toFixed(1)}٪
                          </span>
                        </div>

                        {/* Category 2: Coins */}
                        <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-900/60 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10.5px] font-bold text-zinc-300 block">🪙 انواع مسکوکات</span>
                            <span className="text-[9.5px] text-amber-500 font-mono block">{formatTomanAmount(mCoin)} تومان</span>
                          </div>
                          <span className="text-xs font-black text-amber-500 font-mono bg-amber-500/10 px-2 py-1 rounded-lg">
                            {cPct.toFixed(1)}٪
                          </span>
                        </div>

                        {/* Category 3: Parsians */}
                        <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-900/60 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10.5px] font-bold text-zinc-300 block">🏷️ شمش و پارسیان</span>
                            <span className="text-[9.5px] text-yellow-400 font-mono block">{formatTomanAmount(mParsian)} تومان</span>
                          </div>
                          <span className="text-xs font-black text-yellow-400 font-mono bg-yellow-400/10 px-2 py-1 rounded-lg">
                            {pPct.toFixed(1)}٪
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {mTotal === 0 && (
                  <div className="text-center py-5 border border-zinc-800/80 rounded-2xl bg-zinc-950/20">
                    <span className="text-[10px] text-zinc-500 block font-bold">⚠️ هنوز تراکنش سوددهی برای ماه جاری ثبت نشده است.</span>
                    <span className="text-[9px] text-zinc-600 block mt-1">تراکنش‌های ثبت شده طلا، سکه و پارسیان به صورت اتوماتیک در این بخش تفکیک می‌شوند.</span>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* NEW SECTION: GOLD OWNERSHIP BALANCE SHEET (تفکیک طلا امانی و ملکی) */}
          {/* ========================================================================= */}
          <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-4">
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-zinc-800 pb-2 font-display text-[13px] tracking-wide">
                <Scale className="w-4 h-4 text-[#ffd700]" />
                <span>ترازنامه مالکیت طلا (تفکیک موجودی امانی و ملکی مغازه)</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">تفکیک علمی و هوشمند طلا بر اساس کل وزن طلای فیزیکی مغازه و تعهدات طلایی به همکاران و مشتریان</p>
            </div>

            {/* Form Inputs for Physical Gold Inventory */}
            <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-850 space-y-3">
              <span className="text-[10.5px] font-bold text-[#ffd700] block mb-1">✍️ ۱. وزن کل طلاهای موجود در مغازه خود را وارد کنید:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px]">
                <div>
                  <label className="text-[9.5px] text-zinc-400 block mb-1">طلای ساخته‌شده نو (گرم):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={shopGoldManufactured || ''}
                    onChange={(e) => updateShopGold('manufactured', parseCleanFloat(e.target.value))}
                    placeholder="۰.۰۰"
                    className="w-full h-9 px-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-zinc-400 block mb-1">طلای متفرقه / دست‌دوم (گرم):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={shopGoldSecondHand || ''}
                    onChange={(e) => updateShopGold('second_hand', parseCleanFloat(e.target.value))}
                    placeholder="۰.۰۰"
                    className="w-full h-9 px-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-zinc-400 block mb-1">طلای آبشده (گرم):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={shopGoldMelted || ''}
                    onChange={(e) => updateShopGold('melted', parseCleanFloat(e.target.value))}
                    placeholder="۰.۰۰"
                    className="w-full h-9 px-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-zinc-400 block mb-1">سکه و پارسیان (معادل گرم):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={shopGoldCoins || ''}
                    onChange={(e) => updateShopGold('coins', parseCleanFloat(e.target.value))}
                    placeholder="۰.۰۰"
                    className="w-full h-9 px-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>

            {/* Analysis & Visualization Results */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-3.5 text-xs">
              <span className="text-[10.5px] font-bold text-[#ffd700] block mb-1">📊 ۲. تراز تفکیکی موجودی:</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-850">
                  <span className="text-[9.5px] text-zinc-500 block">کل طلا فیزیکی مغازه</span>
                  <span className="font-mono font-black text-white text-xs block mt-0.5">{totalPhysicalGoldInShop.toLocaleString('fa-IR')} گرم</span>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-850">
                  <span className="text-[9.5px] text-zinc-500 block">طلب‌های طلایی شما</span>
                  <span className="font-mono font-black text-emerald-400 text-xs block mt-0.5">+{totalGoldOwedByOthers.toLocaleString('fa-IR')} گرم</span>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-850">
                  <span className="text-[9.5px] text-rose-400 font-bold block">طلای امانی مردم نزد شما</span>
                  <span className="font-mono font-black text-rose-400 text-xs block mt-0.5">-{totalGoldOwedToOthers.toLocaleString('fa-IR')} گرم</span>
                </div>
                <div className="bg-[#d4af37]/10 p-2.5 rounded-xl border border-[#d4af37]/20">
                  <span className="text-[9.5px] text-amber-300 block font-bold">سهم طلای خالص ملکی شما</span>
                  <span className={`font-mono font-black text-xs block mt-0.5 ${netOwnedGoldEquity >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {netOwnedGoldEquity.toLocaleString('fa-IR')} گرم
                  </span>
                </div>
              </div>

              {/* Ownership Bar */}
              {totalPhysicalGoldInShop > 0 ? (
                <div className="space-y-2.5 pt-1">
                  <div className="flex justify-between text-[9.5px] font-bold">
                    <span className="text-amber-400 font-black">سهم ملکی شما: {ownedPercent.toFixed(1)}٪</span>
                    <span className="text-rose-400 font-black">سهم امانی و مال مردم: {consignedPercent.toFixed(1)}٪</span>
                  </div>
                  <div className="w-full h-3.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex">
                    <div 
                      style={{ width: `${ownedPercent}%` }} 
                      className="bg-gradient-to-r from-amber-600 to-yellow-400 h-full transition-all duration-500 shadow-[0_0_8px_rgba(212,175,55,0.2)]" 
                    />
                    <div 
                      style={{ width: `${consignedPercent}%` }} 
                      className="bg-gradient-to-r from-rose-600 to-red-500 h-full transition-all duration-500" 
                    />
                  </div>

                  <p className="text-[10.5px] text-zinc-400 leading-relaxed text-right pt-2 border-t border-zinc-900/60 mt-1">
                    💡 **نتیجه ترازنامه:** از کل **{totalPhysicalGoldInShop.toLocaleString('fa-IR')} گرم** طلای فیزیکی موجود در ویترین و گاوصندوق مغازه شما، سهم متعلق به دارایی واقعی خودتان **{Math.max(0, netOwnedGoldEquity).toLocaleString('fa-IR')} گرم** است و معادل **{totalGoldOwedToOthers.toLocaleString('fa-IR')} گرم** طلا متعلق به همکاران و امانتی مردم می‌باشد که به عنوان تعهدات طلایی مغازه منظور شده است.
                  </p>

                  {/* Category-by-Category Owned vs Consigned Gold Breakdown Table */}
                  <div className="mt-4 pt-3.5 border-t border-zinc-900/60 space-y-2">
                    <span className="text-[10.5px] font-black text-white block">📊 تفکیک موجودی فیزیکی به تفکیک ردیف‌های طلا:</span>
                    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
                      <table className="w-full text-right text-[10.5px]">
                        <thead>
                          <tr className="bg-zinc-950 text-zinc-400 font-bold border-b border-zinc-800 text-[9.5px]">
                            <th className="p-2">دسته‌بندی طلا فیزیکی</th>
                            <th className="p-2 text-center">وزن کل مغازه</th>
                            <th className="p-2 text-center text-amber-400">سهم ملکی شما</th>
                            <th className="p-2 text-center text-rose-400">سهم امانتی مردم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {shopGoldManufactured > 0 && (
                            <tr>
                              <td className="p-2 font-bold text-zinc-200">💍 طلای ساخته‌شده نو</td>
                              <td className="p-2 text-center font-mono">{shopGoldManufactured.toLocaleString('fa-IR')} گرم</td>
                              <td className="p-2 text-center font-mono text-amber-400 font-bold">
                                {ownedPercent.toFixed(1)}٪ ({((shopGoldManufactured * ownedPercent) / 100).toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم)
                              </td>
                              <td className="p-2 text-center font-mono text-rose-400">
                                {consignedPercent.toFixed(1)}٪ ({((shopGoldManufactured * consignedPercent) / 100).toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم)
                              </td>
                            </tr>
                          )}
                          {shopGoldSecondHand > 0 && (
                            <tr>
                              <td className="p-2 font-bold text-zinc-200">🩹 طلای متفرقه / دست‌دوم</td>
                              <td className="p-2 text-center font-mono">{shopGoldSecondHand.toLocaleString('fa-IR')} گرم</td>
                              <td className="p-2 text-center font-mono text-amber-400 font-bold">
                                {ownedPercent.toFixed(1)}٪ ({((shopGoldSecondHand * ownedPercent) / 100).toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم)
                              </td>
                              <td className="p-2 text-center font-mono text-rose-400">
                                {consignedPercent.toFixed(1)}٪ ({((shopGoldSecondHand * consignedPercent) / 100).toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم)
                              </td>
                            </tr>
                          )}
                          {shopGoldMelted > 0 && (
                            <tr>
                              <td className="p-2 font-bold text-zinc-200">🧪 طلای آب‌شده</td>
                              <td className="p-2 text-center font-mono">{shopGoldMelted.toLocaleString('fa-IR')} گرم</td>
                              <td className="p-2 text-center font-mono text-amber-400 font-bold">
                                {ownedPercent.toFixed(1)}٪ ({((shopGoldMelted * ownedPercent) / 100).toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم)
                              </td>
                              <td className="p-2 text-center font-mono text-rose-400">
                                {consignedPercent.toFixed(1)}٪ ({((shopGoldMelted * consignedPercent) / 100).toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم)
                              </td>
                            </tr>
                          )}
                          {shopGoldCoins > 0 && (
                            <tr>
                              <td className="p-2 font-bold text-zinc-200">🪙 سکه و شمش مینیاتوری</td>
                              <td className="p-2 text-center font-mono">{shopGoldCoins.toLocaleString('fa-IR')} گرم</td>
                              <td className="p-2 text-center font-mono text-amber-400 font-bold">
                                {ownedPercent.toFixed(1)}٪ ({((shopGoldCoins * ownedPercent) / 100).toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم)
                              </td>
                              <td className="p-2 text-center font-mono text-rose-400">
                                {consignedPercent.toFixed(1)}٪ ({((shopGoldCoins * consignedPercent) / 100).toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم)
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-zinc-500 text-[10.5px] leading-relaxed">
                  👈 برای محاسبه دقیق تفکیک طلاهای امانی و ملکی بر اساس مانده حساب‌ها، لطفاً مقادیر طلای موجود در ویترین خود را در بخش بالا وارد نمایید.
                </div>
              )}
            </div>
          </div>

          {/* CHRONOLOGICAL PERIODICAL STATS */}
          <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Clock className="w-4 h-4 text-[#d4af37]" />
              <span>تفکیک دوره‌ای سود خالص گالری (خرید + فروش)</span>
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800/80">
                <span className="text-zinc-500 text-[10px] block">سود امروز</span>
                <span className="font-mono font-black text-white">{formatTomanAmount(reportStats.dailyProfit)}</span>
                <span className="text-[9px] text-zinc-500 block font-mono">{(goldPrice > 0 ? (reportStats.dailyProfit / goldPrice) : 0).toFixed(3)} گرم</span>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-2xl border border-[#d4af37]/25 shadow-inner">
                <span className="text-zinc-400 text-[10px] font-bold block">سود ۷ روز اخیر</span>
                <span className="font-mono font-black text-[#ffd700]">{formatTomanAmount(reportStats.weeklyProfit)}</span>
                <span className="text-[9px] text-zinc-500 block font-mono">{(goldPrice > 0 ? (reportStats.weeklyProfit / goldPrice) : 0).toFixed(3)} گرم</span>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800/80">
                <span className="text-zinc-500 text-[10px] block">سود ۳۰ روز اخیر</span>
                <span className="font-mono font-black text-white">{formatTomanAmount(reportStats.monthlyProfit)}</span>
                <span className="text-[9px] text-zinc-500 block font-mono">{(goldPrice > 0 ? (reportStats.monthlyProfit / goldPrice) : 0).toFixed(3)} گرم</span>
              </div>
            </div>
          </div>

          {/* VISUAL CHART: PURE CSS GOLDEN GRADIENT HISTOGRAM */}
          <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-3.5">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#ffd700]" />
                <span>نمودار سود خالص روزانه (۷ روز اخیر)</span>
              </h3>
              <span className="text-[10px] text-zinc-500">بر حسب ریال و گرم معادل طلا</span>
            </div>

            {/* Pure CSS Bar Chart with golden bar graph columns */}
            <div className="h-44 flex items-end justify-between gap-2.5 px-2 pt-4 relative">
              {/* Gridlines in background */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 text-[9px] text-zinc-800 font-mono">
                <div className="border-b border-zinc-800/50 w-full" />
                <div className="border-b border-zinc-800/50 w-full" />
                <div className="border-b border-zinc-800/50 w-full" />
                <div className="border-b border-zinc-800/50 w-full" />
              </div>

              {reportStats.dailyProfitList.map((day, idx) => {
                // Determine height percentage relative to max profit in list
                const maxProfit = Math.max(...reportStats.dailyProfitList.map(d => d.profit), 1);
                const percent = Math.min(100, Math.max(5, (day.profit / maxProfit) * 100));
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative z-10">
                    {/* Hover Tooltip showing Rial & Gold profits */}
                    <div className="absolute -top-12 scale-0 group-hover:scale-100 bg-zinc-950 text-white text-[10px] py-1.5 px-2.5 rounded-xl border border-amber-500/50 shadow-2xl transition-all duration-150 z-50 text-center w-28 whitespace-nowrap pointer-events-none">
                      <p className="font-black text-[#ffd700]">{day.profit.toLocaleString('fa-IR')} ت</p>
                      <p className="text-[9px] text-zinc-400 font-mono">{day.goldGrams} گرم طلا</p>
                    </div>

                    {/* Golden bar */}
                    <div className="w-full relative rounded-t-lg bg-zinc-800/40 border border-zinc-800 overflow-hidden h-28 flex items-end">
                      <div 
                        style={{ height: `${percent}%` }}
                        className="w-full bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 rounded-t-md shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all duration-300"
                      />
                    </div>

                    {/* Label */}
                    <span className="text-[10px] text-zinc-400 font-bold block text-center truncate w-full">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PROFIT DETAILED BREAKDOWN BY TYPE */}
          <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-3.5">
            <h3 className="text-xs font-black text-white border-b border-zinc-800 pb-2">تفکیک تخصصی سود گالری به تفکیک محصولات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-zinc-300">
              {/* 1. Manufactured Jewelry */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">💍</span>
                  <div>
                    <span className="font-bold text-white block">سود طلای ساخته‌شده (۷٪):</span>
                    <span className="text-[10px] text-zinc-500 leading-normal">سود دریافتی روی کل فاکتورهای فروش طلا نو</span>
                  </div>
                </div>
                <div className="text-left font-mono border-t border-zinc-900 pt-2 flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-bold">سود مکتسبه:</span>
                  <div>
                    <span className="font-black text-emerald-400 block">{formatTomanAmount(reportStats.profitJewelry)} تومان</span>
                    <span className="text-[9px] text-[#ffd700] block text-left font-bold">{reportStats.profitJewelryGold.toFixed(3)} گرم ۱۸ عیار</span>
                  </div>
                </div>
              </div>

              {/* 2. Coin Sales */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">🪙</span>
                  <div>
                    <span className="font-bold text-white block">سود فروش مسکوکات بهار آزادی:</span>
                    <span className="text-[10px] text-zinc-500 leading-normal">کارمزدهای ثابت و حباب سودآور معاملات سکه</span>
                  </div>
                </div>
                <div className="text-left font-mono border-t border-zinc-900 pt-2 flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-bold">سود مکتسبه:</span>
                  <div>
                    <span className="font-black text-emerald-400 block">{formatTomanAmount(reportStats.profitCoin)} تومان</span>
                    <span className="text-[9px] text-[#ffd700] block text-left font-bold">{(goldPrice > 0 ? (reportStats.profitCoin / goldPrice) : 0).toFixed(3)} گرم ۱۸ عیار</span>
                  </div>
                </div>
              </div>

              {/* 3. Parsian Sales */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">💳</span>
                  <div>
                    <span className="font-bold text-white block">سود فروش شمش‌های پارسیان:</span>
                    <span className="text-[10px] text-zinc-500 leading-normal">کارمزدهای ۵ درصدی و حباب شمش‌ها</span>
                  </div>
                </div>
                <div className="text-left font-mono border-t border-zinc-900 pt-2 flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-bold">سود مکتسبه:</span>
                  <div>
                    <span className="font-black text-emerald-400 block">{formatTomanAmount(reportStats.profitParsian)} تومان</span>
                    <span className="text-[9px] text-[#ffd700] block text-left font-bold">{(goldPrice > 0 ? (reportStats.profitParsian / goldPrice) : 0).toFixed(3)} گرم ۱۸ عیار</span>
                  </div>
                </div>
              </div>

              {/* 4. Melted Gold Sales */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">🧪</span>
                  <div>
                    <span className="font-bold text-white block">سود فروش طلای آب‌شده:</span>
                    <span className="text-[10px] text-zinc-500 leading-normal">کارمزد مبادلاتی و تفاوت فاکتور شمش آب‌شده</span>
                  </div>
                </div>
                <div className="text-left font-mono border-t border-zinc-900 pt-2 flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-bold">سود مکتسبه:</span>
                  <div>
                    <span className="font-black text-emerald-400 block">{formatTomanAmount(reportStats.profitMelted)} تومان</span>
                    <span className="text-[9px] text-[#ffd700] block text-left font-bold">{(goldPrice > 0 ? (reportStats.profitMelted / goldPrice) : 0).toFixed(3)} گرم ۱۸ عیار</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special buy/purchase profits overview */}
            <div className="bg-emerald-950/20 p-3 rounded-2xl border border-emerald-500/25 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📥</span>
                <div>
                  <span className="font-bold text-emerald-400 block">مجموع تراز سود حاصله از خرید طلا (خرید از مشتری):</span>
                  <span className="text-[10px] text-zinc-400">کسر کارمزد خرید و مابه‌التفاوت نرخ مبادلاتی طلا مستعمل</span>
                </div>
              </div>
              <div className="text-left font-mono">
                <span className="font-black text-emerald-400 block">{formatTomanAmount(reportStats.totalPurchasedProfitRialSpecial)} ت</span>
                <span className="text-[9px] text-emerald-300 block">{(goldPrice > 0 ? (reportStats.totalPurchasedProfitRialSpecial / goldPrice) : 0).toFixed(3)} گرم ۱۸ عیار</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SPECIAL DETAILED PURCHASE REPORT (گزارش ویژه سود خرید) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-b from-zinc-900 to-black p-4.5 rounded-3xl border border-amber-500/35 space-y-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="border-b border-zinc-800 pb-2 flex justify-between items-center">
              <h3 className="text-xs font-black text-[#ffd700] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#ffd700] shrink-0" />
                <span>گزارش ویژه و محاسباتی سود حاصل از خرید (تطبیقی)</span>
              </h3>
              <span className="text-[9px] bg-[#d4af37]/15 text-[#ffd700] px-2 py-0.5 rounded-md font-bold">زنده و هوشمند</span>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed text-right">
              این گزارش تفاوت طلایی و ریالی طلاهای خریداری شده از مشتری را نشان می‌دهد. با کسر کارمزدهای دستی، مشخص می‌گردد پول معادل چند گرم طلا پرداخت شده و چند گرم دریافت کرده‌ایم.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {/* Gold Rate */}
              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 block mb-0.5">نرخ طلای تابلوی امروز:</span>
                <span className="font-mono font-black text-white text-[13px] block">{formatTomanAmount(goldPrice)} ت</span>
                <span className="text-[9px] text-zinc-600 block mt-0.5">نرخ هر گرم ۱۸ عیار</span>
              </div>

              {/* Effective Purchase Price */}
              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 block mb-0.5">میانگین نرخ خرید طلا:</span>
                <span className="font-mono font-black text-[#ffd700] text-[13px] block">
                  {formatTomanAmount(reportStats.totalPurchasedGoldGramsReceived > 0 
                    ? Math.round(reportStats.totalPurchasedPayments / reportStats.totalPurchasedGoldGramsReceived) 
                    : goldPrice
                  )} ت
                </span>
                <span className="text-[9px] text-zinc-600 block mt-0.5">هر گرم ۱۸ عیار پرداختی</span>
              </div>

              {/* Received Gold Grams */}
              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 block mb-0.5">گرم طلا دریافت کردیم:</span>
                <span className="font-mono font-black text-emerald-400 text-[13px] block">
                  {reportStats.totalPurchasedGoldGramsReceived.toFixed(3)} گرم
                </span>
                <span className="text-[9px] text-zinc-600 block mt-0.5">معادل طلای ۱۸ عیار استاندارد</span>
              </div>

              {/* Paid equivalent Gold grams */}
              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 block mb-0.5">پول چند گرم طلا دادیم:</span>
                <span className="font-mono font-black text-rose-400 text-[13px] block">
                  {reportStats.totalPurchasedGoldGramsPaidEquivalent.toFixed(3)} گرم
                </span>
                <span className="text-[9px] text-zinc-600 block mt-0.5">ارزش طلایی ریال‌های پرداخت‌شده</span>
              </div>
            </div>

            {/* Calculations and Final Gain results */}
            <div className="bg-[#d4af37]/5 p-3 rounded-2xl border border-[#d4af37]/25 grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-[#ffd700] font-black block">💡 سود نهایی طلایی خرید (تفاضل وزنی):</span>
                <p className="text-[9px] text-zinc-400 font-bold">چقدر طلا سود کردیم (تفاوت وزنی دریافت شده و پول معادل داده شده)</p>
              </div>

              <div className="text-center bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block">کل سود وزنی طلا:</span>
                <span className="font-mono font-black text-[#ffd700] text-sm">
                  +{reportStats.totalPurchasedProfitGoldSpecial.toFixed(3)} گرم ۱۸ عیار
                </span>
              </div>

              <div className="text-center bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block">کل سود ریالی معادل خرید:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  +{formatTomanAmount(reportStats.totalPurchasedProfitRialSpecial)} تومان
                </span>
              </div>
            </div>
          </div>

          {/* GENERAL BALANCE METRICS (گزارش تراز فیزیکی و ریالی) */}
          <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-3.5">
            <h3 className="text-xs font-black text-white border-b border-zinc-800 pb-2">گزارش تراز فیزیکی و کارمزدهای پرداختی</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Physical Balance */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
                <span className="text-[#ffd700] font-bold block border-b border-zinc-800 pb-1">تراز طلایی فیزیکی گالری</span>
                <div className="space-y-1 text-zinc-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>مجموع وزن خریداری شده (ورود طلا):</span>
                    <span className="font-mono font-bold text-emerald-400">+{reportStats.totalPurchasedWeight.toFixed(3)} گرم</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مجموع وزن فروخته شده (خروج طلا):</span>
                    <span className="font-mono font-bold text-red-400">-{reportStats.totalSalesWeight.toFixed(3)} گرم</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-850 pt-1 font-bold text-zinc-300">
                    <span>مجموع کارمزد پرداختی/اجرت فروش:</span>
                    <span className="font-mono text-[#ffd700]">{formatTomanAmount(reportStats.totalSalesWagesReceived)} ت</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-1.5 font-bold">
                    <span>تفاوت وزنی طلا (موجودی فیزیکی):</span>
                    <span className="font-mono text-white">{(reportStats.totalPurchasedWeight - reportStats.totalSalesWeight).toFixed(3)} گرم</span>
                  </div>
                </div>
              </div>

              {/* Rial Balance */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
                <span className="text-[#ffd700] font-bold block border-b border-zinc-800 pb-1">تراز نقدی و ریالی صندوق گالری</span>
                <div className="space-y-1 text-zinc-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>مجموع ورودی ریالی (دریافت فروش):</span>
                    <span className="font-mono font-bold text-emerald-400">+{reportStats.totalSalesRevenue.toLocaleString('fa-IR')} ت</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مجموع خروجی ریالی (پرداخت خرید):</span>
                    <span className="font-mono font-bold text-red-400">-{reportStats.totalPurchasedPayments.toLocaleString('fa-IR')} ت</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-850 pt-1 font-bold text-zinc-300">
                    <span>کل کارمزد کسر شده از خرید مشتری:</span>
                    <span className="font-mono text-emerald-400">{formatTomanAmount(reportStats.totalPurchasedWagesDeducted)} ت</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-1.5 font-bold">
                    <span>تراز نقدی خالص گالری (مانده ریالی):</span>
                    <span className="font-mono text-white">{(reportStats.totalSalesRevenue - reportStats.totalPurchasedPayments).toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-[#d4af37]/10 p-3 rounded-2xl border border-amber-500/20 text-zinc-300 text-[11px] leading-relaxed">
              <span className="text-amber-400 font-bold block mb-1">🛡️ تاییدیه رسمی تراز حسابداری زرسا</span>
              تمامی ترازها بر اساس فاکتورهای فیزیکی خرید و فروش، عیار سنجی‌های آزمایشگاهی آب‌شده و مسکوکات ۲۲ عیار محاسبه شده و تطبیق سودهای ریالی و معادل طلای ۱۸ عیار تایید گردیده است.
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DETAILED DOCUMENT MODAL (جزئیات سند مالی) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL 1: REDESIGNED FORMAL A5 PORTRAIT INVOICE & RECEIPT PREVIEW (STRICT B&W) */}
      {/* ========================================================================= */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-y-auto">
          {/* Modal Container: scaled to accommodate high-res widescreen A5 Preview */}
          <div className="bg-[#0c0c0e] max-w-2xl w-full rounded-none p-4 sm:p-6 border border-zinc-800 shadow-2xl space-y-4 my-4 relative">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xs font-bold text-white font-sans">
                  پیش‌نمایش فاکتور رسمی A5 ({selectedDoc.docType === 'sell' ? 'فروش' : 'خرید'} #{selectedDoc.invoiceNumber || selectedDoc.receiptNumber})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-none bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer border border-zinc-800 active:scale-90 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PREVIEW CONTAINER: STRICT PORTRAIT A5 PAPER (BLACK & WHITE / GRAYSCALE FORMAL) */}
            <div className="bg-[#ffffff] text-black p-6 sm:p-8 rounded-none border-2 border-black relative overflow-hidden font-sans shadow-xl select-text">
              
              {/* Dynamic Elegant Brand Watermark - Extremely Subtle Grayscale */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.02] z-0 overflow-hidden">
                <div className="text-zinc-950 font-black text-5xl sm:text-7xl uppercase tracking-widest -rotate-[22deg] whitespace-nowrap">
                  {store.watermarkText || 'Zarsa Gold Gallery'}
                </div>
              </div>

              <div className="relative z-10 space-y-4">
                
                {/* 1. COMPACT OFFICIAL HEADER (NO CIRCULAR EMBLMS OR GRADIENTS) */}
                <div className="flex items-start justify-between border-b-2 border-black pb-3">
                  {/* Left branding zone: High-contrast formal typography & Logo */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 border border-black p-0.5 bg-white shrink-0 flex items-center justify-center">
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
                      <h2 className="text-base sm:text-lg font-black font-sans text-black uppercase">{store.name}</h2>
                      <p className="text-[9.5px] text-zinc-800 font-bold leading-none">مدیریت گالری: {store.ownerName || 'خلیلی'}</p>
                      <p className="text-[8px] text-zinc-500">اتوماسیون صدور اسناد و فاکتورهای رسمی طلا و مسکوکات</p>
                    </div>
                  </div>

                  {/* Center Verification QR Code */}
                  {(store.invoicePrintSettings?.showQR ?? true) && (
                    <div className="flex flex-col items-center justify-center border border-black p-0.5 bg-white shrink-0 hidden sm:flex">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                          `سند مالی ${selectedDoc.docType === 'sell' ? 'فروش' : 'خرید'}\nگالری: ${store.name}\nشماره: ${selectedDoc.docType === 'sell' ? selectedDoc.invoiceNumber : selectedDoc.receiptNumber}\nمشتری: ${selectedDoc.customerName || 'حضورى'}\nکالا: ${selectedDoc.itemTitle}\nوزن: ${(selectedDoc.weight || selectedDoc.rawWeight || 0).toFixed(3)} گرم\nمبلغ: ${(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable).toLocaleString('fa-IR')} تومان`
                        )}&color=000000&bgcolor=ffffff`}
                        alt="Verification QR"
                        className="w-12 h-12"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[6px] font-bold text-black mt-0.5 font-sans">کد اصالت سنجی</span>
                    </div>
                  )}

                  {/* Right Metadata block */}
                  <div className="text-left space-y-0.5 font-mono text-[9px] text-black font-medium">
                    <div className="bg-zinc-100 px-2 py-1 text-center text-black font-bold font-sans text-[9.5px] mb-1.5 border border-black rounded-none">
                      {selectedDoc.docType === 'sell' ? 'فاکتور رسمی فروش طلا و جواهر' : 'رسید رسمی خرید طلا و مسکوکات'}
                    </div>
                    <div className="flex justify-between gap-1.5">
                      <span>شماره سند:</span>
                      <strong className="font-bold text-black">#{selectedDoc.docType === 'sell' ? selectedDoc.invoiceNumber : selectedDoc.receiptNumber}</strong>
                    </div>
                    <div className="flex justify-between gap-1.5">
                      <span>تاریخ معامله:</span>
                      <strong className="font-bold text-black">{selectedDoc.dateFa}</strong>
                    </div>
                    <div className="flex justify-between gap-1.5">
                      <span>ساعت معامله:</span>
                      <strong className="font-bold text-black">{selectedDoc.timeFa}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. CUSTOMER & PARTY INFO BOX (طرفین معامله - کاملا مربعی و رسمی) */}
                <div className="border border-black rounded-none overflow-hidden text-[9px] sm:text-[10px] leading-relaxed">
                  <div className="grid grid-cols-2 bg-zinc-100 border-b border-black font-bold text-black">
                    <div className="p-1.5 border-l border-black text-right">مشخصات خریدار / فروشنده (مشتری)</div>
                    <div className="p-1.5 text-right">مشخصات صادرکننده فاکتور (فروشگاه طلا)</div>
                  </div>
                  <div className="grid grid-cols-2 text-black bg-white">
                    <div className="p-2 border-l border-black space-y-1 text-right">
                      <div className="flex"><span className="text-zinc-600 min-w-[50px]">نام مشتری:</span><strong className="font-black text-black">{selectedDoc.customerName || 'مشتری حضوری'}</strong></div>
                      <div className="flex"><span className="text-zinc-600 min-w-[50px]">تلفن همراه:</span><strong className="font-mono text-black">{selectedDoc.customerPhone || 'ثبت نشده'}</strong></div>
                      <div className="flex"><span className="text-zinc-600 min-w-[50px]">کد ملی خریدار:</span><span>____________________</span></div>
                    </div>
                    <div className="p-2 space-y-1 text-right">
                      <div className="flex"><span className="text-zinc-600 min-w-[55px]">عنوان فروشگاه:</span><strong className="font-bold text-black">{store.name}</strong></div>
                      <div className="flex"><span className="text-zinc-600 min-w-[55px]">تلفن تماس:</span><strong className="font-mono text-black">{store.phone}</strong></div>
                      <div className="flex"><span className="text-zinc-600 min-w-[55px]">نشانی گالری:</span><span className="truncate max-w-[190px] font-sans">{store.address}</span></div>
                    </div>
                  </div>
                </div>

                {/* 3. HARDWARE SPEC TABLE (بدنه رسمی جدول محاسبات طلا - کادربندی مشکی غلیظ) */}
                <div className="border border-black rounded-none overflow-hidden bg-white">
                  <table className="w-full text-right text-[8px] sm:text-[9px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-black font-black text-black text-center">
                        <th className="p-1 border-l border-black w-6">ردیف</th>
                        <th className="p-1 border-l border-black text-right">شرح طلا ساخته‌شده / سکه / پارسیان معامله شده</th>
                        <th className="p-1 border-l border-black w-12">عیار</th>
                        {selectedDoc.docType === 'sell' ? (
                          <>
                            <th className="p-1 border-l border-black w-14 text-center">وزن (گرم)</th>
                            {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <th className="p-1 border-l border-black w-16 text-center">نرخ خام طلا</th>}
                            {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <th className="p-1 border-l border-black w-18 text-center">ارزش طلای خام</th>}
                            {(store.invoicePrintSettings?.showFee ?? true) && <th className="p-1 border-l border-black w-14 text-center">اجرت ساخت</th>}
                            {(store.invoicePrintSettings?.showProfit ?? true) && <th className="p-1 border-l border-black w-14 text-center">سود گالری</th>}
                            {(store.invoicePrintSettings?.showTax ?? true) && <th className="p-1 border-l border-black w-14 text-center">مالیات (۹٪)</th>}
                          </>
                        ) : (
                          <>
                            <th className="p-1 border-l border-black w-14 text-center">وزن فیزیکی</th>
                            <th className="p-1 border-l border-black w-16 text-center">وزن معادل ۱۸</th>
                            {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <th className="p-1 border-l border-black w-16 text-center">نرخ مبنای خرید</th>}
                            {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <th className="p-1 border-l border-black w-18 text-center">ارزش خام معادل</th>}
                            {(store.invoicePrintSettings?.showFee ?? true) && <th className="p-1 border-l border-black w-14 text-center">کسورات</th>}
                          </>
                        )}
                        <th className="p-1 w-22 text-center bg-zinc-50 font-black">مبلغ کل نهایی (تومان)</th>
                      </tr>
                    </thead>
                    <tbody className="text-center font-mono text-black">
                      <tr className="border-b border-black">
                        <td className="p-1.5 border-l border-black font-sans text-zinc-500">۱</td>
                        <td className="p-1.5 border-l border-black text-right font-sans font-bold text-black">
                          {selectedDoc.itemTitle}
                        </td>
                        <td className="p-1.5 border-l border-black font-sans">
                          {selectedDoc.docType === 'sell' 
                            ? '۱۸ عیار (۷۵۰)' 
                            : `عیار ${selectedDoc.sourceKarat || '۱۸'}`}
                        </td>
                        {selectedDoc.docType === 'sell' ? (
                          <>
                            <td className="p-1.5 border-l border-black font-bold">
                              {toPersianDigits((selectedDoc.weight || selectedDoc.rawWeight || 0).toFixed(3))} گرم
                            </td>
                            {(store.invoicePrintSettings?.showRawGoldRate ?? true) && (
                              <td className="p-1.5 border-l border-black">
                                {Math.round(selectedDoc.goldPrice || goldPrice).toLocaleString('fa-IR')}
                              </td>
                            )}
                            {(store.invoicePrintSettings?.showRawGoldValue ?? true) && (
                              <td className="p-1.5 border-l border-black font-bold text-zinc-800">
                                {Math.round(selectedDoc.rawGoldAmount || ((selectedDoc.weight || 0) * (selectedDoc.goldPrice || goldPrice))).toLocaleString('fa-IR')}
                              </td>
                            )}
                            {(store.invoicePrintSettings?.showFee ?? true) && (
                              <td className="p-1.5 border-l border-black text-zinc-800">
                                {Math.round(selectedDoc.feeAmount || 0).toLocaleString('fa-IR')}
                              </td>
                            )}
                            {(store.invoicePrintSettings?.showProfit ?? true) && (
                              <td className="p-1.5 border-l border-black text-zinc-800">
                                {Math.round(selectedDoc.profitAmount || 0).toLocaleString('fa-IR')}
                              </td>
                            )}
                            {(store.invoicePrintSettings?.showTax ?? true) && (
                              <td className="p-1.5 border-l border-black text-zinc-800">
                                {Math.round(selectedDoc.taxAmount || 0).toLocaleString('fa-IR')}
                              </td>
                            )}
                          </>
                        ) : (
                          <>
                            <td className="p-1.5 border-l border-black font-bold">
                              {toPersianDigits((selectedDoc.rawWeight || selectedDoc.weight || 0).toFixed(3))} گرم
                            </td>
                            <td className="p-1.5 border-l border-black font-bold">
                              {toPersianDigits((selectedDoc.standardWeight750 || selectedDoc.weight || 0).toFixed(3))} گرم
                            </td>
                            {(store.invoicePrintSettings?.showRawGoldRate ?? true) && (
                              <td className="p-1.5 border-l border-black">
                                {Math.round(selectedDoc.goldPriceUsed || goldPrice).toLocaleString('fa-IR')}
                              </td>
                            )}
                            {(store.invoicePrintSettings?.showRawGoldValue ?? true) && (
                              <td className="p-1.5 border-l border-black font-bold text-zinc-800">
                                {Math.round((selectedDoc.standardWeight750 || selectedDoc.weight || 0) * (selectedDoc.goldPriceUsed || goldPrice)).toLocaleString('fa-IR')}
                              </td>
                            )}
                            {(store.invoicePrintSettings?.showFee ?? true) && (
                              <td className="p-1.5 border-l border-black text-red-700">
                                {Math.round(selectedDoc.discountAmount || 0).toLocaleString('fa-IR')}
                              </td>
                            )}
                          </>
                        )}
                        <td className="p-1.5 font-black text-black bg-zinc-100 font-sans text-xs">
                          {(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable).toLocaleString('fa-IR')}
                        </td>
                      </tr>
                      {/* Empty Line to simulate standard receipt print formats */}
                      <tr className="text-zinc-400 border-b border-black text-[7.5px]">
                        <td className="p-1 border-l border-black font-sans">-</td>
                        <td className="p-1 border-l border-black text-right font-sans italic">سایر ردیف‌های چاپی فاکتور به صورت رسمی سفید می‌باشد</td>
                        <td className="p-1 border-l border-black font-sans">-</td>
                        {selectedDoc.docType === 'sell' ? (
                          <>
                            <td className="p-1 border-l border-black font-sans">-</td>
                            {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-1 border-l border-black font-sans">-</td>}
                            {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-1 border-l border-black font-sans">-</td>}
                            {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-1 border-l border-black font-sans">-</td>}
                            {(store.invoicePrintSettings?.showProfit ?? true) && <td className="p-1 border-l border-black font-sans">-</td>}
                            {(store.invoicePrintSettings?.showTax ?? true) && <td className="p-1 border-l border-black font-sans">-</td>}
                          </>
                        ) : (
                          <>
                            <td className="p-1 border-l border-black font-sans">-</td>
                            <td className="p-1 border-l border-black font-sans">-</td>
                            {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-1 border-l border-black font-sans">-</td>}
                            {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-1 border-l border-black font-sans">-</td>}
                            {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-1 border-l border-black font-sans">-</td>}
                          </>
                        )}
                        <td className="p-1 font-sans bg-zinc-50/30">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. TOTAL BLOCK & WORDS CONVERSION (NO COLORED ACCENTS) */}
                <div className="bg-zinc-50 border border-black rounded-none p-3 text-[9.5px] sm:text-[11px] text-black space-y-1.5 leading-relaxed bg-white">
                  <div className="flex justify-between items-center font-bold">
                    <span>مبلغ نهایی فاکتور تسویه شده (به عدد):</span>
                    <span className="font-mono text-black font-black text-xs sm:text-sm bg-zinc-100 px-3 py-0.5 rounded-none border border-black">
                      {(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-start gap-1 border-t border-black pt-2 font-medium">
                    <span className="shrink-0 font-bold">مبلغ به حروف:</span>
                    <span className="font-sans font-bold underline decoration-dotted leading-relaxed">
                      {numberToPersianWords(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable)} تومان تمام
                    </span>
                  </div>
                </div>

                {/* Bank receipt reference if buying from customer */}
                {selectedDoc.docType === 'buy' && selectedDoc.bankInfo?.cardNumber && (
                  <div className="bg-zinc-100 border border-black p-2.5 rounded-none text-[9px] text-black font-mono flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <span className="font-sans font-bold">جزئیات تسویه کارتخوان / پایا:</span>
                      <span className="mr-2 font-sans">صاحب حساب: {selectedDoc.bankInfo.accountOwnerName || selectedDoc.customerName}</span>
                    </div>
                    <div>
                      <span>شماره کارت مقصد: </span>
                      <strong className="text-black font-black">{selectedDoc.bankInfo.cardNumber}</strong>
                      <span className="font-sans mr-1">({selectedDoc.bankInfo.bankName || 'شتاب'})</span>
                    </div>
                  </div>
                )}

                {/* 5. FORMAL DUAL SIGNATURES & STAMP AREA (STRICT GRAYSCALE BOXES, NO FANTASY STAMPS) */}
                <div className="grid grid-cols-3 gap-3.5 pt-1 text-[8.5px] sm:text-[9.5px]">
                  {/* Gallery official seal container */}
                  <div className="flex flex-col items-center justify-between min-h-[90px] border border-black p-2 rounded-none bg-white text-center">
                    <span className="font-bold text-black">مهر و امضای رسمی فروشگاه</span>
                    
                    {/* Plain, clean dashed block instead of colored simulation */}
                    <div className="border border-dashed border-zinc-400 p-2 text-center w-full my-1 rounded-none bg-zinc-50/50">
                      <p className="font-bold text-[9px] text-zinc-800">{store.name}</p>
                      <p className="text-[7.5px] text-zinc-500 mt-1">{store.stamp || 'تسویه و تحویل شد'}</p>
                    </div>

                    <span className="text-[8px] text-zinc-500 font-mono leading-none">{store.signature || 'امضای گالری'}</span>
                  </div>

                  {/* Customer sign area */}
                  <div className="flex flex-col items-center justify-between min-h-[90px] border border-black p-2 rounded-none bg-white text-center">
                    <span className="font-bold text-black">امضاء و اثر انگشت خریدار</span>
                    <p className="text-[7.5px] text-zinc-500 leading-normal px-0.5 mt-0.5 text-justify">
                      بدینوسیله تایید می‌گردد وزن خالص و اصالت عیار طلا/سکه جدول فوق تسلیم خریدار گردید.
                    </p>
                    <div className="w-8 h-8 rounded-none border border-zinc-300 border-dashed flex items-center justify-center text-[7px] text-zinc-400 select-none my-0.5 bg-zinc-50/20">
                      محل انگشت
                    </div>
                  </div>

                  {/* Formal rules list */}
                  <div className="border border-black p-2 rounded-none text-right text-[7.5px] text-zinc-500 space-y-1 bg-white">
                    <span className="font-bold text-zinc-800 block border-b border-black pb-0.5 mb-1 text-center">مقررات و تعهدات قانونی</span>
                    <p>۱. ارائه اصل فاکتور جهت مبادلات بعدی صنف طلا الزامیست.</p>
                    <p>۲. عیار کلیه اقلام فروخته شده ۱۸ عیار استاندارد (۷۵۰) تضمین می‌شود.</p>
                    <p>۳. فاکتور دارای شناسه رهگیری معتبر حسابداری است.</p>
                  </div>
                </div>

                {/* 6. SYSTEM COMPACT ADDRESS FOOTER */}
                <div className="border-t border-black pt-2.5 text-center text-[8.5px] text-zinc-600 space-y-0.5">
                  <p className="font-bold text-zinc-800 font-sans">
                    نشانی گالری: {store.address} · تلفن تماس: {store.phone} · اینستاگرام: @{store.instagram}
                  </p>
                  <p className="text-[7.5px] text-zinc-400 font-mono leading-none pt-0.5">
                    کدپستی ۱۰ رقمی: {store.postalCode || '۱۱۶۳۶۱۴۱۱۱'} · شناسه حسابداری زرسا: IR-GOLD-{selectedDoc.invoiceNumber || selectedDoc.receiptNumber}
                  </p>
                </div>

              </div>
            </div>

            {/* Download Document Row */}
            <div className="grid grid-cols-2 gap-2 pb-2 text-xs text-right" dir="rtl">
              <button
                type="button"
                onClick={() => {
                  if (selectedDoc.docType === 'sell') {
                    downloadInvoicePDF(selectedDoc as SaleInvoice, store);
                  } else {
                    downloadPurchaseReceiptPDF(selectedDoc as PurchaseInvoice, store);
                  }
                }}
                className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#ffd700] border border-[#d4af37]/40 flex items-center justify-center gap-1.5 cursor-pointer font-bold active:scale-95 transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-[#ffd700]" />
                <span>📥 دانلود فایل PDF رسمی</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedDoc.docType === 'sell') {
                    downloadInvoicePNG(selectedDoc as SaleInvoice, store);
                  } else {
                    downloadPurchaseReceiptPNG(selectedDoc as PurchaseInvoice, store);
                  }
                }}
                className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center gap-1.5 cursor-pointer font-bold active:scale-95 transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-zinc-400" />
                <span>📥 دانلود تصویر PNG</span>
              </button>
            </div>

            {/* Document Management Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowPrintPreview(true);
                }}
                className="h-11 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-lg shadow-[#d4af37]/20"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>🖨️ پیش‌نمایش و چاپ</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartEdit(selectedDoc)}
                className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-850 flex items-center justify-center gap-1.5 cursor-pointer font-bold active:scale-95 transition-all"
              >
                <Edit className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>ویرایش سند</span>
              </button>

              <button
                type="button"
                onClick={() => copyDocText(selectedDoc)}
                className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-850 flex items-center justify-center gap-1.5 cursor-pointer font-bold active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>کپی متن فاکتور</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`h-11 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer font-bold active:scale-95 transition-all ${
                  showShareMenu
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-850'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ارسال فاکتور</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmDelete(selectedDoc)}
                className="h-11 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 flex items-center justify-center gap-1.5 cursor-pointer font-bold active:scale-95 transition-all col-span-2 sm:col-span-1"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>حذف فاکتور</span>
              </button>
            </div>

            {/* MESSENGER SHARING TOOLTIP PANEL */}
            {showShareMenu && (
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 animate-fade-in-up space-y-2 text-xs">
                <span className="text-[10px] text-zinc-400 font-bold block mb-1 text-right">انتخاب پیام‌رسان جهت ارسال مستقیم رسید فاکتور به مشتری:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareDoc('whatsapp', selectedDoc)}
                    className="h-10 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🟢 واتساپ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareDoc('eitaa', selectedDoc)}
                    className="h-10 rounded-xl bg-orange-600/10 hover:bg-orange-600/25 text-orange-400 border border-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🟠 ایتا</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareDoc('bale', selectedDoc)}
                    className="h-10 rounded-xl bg-blue-600/10 hover:bg-blue-600/25 text-blue-400 border border-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🔵 بله</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareDoc('telegram', selectedDoc)}
                    className="h-10 rounded-xl bg-sky-600/10 hover:bg-sky-600/25 text-sky-400 border border-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>💠 تلگرام</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DOCUMENT EDITING MODAL (فرم کامل ویرایش سند حسابداری) */}
      {/* ========================================================================= */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#141418] max-w-sm w-full rounded-3xl p-5 border border-zinc-800 shadow-2xl space-y-4 my-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#ffd700]" />
                <span>ویرایش سند مالی {editingDoc.docType === 'sell' ? 'فروش' : 'خرید'} #{editingDoc.invoiceNumber || editingDoc.receiptNumber}</span>
              </h3>
              <button 
                onClick={() => setEditingDoc(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editing form inputs */}
            <div className="space-y-3.5 text-xs text-zinc-300">
              {/* Customer details */}
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 font-bold">نام و نام خانوادگی مشتری/فروشنده:</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 font-bold">شماره تلفن همراه:</label>
                <input
                  type="text"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono outline-none focus:border-[#d4af37] text-right"
                />
              </div>

              {/* Item details */}
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 font-bold">شرح طلا یا مسکوکات:</label>
                <input
                  type="text"
                  value={editItemTitle}
                  onChange={(e) => setEditItemTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 font-bold">وزن ناخالص (گرم):</label>
                  <input
                    type="text"
                    value={toPersianDigits(editWeight.toString())}
                    onChange={(e) => setEditWeight(parseFloat(toEnglishDigits(e.target.value)) || 0)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 font-bold">نرخ هر گرم (تومان):</label>
                  <input
                    type="text"
                    value={formatTomanAmount(editGoldPrice)}
                    onChange={(e) => setEditGoldPrice(parseCleanNumber(toEnglishDigits(e.target.value)) || 0)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 font-bold">مبلغ اجرت / کارمزد / تخفیف کسر شده (تومان):</label>
                <input
                  type="text"
                  value={formatTomanAmount(editFeeAmount)}
                  onChange={(e) => setEditFeeAmount(parseCleanNumber(toEnglishDigits(e.target.value)) || 0)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[#ffd700] font-mono text-center outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Bank fields for Purchases */}
              {editingDoc.docType === 'buy' && (
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2.5">
                  <span className="text-[10px] text-[#ffd700] font-bold block border-b border-zinc-800 pb-1">اطلاعات حساب بانکی واریز خرید:</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-400 block mb-0.5">نام بانک:</label>
                      <input
                        type="text"
                        value={editBankName}
                        onChange={(e) => setEditBankName(e.target.value)}
                        className="w-full h-8 px-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 block mb-0.5">نام صاحب حساب:</label>
                      <input
                        type="text"
                        value={editAccountOwnerName}
                        onChange={(e) => setEditAccountOwnerName(e.target.value)}
                        className="w-full h-8 px-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-zinc-400 block mb-0.5">شماره کارت ۱۶ رقمی:</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={editCardNumber}
                      onChange={(e) => setEditCardNumber(e.target.value)}
                      className="w-full h-8 px-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-center"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 font-bold">یادداشت و توضیحات سند طلا:</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full h-14 p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Edit actions buttons */}
            <div className="flex gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={handleSaveDocEdits}
                className="flex-1 h-11 rounded-xl bg-[#d4af37] text-black font-black flex items-center justify-center gap-1 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ثبت فاکتور اصلاح‌شده</span>
              </button>
              
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="h-11 px-4 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-bold active:scale-95 transition-all cursor-pointer"
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
      {selectedDoc && (
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
                      `سند مالی ${selectedDoc.docType === 'sell' ? 'فروش' : 'خرید'}\nگالری: ${store.name}\nشماره: ${selectedDoc.docType === 'sell' ? selectedDoc.invoiceNumber : selectedDoc.receiptNumber}\nمشتری: ${selectedDoc.customerName || 'حضورى'}\nکالا: ${selectedDoc.itemTitle}\nوزن: ${(selectedDoc.weight || selectedDoc.rawWeight || 0).toFixed(3)} گرم\nمبلغ: ${(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable).toLocaleString('fa-IR')} تومان`
                    )}&color=000000&bgcolor=ffffff`}
                    alt="Verification QR"
                    className="w-10 h-10"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[5.5px] font-bold text-black mt-0.5 font-sans">کد اصالت سنجی</span>
                </div>
              )}

              <div className="text-left space-y-0.5 font-mono text-[8px] text-black font-medium">
                <div className="bg-zinc-100 px-2 py-0.5 rounded-none text-center text-black font-bold font-sans text-[9px] mb-1.5 border border-black">
                  {selectedDoc.docType === 'sell' ? 'فاکتور رسمی فروش طلا' : 'رسید رسمی خرید طلا'}
                </div>
                <div className="flex justify-between gap-1.5">
                  <span>شماره فاکتور:</span>
                  <strong className="font-bold text-black">#{selectedDoc.docType === 'sell' ? selectedDoc.invoiceNumber : selectedDoc.receiptNumber}</strong>
                </div>
                <div className="flex justify-between gap-1.5">
                  <span>تاریخ تنظیم:</span>
                  <strong className="font-bold text-black">{selectedDoc.dateFa}</strong>
                </div>
                <div className="flex justify-between gap-1.5">
                  <span>ساعت معامله:</span>
                  <strong className="font-bold text-black">{selectedDoc.timeFa}</strong>
                </div>
              </div>
            </div>

            {/* 2. CUSTOMER & BRAND INFO */}
            <div className="border border-black rounded-none overflow-hidden text-[8.5px] leading-relaxed">
              <div className="grid grid-cols-2 bg-zinc-100 border-b border-black font-bold text-black text-center">
                <div className="p-1 border-l border-black text-right">مشخصات خریدار / فروشنده (مشتری)</div>
                <div className="p-1 text-right">مشخصات صادرکننده (گالری طلا)</div>
              </div>
              <div className="grid grid-cols-2 text-black bg-white">
                <div className="p-1.5 border-l border-black space-y-0.5 text-right">
                  <div className="flex"><span className="text-zinc-600 min-w-[50px]">نام مشتری:</span><strong className="font-black text-black">{selectedDoc.customerName || 'مشتری حضوری گالری'}</strong></div>
                  <div className="flex"><span className="text-zinc-600 min-w-[50px]">تلفن همراه:</span><strong className="font-mono text-black">{selectedDoc.customerPhone || 'ثبت نشده'}</strong></div>
                  <div className="flex"><span className="text-zinc-600 min-w-[50px]">کد ملی خریدار:</span><span>____________________</span></div>
                </div>
                <div className="p-1.5 space-y-0.5 text-right">
                  <div className="flex"><span className="text-zinc-600 min-w-[55px]">عنوان گالری:</span><strong className="font-bold text-black">{store.name}</strong></div>
                  <div className="flex"><span className="text-zinc-600 min-w-[55px]">تلفن تماس:</span><strong className="font-mono text-black">{store.phone}</strong></div>
                  <div className="flex"><span className="text-zinc-600 min-w-[55px]">نشانی فروشگاه:</span><span className="truncate max-w-[190px]">{store.address}</span></div>
                </div>
              </div>
            </div>

            {/* 3. PRINT DETAILS TABLE */}
            <div className="border border-black rounded-none overflow-hidden bg-white">
              <table className="w-full text-right text-[7.5px] border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-black font-black text-black text-center">
                    <th className="p-0.5 border-l border-black w-6">ردیف</th>
                    <th className="p-0.5 border-l border-black text-right">شرح طلا ساخته‌شده / سکه / پارسیان معامله شده</th>
                    <th className="p-0.5 border-l border-black w-10">عیار</th>
                    {selectedDoc.docType === 'sell' ? (
                      <>
                        <th className="p-0.5 border-l border-black w-12 text-center">وزن (گرم)</th>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && (
                          <th className="p-0.5 border-l border-black w-14 text-center">نرخ خام طلا</th>
                        )}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && (
                          <th className="p-0.5 border-l border-black w-16 text-center">ارزش طلای خام</th>
                        )}
                        {(store.invoicePrintSettings?.showFee ?? true) && (
                          <th className="p-0.5 border-l border-black w-12 text-center">اجرت ساخت</th>
                        )}
                        {(store.invoicePrintSettings?.showProfit ?? true) && (
                          <th className="p-0.5 border-l border-black w-12 text-center">سود گالری</th>
                        )}
                        {(store.invoicePrintSettings?.showTax ?? true) && (
                          <th className="p-0.5 border-l border-black w-12 text-center">مالیات (۹٪)</th>
                        )}
                      </>
                    ) : (
                      <>
                        <th className="p-0.5 border-l border-black w-12 text-center">وزن فیزیکی</th>
                        <th className="p-0.5 border-l border-black w-14 text-center">وزن معادل ۱۸</th>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && (
                          <th className="p-0.5 border-l border-black w-14 text-center">نرخ مبنای خرید</th>
                        )}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && (
                          <th className="p-0.5 border-l border-black w-16 text-center">ارزش خام معادل</th>
                        )}
                        {(store.invoicePrintSettings?.showFee ?? true) && (
                          <th className="p-0.5 border-l border-black w-12 text-center">کسورات</th>
                        )}
                      </>
                    )}
                    <th className="p-0.5 w-22 text-center bg-zinc-50 font-black">مبلغ کل نهایی (تومان)</th>
                  </tr>
                </thead>
                <tbody className="text-center font-mono text-black">
                  <tr className="border-b border-black text-black">
                    <td className="p-1 border-l border-black font-sans text-zinc-500">۱</td>
                    <td className="p-1 border-l border-black text-right font-sans font-bold text-black">
                      {selectedDoc.itemTitle}
                    </td>
                    <td className="p-1 border-l border-black font-sans">
                      {selectedDoc.docType === 'sell' 
                        ? '۱۸ عیار (۷۵۰)' 
                        : `عیار ${selectedDoc.sourceKarat || '۱۸'}`}
                    </td>
                    {selectedDoc.docType === 'sell' ? (
                      <>
                        <td className="p-1 border-l border-black font-bold">
                          {toPersianDigits((selectedDoc.weight || selectedDoc.rawWeight || 0).toFixed(3))} گرم
                        </td>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && (
                          <td className="p-1 border-l border-black">
                            {Math.round(selectedDoc.goldPrice || goldPrice).toLocaleString('fa-IR')}
                          </td>
                        )}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && (
                          <td className="p-1 border-l border-black font-bold text-zinc-800">
                            {Math.round(selectedDoc.rawGoldAmount || ((selectedDoc.weight || 0) * (selectedDoc.goldPrice || goldPrice))).toLocaleString('fa-IR')}
                          </td>
                        )}
                        {(store.invoicePrintSettings?.showFee ?? true) && (
                          <td className="p-1 border-l border-black text-zinc-800">
                            {Math.round(selectedDoc.feeAmount || 0).toLocaleString('fa-IR')}
                          </td>
                        )}
                        {(store.invoicePrintSettings?.showProfit ?? true) && (
                          <td className="p-1 border-l border-black text-zinc-800">
                            {Math.round(selectedDoc.profitAmount || 0).toLocaleString('fa-IR')}
                          </td>
                        )}
                        {(store.invoicePrintSettings?.showTax ?? true) && (
                          <td className="p-1 border-l border-black text-zinc-800">
                            {Math.round(selectedDoc.taxAmount || 0).toLocaleString('fa-IR')}
                          </td>
                        )}
                      </>
                    ) : (
                      <>
                        <td className="p-1 border-l border-black font-bold">
                          {toPersianDigits((selectedDoc.rawWeight || selectedDoc.weight || 0).toFixed(3))} گرم
                        </td>
                        <td className="p-1 border-l border-black font-bold">
                          {toPersianDigits((selectedDoc.standardWeight750 || selectedDoc.weight || 0).toFixed(3))} گرم
                        </td>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && (
                          <td className="p-1 border-l border-black">
                            {Math.round(selectedDoc.goldPriceUsed || goldPrice).toLocaleString('fa-IR')}
                          </td>
                        )}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && (
                          <td className="p-1 border-l border-black font-bold text-zinc-800">
                            {Math.round((selectedDoc.standardWeight750 || selectedDoc.weight || 0) * (selectedDoc.goldPriceUsed || goldPrice)).toLocaleString('fa-IR')}
                          </td>
                        )}
                        {(store.invoicePrintSettings?.showFee ?? true) && (
                          <td className="p-1 border-l border-black text-red-700">
                            {Math.round(selectedDoc.discountAmount || 0).toLocaleString('fa-IR')}
                          </td>
                        )}
                      </>
                    )}
                    <td className="p-1 font-black text-black bg-zinc-100 font-sans">
                      {(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                  {/* Empty space filler */}
                  <tr className="text-zinc-400 border-b border-black text-[7px]">
                    <td className="p-0.5 border-l border-black font-sans">-</td>
                    <td className="p-0.5 border-l border-black text-right font-sans italic">سایر ردیف‌های چاپی فاکتور به صورت رسمی سفید می‌باشد</td>
                    <td className="p-0.5 border-l border-black font-sans">-</td>
                    {selectedDoc.docType === 'sell' ? (
                      <>
                        <td className="p-0.5 border-l border-black font-sans">-</td>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                        {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                        {(store.invoicePrintSettings?.showProfit ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                        {(store.invoicePrintSettings?.showTax ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                      </>
                    ) : (
                      <>
                        <td className="p-0.5 border-l border-black font-sans">-</td>
                        <td className="p-0.5 border-l border-black font-sans">-</td>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                        {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-0.5 border-l border-black font-sans">-</td>}
                      </>
                    )}
                    <td className="p-0.5 font-sans bg-zinc-50/20">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. TOTAL IN PRINT */}
            <div className="bg-zinc-50 border border-black rounded-none p-2 text-[9px] text-black space-y-1 bg-white">
              <div className="flex justify-between items-center font-bold">
                <span>مبلغ کل فاکتور تسویه شده (به عدد):</span>
                <span className="font-mono text-black font-black text-xs bg-zinc-100 px-3 py-0.5 border border-black rounded-none">
                  {(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable).toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-start gap-1 border-t border-black pt-1.5 font-medium">
                <span className="shrink-0 font-bold">مبلغ به حروف:</span>
                <strong className="font-sans font-bold underline decoration-dotted leading-normal">
                  {numberToPersianWords(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable)} تومان تمام
                </strong>
              </div>
            </div>

            {/* Bank reference during buy */}
            {selectedDoc.docType === 'buy' && selectedDoc.bankInfo?.cardNumber && (
              <div className="border border-black p-2 rounded-none text-[8.5px] text-black font-mono flex justify-between items-center bg-white">
                <div>
                  <span className="font-sans font-bold">تسویه بانکی حواله/کارت:</span>
                  <span className="mr-1.5 font-sans">صاحب حساب: {selectedDoc.bankInfo.accountOwnerName || selectedDoc.customerName}</span>
                </div>
                <div>
                  <span>کارت مقصد: </span>
                  <strong className="text-black font-black">{selectedDoc.bankInfo.cardNumber}</strong>
                  <span className="font-sans mr-1">({selectedDoc.bankInfo.bankName || 'شتاب'})</span>
                </div>
              </div>
            )}

            {/* 5. DUAL PRINT SIGNATURES & STAMP AREA */}
            <div className="grid grid-cols-3 gap-2.5 pt-1.5 border-t border-black text-[8px]">
              {/* Store stamp */}
              {(store.invoicePrintSettings?.showStamp ?? true) ? (
                <div className="flex flex-col items-center justify-between min-h-[80px] border border-black p-1 rounded-none text-center relative bg-white">
                  <span className="font-bold text-black">مهر و امضای رسمی فروشگاه</span>
                  <div className="border border-dashed border-zinc-400 p-2 text-center w-full my-1 rounded-none bg-zinc-50/50">
                    <p className="font-bold text-[9px] text-zinc-800">{store.name}</p>
                    <p className="text-[7.5px] text-zinc-500 mt-1">{store.stamp || 'تسویه و تحویل شد'}</p>
                  </div>
                  <span className="text-[7.5px] text-zinc-600 font-mono leading-none">{store.signature || 'مدیریت گالری'}</span>
                </div>
              ) : (
                <div className="min-h-[80px] border border-transparent" />
              )}

              {/* Customer Sign */}
              {(store.invoicePrintSettings?.showFingerprint ?? true) ? (
                <div className="flex flex-col items-center justify-between min-h-[80px] border border-black p-1 rounded-none text-center bg-white">
                  <span className="font-bold text-black">امضاء و اثر انگشت خریدار</span>
                  <p className="text-[6.5px] text-zinc-500 leading-normal px-0.5 mt-0.5 text-justify">
                    بدینوسیله صحت مشخصات عیار و وزن خالص جدول فوق تسلیم خریدار گردید و اصالت آن مورد تایید است.
                  </p>
                  <div className="w-8 h-8 rounded-none border border-zinc-300 border-dashed flex items-center justify-center text-[5.5px] text-zinc-400 my-0.5 bg-zinc-50/20">
                    محل انگشت
                  </div>
                </div>
              ) : (
                <div className="min-h-[80px] border border-transparent" />
              )}

              {/* Legal terms */}
              {(store.invoicePrintSettings?.showTerms ?? true) ? (
                <div className="border border-black p-1.5 rounded-none text-right text-[7px] text-zinc-700 space-y-0.5 bg-white">
                  <span className="font-bold text-black block border-b border-black pb-0.5 mb-1 text-center font-sans">تعهدات و مقررات قانونی</span>
                  <p>۱. تعویض یا مرجوعی کالا منوط به ارائه این فاکتور رسمی است.</p>
                  <p>۲. عیار کلیه اقلام فروخته شده ۱۸ عیار استاندارد (۷۵۰) تضمین می‌شود.</p>
                  <p>۳. فاکتور دارای شناسه رهگیری معتبر حسابداری اتحادیه است.</p>
                </div>
              ) : (
                <div className="min-h-[80px] border border-transparent" />
              )}
            </div>

            {/* 6. PRINT FOOTER CONTACT */}
            <div className="border-t border-black pt-2 text-center text-[8px] text-black space-y-0.5 font-sans">
              <p className="font-bold text-black">
                نشانی: {store.address} · تلفن تماس: {store.phone} · اینستاگرام: @{store.instagram}
              </p>
              <p className="text-[7px] text-zinc-500 font-mono leading-none pt-0.5">
                کدپستی ۱۰ رقمی: {store.postalCode || '۱۱۶۳۶۱۴۱۱۱'} · شناسه حسابداری زرسا: IR-GOLD-{selectedDoc.invoiceNumber || selectedDoc.receiptNumber}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM DIALOG: DELETE CONFIRMATION MODAL */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#141418] max-w-sm w-full rounded-3xl p-5 border border-zinc-800 shadow-2xl space-y-4 text-xs text-right">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-rose-500">
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <h3 className="text-sm font-black text-white">حذف قطعی سند حسابداری</h3>
            </div>
            
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              آیا از حذف دائمی این {deleteConfirmDoc.docType === 'sell' ? 'فاکتور فروش' : 'رسید خرید'} به شماره‌ی <strong className="text-white font-mono">#{deleteConfirmDoc.invoiceNumber || deleteConfirmDoc.receiptNumber}</strong> اطمینان دارید؟
              <br />
              <span className="text-rose-400 font-bold block mt-1.5">⚠️ هشدار: این عملیات قابل بازگشت نبوده و به صورت مستقیم از محاسبات سود گالری کسر می‌شود.</span>
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold border border-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => executeDeleteDoc(deleteConfirmDoc)}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-600/10"
              >
                تأیید و حذف نهایی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DIALOG: PRINT PREVIEW MODAL */}
      {showPrintPreview && selectedDoc && (
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
                
                {/* 1. Print Header */}
                <div className="flex items-start justify-between border-b border-black pb-2">
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
                          `سند مالی ${selectedDoc.docType === 'sell' ? 'فروش' : 'خرید'}\nگالری: ${store.name}\nشماره: ${selectedDoc.docType === 'sell' ? selectedDoc.invoiceNumber : selectedDoc.receiptNumber}\nمشتری: ${selectedDoc.customerName || 'حضورى'}\nکالا: ${selectedDoc.itemTitle}\nوزن: ${(selectedDoc.weight || selectedDoc.rawWeight || 0).toFixed(3)} گرم\nمبلغ: ${(selectedDoc.docType === 'sell' ? selectedDoc.totalAmount : selectedDoc.totalPayable).toLocaleString('fa-IR')} تومان`
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
                      {selectedDoc.docType === 'sell' ? 'فاکتور فروش طلا' : 'رسید خرید طلا'}
                    </div>
                    <div className="flex justify-between gap-1">
                      <span>شماره:</span>
                      <strong className="font-bold">#{selectedDoc.docType === 'sell' ? selectedDoc.invoiceNumber : selectedDoc.receiptNumber}</strong>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span>تاریخ:</span>
                      <strong className="font-bold">{selectedDoc.dateFa}</strong>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span>ساعت:</span>
                      <strong className="font-bold">{selectedDoc.timeFa}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Customer Info Row */}
                <div className="border border-black overflow-hidden text-[7.5px] bg-white">
                  <div className="grid grid-cols-2 bg-zinc-100 border-b border-black font-bold text-center">
                    <div className="p-0.5 border-l border-black text-right pr-1">مشخصات طرف معامله</div>
                    <div className="p-0.5 text-right pr-1">مشخصات گالری صادرکننده</div>
                  </div>
                  <div className="grid grid-cols-2 text-black">
                    <div className="p-1 border-l border-black space-y-0.5 text-right">
                      <div>نام مشتری: <strong className="font-black">{selectedDoc.customerName || 'مشتری حضوری'}</strong></div>
                      <div>تلفن همراه: <strong className="font-mono">{selectedDoc.customerPhone || 'ثبت نشده'}</strong></div>
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
                <div className="border border-black overflow-hidden bg-white">
                  <table className="w-full text-right text-[7px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-black font-black text-center text-black">
                        <th className="p-0.5 border-l border-black w-5">ردیف</th>
                        <th className="p-0.5 border-l border-black text-right pr-1">شرح مصنوعات طلا و جواهرات / مسکوکات</th>
                        <th className="p-0.5 border-l border-black w-12 text-center">وزن (گرم)</th>
                        <th className="p-0.5 border-l border-black w-8 text-center">عیار</th>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <th className="p-0.5 border-l border-black w-14 text-center">نرخ (تومان)</th>}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <th className="p-0.5 border-l border-black w-16 text-center">ارزش خام (ت)</th>}
                        {(store.invoicePrintSettings?.showFee ?? true) && <th className="p-0.5 border-l border-black w-10 text-center">اجرت/کسور</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black text-center text-black font-medium">
                        <td className="p-1 border-l border-black">۱</td>
                        <td className="p-1 border-l border-black text-right pr-1 font-bold">{selectedDoc.itemTitle}</td>
                        <td className="p-1 border-l border-black font-mono">{(selectedDoc.weight || selectedDoc.rawWeight || 0).toFixed(3)}</td>
                        <td className="p-1 border-l border-black">{selectedDoc.karat || selectedDoc.sourceKarat || '۱۸ (۷۵۰)'}</td>
                        {(store.invoicePrintSettings?.showRawGoldRate ?? true) && <td className="p-1 border-l border-black font-mono">{selectedDoc.goldPrice?.toLocaleString('fa-IR') || selectedDoc.goldPriceUsed?.toLocaleString('fa-IR')}</td>}
                        {(store.invoicePrintSettings?.showRawGoldValue ?? true) && <td className="p-1 border-l border-black font-mono">{(selectedDoc.rawGoldAmount || Math.round(selectedDoc.standardWeight750 * selectedDoc.goldPriceUsed))?.toLocaleString('fa-IR')}</td>}
                        {(store.invoicePrintSettings?.showFee ?? true) && <td className="p-1 border-l border-black font-mono">{(selectedDoc.feeAmount || selectedDoc.discountAmount || 0)?.toLocaleString('fa-IR')}</td>}
                      </tr>
                      {/* Empty filler rows for official printing look */}
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
                <div className="grid grid-cols-2 gap-2 text-[7.5px]">
                  {/* Left Column: QR and official details */}
                  <div className="border border-black p-1 space-y-0.5 bg-zinc-50 flex flex-col justify-center text-right pr-1.5 text-[6.5px]">
                    <span className="font-bold text-black">سامانه حسابداری زرسا</span>
                    <span>شناسه فاکتور: {selectedDoc.id}</span>
                    <span>ثبت همزمان در معین اشخاص همکار: {selectedDoc.accountId ? 'بله ✓' : 'خیر'}</span>
                  </div>

                  {/* Right Column: Financial details */}
                  <div className="border border-black p-1 space-y-1 bg-white font-mono text-left pl-1.5">
                    <div className="flex justify-between gap-1 text-black font-sans text-[7px] font-bold">
                      <span className="font-sans">مبلغ کل محاسبه‌شده:</span>
                      <strong>{(selectedDoc.totalAmount || selectedDoc.totalPayable)?.toLocaleString('fa-IR')} تومان</strong>
                    </div>
                    <div className="flex justify-between gap-1 text-[6.5px] text-zinc-500">
                      <span className="font-sans">تخفیف / کسورات توافقی:</span>
                      <span>{(selectedDoc.discountAmount || 0).toLocaleString('fa-IR')} ت</span>
                    </div>
                    <div className="flex justify-between gap-1 text-[7px] font-bold text-red-600 border-t border-black/10 pt-1">
                      <span className="font-sans">مبلغ نهایی تسویه شده:</span>
                      <strong>{(selectedDoc.totalAmount || selectedDoc.totalPayable)?.toLocaleString('fa-IR')} ت</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Terms, Stamps & Signatures */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-[7px]">
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
                <div className="border-t border-black pt-1.5 text-center text-[7px] text-black space-y-0.5 font-sans leading-none">
                  <p className="font-bold">
                    نشانی: {store.address} · تلفن تماس: {store.phone}
                  </p>
                  <p className="text-[6px] text-zinc-500 font-mono leading-none pt-0.5">
                    شناسه حسابداری زرسا: IR-GOLD-{selectedDoc.invoiceNumber || selectedDoc.receiptNumber}
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
                  if (selectedDoc.docType === 'sell') {
                    downloadInvoicePDF(selectedDoc as SaleInvoice, store);
                  } else {
                    downloadPurchaseReceiptPDF(selectedDoc as PurchaseInvoice, store);
                  }
                }}
                className="px-4 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-[#ffd700] border border-[#d4af37]/30 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-[#ffd700]" />
                <span>دانلود PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="px-4 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                بستن پیش‌نمایش
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
