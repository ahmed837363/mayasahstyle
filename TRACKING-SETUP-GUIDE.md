# Tracking Setup Guide for Mayasah Style

This guide explains how to set up and track marketing and analytics with the PDPL-compliant cookie banner system.

## 🎯 What's Already Implemented

### Cookie Banner System
- ✅ PDPL-compliant cookie consent management
- ✅ Granular consent categories (Necessary, Analytics, Marketing)
- ✅ Automatic script blocking/loading based on consent
- ✅ Bilingual support (Arabic/English)
- ✅ Consent logging for audit trails

### Tracking Scripts Added
- ✅ Google Analytics 4 (GA4) setup
- ✅ Facebook Pixel setup
- ✅ Add-to-cart event tracking
- ✅ Purchase event tracking
- ✅ Page view tracking

## 🔧 Setup Instructions

### 1. Google Analytics Setup

1. **Create GA4 Property:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property for "Mayasah Style"
   - Get your Measurement ID (format: G-XXXXXXXXXX)

2. **Update Tracking Code:**
   - Replace `G-XXXXXXXXXX` in `index.html` with your actual Measurement ID
   - Update both instances:
     ```html
     gtag('config', 'G-XXXXXXXXXX'); // Line 242
     <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" data-cookie-category="analytics"></script> // Line 275
     ```

3. **Verify Setup:**
   - Open your website
   - Accept analytics cookies in the banner
   - Check Google Analytics Real-Time reports
   - You should see page views and events

### 2. Facebook Pixel Setup

1. **Create Facebook Pixel:**
   - Go to [Facebook Business Manager](https://business.facebook.com/)
   - Create a new Pixel for "Mayasah Style"
   - Get your Pixel ID

2. **Update Tracking Code:**
   - Replace `XXXXXXXXXX` in `index.html` with your actual Pixel ID
   - Update both instances:
     ```html
     fbq('init', 'XXXXXXXXXX'); // Line 290
     src="https://www.facebook.com/tr?id=XXXXXXXXXX&ev=PageView&noscript=1" // Line 315
     ```

3. **Verify Setup:**
   - Open your website
   - Accept marketing cookies in the banner
   - Check Facebook Events Manager
   - You should see PageView events

## 📊 What Gets Tracked

### Automatic Tracking (No Setup Required)
- **Page Views:** Every page load
- **Add to Cart:** When products are added to cart
- **Purchase:** When orders are completed
- **Language Changes:** When users switch languages

### Manual Tracking Available
You can manually track custom events using these functions:

```javascript
// Google Analytics
window.trackEvent('custom_event_name', {
    parameter1: 'value1',
    parameter2: 'value2'
});

// Facebook Pixel
window.trackFacebookEvent('custom_event_name', {
    parameter1: 'value1',
    parameter2: 'value2'
});
```

## 🎯 Key Events Tracked

### E-commerce Events
1. **Add to Cart**
   - Product ID, name, price, quantity
   - Currency: SAR
   - Tracks to both GA4 and Facebook

2. **Purchase**
   - Order ID, total value, items list
   - Currency: SAR
   - Tracks to both GA4 and Facebook

### User Behavior Events
1. **Page Views**
   - Page title and URL
   - Automatic on every page load

2. **Language Changes**
   - When users switch between Arabic/English

## 🔍 How to View Your Data

### Google Analytics 4
1. **Real-Time Reports:**
   - Go to Reports → Realtime
   - See active users and events

2. **E-commerce Reports:**
   - Go to Reports → Monetization → E-commerce purchases
   - View purchase data and conversion rates

3. **Events Report:**
   - Go to Reports → Engagement → Events
   - See all tracked events

### Facebook Business Manager
1. **Events Manager:**
   - Go to Events Manager
   - Select your Pixel
   - View real-time events

2. **Ads Manager:**
   - Create campaigns using your Pixel data
   - Target users based on their behavior

## 🛡️ Privacy Compliance

### PDPL Compliance
- ✅ Explicit consent required before tracking
- ✅ Granular control over cookie categories
- ✅ Users can reject non-essential cookies
- ✅ Consent is logged for audit trails
- ✅ Arabic-first display with RTL support

### Data Protection
- ✅ No tracking without consent
- ✅ Users can change preferences anytime
- ✅ Clear privacy policy link in banner
- ✅ Transparent about data usage

## 🔧 Testing Your Setup

### Test the Cookie Banner
1. Open your website
2. Check that the cookie banner appears
3. Try different consent options:
   - Accept All
   - Reject All
   - Custom preferences
4. Verify scripts load/block correctly

### Test Tracking Events
1. **Add to Cart Test:**
   - Go to a product page
   - Add item to cart
   - Check GA4 and Facebook for events

2. **Purchase Test:**
   - Complete a test order
   - Check for purchase events in both platforms

3. **Page View Test:**
   - Navigate between pages
   - Verify page views are tracked

## 📱 Mobile Tracking

The tracking system works on all devices:
- ✅ Desktop browsers
- ✅ Mobile browsers
- ✅ Tablet browsers
- ✅ Responsive design support

## 🚀 Advanced Features

### Custom Event Tracking
Add custom tracking to any user action:

```javascript
// Example: Track newsletter signup
function trackNewsletterSignup(email) {
    if (window.pdplCookieManager && window.pdplCookieManager.hasConsent('marketing')) {
        window.trackEvent('newsletter_signup', { email: email });
        window.trackFacebookEvent('Lead', { content_name: 'Newsletter Signup' });
    }
}
```

### Enhanced E-commerce
Track additional e-commerce events:

```javascript
// Track product views
function trackProductView(productId, productName, price) {
    if (window.pdplCookieManager && window.pdplCookieManager.hasConsent('analytics')) {
        window.trackEvent('view_item', {
            currency: 'SAR',
            value: price,
            items: [{
                item_id: productId,
                item_name: productName,
                price: price
            }]
        });
    }
}
```

## 🆘 Troubleshooting

### Common Issues

1. **No Events Showing:**
   - Check if user accepted cookies
   - Verify tracking IDs are correct
   - Check browser console for errors

2. **Scripts Not Loading:**
   - Ensure cookie banner is working
   - Check if user gave consent
   - Verify `data-cookie-category` attributes

3. **Duplicate Events:**
   - Check for multiple script inclusions
   - Ensure tracking functions aren't called multiple times

### Debug Mode
Enable debug mode in your browser console:

```javascript
// Check consent status
console.log(window.pdplCookieManager.getConsent());

// Check if tracking functions exist
console.log('GA4:', typeof window.trackEvent);
console.log('FB:', typeof window.trackFacebookEvent);
```

## 📞 Support

If you need help with tracking setup:
1. Check this guide first
2. Verify your tracking IDs are correct
3. Test with the cookie banner demo page
4. Check browser console for errors

## 🔄 Updates

This tracking system is designed to be:
- ✅ Easy to maintain
- ✅ Privacy-compliant
- ✅ Scalable for future needs
- ✅ Compatible with new tracking tools

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Compliance:** PDPL (Saudi Arabia Personal Data Protection Law) 