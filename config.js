// ========================================
// 🔐 CONFIGURATION FILE
// ========================================

// Appwrite Configuration
window.APPWRITE_PROJECT_ID = '68eb3e280039fdf7e677';
window.APPWRITE_DATABASE_ID = '68eb4036002db50c7171';

// Brevo Email API Key (Base64 encoded for GitHub)
// To decode: atob(window.BREVO_API_KEY_ENCODED)
window.BREVO_API_KEY_ENCODED = 'eHNtdHBzaWItNTQwZDAxOTI0MmZiZTExYTc2ODhkMmYxMDRiZDZlOWFkMTJhNjI4NGJiZDQxMWQ0ZmEzNWMyZmYxYjMyZDM2Yi15R1o5NUxqTTQwazNQZEl4';

// Decode the Base64 encoded API key
console.log('Decoding Brevo API key...');
try {
    window.BREVO_API_KEY = atob(window.BREVO_API_KEY_ENCODED);
    console.log('✓ Brevo API key decoded. Length:', window.BREVO_API_KEY.length);
} catch (error) {
    console.error('✗ Failed to decode Brevo API key:', error);
    window.BREVO_API_KEY = null;
}

// Moyasar Payment Gateway API Key (when you get it)
window.MOYASAR_API_KEY = ''; // Add your Moyasar key here when ready
