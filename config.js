// ========================================
// 🔐 CONFIGURATION FILE - TEMPLATE
// ========================================
// After deploying to GitHub Pages, you need to manually edit this file
// on your hosting to add your real Brevo API key

console.log('🔧 Loading config.js...');

// Appwrite Configuration
window.APPWRITE_PROJECT_ID = '68eb3e280039fdf7e677';
window.APPWRITE_DATABASE_ID = '68eb4036002db50c7171';

// Brevo Email API Key - REPLACE THIS AFTER DEPLOYMENT
// Instructions:
// 1. Go to your GitHub repository settings
// 2. Edit this file directly on GitHub website
// 3. Replace XXXXX below with your actual Brevo API key from https://app.brevo.com/settings/keys/api
// 4. Commit the change
window.BREVO_API_KEY = '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';

if (window.BREVO_API_KEY && window.BREVO_API_KEY.indexOf('XXXXX') === -1) {
    console.log('✓ Brevo API key configured');
} else {
    console.warn('⚠️ Brevo API key NOT configured. Edit config.js on GitHub to add your key.');
}

// Moyasar Payment Gateway API Key (when you get it)
window.MOYASAR_API_KEY = '';

console.log('✓ Config file loaded');
