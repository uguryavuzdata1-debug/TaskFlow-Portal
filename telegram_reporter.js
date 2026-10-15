require('dotenv').config();
const { createClient } = require('@libsql/client');

// Initialize Turso DB connection
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Returns YYYY-MM-DD for local system time
 */
function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Turkish formatted date string: "13 Ekim 2026 (Salı)"
 */
function formatTurkishDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const monthName = months[parseInt(month) - 1] || month;
  const dayName = days[d.getDay()] || '';
  return `${parseInt(day)} ${monthName} ${year} (${dayName})`;
}

/**
 * Fetch daily data from Turso
 */
async function fetchDailyData(targetDate) {
  const dateStr = targetDate || getLocalDateString();

  // 1. Tickets (with Customer join)
  const ticketsRes = await db.execute({
    sql: `SELECT 
            t.id, 
            t.ticket_no, 
            t.ticket_title, 
            t.ticketstatus, 
            t.ticketpriorities,
            COALESCE(NULLIF(t.customer_name, ''), c.organization_name, t.company, '') as customer_name,
            t.company, 
            COALESCE(u.full_name, t.assigned_user_id) as assigned_user_id, 
            t.createdtime, 
            t.modifiedtime, 
            t.solution,
            c.organization_name
          FROM vt_tickets t
          LEFT JOIN vt_customers c ON (c.id = '11x' || t.parent_id OR c.id = t.parent_id)
          LEFT JOIN vt_users u ON (u.id = t.assigned_user_id)
          WHERE substr(t.createdtime, 1, 10) = ? OR substr(t.modifiedtime, 1, 10) = ?
          GROUP BY t.id
          ORDER BY t.modifiedtime DESC`,
    args: [dateStr, dateStr]
  });

  // 2. Portal Records
  let records = [];
  try {
    const recordsRes = await db.execute({
      sql: `SELECT id, customer_name, service_type, status, total_price, assigned_to, created_at, updated_at
            FROM records 
            WHERE substr(created_at, 1, 10) = ? OR substr(updated_at, 1, 10) = ?
            ORDER BY created_at DESC`,
      args: [dateStr, dateStr]
    });
    records = recordsRes.rows;
  } catch (e) {
    // If records table query fails
  }

  // 3. Quotes
  let quotes = [];
  try {
    const quotesRes = await db.execute({
      sql: `SELECT id, quote_no, subject, quotestage, hdnGrandTotal, customer_name, assigned_user_id 
            FROM vt_quotes 
            WHERE substr(createdtime, 1, 10) = ? OR substr(modifiedtime, 1, 10) = ?`,
      args: [dateStr, dateStr]
    });
    quotes = quotesRes.rows;
  } catch (e) {}

  // 4. Appointments
  let appointments = [];
  try {
    const apptRes = await db.execute({
      sql: `SELECT id, subject, eventstatus, date_start, time_start 
            FROM appointments 
            WHERE substr(date_start, 1, 10) = ? OR substr(createdtime, 1, 10) = ?`,
      args: [dateStr, dateStr]
    });
    appointments = apptRes.rows;
  } catch (e) {}

  // 5. New Customers
  let newCustomers = [];
  try {
    const custRes = await db.execute({
      sql: `SELECT id, organization_name, created_time 
            FROM vt_customers 
            WHERE substr(created_time, 1, 10) = ?`,
      args: [dateStr]
    });
    newCustomers = custRes.rows;
  } catch (e) {}

  return {
    dateStr,
    tickets: ticketsRes.rows,
    records,
    quotes,
    appointments,
    newCustomers
  };
}

/**
 * Build HTML formatted report message for Telegram
 */
function buildReportMessage(data) {
  const { dateStr, tickets, records, quotes, appointments, newCustomers } = data;
  const trDate = formatTurkishDate(dateStr);
  const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  let msg = `📊 <b>TASKFLOW GÜN SONU RAPORU</b>\n`;
  msg += `📅 <b>Tarih:</b> ${trDate}\n`;
  msg += `⏰ <b>Rapor Saati:</b> ${nowTime}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 1. TICKETS SUMMARY
  msg += `🎫 <b>İŞLENEN BİLETLER (TICKETS): ${tickets.length} ADET</b>\n`;

  if (tickets.length > 0) {
    // Status breakdown
    const statusCounts = {};
    const techCounts = {};

    tickets.forEach(t => {
      const st = (t.ticketstatus || 'Belirtilmedi').trim();
      statusCounts[st] = (statusCounts[st] || 0) + 1;

      const tech = (t.assigned_user_id || 'Atanmamış').trim();
      techCounts[tech] = (techCounts[tech] || 0) + 1;
    });

    // Show status summary
    const statusSummary = Object.entries(statusCounts)
      .map(([st, count]) => {
        const icon = st.toLowerCase().includes('closed') ? '✅' : (st.toLowerCase().includes('progress') ? '⏳' : '📌');
        return `${icon} ${st}: <b>${count}</b>`;
      })
      .join(' | ');
    msg += `• Durumlar: ${statusSummary}\n\n`;

    // Staff breakdown
    msg += `👨‍💻 <b>Teknisyen Dağılımı:</b>\n`;
    Object.entries(techCounts).forEach(([tech, count]) => {
      msg += `  ▫️ ${tech}: <b>${count} bilet</b>\n`;
    });
    msg += `\n`;

    // Detailed ticket list (max 12 to respect message limits)
    msg += `📋 <b>Bilet Listesi:</b>\n`;
    const maxShow = 12;
    tickets.slice(0, maxShow).forEach((t, idx) => {
      const num = idx + 1;
      const tNo = t.ticket_no || t.id;
      const title = t.ticket_title || 'Başlıksız';
      const cust = t.organization_name || t.company || t.customer_name || 'Bilinmeyen Müşteri';
      const tech = t.assigned_user_id || '-';
      const st = t.ticketstatus || '';
      const stBadge = st.toLowerCase().includes('closed') ? '✅' : '⏳';

      msg += `<b>${num}.</b> [<code>${tNo}</code>] <b>${title}</b>\n`;
      msg += `   🏢 <i>${cust}</i>\n`;
      msg += `   👤 ${tech} | ${stBadge} ${st}\n`;
    });

    if (tickets.length > maxShow) {
      msg += `   <i>...ve ${tickets.length - maxShow} bilet daha.</i>\n`;
    }
  } else {
    msg += `<i>Bugün için kayıtlı bilet bulunmamaktadır.</i>\n`;
  }

  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📝 <b>DİĞER GÜNLÜK KAYITLAR:</b>\n`;
  msg += `• Servis Kayıtları: <b>${records.length} adet</b>\n`;
  msg += `• Yeni Müşteriler: <b>${newCustomers.length} adet</b>\n`;
  msg += `• Oluşturulan Teklifler: <b>${quotes.length} adet</b>\n`;
  msg += `• Randevular: <b>${appointments.length} adet</b>\n`;

  if (records.length > 0) {
    msg += `\n<b>Servis Kaydı Detayları:</b>\n`;
    records.slice(0, 5).forEach((r, idx) => {
      msg += `• ${r.customer_name || 'Müşteri'} - ${r.service_type || 'Hizmet'} (₺${r.total_price || 0})\n`;
    });
  }

  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `⚡ <i>TaskFlow Portal Otomatik Sistem Raporu</i>`;

  return msg;
}

/**
 * Send message via Telegram Bot API
 */
async function sendTelegramMessage(text, botToken, chatId) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chat) {
    throw new Error(
      'TELEGRAM_BOT_TOKEN veya TELEGRAM_CHAT_ID bulunamadı! Lütfen .env dosyanıza ekleyin.'
    );
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  const resJson = await response.json();
  if (!resJson.ok) {
    throw new Error(`Telegram API Hatası (${resJson.error_code}): ${resJson.description}`);
  }

  return resJson;
}

/**
 * Main report runner
 */
async function runReport(options = {}) {
  const targetDate = options.date || getLocalDateString();
  console.log(`[TELEGRAM] Gün sonu raporu hazırlanıyor (${targetDate})...`);

  const data = await fetchDailyData(targetDate);
  const message = buildReportMessage(data);

  console.log(`[TELEGRAM] Rapor içeriği hazırlandı:`);
  console.log(` - Bilet sayısı: ${data.tickets.length}`);
  console.log(` - Servis kaydı: ${data.records.length}`);
  console.log(` - Yeni müşteri: ${data.newCustomers.length}`);
  console.log(` - Teklif sayısı: ${data.quotes.length}`);

  if (options.dryRun || !process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log('\n--- [ÖNİZLEME / DRY RUN] ---');
    console.log(message.replace(/<[^>]+>/g, '')); // Strip HTML tags for clean console display
    console.log('-----------------------------\n');

    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      console.warn('[UYARI] TELEGRAM_BOT_TOKEN veya TELEGRAM_CHAT_ID tanımlanmadığı için mesaj Telegram\'a iletilmedi.');
      return { success: false, reason: 'MISSING_CREDENTIALS', message, data };
    }
    return { success: true, dryRun: true, message, data };
  }

  console.log('[TELEGRAM] Mesaj Telegram API üzerinden gönderiliyor...');
  const result = await sendTelegramMessage(message);
  console.log('✅ [TELEGRAM] Gün sonu raporu başarıyla iletildi! Message ID:', result.result?.message_id);
  return { success: true, result, data };
}

// Command-line execution support
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('--preview');
  
  let targetDate = null;
  const dateIdx = args.indexOf('--date');
  if (dateIdx !== -1 && args[dateIdx + 1]) {
    targetDate = args[dateIdx + 1];
  }

  runReport({ date: targetDate, dryRun: isDryRun })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ [HATA]:', err.message);
      process.exit(1);
    });
}

module.exports = {
  fetchDailyData,
  buildReportMessage,
  sendTelegramMessage,
  runReport,
  getLocalDateString
};
