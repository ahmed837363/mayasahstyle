/**
 * PDPL Cookie Manager for Mayasah Style
 * Compliant with Saudi Arabia's Personal Data Protection Law (PDPL)
 * Version: 1.1 - Added Bilingual Support
 */

class PDPLCookieManager {
    constructor(options = {}) {
        this.options = {
            bannerId: 'cookie-banner',
            storageKey: 'mayasah_cookie_consent',
            categories: ['necessary', 'analytics', 'marketing'],
            ...options
        };
        
        this.banner = null;
        this.consent = null;
        this.isInitialized = false;
        this.currentLanguage = this.detectLanguage();
        
        // Translation objects
        this.translations = {
            ar: {
                title: 'نحن نستخدم ملفات تعريف الارتباط',
                description: 'نستخدم ملفات تعريف الارتباط الضرورية لتشغيل موقعنا. كما نستخدم ملفات اختيارية لتحليل الزيارات وتخصيص الإعلانات. موافقتك تتيح لنا مشاركة البيانات مع شركائنا. اقرأ',
                privacyLink: 'سياسة الخصوصية',
                descriptionEnd: 'لمزيد من المعلومات حول كيفية استخدامنا لبياناتك.',
                acceptAll: 'قبول الكل',
                rejectAll: 'رفض الكل',
                preferences: 'التفضيلات',
                close: 'إغلاق',
                preferencesTitle: 'تفضيلات ملفات تعريف الارتباط',
                necessary: 'ضرورية',
                necessaryDesc: 'لا يمكن إيقافها - مطلوبة لتشغيل الموقع بشكل صحيح',
                analytics: 'تحليلية',
                analyticsDesc: 'تساعدنا في فهم كيفية استخدامك للموقع وتحسين تجربتك',
                marketing: 'تسويقية',
                marketingDesc: 'تخصيص الإعلانات بناءً على اهتماماتك وتفضيلاتك',
                savePreferences: 'حفظ التفضيلات',
                successMessage: 'تم حفظ تفضيلات ملفات تعريف الارتباط بنجاح',
                consentStatus: {
                    analytics: 'تحليلية',
                    marketing: 'تسويقية',
                    necessaryOnly: 'ضرورية فقط',
                    undefined: 'غير محدد'
                }
            },
            en: {
                title: 'We Use Cookies',
                description: 'We use essential cookies to operate our website. We also use optional cookies to analyze visits and personalize advertisements. Your consent allows us to share data with our partners. Read our',
                privacyLink: 'Privacy Policy',
                descriptionEnd: 'for more information about how we use your data.',
                acceptAll: 'Accept All',
                rejectAll: 'Reject All',
                preferences: 'Preferences',
                close: 'Close',
                preferencesTitle: 'Cookie Preferences',
                necessary: 'Necessary',
                necessaryDesc: 'Cannot be disabled - required for the website to function properly',
                analytics: 'Analytics',
                analyticsDesc: 'Help us understand how you use the website and improve your experience',
                marketing: 'Marketing',
                marketingDesc: 'Personalize advertisements based on your interests and preferences',
                savePreferences: 'Save Preferences',
                successMessage: 'Cookie preferences saved successfully',
                consentStatus: {
                    analytics: 'Analytics',
                    marketing: 'Marketing',
                    necessaryOnly: 'Necessary only',
                    undefined: 'Not set'
                }
            }
        };
        
        this.init();
    }

    detectLanguage() {
        // Check if there's a language preference in localStorage (support multiple keys for compatibility)
        const storedLang = localStorage.getItem('mayasah_language') || localStorage.getItem('siteLang') || localStorage.getItem('language');
        if (storedLang && (storedLang === 'ar' || storedLang === 'en')) {
            return storedLang;
        }
        
        // Check document direction
        if (document.documentElement.dir === 'rtl') {
            return 'ar';
        }
        
        // Check document language
        const docLang = document.documentElement.lang;
        if (docLang && docLang.startsWith('ar')) {
            return 'ar';
        }
        
        // Default to Arabic for Saudi Arabia compliance
        return 'ar';
    }

    getText(key) {
        const lang = this.currentLanguage;
        const translation = this.translations[lang];
        
        if (key.includes('.')) {
            const keys = key.split('.');
            let value = translation;
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        }
        
        return translation?.[key] || key;
    }

    init() {
        if (this.isInitialized) return;
        
        // Check for existing consent first
        const existingConsent = this.getStoredConsent();
        
        // Only create banner if no consent exists
        if (!existingConsent) {
            this.createBanner();
            this.attachEventListeners();
            this.showBanner();
        } else {
            // If consent exists, just load the cookies without showing banner
            this.loadCookiesBasedOnConsent(existingConsent);
        }
        
        this.isInitialized = true;
    }

    createBanner() {
        // Create banner HTML if it doesn't exist
        if (!document.getElementById(this.options.bannerId)) {
            const bannerHTML = this.getBannerHTML();
            document.body.insertAdjacentHTML('beforeend', bannerHTML);
        }
        
        this.banner = document.getElementById(this.options.bannerId);
        
        // Set direction based on language
        if (this.currentLanguage === 'ar') {
            this.banner.setAttribute('dir', 'rtl');
        } else {
            this.banner.setAttribute('dir', 'ltr');
        }
    }

    getBannerHTML() {
        const lang = this.currentLanguage;
        const isRTL = lang === 'ar';
        
        return `
            <div id="${this.options.bannerId}" class="pdpl-cookie-banner" dir="${isRTL ? 'rtl' : 'ltr'}">
                <div class="cookie-content">
                    <div class="cookie-header">
                        <i class="fas fa-shield-alt cookie-icon"></i>
                        <h2 class="cookie-title">${this.getText('title')}</h2>
                    </div>
                    
                    <p class="cookie-description">
                        ${this.getText('description')} 
                        <a href="privacy.html" target="_blank">${this.getText('privacyLink')}</a> 
                        ${this.getText('descriptionEnd')}
                    </p>
                    
                    <div class="cookie-actions">
                        <button id="accept-all" class="btn btn-accept">
                            <i class="fas fa-check"></i>
                            ${this.getText('acceptAll')}
                        </button>
                        <button id="reject-all" class="btn btn-reject">
                            <i class="fas fa-times"></i>
                            ${this.getText('rejectAll')}
                        </button>
                        <button id="open-settings" class="btn btn-settings">
                            <i class="fas fa-cog"></i>
                            ${this.getText('preferences')}
                        </button>
                    </div>
                    
                    <div id="preferences" class="preferences">
                        <h3 class="preferences-title">
                            <i class="fas fa-sliders-h"></i>
                            ${this.getText('preferencesTitle')}
                        </h3>
                        
                        <div class="cookie-category">
                            <label>
                                <span class="switch">
                                    <input type="checkbox" id="necessary" checked disabled>
                                    <span class="slider"></span>
                                </span>
                                <div>
                                    <strong>${this.getText('necessary')}</strong>
                                    <div class="description">${this.getText('necessaryDesc')}</div>
                                </div>
                            </label>
                        </div>
                        
                        <div class="cookie-category">
                            <label>
                                <span class="switch">
                                    <input type="checkbox" id="analytics">
                                    <span class="slider"></span>
                                </span>
                                <div>
                                    <strong>${this.getText('analytics')}</strong>
                                    <div class="description">${this.getText('analyticsDesc')}</div>
                                </div>
                            </label>
                        </div>
                        
                        <div class="cookie-category">
                            <label>
                                <span class="switch">
                                    <input type="checkbox" id="marketing">
                                    <span class="slider"></span>
                                </span>
                                <div>
                                    <strong>${this.getText('marketing')}</strong>
                                    <div class="description">${this.getText('marketingDesc')}</div>
                                </div>
                            </label>
                        </div>
                        
                        <div class="save-preferences">
                            <button id="save-preferences" class="btn btn-accept">
                                <i class="fas fa-save"></i>
                                ${this.getText('savePreferences')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Button event listeners
        document.getElementById('accept-all')?.addEventListener('click', () => this.acceptAll());
        document.getElementById('reject-all')?.addEventListener('click', () => this.rejectAll());
        document.getElementById('open-settings')?.addEventListener('click', () => this.togglePreferences());
        document.getElementById('save-preferences')?.addEventListener('click', () => this.savePreferences());

        // Category toggle listeners
        document.getElementById('analytics')?.addEventListener('change', () => this.updateConsentStatus());
        document.getElementById('marketing')?.addEventListener('change', () => this.updateConsentStatus());
    }

    checkExistingConsent() {
        const consent = this.getStoredConsent();
        if (consent) {
            this.hideBanner();
            this.loadCookiesBasedOnConsent(consent);
        } else {
            this.showBanner();
        }
    }

    togglePreferences() {
        const prefsPanel = document.getElementById('preferences');
        const isVisible = prefsPanel.style.display === 'block';
        prefsPanel.style.display = isVisible ? 'none' : 'block';
        
        const btn = document.getElementById('open-settings');
        const icon = btn.querySelector('i');
        if (isVisible) {
            icon.className = 'fas fa-cog';
            btn.innerHTML = `<i class="fas fa-cog"></i> ${this.getText('preferences')}`;
        } else {
            icon.className = 'fas fa-times';
            btn.innerHTML = `<i class="fas fa-times"></i> ${this.getText('close')}`;
        }
    }

    savePreferences() {
        const analytics = document.getElementById('analytics')?.checked || false;
        const marketing = document.getElementById('marketing')?.checked || false;
        
        const consent = {
            necessary: true,
            analytics: analytics,
            marketing: marketing,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        this.saveConsent(consent);
    }

    acceptAll() {
        const consent = {
            necessary: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        this.saveConsent(consent);
    }

    rejectAll() {
        const consent = {
            necessary: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        this.saveConsent(consent);
    }

    saveConsent(consent) {
        // Store in localStorage
        localStorage.setItem(this.options.storageKey, JSON.stringify(consent));
        localStorage.setItem('mayasah_consent_timestamp', new Date().toISOString());

        // Persist current language to common keys so other pages respect user's choice
        try {
            localStorage.setItem('mayasah_language', this.currentLanguage);
            localStorage.setItem('siteLang', this.currentLanguage);
            localStorage.setItem('language', this.currentLanguage);
        } catch (e) {
            // ignore storage errors
        }

        // Log consent for audit trail
        this.logConsent(consent);

        // Hide banner and load cookies
        this.hideBanner();
        this.loadCookiesBasedOnConsent(consent);

        // Show success message
        this.showSuccessMessage();

        // Trigger custom event
        this.triggerConsentEvent(consent);
    }

    loadCookiesBasedOnConsent(consent) {
        // Block non-essential scripts until consent
        if (!consent.analytics) {
            this.blockScripts('analytics');
        }
        if (!consent.marketing) {
            this.blockScripts('marketing');
        }

        // Load scripts based on consent
        if (consent.analytics) {
            this.loadAnalyticsScripts();
        }
        if (consent.marketing) {
            this.loadMarketingScripts();
        }

        // Always load necessary scripts
        this.loadNecessaryScripts();
    }

    blockScripts(category) {
        const scripts = document.querySelectorAll(`script[data-cookie-category="${category}"]`);
        scripts.forEach(script => {
            script.setAttribute('data-blocked', 'true');
            script.style.display = 'none';
        });
    }

    loadNecessaryScripts() {
        console.log('Loading necessary scripts...');
        // Essential scripts that are always needed
    }

    loadAnalyticsScripts() {
        console.log('Loading analytics scripts...');
        
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    loadMarketingScripts() {
        console.log('Loading marketing scripts...');
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('consent', 'grant');
        }
    }

    getStoredConsent() {
        try {
            const stored = localStorage.getItem(this.options.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error parsing stored consent:', error);
            return null;
        }
    }

    logConsent(consent) {
        const logData = {
            consent: consent,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        };

        console.log('PDPL Consent Log:', logData);
        
        // Send to server if endpoint is configured
        const endpoint = this.options.serverEndpoint || '/log-consent';
        if (endpoint) {
            this.sendConsentToServer(endpoint, logData);
        }
        
        // Also call set-consent-cookie to let server set a cookie for subsequent requests
        const cookieEndpoint = this.options.cookieEndpoint || '/set-consent-cookie';
        if (cookieEndpoint) {
            this.setServerConsentCookie(cookieEndpoint, consent).catch(err => {
                // not fatal
            });
        }
    }

    sendConsentToServer(logData) {
        // sendConsentToServer(endpoint, payload)
        const endpoint = typeof this.options.serverEndpoint === 'string' ? this.options.serverEndpoint : '/log-consent';
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData)
        }).catch(error => {
            console.error('Failed to log consent to server:', error);
        });
    }

    async setServerConsentCookie(endpoint, consent) {
        try {
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consent, language: this.currentLanguage })
            });
        } catch (err) {
            console.warn('Failed to set server consent cookie:', err);
        }
    }

    showBanner() {
        if (this.banner) {
            this.banner.classList.remove('hidden');
        }
    }

    hideBanner() {
        if (this.banner) {
            this.banner.classList.add('hidden');
        }
    }

    updateConsentStatus() {
        const consent = this.getStoredConsent();
        if (consent) {
            const status = [];
            if (consent.analytics) status.push(this.getText('consentStatus.analytics'));
            if (consent.marketing) status.push(this.getText('consentStatus.marketing'));
            
            return status.length > 0 ? status.join('، ') : this.getText('consentStatus.necessaryOnly');
        }
        return this.getText('consentStatus.undefined');
    }

    showSuccessMessage() {
        const notification = document.createElement('div');
        const isRTL = this.currentLanguage === 'ar';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            ${isRTL ? 'right' : 'left'}: 20px;
            background: var(--antique-gold, #C6A969);
            color: var(--choco, #3C2A21);
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            font-weight: 600;
            animation: ${isRTL ? 'slideInRTL' : 'slideInLTR'} 0.3s ease-out;
            font-family: 'Montserrat', Arial, sans-serif;
            direction: ${isRTL ? 'rtl' : 'ltr'};
        `;
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${this.getText('successMessage')}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = `${isRTL ? 'slideOutRTL' : 'slideOutLTR'} 0.3s ease-in`;
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    triggerConsentEvent(consent) {
        const event = new CustomEvent('pdplConsentChanged', {
            detail: { consent }
        });
        document.dispatchEvent(event);
    }

    // Public methods for external use
    getConsent() {
        return this.getStoredConsent();
    }

    hasConsent(category) {
        const consent = this.getStoredConsent();
        return consent ? consent[category] : false;
    }

    updateConsent(category, value) {
        const consent = this.getStoredConsent() || {
            necessary: true,
            analytics: false,
            marketing: false
        };
        
        consent[category] = value;
        consent.timestamp = new Date().toISOString();
        
        this.saveConsent(consent);
    }

    clearConsent() {
        localStorage.removeItem(this.options.storageKey);
        localStorage.removeItem('mayasah_consent_timestamp');
        this.showBanner();
    }

    // Language management methods
    setLanguage(language) {
        if (language !== 'ar' && language !== 'en') {
            console.warn('Invalid language. Use "ar" for Arabic or "en" for English.');
            return;
        }
        
        this.currentLanguage = language;
        try {
            localStorage.setItem('mayasah_language', language);
            localStorage.setItem('siteLang', language);
            localStorage.setItem('language', language);
        } catch (e) {}
        
        // Check for existing consent
        const existingConsent = this.getStoredConsent();
        
        // Only recreate banner if it exists and user hasn't given consent
        if (this.banner && !existingConsent) {
            this.banner.remove();
            this.createBanner();
            this.attachEventListeners();
            this.showBanner();
        } else if (this.banner && existingConsent) {
            // If banner exists and consent was given, just remove it without recreating
            this.banner.remove();
            this.banner = null;
        }
        
        // Trigger language change event
        const event = new CustomEvent('pdplLanguageChanged', {
            detail: { language }
        });
        document.dispatchEvent(event);
    }

    getLanguage() {
        return this.currentLanguage;
    }

    toggleLanguage() {
        const newLang = this.currentLanguage === 'ar' ? 'en' : 'ar';
        this.setLanguage(newLang);
    }
    
    // Method to reopen cookie preferences (for settings page or footer link)
    reopenPreferences() {
        const existingConsent = this.getStoredConsent();
        
        // Create banner if it doesn't exist
        if (!this.banner) {
            this.createBanner();
            this.attachEventListeners();
        }
        
        // Show banner and open preferences panel
        this.showBanner();
        
        // Open preferences panel
        const prefsPanel = document.getElementById('preferences');
        if (prefsPanel) {
            prefsPanel.style.display = 'block';
            
            // Set current consent values
            if (existingConsent) {
                const analyticsCheckbox = document.getElementById('analytics');
                const marketingCheckbox = document.getElementById('marketing');
                
                if (analyticsCheckbox) analyticsCheckbox.checked = existingConsent.analytics || false;
                if (marketingCheckbox) marketingCheckbox.checked = existingConsent.marketing || false;
            }
            
            // Update button text
            const btn = document.getElementById('open-settings');
            if (btn) {
                btn.innerHTML = `<i class="fas fa-times"></i> ${this.getText('close')}`;
            }
        }
    }
}

// Global function to reopen cookie preferences
window.reopenCookiePreferences = function() {
    if (window.pdplCookieManager) {
        window.pdplCookieManager.reopenPreferences();
    }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS if not already present
    if (!document.getElementById('pdpl-cookie-styles')) {
        const style = document.createElement('style');
        style.id = 'pdpl-cookie-styles';
        style.textContent = `
            :root {
                --choco: #3C2A21;
                --choco-warm: #4E3524;
                --antique-gold: #C6A969;
                --ivory: #F8F4E6;
                --white: #ffffff;
                --shadow: 0 4px 16px rgba(60,42,33,0.08);
                --transition: all 0.3s ease;
            }

            .pdpl-cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                background: linear-gradient(135deg, var(--choco) 0%, var(--choco-warm) 100%);
                color: var(--ivory);
                padding: 24px 20px;
                box-shadow: 0 -4px 20px rgba(60,42,33,0.15);
                font-family: 'Montserrat', Arial, sans-serif;
                z-index: 9999;
                border-top: 3px solid var(--antique-gold);
                animation: slideUp 0.5s ease-out;
            }

            .pdpl-cookie-banner[dir="rtl"] {
                text-align: right;
            }

            .pdpl-cookie-banner[dir="ltr"] {
                text-align: left;
            }

            .cookie-content {
                max-width: 1200px;
                margin: 0 auto;
                position: relative;
            }

            .cookie-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
            }

            .cookie-icon {
                font-size: 2rem;
                color: var(--antique-gold);
                flex-shrink: 0;
            }

            .cookie-title {
                margin: 0;
                color: var(--antique-gold);
                font-size: 1.5rem;
                font-weight: 700;
                font-family: 'Cormorant Garamond', serif;
            }

            .cookie-description {
                margin: 0 0 20px 0;
                line-height: 1.6;
                font-size: 1rem;
                color: var(--ivory);
            }

            .cookie-description a {
                color: var(--antique-gold);
                text-decoration: underline;
                font-weight: 600;
                transition: var(--transition);
            }

            .cookie-description a:hover {
                color: var(--white);
            }

            .cookie-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                margin-bottom: 15px;
            }

            .btn {
                padding: 12px 24px;
                border: none;
                cursor: pointer;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.95rem;
                transition: var(--transition);
                font-family: 'Montserrat', sans-serif;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-accept {
                background: linear-gradient(135deg, var(--antique-gold) 0%, #D4AF37 100%);
                color: var(--choco);
                box-shadow: 0 2px 8px rgba(198,169,105,0.3);
            }

            .btn-accept:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(198,169,105,0.4);
            }

            .btn-reject {
                background: transparent;
                color: var(--ivory);
                border: 2px solid var(--antique-gold);
            }

            .btn-reject:hover {
                background: var(--antique-gold);
                color: var(--choco);
            }

            .btn-settings {
                background: rgba(198,169,105,0.1);
                color: var(--antique-gold);
                border: 1px solid rgba(198,169,105,0.3);
            }

            .btn-settings:hover {
                background: rgba(198,169,105,0.2);
            }

            .preferences {
                display: none;
                margin-top: 20px;
                border-top: 2px solid rgba(198,169,105,0.3);
                padding-top: 20px;
                background: rgba(60,42,33,0.05);
                border-radius: 12px;
                padding: 20px;
            }

            .preferences-title {
                color: var(--antique-gold);
                font-size: 1.2rem;
                font-weight: 700;
                margin-bottom: 15px;
                font-family: 'Cormorant Garamond', serif;
            }

            .cookie-category {
                margin-bottom: 15px;
                padding: 15px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                border: 1px solid rgba(198,169,105,0.2);
            }

            .cookie-category label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                font-size: 1rem;
                line-height: 1.5;
            }

            .cookie-category strong {
                color: var(--antique-gold);
                font-weight: 600;
            }

            .cookie-category .description {
                color: var(--ivory);
                font-size: 0.9rem;
                margin-top: 5px;
            }

            .pdpl-cookie-banner[dir="rtl"] .cookie-category .description {
                margin-right: 62px;
            }

            .pdpl-cookie-banner[dir="ltr"] .cookie-category .description {
                margin-left: 62px;
            }

            .switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 26px;
                flex-shrink: 0;
            }

            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255,255,255,0.3);
                transition: .4s;
                border-radius: 26px;
                border: 2px solid rgba(198,169,105,0.3);
            }

            .slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 2px;
                bottom: 2px;
                background-color: var(--ivory);
                transition: .4s;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            input:checked + .slider {
                background-color: var(--antique-gold);
                border-color: var(--antique-gold);
            }

            input:checked + .slider:before {
                transform: translateX(24px);
            }

            input:disabled + .slider {
                background-color: var(--antique-gold);
                opacity: 0.7;
                cursor: not-allowed;
            }

            .save-preferences {
                margin-top: 15px;
                text-align: center;
            }

            .hidden {
                display: none !important;
            }

            @media (max-width: 768px) {
                .pdpl-cookie-banner {
                    padding: 20px 15px;
                }

                .cookie-header {
                    flex-direction: column;
                    text-align: center;
                    gap: 10px;
                }

                .cookie-actions {
                    flex-direction: column;
                    gap: 10px;
                }

                .btn {
                    width: 100%;
                    justify-content: center;
                }

                .cookie-category label {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }

                .cookie-category .description {
                    margin-right: 0;
                    margin-left: 0;
                }
            }

            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }

            .pdpl-cookie-banner[dir="rtl"] .slideIn {
                animation: slideInRTL 0.3s ease-out;
            }

            .pdpl-cookie-banner[dir="ltr"] .slideIn {
                animation: slideInLTR 0.3s ease-out;
            }

            @keyframes slideInRTL {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideInLTR {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOutRTL {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }

            @keyframes slideOutLTR {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(-100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize the cookie manager
    window.pdplCookieManager = new PDPLCookieManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDPLCookieManager;
} 