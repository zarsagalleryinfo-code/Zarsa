import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  Search, 
  Trash2, 
  Plus, 
  ArrowUpLeft, 
  ArrowDownRight, 
  Coins, 
  Calendar, 
  X, 
  Check, 
  Copy, 
  FileText, 
  Phone, 
  Building, 
  ChevronLeft, 
  Download, 
  RefreshCw,
  TrendingUp,
  User,
  ArrowRight,
  TrendingDown,
  Printer
} from 'lucide-react';
import { ContactAccount, LedgerTransaction, PurchaseInvoice } from '../types';
import { formatTomanAmount, toPersianDigits, parseCleanNumber, parseCleanFloat } from '../utils/numberFormat';

interface ContactsLedgerProps {
  accounts: ContactAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<ContactAccount[]>>;
  goldPrice: number;
  showNotification: (msg: string, type?: 'success' | 'amber' | 'error') => void;
  getPersianDate: () => string;
  getPersianTime: () => string;
  store: any;
  purchases?: PurchaseInvoice[];
  setPurchases?: React.Dispatch<React.SetStateAction<PurchaseInvoice[]>>;
}

export default function ContactsLedger({
  accounts,
  setAccounts,
  goldPrice,
  showNotification,
  getPersianDate,
  getPersianTime,
  store,
  purchases,
  setPurchases
}: ContactsLedgerProps) {
  // Navigation / Active View state
  // 'list' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [deleteConfirmContact, setDeleteConfirmContact] = useState<{ id: string; name: string } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [balanceFilter, setFilter] = useState<'all' | 'has_gold' | 'has_rial' | 'debtors' | 'creditors'>('all');

  // New Contact Modal & Form State
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactShop, setContactShop] = useState('');
  
  // Initial Balance Form State
  const [initGoldType, setInitGoldType] = useState<'balanced' | 'debtor' | 'creditor'>('balanced');
  const [initGoldWeight, setInitGoldWeight] = useState<number>(0);
  const [initRialType, setInitRialType] = useState<'balanced' | 'debtor' | 'creditor'>('balanced');
  const [initRialAmount, setInitRialAmount] = useState<number>(0);

  // New Transaction Modal & Form State
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txTab, setTxTab] = useState<'buy_gold' | 'sell_gold' | 'physical_gold' | 'cash' | 'manual'>('buy_gold');
  const [txDesc, setTxTxDesc] = useState('');
  const [txGoldRate, setTxGoldRate] = useState<number>(goldPrice);
  
  const [txGoldType, setTxGoldType] = useState<'none' | 'received' | 'delivered'>('none');
  const [txGoldWeight, setTxGoldWeight] = useState<number>(0);
  
  const [txRialType, setTxRialType] = useState<'none' | 'received' | 'paid'>('none');
  const [txRialAmount, setTxRialAmount] = useState<number>(0);

  // Physical Gold Form State
  const [txPhysDirection, setTxPhysDirection] = useState<'received' | 'delivered'>('received');
  const [txPhysEngCode, setTxPhysEngCode] = useState('');
  const [txPhysLabName, setTxPhysLabName] = useState('');
  const [txPhysCarat, setTxPhysCarat] = useState<number>(750);
  const [txPhysRawWeight, setTxPhysRawWeight] = useState<number>(0);
  const [txPhysStdWeight, setTxPhysStdWeight] = useState<number>(0);
  const [txPhysAutoSettle, setTxPhysAutoSettle] = useState<boolean>(false);

  // Cash / Bank Form State
  const [txBankDirection, setTxBankDirection] = useState<'received' | 'paid'>('received');
  const [txBankCardNumber, setTxBankCardNumber] = useState('');
  const [txBankName, setTxBankName] = useState('');

  // Print state for A5 Black and White Receipt
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrintLedger = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  // Get active selected account details
  const activeAccount = useMemo(() => {
    return accounts.find(acc => acc.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  // Auto calculate and sync weights when auto-settle is active
  React.useEffect(() => {
    if (txPhysAutoSettle && activeAccount) {
      const balance = activeAccount.currentGoldBalance;
      if (balance !== 0) {
        const requiredStd = Math.abs(balance);
        setTxPhysStdWeight(requiredStd);
        setTxPhysDirection(balance < 0 ? 'received' : 'delivered');
        
        const currentCarat = txPhysCarat || 750;
        const calculatedRaw = (requiredStd * 750) / currentCarat;
        setTxPhysRawWeight(Number(calculatedRaw.toFixed(3)));
      } else {
        setTxPhysStdWeight(0);
        setTxPhysRawWeight(0);
      }
    }
  }, [txPhysAutoSettle, txPhysCarat, activeAccount?.currentGoldBalance]);

  // Persian status labels helper
  const getStatusLabel = (status: 'debtor' | 'creditor' | 'balanced', isGold: boolean) => {
    if (status === 'balanced') return 'بی‌حساب (صفر)';
    if (isGold) {
      return status === 'debtor' ? 'بدهکار طلا' : 'بستانکار طلا';
    } else {
      return status === 'debtor' ? 'بدهکار ریال' : 'بستانکار ریال';
    }
  };

  // Status colors helper
  const getStatusClass = (status: 'debtor' | 'creditor' | 'balanced') => {
    if (status === 'balanced') return 'text-zinc-500 bg-zinc-950 border-zinc-900';
    return status === 'debtor'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 font-black'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-black';
  };

  // Add Contact logic
  const handleAddContact = () => {
    if (!contactName.trim()) {
      showNotification('نام و نام خانوادگی الزامی است', 'amber');
      return;
    }

    // Generate account code e.g. "زر-۱۰۰۱"
    const nextNum = 1000 + accounts.length + 1;
    const accountCode = `زر-${toPersianDigits(nextNum)}`;

    const parsedGoldWeight = initGoldType === 'balanced' ? 0 : (initGoldWeight || 0);
    const parsedRialAmount = initRialType === 'balanced' ? 0 : (initRialAmount || 0);

    const actualGoldBalance = initGoldType === 'debtor' ? -parsedGoldWeight : parsedGoldWeight;
    const actualRialBalance = initRialType === 'debtor' ? -parsedRialAmount : parsedRialAmount;

    const newContact: ContactAccount = {
      id: 'acc_' + Date.now(),
      accountCode,
      name: contactName.trim(),
      phone: contactPhone.trim(),
      shopName: contactShop.trim() || undefined,
      createdAt: getPersianDate() + ' ' + getPersianTime(),
      
      initialGoldBalance: parsedGoldWeight,
      initialGoldStatus: initGoldType,
      initialRialBalance: parsedRialAmount,
      initialRialStatus: initRialType,

      currentGoldBalance: actualGoldBalance,
      currentGoldStatus: actualGoldBalance > 0 ? 'creditor' : actualGoldBalance < 0 ? 'debtor' : 'balanced',
      currentRialBalance: actualRialBalance,
      currentRialStatus: actualRialBalance > 0 ? 'creditor' : actualRialBalance < 0 ? 'debtor' : 'balanced',
      
      transactions: []
    };

    setAccounts(prev => [...prev, newContact]);
    showNotification(`شخص «${contactName}» با کد حساب ${accountCode} ایجاد شد`, 'success');

    // Reset Form
    setContactName('');
    setContactPhone('');
    setContactShop('');
    setInitGoldType('balanced');
    setInitGoldWeight(0);
    setInitRialType('balanced');
    setInitRialAmount(0);
    setShowAddContactModal(false);
  };

  // Delete Contact Account
  const handleDeleteContact = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmContact({ id, name });
  };

  const executeDeleteContact = (id: string, name: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    showNotification(`حساب شخص «${name}» حذف گردید`, 'amber');
    if (selectedAccountId === id) {
      setViewMode('list');
      setSelectedAccountId(null);
    }
    setDeleteConfirmContact(null);
  };

  // Add Transaction to Subsidiary Ledger (کارت معین)
  const handleAddTransaction = () => {
    if (!activeAccount) return;

    let goldDebtor = 0;
    let goldCreditor = 0;
    let rialDebtor = 0;
    let rialCreditor = 0;
    let finalDesc = txDesc.trim();
    let finalGoldRate = txGoldRate || goldPrice;
    let physGoldData: any = undefined;
    let bankInfoData: any = undefined;

    if (txTab === 'buy_gold') {
      const w = txGoldWeight || 0;
      if (w <= 0) {
        showNotification('لطفاً وزن طلای خریداری شده را وارد کنید', 'amber');
        return;
      }
      goldCreditor = w;
      rialDebtor = Number((w * finalGoldRate).toFixed(0));
      if (!finalDesc) {
        finalDesc = `خرید طلا از همکار (${w.toLocaleString('fa-IR')} گرم طلا با نرخ ${finalGoldRate.toLocaleString('fa-IR')} ت)`;
      }
    } else if (txTab === 'sell_gold') {
      const w = txGoldWeight || 0;
      if (w <= 0) {
        showNotification('لطفاً وزن طلای فروخته شده را وارد کنید', 'amber');
        return;
      }
      goldDebtor = w;
      rialCreditor = Number((w * finalGoldRate).toFixed(0));
      if (!finalDesc) {
        finalDesc = `فروش طلا به همکار (${w.toLocaleString('fa-IR')} گرم طلا با نرخ ${finalGoldRate.toLocaleString('fa-IR')} ت)`;
      }
    } else if (txTab === 'physical_gold') {
      const stdW = txPhysStdWeight || 0;
      if (stdW <= 0) {
        showNotification('لطفاً وزن ۱۸ عیار طلا را وارد کنید', 'amber');
        return;
      }
      if (txPhysDirection === 'received') {
        goldCreditor = stdW;
      } else {
        goldDebtor = stdW;
      }
      if (!finalDesc) {
        if (txPhysAutoSettle) {
          finalDesc = `دریافت طلای فیزیکی بابت تسویه اتوماتیک حساب طلایی (کد انگ: ${txPhysEngCode || '-'}, عیار: ${txPhysCarat}, وزن خام: ${txPhysRawWeight.toLocaleString('fa-IR')} گرم)`;
        } else {
          finalDesc = `تسویه طلایی - ${txPhysDirection === 'received' ? 'دریافت طلا فیزیکی از همکار' : 'تحویل طلا فیزیکی به همکار'} (وزن ۱۸ عیار: ${stdW.toLocaleString('fa-IR')} گرم)`;
        }
      }
      physGoldData = {
        engCode: txPhysEngCode.trim() || undefined,
        labName: txPhysLabName.trim() || undefined,
        carat: txPhysCarat,
        rawWeight: txPhysRawWeight,
        standardWeight750: stdW,
        direction: txPhysDirection,
        autoSettle: txPhysAutoSettle
      };
    } else if (txTab === 'cash') {
      const amount = txRialAmount || 0;
      if (amount <= 0) {
        showNotification('لطفاً مبلغ تراکنش ریالی را وارد کنید', 'amber');
        return;
      }
      if (txBankDirection === 'received') {
        rialCreditor = amount;
      } else {
        rialDebtor = amount;
      }
      if (!finalDesc) {
        finalDesc = `تسویه ریالی - ${txBankDirection === 'received' ? 'دریافت وجه نقدی از همکار' : 'پرداخت وجه نقدی به همکار'} (مبلغ: ${amount.toLocaleString('fa-IR')} ت)`;
      }
      bankInfoData = {
        cardNumber: txBankCardNumber.trim() || undefined,
        bankName: txBankName.trim() || undefined,
        direction: txBankDirection
      };
    } else if (txTab === 'manual') {
      const goldVal = txGoldType === 'none' ? 0 : (txGoldWeight || 0);
      const rialVal = txRialType === 'none' ? 0 : (txRialAmount || 0);

      if (goldVal === 0 && rialVal === 0) {
        showNotification('لطفاً حداقل یک تراکنش طلایی یا ریالی وارد کنید', 'amber');
        return;
      }

      goldDebtor = txGoldType === 'delivered' ? goldVal : 0;
      goldCreditor = txGoldType === 'received' ? goldVal : 0;

      rialDebtor = txRialType === 'paid' ? rialVal : 0;
      rialCreditor = txRialType === 'received' ? rialVal : 0;

      if (!finalDesc) {
        finalDesc = 'ثبت سند دستی در کارت معین';
      }
    }

    // Calculate new running balances
    const newGoldBalance = activeAccount.currentGoldBalance + (goldCreditor - goldDebtor);
    const newRialBalance = activeAccount.currentRialBalance + (rialCreditor - rialDebtor);

    const newTx: LedgerTransaction = {
      id: 'tx_' + Date.now(),
      dateFa: getPersianDate(),
      timeFa: getPersianTime(),
      description: finalDesc,
      goldRate: finalGoldRate,
      
      goldDebtor,
      goldCreditor,
      goldBalance: newGoldBalance,
      goldStatus: newGoldBalance > 0 ? 'creditor' : newGoldBalance < 0 ? 'debtor' : 'balanced',

      rialDebtor,
      rialCreditor,
      rialBalance: newRialBalance,
      rialStatus: newRialBalance > 0 ? 'creditor' : newRialBalance < 0 ? 'debtor' : 'balanced',

      physicalGold: physGoldData,
      bankInfo: bankInfoData
    };

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === activeAccount.id) {
        return {
          ...acc,
          currentGoldBalance: newGoldBalance,
          currentGoldStatus: newGoldBalance > 0 ? 'creditor' : newGoldBalance < 0 ? 'debtor' : 'balanced',
          currentRialBalance: newRialBalance,
          currentRialStatus: newRialBalance > 0 ? 'creditor' : newRialBalance < 0 ? 'debtor' : 'balanced',
          transactions: [...acc.transactions, newTx]
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    showNotification('تراکنش مالی جدید با موفقیت در کارت معین ثبت شد', 'success');

    // Register official receipt in purchase log if physical gold is received
    if (txTab === 'physical_gold' && txPhysDirection === 'received' && setPurchases) {
      const receiptNumber = String(Math.floor(1000 + Math.random() * 9000));
      const newPurchaseInvoice: PurchaseInvoice = {
        id: 'purch_' + Date.now(),
        receiptNumber,
        createdAt: new Date().toISOString(),
        dateFa: getPersianDate(),
        timeFa: getPersianTime(),
        type: 'melted',
        itemTitle: `دریافت طلای فیزیکی آبشده جهت تسویه حساب طلایی (کد انگ: ${txPhysEngCode || '-'}, عیار: ${txPhysCarat})`,
        customerName: activeAccount.name,
        customerPhone: activeAccount.phone || undefined,
        accountId: activeAccount.id,
        rawWeight: txPhysRawWeight,
        sourceKarat: txPhysCarat,
        standardWeight750: txPhysStdWeight || 0,
        goldPriceUsed: finalGoldRate,
        totalPayable: 0, // It settles gold balance, no rial is paid.
        engCode: txPhysEngCode || undefined,
        labName: txPhysLabName || undefined,
        note: `این رسید رسمی دریافت طلا به صورت خودکار بابت تسویه حساب طلایی شخص «${activeAccount.name}» صادر شده است.`
      };
      setPurchases(prev => [newPurchaseInvoice, ...prev]);
      showNotification(`رسید رسمی دریافت طلای فیزیکی به شماره #${receiptNumber} صادر و در دفتر اسناد ثبت شد.`, 'success');
    }

    // Reset Transaction states
    setTxTxDesc('');
    setTxGoldType('none');
    setTxGoldWeight(0);
    setTxRialType('none');
    setTxRialAmount(0);
    setTxGoldRate(goldPrice);
    setTxTab('buy_gold');
    setTxPhysDirection('received');
    setTxPhysEngCode('');
    setTxPhysLabName('');
    setTxPhysCarat(750);
    setTxPhysRawWeight(0);
    setTxPhysStdWeight(0);
    setTxPhysAutoSettle(false);
    setTxBankDirection('received');
    setTxBankCardNumber('');
    setTxBankName('');
    setShowAddTxModal(false);
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || 
        acc.name.toLowerCase().includes(q) ||
        acc.accountCode.toLowerCase().includes(q) ||
        acc.phone.includes(q) ||
        (acc.shopName && acc.shopName.toLowerCase().includes(q));

      let matchFilter = true;
      if (balanceFilter === 'has_gold') {
        matchFilter = acc.currentGoldStatus !== 'balanced';
      } else if (balanceFilter === 'has_rial') {
        matchFilter = acc.currentRialStatus !== 'balanced';
      } else if (balanceFilter === 'debtors') {
        matchFilter = acc.currentGoldStatus === 'debtor' || acc.currentRialStatus === 'debtor';
      } else if (balanceFilter === 'creditors') {
        matchFilter = acc.currentGoldStatus === 'creditor' || acc.currentRialStatus === 'creditor';
      }

      return matchSearch && matchFilter;
    });
  }, [accounts, searchQuery, balanceFilter]);

  // Copy Complete Subsidiary Ledger Statement (کپی متن کارت معین بازاری)
  const handleCopyLedgerText = () => {
    if (!activeAccount) return;

    let t = `📜 *کارت معین همکار - گالری طلا زرسا*\n`;
    t += `👤 نام شخص: ${activeAccount.name}\n`;
    t += `🔢 کد حساب: ${activeAccount.accountCode}\n`;
    if (activeAccount.shopName) t += `🏢 فروشگاه: ${activeAccount.shopName}\n`;
    t += `📱 تلفن: ${activeAccount.phone}\n`;
    t += `📅 تاریخ استخراج: ${getPersianDate()} · ساعت ${getPersianTime()}\n`;
    t += `━━━━━━━━━━━━━━━━━━━━━\n`;
    t += `⚖️ *آخرین وضعیت مانده طلایی:* ${Math.abs(activeAccount.currentGoldBalance).toLocaleString('fa-IR')} گرم ${activeAccount.currentGoldStatus === 'creditor' ? 'بستانکار' : activeAccount.currentGoldStatus === 'debtor' ? 'بدهکار' : 'بی‌حساب'}\n`;
    t += `💰 *آخرین وضعیت مانده ریالی:* ${formatTomanAmount(Math.abs(activeAccount.currentRialBalance))} ${activeAccount.currentRialStatus === 'creditor' ? 'بستانکار' : activeAccount.currentRialStatus === 'debtor' ? 'بدهکار' : 'بی‌حساب'}\n`;
    t += `━━━━━━━━━━━━━━━━━━━━━\n`;
    t += `📋 *خلاصه ریز تراکنش‌ها:*\n\n`;

    if (activeAccount.transactions.length === 0) {
      t += `هیچ تراکنشی ثبت نشده است (فقط مانده اولیه).\n`;
    } else {
      activeAccount.transactions.forEach((tx, idx) => {
        t += `${toPersianDigits(idx + 1)}. ${tx.dateFa} - ${tx.description}\n`;
        if (tx.goldDebtor > 0) t += ` 🔻 بدهکار طلا: ${tx.goldDebtor.toLocaleString('fa-IR')} گرم\n`;
        if (tx.goldCreditor > 0) t += ` 🟢 بستانکار طلا: ${tx.goldCreditor.toLocaleString('fa-IR')} گرم\n`;
        if (tx.rialDebtor > 0) t += ` 🔻 بدهکار ریالی: ${tx.rialDebtor.toLocaleString('fa-IR')} ت\n`;
        if (tx.rialCreditor > 0) t += ` 🟢 بستانکار ریالی: ${tx.rialCreditor.toLocaleString('fa-IR')} ت\n`;
        t += ` ▫️ مانده طلایی: ${Math.abs(tx.goldBalance).toLocaleString('fa-IR')} گرم (${tx.goldStatus === 'creditor' ? 'بستان' : tx.goldStatus === 'debtor' ? 'بدهکار' : 'سربه‌سر'})\n`;
        t += ` ▫️ مانده ریالی: ${Math.abs(tx.rialBalance).toLocaleString('fa-IR')} ت (${tx.rialStatus === 'creditor' ? 'بستان' : tx.rialStatus === 'debtor' ? 'بدهکار' : 'سربه‌سر'})\n`;
        t += `─────────────────────\n`;
      });
    }

    t += `*سامانه اتوماسیون حسابداری زرسا طلا*\n`;
    navigator.clipboard.writeText(t);
    showNotification('متن کامل کارت معین کپی شد؛ می‌توانید در واتساپ یا تلگرام ارسال کنید.', 'success');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 text-xs">
      
      {/* VIEW MODE 1: ACCOUNTS LIST */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          
          {/* Action Header & Search */}
          <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#d4af37]" />
                  <span>دفتر معین و حسابداری اشخاص (همکاران)</span>
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">مدیریت بدهکاری و بستانکاری‌های طلایی و ریالی به شکل موازی</p>
              </div>

              <button
                onClick={() => setShowAddContactModal(true)}
                className="h-10 px-4 rounded-xl bg-[#d4af37] text-black font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-[#d4af37]/15 cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>افزودن همکار / شخص جدید</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-zinc-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در اشخاص، کد حساب، شماره تلفن، گالری..."
                className="w-full h-10 pr-9 pl-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:border-[#d4af37] outline-none"
              />
            </div>

            {/* Balances Filters list */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  balanceFilter === 'all' ? 'bg-[#d4af37] text-black font-black shadow' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                }`}
              >
                همه همکاران ({accounts.length})
              </button>
              <button
                onClick={() => setFilter('has_gold')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  balanceFilter === 'has_gold' ? 'bg-amber-500/20 text-[#ffd700] border border-[#d4af37]/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                }`}
              >
                دارای مانده طلایی
              </button>
              <button
                onClick={() => setFilter('has_rial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  balanceFilter === 'has_rial' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                }`}
              >
                دارای مانده ریالی
              </button>
              <button
                onClick={() => setFilter('debtors')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  balanceFilter === 'debtors' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                }`}
              >
                🔴 بدهکاران طلا/ریال
              </button>
              <button
                onClick={() => setFilter('creditors')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  balanceFilter === 'creditors' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                }`}
              >
                🟢 بستانکاران طلا/ریال
              </button>
            </div>
          </div>

          {/* ACCOUNTS GRID */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-16 bg-zinc-950/40 rounded-3xl border border-zinc-800/80 space-y-2">
                <User className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-xs font-bold text-zinc-400">هیچ حسابی یافت نشد.</p>
                <p className="text-[11px] text-zinc-500">لیست اشخاص خالی است یا فیلترها را بررسی کنید.</p>
              </div>
            ) : (
              filteredAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setViewMode('detail');
                  }}
                  className="bg-zinc-900/60 hover:bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] bg-zinc-950 text-[#d4af37] border border-[#d4af37]/20 px-2 py-0.5 rounded font-black shrink-0">
                        {acc.accountCode}
                      </span>
                      <h4 className="font-black text-white text-xs sm:text-sm truncate">{acc.name}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                      {acc.shopName && (
                        <span className="flex items-center gap-1 font-bold">
                          <Building className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{acc.shopName}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{acc.phone || 'بدون تلفن'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Parallel Balances Display at a glance */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap border-t sm:border-t-0 border-zinc-800/50 pt-2.5 sm:pt-0 shrink-0">
                    
                    {/* Gold Balance */}
                    <div className="bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-850 flex flex-col justify-center min-w-[95px] text-center">
                      <span className="text-[9px] text-zinc-500 block mb-0.5">مانده طلایی</span>
                      <span className={`text-[11px] font-black font-mono block ${
                        acc.currentGoldStatus === 'creditor' ? 'text-emerald-400' : acc.currentGoldStatus === 'debtor' ? 'text-rose-400' : 'text-zinc-500'
                      }`}>
                        {acc.currentGoldStatus === 'balanced' ? '۰' : Math.abs(acc.currentGoldBalance).toLocaleString('fa-IR')} گرم
                      </span>
                      <span className={`text-[8.5px] font-bold block ${
                        acc.currentGoldStatus === 'creditor' ? 'text-emerald-500' : acc.currentGoldStatus === 'debtor' ? 'text-rose-500' : 'text-zinc-600'
                      }`}>
                        {acc.currentGoldStatus === 'creditor' ? 'بستانکار' : acc.currentGoldStatus === 'debtor' ? 'بدهکار' : 'بی‌حساب'}
                      </span>
                    </div>

                    {/* Rial Balance */}
                    <div className="bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-850 flex flex-col justify-center min-w-[95px] text-center">
                      <span className="text-[9px] text-zinc-500 block mb-0.5">مانده ریالی</span>
                      <span className={`text-[11px] font-black font-mono block truncate ${
                        acc.currentRialStatus === 'creditor' ? 'text-emerald-400' : acc.currentRialStatus === 'debtor' ? 'text-rose-400' : 'text-zinc-500'
                      }`}>
                        {acc.currentRialStatus === 'balanced' ? '۰ ت' : formatTomanAmount(Math.abs(acc.currentRialBalance))}
                      </span>
                      <span className={`text-[8.5px] font-bold block ${
                        acc.currentRialStatus === 'creditor' ? 'text-emerald-500' : acc.currentRialStatus === 'debtor' ? 'text-rose-500' : 'text-zinc-600'
                      }`}>
                        {acc.currentRialStatus === 'creditor' ? 'بستانکار' : acc.currentRialStatus === 'debtor' ? 'بدهکار' : 'بی‌حساب'}
                      </span>
                    </div>

                    {/* Compact Delete Row Action */}
                    <button
                      onClick={(e) => handleDeleteContact(acc.id, acc.name, e)}
                      className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-colors shrink-0"
                      title="حذف کامل حساب شخص"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DETAILED CONTACT SUBSIDIARY LEDGER */}
      {viewMode === 'detail' && activeAccount && (
        <div className="space-y-4 animate-in slide-in-from-left duration-200">
          
          {/* Back button and profile info */}
          <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <button
                onClick={() => setViewMode('list')}
                className="h-9 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>بازگشت به دفتر اشخاص</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLedgerText}
                  className="h-9 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[#ffd700] hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="کپی کردن متن معین"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی گزارش معین</span>
                </button>

                <button
                  onClick={handlePrintLedger}
                  className="h-9 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="چاپ رسمی کارنامه معین با ابعاد A5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ رسمی معین (A5)</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/35 px-2.5 py-0.5 rounded-lg font-black">
                    {activeAccount.accountCode}
                  </span>
                  <h3 className="text-base font-black text-white">{activeAccount.name}</h3>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                  {activeAccount.shopName && (
                    <span className="flex items-center gap-1 font-bold text-zinc-300">
                      <Building className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{activeAccount.shopName}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{activeAccount.phone || 'بدون تلفن'}</span>
                  </span>
                  <span className="text-zinc-500 font-mono">ایجاد شده: {activeAccount.createdAt}</span>
                </div>
              </div>

              <button
                onClick={() => setShowAddTxModal(true)}
                className="h-10 px-4 rounded-xl bg-[#d4af37] text-black font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-[#d4af37]/15 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>ثبت تراکنش معین جدید</span>
              </button>
            </div>

            {/* 2 Big Current Parallel Balance Callouts */}
            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Gold Balance */}
              <div className={`p-3 rounded-2xl border text-center ${
                activeAccount.currentGoldStatus === 'creditor' ? 'bg-emerald-500/10 border-emerald-500/30' : activeAccount.currentGoldStatus === 'debtor' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-zinc-950 border-zinc-800'
              }`}>
                <span className="text-[10px] text-zinc-400 block mb-1">تراز طلایی معین (گرم ۱۸ عیار):</span>
                <span className="text-lg sm:text-2xl font-black font-mono">
                  {Math.abs(activeAccount.currentGoldBalance).toLocaleString('fa-IR')}{' '}
                  <span className="text-[10px] font-normal text-zinc-400">گرم</span>
                </span>
                <span className={`text-[10px] font-bold block mt-1 ${
                  activeAccount.currentGoldStatus === 'creditor' ? 'text-emerald-400' : activeAccount.currentGoldStatus === 'debtor' ? 'text-rose-400' : 'text-zinc-500'
                }`}>
                  {activeAccount.currentGoldStatus === 'creditor' ? '🟡 طلبکار (بستانکار طلا)' : activeAccount.currentGoldStatus === 'debtor' ? '🔴 بدهکار (بدهکار طلا)' : '⚪ بی‌حساب (صفر)'}
                </span>
              </div>

              {/* Rial Balance */}
              <div className={`p-3 rounded-2xl border text-center ${
                activeAccount.currentRialStatus === 'creditor' ? 'bg-emerald-500/10 border-emerald-500/30' : activeAccount.currentRialStatus === 'debtor' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-zinc-950 border-zinc-800'
              }`}>
                <span className="text-[10px] text-zinc-400 block mb-1">تراز ریالی معین (تومان):</span>
                <span className="text-lg sm:text-2xl font-black font-mono truncate block">
                  {formatTomanAmount(Math.abs(activeAccount.currentRialBalance))}
                </span>
                <span className={`text-[10px] font-bold block mt-1 ${
                  activeAccount.currentRialStatus === 'creditor' ? 'text-emerald-400' : activeAccount.currentRialStatus === 'debtor' ? 'text-rose-400' : 'text-zinc-500'
                }`}>
                  {activeAccount.currentRialStatus === 'creditor' ? '🟢 طلبکار (بستانکار ریال)' : activeAccount.currentRialStatus === 'debtor' ? '🔴 بدهکار (بدهکار ریال)' : '⚪ بی‌حساب (صفر)'}
                </span>
              </div>
            </div>
          </div>

          {/* SUBSIDIARY LEDGER BOOK TABLE (PROFESSIONAL DOUBLE-ENTRY GRID) */}
          <div className="bg-zinc-900/60 p-4 rounded-3xl border border-zinc-800 space-y-3 overflow-hidden">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <FileText className="w-4 h-4 text-[#d4af37]" />
              <span>گردش حساب و معین تفکیکی (طلایی و ریالی)</span>
            </h4>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-850 text-[11px] bg-zinc-950/80 font-display select-none">
                    <th className="py-3 px-2 text-center text-zinc-400 font-bold font-display w-[85px]">تاریخ</th>
                    <th className="py-3 px-2 text-right text-zinc-300 font-bold font-display min-w-[180px]">شرح سند</th>
                    <th className="py-3 px-1 text-center text-rose-400 font-bold border-r border-zinc-800/40 font-display">بدهکار (طلایی)</th>
                    <th className="py-3 px-1 text-center text-rose-400 font-bold font-display">بدهکار (ریالی)</th>
                    <th className="py-3 px-1 text-center text-emerald-400 font-bold border-r border-zinc-800/40 font-display">بستانکار (طلایی)</th>
                    <th className="py-3 px-1 text-center text-emerald-400 font-bold font-display">بستانکار (ریالی)</th>
                    <th className="py-3 px-2 text-center text-amber-300 font-bold border-r border-zinc-800/40 font-display">مانده طلایی</th>
                    <th className="py-3 px-2 text-center text-emerald-300 font-bold font-display">مانده ریالی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300">
                  {/* First row: Initial Balances */}
                  <tr className="hover:bg-zinc-850/20 transition-colors font-sans text-[11px]">
                    <td className="py-3 px-2 text-center font-mono text-zinc-500 whitespace-nowrap">افتتاح</td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-white block">مانده اولیه زمان افتتاح پرونده معین</span>
                      <span className="text-[9px] text-zinc-500 font-mono">بدو تاسیس حساب</span>
                    </td>
                    
                    {/* بدهکار طلایی */}
                    <td className="py-3 px-1 text-center font-mono text-rose-400 bg-zinc-950/25 border-r border-zinc-800/40 font-bold">
                      {activeAccount.initialGoldStatus === 'debtor' ? `${activeAccount.initialGoldBalance.toLocaleString('fa-IR')} گرم` : '۰'}
                    </td>
                    {/* بدهکار ریالی */}
                    <td className="py-3 px-1 text-center font-mono text-rose-400 bg-zinc-950/25 font-bold">
                      {activeAccount.initialRialStatus === 'debtor' ? `${formatTomanAmount(activeAccount.initialRialBalance)}` : '۰'}
                    </td>
                    
                    {/* بستانکار طلایی */}
                    <td className="py-3 px-1 text-center font-mono text-emerald-400 bg-zinc-950/25 border-r border-zinc-800/40 font-bold">
                      {activeAccount.initialGoldStatus === 'creditor' ? `${activeAccount.initialGoldBalance.toLocaleString('fa-IR')} گرم` : '۰'}
                    </td>
                    {/* بستانکار ریالی */}
                    <td className="py-3 px-1 text-center font-mono text-emerald-400 bg-zinc-950/25 font-bold">
                      {activeAccount.initialRialStatus === 'creditor' ? `${formatTomanAmount(activeAccount.initialRialBalance)}` : '۰'}
                    </td>
                    
                    {/* مانده طلایی نهایی */}
                    <td className={`py-3 px-2 text-center font-mono font-black border-r border-zinc-800/40 bg-[#d4af37]/5 ${
                      activeAccount.initialGoldStatus === 'creditor' ? 'text-emerald-400' : activeAccount.initialGoldStatus === 'debtor' ? 'text-rose-400' : 'text-zinc-600'
                    }`}>
                      {activeAccount.initialGoldBalance === 0 ? '۰' : `${activeAccount.initialGoldBalance.toLocaleString('fa-IR')} گرم`}
                      {activeAccount.initialGoldBalance > 0 && <span className="text-[8.5px] font-bold mr-1 text-emerald-500">(بستانکار)</span>}
                      {activeAccount.initialGoldStatus === 'debtor' && <span className="text-[8.5px] font-bold mr-1 text-rose-500">(بدهکار)</span>}
                    </td>
                    {/* /مانده ریالی نهایی */}
                    <td className={`py-3 px-2 text-center font-mono font-black bg-emerald-500/5 ${
                      activeAccount.initialRialStatus === 'creditor' ? 'text-emerald-400' : activeAccount.initialRialStatus === 'debtor' ? 'text-rose-400' : 'text-zinc-600'
                    }`}>
                      {activeAccount.initialRialBalance === 0 ? '۰' : `${formatTomanAmount(activeAccount.initialRialBalance)}`}
                      {activeAccount.initialRialBalance > 0 && <span className="text-[8.5px] font-bold mr-1 text-emerald-500">(بستانکار)</span>}
                      {activeAccount.initialRialStatus === 'debtor' && <span className="text-[8.5px] font-bold mr-1 text-rose-500">(بدهکار)</span>}
                    </td>
                  </tr>

                  {/* Dynamic Transactions Rows */}
                  {activeAccount.transactions.map((tx, idx) => {
                    const prevGold = tx.goldBalance - (tx.goldCreditor - tx.goldDebtor);
                    const prevRial = tx.rialBalance - (tx.rialCreditor - tx.rialDebtor);
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-850/20 transition-colors font-sans text-[11px]">
                        {/* تاریخ */}
                        <td className="py-3 px-2 text-center font-mono text-zinc-400 leading-normal">
                          <span className="block font-bold">{tx.dateFa}</span>
                          <span className="block text-[9px] text-zinc-500">{tx.timeFa}</span>
                        </td>
                        
                        {/* شرح سند */}
                        <td className="py-3 px-2 max-w-[250px]">
                          <span className="font-black text-white block leading-relaxed">{tx.description}</span>
                          
                          {/* Physical Gold spec badges if present */}
                          {tx.physicalGold && (
                            <div className="mt-1 flex flex-wrap gap-1 text-[8.5px] text-zinc-400 font-bold bg-zinc-950/70 p-2 rounded-xl border border-zinc-800">
                              {tx.physicalGold.engCode && <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/10">کد انگ: {tx.physicalGold.engCode}</span>}
                              {tx.physicalGold.labName && <span className="bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded-lg">آزمایشگاه: {tx.physicalGold.labName}</span>}
                              {tx.physicalGold.carat && <span className="bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded-lg">عیار: {tx.physicalGold.carat}</span>}
                              {tx.physicalGold.rawWeight !== undefined && tx.physicalGold.rawWeight > 0 && <span className="bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded-lg">وزن ناخالص: {tx.physicalGold.rawWeight.toLocaleString('fa-IR')} گرم</span>}
                              {tx.physicalGold.standardWeight750 !== undefined && tx.physicalGold.standardWeight750 > 0 && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg">وزن ۱۸: {tx.physicalGold.standardWeight750.toLocaleString('fa-IR')} گرم</span>}
                            </div>
                          )}

                          {/* Bank settlement spec badges if present */}
                          {tx.bankInfo && (
                            <div className="mt-1 flex flex-wrap gap-1 text-[8.5px] text-zinc-400 font-bold bg-zinc-950/70 p-2 rounded-xl border border-zinc-800">
                              {tx.bankInfo.bankName && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/10">بانک: {tx.bankInfo.bankName}</span>}
                              {tx.bankInfo.cardNumber && <span className="bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded-lg font-mono">حساب/کارت: {tx.bankInfo.cardNumber}</span>}
                            </div>
                          )}

                          {/* Running Balances Transition */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] text-zinc-500 border-t border-zinc-800/30 pt-1.5">
                            <span className="font-bold">تغییر تراز:</span>
                            <span className="font-mono text-zinc-400 bg-zinc-950/60 px-2 py-0.5 rounded-lg border border-zinc-850">
                              طلا: {prevGold.toLocaleString('fa-IR')} ➔ {tx.goldBalance.toLocaleString('fa-IR')}
                            </span>
                            <span className="font-mono text-zinc-400 bg-zinc-950/60 px-2 py-0.5 rounded-lg border border-zinc-850">
                              ریال: {prevRial.toLocaleString('fa-IR')} ➔ {tx.rialBalance.toLocaleString('fa-IR')}
                            </span>
                          </div>

                          {tx.goldRate > 0 && (
                            <span className="text-[9px] text-[#d4af37] font-mono block mt-1">
                              مبنای طلا: {tx.goldRate.toLocaleString('fa-IR')} ت
                            </span>
                          )}
                        </td>
                        
                        {/* بدهکار طلایی */}
                        <td className="py-3 px-1 text-center font-mono text-rose-400 font-bold bg-zinc-950/25 border-r border-zinc-800/40">
                          {tx.goldDebtor > 0 ? `${tx.goldDebtor.toLocaleString('fa-IR')} گرم` : '۰'}
                        </td>
                        {/* بدهکار ریالی */}
                        <td className="py-3 px-1 text-center font-mono text-rose-400 font-bold bg-zinc-950/25">
                          {tx.rialDebtor > 0 ? `${formatTomanAmount(tx.rialDebtor)}` : '۰'}
                        </td>
                        
                        {/* بستانکار طلایی */}
                        <td className="py-3 px-1 text-center font-mono text-emerald-400 font-bold bg-zinc-950/25 border-r border-zinc-800/40">
                          {tx.goldCreditor > 0 ? `${tx.goldCreditor.toLocaleString('fa-IR')} گرم` : '۰'}
                        </td>
                        {/* بستانکار ریالی */}
                        <td className="py-3 px-1 text-center font-mono text-emerald-400 font-bold bg-zinc-950/25">
                          {tx.rialCreditor > 0 ? `${formatTomanAmount(tx.rialCreditor)}` : '۰'}
                        </td>
                        
                        {/* مانده طلایی */}
                        <td className={`py-3 px-2 text-center font-mono font-black border-r border-zinc-800/40 bg-[#d4af37]/5 ${
                          tx.goldStatus === 'creditor' ? 'text-emerald-400' : tx.goldStatus === 'debtor' ? 'text-rose-400' : 'text-zinc-600'
                        }`}>
                          {tx.goldBalance === 0 ? '۰' : `${Math.abs(tx.goldBalance).toLocaleString('fa-IR')} گرم`}
                          {tx.goldBalance > 0 && <span className="text-[8.5px] font-bold block text-emerald-500">(بستانکار)</span>}
                          {tx.goldBalance < 0 && <span className="text-[8.5px] font-bold block text-rose-500">(بدهکار)</span>}
                        </td>
                        {/* مانده ریالی */}
                        <td className={`py-3 px-2 text-center font-mono font-black bg-emerald-500/5 ${
                          tx.rialStatus === 'creditor' ? 'text-emerald-400' : tx.rialStatus === 'debtor' ? 'text-rose-400' : 'text-zinc-600'
                        }`}>
                          {tx.rialBalance === 0 ? '۰' : `${formatTomanAmount(Math.abs(tx.rialBalance))}`}
                          {tx.rialBalance > 0 && <span className="text-[8.5px] font-bold block text-emerald-500">(بستانکار)</span>}
                          {tx.rialBalance < 0 && <span className="text-[8.5px] font-bold block text-rose-500">(بدهکار)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD CONTACT / PERSON */}
      {/* ========================================================================= */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#141418] max-w-md w-full rounded-3xl border border-zinc-800 p-5 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#d4af37]" />
                <span>افزودن همکار / شخص جدید به دفتر</span>
              </h3>
              <button 
                onClick={() => setShowAddContactModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">نام و نام خانوادگی:</label>
                  <input 
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="مثال: رضا محمدی"
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">شماره همراه:</label>
                  <input 
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-left outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">نام گالری / فروشگاه (اختیاری):</label>
                <input 
                  type="text"
                  value={contactShop}
                  onChange={(e) => setContactShop(e.target.value)}
                  placeholder="مثال: طلا و جواهر محمدی"
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Initial Gold Balance Section */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-850 space-y-2">
                <span className="text-[11px] font-bold text-[#ffd700] block">تنظیم مانده حساب طلایی اولیه (گرم ۱۸)</span>
                <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => { setInitGoldType('balanced'); setInitGoldWeight(0); }}
                    className={`py-1 rounded font-bold transition-all ${initGoldType === 'balanced' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    بی‌حساب (صفر)
                  </button>
                  <button
                    onClick={() => setInitGoldType('debtor')}
                    className={`py-1 rounded font-bold transition-all ${initGoldType === 'debtor' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'}`}
                  >
                    بدهکار طلا
                  </button>
                  <button
                    onClick={() => setInitGoldType('creditor')}
                    className={`py-1 rounded font-bold transition-all ${initGoldType === 'creditor' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                  >
                    بستانکار طلا
                  </button>
                </div>
                
                {initGoldType !== 'balanced' && (
                  <div className="relative animate-in fade-in duration-200">
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={initGoldWeight || ''}
                      onChange={(e) => setInitGoldWeight(parseCleanFloat(e.target.value))}
                      placeholder="وزن طلا به گرم..."
                      className="w-full h-9 pl-10 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center text-sm outline-none focus:border-[#d4af37]"
                    />
                    <span className="absolute left-3 top-2 text-[10px] text-zinc-500 font-mono">گرم</span>
                  </div>
                )}
              </div>

              {/* Initial Rial Balance Section */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-850 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 block">تنظیم مانده حساب ریالی اولیه (تومان)</span>
                <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => { setInitRialType('balanced'); setInitRialAmount(0); }}
                    className={`py-1 rounded font-bold transition-all ${initRialType === 'balanced' ? 'bg-[#d4af37] text-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    بی‌حساب (صفر)
                  </button>
                  <button
                    onClick={() => setInitRialType('debtor')}
                    className={`py-1 rounded font-bold transition-all ${initRialType === 'debtor' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'}`}
                  >
                    بدهکار ریال
                  </button>
                  <button
                    onClick={() => setInitRialType('creditor')}
                    className={`py-1 rounded font-bold transition-all ${initRialType === 'creditor' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                  >
                    بستانکار ریال
                  </button>
                </div>
                
                {initRialType !== 'balanced' && (
                  <div className="relative animate-in fade-in duration-200">
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={formatTomanAmount(initRialAmount)}
                      onChange={(e) => setInitRialAmount(parseCleanNumber(e.target.value))}
                      placeholder="مبلغ بدهکاری / بستانکاری به تومان..."
                      className="w-full h-9 pl-12 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center text-sm outline-none focus:border-[#d4af37]"
                    />
                    <span className="absolute left-3 top-2 text-[10px] text-zinc-500">تومان</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="flex-1 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold"
              >
                انصراف
              </button>
              <button
                onClick={handleAddContact}
                className="flex-1 h-11 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black shadow-lg shadow-[#d4af37]/20"
              >
                ثبت حساب شخص
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GOLD TRADING & ACCOUNTING OPERATIONS MODAL (مغز حسابداری) */}
      {/* ========================================================================= */}
      {showAddTxModal && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#141418] max-w-lg w-full rounded-3xl border border-zinc-800 p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#d4af37]" />
                  <span>عملیات حسابداری طلا: {activeAccount.name}</span>
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">ثبت خودکار سندهای بدهکاری و بستانکاری طلایی/ریالی</p>
              </div>
              <button 
                onClick={() => setShowAddTxModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB SELECTORS (۵ حالت پیشرفته و روان) */}
            <div className="grid grid-cols-5 gap-1 bg-zinc-950 p-1 rounded-xl text-[10px] font-bold text-center border border-zinc-850">
              <button
                onClick={() => { setTxTab('buy_gold'); setTxTxDesc(''); }}
                className={`py-2 rounded-lg transition-all shrink-0 font-black ${txTab === 'buy_gold' ? 'bg-[#d4af37] text-black shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                خرید طلا
              </button>
              <button
                onClick={() => { setTxTab('sell_gold'); setTxTxDesc(''); }}
                className={`py-2 rounded-lg transition-all shrink-0 font-black ${txTab === 'sell_gold' ? 'bg-[#d4af37] text-black shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                فروش طلا
              </button>
              <button
                onClick={() => { setTxTab('physical_gold'); setTxTxDesc(''); }}
                className={`py-2 rounded-lg transition-all shrink-0 font-black ${txTab === 'physical_gold' ? 'bg-amber-500/20 text-[#ffd700] border border-amber-500/10' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                طلا فیزیکی
              </button>
              <button
                onClick={() => { setTxTab('cash'); setTxTxDesc(''); }}
                className={`py-2 rounded-lg transition-all shrink-0 font-black ${txTab === 'cash' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                تسویه ریالی
              </button>
              <button
                onClick={() => { setTxTab('manual'); setTxTxDesc(''); }}
                className={`py-2 rounded-lg transition-all shrink-0 font-black ${txTab === 'manual' ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                سند دستی
              </button>
            </div>

            {/* TAB CONTENT AREAS */}
            <div className="space-y-4 min-h-[180px] max-h-[400px] overflow-y-auto pr-1">

              {/* Base Info for Buy / Sell / Manual */}
              {(txTab === 'buy_gold' || txTab === 'sell_gold' || txTab === 'manual') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">تاریخ ثبت:</label>
                    <div className="w-full h-10 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-300 flex items-center font-mono">
                      {getPersianDate()}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">نرخ مبنای ۱۸ عیار طلا (تومان):</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={formatTomanAmount(txGoldRate)}
                      onChange={(e) => setTxGoldRate(parseCleanNumber(e.target.value))}
                      className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              )}

              {/* Tab 1 & Tab 2: Buy Gold & Sell Gold Form */}
              {(txTab === 'buy_gold' || txTab === 'sell_gold') && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-3">
                    <span className="text-[11px] font-bold text-[#ffd700] block">
                      {txTab === 'buy_gold' ? 'خرید طلا از همکار (دریافت طلا خام، بدهکار شدن پول آن)' : 'فروش طلا به همکار (تحویل طلا خام، بستانکار شدن پول آن)'}
                    </span>
                    
                    <div className="relative">
                      <label className="text-[10px] text-zinc-400 block mb-1">وزن طلا خام (گرم ۱۸ عیار):</label>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={txGoldWeight || ''}
                        onChange={(e) => setTxGoldWeight(parseCleanFloat(e.target.value))}
                        placeholder="مثال: ۵۰.۲۵"
                        className="w-full h-10 pl-10 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center text-sm outline-none focus:border-[#d4af37]"
                      />
                      <span className="absolute left-3 top-7 text-[10px] text-zinc-500 font-mono">گرم</span>
                    </div>

                    {/* Live Toman value estimation */}
                    <div className="bg-zinc-900 p-2.5 rounded-xl text-center text-[11px] font-bold text-zinc-400">
                      مبلغ ریالی برآوردی: <span className="text-emerald-400 font-mono text-xs">{formatTomanAmount(Number(((txGoldWeight || 0) * txGoldRate).toFixed(0)))}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Receive / Deliver Physical Gold */}
              {txTab === 'physical_gold' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-3 text-xs">
                    <span className="text-[11px] font-bold text-[#ffd700] block">انتقال طلا فیزیکی (بدون جریان مالی)</span>
                    
                    {/* Auto settle option */}
                    {activeAccount && activeAccount.currentGoldBalance !== 0 && (
                      <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-[#d4af37]/30 rounded-xl">
                        <input
                          type="checkbox"
                          id="phys_auto_settle"
                          checked={txPhysAutoSettle}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setTxPhysAutoSettle(isChecked);
                            if (isChecked) {
                              const requiredStd = Math.abs(activeAccount.currentGoldBalance);
                              setTxPhysStdWeight(requiredStd);
                              setTxPhysDirection(activeAccount.currentGoldBalance < 0 ? 'received' : 'delivered');
                              const currentCarat = txPhysCarat || 750;
                              const calculatedRaw = (requiredStd * 750) / currentCarat;
                              setTxPhysRawWeight(Number(calculatedRaw.toFixed(3)));
                            } else {
                              setTxPhysStdWeight(0);
                              setTxPhysRawWeight(0);
                            }
                          }}
                          className="w-4 h-4 text-[#d4af37] bg-zinc-900 border-zinc-750 rounded focus:ring-0 cursor-pointer accent-[#d4af37]"
                        />
                        <label htmlFor="phys_auto_settle" className="text-[10px] font-black text-amber-300 cursor-pointer select-none leading-none">
                          دریافت طلای فیزیکی جهت تسویه خودکار حساب طلایی (بدهی: {Math.abs(activeAccount.currentGoldBalance).toLocaleString('fa-IR')} گرم)
                        </label>
                      </div>
                    )}

                    {/* Toggle Direction */}
                    <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-lg text-[10px]">
                      <button
                        type="button"
                        disabled={txPhysAutoSettle}
                        onClick={() => setTxPhysDirection('received')}
                        className={`py-1.5 rounded font-black transition-all ${
                          txPhysDirection === 'received' 
                            ? 'bg-emerald-500/20 text-emerald-400 font-black' 
                            : 'text-zinc-500 hover:text-zinc-400'
                        } ${txPhysAutoSettle ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        دریافت طلا فیزیکی (تسویه طلایی)
                      </button>
                      <button
                        type="button"
                        disabled={txPhysAutoSettle}
                        onClick={() => setTxPhysDirection('delivered')}
                        className={`py-1.5 rounded font-black transition-all ${
                          txPhysDirection === 'delivered' 
                            ? 'bg-rose-500/20 text-rose-400 font-black' 
                            : 'text-zinc-500 hover:text-zinc-400'
                        } ${txPhysAutoSettle ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        تحویل طلا فیزیکی (خروج طلا)
                      </button>
                    </div>

                    {/* Detailed physical gold attributes */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">کد انگ (آبشده) * :</label>
                        <input 
                          type="text"
                          value={txPhysEngCode}
                          onChange={(e) => setTxPhysEngCode(e.target.value)}
                          placeholder="مثال: ۱۲۳۴۵"
                          required
                          className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">آزمایشگاه (ری‌گیری):</label>
                        <input 
                          type="text"
                          value={txPhysLabName}
                          onChange={(e) => setTxPhysLabName(e.target.value)}
                          placeholder="مثال: زرگران"
                          className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">عیار طلا * :</label>
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={txPhysCarat}
                          onChange={(e) => {
                            const val = parseCleanNumber(e.target.value);
                            setTxPhysCarat(val);
                            if (!txPhysAutoSettle) {
                              setTxPhysStdWeight(Number(((txPhysRawWeight * val) / 750).toFixed(3)));
                            }
                          }}
                          placeholder="۷۵۰"
                          className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">وزن خام (گرم) * :</label>
                        <input 
                          type="text"
                          inputMode="decimal"
                          readOnly={txPhysAutoSettle}
                          value={txPhysRawWeight || ''}
                          onChange={(e) => {
                            const val = parseCleanFloat(e.target.value);
                            setTxPhysRawWeight(val);
                            setTxPhysStdWeight(Number(((val * txPhysCarat) / 750).toFixed(3)));
                          }}
                          placeholder="۱۰.۰۰"
                          className={`w-full h-9 px-3 border rounded-xl font-mono text-center outline-none focus:border-[#d4af37] ${
                            txPhysAutoSettle 
                              ? 'bg-zinc-900/40 text-zinc-400 border-zinc-850 cursor-not-allowed' 
                              : 'bg-zinc-900 text-white border-zinc-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#ffd700] block mb-1 font-bold">وزن ۱۸ عیار (۷۵۰) * :</label>
                        <input 
                          type="text"
                          inputMode="decimal"
                          readOnly={txPhysAutoSettle}
                          value={txPhysStdWeight || ''}
                          onChange={(e) => setTxPhysStdWeight(parseCleanFloat(e.target.value))}
                          placeholder="۱۰.۰۰"
                          className={`w-full h-9 px-3 border font-mono text-center font-bold outline-none focus:border-[#d4af37] ${
                            txPhysAutoSettle 
                              ? 'bg-amber-500/5 text-amber-300 border-amber-500/20 cursor-not-allowed' 
                              : 'bg-zinc-900 text-[#ffd700] border-zinc-800'
                          }`}
                        />
                      </div>
                    </div>

                    {txPhysAutoSettle && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-xl text-center text-[10px] text-emerald-400 font-bold animate-in fade-in duration-200">
                        ✨ عیار و وزن‌ها جهت تسویه کامل حساب طلایی همکار قفل و کالیبره شده‌اند!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Cash / Bank Settlement */}
              {txTab === 'cash' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-3">
                    <span className="text-[11px] font-bold text-emerald-400 block">تسویه حساب ریالی (دریافت یا پرداخت پول)</span>
                    
                    {/* Toggle Direction */}
                    <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => setTxBankDirection('received')}
                        className={`py-1.5 rounded font-black transition-all ${txBankDirection === 'received' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                      >
                        دریافت پول از همکار (بستانکار ریالی)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxBankDirection('paid')}
                        className={`py-1.5 rounded font-black transition-all ${txBankDirection === 'paid' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'}`}
                      >
                        پرداخت پول به همکار (بدهکار ریالی)
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">مبلغ تراکنش به تومان:</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={formatTomanAmount(txRialAmount)}
                        onChange={(e) => setTxRialAmount(parseCleanNumber(e.target.value))}
                        placeholder="مبلغ را وارد کنید..."
                        className="w-full h-10 pl-12 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center font-bold text-sm outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">نام بانک همکار:</label>
                        <input 
                          type="text"
                          value={txBankName}
                          onChange={(e) => setTxBankName(e.target.value)}
                          placeholder="مثال: ملی، ملت و..."
                          className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">شماره کارت مقصد:</label>
                        <input 
                          type="text"
                          value={txBankCardNumber}
                          onChange={(e) => setTxBankCardNumber(e.target.value)}
                          placeholder="۶۰۳۷..."
                          className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Advanced Manual Form */}
              {txTab === 'manual' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-3">
                    <span className="text-[11px] font-bold text-zinc-400 block">ثبت سند دستی طلایی و ریالی به شکل همزمان</span>
                    
                    {/* Parallel Gold Section */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[#ffd700] block">۱. تراکنش طلایی</span>
                      <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded-lg text-[10px]">
                        <button
                          type="button"
                          onClick={() => { setTxGoldType('none'); setTxGoldWeight(0); }}
                          className={`py-1 rounded font-bold transition-all ${txGoldType === 'none' ? 'bg-zinc-850 text-zinc-300' : 'text-zinc-400 hover:text-white'}`}
                        >
                          بدون طلا
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxGoldType('delivered')}
                          className={`py-1 rounded font-bold transition-all ${txGoldType === 'delivered' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                          تحویل طلا (بدهکار)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxGoldType('received')}
                          className={`py-1 rounded font-bold transition-all ${txGoldType === 'received' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                          دریافت طلا (بستانکار)
                        </button>
                      </div>

                      {txGoldType !== 'none' && (
                        <div className="relative animate-in fade-in duration-200">
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={txGoldWeight || ''}
                            onChange={(e) => setTxGoldWeight(parseCleanFloat(e.target.value))}
                            placeholder="وزن طلای مبادله شده (گرم ۱۸)..."
                            className="w-full h-9 pl-10 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center text-sm outline-none focus:border-[#d4af37]"
                          />
                          <span className="absolute left-3 top-2 text-[10px] text-zinc-500 font-mono">گرم</span>
                        </div>
                      )}
                    </div>

                    {/* Parallel Rial Section */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <span className="text-[10px] font-bold text-emerald-400 block">۲. تراکنش ریالی</span>
                      <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-0.5 rounded-lg text-[10px]">
                        <button
                          type="button"
                          onClick={() => { setTxRialType('none'); setTxRialAmount(0); }}
                          className={`py-1 rounded font-bold transition-all ${txRialType === 'none' ? 'bg-zinc-850 text-zinc-300' : 'text-zinc-400 hover:text-white'}`}
                        >
                          بدون ریال
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxRialType('paid')}
                          className={`py-1 rounded font-bold transition-all ${txRialType === 'paid' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                          پرداخت پول (بدهکار)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxRialType('received')}
                          className={`py-1 rounded font-bold transition-all ${txRialType === 'received' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                          دریافت پول (بستانکار)
                        </button>
                      </div>

                      {txRialType !== 'none' && (
                        <div className="relative animate-in fade-in duration-200">
                          <input 
                            type="text"
                            inputMode="numeric"
                            value={formatTomanAmount(txRialAmount)}
                            onChange={(e) => setTxRialAmount(parseCleanNumber(e.target.value))}
                            placeholder="مبلغ واریزی / دریافتی به تومان..."
                            className="w-full h-9 pl-12 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-center text-sm outline-none focus:border-[#d4af37]"
                          />
                          <span className="absolute left-3 top-2 text-[10px] text-zinc-500">تومان</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Description (اختیاری برای همه بخش‌ها) */}
              <div className="pt-2 border-t border-zinc-850">
                <label className="text-[10px] text-zinc-400 block mb-1">شرح تراکنش دلخواه (در صورت تمایل وارد کنید):</label>
                <input 
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxTxDesc(e.target.value)}
                  placeholder="در صورت خالی بودن، شرح پیش‌فرض بازار ثبت خواهد شد"
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-[#d4af37]"
                />
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-3 border-t border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setShowAddTxModal(false)}
                className="flex-1 h-11 rounded-xl bg-[#1d1d22] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold transition-all"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleAddTransaction}
                className="flex-1 h-11 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black shadow-lg shadow-[#d4af37]/25 transition-all"
              >
                ثبت سند در دفتر معین
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DIALOG: DELETE ACCOUNT CONFIRMATION MODAL */}
      {deleteConfirmContact && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#141418] max-w-sm w-full rounded-3xl p-5 border border-zinc-800 shadow-2xl space-y-4 text-xs text-right">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 text-rose-500">
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <h3 className="text-sm font-black text-white">حذف قطعی حساب شخص</h3>
            </div>
            
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              آیا از حذف دائمی حساب شخص <strong className="text-white font-bold">«{deleteConfirmContact.name}»</strong> و تمامی ریزتراکنش‌های ثبت‌شده در دفتر معین او اطمینان کامل دارید؟
              <br />
              <span className="text-rose-400 font-bold block mt-1.5">⚠️ هشدار: این عملیات به صورت مستقیم از سیستم حسابداری معین پاک می‌شود و غیر قابل بازگشت است.</span>
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmContact(null)}
                className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold border border-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => executeDeleteContact(deleteConfirmContact.id, deleteConfirmContact.name)}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-600/10"
              >
                تأیید و حذف نهایی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN OFFICIAL BLACK AND WHITE A5 PRINT COMPONENT: SHOWN ONLY FOR PRINT */}
      {/* ========================================================================= */}
      {isPrinting && activeAccount && (
        <div id="invoice-print-container" className="print-visible text-black bg-white p-6 space-y-4 font-sans text-[10px]" dir="rtl">
          
          {/* Print Letterhead */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3 select-none">
            <div className="flex items-center gap-2">
              {store?.logo && (
                <div className="w-10 h-10 border border-black p-0.5 bg-white shrink-0 flex items-center justify-center">
                  <img src={store.logo} alt={store.name} className="w-full h-full object-contain" />
                </div>
              )}
              <div className="space-y-0.5 text-right font-sans">
                <h2 className="text-sm font-black text-black font-sans">{store?.name || 'گالری طلا زرسا'}</h2>
                <p className="text-[8px] text-zinc-800 font-bold leading-none">مدیریت گالری: {store?.ownerName || 'خلیلی'}</p>
                <p className="text-[7.5px] text-zinc-500">گزارش رسمی و ترازنامه کارت معین همکار</p>
              </div>
            </div>
            <div className="text-left space-y-0.5 text-[8.5px] font-bold font-sans">
              <div>تاریخ صدور: {toPersianDigits(getPersianDate())}</div>
              <div>ساعت صدور: {toPersianDigits(getPersianTime())}</div>
              <div className="font-mono">کد حساب معین: {activeAccount.accountCode}</div>
            </div>
          </div>

          {/* Colleague Information Summary */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-100 p-2.5 rounded-xl border border-zinc-300 font-sans">
            <div className="space-y-1">
              <div><span className="font-bold text-zinc-600">نام همکار / طرف حساب:</span> <span className="font-black text-black">{activeAccount.name}</span></div>
              {activeAccount.shopName && <div><span className="font-bold text-zinc-600">گالری / فروشگاه:</span> <span className="font-black text-black">{activeAccount.shopName}</span></div>}
            </div>
            <div className="space-y-1">
              <div><span className="font-bold text-zinc-600">شماره تماس همراه:</span> <span className="font-mono text-black font-bold">{toPersianDigits(activeAccount.phone) || 'ثبت نشده'}</span></div>
              <div><span className="font-bold text-zinc-600">تاریخ افتتاح پرونده:</span> <span className="font-sans text-black">{toPersianDigits(activeAccount.createdAt)}</span></div>
            </div>
          </div>

          {/* Ledger Table Section */}
          <div className="space-y-1 font-sans">
            <h3 className="text-[10px] font-black text-black border-b border-black pb-1 select-none font-sans print-header-titr">📋 گردش حساب و اسناد ثبت شده طلا و ریال</h3>
            <table className="w-full text-[8px] text-right border-collapse border border-black font-sans leading-relaxed">
              <thead>
                <tr className="bg-zinc-100 border-b border-black text-black font-black font-display print-header-titr">
                  <th className="p-1.5 border-l border-black text-center w-[60px] print-header-titr">تاریخ</th>
                  <th className="p-1.5 border-l border-black text-right print-header-titr min-w-[120px]">شرح سند</th>
                  <th className="p-1 border-l border-black text-center print-header-titr bg-zinc-50 w-[70px]">بدهکار (طلا)</th>
                  <th className="p-1 border-l border-black text-center print-header-titr bg-zinc-50 w-[80px]">بدهکار (ریال)</th>
                  <th className="p-1 border-l border-black text-center print-header-titr bg-zinc-100 w-[70px]">بستانکار (طلا)</th>
                  <th className="p-1 border-l border-black text-center print-header-titr bg-zinc-100 w-[80px]">بستانکار (ریال)</th>
                  <th className="p-1 border-l border-black text-center print-header-titr bg-zinc-50 w-[80px]">مانده طلا</th>
                  <th className="p-1 text-center print-header-titr bg-zinc-50 w-[90px]">مانده ریال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-black font-sans">
                {/* Initial Balance */}
                <tr className="bg-white font-sans text-[8px]">
                  <td className="p-1 border-l border-black text-center font-mono text-zinc-600">افتتاح</td>
                  <td className="p-1 border-l border-black font-bold text-black">تراز اولیه زمان افتتاح پرونده معین</td>
                  
                  {/* بدهکار طلایی */}
                  <td className="p-1 border-l border-black text-center font-mono">
                    {activeAccount.initialGoldStatus === 'debtor' ? `${activeAccount.initialGoldBalance.toLocaleString('fa-IR')} گرم` : '۰'}
                  </td>
                  {/* بدهکار ریالی */}
                  <td className="p-1 border-l border-black text-center font-mono">
                    {activeAccount.initialRialStatus === 'debtor' ? `${activeAccount.initialRialBalance.toLocaleString('fa-IR')} ت` : '۰'}
                  </td>
                  
                  {/* بستانکار طلایی */}
                  <td className="p-1 border-l border-black text-center font-mono">
                    {activeAccount.initialGoldStatus === 'creditor' ? `${activeAccount.initialGoldBalance.toLocaleString('fa-IR')} گرم` : '۰'}
                  </td>
                  {/* بستانکار ریالی */}
                  <td className="p-1 border-l border-black text-center font-mono">
                    {activeAccount.initialRialStatus === 'creditor' ? `${activeAccount.initialRialBalance.toLocaleString('fa-IR')} ت` : '۰'}
                  </td>
                  
                  {/* مانده طلا */}
                  <td className="p-1 border-l border-black text-center font-sans font-black bg-zinc-50">
                    {activeAccount.initialGoldBalance === 0 ? '۰' : `${activeAccount.initialGoldBalance.toLocaleString('fa-IR')} گرم`}
                    {activeAccount.initialGoldBalance > 0 && (activeAccount.initialGoldStatus === 'creditor' ? ' (بس)' : ' (بد)')}
                  </td>
                  {/* مانده ریال */}
                  <td className="p-1 text-center font-sans font-black bg-zinc-50">
                    {activeAccount.initialRialBalance === 0 ? '۰' : `${activeAccount.initialRialBalance.toLocaleString('fa-IR')} ت`}
                    {activeAccount.initialRialBalance > 0 && (activeAccount.initialRialStatus === 'creditor' ? ' (بس)' : ' (بد)')}
                  </td>
                </tr>
                {/* Dynamic Transactions */}
                {activeAccount.transactions.map((tx) => (
                  <tr key={tx.id} className="bg-white font-sans text-[8px]">
                    {/* تاریخ */}
                    <td className="p-1 border-l border-black text-center font-mono text-zinc-600">
                      <span className="block font-bold">{tx.dateFa}</span>
                      <span className="block text-[7px] text-zinc-500">{tx.timeFa}</span>
                    </td>
                    
                    {/* شرح */}
                    <td className="p-1 border-l border-black">
                      <span className="font-bold text-black block leading-relaxed">{tx.description}</span>
                      
                      {tx.physicalGold && (
                        <div className="mt-0.5 text-[7px] text-zinc-700 font-bold bg-zinc-50 p-1 border border-zinc-300">
                          {tx.physicalGold.engCode && <span>کد انگ: {tx.physicalGold.engCode} · </span>}
                          {tx.physicalGold.labName && <span>آزمایشگاه: {tx.physicalGold.labName} · </span>}
                          {tx.physicalGold.carat && <span>عیار: {tx.physicalGold.carat} · </span>}
                          {tx.physicalGold.rawWeight !== undefined && tx.physicalGold.rawWeight > 0 && <span>وزن خام: {tx.physicalGold.rawWeight.toLocaleString('fa-IR')} گرم · </span>}
                          {tx.physicalGold.standardWeight750 !== undefined && tx.physicalGold.standardWeight750 > 0 && <span className="font-black">وزن ۱۸: {tx.physicalGold.standardWeight750.toLocaleString('fa-IR')} گرم</span>}
                        </div>
                      )}

                      {tx.bankInfo && (
                        <div className="mt-0.5 text-[7px] text-zinc-700 font-bold bg-zinc-50 p-1 border border-zinc-300">
                          {tx.bankInfo.bankName && <span>بانک همکار: {tx.bankInfo.bankName} · </span>}
                          {tx.bankInfo.cardNumber && <span className="font-mono">کارت/حساب همکار: {tx.bankInfo.cardNumber}</span>}
                        </div>
                      )}
                    </td>
                    
                    {/* بدهکار طلا */}
                    <td className="p-1 border-l border-black text-center font-mono">{tx.goldDebtor > 0 ? `${tx.goldDebtor.toLocaleString('fa-IR')} گرم` : '-'}</td>
                    {/* بدهکار ریال */}
                    <td className="p-1 border-l border-black text-center font-mono">{tx.rialDebtor > 0 ? `${tx.rialDebtor.toLocaleString('fa-IR')} ت` : '-'}</td>
                    
                    {/* بستانکار طلا */}
                    <td className="p-1 border-l border-black text-center font-mono">{tx.goldCreditor > 0 ? `${tx.goldCreditor.toLocaleString('fa-IR')} گرم` : '-'}</td>
                    {/* بستانکار ریال */}
                    <td className="p-1 border-l border-black text-center font-mono">{tx.rialCreditor > 0 ? `${tx.rialCreditor.toLocaleString('fa-IR')} ت` : '-'}</td>
                    
                    {/* تراز طلا */}
                    <td className="p-1 border-l border-black text-center font-sans font-black bg-zinc-50">
                      {tx.goldBalance === 0 ? '۰' : `${Math.abs(tx.goldBalance).toLocaleString('fa-IR')} گرم`}
                      {tx.goldBalance > 0 ? ' (بس)' : tx.goldBalance < 0 ? ' (بد)' : ''}
                    </td>
                    {/* تراز ریال */}
                    <td className="p-1 text-center font-sans font-black bg-zinc-50">
                      {tx.rialBalance === 0 ? '۰' : `${Math.abs(tx.rialBalance).toLocaleString('fa-IR')} ت`}
                      {tx.rialBalance > 0 ? ' (بس)' : tx.rialBalance < 0 ? ' (بد)' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final Running Balances Callouts */}
          <div className="grid grid-cols-2 gap-3 text-center border-t border-black pt-3 font-sans">
            <div className="border border-black p-2 rounded bg-zinc-50 font-sans">
              <span className="font-bold text-zinc-700 block text-[8px] font-sans">تراز نهایی طلایی همکار:</span>
              <span className="font-black text-xs font-mono block mt-0.5 text-black">
                {Math.abs(activeAccount.currentGoldBalance).toLocaleString('fa-IR')} گرم
              </span>
              <span className="font-bold text-[8.5px] text-zinc-900 mt-0.5 block">
                {activeAccount.currentGoldStatus === 'creditor' ? '🟡 طلبکار (بستانکار طلا)' : activeAccount.currentGoldStatus === 'debtor' ? '🔴 بدهکار (بدهکار طلا)' : '⚪ بی‌حساب (صفر)'}
              </span>
            </div>
            <div className="border border-black p-2 rounded bg-zinc-50 font-sans">
              <span className="font-bold text-zinc-700 block text-[8px] font-sans">تراز نهایی ریالی همکار:</span>
              <span className="font-black text-xs font-mono block mt-0.5 text-black">
                {formatTomanAmount(Math.abs(activeAccount.currentRialBalance))}
              </span>
              <span className="font-bold text-[8.5px] text-zinc-900 mt-0.5 block">
                {activeAccount.currentRialStatus === 'creditor' ? '🟢 طلبکار (بستانکار ریال)' : activeAccount.currentRialStatus === 'debtor' ? '🔴 بدهکار (بدهکار ریال)' : '⚪ بی‌حساب (صفر)'}
              </span>
            </div>
          </div>

          {/* Verification Box & Signatures */}
          <div className="grid grid-cols-2 gap-8 text-center pt-8 select-none font-sans">
            <div className="space-y-8 font-sans">
              <span className="font-bold text-zinc-700 border-b border-black pb-1.5 px-4 block w-fit mx-auto text-[9px] font-sans">امضا و اثر انگشت همکار ({activeAccount.name})</span>
              <div className="h-12" />
            </div>
            <div className="space-y-8 font-sans">
              <span className="font-bold text-zinc-700 border-b border-black pb-1.5 px-4 block w-fit mx-auto text-[9px] font-sans">مهر و امضای گالری ({store?.name || 'زرسا طلا'})</span>
              {store?.stamp ? (
                <div className="h-12 relative flex items-center justify-center">
                  <img src={store.stamp} alt="مهر رسمی" className="max-h-12 object-contain opacity-85" />
                </div>
              ) : (
                <div className="h-12" />
              )}
            </div>
          </div>

          {/* Footer print note */}
          <div className="text-[7.5px] text-zinc-400 text-center border-t border-dotted border-zinc-400 pt-1.5 select-none font-sans">
            سامانه اتوماسیون حسابداری گالری زرسا طلا · طراحی و چاپ سیاه و سفید فاکتور معین رسمی A5
          </div>
        </div>
      )}

    </div>
  );
}
