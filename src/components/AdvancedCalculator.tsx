import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Scale, 
  Percent, 
  Coins, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  Sliders, 
  HelpCircle, 
  Info, 
  Wallet,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { StoreSettings } from '../types';
import { applyRounding, getRoundingDescription } from '../utils/rounding';
import { toPersianDigits, formatTomanAmount, parseCleanNumber, parseCleanFloat } from '../utils/numberFormat';

interface AdvancedCalculatorProps {
  goldPrice: number;
  setGoldPrice: (price: number) => void;
  store: StoreSettings;
  taxEnabledGlobal: boolean;
  showNotification: (message: string, type?: 'success' | 'amber' | 'error') => void;
  onOpenRegularCalculator?: () => void;
}

type AdvancedTab = 'budget' | 'find-rate' | 'find-weight' | 'find-fee' | 'swap';

export const AdvancedCalculator: React.FC<AdvancedCalculatorProps> = ({
  goldPrice,
  setGoldPrice,
  store,
  taxEnabledGlobal,
  showNotification,
  onOpenRegularCalculator
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdvancedTab>('budget');
  const [copied, setCopied] = useState<boolean>(false);

  // =========================================================================
  // 5. FEATURE 5: GOLD SWAP & BARTER / تعویض و تهاتر طلا STATE
  // =========================================================================
  const [sGoldRate, setSGoldRate] = useState<number>(goldPrice || 3500000);
  
  // Used gold state
  const [sUsedWeight, setSUsedWeight] = useState<number>(10);
  const [sUsedCarat, setSUsedCarat] = useState<number>(750); // standard 18k (750)
  const [sUsedPriceOption, setSUsedPriceOption] = useState<'standard' | 'custom' | 'discount'>('standard');
  const [sUsedCustomPrice, setSUsedCustomPrice] = useState<number>(3400000);
  const [sUsedDiscount, setSUsedDiscount] = useState<number>(50000); // 50,000 Toman discount under standard price

  // New gold state
  const [sNewWeight, setSNewWeight] = useState<number>(10);
  const [sNewCarat, setSNewCarat] = useState<number>(750);
  const [sNewFeeType, setSNewFeeType] = useState<'percent' | 'toman'>('percent');
  const [sNewFeePercent, setSNewFeePercent] = useState<number>(12);
  const [sNewFeeToman, setSNewFeeToman] = useState<number>(350000);
  const [sNewProfitPercent, setSNewProfitPercent] = useState<number>(7);
  const [sNewTaxActive, setSNewTaxActive] = useState<boolean>(taxEnabledGlobal);

  // Synchronize gold rate with master goldPrice if changed
  useEffect(() => {
    if (goldPrice > 0 && Math.abs(sGoldRate - goldPrice) > 100000) {
      setSGoldRate(goldPrice);
    }
  }, [goldPrice]);

  const computeSwapResult = () => {
    const rate = sGoldRate || 1;

    // 1. Used Gold (Customer Gold) Calculation
    const standardUsedPricePerGram = rate * (sUsedCarat / 750);
    let usedPricePerGram = standardUsedPricePerGram;

    if (sUsedPriceOption === 'custom') {
      usedPricePerGram = sUsedCustomPrice;
    } else if (sUsedPriceOption === 'discount') {
      usedPricePerGram = Math.max(0, standardUsedPricePerGram - sUsedDiscount);
    }

    const totalUsedValue = Math.round(sUsedWeight * usedPricePerGram);

    // 2. New Gold Calculation
    const standardNewPricePerGram = rate * (sNewCarat / 750);
    const rawNewTotal = sNewWeight * standardNewPricePerGram;

    let wageAmount = 0;
    if (sNewFeeType === 'percent') {
      wageAmount = rawNewTotal * ((sNewFeePercent || 0) / 100);
    } else {
      wageAmount = sNewWeight * (sNewFeeToman || 0);
    }

    const profitAmount = (rawNewTotal + wageAmount) * ((sNewProfitPercent || 0) / 100);
    const taxRate = sNewTaxActive ? 0.09 : 0;
    const taxAmount = (wageAmount + profitAmount) * taxRate;

    const totalNewCost = Math.round(rawNewTotal + wageAmount + profitAmount + taxAmount);

    // 3. Swap difference
    const balance = totalNewCost - totalUsedValue;

    // 4. Equivalent weight (how many grams of new gold can be swapped 1-to-1 without paying any extra)
    const costPerGramOfNew = sNewWeight > 0 ? totalNewCost / sNewWeight : 0;
    const equivalentWeight = costPerGramOfNew > 0 ? Number((totalUsedValue / costPerGramOfNew).toFixed(3)) : 0;

    return {
      usedPricePerGram: Math.round(usedPricePerGram),
      totalUsedValue,
      rawNewTotal: Math.round(rawNewTotal),
      wageAmount: Math.round(wageAmount),
      profitAmount: Math.round(profitAmount),
      taxAmount: Math.round(taxAmount),
      totalNewCost,
      balance,
      costPerGramOfNew: Math.round(costPerGramOfNew),
      equivalentWeight
    };
  };

  const swapResult = computeSwapResult();

  // Helper number parser & formatter
  const parseNumber = (val: string): number => {
    const cleaned = val.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const parseFloatNumber = (val: string): number => {
    // Convert Persian numbers to English
    const en = val.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).replace(/,/g, '');
    const num = parseFloat(en);
    return isNaN(num) ? 0 : num;
  };

  const formatToman = (val: number): string => {
    return (val || 0).toLocaleString('fa-IR');
  };

  // =========================================================================
  // 1. FEATURE 1: BUDGET / "با این بودجه چی می‌تونم بخرم؟"
  // =========================================================================
  const [bBudget, setBBudget] = useState<number>(500000000); // 500 million Toman
  const [bGoldRate, setBGoldRate] = useState<number>(goldPrice || 3500000);
  const [bFeePercent, setBFeePercent] = useState<number>(12); // Average fee %
  const [bProfitPercent, setBProfitPercent] = useState<number>(7); // Standard 7% profit
  const [bTaxActive, setBTaxActive] = useState<boolean>(taxEnabledGlobal);

  // Synchronize gold rate with master goldPrice if changed
  useEffect(() => {
    if (goldPrice > 0 && Math.abs(bGoldRate - goldPrice) > 100000) {
      setBGoldRate(goldPrice);
    }
  }, [goldPrice]);

  // Compute budget output
  const computeBudgetResult = () => {
    const rate = bGoldRate || 1;
    const feePct = (bFeePercent || 0) / 100;
    const profitPct = (bProfitPercent || 0) / 100;
    const taxRate = bTaxActive ? 0.09 : 0;

    // For 1 gram:
    // Raw = rate
    // Fee = rate * feePct
    // Profit = (rate + Fee) * profitPct = rate * (1 + feePct) * profitPct
    // Tax = (Fee + Profit) * taxRate
    // CostPerGram = Raw + Fee + Profit + Tax
    const rawPerGram = rate;
    const feePerGram = rate * feePct;
    const profitPerGram = (rawPerGram + feePerGram) * profitPct;
    const taxPerGram = (feePerGram + profitPerGram) * taxRate;
    const totalCostPerGram = rawPerGram + feePerGram + profitPerGram + taxPerGram;

    if (totalCostPerGram <= 0) return { weight: 0, rawTotal: 0, feeTotal: 0, profitTotal: 0, taxTotal: 0 };

    const targetWeight = Number((bBudget / totalCostPerGram).toFixed(3));
    const rawTotal = Math.round(targetWeight * rawPerGram);
    const feeTotal = Math.round(targetWeight * feePerGram);
    const profitTotal = Math.round(targetWeight * profitPerGram);
    const taxTotal = Math.round(targetWeight * taxPerGram);

    return {
      weight: targetWeight,
      rawTotal,
      feeTotal,
      profitTotal,
      taxTotal,
      costPerGram: Math.round(totalCostPerGram)
    };
  };

  const budgetResult = computeBudgetResult();

  // =========================================================================
  // 2. FEATURE 2: FIND GOLD RATE / معکوس نرخ
  // =========================================================================
  const [rTotalAmount, setRTotalAmount] = useState<number>(18500000);
  const [rWeight, setRWeight] = useState<number>(3.5);
  const [rFeePercent, setRFeePercent] = useState<number>(14);
  const [rProfitPercent, setRProfitPercent] = useState<number>(7);
  const [rTaxActive, setRTaxActive] = useState<boolean>(taxEnabledGlobal);

  const computeFindRateResult = () => {
    const total = rTotalAmount || 0;
    const weight = rWeight || 0;
    if (total <= 0 || weight <= 0) return { rate: 0, mazaneh: 0, diffWithLive: 0 };

    const feePct = (rFeePercent || 0) / 100;
    const profitPct = (rProfitPercent || 0) / 100;
    const taxRate = rTaxActive ? 0.09 : 0;

    // Total = Weight * Rate * Multiplier
    // Multiplier = 1 + feePct + (1 + feePct) * profitPct + [feePct + (1 + feePct) * profitPct] * taxRate
    const feeTerm = feePct;
    const profitTerm = (1 + feePct) * profitPct;
    const taxTerm = (feeTerm + profitTerm) * taxRate;
    const multiplier = 1 + feeTerm + profitTerm + taxTerm;

    const rate = Math.round(total / (weight * multiplier));
    const mazaneh = Math.round(rate * 4.3318);
    const diffWithLive = rate - (goldPrice || 0);

    return { rate, mazaneh, diffWithLive, multiplier };
  };

  const findRateResult = computeFindRateResult();

  // =========================================================================
  // 3. FEATURE 3: FIND WEIGHT / معکوس وزن
  // =========================================================================
  const [wTotalAmount, setWTotalAmount] = useState<number>(25000000);
  const [wGoldRate, setWGoldRate] = useState<number>(goldPrice || 3500000);
  const [wFeePercent, setWFeePercent] = useState<number>(10);
  const [wProfitPercent, setWProfitPercent] = useState<number>(7);
  const [wTaxActive, setWTaxActive] = useState<boolean>(taxEnabledGlobal);

  const computeFindWeightResult = () => {
    const total = wTotalAmount || 0;
    const rate = wGoldRate || 1;
    if (total <= 0 || rate <= 0) return { weight: 0, soot: 0, mesghal: 0, rawGold: 0, fee: 0, profit: 0, tax: 0 };

    const feePct = (wFeePercent || 0) / 100;
    const profitPct = (wProfitPercent || 0) / 100;
    const taxRate = wTaxActive ? 0.09 : 0;

    const feeTerm = feePct;
    const profitTerm = (1 + feePct) * profitPct;
    const taxTerm = (feeTerm + profitTerm) * taxRate;
    const multiplier = 1 + feeTerm + profitTerm + taxTerm;
    const costPerGram = rate * multiplier;

    const weight = Number((total / costPerGram).toFixed(3));
    const soot = Math.round(weight * 1000);
    const mesghal = Number((weight / 4.6083).toFixed(3));

    const rawGold = Math.round(weight * rate);
    const fee = Math.round(rawGold * feePct);
    const profit = Math.round((rawGold + fee) * profitPct);
    const tax = Math.round((fee + profit) * taxRate);

    return {
      weight,
      soot,
      mesghal,
      costPerGram: Math.round(costPerGram),
      rawGold,
      fee,
      profit,
      tax
    };
  };

  const findWeightResult = computeFindWeightResult();

  // =========================================================================
  // 4. FEATURE 4: FIND FEE & PROFIT / پیدا کردن سود و اجرت
  // =========================================================================
  const [fTotalAmount, setFTotalAmount] = useState<number>(31500000);
  const [fWeight, setFWeight] = useState<number>(6.5);
  const [fGoldRate, setFGoldRate] = useState<number>(goldPrice || 3500000);
  const [fTaxActive, setFTaxActive] = useState<boolean>(taxEnabledGlobal);

  const computeFindFeeResult = () => {
    const total = fTotalAmount || 0;
    const weight = fWeight || 0;
    const rate = fGoldRate || 0;
    const rawGold = Math.round(weight * rate);

    if (total <= 0 || weight <= 0 || rate <= 0) {
      return { rawGold: 0, diff: 0, totalMarkup: 0, feeAmount: 0, feePercent: 0, profitAmount: 0, profitPercent: 7, taxAmount: 0, totalMarkupPercent: 0 };
    }

    const diff = total - rawGold;
    const taxRate = fTaxActive ? 0.09 : 0;

    // diff = (Fee + Profit) * (1 + taxRate)
    const totalMarkup = Math.round(diff / (1 + taxRate));
    const taxAmount = diff - totalMarkup;

    // Standard union profit: 7% on (raw + fee)
    // totalMarkup = Fee + (raw + Fee) * 0.07 = Fee * 1.07 + raw * 0.07
    // Fee * 1.07 = totalMarkup - raw * 0.07
    const profitStatutoryRate = 0.07;
    const feeExact = (totalMarkup - rawGold * profitStatutoryRate) / (1 + profitStatutoryRate);

    let feeAmount = Math.max(0, Math.round(feeExact));
    let profitAmount = Math.max(0, totalMarkup - feeAmount);
    let feePercent = rawGold > 0 ? Number(((feeAmount / rawGold) * 100).toFixed(2)) : 0;
    let totalMarkupPercent = rawGold > 0 ? Number(((totalMarkup / rawGold) * 100).toFixed(2)) : 0;

    return {
      rawGold,
      diff,
      totalMarkup,
      feeAmount,
      feePercent,
      profitAmount,
      profitPercent: 7,
      taxAmount: Math.max(0, taxAmount),
      totalMarkupPercent
    };
  };

  const findFeeResult = computeFindFeeResult();

  // Handle Copy to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showNotification('نتیجه محاسبه با موفقیت کپی شد', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-44 h-44 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700] shadow-md shadow-[#d4af37]/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>ماشین‌حساب پیشرفته زرسا</span>
                <span className="text-[10px] bg-[#d4af37] text-black font-black px-2 py-0.5 rounded-full">ویژه طلافروشان</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                محاسبه بودجه مشتری، پیدا کردن نرخ، استخراج وزن و کشف سود و اجرت فاکتور
              </p>
            </div>
          </div>

          {/* Gold rate badge */}
          <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
            <span className="text-zinc-500 text-[10px]">نرخ روز طلا:</span>
            <span className="font-mono font-black text-[#ffd700]">{goldPrice.toLocaleString('fa-IR')}</span>
            <span className="text-[10px] text-zinc-500">تومان</span>
          </div>
        </div>
      </div>

      {/* SUB-TABS SELECTOR (5 MAIN CAPABILITIES) */}
      <div className="grid grid-cols-2 min-[640px]:grid-cols-3 lg:grid-cols-5 gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setActiveSubTab('budget')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'budget'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span>بودجه مشتری</span>
        </button>

        <button
          onClick={() => setActiveSubTab('find-rate')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'find-rate'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>پیدا کردن نرخ</span>
        </button>

        <button
          onClick={() => setActiveSubTab('find-weight')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'find-weight'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Scale className="w-4 h-4 shrink-0" />
          <span>پیدا کردن وزن</span>
        </button>

        <button
          onClick={() => setActiveSubTab('find-fee')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'find-fee'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Percent className="w-4 h-4 shrink-0" />
          <span>پیدا کردن اجرت و سود</span>
        </button>

        <button
          onClick={() => setActiveSubTab('swap')}
          className={`col-span-2 min-[640px]:col-span-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'swap'
              ? 'bg-[#d4af37] text-black font-black shadow-lg shadow-[#d4af37]/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <RefreshCw className="w-4 h-4 shrink-0" />
          <span>تعویض و تهاتر طلا</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: BUDGET RECOMMENDER ("با این بودجه چی می‌تونم بخرم؟") */}
      {/* ========================================================================= */}
      {activeSubTab === 'budget' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#ffd700]" />
                <h3 className="text-sm font-black text-white">مشخصات بودجه خرید مشتری</h3>
              </div>
              <span className="text-[11px] text-zinc-400">پیشنهاد وزن مناسب در ویترین</span>
            </div>

            {/* Budget Input with quick presets */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-zinc-300">مبلغ کل بودجه مشتری (تومان)</label>
                <span className="font-mono text-xs text-[#ffd700] font-bold">
                  {formatToman(bBudget)} تومان
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatToman(bBudget)}
                  onChange={(e) => setBBudget(parseNumber(e.target.value))}
                  placeholder="مثال: ۵۰۰,۰۰۰,۰۰۰"
                  className="w-full h-13 px-4 bg-zinc-950 border border-zinc-700/80 rounded-2xl text-xl sm:text-2xl font-black text-[#ffd700] font-mono focus:border-[#d4af37] outline-none"
                />
                <span className="absolute left-4 top-3.5 text-xs text-zinc-400">تومان</span>
              </div>

              {/* Quick Budget Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-[11px]">
                <span className="text-zinc-500 shrink-0">بودجه سریع:</span>
                {[20000000, 50000000, 100000000, 200000000, 500000000, 1000000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBBudget(amt)}
                    className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition-all cursor-pointer ${
                      bBudget === amt
                        ? 'bg-[#d4af37] text-black font-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {amt >= 1000000000
                      ? `${(amt / 1000000000).toLocaleString('fa-IR')} میلیارد`
                      : `${(amt / 1000000).toLocaleString('fa-IR')} میلیون`}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid: Gold Rate, Wage %, Profit %, Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              {/* Gold Rate */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">نرخ طلای ۱۸ عیار (تومان)</span>
                  <button
                    type="button"
                    onClick={() => setBGoldRate(goldPrice)}
                    className="text-[10px] text-[#d4af37] hover:underline"
                  >
                    بروزرسانی به تابلو
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatToman(bGoldRate)}
                    onChange={(e) => setBGoldRate(parseNumber(e.target.value))}
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-[11px] text-zinc-400">تومان</span>
                </div>
              </div>

              {/* Wage / Fee % */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">میانگین اجرت ساخت</span>
                  <span className="font-mono text-[#ffd700] font-bold">{bFeePercent}٪</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.5"
                    value={bFeePercent || ''}
                    onChange={(e) => setBFeePercent(parseFloatNumber(e.target.value))}
                    className="w-20 h-11 px-2 text-center bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <div className="flex-1 flex gap-1 overflow-x-auto">
                    {[10, 12, 15, 18, 20].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setBFeePercent(f)}
                        className={`flex-1 py-2 px-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                          bFeePercent === f
                            ? 'bg-[#d4af37] text-black font-black'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {f}٪
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profit % */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">سود طلافروشی (پیش‌فرض ۷٪)</span>
                  <span className="font-mono text-zinc-300 font-bold">{bProfitPercent}٪</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={bProfitPercent || ''}
                    onChange={(e) => setBProfitPercent(parseFloatNumber(e.target.value))}
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setBProfitPercent(7)}
                    className="px-3 h-11 bg-zinc-800 text-zinc-300 text-xs rounded-xl font-bold shrink-0 hover:bg-zinc-700"
                  >
                    ۷٪ قانونی
                  </button>
                </div>
              </div>

              {/* VAT Tax Toggle */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">مالیات ارزش‌افزوده</span>
                  <span className="text-[10px] text-zinc-400">۹٪ بر روی اجرت و سود</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBTaxActive(!bTaxActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    bTaxActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {bTaxActive ? 'فعال (۹٪)' : 'معاف / خاموش'}
                </button>
              </div>

            </div>

          </div>

          {/* RESULT CARD FOR BUDGET */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#ffd700]" />
                <span>نتیجه محاسبات هوشمند بودجه</span>
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                نرخ تمام‌شده هر گرم: {formatToman(budgetResult.costPerGram)} ت
              </span>
            </div>

            {/* HERO WEIGHT CALLOUT (AS REQUESTED BY USER) */}
            <div className="bg-[#d4af37]/10 p-4 rounded-2xl border border-[#d4af37]/30 text-center space-y-1.5">
              <span className="text-xs font-bold text-amber-200">وزن طلای قابل خرید با این بودجه:</span>
              <div className="text-3xl sm:text-4xl font-black text-[#ffd700] font-mono tracking-tight">
                {budgetResult.weight.toLocaleString('fa-IR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}{' '}
                <span className="text-lg font-bold text-white">گرم</span>
              </div>
              <div className="text-xs text-zinc-300 pt-1 border-t border-[#d4af37]/20 flex items-center justify-center gap-1 leading-relaxed">
                <span>💡</span>
                <strong className="text-amber-100">
                  داخل مغازه دنبال اجناسی با وزن حدود {budgetResult.weight.toLocaleString('fa-IR', { maximumFractionDigits: 2 })} گرم (بازه {(budgetResult.weight * 0.95).toFixed(2).replace('.', '/')} تا {(budgetResult.weight * 1.05).toFixed(2).replace('.', '/')} گرم) باشید.
                </strong>
              </div>
            </div>

            {/* Financial Item Breakdown Table */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-zinc-300">
                <span>ارزش طلای خام ({budgetResult.weight} گرم):</span>
                <span className="font-mono font-bold text-white">{formatToman(budgetResult.rawTotal)} تومان</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-zinc-300">
                <span>مبلغ اجرت ساخت ({bFeePercent}٪):</span>
                <span className="font-mono font-bold text-amber-300">{formatToman(budgetResult.feeTotal)} تومان</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-800 text-zinc-300">
                <span>سود فروشگاه ({bProfitPercent}٪):</span>
                <span className="font-mono font-bold text-zinc-200">{formatToman(budgetResult.profitTotal)} تومان</span>
              </div>

              {bTaxActive && (
                <div className="flex justify-between py-1.5 border-b border-zinc-800 text-zinc-300">
                  <span>مالیات ارزش‌افزوده (۹٪ اجرت و سود):</span>
                  <span className="font-mono font-bold text-zinc-300">{formatToman(budgetResult.taxTotal)} تومان</span>
                </div>
              )}

              <div className="flex justify-between py-2 text-sm font-black text-[#ffd700] pt-2">
                <span>جمع کل پرداختی (معادل بودجه):</span>
                <span className="font-mono">{formatToman(bBudget)} تومان</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const summaryText = `گالری طلا ${store.name}\n` +
                    `پیشنهاد خرید بر اساس بودجه:\n` +
                    `💰 بودجه: ${formatToman(bBudget)} تومان\n` +
                    `⚖️ وزن پیشنهادی طلا: ${budgetResult.weight} گرم\n` +
                    `📊 میانگین اجرت: ${bFeePercent}٪ | سود: ${bProfitPercent}٪\n` +
                    `💡 راهنمایی: انتخاب اجناس با وزن حدود ${budgetResult.weight} گرم در مغازه`;
                  handleCopyText(summaryText);
                }}
                className="flex-1 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
                <span>کپی خلاصه پیشنهاد</span>
              </button>

              {onOpenRegularCalculator && (
                <button
                  type="button"
                  onClick={onOpenRegularCalculator}
                  className="px-4 h-11 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>انتقال به فاکتور فروش</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: FIND GOLD RATE (معکوس نرخ) */}
      {/* ========================================================================= */}
      {activeSubTab === 'find-rate' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ffd700]" />
                <h3 className="text-sm font-black text-white">پیدا کردن نرخ طلا (محاسبه معکوس)</h3>
              </div>
              <span className="text-[11px] text-zinc-400">کشف نرخ پایه فاکتور</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Total Final Price */}
              <div className="sm:col-span-2 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-zinc-300">مبلغ نهایی فاکتور (تومان)</label>
                  <span className="font-mono text-[#ffd700] font-bold">{formatToman(rTotalAmount)} تومان</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatToman(rTotalAmount)}
                  onChange={(e) => setRTotalAmount(parseNumber(e.target.value))}
                  placeholder="مبلغ نهایی..."
                  className="w-full h-12 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-lg font-black text-[#ffd700] font-mono focus:border-[#d4af37] outline-none"
                />
              </div>

              {/* Weight */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">وزن دقیق طلا (گرم)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    value={rWeight || ''}
                    onChange={(e) => setRWeight(parseFloatNumber(e.target.value))}
                    placeholder="مثال: ۳.۵"
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-[11px] text-zinc-400">گرم</span>
                </div>
              </div>

              {/* Wage % */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-zinc-300">درصد اجرت ساخت</label>
                  <span className="font-mono text-zinc-400">{rFeePercent}٪</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={rFeePercent || ''}
                    onChange={(e) => setRFeePercent(parseFloatNumber(e.target.value))}
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-[11px] text-zinc-400">درصد</span>
                </div>
              </div>

              {/* Profit % */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">درصد سود طلافروش</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={rProfitPercent || ''}
                    onChange={(e) => setRProfitPercent(parseFloatNumber(e.target.value))}
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-[11px] text-zinc-400">درصد</span>
                </div>
              </div>

              {/* Tax Switch */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">مالیات بر ارزش‌افزوده</span>
                  <span className="text-[10px] text-zinc-400">آیا در فاکتور لحاظ شده؟</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRTaxActive(!rTaxActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rTaxActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {rTaxActive ? 'محاسبه شده (۹٪)' : 'بدون مالیات'}
                </button>
              </div>

            </div>

          </div>

          {/* RESULT CARD FOR FIND RATE */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#ffd700]" />
                <span>نرخ محاسبه‌شده طلای این فاکتور</span>
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                عیار ۷۵۰ (۱۸ عیار)
              </span>
            </div>

            <div className="bg-[#d4af37]/10 p-4 rounded-2xl border border-[#d4af37]/30 text-center space-y-1">
              <span className="text-xs font-bold text-amber-200">نرخ هر گرم طلای ۱۸ عیار:</span>
              <div className="text-3xl sm:text-4xl font-black text-[#ffd700] font-mono tracking-tight">
                {formatToman(findRateResult.rate)}{' '}
                <span className="text-base font-bold text-white">تومان</span>
              </div>
              <div className="text-xs text-zinc-300 pt-1 font-mono">
                معادل مظنه مثقال طلا: {formatToman(findRateResult.mazaneh)} تومان
              </div>
            </div>

            {/* Comparison with today's store live rate */}
            <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-xs">
              <span className="text-zinc-400">مقایسه با تابلوی روز مغازه:</span>
              <span className={`font-mono font-bold ${
                findRateResult.diffWithLive > 0 
                  ? 'text-emerald-400' 
                  : findRateResult.diffWithLive < 0 
                  ? 'text-amber-400' 
                  : 'text-zinc-300'
              }`}>
                {findRateResult.diffWithLive > 0 ? '+' : ''}
                {formatToman(findRateResult.diffWithLive)} تومان{' '}
                {findRateResult.diffWithLive > 0 ? '(بالاتر از تابلو)' : findRateResult.diffWithLive < 0 ? '(پایین‌تر از تابلو)' : '(دقیقاً برابر تابلو)'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (findRateResult.rate > 0) {
                    setGoldPrice(findRateResult.rate);
                    showNotification(`نرخ تابلوی برنامه به ${formatToman(findRateResult.rate)} تومان تغییر یافت`, 'success');
                  }
                }}
                className="flex-1 h-11 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>تنظیم این نرخ به عنوان تابلوی روز مغازه</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: FIND WEIGHT (معکوس وزن) */}
      {/* ========================================================================= */}
      {activeSubTab === 'find-weight' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#ffd700]" />
                <h3 className="text-sm font-black text-white">پیدا کردن وزن طلا (محاسبه معکوس وزن)</h3>
              </div>
              <span className="text-[11px] text-zinc-400">استخراج دقیق وزن به گرم و سوت</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Total Final Price */}
              <div className="sm:col-span-2 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-zinc-300">مبلغ نهایی پرداختی (تومان)</label>
                  <span className="font-mono text-[#ffd700] font-bold">{formatToman(wTotalAmount)} تومان</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatToman(wTotalAmount)}
                  onChange={(e) => setWTotalAmount(parseNumber(e.target.value))}
                  placeholder="مبلغ نهایی..."
                  className="w-full h-12 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-lg font-black text-[#ffd700] font-mono focus:border-[#d4af37] outline-none"
                />
              </div>

              {/* Gold Rate */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-zinc-300">نرخ هر گرم طلای ۱۸ عیار</label>
                  <button
                    type="button"
                    onClick={() => setWGoldRate(goldPrice)}
                    className="text-[10px] text-[#d4af37]"
                  >
                    تابلو
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatToman(wGoldRate)}
                  onChange={(e) => setWGoldRate(parseNumber(e.target.value))}
                  className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                />
              </div>

              {/* Wage % */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">درصد اجرت ساخت</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={wFeePercent || ''}
                    onChange={(e) => setWFeePercent(parseFloatNumber(e.target.value))}
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-[11px] text-zinc-400">درصد</span>
                </div>
              </div>

              {/* Profit % */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">درصد سود طلافروش</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={wProfitPercent || ''}
                    onChange={(e) => setWProfitPercent(parseFloatNumber(e.target.value))}
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-[11px] text-zinc-400">درصد</span>
                </div>
              </div>

              {/* Tax Toggle */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">مالیات ارزش‌افزوده</span>
                  <span className="text-[10px] text-zinc-400">۹٪ اجرت و سود</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWTaxActive(!wTaxActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    wTaxActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {wTaxActive ? 'فعال (۹٪)' : 'معاف'}
                </button>
              </div>

            </div>

          </div>

          {/* RESULT CARD FOR FIND WEIGHT */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#ffd700]" />
                <span>وزن محاسبه‌شده برای این طلا</span>
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                دقت ۳ رقم اعشار (طلافروشی)
              </span>
            </div>

            <div className="bg-[#d4af37]/10 p-4 rounded-2xl border border-[#d4af37]/30 text-center space-y-1">
              <span className="text-xs font-bold text-amber-200">وزن دقیق طلا:</span>
              <div className="text-3xl sm:text-4xl font-black text-[#ffd700] font-mono tracking-tight">
                {findWeightResult.weight.toLocaleString('fa-IR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}{' '}
                <span className="text-lg font-bold text-white">گرم</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-zinc-300 pt-1 font-mono">
                <span>معادل: {findWeightResult.soot.toLocaleString('fa-IR')} سوت</span>
                <span>·</span>
                <span>معادل: {findWeightResult.mesghal.toLocaleString('fa-IR')} مثقال</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-1.5 text-xs text-zinc-300 border-t border-zinc-800 pt-3">
              <div className="flex justify-between">
                <span>ارزش طلای خام:</span>
                <span className="font-mono text-white font-bold">{formatToman(findWeightResult.rawGold)} ت</span>
              </div>
              <div className="flex justify-between">
                <span>مبلغ اجرت ساخت ({wFeePercent}٪):</span>
                <span className="font-mono text-amber-300 font-bold">{formatToman(findWeightResult.fee)} ت</span>
              </div>
              <div className="flex justify-between">
                <span>سود فروشگاه ({wProfitPercent}٪):</span>
                <span className="font-mono text-zinc-200 font-bold">{formatToman(findWeightResult.profit)} ت</span>
              </div>
              {wTaxActive && (
                <div className="flex justify-between">
                  <span>مالیات ارزش افزوده:</span>
                  <span className="font-mono text-zinc-300 font-bold">{formatToman(findWeightResult.tax)} ت</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const text = `محاسبه معکوس وزن طلا:\n` +
                  `مبلغ کل: ${formatToman(wTotalAmount)} تومان\n` +
                  `وزن دقیق: ${findWeightResult.weight} گرم (${findWeightResult.soot} سوت)\n` +
                  `نرخ طلا: ${formatToman(wGoldRate)} تومان\n` +
                  `اجرت: ${wFeePercent}٪ | سود: ${wProfitPercent}٪`;
                handleCopyText(text);
              }}
              className="w-full h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Copy className="w-4 h-4 text-[#d4af37]" />
              <span>کپی مشخصات وزن</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: FIND FEE & PROFIT (پیدا کردن سود و اجرت) */}
      {/* ========================================================================= */}
      {activeSubTab === 'find-fee' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#ffd700]" />
                <h3 className="text-sm font-black text-white">پیدا کردن درصد سود و اجرت فاکتور</h3>
              </div>
              <span className="text-[11px] text-zinc-400">تفکیک اجرت ساخت و سود</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Total Final Price */}
              <div className="sm:col-span-2 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-zinc-300">مبلغ نهایی پرداختی (تومان)</label>
                  <span className="font-mono text-[#ffd700] font-bold">{formatToman(fTotalAmount)} تومان</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatToman(fTotalAmount)}
                  onChange={(e) => setFTotalAmount(parseNumber(e.target.value))}
                  placeholder="مبلغ نهایی..."
                  className="w-full h-12 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-lg font-black text-[#ffd700] font-mono focus:border-[#d4af37] outline-none"
                />
              </div>

              {/* Weight */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">وزن طلا (گرم)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    value={fWeight || ''}
                    onChange={(e) => setFWeight(parseFloatNumber(e.target.value))}
                    placeholder="مثال: ۶.۵"
                    className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                  />
                  <span className="absolute left-3 top-3 text-[11px] text-zinc-400">گرم</span>
                </div>
              </div>

              {/* Gold Rate */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-zinc-300">نرخ هر گرم طلای ۱۸ عیار</label>
                  <button
                    type="button"
                    onClick={() => setFGoldRate(goldPrice)}
                    className="text-[10px] text-[#d4af37]"
                  >
                    تابلو
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatToman(fGoldRate)}
                  onChange={(e) => setFGoldRate(parseNumber(e.target.value))}
                  className="w-full h-11 px-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                />
              </div>

              {/* Tax Included Toggle */}
              <div className="sm:col-span-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">مالیات بر ارزش‌افزوده در این فاکتور</span>
                  <span className="text-[10px] text-zinc-400">آیا ۹٪ ارزش‌افزوده روی سود و اجرت حساب شده است؟</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFTaxActive(!fTaxActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    fTaxActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {fTaxActive ? 'بله، لحاظ شده (۹٪)' : 'خیر، بدون مالیات'}
                </button>
              </div>

            </div>

          </div>

          {/* RESULT CARD FOR FIND FEE & PROFIT */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#ffd700]" />
                <span>تفکیک سود و اجرت کشف‌شده</span>
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                سود قانونی ۷٪
              </span>
            </div>

            {/* Split cards for Wage & Profit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <div className="bg-[#d4af37]/15 p-4 rounded-2xl border border-[#d4af37]/40 text-center space-y-1">
                <span className="text-xs font-bold text-amber-200">درصد اجرت ساخت:</span>
                <div className="text-2xl sm:text-3xl font-black text-[#ffd700] font-mono">
                  {findFeeResult.feePercent.toLocaleString('fa-IR')}٪
                </div>
                <div className="text-[11px] text-zinc-300 font-mono">
                  مبلغ اجرت: {formatToman(findFeeResult.feeAmount)} ت
                </div>
              </div>

              <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center space-y-1">
                <span className="text-xs font-bold text-zinc-300">سود طلافروشی (قانونی):</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  ۷٪
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  مبلغ سود: {formatToman(findFeeResult.profitAmount)} ت
                </div>
              </div>

            </div>

            {/* Summary details */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>مجموع درصد سود و اجرت:</span>
                <span className="font-mono text-[#ffd700] font-bold">
                  {findFeeResult.totalMarkupPercent.toLocaleString('fa-IR')}٪
                </span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>ارزش طلای خام:</span>
                <span className="font-mono text-white font-bold">{formatToman(findFeeResult.rawGold)} تومان</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>کل مبلغ مازاد (سود + اجرت):</span>
                <span className="font-mono text-zinc-200 font-bold">{formatToman(findFeeResult.totalMarkup)} تومان</span>
              </div>
              {fTaxActive && (
                <div className="flex justify-between text-zinc-300">
                  <span>مالیات ارزش‌افزوده پرداخت‌شده:</span>
                  <span className="font-mono text-zinc-300 font-bold">{formatToman(findFeeResult.taxAmount)} تومان</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const text = `کشف سود و اجرت فاکتور:\n` +
                  `مبلغ پرداختی: ${formatToman(fTotalAmount)} تومان\n` +
                  `وزن: ${fWeight} گرم | نرخ طلا: ${formatToman(fGoldRate)} ت\n` +
                  `درصد اجرت ساخت: ${findFeeResult.feePercent}٪ (${formatToman(findFeeResult.feeAmount)} ت)\n` +
                  `سود طلافروش: ۷٪ (${formatToman(findFeeResult.profitAmount)} ت)\n` +
                  `مجموع سود و اجرت: ${findFeeResult.totalMarkupPercent}٪`;
                handleCopyText(text);
              }}
              className="w-full h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Copy className="w-4 h-4 text-[#d4af37]" />
              <span>کپی نتیجه سود و اجرت</span>
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: GOLD SWAP & BARTER / تعویض و تهاتر طلا */}
      {/* ========================================================================= */}
      {activeSubTab === 'swap' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#ffd700]" />
                <h3 className="text-sm font-black text-white">تعویض و تهاتر هوشمند طلا (جدید و مستعمل)</h3>
              </div>
              <span className="text-[11px] bg-amber-500/10 text-[#ffd700] px-2 py-0.5 rounded-full font-bold">ماشین‌حساب تهاتر</span>
            </div>

            {/* Daily live rate block for swap */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-bold">نرخ طلای پایه روز (عیار ۱۸ / ۷۵۰)</span>
                <button
                  type="button"
                  onClick={() => setSGoldRate(goldPrice)}
                  className="text-[10px] text-[#d4af37] hover:underline"
                >
                  همگام‌سازی با نرخ تابلو
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={toPersianDigits(formatTomanAmount(sGoldRate))}
                  onChange={(e) => setSGoldRate(parseCleanNumber(e.target.value))}
                  className="w-full h-11 pl-12 pr-3 bg-zinc-900 border border-zinc-700 rounded-xl text-base font-bold text-[#ffd700] font-mono focus:border-[#d4af37] outline-none"
                />
                <span className="pointer-events-none absolute left-3 top-3 text-[11px] text-zinc-400">تومان</span>
              </div>
            </div>

            {/* TWO COLUMN GRID: USED GOLD VS NEW GOLD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* COLUMN 1: USED GOLD (طلای مستعمل مشتری) */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h4 className="text-xs font-black text-white">۱. طلای کارکرده/مستعمل (دریافتی از مشتری)</h4>
                </div>

                {/* Used Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">وزن طلای کارکرده (گرم)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={toPersianDigits(sUsedWeight || '')}
                      onChange={(e) => setSUsedWeight(parseCleanFloat(e.target.value))}
                      placeholder="مثال: ۱۰"
                      className="w-full h-11 pl-12 pr-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                    />
                    <span className="pointer-events-none absolute left-3 top-3.5 text-[11px] text-zinc-400">گرم</span>
                  </div>
                </div>

                {/* Used Carat Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">عیار طلای کارکرده</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: '۱۸ (۷۵۰)', value: 750 },
                      { label: '۲۱ (۸۷۵)', value: 875 },
                      { label: '۲۲ (۹۱۶)', value: 916 },
                      { label: '۲۴ (۹۹۹)', value: 999 },
                      { label: '۱۷ (۷۴۰)', value: 740 },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSUsedCarat(item.value)}
                        className={`py-2 px-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                          sUsedCarat === item.value
                            ? 'bg-[#d4af37] text-black font-black'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* Custom carat input if they want something else */}
                  <div className="pt-1">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="عیار دلخواه (مثلاً ۷۰۵ یا عیار ۱۷)"
                        value={toPersianDigits(![750, 875, 916, 999, 740].includes(sUsedCarat) ? sUsedCarat : '')}
                        onChange={(e) => {
                          const val = parseCleanNumber(e.target.value);
                          if (val > 0) setSUsedCarat(val);
                        }}
                        className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-white focus:border-[#d4af37] outline-none"
                      />
                      <span className="pointer-events-none absolute left-3 top-2.5 text-[10px] text-zinc-500">عیار دستی</span>
                    </div>
                  </div>
                </div>

                {/* Price Option for Used Gold */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 block">روش ارزش‌گذاری طلای مستعمل</label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setSUsedPriceOption('standard')}
                      className={`py-2 text-[10px] rounded-lg font-bold transition-all cursor-pointer ${
                        sUsedPriceOption === 'standard'
                          ? 'bg-amber-500/20 text-[#ffd700] border border-amber-500/40'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      نرخ خام عیار
                    </button>
                    <button
                      type="button"
                      onClick={() => setSUsedPriceOption('discount')}
                      className={`py-2 text-[10px] rounded-lg font-bold transition-all cursor-pointer ${
                        sUsedPriceOption === 'discount'
                          ? 'bg-amber-500/20 text-[#ffd700] border border-amber-500/40'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      کسر از نرخ گرمی
                    </button>
                    <button
                      type="button"
                      onClick={() => setSUsedPriceOption('custom')}
                      className={`py-2 text-[10px] rounded-lg font-bold transition-all cursor-pointer ${
                        sUsedPriceOption === 'custom'
                          ? 'bg-amber-500/20 text-[#ffd700] border border-amber-500/40'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      قیمت خرید دلخواه
                    </button>
                  </div>

                  {/* Optional Input based on chosen option */}
                  {sUsedPriceOption === 'discount' && (
                    <div className="space-y-1 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 animate-fadeIn">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400">
                        <span>کسر از نرخ هر گرم (تومان زیر تابلو):</span>
                        <span className="font-mono text-[#ffd700]">{formatToman(sUsedDiscount)} ت</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={toPersianDigits(formatTomanAmount(sUsedDiscount))}
                          onChange={(e) => setSUsedDiscount(parseCleanNumber(e.target.value))}
                          className="w-full h-9 pl-20 pr-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                        />
                        <span className="pointer-events-none absolute left-3 top-2.5 text-[10px] text-zinc-500">تومان کمتر</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        مثال: کسر ۵۰,۰۰۰ تومان از نرخ گرمی به علت دست دوم بودن یا تصفیه آب‌شده.
                      </p>
                    </div>
                  )}

                  {sUsedPriceOption === 'custom' && (
                    <div className="space-y-1 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 animate-fadeIn">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400">
                        <span>مبلغ توافقی خرید هر گرم طلای کارکرده (تومان):</span>
                        <span className="font-mono text-[#ffd700]">{formatToman(sUsedCustomPrice)} ت</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={toPersianDigits(formatTomanAmount(sUsedCustomPrice))}
                          onChange={(e) => setSUsedCustomPrice(parseCleanNumber(e.target.value))}
                          className="w-full h-9 pl-20 pr-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                        />
                        <span className="pointer-events-none absolute left-3 top-2.5 text-[10px] text-zinc-500">تومان / گرم</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Used gold value sum summary */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60 flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-bold">مجموع ارزش طلای مشتری:</span>
                  <span className="font-mono text-[#ffd700] font-black text-sm">
                    {formatToman(swapResult.totalUsedValue)} تومان
                  </span>
                </div>

              </div>

              {/* COLUMN 2: NEW GOLD (طلای نو انتخابی) */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-black text-white">۲. طلای جدید (تحویلی به مشتری)</h4>
                </div>

                {/* New Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">وزن طلای جدید (گرم)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={toPersianDigits(sNewWeight || '')}
                      onChange={(e) => setSNewWeight(parseCleanFloat(e.target.value))}
                      placeholder="مثال: ۱۰"
                      className="w-full h-11 pl-12 pr-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                    />
                    <span className="pointer-events-none absolute left-3 top-3.5 text-[11px] text-zinc-400">گرم</span>
                  </div>
                </div>


                {/* New Carat Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">عیار طلای جدید</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: '۱۸ (۷۵۰)', value: 750 },
                      { label: '۲۱ (۸۷۵)', value: 875 },
                      { label: '۲۲ (۹۱۶)', value: 916 },
                      { label: '۲۴ (۹۹۹)', value: 999 },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSNewCarat(item.value)}
                        className={`py-2 px-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                          sNewCarat === item.value
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* Custom carat input for new gold */}
                  <div className="pt-1">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="عیار جدید دلخواه (مثلاً ۸۷۵ یا ۷۵۰)"
                        value={toPersianDigits(![750, 875, 916, 999].includes(sNewCarat) ? sNewCarat : '')}
                        onChange={(e) => {
                          const val = parseCleanNumber(e.target.value);
                          if (val > 0) setSNewCarat(val);
                        }}
                        className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-white focus:border-[#ffd700] outline-none"
                      />
                      <span className="pointer-events-none absolute left-3 top-2.5 text-[10px] text-zinc-500">عیار دستی</span>
                    </div>
                  </div>
                </div>

                {/* New Wage/Fee Type and Value */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>اجرت ساخت طلای جدید</span>
                    <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setSNewFeeType('percent')}
                        className={`px-2 py-0.5 text-[10px] rounded font-bold cursor-pointer ${
                          sNewFeeType === 'percent' ? 'bg-[#d4af37] text-black' : 'text-zinc-400'
                        }`}
                      >
                        درصدی (٪)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSNewFeeType('toman')}
                        className={`px-2 py-0.5 text-[10px] rounded font-bold cursor-pointer ${
                          sNewFeeType === 'toman' ? 'bg-[#d4af37] text-black' : 'text-zinc-400'
                        }`}
                      >
                        تومانی / گرم
                      </button>
                    </div>
                  </div>

                  {sNewFeeType === 'percent' ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={toPersianDigits(sNewFeePercent || '')}
                        onChange={(e) => setSNewFeePercent(parseCleanFloat(e.target.value))}
                        className="w-20 h-10 px-2 text-center bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                      />
                      <div className="flex-1 flex gap-1 overflow-x-auto">
                        {[5, 10, 12, 15, 18].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setSNewFeePercent(pct)}
                            className={`flex-1 py-1.5 px-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                              sNewFeePercent === pct
                                ? 'bg-zinc-800 text-white font-black border border-zinc-700'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300'
                            }`}
                          >
                            {pct}٪
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={toPersianDigits(formatTomanAmount(sNewFeeToman))}
                        onChange={(e) => setSNewFeeToman(parseCleanNumber(e.target.value))}
                        className="w-full h-10 pl-20 pr-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                      />
                      <span className="pointer-events-none absolute left-3 top-3 text-[10px] text-zinc-400">تومان / گرم</span>
                    </div>
                  )}
                </div>

                {/* New Profit & Tax Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 block">سود طلا فروشی</span>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={toPersianDigits(sNewProfitPercent || '')}
                        onChange={(e) => setSNewProfitPercent(parseCleanFloat(e.target.value))}
                        className="w-full h-9 pl-6 pr-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white font-mono focus:border-[#d4af37] outline-none"
                      />
                      <span className="pointer-events-none absolute left-2 top-2 text-[10px] text-zinc-500">٪</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-center items-center">
                    <span className="text-[10px] text-zinc-400 block text-center mb-1">مالیات ۹٪ ارزش افزوده</span>
                    <button
                      type="button"
                      onClick={() => setSNewTaxActive(!sNewTaxActive)}
                      className={`w-full py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                        sNewTaxActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-950 text-zinc-500 border border-zinc-900'
                      }`}
                    >
                      {sNewTaxActive ? 'محاسبه ارزش‌افزوده' : 'معاف از مالیات'}
                    </button>
                  </div>
                </div>

                {/* New gold total sum summary */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60 flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-bold">جمع کل هزینه طلای جدید:</span>
                  <span className="font-mono text-emerald-400 font-black text-sm">
                    {formatToman(swapResult.totalNewCost)} تومان
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* SWAP RESULT ANALYSIS DASHBOARD */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 rounded-3xl border-2 border-[#d4af37]/60 shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#ffd700]" />
                <span>نتیجه تهاتر و مابه‌التفاوت نهایی</span>
              </span>
              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                همان لحظه محاسبه شده
              </span>
            </div>

            {/* BALANCE BLOCK CALLOUT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Box 1: Used Gold Value */}
              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800/60 text-center space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 block">ارزش کل طلای دریافتی (مستعمل):</span>
                <span className="text-lg font-mono font-black text-[#ffd700]">
                  {formatToman(swapResult.totalUsedValue)} <span className="text-xs font-bold text-zinc-400">تومان</span>
                </span>
                <div className="text-[9px] text-zinc-500 font-mono">
                  {sUsedWeight} گرم {sUsedCarat} عیار با نرخ {formatToman(swapResult.usedPricePerGram)} ت
                </div>
              </div>

              {/* Box 2: New Gold Value */}
              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800/60 text-center space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 block">ارزش کل طلای تحویلی (نو):</span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  {formatToman(swapResult.totalNewCost)} <span className="text-xs font-bold text-zinc-400">تومان</span>
                </span>
                <div className="text-[9px] text-zinc-500 font-mono">
                  {sNewWeight} گرم {sNewCarat} عیار | نرخ تمام‌شده گرمی {formatToman(swapResult.costPerGramOfNew)} ت
                </div>
              </div>

              {/* Box 3: Equivalent Gold Weight */}
              <div className="bg-[#d4af37]/5 p-3 rounded-2xl border border-amber-500/20 text-center space-y-1">
                <span className="text-[11px] font-bold text-amber-200 block">وزن معادل طلای جدید (سر به سر):</span>
                <span className="text-lg font-mono font-black text-white">
                  {swapResult.equivalentWeight.toLocaleString('fa-IR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}{' '}
                  <span className="text-xs font-bold text-zinc-400">گرم</span>
                </span>
                <p className="text-[9px] text-zinc-400 leading-tight">
                  با ارزش طلای مستعمل مشتری، بدون پرداخت هیچ پولی، می‌توان {swapResult.equivalentWeight.toLocaleString('fa-IR', { maximumFractionDigits: 3 })} گرم طلا نو تحویل داد.
                </p>
              </div>

            </div>

            {/* DYNAMIC SETTLEMENT CALLOUT */}
            <div className={`p-4 rounded-2xl border text-center space-y-1.5 ${
              swapResult.balance > 0
                ? 'bg-amber-500/10 border-amber-500/30'
                : swapResult.balance < 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-zinc-900 border-zinc-800'
            }`}>
              {swapResult.balance > 0 ? (
                <>
                  <span className="text-xs font-bold text-amber-200">مبلغ نهایی که مشتری باید پرداخت کند (سر بدهد):</span>
                  <div className="text-3xl sm:text-4xl font-black text-[#ffd700] font-mono tracking-tight">
                    {formatToman(swapResult.balance)}{' '}
                    <span className="text-lg font-bold text-white">تومان</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    ارزش طلای جدید بیشتر است؛ مشتری مابه‌التفاوت بالا را تسویه می‌کند.
                  </p>
                </>
              ) : swapResult.balance < 0 ? (
                <>
                  <span className="text-xs font-bold text-emerald-200">مبلغ نهایی که طلافروش باید به مشتری پرداخت کند (سر بگیرد):</span>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                    {formatToman(Math.abs(swapResult.balance))}{' '}
                    <span className="text-lg font-bold text-white">تومان</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    ارزش طلای دریافتی بیشتر است؛ طلافروش مابه‌التفاوت بالا را نقداً یا اعتباری تسویه می‌کند.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-white">تهاتر ۱۰۰٪ سر به سر و معادل:</span>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    ۰ تومان
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    ارزش طلای مستعمل دقیقاً با هزینه طلای نو انتخابی برابر است.
                  </p>
                </>
              )}
            </div>

            {/* BREAKDOWN LIST */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs space-y-2.5">
              <span className="text-[11px] font-bold text-zinc-400 block pb-1 border-b border-zinc-900">ریز حساب تعویض طلا:</span>
              
              <div className="flex justify-between text-zinc-300">
                <span>محاسبه طلای مستعمل:</span>
                <span className="font-mono text-white">
                  {sUsedWeight} گرم × {formatToman(swapResult.usedPricePerGram)} ت = {formatToman(swapResult.totalUsedValue)} ت
                </span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span>محاسبه ارزش خام طلای جدید:</span>
                <span className="font-mono text-white">
                  {sNewWeight} گرم × {formatToman(swapResult.rawNewTotal / sNewWeight)} ت = {formatToman(swapResult.rawNewTotal)} ت
                </span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span>اجرت ساخت طلای جدید:</span>
                <span className="font-mono text-amber-300">
                  {sNewFeeType === 'percent' ? `${sNewFeePercent}٪` : `${formatToman(sNewFeeToman)} ت/گرم`} → {formatToman(swapResult.wageAmount)} ت
                </span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span>سود طلافروش طلای جدید ({sNewProfitPercent}٪):</span>
                <span className="font-mono text-zinc-200">
                  {formatToman(swapResult.profitAmount)} ت
                </span>
              </div>

              {sNewTaxActive && (
                <div className="flex justify-between text-zinc-300">
                  <span>مالیات ارزش افزوده (۹٪ سود و اجرت):</span>
                  <span className="font-mono text-zinc-300">
                    {formatToman(swapResult.taxAmount)} ت
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-zinc-900 font-bold text-white text-sm">
                <span>قیمت تمام‌شده طلای نو:</span>
                <span className="font-mono text-emerald-400">{formatToman(swapResult.totalNewCost)} تومان</span>
              </div>
            </div>

            {/* COPY SUMMARY ACTION BUTTON */}
            <button
              type="button"
              onClick={() => {
                const text = `⚖️ فاکتور تعویض و تهاتر طلا - گالری طلا ${store.name || 'زرسا'}\n` +
                  `=========================\n` +
                  `📥 طلای دریافتی (مستعمل):\n` +
                  `   - وزن: ${sUsedWeight} گرم | عیار: ${sUsedCarat}\n` +
                  `   - نرخ خرید هر گرم: ${formatToman(swapResult.usedPricePerGram)} تومان\n` +
                  `   - مجموع ارزش طلا: ${formatToman(swapResult.totalUsedValue)} تومان\n` +
                  `-------------------------\n` +
                  `📤 طلای تحویلی (نو):\n` +
                  `   - وزن: ${sNewWeight} گرم | عیار: ${sNewCarat}\n` +
                  `   - اجرت ساخت: ${sNewFeeType === 'percent' ? `${sNewFeePercent}٪` : `${formatToman(sNewFeeToman)} ت/گرم`}\n` +
                  `   - سود فروشگاه: ${sNewProfitPercent}٪\n` +
                  `   - مالیات ارزش‌افزوده: ${sNewTaxActive ? '۹٪' : 'خیر'}\n` +
                  `   - قیمت تمام‌شده طلای نو: ${formatToman(swapResult.totalNewCost)} تومان\n` +
                  `=========================\n` +
                  `⚖️ وضعیت تسویه مابه‌التفاوت:\n` +
                  `   ${swapResult.balance > 0 
                    ? `🔺 مشتری سر می‌دهد: ${formatToman(swapResult.balance)} تومان` 
                    : swapResult.balance < 0 
                    ? `🟢 طلافروش سر می‌دهد: ${formatToman(Math.abs(swapResult.balance))} تومان` 
                    : `⚖️ تهاتر سر به سر بدون دریافت یا پرداخت پول`}\n` +
                  `💎 معادل وزنی سر به سر: ${swapResult.equivalentWeight} گرم طلای نو`;
                handleCopyText(text);
              }}
              className="w-full h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-lg border border-zinc-750"
            >
              <Copy className="w-5 h-5 text-[#d4af37]" />
              <span>کپی خلاصه فاکتور تعویض و تهاتر</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
