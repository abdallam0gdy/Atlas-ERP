require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initWhatsAppDatabase } = require('./db');
const {
  startWhatsAppClient,
  startAutoScheduleTicker,
} = require('./whatsappClient');
const whatsappRoutes = require('./routes');

// Prevent internal Baileys socket closure rejections from crashing the daemon
process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  if (msg.includes('Connection Closed') || msg.includes('Timed Out') || reason?.isBoom) {
    console.warn('⚠️ [WhatsApp Guard] تخطي خطأ اتصال عابر:', msg);
    return;
  }
  console.error('⚠️ [WhatsApp UnhandledRejection]:', reason);
});

process.on('uncaughtException', (err) => {
  const msg = err?.message || String(err);
  if (msg.includes('Connection Closed') || msg.includes('Timed Out') || err?.isBoom) {
    console.warn('⚠️ [WhatsApp Guard] تخطي استثناء اتصال عابر:', msg);
    return;
  }
  console.error('❌ [WhatsApp UncaughtException]:', err);
});

const app = express();
const PORT = parseInt(process.env.WA_PORT, 10) || 5055;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Atlas Standalone WhatsApp System',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', whatsappRoutes);

async function bootstrap() {
  try {
    console.log('══════════════════════════════════════════════════════════');
    console.log('   📲 بدء تشغيل منظومة واتساب أطلس المستقلة (whatsapp-system)');
    console.log('══════════════════════════════════════════════════════════');

    await initWhatsAppDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 [WhatsApp Service] يعمل الآن على المنفذ: http://127.0.0.1:${PORT}`);
    });

    await startWhatsAppClient();
    startAutoScheduleTicker();
  } catch (err) {
    console.error('❌ [WhatsApp Service] فشل التشغيل:', err);
    process.exit(1);
  }
}

bootstrap();
