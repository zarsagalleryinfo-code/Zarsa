import { PurchaseInvoice, StoreSettings } from '../types';
import { jsPDF } from 'jspdf';

export function renderPurchaseReceiptToCanvas(receipt: PurchaseInvoice, store: StoreSettings): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1750;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Warm Luxurious Background with subtle parchment tone
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#fdfcf9');
  bgGrad.addColorStop(1, '#f6f2e9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle pattern
  ctx.save();
  ctx.fillStyle = 'rgba(212, 175, 55, 0.03)';
  for (let i = 0; i < width; i += 80) {
    for (let j = 0; j < height; j += 80) {
      if ((i + j) % 160 === 0) {
        ctx.fillRect(i, j, 40, 40);
      }
    }
  }
  ctx.restore();

  // 2. Double Gold Borders
  ctx.save();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.strokeStyle = '#b89320';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, width - 92, height - 92);
  ctx.restore();

  // Watermark text in background
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = '900 65px "Vazirmatn", "IRANSans", Tahoma, sans-serif';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
  ctx.textAlign = 'center';
  ctx.fillText(store.watermarkText || store.name || 'ZARSA GOLD', 0, 0);
  ctx.fillText('رسید رسمی خرید طلا و تسویه حساب', 0, 80);
  ctx.restore();

  // 3. Header
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 36px "Vazirmatn", "IRANSans", Tahoma, sans-serif';
  ctx.fillStyle = '#18181b';
  ctx.fillText(store.name || 'گالری طلای زرسا', width / 2, 115);

  ctx.font = '700 20px "Vazirmatn", "IRANSans", Tahoma, sans-serif';
  ctx.fillStyle = '#b45309';
  ctx.fillText('رسید رسمی خرید طلا و تسویه حساب بانکی', width / 2, 155);

  if (store.ownerName) {
    ctx.font = '500 16px "Vazirmatn", "IRANSans", Tahoma, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.fillText(`مدیریت و صاحب امتیاز: ${store.ownerName}`, width / 2, 185);
  }
  ctx.restore();

  // Header Divider
  ctx.save();
  ctx.strokeStyle = '#e4d5b7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 210);
  ctx.lineTo(width - 80, 210);
  ctx.stroke();
  ctx.restore();

  // 4. Receipt Metadata Bar
  ctx.save();
  ctx.fillStyle = '#f3ede2';
  ctx.fillRect(80, 230, width - 160, 65);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1;
  ctx.strokeRect(80, 230, width - 160, 65);

  ctx.textAlign = 'right';
  ctx.font = 'bold 16px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#27272a';
  ctx.fillText(`شماره رسید: ${receipt.receiptNumber}`, width - 110, 270);

  ctx.textAlign = 'center';
  ctx.fillText(`تاریخ: ${receipt.dateFa} - ساعت ${receipt.timeFa}`, width / 2, 270);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#047857';
  ctx.fillText('وضعیت: تسویه شد ✓', 110, 270);
  ctx.restore();

  // 5. Customer & Bank Transfer Box
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(80, 315, width - 160, 215);
  ctx.strokeStyle = '#e2d9cc';
  ctx.lineWidth = 1;
  ctx.strokeRect(80, 315, width - 160, 215);

  // Box Title
  ctx.fillStyle = '#f8f4ec';
  ctx.fillRect(80, 315, width - 160, 42);
  ctx.textAlign = 'right';
  ctx.font = '900 16px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#854d0e';
  ctx.fillText('👤 مشخصات فروشنده (مشتری) و حساب بانکی واریز وجه', width - 110, 342);

  ctx.font = 'bold 16px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#27272a';

  // Row 1
  ctx.fillText(`نام و نام خانوادگی: ${receipt.customerName || 'مشتری حضوری'}`, width - 110, 395);
  ctx.fillText(`شماره همراه: ${receipt.customerPhone || 'ثبت نشده'}`, width / 2 - 20, 395);

  // Row 2
  const bank = receipt.bankInfo;
  ctx.fillText(`نام بانک: ${bank?.bankName || 'تعیین نشده'}`, width - 110, 440);
  ctx.fillText(`نام صاحب حساب: ${bank?.accountOwnerName || receipt.customerName || 'مطابق کارت'}`, width / 2 - 20, 440);

  // Row 3: Card & Sheba
  ctx.fillText(`شماره کارت بانکی: ${bank?.cardNumber || '---'}`, width - 110, 485);
  ctx.fillText(`شماره شبا: ${bank?.shabaNumber || '---'}`, width / 2 - 20, 485);
  ctx.restore();

  // 6. Gold Purchase Details Table
  ctx.save();
  const tableY = 555;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(80, tableY, width - 160, 460);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(80, tableY, width - 160, 460);

  // Table Header
  ctx.fillStyle = '#1e1b18';
  ctx.fillRect(80, tableY, width - 160, 50);
  ctx.font = '900 17px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'right';
  ctx.fillText('شرح طلای خریداری‌شده', width - 110, tableY + 32);

  ctx.textAlign = 'center';
  ctx.fillText('وزن ناخالص', width - 420, tableY + 32);
  ctx.fillText('عیار کار', width - 580, tableY + 32);
  ctx.fillText('وزن معادل ۷۵۰', width - 750, tableY + 32);
  ctx.fillText('نرخ مبنا (تومان)', width - 920, tableY + 32);

  ctx.textAlign = 'left';
  ctx.fillText('مبلغ ناخالص', 120, tableY + 32);

  // Table Row 1: Item specs
  ctx.fillStyle = '#27272a';
  ctx.font = 'bold 16px "Vazirmatn", Tahoma, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(receipt.itemTitle, width - 110, tableY + 100);

  ctx.textAlign = 'center';
  ctx.fillText(`${receipt.rawWeight.toLocaleString('fa-IR', { minimumFractionDigits: 3 })} گرم`, width - 420, tableY + 100);
  ctx.fillText(`${receipt.sourceKarat} عیار`, width - 580, tableY + 100);
  ctx.fillText(`${receipt.standardWeight750.toLocaleString('fa-IR', { minimumFractionDigits: 3 })} گرم`, width - 750, tableY + 100);
  ctx.fillText(`${receipt.goldPriceUsed.toLocaleString('fa-IR')}`, width - 920, tableY + 100);

  const rawAmount = Math.round(receipt.standardWeight750 * receipt.goldPriceUsed);
  ctx.textAlign = 'left';
  ctx.fillText(`${rawAmount.toLocaleString('fa-IR')} ت`, 120, tableY + 100);

  // Divider inside table
  ctx.strokeStyle = '#e2d9cc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, tableY + 135);
  ctx.lineTo(width - 80, tableY + 135);
  ctx.stroke();

  // Melted Extra Info (if applicable)
  let currentDetailY = tableY + 175;
  if (receipt.type === 'melted' && (receipt.engCode || receipt.labName)) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px "Vazirmatn", Tahoma, sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText(`🔍 اطلاعات ری‌گیری آب‌شده: کد انگ [ ${receipt.engCode || 'ثبت نشده'} ] - آزمایشگاه: ${receipt.labName || '---'} (تلفن: ${receipt.labPhone || '---'})`, width - 110, currentDetailY);
    currentDetailY += 40;
  }

  // Formula & Calculation breakdown
  ctx.textAlign = 'right';
  ctx.font = '500 15px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#52525b';
  if (receipt.type === 'scrap_jewelry') {
    ctx.fillText('• فرمول محاسبه بازار طلا: وزن ناخالص × عیار ۷۴۰ ÷ عیار ۷۵۰ استاندارد × نرخ تابلوی روز', width - 110, currentDetailY);
  } else if (receipt.type === 'parsian') {
    ctx.fillText(`• فرمول شمش پارسیان: وزن استاندارد × نرخ روز طلا ${receipt.discountPercent ? `(با کسر ${receipt.discountPercent}٪ کارمزد خرید)` : ''}`, width - 110, currentDetailY);
  } else if (receipt.type === 'coin') {
    ctx.fillText(`• فرمول مسکوکات بهار آزادی: ارزش ذاتی سکه بر مبنای ضریب ۲.۲۵۳ از مظنه ${receipt.discountPercent ? `(با کسر ${receipt.discountPercent}٪ کارمزد خرید)` : ''}`, width - 110, currentDetailY);
  } else {
    ctx.fillText(`• فرمول طلای آب‌شده: وزن ناخالص × عیار ${receipt.sourceKarat} ÷ ۷۵۰ × نرخ توافقی خرید آب‌شده`, width - 110, currentDetailY);
  }
  currentDetailY += 45;

  if (receipt.discountAmount && receipt.discountAmount > 0) {
    ctx.fillText(`• کسر توافقی خرید: ${receipt.discountAmount.toLocaleString('fa-IR')} تومان`, width - 110, currentDetailY);
    currentDetailY += 35;
  }

  // Large Total Payable Banner inside table
  const totalBoxY = tableY + 340;
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(100, totalBoxY, width - 200, 95);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.strokeRect(100, totalBoxY, width - 200, 95);

  ctx.textAlign = 'right';
  ctx.font = '900 18px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#92400e';
  ctx.fillText('مبلغ نهایی پرداخت‌شده به فروشنده (مشتری):', width - 140, totalBoxY + 40);

  ctx.textAlign = 'left';
  ctx.font = '900 32px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#1e1b18';
  ctx.fillText(`${receipt.totalPayable.toLocaleString('fa-IR')} تومان`, 140, totalBoxY + 60);

  ctx.restore();

  // 7. Legal Notice & Signatures
  ctx.save();
  const noticeY = 1045;
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#4b5563';
  ctx.fillText('اقرار و تایید فروشنده:', width - 90, noticeY);

  ctx.font = '13px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('اینجانب با مشخصات فوق، صحت مالکیت قطعه طلا/مسکوک فوق‌الذکر را تایید نموده و وجه آن را نقداً / حواله بانکی به حساب مذکور دریافت نمودم.', width - 90, noticeY + 28);
  ctx.fillText('کلیه عیارها و اوزان در حضور اینجانب با ترازوی دقیق بازبینی و قطعی گردید.', width - 90, noticeY + 52);

  // Stamp and Signature Areas
  const signY = 1170;

  // Customer Signature Box
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.strokeRect(100, signY, 340, 160);
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#374151';
  ctx.fillText('امضاء و اثر انگشت فروشنده (مشتری)', 270, signY + 35);

  // Store Stamp & Signature Box
  ctx.strokeRect(width - 440, signY, 340, 160);
  ctx.fillText('مهر و امضای مجاز گالری طلای زرسا', width - 270, signY + 35);

  // Simulated official stamp in red
  ctx.save();
  ctx.translate(width - 270, signY + 95);
  ctx.rotate(-0.08);
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 110, 40, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
  ctx.font = '900 13px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillText(store.stamp || 'گالری طلا زرسا - تایید و تسویه شد', 0, -4);
  ctx.font = 'bold 11px Tahoma, sans-serif';
  ctx.fillText('VERIFIED & PAID', 0, 14);
  ctx.restore();

  ctx.restore();

  // 8. Footer (Store address & phone)
  ctx.save();
  const footerY = 1630;
  ctx.strokeStyle = '#e4d5b7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, footerY);
  ctx.lineTo(width - 80, footerY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 14px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#52525b';
  ctx.fillText(`${store.name} · نشانی: ${store.address || 'بازار زرگران'} · تلفن: ${store.phone || ''}`, width / 2, footerY + 35);

  ctx.font = '12px "Vazirmatn", Tahoma, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('سامانه رسمی مدیریت مبادلات طلا و سکه زرسا · ثبت آنی در دفتر خریدهای گالری', width / 2, footerY + 60);
  ctx.restore();

  return canvas;
}

export function downloadPurchaseReceiptPNG(receipt: PurchaseInvoice, store: StoreSettings) {
  const canvas = renderPurchaseReceiptToCanvas(receipt, store);
  const link = document.createElement('a');
  link.download = `رسید-خرید-طلا-${receipt.receiptNumber}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Trigger immediate download of the purchase receipt as standard A4 PDF.
 */
export function downloadPurchaseReceiptPDF(receipt: PurchaseInvoice, store: StoreSettings) {
  const canvas = renderPurchaseReceiptToCanvas(receipt, store);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pdfWidth = 210;
  const pdfHeight = 297;
  
  // Calculate proportional size to fit perfectly within A4 margins
  let imgWidth = pdfWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  if (imgHeight > pdfHeight) {
    imgHeight = pdfHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }
  
  const xOffset = (pdfWidth - imgWidth) / 2;
  const yOffset = (pdfHeight - imgHeight) / 2;
  
  pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
  pdf.save(`رسید-خرید-طلا-${receipt.receiptNumber}.pdf`);
}
