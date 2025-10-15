// ========================================
// 🔐 CONFIGURATION FILE - TEMPLATE
// ========================================
// After deploying to GitHub Pages, you need to manually edit this file
// on your hosting to add your real Brevo API key

console.log('🔧 Loading config.js...');

// Appwrite Configuration
window.APPWRITE_PROJECT_ID = '68eb3e280039fdf7e677';
window.APPWRITE_DATABASE_ID = '68eb4036002db50c7171';

// Cloudflare Worker URL for sending emails (SECURE - no API key exposed in GitHub!)
// After you deploy the Cloudflare Worker, replace this with your worker URL
// Example: https://mayasah-email-sender.your-subdomain.workers.dev
window.EMAIL_WORKER_URL = 'REPLACE_WITH_YOUR_CLOUDFLARE_WORKER_URL';

if (window.EMAIL_WORKER_URL && window.EMAIL_WORKER_URL.indexOf('REPLACE') === -1) {
    console.log('✓ Email worker configured');
} else {
    console.warn('⚠️ Email worker NOT configured. Follow instructions in cloudflare-worker/DEPLOYMENT_INSTRUCTIONS.md');
}

// Moyasar Payment Gateway API Key (when you get it)
window.MOYASAR_API_KEY = '';

console.log('✓ Config file loaded');
