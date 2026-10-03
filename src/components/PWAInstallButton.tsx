import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { useOnlineStatus } from './useOnlineStatus';
import { Download, Monitor, Smartphone, Info, WifiOff, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ mode?: 'settings' | 'compact' }> = ({ mode = 'settings' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide install prompts, but in settings mode we can show a nice "Installed" badge
  if (isInstalled) {
    if (mode === 'settings') {
      return (
        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-black text-emerald-400">برنامه روی دستگاه شما نصب شده است</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">شما در حال استفاده از نسخه مستقل (Standalone) و مجهز به عملکرد آفلاین هستید.</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // IOS Safari Guide
  if (isIOS) {
    return (
      <>
        {mode === 'settings' ? (
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-black text-white">نصب روی سیستم‌عامل iOS (آیفون و آیپد)</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">قیمت‌یار زرسا را به عنوان میانبر بدون نیاز به دانلود از اپ‌استور نصب کنید.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(true)}
              className="w-full h-11 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-[#d4af37]/10"
            >
              <Download className="w-4 h-4 text-black stroke-[3]" />
              <span>آموزش نصب روی آیفون (Safari)</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="h-8 px-2.5 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/20 text-[#ffd700] text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نصب روی آیفون</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center pb-4 border-b border-zinc-900">
                <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-6 h-6 text-[#d4af37]" />
                </div>
                <h3 className="text-sm font-black text-white">راهنمای نصب روی آیفون (iOS)</h3>
                <p className="text-[10px] text-zinc-500 mt-1">بدون نیاز به نصب نرم‌افزار اضافی، میانبر آفلاین زرسا را اضافه کنید:</p>
              </div>

              <div className="py-5 space-y-4 text-xs text-zinc-300">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-[10px] font-bold text-[#d4af37] shrink-0 mt-0.5">۱</span>
                  <p className="leading-relaxed">
                    در پایین مرورگر سافاری (Safari) دکمه <strong className="text-white text-sm">اشتراک‌گذاری (Share)</strong> (آیکون مربع همراه با فلش رو به بالا) را لمس کنید.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-[10px] font-bold text-[#d4af37] shrink-0 mt-0.5">۲</span>
                  <p className="leading-relaxed">
                    در لیست بازشده به پایین اسکرول کرده و گزینه <strong className="text-white text-sm">Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب نمایید.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-[10px] font-bold text-[#d4af37] shrink-0 mt-0.5">۳</span>
                  <p className="leading-relaxed">
                    در بالای صفحه باز شده، روی دکمه <strong className="text-[#d4af37] text-sm">Add (افزودن)</strong> کلیک کنید تا آیکون زرسا طلا در میانبرهای شما نمایان شود.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                متوجه شدم و بستن راهنما
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Android / Chrome / Desktop flow
  if (isInstallable) {
    return (
      <div className={mode === 'settings' ? "bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3 text-xs" : ""}>
        {mode === 'settings' && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h4 className="font-black text-white">نصب اپلیکیشن و ایجاد میانبر دسکتاپ/گوشی</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">با نصب برنامه، نیازی به مرورگر ندارید و برنامه به صورت بومی و آفلاین کار می‌کند.</p>
            </div>
          </div>
        )}

        <button
          onClick={install}
          className={
            mode === 'settings'
              ? "w-full h-11 rounded-xl bg-[#d4af37] hover:bg-[#b89320] text-black font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-[#d4af37]/15 cursor-pointer"
              : "h-8 px-2.5 rounded-lg bg-[#d4af37] text-black text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
          }
        >
          <Download className="w-3.5 h-3.5 text-black stroke-[3]" />
          <span>نصب برنامه زرسا طلا</span>
        </button>
      </div>
    );
  }

  // Not installable (already loaded, or unsupported browser)
  if (mode === 'settings') {
    return (
      <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-900 space-y-2 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-zinc-300">راهنمای استفاده آفلاین</h5>
            <p className="text-[10px] text-zinc-500 leading-normal">
              مرورگر شما در حال حاضر از نصب مستقیم پشت‌يبانی نمی‌کند. برای استفاده آفلاین:
            </p>
            <ul className="list-disc pr-4 space-y-1 text-[10px] text-zinc-500 mt-1">
              <li>پیشنهاد می‌کنیم از مرورگرهای استاندارد مانند <strong className="text-zinc-400">Google Chrome</strong> یا <strong className="text-zinc-400">Safari</strong> استفاده کنید.</li>
              <li>در منوی سه‌نقطه بالا سمت راست مرورگر خود، گزینه <strong className="text-zinc-400">Add to Home Screen</strong> یا <strong className="text-zinc-400">Install App</strong> را کلیک کنید.</li>
              <li>این برنامه با کش‌کردن فایل‌های اصلی، حتی بدون اتصال به اینترنت نیز به صورت آفلاین بالا می‌آید.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-amber-950/95 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <h5 className="font-bold text-white">در حال استفاده آفلاین (بدون اینترنت)</h5>
            <p className="text-[9px] text-zinc-400 mt-0.5">اطلاعات و قیمت‌ها از روی حافظه داخلی دستگاه شما خوانده می‌شوند.</p>
          </div>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      </div>
    </div>
  );
};
