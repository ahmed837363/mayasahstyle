const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
let dbHelper = null;
try { dbHelper = require('./db'); } catch (e) { console.warn('SQLite helper not available:', e && e.message); }
const app = express();

console.log('Loading backend/server.js - beginning initialization');

app.use(cors());
app.use(express.json());
// Serve images statically for invoice email access
const path = require('path');
app.use('/images', express.static(path.join(__dirname, '../images')));
// Serve admin UI
app.use('/admin', express.static(path.join(__dirname, 'admin')));
// Serve all static files (HTML, CSS, JS) from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Ensure data directory exists for simple persistence
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR); } catch (e) { console.warn('Could not create data dir', e); }
}
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
if (!fs.existsSync(PAYMENTS_FILE)) {
  try { fs.writeFileSync(PAYMENTS_FILE, JSON.stringify([]), 'utf8'); } catch (e) { console.warn('Could not create payments file', e); }
}
const CONSENTS_FILE = path.join(DATA_DIR, 'consents.json');
if (!fs.existsSync(CONSENTS_FILE)) {
  try { fs.writeFileSync(CONSENTS_FILE, JSON.stringify([]), 'utf8'); } catch (e) { console.warn('Could not create consents file', e); }
}

// Email transporter: prefer environment variables, fallback to the existing config for development
const EMAIL_USER = process.env.EMAIL_USER || 'mayasahstyle@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'cdpu mwwf ecww cdap';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  pool: true, // Use connection pooling
  maxConnections: 1, // Limit to 1 connection at a time (more reliable)
  maxMessages: 100, // Max messages per connection
  rateDelta: 1000, // Time between messages (1 second)
  rateLimit: 3 // Max 3 messages per rateDelta
});

// Verify Gmail connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Gmail connection FAILED:', error.message || error);
    console.error('Check EMAIL_USER and EMAIL_PASS environment variables');
  } else {
    console.log('✅ Gmail connection verified! Server is ready to send emails');
    console.log('📧 Email account:', EMAIL_USER);
  }
});


// Place your base64 string here (replace the value below with your own)
// Simple Saudi Riyal symbol using Unicode character
const saudiRiyalSymbol = 'ر.س';

const customerTemplateAr = ({
  order_number,
  order_date,
  customer_name,
  customer_email,
  customer_phone,
  address,
  city,
  zip_code,
  notes,
  items,
  subtotal,
  tax_rate,
  tax,
  shipping_cost,
  total,
  support_phone,
  support_email,
  business_name,
  current_year
}) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { max-width:600px; margin:auto; padding:20px; background:#ffd6e7; color:#333333; font-family:'Segoe UI',Tahoma,sans-serif; }
    .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #c06c84; padding-bottom:15px; }
    .header h1 { color:#8a2d52; margin:5px 0; }
    .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
    .info-table td { padding:8px 10px; border-bottom:1px solid #f8f9fa; }
    .items-table { width:100%; border-collapse:collapse; margin:25px 0; }
    .items-table th { background-color:#c06c84; color:#fff; padding:12px; text-align:right; }
    .items-table td { padding:10px; border-bottom:1px solid #f8f9fa; text-align:center; }
    .total-table { width:100%; margin-top:20px; font-size:18px; }
    .total-row { font-weight:bold; font-size:20px; color:#8a2d52; }
    .footer { margin-top:40px; text-align:center; color:#777; font-size:14px; padding-top:15px; border-top:1px solid #eee; }
    .currency { font-family:Arial,sans-serif; }
  </style>
</head>
    <p>رقم الطلب: <strong>${order_number}</strong></p>
    <p>التاريخ: ${order_date}</p>
  </div>

  <table class="info-table">
    <tr>
      <td width="30%"><strong>اسم العميل:</strong></td>
      <td>${customer_name}</td>
    </tr>
    <tr>
      <td><strong>البريد الإلكتروني:</strong></td>
      <td>${customer_email}</td>
    </tr>
    <tr>
      <td><strong>رقم الهاتف:</strong></td>
      <td>${customer_phone}</td>
    </tr>
    <tr>
      <td><strong>العنوان:</strong></td>
      <td>${address || ''}</td>
    </tr>
    <tr>
      <td><strong>المدينة:</strong></td>
      <td>${city || ''}</td>
    </tr>
    <tr>
      <td><strong>الرمز البريدي:</strong></td>
      <td>${zip_code || ''}</td>
    </tr>
    ${notes ? `
    <tr>
      <td><strong>ملاحظات الطلب:</strong></td>
      <td>${notes}</td>
    </tr>
    ` : ''}
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th width="50%">المنتج</th>
        <th>القياس</th> <!-- Added size column -->
        <th>الكمية</th>
        <th>السعر</th>
        <th>المجموع</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${productNameTranslations[item.key]?.ar || item.name || ''}</td>
          <td>${item.size || ''}</td>
          <td>${item.quantity}</td>
          <td><span class="currency">${Number(item.price).toFixed(2)} ${saudiRiyalSymbol}</span></td>
          <td><span class="currency">${(typeof item.total !== 'undefined' ? Number(item.total) : Number(item.price) * Number(item.quantity)).toFixed(2)} ${saudiRiyalSymbol}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <table class="total-table">
    <tr>
      <td width="70%" style="text-align:left;">المجموع الفرعي:</td>
      <td style="text-align:right;"><span class="currency">${subtotal} ${saudiRiyalSymbol}</span></td>
    </tr>
    <tr>
      <td style="text-align:left;">الضريبة (${tax_rate}%):</td>
      <td style="text-align:right;"><span class="currency">${tax} ${saudiRiyalSymbol}</span></td>
    </tr>
    <tr>
      <td style="text-align:right;">الشحن:</td>
      <td style="text-align:right;"><span class="currency">${shipping_cost || 0} ${saudiRiyalSymbol}</span></td>
    </tr>
    <tr class="total-row">
      <td style="text-align:left;">المجموع الكلي:</td>
      <td style="text-align:right;"><span class="currency">${total} ${saudiRiyalSymbol}</span></td>
    </tr>
  </table>

     <div class="footer">
     <p>شكراً لاختياركم متجرنا!</p>
     <p>للاستفسارات: ${support_phone} | البريد الإلكتروني: ${support_email}</p>
   </div>
 </body>
 </html>
 `;

const customerTemplateEn = ({
  order_number,
  order_date,
  customer_name,
  customer_email,
  customer_phone,
  address,
  city,
  zip_code,
  notes,
  items,
  subtotal,
  tax_rate,
  tax,
  shipping_cost,
  total,
  support_phone,
  support_email,
  business_name,
  current_year
}) => `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <style>
    body { max-width:600px; margin:auto; padding:20px; background:#ffd6e7; color:#333333; font-family:'Segoe UI',Tahoma,sans-serif; }
    .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #c06c84; padding-bottom:15px; }
    .header h1 { color:#8a2d52; margin:5px 0; }
    .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
    .info-table td { padding:8px 10px; border-bottom:1px solid #f8f9fa; }
    .items-table { width:100%; border-collapse:collapse; margin:25px 0; }
    .items-table th { background-color:#c06c84; color:#fff; padding:12px; text-align:left; }
    .items-table td { padding:10px; border-bottom:1px solid #f8f9fa; text-align:center; }
    .total-table { width:100%; margin-top:20px; font-size:18px; }
    .total-row { font-weight:bold; font-size:20px; color:#8a2d52; }
    .footer { margin-top:40px; text-align:center; color:#777; font-size:14px; padding-top:15px; border-top:1px solid #eee; }
    .currency { font-family:Arial,sans-serif; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Confirmation</h1>
    <p>Order #: <strong>${order_number}</strong></p>
    <p>Date: ${order_date}</p>
  </div>

  <table class="info-table">
    <tr>
      <td width="30%"><strong>Customer Name:</strong></td>
      <td>${customer_name}</td>
    </tr>
    <tr>
      <td><strong>Email:</strong></td>
      <td>${customer_email}</td>
    </tr>
    <tr>
      <td><strong>Phone:</strong></td>
      <td>${customer_phone}</td>
    </tr>
    <tr>
      <td><strong>Address:</strong></td>
      <td>${address || ''}</td>
    </tr>
    <tr>
      <td><strong>City:</strong></td>
      <td>${city || ''}</td>
    </tr>
    <tr>
      <td><strong>Zip Code:</strong></td>
      <td>${zip_code || ''}</td>
    </tr>
    ${notes ? `
    <tr>
      <td><strong>Order Notes:</strong></td>
      <td>${notes}</td>
    </tr>
    ` : ''}
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th width="50%">Product</th>
        <th>Size</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${productNameTranslations[item.key]?.en || item.name || ''}</td>
          <td>${item.size || ''}</td>
          <td>${item.quantity}</td>
          <td><span class="currency">${Number(item.price).toFixed(2)} SAR</span></td>
          <td><span class="currency">${(typeof item.total !== 'undefined' ? Number(item.total) : Number(item.price) * Number(item.quantity)).toFixed(2)} SAR</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <table class="total-table">
    <tr>
      <td width="70%" style="text-align:left;">Subtotal:</td>
      <td style="text-align:right;"><span class="currency">${subtotal} SAR</span></td>
    </tr>
    <tr>
      <td style="text-align:left;">VAT (${tax_rate}%):</td>
      <td style="text-align:right;"><span class="currency">${tax} SAR</span></td>
    </tr>
    <tr>
      <td style="text-align:left;">Shipping:</td>
      <td style="text-align:right;"><span class="currency">${shipping_cost || 0} SAR</span></td>
    </tr>
    <tr class="total-row">
      <td style="text-align:left;">Total:</td>
      <td style="text-align:right;"><span class="currency">${total} SAR</span></td>
    </tr>
  </table>

  <div class="footer">
    <p>Thank you for choosing our store!</p>
    <p>For inquiries: ${support_phone} | Email: ${support_email}</p>
  </div>
</body>
</html>
`;

const ownerTemplate = ({
  order_number,
  order_date,
  customer_name,
  customer_email,
  customer_phone,
  address,
  city,
  zip_code,
  notes,
  items,
  subtotal,
  tax_rate,
  tax,
  shipping_cost,
  total,
  support_phone,
  support_email,
  business_name,
  current_year
}) => `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <style>
    body { max-width:700px; margin:auto; padding:20px; background:#ffd6e7; color:#333333; font-family:'Segoe UI',Tahoma,sans-serif; }
    .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #c06c84; padding-bottom:15px; }
    .header h1 { color:#8a2d52; margin:5px 0; }
    .section-title { color:#c06c84; margin-top:30px; margin-bottom:10px; font-size:20px; }
    .info-table, .items-table, .total-table { width:100%; border-collapse:collapse; margin:15px 0; }
    .info-table td, .items-table td { padding:8px 10px; border-bottom:1px solid #f8f9fa; }
    .items-table th { background-color:#c06c84; color:#fff; padding:12px; text-align:left; }
    .items-table td { text-align:center; }
    .total-table { font-size:18px; }
    .total-row { font-weight:bold; font-size:20px; color:#8a2d52; }
    .footer { margin-top:40px; text-align:center; color:#777; font-size:14px; padding-top:15px; border-top:1px solid #eee; }
    .currency { font-family:Arial,sans-serif; }
    .rtl { direction:rtl; text-align:right; font-family:'Segoe UI',Tahoma,sans-serif; }
    .ltr { direction:ltr; text-align:left; }
  </style>
</head>
<body>
  <div class="header">
    <h1>New Order Received / تم استلام طلب جديد</h1>
    <p>Order #: <strong>${order_number}</strong> | رقم الطلب: <strong>${order_number}</strong></p>
    <p>Date: ${order_date} | التاريخ: ${order_date}</p>
  </div>

  <div class="section-title">Customer Information / معلومات العميل</div>
  <table class="info-table">
    <tr>
      <td><strong>Customer Name</strong></td>
      <td>${customer_name}</td>
      <td class="rtl"><strong>اسم العميل</strong></td>
      <td class="rtl">${customer_name}</td>
    </tr>
    <tr>
      <td><strong>Email</strong></td>
      <td>${customer_email}</td>
      <td class="rtl"><strong>البريد الإلكتروني</strong></td>
      <td class="rtl">${customer_email}</td>
    </tr>
    <tr>
      <td><strong>Phone</strong></td>
      <td>${customer_phone}</td>
      <td class="rtl"><strong>رقم الهاتف</strong></td>
      <td class="rtl">${customer_phone}</td>
    </tr>
    <tr>
      <td><strong>Address</strong></td>
      <td>${address || ''}</td>
      <td class="rtl"><strong>العنوان</strong></td>
      <td class="rtl">${address || ''}</td>
    </tr>
    <tr>
      <td><strong>City</strong></td>
      <td>${city || ''}</td>
      <td class="rtl"><strong>المدينة</strong></td>
      <td class="rtl">${city || ''}</td>
    </tr>
    <tr>
      <td><strong>Zip Code</strong></td>
      <td>${zip_code || ''}</td>
      <td class="rtl"><strong>الرمز البريدي</strong></td>
      <td class="rtl">${zip_code || ''}</td>
    </tr>
    ${notes ? `
    <tr>
      <td><strong>Order Notes</strong></td>
      <td>${notes}</td>
      <td class="rtl"><strong>ملاحظات الطلب</strong></td>
      <td class="rtl">${notes}</td>
    </tr>
    ` : ''}
  </table>

  <div class="section-title">Order Items / المنتجات</div>
  <table class="items-table">
    <thead>
      <tr>
        <th>Product</th>
        <th>Size</th> <!-- Added size column -->
        <th>Quantity</th>
        <th>Price</th>
        <th>Total</th>
        <th class="rtl">المنتج</th>
        <th class="rtl">القياس</th> <!-- Added size column -->
        <th class="rtl">الكمية</th>
        <th class="rtl">السعر</th>
        <th class="rtl">المجموع</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${productNameTranslations[item.key]?.en || item.name || ''}</td>
          <td>${item.size || ''}</td>
          <td>${item.quantity}</td>
          <td><span class="currency">${Number(item.price).toFixed(2)} SAR</span></td>
          <td><span class="currency">${(typeof item.total !== 'undefined' ? Number(item.total) : Number(item.price) * Number(item.quantity)).toFixed(2)} SAR</span></td>
          <td class="rtl">${productNameTranslations[item.key]?.ar || item.name || ''}</td>
          <td class="rtl">${item.size || ''}</td>
          <td class="rtl">${item.quantity}</td>
          <td class="rtl"><span class="currency">${Number(item.price).toFixed(2)} ${saudiRiyalSymbol}</span></td>
          <td class="rtl"><span class="currency">${(typeof item.total !== 'undefined' ? Number(item.total) : Number(item.price) * Number(item.quantity)).toFixed(2)} ${saudiRiyalSymbol}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <table class="total-table">
    <tr>
      <td colspan="2" style="text-align:right;">Subtotal:</td>
      <td style="text-align:left;"><span class="currency">${subtotal} SAR</span></td>
      <td class="rtl" colspan="2" style="text-align:left;">المجموع الفرعي:</td>
      <td class="rtl" style="text-align:right;"><span class="currency">${subtotal} ${saudiRiyalSymbol}</span></td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:right;">VAT (${tax_rate}%):</td>
      <td style="text-align:left;"><span class="currency">${tax} SAR</span></td>
      <td class="rtl" colspan="2" style="text-align:left;">الضريبة (${tax_rate}%):</td>
      <td class="rtl" style="text-align:right;"><span class="currency">${tax} ${saudiRiyalSymbol}</span></td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:right;">Shipping:</td>
      <td style="text-align:left;"><span class="currency">${shipping_cost || 0} SAR</span></td>
      <td class="rtl" colspan="2" style="text-align:left;">الشحن:</td>
      <td class="rtl" style="text-align:right;"><span class="currency">${shipping_cost || 0} ${saudiRiyalSymbol}</span></td>
    </tr>
    <tr class="total-row">
      <td colspan="2" style="text-align:right;">Total:</td>
      <td style="text-align:left;"><span class="currency">${total} SAR</span></td>
      <td class="rtl" colspan="2" style="text-align:left;">المجموع الكلي:</td>
      <td class="rtl" style="text-align:right;"><span class="currency">${total} ${saudiRiyalSymbol}</span></td>
    </tr>
  </table>

  <div class="footer">
    <p>Support: ${support_phone} | Email: ${support_email}</p>
    <p>الدعم: ${support_phone} | البريد الإلكتروني: ${support_email}</p>
    <p>&copy; ${current_year} Mayasah Style</p>
  </div>
</body>
</html>
`;

// Helper: translations for product names
const productNameTranslations = {
  product1: {
    ar: 'عباية سوداء كلاسيكية',
    en: 'Classic Black Abaya'
  },
  product2: {
    ar: 'عباية مطرزة بالخيط الذهبي',
    en: 'Abaya with Golden Embroidery'
  },
  product3: {
    ar: 'عباية كحلي بتصميم عصري',
    en: 'Modern Navy Abaya'
  },
  product4: {
    ar: 'عباية رمادية بتفاصيل فضية',
    en: 'Gray Abaya with Silver Details'
  }
};

app.post('/send-order', async (req, res) => {
    console.log('REQ.BODY:', req.body);
    const {
        customer_email,
        customer_name,
        customer_phone,
        order_id,
        order_total,
        language,
        items,
        subtotal,
        tax_rate,
        tax,
        shipping_cost,
        address,
        city,
        zip_code,
        notes,
        support_phone,
        support_email,
        business_name
    } = req.body;

    let subjectCustomer, htmlCustomer, subjectOwner, htmlOwner;
    let attachments = [];
    // Always ensure items have valid totals
    const safeItems = (items || []).map(item => {
        let total = (typeof item.total !== 'undefined' && !isNaN(item.total)) ? Number(item.total) : (Number(item.price) * Number(item.quantity));
        if (isNaN(total) || typeof total === 'undefined') total = 0;
        return {
            ...item,
            total: +total.toFixed(2)
        };
    });
    // Compute totals for both languages
    const computedSubtotal = safeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const computedTax = +(computedSubtotal * (tax_rate ? tax_rate / 100 : 0.15)).toFixed(2);
    const computedTotal = +(computedSubtotal + computedTax + (Number(shipping_cost) || 0)).toFixed(2);
  const langPref = language || 'en';
  if (langPref === 'ar') {
    // Customer (Arabic)
    subjectCustomer = `تأكيد الطلب رقم ${order_id}`;
    htmlCustomer = customerTemplateAr({
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      zip_code,
      notes,
      items: safeItems,
      subtotal: computedSubtotal,
      tax_rate,
      tax: computedTax,
      shipping_cost,
      total: computedTotal,
      support_phone: support_phone || '0500000000',
      support_email: support_email || 'mayasahstyle@gmail.com',
      business_name: business_name || 'مياسه ستيل',
      current_year: new Date().getFullYear()
    });

    // Owner (neutral Arabic subject)
    subjectOwner = `طلب جديد #${order_id}`;
    htmlOwner = ownerTemplate({
      order_number: order_id,
      order_date: new Date().toLocaleDateString('ar-EG'),
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      zip_code,
      notes,
      items: safeItems,
      subtotal: computedSubtotal,
      tax_rate,
      tax: computedTax,
      shipping_cost,
      total: computedTotal,
      support_phone: support_phone || '0500000000',
      support_email: support_email || 'mayasahstyle@gmail.com',
      business_name: business_name || 'مياسه ستيل',
      current_year: new Date().getFullYear()
    });
  } else {
    // Customer (English)
    subjectCustomer = `Order Confirmation #${order_id}`;
    htmlCustomer = customerTemplateEn({
      order_number: order_id,
      order_date: new Date().toLocaleDateString('en-US'),
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      zip_code,
      notes,
      items: safeItems,
      subtotal: computedSubtotal,
      tax_rate,
      tax: computedTax,
      shipping_cost,
      total: computedTotal,
      support_phone: support_phone || '0500000000',
      support_email: support_email || 'mayasahstyle@gmail.com',
      business_name: business_name || 'Mayasah Style',
      current_year: new Date().getFullYear()
    });

    // Owner (neutral English subject)
    subjectOwner = `New Order #${order_id}`;
    htmlOwner = ownerTemplate({
      order_number: order_id,
      order_date: new Date().toLocaleDateString('en-US'),
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      zip_code,
      notes,
      items: safeItems,
      subtotal: computedSubtotal,
      tax_rate,
      tax: computedTax,
      shipping_cost,
      total: computedTotal,
      support_phone: support_phone || '0500000000',
      support_email: support_email || 'mayasahstyle@gmail.com',
      business_name: business_name || 'Mayasah Style',
      current_year: new Date().getFullYear()
    });
  }

    // Send response immediately and send emails in background
    // This prevents timeout issues on the frontend
    res.json({ 
        success: true, 
        message: 'Order received and being processed',
        order_id: order_id
    });
    
    // Send emails asynchronously in background
    (async () => {
        try {
            console.log('📧 Starting email send for order:', order_id);
            console.log('Customer email:', customer_email);
            console.log('Language:', langPref);
            
            // Send emails one at a time with individual timeouts (more reliable than Promise.all)
            // Customer email first
            try {
                console.log('Sending customer email...');
                const customerMailOptions = {
                    from: langPref === 'ar'
                        ? '"مياسه ستيل" <mayasahstyle@gmail.com>'
                        : '"Mayasah Style" <mayasahstyle@gmail.com>',
                    to: customer_email,
                    subject: subjectCustomer,
                    html: htmlCustomer,
                    attachments: attachments.length ? attachments : undefined
                };
                
                await Promise.race([
                    transporter.sendMail(customerMailOptions),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Customer email timeout')), 60000))
                ]);
                
                console.log('✓ Customer email sent successfully to:', customer_email);
            } catch (custErr) {
                console.error('✗ Customer email failed:', custErr.message || custErr);
            }
            
            // Small delay between emails
            await new Promise(r => setTimeout(r, 1000));
            
            // Owner email second
            try {
                console.log('Sending owner notification email...');
                const ownerMailOptions = {
                    from: langPref === 'ar'
                        ? '"مياسه ستيل" <mayasahstyle@gmail.com>'
                        : '"Mayasah Style" <mayasahstyle@gmail.com>',
                    to: 'mayasahstyle@gmail.com',
                    subject: subjectOwner,
                    html: htmlOwner,
                    attachments: attachments.length ? attachments : undefined
                };
                
                await Promise.race([
                    transporter.sendMail(ownerMailOptions),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Owner email timeout')), 60000))
                ]);
                
                console.log('✓ Owner notification sent successfully');
            } catch (ownErr) {
                console.error('✗ Owner email failed:', ownErr.message || ownErr);
            }
            
            console.log('✓ Email processing completed for order:', order_id);
            
        } catch (emailError) {
            console.error('✗ Email sending failed for order:', order_id);
            console.error('Error details:', emailError.message || emailError);
            console.error('Error stack:', emailError.stack);
            
            // Store failed email info for retry later
            const payments = loadProcessedPayments();
            payments.push({
                order_id: order_id,
                customer_email: customer_email,
                status: 'email_failed',
                timestamp: new Date().toISOString(),
                error: emailError.message
            });
            saveProcessedPayments(payments);
        }
    })();

});

// Helper: read/write processed payments for idempotency
function loadProcessedPayments() {
  try {
    const raw = fs.readFileSync(PAYMENTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.warn('Failed to load processed payments:', e.message || e);
    return [];
  }
}

function saveProcessedPayments(list) {
  try {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save processed payments:', e.message || e);
    return false;
  }
}

function isPaymentProcessed(transactionId) {
  if (!transactionId) return false;
  const list = loadProcessedPayments();
  return list.some(p => p.transaction_id === transactionId);
}

function recordPayment(paymentRecord) {
  const list = loadProcessedPayments();
  list.push(paymentRecord);
  return saveProcessedPayments(list);
}

// Helper to append debug logs to a file in DATA_DIR so we can inspect them later
function appendLog(name, msg) {
  try {
    const file = path.join(DATA_DIR, name + '.log');
    const entry = `[${new Date().toISOString()}] ${typeof msg === 'string' ? msg : JSON.stringify(msg)}\n`;
    fs.appendFileSync(file, entry, 'utf8');
  } catch (e) {
    // ignore logging failures
  }
}

// Helper: send email with retries
async function sendWithRetry(mailOptions, attempts = 3, delayMs = 800) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await transporter.sendMail(mailOptions);
      return { success: true, attempt: i };
    } catch (err) {
      appendLog('email-send-fail', { attempt: i, to: mailOptions.to, error: err && (err.message || String(err)) });
      if (i < attempts) {
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        return { success: false, attempt: i, error: err && (err.message || String(err)) };
      }
    }
  }
}

// Shared processing for webhook payloads (idempotent). Returns an object with result info.
async function processWebhookPayload(payload) {
  const {
    order_id,
    transaction_id,
    status,
    amount,
    payment_method,
    customer_email,
    customer_name,
    customer_phone,
    address,
    city,
    zip_code,
    notes,
    items,
    language,
    support_phone,
    support_email,
    business_name
  } = payload || {};

  if (!order_id || !transaction_id || !status) {
    return { success: false, code: 400, message: 'Missing required fields' };
  }

  if (isPaymentProcessed(transaction_id)) {
    console.log('processWebhookPayload: duplicate transaction ignored', transaction_id);
    return { success: true, duplicate: true };
  }

  // If status is not success, still record for audit
  if (String(status).toLowerCase() !== 'success') {
    recordPayment({ order_id, transaction_id, status, amount: amount || 0, received_at: new Date().toISOString() });
    return { success: true, recorded_as: 'non-success' };
  }

  // Build orderData and send emails similar to /send-order
  const safeItems = (items || []).map(item => ({ ...item }));
  const orderData = {
    order_id,
    customer_name: customer_name || payload.customer_name || '',
    customer_email: customer_email || payload.customer_email || '',
    customer_phone: customer_phone || payload.customer_phone || '',
    address: address || '',
    city: city || '',
    zip_code: zip_code || '',
    notes: notes || '',
    items: safeItems,
    subtotal: payload.subtotal || 0,
    tax_rate: payload.tax_rate || 15,
    tax: payload.tax || 0,
    shipping_cost: payload.shipping_cost || 0,
    total: amount || payload.total || 0,
    language: language || 'ar',
    support_phone: support_phone || '0500000000',
    support_email: support_email || EMAIL_USER,
    business_name: business_name || 'Mayasah Style'
  };

  // If a sessionId was provided, try to merge stored session.order_data into orderData
  try {
    if (payload && payload.sessionId) {
      const sessionsFile = path.join(DATA_DIR, 'sessions.json');
      let sessions = [];
      try { sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '[]'); } catch (e) { sessions = []; }
      const sess = sessions.find(s => s.sessionId === payload.sessionId);
      if (sess && sess.order_data) {
        // Only fill fields that are missing in the incoming payload
        const od = sess.order_data || {};
        orderData.customer_name = orderData.customer_name || od.customer_name || '';
        orderData.customer_email = orderData.customer_email || od.customer_email || '';
        orderData.customer_phone = orderData.customer_phone || od.customer_phone || '';
        orderData.address = orderData.address || od.address || '';
        orderData.city = orderData.city || od.city || '';
        orderData.zip_code = orderData.zip_code || od.zip_code || '';
        orderData.notes = orderData.notes || od.notes || '';
        orderData.items = (orderData.items && orderData.items.length) ? orderData.items : (od.items || []);
        orderData.subtotal = orderData.subtotal || od.subtotal || 0;
        orderData.tax_rate = orderData.tax_rate || od.tax_rate || 15;
        orderData.shipping_cost = orderData.shipping_cost || od.shipping_cost || 0;
        orderData.language = orderData.language || od.language || 'en';
      }
    }
  } catch (e) {
    appendLog('session-merge-error', { sessionId: payload && payload.sessionId, error: e && (e.message || String(e)) });
  }

  // Validate we have a customer email before attempting to send. If missing, record email_failed and return an informative error.
  if (!orderData.customer_email || String(orderData.customer_email).trim() === '') {
    try {
      recordPayment({ order_id, transaction_id, status: 'email_failed', amount: amount || orderData.total || 0, payment_method, processed_at: new Date().toISOString(), sessionId: payload.sessionId || null, note: 'missing_customer_email' });
    } catch (e) { appendLog('email-record-fail', { order_id, transaction_id, error: e && (e.message || String(e)) }); }
    appendLog('webhook-processed', { order_id, transaction_id, status: 'email_failed', reason: 'missing_customer_email' });
    return { success: false, code: 422, message: 'Missing customer email in payment/session data' };
  }

  try {
    const lang = orderData.language;
    let subjectCustomer, htmlCustomer, subjectOwner, htmlOwner;
    const computedSubtotal = (orderData.subtotal || 0);
    const computedTax = +(computedSubtotal * (orderData.tax_rate ? orderData.tax_rate / 100 : 0.15)).toFixed(2);
    const computedTotal = +(computedSubtotal + computedTax + (Number(orderData.shipping_cost) || 0)).toFixed(2);

    if (lang === 'ar') {
      subjectCustomer = `تأكيد الدفع - طلب رقم ${order_id}`;
      htmlCustomer = customerTemplateAr({
        order_number: order_id,
        order_date: new Date().toLocaleDateString('ar-EG'),
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        address: orderData.address,
        city: orderData.city,
        zip_code: orderData.zip_code,
        notes: orderData.notes,
        items: safeItems,
        subtotal: computedSubtotal,
        tax_rate: orderData.tax_rate,
        tax: computedTax,
        shipping_cost: orderData.shipping_cost,
        total: computedTotal,
        support_phone: orderData.support_phone,
        support_email: orderData.support_email,
        business_name: orderData.business_name,
        current_year: new Date().getFullYear()
      });
      subjectOwner = `تم الدفع - طلب رقم ${order_id}`;
      htmlOwner = ownerTemplate({
        order_number: order_id,
        order_date: new Date().toLocaleDateString('ar-EG'),
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        address: orderData.address,
        city: orderData.city,
        zip_code: orderData.zip_code,
        notes: orderData.notes,
        items: safeItems,
        subtotal: computedSubtotal,
        tax_rate: orderData.tax_rate,
        tax: computedTax,
        shipping_cost: orderData.shipping_cost,
        total: computedTotal,
        support_phone: orderData.support_phone,
        support_email: orderData.support_email,
        business_name: orderData.business_name,
        current_year: new Date().getFullYear()
      });
    } else {
      subjectCustomer = `Payment Confirmation - Order #${order_id}`;
      htmlCustomer = customerTemplateEn({
        order_number: order_id,
        order_date: new Date().toLocaleDateString('en-US'),
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        address: orderData.address,
        city: orderData.city,
        zip_code: orderData.zip_code,
        notes: orderData.notes,
        items: safeItems,
        subtotal: computedSubtotal,
        tax_rate: orderData.tax_rate,
        tax: computedTax,
        shipping_cost: orderData.shipping_cost,
        total: computedTotal,
        support_phone: orderData.support_phone,
        support_email: orderData.support_email,
        business_name: orderData.business_name,
        current_year: new Date().getFullYear()
      });
      subjectOwner = `Payment Received - Order #${order_id}`;
      htmlOwner = ownerTemplate({
        order_number: order_id,
        order_date: new Date().toLocaleDateString('en-US'),
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        address: orderData.address,
        city: orderData.city,
        zip_code: orderData.zip_code,
        notes: orderData.notes,
        items: safeItems,
        subtotal: computedSubtotal,
        tax_rate: orderData.tax_rate,
        tax: computedTax,
        shipping_cost: orderData.shipping_cost,
        total: computedTotal,
        support_phone: orderData.support_phone,
        support_email: orderData.support_email,
        business_name: orderData.business_name,
        current_year: new Date().getFullYear()
      });
    }

    // Ensure emails directory exists and save HTML files so invoices are available even if SMTP fails
    try { if (!fs.existsSync(path.join(DATA_DIR, 'emails'))) fs.mkdirSync(path.join(DATA_DIR, 'emails')); } catch (e) { /* ignore */ }
    const customerEmailFile = path.join(DATA_DIR, 'emails', `${order_id}-customer.html`);
    const ownerEmailFile = path.join(DATA_DIR, 'emails', `${order_id}-owner.html`);
    try { fs.writeFileSync(customerEmailFile, htmlCustomer, 'utf8'); } catch (e) { console.warn('Failed to write customer email file', e && e.message); }
    try { fs.writeFileSync(ownerEmailFile, htmlOwner, 'utf8'); } catch (e) { console.warn('Failed to write owner email file', e && e.message); }

    // Try to send both emails with retry; require both to succeed before marking payment as processed
    let sendResults = [];
    // customer email
    const custOpts = { from: lang === 'ar' ? `"${orderData.business_name}" <${EMAIL_USER}>` : `"${orderData.business_name}" <${EMAIL_USER}>`, to: orderData.customer_email, subject: subjectCustomer, html: htmlCustomer };
    const custResult = await sendWithRetry(custOpts, 3, 800);
    sendResults.push({ to: orderData.customer_email, result: custResult });

    // owner email
    const ownerOpts = { from: lang === 'ar' ? `"${orderData.business_name}" <${EMAIL_USER}>` : `"${orderData.business_name}" <${EMAIL_USER}>`, to: EMAIL_USER, subject: subjectOwner, html: htmlOwner };
    const ownerResult = await sendWithRetry(ownerOpts, 3, 800);
    sendResults.push({ to: EMAIL_USER, result: ownerResult });

    const failed = sendResults.filter(r => !r.result || r.result.success === false);
    if (failed.length === 0) {
      // both emails sent OK -> record processed payment
      recordPayment({ order_id, transaction_id, status: 'success', amount: amount || computedTotal, payment_method, processed_at: new Date().toISOString(), sessionId: payload.sessionId || null });
      appendLog('webhook-processed', { order_id, transaction_id, status: 'success', amount: amount || computedTotal });
      console.log('processWebhookPayload: emails delivered and payment recorded for order', order_id);
      return { success: true };
    }

    // Some sends failed -> do not mark payment as successful; record for audit as email_failed so it can be retried
    try {
      recordPayment({ order_id, transaction_id, status: 'email_failed', amount: amount || computedTotal, payment_method, processed_at: new Date().toISOString(), sessionId: payload.sessionId || null, failures: failed });
    } catch (e) { appendLog('email-record-fail', { order_id, transaction_id, error: e && (e.message || String(e)) }); }

    // Persist failures
    try { fs.appendFileSync(path.join(DATA_DIR, 'email-errors.log'), `[${new Date().toISOString()}] ${JSON.stringify({ order_id, transaction_id, failures: failed })}\n`, 'utf8'); } catch (e) { /* ignore */ }

    console.warn('processWebhookPayload: email delivery failed, payment marked email_failed for order', order_id, 'failures=', failed);
    return { success: false, code: 502, message: 'Email delivery failed', failures: failed };
  } catch (err) {
    console.error('processWebhookPayload failed:', err && (err.stack || err));
    return { success: false, error: err && (err.message || String(err)) };
  }
}

// Simple, secure-ish webhook endpoint for receiving payment notifications from gateways
// Expects a JSON body with at minimum: { order_id, transaction_id, status, amount, payment_method, customer_email, customer_name }
// Idempotent: repeated notifications for the same transaction_id will be ignored.
app.post('/payment-webhook', async (req, res) => {
  // Basic API key protection: set PAYMENT_API_KEY env var in production
  // Allow internal mock sessions to post without API key when marked as mock
  const providedKey = req.headers['x-api-key'] || req.query.key;
  const expectedKey = process.env.PAYMENT_API_KEY || 'devkey';
  const payload = req.body || {};
  const isMock = payload && payload.__mock_session === true;
  if (!isMock && expectedKey && providedKey !== expectedKey) {
    return res.status(403).json({ success: false, message: 'Invalid API key' });
  }

  const result = await processWebhookPayload(payload);
  if (result && result.success) return res.json(result);
  const code = result && result.code ? result.code : 500;
  return res.status(code).json(result);
});

// Create a payment session for hosted checkout (mock gateway)
// POST /create-payment-session
// Body: { order_id, amount, return_url }
// Response: { success: true, sessionId, url }
app.post('/create-payment-session', (req, res) => {
  try {
    // Allow passing minimal order data so webhook processing can send emails later
    const { order_id, amount, return_url, order_data } = req.body || {};
    if (!order_id || !amount) return res.status(400).json({ success: false, message: 'order_id and amount required' });

    // Create a simple session record stored in memory (for mock); in prod this would create a gateway session
    const sessionId = 'MSH' + Date.now().toString(36) + Math.random().toString(36).substr(2,6);

    // Persist minimal session state to a file for demo/debug (optional)
    const sessionsFile = path.join(DATA_DIR, 'sessions.json');
    let sessions = [];
    try { sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '[]'); } catch (e) { sessions = []; }
    sessions.push({ sessionId, order_id, amount, return_url: return_url || null, order_data: order_data || null, created_at: new Date().toISOString() });
    try { fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), 'utf8'); } catch (e) { /* ignore */ }
    // also persist to sqlite if available
    if (dbHelper) {
      dbHelper.upsertSession({ sessionId, order_id, amount, return_url: return_url || null, order_data: order_data || null, created_at: new Date().toISOString() }).catch(e => appendLog('db-session-write-fail', e && (e.message || String(e))));
    }

    // The hosted mock payment page will POST to /mock-gateway-callback when user 'pays'
    const url = `${req.protocol}://${req.get('host')}/payment-hosted-mock/${encodeURIComponent(sessionId)}`;
    return res.json({ success: true, sessionId, url });
  } catch (err) {
    console.error('Failed to create payment session:', err);
    return res.status(500).json({ success: false, error: err.message || err });
  }
});

// Serve a very small mock hosted payment page where user can 'pay' to simulate gateway
app.get('/payment-hosted-mock/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionsFile = path.join(DATA_DIR, 'sessions.json');
    let sessions = [];
    try { sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '[]'); } catch (e) { sessions = []; }
        const session = sessions.find(s => s.sessionId === sessionId) || { order_id: 'unknown', amount: 0 };

    // Simple HTML form to simulate payment
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Mock Payment</title></head><body>
          <h2>Mock Payment Gateway</h2>
          <p>Order: ${session.order_id}</p>
          <p>Amount: ${session.amount}</p>
      <form method="post" action="/mock-gateway-callback">
        <input type="hidden" name="sessionId" value="${sessionId}">
        <input type="hidden" name="order_id" value="${session.order_id || ''}">
        <input type="hidden" name="amount" value="${session.amount || 0}">
        <input type="hidden" name="transaction_id" value="MOCKTXN${Date.now()}">
        <input type="hidden" name="status" value="success">
        <p><button type="submit">Simulate Successful Payment</button></p>
      </form>
      <form method="post" action="/mock-gateway-callback">
        <input type="hidden" name="sessionId" value="${sessionId}">
        <input type="hidden" name="order_id" value="${session.order_id || ''}">
        <input type="hidden" name="amount" value="${session.amount || 0}">
        <input type="hidden" name="transaction_id" value="MOCKTXN${Date.now()}FAIL">
        <input type="hidden" name="status" value="failed">
        <p><button type="submit">Simulate Failed Payment</button></p>
      </form>
    </body></html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    console.error('Error serving mock hosted payment page:', err);
    return res.status(500).send('Error');
  }
});

// Mock gateway callback endpoint used by the hosted mock page to notify our webhook
app.post('/mock-gateway-callback', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    console.log('Mock gateway callback received:', req.body);
    const { sessionId, order_id, amount, transaction_id, status } = req.body || {};
    appendLog('mock-callback', req.body);

    // Post to our own /payment-webhook endpoint to reuse processing logic; mark as mock
  const payload = { order_id, transaction_id, amount, status, payment_method: 'mock', __mock_session: true };
  appendLog('mock-callback-response', { order_id, transaction_id, status, amount });

    // Process the webhook payload directly in-process to avoid network calls
    try {
      const result = await processWebhookPayload({ ...payload, __mock_session: true, sessionId });
      console.log('processWebhookPayload result from mock callback:', result);
      appendLog('webhook-processed', { order_id, transaction_id, status: result && result.success ? 'success' : 'email_failed', amount: amount || 0, detail: result });
      if (!result || !result.success) {
        // Do not redirect the customer if emails failed — show a clear error page
        return res.status(502).send(`<html><body><h3>Payment processed but invoice delivery failed</h3><p>We were unable to send the invoice by email. Our team will retry automatically. Transaction: ${transaction_id}</p><p><a href=\"/\">Return to shop</a></p></body></html>`);
      }
    } catch (e) {
      console.warn('processWebhookPayload threw an error from mock callback:', e && (e.stack || e));
      return res.status(500).send(`<html><body><h3>Internal error processing payment</h3><pre>${e && (e.stack || e)}</pre></body></html>`);
    }

    // Redirect back to return_url if available else show a simple page
    const sessionsFile = path.join(DATA_DIR, 'sessions.json');
    let sessions = [];
    try { sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '[]'); } catch (e) { sessions = []; }
    const session = sessions.find(s => s.sessionId === sessionId) || {};
    if (session.return_url) {
      // Append transaction info safely
      try {
        const base = `${req.protocol}://${req.get('host')}`;
        const url = new URL(session.return_url, base);
        url.searchParams.set('transaction_id', transaction_id || '');
        url.searchParams.set('status', status || '');
        return res.redirect(url.toString());
      } catch (e) {
        console.warn('Invalid return_url in session, cannot redirect:', session.return_url, e && e.message);
        // fallthrough to render page below
      }
    }

    // Otherwise show a simple result page
    return res.send(`<html><body><h3>Payment ${String(status)}</h3><p>Transaction: ${transaction_id || ''}</p><p><a href=\"/\">Return to shop</a></p></body></html>`);
  } catch (err) {
    console.error('Mock gateway callback failed:', err && (err.stack || err));
    // Return a detailed error page to help local debugging even when NODE_ENV=production
    const details = (err && (err.stack || err.message || String(err))) || 'Unknown error';
    res.status(500).set('Content-Type', 'text/html');
    return res.send(`<html><body><h3>Mock gateway error</h3><pre>${details}</pre></body></html>`);
  }
});

// Health check endpoint
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Contact form endpoint
app.post('/send-contact', async (req, res) => {
    console.log('Contact form submission:', req.body);
    const {
        name,
        email,
        phone,
        subject,
        message,
        language = 'ar'
    } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: language === 'ar' 
                ? 'يرجى ملء جميع الحقول المطلوبة'
                : 'Please fill in all required fields'
        });
    }

    // Create email templates
    const contactTemplateAr = (data) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body { max-width:600px; margin:auto; padding:20px; background:#ffd6e7; color:#333333; font-family:'Segoe UI',Tahoma,sans-serif; }
        .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #c06c84; padding-bottom:15px; }
        .header h1 { color:#8a2d52; margin:5px 0; }
        .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
        .info-table td { padding:8px 10px; border-bottom:1px solid #f8f9fa; }
        .message-box { background:#fff; padding:20px; border-radius:10px; margin:20px 0; border-left:4px solid #c06c84; }
    </style>
</head>
<body>
    <div class="header">
        <h1>رسالة جديدة من موقع مياسه ستيل</h1>
    </div>
    
    <table class="info-table">
        <tr>
            <td width="30%"><strong>الاسم:</strong></td>
            <td>${data.name}</td>
        </tr>
        <tr>
            <td><strong>البريد الإلكتروني:</strong></td>
            <td>${data.email}</td>
        </tr>
        ${data.phone ? `
        <tr>
            <td><strong>رقم الهاتف:</strong></td>
            <td>${data.phone}</td>
        </tr>
        ` : ''}
        <tr>
            <td><strong>الموضوع:</strong></td>
            <td>${data.subject}</td>
        </tr>
    </table>
    
    <div class="message-box">
        <h3>الرسالة:</h3>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
    </div>
    
    <div style="text-align:center; margin-top:30px; color:#777; font-size:14px;">
        <p>تم إرسال هذه الرسالة من نموذج الاتصال في موقع مياسه ستيل</p>
    </div>
</body>
</html>`;

    const contactTemplateEn = (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { max-width:600px; margin:auto; padding:20px; background:#ffd6e7; color:#333333; font-family:'Segoe UI',Tahoma,sans-serif; }
        .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #c06c84; padding-bottom:15px; }
        .header h1 { color:#8a2d52; margin:5px 0; }
        .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
        .info-table td { padding:8px 10px; border-bottom:1px solid #f8f9fa; }
        .message-box { background:#fff; padding:20px; border-radius:10px; margin:20px 0; border-left:4px solid #c06c84; }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Message from Mayasah Style Website</h1>
    </div>
    
    <table class="info-table">
        <tr>
            <td width="30%"><strong>Name:</strong></td>
            <td>${data.name}</td>
        </tr>
        <tr>
            <td><strong>Email:</strong></td>
            <td>${data.email}</td>
        </tr>
        ${data.phone ? `
        <tr>
            <td><strong>Phone:</strong></td>
            <td>${data.phone}</td>
        </tr>
        ` : ''}
        <tr>
            <td><strong>Subject:</strong></td>
            <td>${data.subject}</td>
        </tr>
    </table>
    
    <div class="message-box">
        <h3>Message:</h3>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
    </div>
    
    <div style="text-align:center; margin-top:30px; color:#777; font-size:14px;">
        <p>This message was sent from the contact form on Mayasah Style website</p>
    </div>
</body>
</html>`;

    try {
        // Email to you (business owner)
        await transporter.sendMail({
            from: language === 'ar'
                ? '"مياسه ستيل" <mayasahstyle@gmail.com>'
                : '"Mayasah Style" <mayasahstyle@gmail.com>',
            to: 'mayasahstyle@gmail.com',
            subject: language === 'ar' 
                ? `رسالة جديدة: ${subject}`
                : `New Contact Message: ${subject}`,
            html: language === 'ar' 
                ? contactTemplateAr({ name, email, phone, subject, message })
                : contactTemplateEn({ name, email, phone, subject, message })
        });

        // Confirmation email to customer
        const confirmationSubject = language === 'ar' 
            ? 'تم استلام رسالتك - مياسه ستيل'
            : 'Message Received - Mayasah Style';
            
        const confirmationTemplate = language === 'ar' ? `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body { max-width:600px; margin:auto; padding:20px; background:#ffd6e7; color:#333333; font-family:'Segoe UI',Tahoma,sans-serif; }
        .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #c06c84; padding-bottom:15px; }
        .header h1 { color:#8a2d52; margin:5px 0; }
        .message { background:#fff; padding:20px; border-radius:10px; margin:20px 0; border-left:4px solid #c06c84; }
    </style>
</head>
<body>
    <div class="header">
        <h1>شكراً لك ${name}</h1>
    </div>
    
    <div class="message">
        <p>تم استلام رسالتك بنجاح وسنقوم بالرد عليك في أقرب وقت ممكن.</p>
        <p><strong>تفاصيل رسالتك:</strong></p>
        <ul>
            <li><strong>الموضوع:</strong> ${subject}</li>
            <li><strong>الرسالة:</strong> ${message}</li>
        </ul>
    </div>
    
    <div style="text-align:center; margin-top:30px; color:#777; font-size:14px;">
        <p>مياسه ستيل - أناقة متجددة كل يوم</p>
    </div>
</body>
</html>` : `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { max-width:600px; margin:auto; padding:20px; background:#ffd6e7; color:#333333; font-family:'Segoe UI',Tahoma,sans-serif; }
        .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #c06c84; padding-bottom:15px; }
        .header h1 { color:#8a2d52; margin:5px 0; }
        .message { background:#fff; padding:20px; border-radius:10px; margin:20px 0; border-left:4px solid #c06c84; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Thank you ${name}</h1>
    </div>
    
    <div class="message">
        <p>Your message has been received successfully and we will respond to you as soon as possible.</p>
        <p><strong>Your message details:</strong></p>
        <ul>
            <li><strong>Subject:</strong> ${subject}</li>
            <li><strong>Message:</strong> ${message}</li>
        </ul>
    </div>
    
    <div style="text-align:center; margin-top:30px; color:#777; font-size:14px;">
        <p>Mayasah Style - Renewed Elegance Every Day</p>
    </div>
</body>
</html>`;

        await transporter.sendMail({
            from: language === 'ar'
                ? '"مياسه ستيل" <mayasahstyle@gmail.com>'
                : '"Mayasah Style" <mayasahstyle@gmail.com>',
            to: email,
            subject: confirmationSubject,
            html: confirmationTemplate
        });

        console.log('Contact form emails sent successfully');
        res.json({ 
            success: true, 
            message: language === 'ar' 
                ? 'تم إرسال رسالتك بنجاح'
                : 'Your message has been sent successfully'
        });
        
    } catch (emailError) {
        console.error('Contact form email sending failed:', emailError);
        
        res.status(500).json({ 
            success: false, 
            error: 'Email delivery failed',
            message: language === 'ar' 
                ? 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى أو التواصل معنا.'
                : 'Failed to send message. Please try again or contact us.',
            details: emailError.message
        });
    }
});

// Consent logging endpoint: accepts consent data and stores for audit
app.post('/log-consent', (req, res) => {
  try {
    const data = req.body || {};
    const existing = JSON.parse(fs.readFileSync(CONSENTS_FILE, 'utf8') || '[]');
    existing.push(Object.assign({}, data, { received_at: new Date().toISOString() }));
    fs.writeFileSync(CONSENTS_FILE, JSON.stringify(existing, null, 2), 'utf8');
    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to log consent:', err);
    return res.status(500).json({ success: false, error: err.message || err });
  }
});

// Set consent cookie server-side (callable from client after saving preferences)
app.post('/set-consent-cookie', (req, res) => {
  try {
    const consent = req.body && req.body.consent ? req.body.consent : null;
    if (!consent) return res.status(400).json({ success: false, message: 'Missing consent payload' });

    // Set cookie with JSON value (URL-encoded) - short-lived for privacy
    const cookieValue = encodeURIComponent(JSON.stringify({ consent, timestamp: new Date().toISOString() }));
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    res.cookie('mayasah_cookie_consent', cookieValue, {
      httpOnly: false, // readable by JS if needed; only set server-side for server awareness
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: oneYear,
      path: '/'
    });

    // Also persist to consents file for audit
    const existing = JSON.parse(fs.readFileSync(CONSENTS_FILE, 'utf8') || '[]');
    existing.push({ consent, received_at: new Date().toISOString(), source: 'cookie-endpoint' });
    fs.writeFileSync(CONSENTS_FILE, JSON.stringify(existing, null, 2), 'utf8');

    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to set consent cookie:', err);
    return res.status(500).json({ success: false, error: err.message || err });
  }
});

// Resend invoice endpoint (admin) - will try to reconstruct order and resend/save invoice
app.post('/resend-invoice', async (req, res) => {
  const { order_id } = req.body || {};
  if (!order_id) return res.status(400).json({ success: false, message: 'order_id required' });

  try {
    // Load sessions and payments to find data
    const sessionsFile = path.join(DATA_DIR, 'sessions.json');
    let sessions = [];
    try { sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '[]'); } catch (e) { sessions = []; }

    const payments = loadProcessedPayments();

    // Prefer session order_data if available
    const sess = sessions.slice().reverse().find(s => s.order_id === order_id) || null;
    const pay = payments.slice().reverse().find(p => p.order_id === order_id) || null;

    const orderData = {
      order_id,
      customer_name: (sess && sess.order_data && sess.order_data.customer_name) || (pay && pay.customer_name) || '',
      customer_email: (sess && sess.order_data && sess.order_data.customer_email) || (pay && pay.customer_email) || '',
      customer_phone: (sess && sess.order_data && sess.order_data.customer_phone) || (pay && pay.customer_phone) || '',
      address: (sess && sess.order_data && sess.order_data.address) || (pay && pay.address) || '',
      city: (sess && sess.order_data && sess.order_data.city) || (pay && pay.city) || '',
      zip_code: (sess && sess.order_data && sess.order_data.zip_code) || (pay && pay.zip_code) || '',
      notes: (sess && sess.order_data && sess.order_data.notes) || (pay && pay.notes) || '',
      items: (sess && sess.order_data && sess.order_data.items) || (pay && pay.items) || [],
      subtotal: (sess && sess.order_data && sess.order_data.subtotal) || (pay && pay.subtotal) || 0,
      tax_rate: (sess && sess.order_data && sess.order_data.tax_rate) || (pay && pay.tax_rate) || 15,
      tax: (sess && sess.order_data && sess.order_data.tax) || (pay && pay.tax) || 0,
      shipping_cost: (sess && sess.order_data && sess.order_data.shipping_cost) || (pay && pay.shipping_cost) || 0,
      total: (pay && pay.amount) || (sess && sess.amount) || 0,
      language: (sess && sess.order_data && sess.order_data.language) || (pay && pay.language) || 'en',
      support_phone: '0500000000',
      support_email: EMAIL_USER,
      business_name: 'Mayasah Style'
    };

    // Build email HTML using same templates
    const lang = orderData.language;
    const computedSubtotal = orderData.subtotal || 0;
    const computedTax = +(computedSubtotal * (orderData.tax_rate ? orderData.tax_rate / 100 : 0.15)).toFixed(2);
    const computedTotal = +(computedSubtotal + computedTax + (Number(orderData.shipping_cost) || 0)).toFixed(2);
    let htmlCustomer, subjectCustomer, htmlOwner, subjectOwner;
    if (lang === 'ar') {
      subjectCustomer = `تأكيد الدفع - طلب رقم ${order_id}`;
      htmlCustomer = customerTemplateAr({ order_number: order_id, order_date: new Date().toLocaleDateString('ar-EG'), current_year: new Date().getFullYear(), support_phone: orderData.support_phone, support_email: orderData.support_email, business_name: orderData.business_name, items: orderData.items, subtotal: computedSubtotal, tax_rate: orderData.tax_rate, tax: computedTax, shipping_cost: orderData.shipping_cost, total: computedTotal, customer_name: orderData.customer_name, customer_email: orderData.customer_email, customer_phone: orderData.customer_phone, address: orderData.address, city: orderData.city, zip_code: orderData.zip_code, notes: orderData.notes });
      subjectOwner = `تم الدفع - طلب رقم ${order_id}`;
      htmlOwner = ownerTemplate({ order_number: order_id, order_date: new Date().toLocaleDateString('ar-EG'), current_year: new Date().getFullYear(), support_phone: orderData.support_phone, support_email: orderData.support_email, business_name: orderData.business_name, items: orderData.items, subtotal: computedSubtotal, tax_rate: orderData.tax_rate, tax: computedTax, shipping_cost: orderData.shipping_cost, total: computedTotal, customer_name: orderData.customer_name, customer_email: orderData.customer_email, customer_phone: orderData.customer_phone, address: orderData.address, city: orderData.city, zip_code: orderData.zip_code, notes: orderData.notes });
    } else {
      subjectCustomer = `Payment Confirmation - Order #${order_id}`;
      htmlCustomer = customerTemplateEn({ order_number: order_id, order_date: new Date().toLocaleDateString('en-US'), current_year: new Date().getFullYear(), support_phone: orderData.support_phone, support_email: orderData.support_email, business_name: orderData.business_name, items: orderData.items, subtotal: computedSubtotal, tax_rate: orderData.tax_rate, tax: computedTax, shipping_cost: orderData.shipping_cost, total: computedTotal, customer_name: orderData.customer_name, customer_email: orderData.customer_email, customer_phone: orderData.customer_phone, address: orderData.address, city: orderData.city, zip_code: orderData.zip_code, notes: orderData.notes });
      subjectOwner = `Payment Received - Order #${order_id}`;
      htmlOwner = ownerTemplate({ order_number: order_id, order_date: new Date().toLocaleDateString('en-US'), current_year: new Date().getFullYear(), support_phone: orderData.support_phone, support_email: orderData.support_email, business_name: orderData.business_name, items: orderData.items, subtotal: computedSubtotal, tax_rate: orderData.tax_rate, tax: computedTax, shipping_cost: orderData.shipping_cost, total: computedTotal, customer_name: orderData.customer_name, customer_email: orderData.customer_email, customer_phone: orderData.customer_phone, address: orderData.address, city: orderData.city, zip_code: orderData.zip_code, notes: orderData.notes });
    }

    // Save HTML to disk
    try { if (!fs.existsSync(path.join(DATA_DIR, 'emails'))) fs.mkdirSync(path.join(DATA_DIR, 'emails')); } catch (e) { }
    const customerEmailFile = path.join(DATA_DIR, 'emails', `${order_id}-customer.html`);
    const ownerEmailFile = path.join(DATA_DIR, 'emails', `${order_id}-owner.html`);
    try { fs.writeFileSync(customerEmailFile, htmlCustomer, 'utf8'); } catch (e) { }
    try { fs.writeFileSync(ownerEmailFile, htmlOwner, 'utf8'); } catch (e) { }

    // Try sending (best-effort) and log errors
    let emailErrors = [];
    try {
      await transporter.sendMail({ from: `"${orderData.business_name}" <${EMAIL_USER}>`, to: orderData.customer_email, subject: subjectCustomer, html: htmlCustomer });
    } catch (e) { emailErrors.push({ to: orderData.customer_email, error: e && (e.message || String(e)) }); try { fs.appendFileSync(path.join(DATA_DIR, 'email-errors.log'), `[${new Date().toISOString()}] resend ${order_id} ${JSON.stringify(emailErrors)}\n`, 'utf8'); } catch (ee) {} }
    try {
      await transporter.sendMail({ from: `"${orderData.business_name}" <${EMAIL_USER}>`, to: EMAIL_USER, subject: subjectOwner, html: htmlOwner });
    } catch (e) { emailErrors.push({ to: EMAIL_USER, error: e && (e.message || String(e)) }); try { fs.appendFileSync(path.join(DATA_DIR, 'email-errors.log'), `[${new Date().toISOString()}] resend ${order_id} ${JSON.stringify(emailErrors)}\n`, 'utf8'); } catch (ee) {} }

    return res.json({ success: true, savedFiles: { customer: customerEmailFile, owner: ownerEmailFile }, emailErrors: emailErrors.length ? emailErrors : undefined });
  } catch (err) {
    console.error('Resend invoice failed:', err && (err.stack || err));
    return res.status(500).json({ success: false, error: err && (err.message || String(err)) });
  }
});

// Admin endpoint to list failed payments (sqlite if available, else file fallback)
app.get('/admin/failed-payments', async (req, res) => {
  try {
    if (dbHelper) {
      await dbHelper.init().catch(() => {});
      const rows = await dbHelper.getFailedPayments(200);
      return res.json(rows || []);
    }
    const payments = loadProcessedPayments();
    const failed = payments.filter(p => String(p.status).toLowerCase() === 'email_failed').slice(-200).reverse();
    return res.json(failed);
  } catch (err) {
    console.error('failed-payments error', err && (err.stack || err));
    return res.status(500).json({ success: false, error: err && (err.message || String(err)) });
  }
});


// Helper: resend invoice for a payment record (used by worker and admin retry)
async function resendInvoiceFromPayment(payment) {
  if (!payment || !payment.order_id) return { success: false, message: 'missing payment or order_id' };
  const order_id = payment.order_id;
  try {
    // Reuse the logic from /resend-invoice to construct orderData
    const sessionsFile = path.join(DATA_DIR, 'sessions.json');
    let sessions = [];
    try { sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '[]'); } catch (e) { sessions = []; }
    const payments = loadProcessedPayments();
    const sess = sessions.slice().reverse().find(s => s.order_id === order_id) || null;
    const pay = payments.slice().reverse().find(p => p.order_id === order_id) || payment || null;

    const orderData = {
      order_id,
      customer_name: (sess && sess.order_data && sess.order_data.customer_name) || (pay && pay.customer_name) || '',
      customer_email: (sess && sess.order_data && sess.order_data.customer_email) || (pay && pay.customer_email) || '',
      customer_phone: (sess && sess.order_data && sess.order_data.customer_phone) || (pay && pay.customer_phone) || '',
      address: (sess && sess.order_data && sess.order_data.address) || (pay && pay.address) || '',
      city: (sess && sess.order_data && sess.order_data.city) || (pay && pay.city) || '',
      zip_code: (sess && sess.order_data && sess.order_data.zip_code) || (pay && pay.zip_code) || '',
      notes: (sess && sess.order_data && sess.order_data.notes) || (pay && pay.notes) || '',
      items: (sess && sess.order_data && sess.order_data.items) || (pay && pay.items) || [],
      subtotal: (sess && sess.order_data && sess.order_data.subtotal) || (pay && pay.subtotal) || 0,
      tax_rate: (sess && sess.order_data && sess.order_data.tax_rate) || (pay && pay.tax_rate) || 15,
      tax: (sess && sess.order_data && sess.order_data.tax) || (pay && pay.tax) || 0,
      shipping_cost: (sess && sess.order_data && sess.order_data.shipping_cost) || (pay && pay.shipping_cost) || 0,
      total: (pay && pay.amount) || (sess && sess.amount) || 0,
      language: (sess && sess.order_data && sess.order_data.language) || (pay && pay.language) || 'en',
      support_phone: '0500000000',
      support_email: EMAIL_USER,
      business_name: 'Mayasah Style'
    };

    const lang = orderData.language;
    const computedSubtotal = orderData.subtotal || 0;
    const computedTax = +(computedSubtotal * (orderData.tax_rate ? orderData.tax_rate / 100 : 0.15)).toFixed(2);
    const computedTotal = +(computedSubtotal + computedTax + (Number(orderData.shipping_cost) || 0)).toFixed(2);
    let htmlCustomer, subjectCustomer, htmlOwner, subjectOwner;
    if (lang === 'ar') {
      subjectCustomer = `تأكيد الدفع - طلب رقم ${order_id}`;
      htmlCustomer = customerTemplateAr({ order_number: order_id, order_date: new Date().toLocaleDateString('ar-EG'), current_year: new Date().getFullYear(), support_phone: orderData.support_phone, support_email: orderData.support_email, business_name: orderData.business_name, items: orderData.items, subtotal: computedSubtotal, tax_rate: orderData.tax_rate, tax: computedTax, shipping_cost: orderData.shipping_cost, total: computedTotal, customer_name: orderData.customer_name, customer_email: orderData.customer_email, customer_phone: orderData.customer_phone, address: orderData.address, city: orderData.city, zip_code: orderData.zip_code, notes: orderData.notes });
      subjectOwner = `تم الدفع - طلب رقم ${order_id}`;
      htmlOwner = ownerTemplate({ order_number: order_id, order_date: new Date().toLocaleDateString('ar-EG'), current_year: new Date().getFullYear(), support_phone: orderData.support_phone, support_email: orderData.support_email, business_name: orderData.business_name, items: orderData.items, subtotal: computedSubtotal, tax_rate: orderData.tax_rate, tax: computedTax, shipping_cost: orderData.shipping_cost, total: computedTotal, customer_name: orderData.customer_name, customer_email: orderData.customer_email, customer_phone: orderData.customer_phone, address: orderData.address, city: orderData.city, zip_code: orderData.zip_code, notes: orderData.notes });
    } else {
      subjectCustomer = `Payment Confirmation - Order #${order_id}`;
      htmlCustomer = customerTemplateEn({ order_number: order_id, order_date: new Date().toLocaleDateString('en-US'), current_year: new Date().getFullYear(), support_phone: orderData.support_phone, support_email: orderData.support_email, business_name: orderData.business_name, items: orderData.items, subtotal: computedSubtotal, tax_rate: orderData.tax_rate, tax: computedTax, shipping_cost: orderData.shipping_cost, total: computedTotal, customer_name: orderData.customer_name, customer_email: orderData.customer_email, customer_phone: orderData.customer_phone, address: orderData.address, city: orderData.city, zip_code: orderData.zip_code, notes: orderData.notes });
      subjectOwner = `Payment Received - Order #${order_id}`;
      htmlOwner = ownerTemplate({ order_number: order_id, order_date: new Date().toLocaleDateString('en-US'), current_year: new Date().getFullYear(), support_phone: orderData.support_phone, support_email: orderData.support_email, business_name: orderData.business_name, items: orderData.items, subtotal: computedSubtotal, tax_rate: orderData.tax_rate, tax: computedTax, shipping_cost: orderData.shipping_cost, total: computedTotal, customer_name: orderData.customer_name, customer_email: orderData.customer_email, customer_phone: orderData.customer_phone, address: orderData.address, city: orderData.city, zip_code: orderData.zip_code, notes: orderData.notes });
    }

    // Save HTML to disk
    try { if (!fs.existsSync(path.join(DATA_DIR, 'emails'))) fs.mkdirSync(path.join(DATA_DIR, 'emails')); } catch (e) { }
    const customerEmailFile = path.join(DATA_DIR, 'emails', `${order_id}-customer.html`);
    const ownerEmailFile = path.join(DATA_DIR, 'emails', `${order_id}-owner.html`);
    try { fs.writeFileSync(customerEmailFile, htmlCustomer, 'utf8'); } catch (e) { }
    try { fs.writeFileSync(ownerEmailFile, htmlOwner, 'utf8'); } catch (e) { }

    // Try sending with retry helper
    const custOpts = { from: `"${orderData.business_name}" <${EMAIL_USER}>`, to: orderData.customer_email, subject: subjectCustomer, html: htmlCustomer };
    const ownerOpts = { from: `"${orderData.business_name}" <${EMAIL_USER}>`, to: EMAIL_USER, subject: subjectOwner, html: htmlOwner };
    const custResult = await sendWithRetry(custOpts, 3, 800);
    const ownerResult = await sendWithRetry(ownerOpts, 3, 800);
    const failed = [];
    if (!custResult || !custResult.success) failed.push({ to: orderData.customer_email, result: custResult });
    if (!ownerResult || !ownerResult.success) failed.push({ to: EMAIL_USER, result: ownerResult });

    if (failed.length === 0) {
      // update payment record to success
      const all = loadProcessedPayments();
      const idx = all.findIndex(p => p.transaction_id === (payment.transaction_id || p.transaction_id) || p.order_id === order_id);
      const now = new Date().toISOString();
      if (idx >= 0) {
        all[idx] = Object.assign({}, all[idx], { status: 'success', processed_at: now });
      } else {
        all.push({ order_id, transaction_id: payment.transaction_id || null, status: 'success', amount: orderData.total || computedTotal, payment_method: payment.payment_method || 'mock', processed_at: now });
      }
      saveProcessedPayments(all);
      appendLog('email-retry', { order_id, transaction_id: payment.transaction_id || null, result: 'success' });
      return { success: true };
    }

    // still failing
    appendLog('email-retry', { order_id, transaction_id: payment.transaction_id || null, result: 'failed', failures: failed });
    try { fs.appendFileSync(path.join(DATA_DIR, 'email-errors.log'), `[${new Date().toISOString()}] retry ${order_id} ${JSON.stringify(failed)}\n`, 'utf8'); } catch (e) { }
    return { success: false, failures: failed };
  } catch (err) {
    appendLog('email-retry', { order_id, transaction_id: payment.transaction_id || null, error: err && (err.message || String(err)) });
    return { success: false, error: err && (err.message || String(err)) };
  }
}

// Retry worker: scan payments.json for email_failed entries and attempt to resend
async function retryFailedEmailsOnce(limit = 10) {
  try {
    const payments = loadProcessedPayments();
    const failed = payments.filter(p => String(p.status).toLowerCase() === 'email_failed');
    if (!failed.length) return { checked: payments.length, toRetry: 0 };
    const results = [];
    for (let i = 0; i < Math.min(limit, failed.length); i++) {
      const p = failed[i];
      const r = await resendInvoiceFromPayment(p);
      results.push({ order_id: p.order_id, transaction_id: p.transaction_id, result: r });
    }
    return { checked: payments.length, attempted: results.length, results };
  } catch (err) {
    appendLog('email-retry', { error: err && (err.message || String(err)) });
    return { success: false, error: err && (err.message || String(err)) };
  }
}

// Admin endpoint to trigger retry of failed emails (optionally for a specific order_id)
app.post('/admin/retry-failed-emails', express.json(), async (req, res) => {
  const adminKey = process.env.ADMIN_KEY || null;
  if (adminKey && req.headers['x-admin-key'] !== adminKey) return res.status(403).json({ success: false, message: 'Invalid admin key' });
  const { order_id } = req.body || {};
  try {
    const payments = loadProcessedPayments();
    let targets = payments.filter(p => String(p.status).toLowerCase() === 'email_failed');
    if (order_id) targets = targets.filter(p => p.order_id === order_id);
    if (!targets.length) return res.json({ success: true, message: 'No email_failed payments found', checked: payments.length });
    const results = [];
    for (const p of targets) {
      const r = await resendInvoiceFromPayment(p);
      results.push({ order_id: p.order_id, transaction_id: p.transaction_id, result: r });
    }
    return res.json({ success: true, attempted: results.length, results });
  } catch (err) {
    console.error('Admin retry failed:', err && (err.stack || err));
    return res.status(500).json({ success: false, error: err && (err.message || String(err)) });
  }
});

// Start background retry worker unless explicitly disabled
const EMAIL_RETRY_ENABLED = (process.env.EMAIL_RETRY_ENABLED || 'true') === 'true';
const EMAIL_RETRY_INTERVAL_MS = parseInt(process.env.EMAIL_RETRY_INTERVAL_MS || String(5 * 60 * 1000), 10); // default 5 minutes
if (EMAIL_RETRY_ENABLED) {
  console.log(`Email retry worker enabled; interval=${EMAIL_RETRY_INTERVAL_MS}ms`);
  // Run once after startup, then periodically
  (async () => {
    try { const r = await retryFailedEmailsOnce(20); appendLog('email-retry-startup', r); } catch (e) { appendLog('email-retry-startup-error', e && (e.message || String(e))); }
  })();
  setInterval(() => {
    retryFailedEmailsOnce(20).then(r => appendLog('email-retry', r)).catch(e => appendLog('email-retry-error', e && (e.message || String(e))));
  }, EMAIL_RETRY_INTERVAL_MS);
} else {
  console.log('Email retry worker is disabled (EMAIL_RETRY_ENABLED=false)');
}

const PORT = process.env.PORT || 3000;
// Bind to 0.0.0.0 so the server is reachable from other devices on the LAN
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'undefined'})`));

// Catch unhandled rejections and exceptions to avoid silent exits
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at Promise', p, 'reason:', reason && (reason.stack || reason));
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception', err && (err.stack || err));
});

