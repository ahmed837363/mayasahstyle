const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const DATA_DIR = path.join(__dirname, 'data');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

const EMAIL_USER = process.env.EMAIL_USER || 'mayasahstyle@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'cdpu mwwf ecww cdap';
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS }, tls: { rejectUnauthorized: false } });

function loadProcessedPayments() {
  try { const raw = fs.readFileSync(PAYMENTS_FILE, 'utf8'); return JSON.parse(raw || '[]'); } catch (e) { return []; }
}
function saveProcessedPayments(list) { try { fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(list, null, 2), 'utf8'); return true; } catch (e) { return false; } }

async function sendWithRetry(mailOptions, attempts = 3, delayMs = 800) {
  for (let i = 1; i <= attempts; i++) {
    try { await transporter.sendMail(mailOptions); return { success: true, attempt: i }; } catch (err) {
      console.warn('send failed attempt', i, err && err.message);
      if (i < attempts) await new Promise(r => setTimeout(r, delayMs)); else return { success: false, attempt: i, error: err && (err.message || String(err)) };
    }
  }
}

async function resend(payment) {
  const order_id = payment.order_id;
  const customer_email = payment.customer_email || '';
  const amount = payment.amount || 0;
  const subjectCustomer = `Payment Confirmation - Order #${order_id}`;
  const htmlCustomer = `<p>Invoice for ${order_id} amount ${amount}</p>`;
  const subjectOwner = `Payment Received - Order #${order_id}`;
  const htmlOwner = `<p>New payment ${order_id} amount ${amount}</p>`;
  const custOpts = { from: `"Mayasah Style" <${EMAIL_USER}>`, to: customer_email, subject: subjectCustomer, html: htmlCustomer };
  const ownerOpts = { from: `"Mayasah Style" <${EMAIL_USER}>`, to: EMAIL_USER, subject: subjectOwner, html: htmlOwner };
  const cr = await sendWithRetry(custOpts, 3, 800);
  const or = await sendWithRetry(ownerOpts, 3, 800);
  const failed = [];
  if (!cr.success) failed.push({ to: customer_email, result: cr });
  if (!or.success) failed.push({ to: EMAIL_USER, result: or });
  if (failed.length === 0) {
    const all = loadProcessedPayments();
    const idx = all.findIndex(p => p.transaction_id === payment.transaction_id || p.order_id === order_id);
    const now = new Date().toISOString();
    if (idx >= 0) { all[idx] = Object.assign({}, all[idx], { status: 'success', processed_at: now }); } else { all.push({ order_id, transaction_id: payment.transaction_id || null, status: 'success', amount: amount, payment_method: payment.payment_method || 'mock', processed_at: now }); }
    saveProcessedPayments(all);
    console.log('Resend succeeded for', order_id);
    return true;
  }
  console.log('Resend failed for', order_id, failed);
  return false;
}

(async function(){
  const payments = loadProcessedPayments();
  const targets = payments.filter(p => String(p.status).toLowerCase() === 'email_failed');
  console.log('Found', targets.length, 'email_failed payments');
  for (const t of targets) {
    console.log('Retrying', t.order_id);
    await resend(t);
  }
})();
