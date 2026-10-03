import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();

const app = express();
app.use(express.json({ limit: '50mb' }));

const SETTINGS_FILE = path.join(ROOT_DIR, 'settings.json');

// Initialize Gemini SDK safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const DEFAULT_SETTINGS = {
  goldPrice: 3450000,
  globalOunce: 2034.50,
  dailyNote: 'اعتبار قیمت‌ها تا ساعت ۱۸ امروز معتبر است',
  store: {
    name: 'گالری طلا زرسا',
    address: 'تهران، کریم‌خان، مجتمع طلا، طبقه همکف، پلاک ۵',
    phone: '۰۲۱-۱۲۳۴۵۶۷۸',
    instagram: 'zarsa.gold',
    logo: '/assets/app-icon.svg',
    watermarkText: 'Zarsa Gold Gallery'
  },
  coins: [
    { id: '1', name: 'سکه امامی (جدید)', weight: 8.133, karat: '22', feeType: 'percentage', feeFixed: 0, feePercentage: 0, tax: 0, bubble: 3000000, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T) + H', isHidden: false },
    { id: '2', name: 'سکه بهار آزادی (قدیم)', weight: 8.133, karat: '22', feeType: 'percentage', feeFixed: 0, feePercentage: 0, tax: 0, bubble: 2500000, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T) + H', isHidden: false },
    { id: '3', name: 'نیم سکه بهار آزادی', weight: 4.066, karat: '22', feeType: 'percentage', feeFixed: 0, feePercentage: 0, tax: 0, bubble: 1800000, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T) + H', isHidden: false },
    { id: '4', name: 'ربع سکه بهار آزادی', weight: 2.033, karat: '22', feeType: 'percentage', feeFixed: 0, feePercentage: 0, tax: 0, bubble: 1200000, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T) + H', isHidden: false },
    { id: '5', name: 'سکه گرمی بانک مرکزی', weight: 1.011, karat: '22', feeType: 'percentage', feeFixed: 0, feePercentage: 0, tax: 0, bubble: 800000, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T) + H', isHidden: false },
    { id: '6', name: 'مثقال طلا عیار ۱۷', weight: 4.6083, karat: '17', feeType: 'percentage', feeFixed: 0, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: false, manualFormula: 'G * W', isHidden: false }
  ],
  parsians: [
    { id: 'p1', name: 'شمش پارسیان ۰.۰۵۰ گرم', weight: 0.05, karat: '18', feeType: 'per-gram', feeFixed: 150000, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T)', isHidden: false },
    { id: 'p2', name: 'شمش پارسیان ۰.۱۰۰ گرم', weight: 0.1, karat: '18', feeType: 'per-gram', feeFixed: 150000, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T)', isHidden: false },
    { id: 'p3', name: 'شمش پارسیان ۰.۲۰۰ گرم', weight: 0.2, karat: '18', feeType: 'per-gram', feeFixed: 150000, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T)', isHidden: false },
    { id: 'p4', name: 'شمش پارسیان ۰.۳۰۰ گرم', weight: 0.3, karat: '18', feeType: 'per-gram', feeFixed: 150000, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T)', isHidden: false },
    { id: 'p5', name: 'شمش پارسیان ۰.۵۰۰ گرم', weight: 0.5, karat: '18', feeType: 'per-gram', feeFixed: 150000, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T)', isHidden: false },
    { id: 'p6', name: 'شمش پارسیان ۱.۰۰۰ گرم', weight: 1.0, karat: '18', feeType: 'per-gram', feeFixed: 150000, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T)', isHidden: false },
    { id: 'p7', name: 'شمش پارسیان ۱.۵۰۰ گرم', weight: 1.5, karat: '18', feeType: 'per-gram', feeFixed: 150000, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T)', isHidden: false },
    { id: 'p8', name: 'شمش پارسیان ۲.۰۰۰ گرم', weight: 2.0, karat: '18', feeType: 'per-gram', feeFixed: 150000, feePercentage: 0, tax: 0, bubble: 0, stepEnabled: true, manualFormula: '(G + A) * W * (1 + T)', isHidden: false }
  ],
  theme: {
    id: 'sophisticated-dark',
    name: 'تیره لاکچری (Sophisticated Dark)',
    backgroundColor: '#0a0a0a',
    backgroundGradientStart: '#111111',
    backgroundGradientEnd: '#000000',
    useGradient: true,
    backgroundImage: '',
    titleColor: '#d4af37',
    priceColor: '#ffebd3',
    labelColor: '#888888',
    cardColor: '#161616',
    cardBorderColor: '#d4af3733',
    cardOpacity: 0.9,
    watermarkOpacity: 0.3
  },
  blocks: [
    { id: 'b-header', type: 'store-header', name: 'لوگو و هدر فروشگاه', x: 110, y: 40, width: 860, height: 100, rotation: 0, borderRadius: 0, content: 'گالری طلا زرسا', fontSize: 32, fontFamily: 'Vazirmatn', fontWeight: 'bold', fontStyle: 'normal', color: '#d4af37', backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, shadowBlur: 0, shadowColor: 'transparent', shadowOffsetX: 0, shadowOffsetY: 0, padding: 10, isLocked: false, isHidden: false, textAlign: 'center' },
    { id: 'b-gold', type: 'gold-price', name: 'کارت قیمت طلا ۱۸ عیار', x: 140, y: 160, width: 800, height: 110, rotation: 0, borderRadius: 20, content: '', fontSize: 24, fontFamily: 'Vazirmatn', fontWeight: 'bold', fontStyle: 'normal', color: '#d4af37', backgroundColor: '#161616', borderColor: '#d4af3733', borderWidth: 1, opacity: 1, shadowBlur: 10, shadowColor: 'rgba(214,175,55,0.1)', shadowOffsetX: 0, shadowOffsetY: 4, padding: 15, isLocked: false, isHidden: false, textAlign: 'center' },
    { id: 'b-coins', type: 'coins-list', name: 'لیست قیمت سکه‌ها', x: 140, y: 290, width: 800, height: 280, rotation: 0, borderRadius: 20, content: '', fontSize: 18, fontFamily: 'Vazirmatn', fontWeight: 'normal', fontStyle: 'normal', color: '#f5f2ed', backgroundColor: '#161616', borderColor: 'transparent', borderWidth: 0, opacity: 0.95, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)', shadowOffsetX: 0, shadowOffsetY: 4, padding: 20, isLocked: false, isHidden: false, textAlign: 'right' },
    { id: 'b-parsian', type: 'parsian-list', name: 'لیست قیمت پارسیان', x: 140, y: 590, width: 800, height: 280, rotation: 0, borderRadius: 20, content: '', fontSize: 18, fontFamily: 'Vazirmatn', fontWeight: 'normal', fontStyle: 'normal', color: '#f5f2ed', backgroundColor: '#161616', borderColor: 'transparent', borderWidth: 0, opacity: 0.95, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)', shadowOffsetX: 0, shadowOffsetY: 4, padding: 20, isLocked: false, isHidden: false, textAlign: 'right' },
    { id: 'b-note', type: 'note', name: 'یادداشت زیرین', x: 140, y: 890, width: 800, height: 50, rotation: 0, borderRadius: 0, content: 'اعتبار قیمت‌ها تا ساعت ۱۸ امروز معتبر است', fontSize: 13, fontFamily: 'Vazirmatn', fontWeight: 'normal', fontStyle: 'italic', color: '#888888', backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, shadowBlur: 0, shadowColor: 'transparent', shadowOffsetX: 0, shadowOffsetY: 0, padding: 5, isLocked: false, isHidden: false, textAlign: 'center' },
    { id: 'b-footer', type: 'footer', name: 'اطلاعات تماس و اینستاگرام', x: 100, y: 960, width: 880, height: 60, rotation: 0, borderRadius: 0, content: '', fontSize: 13, fontFamily: 'Vazirmatn', fontWeight: 'normal', fontStyle: 'normal', color: '#888888', backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 1, shadowBlur: 0, shadowColor: 'transparent', shadowOffsetX: 0, shadowOffsetY: 0, padding: 5, isLocked: false, isHidden: false, textAlign: 'center' },
    { id: 'b-watermark', type: 'watermark', name: 'واترمارک پس‌زمینه (Zarsa)', x: 90, y: 450, width: 900, height: 200, rotation: -25, borderRadius: 0, content: 'ZARSA GOLD', fontSize: 72, fontFamily: 'Vazirmatn', fontWeight: 'bold', fontStyle: 'normal', color: 'rgba(212,175,55,0.04)', backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0, opacity: 0.5, isLocked: true, isHidden: false, textAlign: 'center' }
  ],
  outputDirectory: 'C:/GoldStory/Outputs'
};

// Ensure settings exist at startup
function ensureSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Failed to write default settings:', err);
  }
}
ensureSettings();

// Load settings API
app.get('/api/settings', (req, res) => {
  try {
    ensureSettings();
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read settings.' });
  }
});

// Save settings API
app.get('/api/check-engine', (req, res) => {
  res.json({ status: "ok", engine: "GoldStory Advanced Engine v2.4", user: "mm77kh7@gmail.com" });
});

app.post('/api/settings', (req, res) => {
  try {
    const updated = req.body;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write settings file.' });
  }
});

// AI Template styling generator
app.post('/api/ai-template', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'باید فیلد توصیف ایده قالب خود را وارد کنید.' });
    }

    if (!ai) {
      // Fallback if no API key is specified (simulated AI logic based on colors)
      const keywordColors: Record<string, any> = {
        'یاقوت': { bg: '#100208', gst: '#2a0515', gend: '#060002', tc: '#ffd3df', pc: '#ffd3df', lc: '#8a6273', cc: '#1d0913', cbc: '#ffaec522' },
        'زمرد': { bg: '#021008', gst: '#052a12', gend: '#000402', tc: '#d3ffdf', pc: '#d3ffdf', lc: '#628a6e', cc: '#091d10', cbc: '#aeffc522' },
        'فیروزه': { bg: '#020f12', gst: '#05272d', gend: '#000204', tc: '#d3fbff', pc: '#d3fbff', lc: '#62858a', cc: '#091c1f', cbc: '#aefffe22' },
        'روشن': { bg: '#faf8f5', gst: '#ffffff', gend: '#f2eae0', tc: '#70520a', pc: '#2a1a00', lc: '#8a857d', cc: '#ffffff', cbc: '#70520a22' },
        'یاقوتی': { bg: '#100208', gst: '#2a0515', gend: '#060002', tc: '#ffd3df', pc: '#ffd3df', lc: '#8a6273', cc: '#1d0913', cbc: '#ffaec522' },
        'زمردی': { bg: '#021008', gst: '#052a12', gend: '#000402', tc: '#d3ffdf', pc: '#d3ffdf', lc: '#628a6e', cc: '#091d10', cbc: '#aeffc522' },
        'نئون': { bg: '#050010', gst: '#15052d', gend: '#020006', tc: '#b98bff', pc: '#e0caff', lc: '#79669e', cc: '#0d041e', cbc: '#c6a5ff44' }
      };

      let selected = keywordColors['یاقوتی'];
      for (const k in keywordColors) {
        if (prompt.includes(k)) {
          selected = keywordColors[k];
          break;
        }
      }

      const generated = {
        backgroundColor: selected.bg,
        backgroundGradientStart: selected.gst,
        backgroundGradientEnd: selected.gend,
        useGradient: true,
        titleColor: selected.tc,
        priceColor: selected.pc,
        labelColor: selected.lc,
        cardColor: selected.cc,
        cardBorderColor: selected.cbc,
        accentColor: selected.tc,
        fontFamily: prompt.includes('صمیم') ? 'Samim' : prompt.includes('وزیر') ? 'Vazirmatn' : 'Lalezar',
        description: `قالب شبیه‌سازی شده بر اساس کلیدواژه‌های "${prompt}". برای تجربه هوشمند واقعی، کلید رمز خانوادگی را در Secret تنظیم کنید.`
      };
      return res.json({ generated });
    }

    // Call Gemini API to perform design tasks with Type safety and structure
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are an elite Iranian UI/UX graphic jewelry photographer and master Instagram Story template designer.
Based on the shop name "گالری طلا زرسا" and the Iranian golden luxury context, design a bespoke matching colors scheme & typography suite representing the prompt: "${prompt}".

Choose elegant, high-contrast, premium metallic gold or matching jewel tone vibes (matte obsidian, royal crimson, vivid emerald, deep navy, champagne gold etc.).
Return JSON representing the generated styling attributes strictly. Only return hex color codes.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'backgroundColor', 'backgroundGradientStart', 'backgroundGradientEnd',
            'useGradient', 'titleColor', 'priceColor', 'labelColor', 'cardColor',
            'cardBorderColor', 'accentColor', 'fontFamily', 'description'
          ],
          properties: {
            backgroundColor: { type: Type.STRING, description: 'Dark primary background base hex color e.g. #0c0d12' },
            backgroundGradientStart: { type: Type.STRING, description: 'Gradient start hex color code' },
            backgroundGradientEnd: { type: Type.STRING, description: 'Gradient finish hex color code' },
            useGradient: { type: Type.BOOLEAN, description: 'Whether to use dual color gradient' },
            titleColor: { type: Type.STRING, description: 'Contrasting elegant heading text color' },
            priceColor: { type: Type.STRING, description: 'Vivid eye-catching gold or white tone for figures' },
            labelColor: { type: Type.STRING, description: 'Muted subtitle color' },
            cardColor: { type: Type.STRING, description: 'Opaque overlay card panel background hex color with transparency placeholder e.g. #161616' },
            cardBorderColor: { type: Type.STRING, description: 'Slight gold-glow border hex color' },
            accentColor: { type: Type.STRING, description: 'Border or badge glowing color tone' },
            fontFamily: { type: Type.STRING, description: 'Suggested Iranian custom font family, choose from: Vazirmatn, Lalezar, JetBrains Mono' },
            description: { type: Type.STRING, description: 'Persian explanation describing this luxury master template concept to the user.' }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ generated: parsed });
  } catch (err: any) {
    console.error('Gemini Design Generator Error:', err);
    res.status(500).json({ error: 'خطایی در تولید پوسته هوشمند رخ داد. جزئیات بیشتر: ' + err.message });
  }
});

// AI OCR for Iranian Bank Cards (Card Number, Sheba/IBAN, Account Owner, Bank Name)
app.post('/api/ocr-bank-card', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'تصویر کارت بانکی ارسال نشده است.' });
    }

    if (!ai) {
      return res.json({ 
        success: false,
        fallback: true,
        message: 'عکس کارت ذخیره شد (کلید هوش مصنوعی فعال نیست، مشخصات را دستی بررسی کنید).' 
      });
    }

    // Extract mime type and clean base64
    const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = image.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, '');

    let extracted: any = null;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              {
                text: `You are an expert Iranian bank card OCR and vision specialist.
Carefully examine this Iranian bank card photo.
Extract:
1. "cardNumber": The 16-digit card number. Return ONLY the 16 digits as a string with no spaces or dashes (e.g. "6037991823456789").
2. "shabaNumber": The Iranian IBAN/Sheba number if printed on the card. Must start with "IR" followed by 24 digits (26 characters total, e.g. "IR120120000000000000000000"). If not present, return empty string.
3. "accountOwnerName": The cardholder's first and last name printed on the card in Persian or English (e.g. "محمدرضا خلیلی"). If not present, return empty string.
4. "bankName": The name of the Iranian bank printed on the card or inferred from the 6-digit prefix (e.g. "بانک ملی ایران", "بانک ملت", "بانک صادرات", "بانک تجارت", "بانک سامان", "بانک پاسارگاد", "بلوبانک", "بانک رسالت", etc.).

Return the extracted values strictly adhering to the JSON schema.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: ['cardNumber'],
            properties: {
              cardNumber: { type: Type.STRING, description: '16 digit bank card number' },
              shabaNumber: { type: Type.STRING, description: 'IBAN number starting with IR' },
              accountOwnerName: { type: Type.STRING, description: 'Cardholder name' },
              bankName: { type: Type.STRING, description: 'Name of the issuing bank' }
            }
          }
        }
      });
      extracted = JSON.parse(response.text || '{}');
    } catch (modelErr: any) {
      console.warn('Primary model failed or unauthorized:', modelErr?.message);
    }

    if (extracted && (extracted.cardNumber || extracted.shabaNumber)) {
      return res.json({
        success: true,
        data: {
          cardNumber: (extracted.cardNumber || '').replace(/[^0-9]/g, '').slice(0, 16),
          shabaNumber: (extracted.shabaNumber || '').trim().toUpperCase(),
          accountOwnerName: (extracted.accountOwnerName || '').trim(),
          bankName: (extracted.bankName || '').trim()
        }
      });
    }

    // Fallback response if AI is unauthenticated or failed to parse
    return res.json({
      success: false,
      fallback: true,
      message: 'عکس کارت ذخیره گردید. شماره کارت و شبا را می‌توانید دستی تکمیل یا بازبینی کنید.'
    });
  } catch (err: any) {
    console.error('Bank Card OCR Error:', err);
    res.json({ 
      success: false, 
      fallback: true,
      message: 'عکس کارت ذخیره شد. لطفاً اطلاعات را به صورت دستی وارد نمایید.' 
    });
  }
});

// Serve frontend files
// In non-dev, serve from dist/
const isDev = process.env.NODE_ENV !== 'production';

if (!isDev) {
  const distPath = path.join(ROOT_DIR, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Integration with Vite
  const vite = await import('vite');
  const viteServer = await vite.createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(viteServer.middlewares);
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`GoldStory running behind nginx proxy on port ${PORT}`);
});
