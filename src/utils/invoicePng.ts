import { SaleInvoice, StoreSettings } from '../types';
import { jsPDF } from 'jspdf';

/**
 * Utility to render high-resolution, luxury Iranian Gold Gallery invoices to Canvas and export as PNG.
 */
export function renderInvoiceToCanvas(invoice: SaleInvoice, store: StoreSettings): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // High resolution for crisp printing and mobile viewing (1200x1700)
  const width = 1200;
  const height = 1700;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Luxury Warm Ivory Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#fdfbf7');
  bgGrad.addColorStop(1, '#f7f2e7');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle paper grain / micro texture pattern
  ctx.save();
  ctx.fillStyle = 'rgba(212, 175, 55, 0.03)';
  for (let i = 0; i < width; i += 60) {
    for (let j = 0; j < height; j += 60) {
      if ((i + j) % 120 === 0) {
        ctx.fillRect(i, j, 30, 30);
      }
    }
  }
  ctx.restore();

  // 2. Ornate Double Gold Borders
  ctx.save();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.strokeStyle = '#b89320';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // Corner ornaments
  const drawCorner = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();

    ctx.fillStyle = '#b89320';
    ctx.beginPath();
    ctx.arc(6, 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCorner(52, 52, 0);
  drawCorner(width - 52, 52, Math.PI / 2);
  drawCorner(width - 52, height - 52, Math.PI);
  drawCorner(52, height - 52, -Math.PI / 2);
  ctx.restore();

  // 3. Watermark in the center
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = 'bold 110px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.04)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(store.watermarkText || store.name, 0, 0);
  ctx.restore();

  // Helpers for text
  const formatToman = (val: number) => val.toLocaleString('fa-IR') + ' تومان';
  const toFaDigits = (val: string | number) => String(val).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);

  // 4. HEADER SECTION
  let y = 75;

  // Luxury Gold Logo Medallion
  ctx.save();
  const logoCenterY = y + 24;
  ctx.beginPath();
  ctx.arc(width / 2, logoCenterY, 32, 0, Math.PI * 2);
  const medallionGrad = ctx.createLinearGradient(width / 2 - 32, logoCenterY - 32, width / 2 + 32, logoCenterY + 32);
  medallionGrad.addColorStop(0, '#ffe8a3');
  medallionGrad.addColorStop(0.5, '#d4af37');
  medallionGrad.addColorStop(1, '#997316');
  ctx.fillStyle = medallionGrad;
  ctx.fill();

  ctx.strokeStyle = '#997316';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, logoCenterY, 27, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font = '900 24px Vazirmatn, serif';
  ctx.fillStyle = '#1c1c22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Z', width / 2, logoCenterY + 2);
  ctx.restore();

  y += 70;
  // Store Name
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 42px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#1c1917';
  ctx.fillText(store.name || 'گالری طلا و جواهر زرسا', width / 2, y);

  if (store.ownerName) {
    y += 30;
    ctx.font = 'bold 18px Vazirmatn, Tahoma, sans-serif';
    ctx.fillStyle = '#78716c';
    ctx.fillText(`با مدیریت: ${store.ownerName}`, width / 2, y);
  }

  y += 34;
  ctx.font = 'bold 22px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#b89320';
  ctx.fillText('فاکتور رسمی و شناسنامه فروش طلا و مسکوکات', width / 2, y);
  ctx.restore();

  // Top info bar (Invoice # & Date)
  y += 32;
  ctx.save();
  ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1;
  const barW = width - 140;
  const barH = 50;
  const barX = 70;
  ctx.beginPath();
  ctx.roundRect(barX, y, barW, barH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 18px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#292524';
  
  // Right: Invoice number
  ctx.textAlign = 'right';
  ctx.fillText(`شماره فاکتور: #${toFaDigits(invoice.invoiceNumber)}`, barX + barW - 20, y + 32);

  // Center: Date & Time
  ctx.textAlign = 'center';
  ctx.fillText(`تاریخ: ${toFaDigits(invoice.dateFa)}  ·  ساعت: ${toFaDigits(invoice.timeFa)}`, width / 2, y + 32);

  // Left: Official Gold rate of day
  ctx.textAlign = 'left';
  if (store.invoicePrintSettings?.showRawGoldRate ?? true) {
    ctx.fillText(`نرخ طلا ۱۸: ${formatToman(invoice.goldPrice)}`, barX + 20, y + 32);
  }
  ctx.restore();

  // 5. CUSTOMER INFORMATION BOX
  y += barH + 20;
  ctx.save();
  const custW = width - 140;
  const custH = 75;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(barX, y, custW, custH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 19px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'right';

  // If customer name was skipped, show an empty underline space
  if (invoice.customerName && invoice.customerName.trim()) {
    ctx.fillText(`خریدار: ${invoice.customerName.trim()}`, barX + custW - 20, y + 45);
  } else {
    ctx.fillStyle = '#a8a29e';
    ctx.fillText('خریدار:  ................................................', barX + custW - 20, y + 45);
  }

  if (invoice.customerPhone && invoice.customerPhone.trim()) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#57534e';
    ctx.fillText(`شماره تماس: ${toFaDigits(invoice.customerPhone.trim())}`, barX + 20, y + 45);
  } else {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a8a29e';
    ctx.fillText('شماره تماس:  ................................', barX + 20, y + 45);
  }
  ctx.restore();

  // 6. ITEM SPECIFICATION TABLE
  y += custH + 24;
  const tableX = barX;
  const tableW = custW;
  
  // Table Header
  const headerH = 46;
  ctx.save();
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.roundRect(tableX, y, tableW, headerH, [10, 10, 0, 0]);
  ctx.fill();

  ctx.font = 'bold 17px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'right';
  ctx.fillText('شرح و مشخصات کالا', tableX + tableW - 20, y + 30);

  ctx.textAlign = 'center';
  ctx.fillText('وزن (گرم)', tableX + tableW - 420, y + 30);
  ctx.fillText('عیار', tableX + tableW - 550, y + 30);
  
  if (store.invoicePrintSettings?.showRawGoldRate ?? true) {
    ctx.fillText('نرخ روز (تومان)', tableX + tableW - 730, y + 30);
  }

  ctx.textAlign = 'left';
  if (store.invoicePrintSettings?.showRawGoldValue ?? true) {
    ctx.fillText('ارزش طلا خام (تومان)', tableX + 20, y + 30);
  } else {
    ctx.fillText('ارزش کالا (تومان)', tableX + 20, y + 30);
  }
  ctx.restore();

  // Table Body Row
  y += headerH;
  const rowH = 75;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d6d3d1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tableX, y, tableW, rowH, [0, 0, 10, 10]);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 20px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'right';
  ctx.fillText(invoice.itemTitle || 'طلای ساخته‌شده ۱۸ عیار', tableX + tableW - 20, y + 46);

  ctx.font = 'bold 20px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${toFaDigits(invoice.weight)} g`, tableX + tableW - 420, y + 46);
  ctx.fillText(toFaDigits(invoice.karat || '۱۸'), tableX + tableW - 550, y + 46);
  
  if (store.invoicePrintSettings?.showRawGoldRate ?? true) {
    ctx.fillText(invoice.goldPrice.toLocaleString('fa-IR'), tableX + tableW - 730, y + 46);
  } else {
    ctx.fillText('---', tableX + tableW - 730, y + 46);
  }

  ctx.textAlign = 'left';
  if (store.invoicePrintSettings?.showRawGoldValue ?? true) {
    ctx.fillText(invoice.rawGoldAmount.toLocaleString('fa-IR'), tableX + 20, y + 46);
  } else {
    ctx.fillText('---', tableX + 20, y + 46);
  }
  ctx.restore();

  // 7. FINANCIAL BREAKDOWN CARD
  y += rowH + 20;
  
  let rowsCount = 0;
  if (store.invoicePrintSettings?.showFee ?? true) rowsCount++;
  if ((store.invoicePrintSettings?.showProfit ?? true) && invoice.profitAmount > 0) rowsCount++;
  if (store.invoicePrintSettings?.showTax ?? true) rowsCount++;
  if (invoice.discountAmount > 0) rowsCount++;
  
  const breakH = Math.max(50, rowsCount * 34 + 20);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tableX, y, tableW, breakH, 12);
  ctx.fill();
  ctx.stroke();

  let curBreakY = y + 32;
  const drawBreakRow = (label: string, value: string, isGold = false, isDiscount = false) => {
    ctx.font = '17px Vazirmatn, Tahoma, sans-serif';
    ctx.fillStyle = '#57534e';
    ctx.textAlign = 'right';
    ctx.fillText(label, tableX + tableW - 25, curBreakY);

    ctx.font = isGold ? 'bold 19px Vazirmatn, Tahoma, sans-serif' : 'bold 18px Vazirmatn, Tahoma, sans-serif';
    ctx.fillStyle = isDiscount ? '#dc2626' : (isGold ? '#b89320' : '#1c1917');
    ctx.textAlign = 'left';
    ctx.fillText(value, tableX + 25, curBreakY);
    curBreakY += 34;
  };

  const feeLabel = invoice.feePercent 
    ? `اجرت ساخت کارگاه (${toFaDigits(invoice.feePercent)}٪):` 
    : 'اجرت ساخت کارگاه (مقطوع):';

  if (store.invoicePrintSettings?.showFee ?? true) {
    drawBreakRow(feeLabel, formatToman(invoice.feeAmount));
  }

  if ((store.invoicePrintSettings?.showProfit ?? true) && invoice.profitAmount > 0) {
    drawBreakRow(`سود قانونی طلافروش (${toFaDigits(invoice.profitPercent || 7)}٪):`, formatToman(invoice.profitAmount));
  }

  if (store.invoicePrintSettings?.showTax ?? true) {
    if (invoice.taxAmount > 0) {
      drawBreakRow(`مالیات بر ارزش افزوده (${toFaDigits(invoice.taxPercent || 9)}٪ روی سود و اجرت):`, formatToman(invoice.taxAmount));
    } else {
      drawBreakRow('مالیات بر ارزش افزوده:', 'معاف / عدم احتساب');
    }
  }

  if (invoice.discountAmount > 0) {
    drawBreakRow('تخفیف ویژه فروشگاه:', `-${formatToman(invoice.discountAmount)}`, false, true);
  }
  ctx.restore();

  // 8. FINAL PAYABLE AMOUNT HERO CARD
  y += breakH + 20;
  const totalH = 95;
  ctx.save();
  const totalGrad = ctx.createLinearGradient(tableX, y, tableX + tableW, y + totalH);
  totalGrad.addColorStop(0, '#1c1917');
  totalGrad.addColorStop(1, '#0c0a09');
  ctx.fillStyle = totalGrad;
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(tableX, y, tableW, totalH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 22px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#e7e5e4';
  ctx.textAlign = 'right';
  ctx.fillText('مبلغ کل قابل پرداخت (تسویه نهایی):', tableX + tableW - 25, y + 56);

  ctx.textAlign = 'left';
  ctx.font = '900 36px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(`${invoice.totalAmount.toLocaleString('fa-IR')} تومان`, tableX + 25, y + 60);
  ctx.restore();

  // 9. GUARANTEE CLAUSE, OFFICIAL STAMP, SECURITY BARCODE & HOLOGRAM
  y += totalH + 24;
  ctx.save();
  
  if (store.invoicePrintSettings?.showTerms ?? true) {
    ctx.font = '14px Vazirmatn, Tahoma, sans-serif';
    ctx.fillStyle = '#78716c';
    ctx.textAlign = 'right';
    ctx.fillText('تعهدنامه اصالت: کلیه مصنوعات این فاکتور با عیار استاندارد ۷۵۰ (۱۸ عیار) طبق موازین رسمی اتحادیه طلا و جواهر عرضه شده است.', tableX + tableW, y + 18);
    ctx.fillText('تعویض یا بازخرید طلا تنها با ارائه اصل این برگ فاکتور معتبر و مطابق نرخ روز بازار انجام می‌پذیرد.', tableX + tableW, y + 40);
  }

  // Security Barcode (Left Side)
  if (store.invoicePrintSettings?.showQR ?? true) {
    const barcodeX = tableX + 20;
    const barcodeY = y + 65;
    ctx.save();
    ctx.fillStyle = '#1c1917';
    const pattern = [2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2, 1, 3, 2, 1, 2];
    let curX = barcodeX;
    for (let i = 0; i < pattern.length; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(curX, barcodeY, pattern[i] * 1.5, 42);
      }
      curX += pattern[i] * 1.5 + 1.2;
    }
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`IR-GOLD-${invoice.invoiceNumber || '1001'}`, barcodeX + (curX - barcodeX) / 2, barcodeY + 56);
    ctx.restore();
  }

  // Security Gold Hologram (Right Side)
  const holoX = tableX + tableW - 80;
  const holoY = y + 88;
  const holoRadius = 40;
  ctx.save();
  const holoGrad = ctx.createRadialGradient(holoX - 10, holoY - 10, 5, holoX, holoY, holoRadius);
  holoGrad.addColorStop(0, '#fff6cc');
  holoGrad.addColorStop(0.3, '#ffd700');
  holoGrad.addColorStop(0.65, '#b8860b');
  holoGrad.addColorStop(0.85, '#d4af37');
  holoGrad.addColorStop(1, '#8b6914');
  ctx.fillStyle = holoGrad;
  ctx.beginPath();
  ctx.arc(holoX, holoY, holoRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(holoX, holoY, holoRadius - 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(139, 105, 20, 0.8)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(holoX, holoY, holoRadius - 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4a3809';
  ctx.font = 'bold 9px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('ضمانت اصالت', holoX, holoY - 11);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('★ ۷۵۰ ★', holoX, holoY + 4);
  ctx.font = 'bold 8px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('هولوگرام امنیتی', holoX, holoY + 17);
  ctx.restore();

  // Official Stamp simulation
  const stampX = width / 2 - 20;
  const stampY = y + 88;
  if (store.invoicePrintSettings?.showStamp ?? true) {
    ctx.save();
    ctx.translate(stampX, stampY);
    ctx.rotate(-0.06);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 95, 42, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 88, 35, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 15px Vazirmatn, Tahoma, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText(store.stamp || store.name || 'گالری زرسا', 0, -8);
    ctx.font = '12px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText('تایید و تسویه شد', 0, 15);
    ctx.restore();
  }

  // Store signature line
  if (store.invoicePrintSettings?.showFingerprint ?? true) {
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px Vazirmatn, Tahoma, sans-serif';
    ctx.fillStyle = '#44403c';
    ctx.fillText(store.signature || 'امضاء و مهر رسمی فروشنده', stampX + 115, y + 88);
  }
  ctx.restore();

  // 10. FOOTER CONTACT
  y = height - 90;
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tableX, y);
  ctx.lineTo(tableX + tableW, y);
  ctx.stroke();

  y += 24;
  ctx.font = 'bold 15px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#44403c';
  ctx.textAlign = 'center';
  const phoneText = store.phone ? `تلفن: ${toFaDigits(store.phone)}` : '';
  const postText = store.postalCode ? `کد پستی: ${toFaDigits(store.postalCode)}` : '';
  const instaText = store.instagram ? `اینستاگرام: @${store.instagram}` : '';
  const addrText = store.address ? `نشانی: ${store.address}` : '';
  const fullContact = [phoneText, postText, instaText, addrText].filter(Boolean).join('  ·  ');
  ctx.fillText(fullContact || 'گالری طلا و جواهر زرسا · سامانه صدور فاکتور الکترونیک', width / 2, y);

  y += 24;
  ctx.font = '12px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#a8a29e';
  ctx.fillText('این فاکتور با بارکد و هولوگرام امنیتی معتبر و تحت نظارت اتحادیه صادر شده است.', width / 2, y);
  ctx.restore();

  return canvas;
}

/**
 * Trigger immediate download of the invoice as PNG.
 */
export function downloadInvoicePNG(invoice: SaleInvoice, store: StoreSettings) {
  const canvas = renderInvoiceToCanvas(invoice, store);
  const dataUrl = canvas.toDataURL('image/png', 0.98);
  const link = document.createElement('a');
  link.download = `factor-${invoice.invoiceNumber || Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Trigger immediate download of the invoice as standard A4 PDF.
 */
export function downloadInvoicePDF(invoice: SaleInvoice, store: StoreSettings) {
  const canvas = renderInvoiceToCanvas(invoice, store);
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
  pdf.save(`factor-${invoice.invoiceNumber || Date.now()}.pdf`);
}

/**
 * Get PNG as Blob for direct sharing.
 */
export function getInvoiceBlob(invoice: SaleInvoice, store: StoreSettings): Promise<Blob | null> {
  const canvas = renderInvoiceToCanvas(invoice, store);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.98);
  });
}

/**
 * Share invoice PNG via native Web Share API (WhatsApp, Telegram, etc.)
 */
export async function shareInvoiceImage(invoice: SaleInvoice, store: StoreSettings): Promise<boolean> {
  try {
    const blob = await getInvoiceBlob(invoice, store);
    if (!blob) return false;
    const file = new File([blob], `factor-${invoice.invoiceNumber || 'gold'}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `فاکتور طلا #${invoice.invoiceNumber} - ${store.name}`,
        text: `فاکتور رسمی فروش طلا #${invoice.invoiceNumber} از ${store.name}`,
        files: [file]
      });
      return true;
    }
  } catch (e: any) {
    if (e.name === 'AbortError') return true;
  }
  return false;
}
