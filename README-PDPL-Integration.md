# PDPL Cookie Banner Integration Guide
## Mayasah Style - Saudi Arabia Personal Data Protection Law (PDPL) Compliance

### Overview
This implementation provides a comprehensive PDPL-compliant cookie consent banner for the Mayasah Style website, ensuring compliance with Saudi Arabia's Personal Data Protection Law.

### Key Features ✅

1. **⚖️ PDPL Compliance**
   - Explicit prior consent for non-essential cookies
   - Granular cookie categories (Necessary, Analytics, Marketing)
   - Arabic-first display with right-to-left (RTL) support
   - Privacy policy link and data subject rights disclosure
   - Auto-blocking of non-essential scripts until consent
   - Consent logging for audit trails

2. **🌍 Bilingual Support**
   - Full Arabic and English language support
   - Automatic language detection based on document settings
   - Manual language switching capabilities
   - RTL/LTR layout adaptation
   - Integrated with existing translation system

3. **🎨 Design Integration**
   - Matches Mayasah Style brand colors and typography
   - Responsive design for all devices
   - Smooth animations and transitions
   - Professional Arabic UI/UX

4. **🔧 Technical Features**
   - Automatic script blocking/unblocking
   - LocalStorage persistence
   - Server-side consent logging capability
   - Custom event system for integration
   - Public API for external control

### Quick Integration

#### Step 1: Add the Script
Add this line to your HTML pages (before closing `</body>` tag):

```html
<script src="pdpl-cookie-manager.js"></script>
```

#### Step 2: Mark Your Scripts
Add data attributes to your non-essential scripts:

```html
<!-- Analytics Scripts -->
<script data-cookie-category="analytics">
    // Google Analytics, etc.
</script>

<!-- Marketing Scripts -->
<script data-cookie-category="marketing">
    // Facebook Pixel, etc.
</script>
```

#### Step 3: Test the Implementation
The banner will automatically appear for new visitors and handle consent management.

### Advanced Configuration

#### Custom Options
```javascript
// Initialize with custom options
const cookieManager = new PDPLCookieManager({
    bannerId: 'custom-banner-id',
    storageKey: 'custom_consent_key',
    serverEndpoint: '/api/consent-log',
    categories: ['necessary', 'analytics', 'marketing', 'social']
});
```

#### Public API Methods
```javascript
// Check if user has consented to analytics
if (window.pdplCookieManager.hasConsent('analytics')) {
    // Load analytics
}

// Get full consent object
const consent = window.pdplCookieManager.getConsent();

// Update specific consent
window.pdplCookieManager.updateConsent('marketing', true);

// Clear all consent and show banner again
window.pdplCookieManager.clearConsent();

// Language management
window.pdplCookieManager.setLanguage('en'); // Set to English
window.pdplCookieManager.setLanguage('ar'); // Set to Arabic
window.pdplCookieManager.toggleLanguage(); // Toggle between languages
const currentLang = window.pdplCookieManager.getLanguage(); // Get current language
```

#### Event Listeners
```javascript
// Listen for consent changes
document.addEventListener('pdplConsentChanged', function(event) {
    const consent = event.detail.consent;
    console.log('Consent changed:', consent);
    
    // Handle consent changes in your app
    if (consent.analytics) {
        // Initialize analytics
    }
});

// Listen for language changes
document.addEventListener('pdplLanguageChanged', function(event) {
    const language = event.detail.language;
    console.log('Language changed:', language);
    
    // Handle language changes in your app
    // The banner will automatically update its content
});

### Server-Side Integration

#### Consent Logging Endpoint
Create an API endpoint to log consent for audit trails:

```javascript
// Example Node.js/Express endpoint
app.post('/api/consent-log', (req, res) => {
    const logData = req.body;
    
    // Store in database
    const consentLog = {
        timestamp: logData.timestamp,
        consent: logData.consent,
        userAgent: logData.userAgent,
        url: logData.url,
        referrer: logData.referrer,
        ip: req.ip
    };
    
    // Save to database
    db.consentLogs.insert(consentLog);
    
    res.json({ success: true });
});
```

### Cookie Categories

#### 1. Necessary (ضرورية)
- **Always enabled** - Cannot be disabled
- Essential for website functionality
- Session management, security, basic features

#### 2. Analytics (تحليلية)
- Website usage analysis
- Performance monitoring
- User behavior insights
- Google Analytics, etc.

#### 3. Marketing (تسويقية)
- Personalized advertising
- Social media integration
- Remarketing campaigns
- Facebook Pixel, etc.

### Compliance Checklist ✅

- [x] **Explicit Consent**: Users must actively choose to accept cookies
- [x] **Granular Control**: Separate toggles for different cookie types
- [x] **Arabic Language**: Primary language support with RTL layout
- [x] **Privacy Policy Link**: Direct link to privacy policy
- [x] **Clear Information**: Detailed descriptions of each cookie type
- [x] **Easy Withdrawal**: Users can change preferences anytime
- [x] **Audit Trail**: Consent logging for compliance records
- [x] **Script Blocking**: Non-essential scripts blocked until consent
- [x] **Mobile Responsive**: Works on all device sizes
- [x] **Accessibility**: Keyboard navigation and screen reader support

### Testing

#### Test Scenarios
1. **New Visitor**: Banner should appear
2. **Consent Given**: Banner should hide, scripts should load
3. **Consent Denied**: Banner should hide, scripts should remain blocked
4. **Preferences Changed**: Should update consent and reload scripts
5. **Consent Cleared**: Banner should reappear
6. **Language Switching**: Banner should update content and layout

#### Browser Testing
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- RTL language support
- LocalStorage functionality
- Language detection and switching

### Demo Pages

- **`cookie-banner-demo.html`** - Interactive demo showcasing bilingual functionality
- **`test-cookie-banner.html`** - Comprehensive testing page with all features
- **`cookie-banner.html`** - Standalone banner example

### Troubleshooting

#### Common Issues

**Banner not appearing:**
- Check if script is loaded
- Verify no existing consent in localStorage
- Check browser console for errors

**Scripts not loading after consent:**
- Verify script tags have correct `data-cookie-category` attributes
- Check if scripts are being blocked by browser extensions
- Ensure consent is properly stored in localStorage

**Styling issues:**
- Verify CSS variables are defined
- Check for conflicting CSS rules
- Ensure Font Awesome is loaded for icons

### Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Storage**: Consider encrypted localStorage for sensitive data
3. **Server Validation**: Validate consent data on server-side
4. **Regular Audits**: Monitor consent logs for compliance
5. **Data Retention**: Implement proper data retention policies

### Performance Impact

- **Minimal**: Banner loads only once per session
- **Lightweight**: ~15KB total (CSS + JS)
- **Fast**: No external dependencies except Font Awesome
- **Efficient**: Scripts loaded only when needed

### Support

For technical support or customization requests:
- Check browser console for error messages
- Verify all integration steps are completed
- Test with different browsers and devices
- Review compliance requirements regularly

### Version History

- **v1.1**: Added bilingual support
  - Full English and Arabic language support
  - Automatic language detection
  - Manual language switching
  - RTL/LTR layout adaptation
  - Integration with existing translation system

- **v1.0**: Initial release with PDPL compliance
  - Full Arabic support with RTL layout
  - Granular consent categories
  - Automatic script management
  - Audit trail logging

---

**Note**: This implementation is designed for Saudi Arabia's PDPL compliance. For other jurisdictions, additional modifications may be required to meet local privacy laws. 