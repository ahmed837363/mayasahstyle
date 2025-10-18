// Checkout Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for script.js to load and initialize
    setTimeout(() => {
        initializeCheckout();
    }, 100);

    // If redirected back from hosted payment, finalize order based on query params
    processReturnFromGateway();
});

// Handle return from hosted gateway mock: ?transaction_id=...&status=success
async function processReturnFromGateway() {
    try {
        const params = new URLSearchParams(window.location.search);
        const transaction_id = params.get('transaction_id');
        const status = params.get('status');
        if (!transaction_id || !status) return;

        const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || '{}');
        if (!lastOrder || !lastOrder.order_id) return;

        // If the mock already posted to webhook, server has likely processed emails. We'll still call webhook to be safe.
        try {
            await fetch(window.PAYMENT_WEBHOOK_URL || 'http://localhost:3000/payment-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: lastOrder.order_id, transaction_id, status, amount: lastOrder.order_total, payment_method: 'card', __mock_session: true })
            });
        } catch (e) {
            console.warn('processReturnFromGateway: notifying webhook failed', e.message || e);
        }

        if (String(status).toLowerCase() === 'success') {
            // mark order paid locally and finalize
            lastOrder.transaction_id = transaction_id;
            lastOrder.payment_method = 'card';
            lastOrder.payment_timestamp = new Date().toISOString();
            try { localStorage.setItem('lastOrder', JSON.stringify(lastOrder)); } catch (e) {}
            showNotification(document.documentElement.lang === 'en' ? 'Payment successful' : 'تم الدفع بنجاح', 'success');
            processOrder(lastOrder);
        } else {
            showNotification(document.documentElement.lang === 'en' ? 'Payment failed or cancelled' : 'فشل الدفع أو تم الإلغاء', 'error');
        }
        // Clean up query params to avoid reprocessing
        history.replaceState(null, '', window.location.pathname);
    } catch (err) {
        console.error('processReturnFromGateway error', err);
    }
}

function initializeCheckout() {
    // Generate order number
    generateOrderNumber();
    
    // Populate cities dropdown
    populateCities();
    
    // Load and display order items
    loadOrderItems();
    
    // Update order summary
    updateOrderSummary();
    
    // Handle form submission
    setupFormSubmission();
    
    // Update cart count
    updateCartCount();
    
    // Update placeholder text
    updatePlaceholders();
    
    // Listen for language changes
    document.addEventListener('languageChanged', (event) => {
        console.log('Language changed event received in checkout.js:', event.detail);
        updatePlaceholders();
        populateCities();
        updateStreetSuggestions();
        loadOrderItems();
        updateOrderSummary();
    });
    
    // Setup location detection
    setupLocationDetection();
    
    // Load saved form data
    loadSavedFormData();
    
    // Setup form auto-save
    setupFormAutoSave();
    
    // Setup payment methods
    setupPaymentMethods();

    // Default: do not collect card details on our site; use hosted gateway instead
    if (typeof window.FORCE_CLIENT_CARD === 'undefined') window.FORCE_CLIENT_CARD = false;
    // Enforce card form visibility based on the selected method
    updateCardFormVisibility();

    // Setup language switcher
    setupLanguageSwitcher();
}

// --- Simple client-side translations and language switcher ---
const TRANSLATIONS = {
    en: {
        storeName: 'Mayasah Style',
        home: 'Home',
        products: 'Products',
        cart: 'Cart',
        contact: 'Contact Us',
        checkout: 'Checkout',
        checkoutSubtitle: 'Complete your order by following these steps',
        shippingInfo: 'Shipping and address information',
        paymentInfo: 'Payment information',
        confirmOrder: 'Confirm Order',
        fullName: 'Full Name',
        phone: 'Mobile Number',
        email: 'Email',
        city: 'City',
        selectCity: 'Select city',
        address: 'Full Address',
        useMyLocation: 'Use my location',
        zip: 'Postal Code',
        orderNotes: 'Order Notes',
        paymentMethod: 'Payment Method',
        madaCard: 'Mada Card',
        madaDesc: 'Local Mada card',
        visaCard: 'Visa / MasterCard',
        visaDesc: 'International cards',
        applePay: 'Apple Pay',
        applePayDesc: 'Fast checkout',
        stcPay: 'STC Pay',
        stcPayDesc: 'Digital wallet',
    stcPhone: 'STC Pay number',
        cashOnDelivery: 'Cash on Delivery',
        codDesc: 'Pay cash upon delivery',
        cardHolder: 'Cardholder Name',
        cardNumber: 'Card Number',
        expiry: 'Expiry Date (MM/YY)',
        cvv: 'CVV',
        paymentSecurity: 'Transactions are secure and fully encrypted',
        orderSummary: 'Order Summary',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        vat: 'VAT (15%)',
        total: 'Total',
        completeOrder: 'Complete Order',
        backToCart: 'Back to Cart',
        detectingLocation: 'Detecting location...',
        locationDetected: 'Location detected successfully!',
        cityDetectedNoStreet: 'City detected but street not found. Please enter street manually.',
        couldNotGetAddress: 'Could not get address from coordinates.',
        locationAccessDenied: 'Location access denied. Please allow location or enter manually.',
        locationUnavailable: 'Location information is unavailable.',
        locationTimeout: 'Location request timed out.'
        ,
        stcPayInfo: 'A payment link will be sent to the STC Pay number above.'
    },
    ar: {
        storeName: 'مياسه ستيل',
        home: 'الرئيسية',
        products: 'المنتجات',
        cart: 'عربة التسوق',
        contact: 'اتصل بنا',
        checkout: 'إتمام الشراء',
        checkoutSubtitle: 'أكمل طلبك باتباع الخطوات التالية',
        shippingInfo: 'معلومات الشحن والعنوان',
        paymentInfo: 'معلومات الدفع',
        confirmOrder: 'تأكيد الطلب',
        fullName: 'الاسم الكامل',
        phone: 'رقم الجوال',
        email: 'البريد الإلكتروني',
        city: 'المدينة',
        selectCity: 'اختر المدينة',
        address: 'العنوان التفصيلي',
        useMyLocation: 'استخدم موقعي',
        zip: 'الرمز البريدي',
        orderNotes: 'ملاحظات الطلب',
        paymentMethod: 'طريقة الدفع',
        madaCard: 'بطاقة مدى',
        madaDesc: 'بطاقة مدى المحلية',
        visaCard: 'فيزا / ماستركارد',
        visaDesc: 'بطاقات دولية',
        applePay: 'Apple Pay',
        applePayDesc: 'الدفع السريع',
        stcPay: 'STC Pay',
        stcPayDesc: 'المحفظة الرقمية',
    stcPhone: 'رقم STC Pay',
        cashOnDelivery: 'الدفع عند الاستلام',
        codDesc: 'نقداً عند التوصيل',
        cardHolder: 'اسم حامل البطاقة',
        cardNumber: 'رقم البطاقة',
        expiry: 'تاريخ الانتهاء (MM/YY)',
        cvv: 'رمز الأمان',
        paymentSecurity: 'معاملات آمنة ومشفرة بالكامل',
        orderSummary: 'ملخص الطلب',
        subtotal: 'المجموع الفرعي',
        shipping: 'الشحن',
        vat: 'ضريبة القيمة المضافة (15%)',
        total: 'الإجمالي',
        completeOrder: 'إتمام الطلب',
        backToCart: 'العودة للسلة',
        detectingLocation: 'جاري تحديد الموقع...',
        locationDetected: 'تم تحديد الموقع بنجاح!',
        cityDetectedNoStreet: 'تم تحديد المدينة ولكن لم يتم العثور على اسم الشارع. يرجى إدخال اسم الشارع يدوياً.',
        couldNotGetAddress: 'تعذر الحصول على العنوان من الإحداثيات.',
        locationAccessDenied: 'تم رفض الوصول للموقع. يرجى السماح بالوصول للموقع أو الإدخال يدوياً.',
        locationUnavailable: 'معلومات الموقع غير متوفرة.',
        locationTimeout: 'انتهت مهلة طلب الموقع.'
        ,
        stcPayInfo: 'سيتم إرسال رابط الدفع على رقم STC Pay أعلاه.'
    }
};

// Guard to prevent duplicate submissions (double-clicks)
let __checkoutIsSubmitting = false;

function applyTranslations(lang) {
    const map = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (map[key]) el.textContent = map[key];
    });

    // Set placeholders for inputs that don't have data-placeholder attributes
    const placeholders = {
        fullName: lang === 'en' ? 'Enter your full name' : 'أدخل اسمك الكامل',
        phone: lang === 'en' ? '+966 5X XXX XXXX' : '+966 5X XXX XXXX',
        email: lang === 'en' ? 'example@email.com' : 'example@email.com',
        address: lang === 'en' ? 'Neighborhood, street, house number...' : 'الحي، الشارع، رقم المنزل...',
        notes: lang === 'en' ? 'Additional notes (optional)' : 'ملاحظات إضافية (اختياري)'
    };
    Object.keys(placeholders).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.placeholder = placeholders[id];
    });

    // Set input text direction: emails & numbers stay ltr, normal text uses page direction
    const isRTL = lang === 'ar';
    document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(inp => {
        // keep email/input types that should be LTR
        const type = inp.getAttribute('type') || inp.tagName.toLowerCase();
        if (type === 'email' || type === 'tel' || inp.id === 'cardNumber' || inp.id === 'cvv') {
            inp.style.direction = 'ltr';
            inp.style.textAlign = 'left';
        } else {
            inp.style.direction = isRTL ? 'rtl' : 'ltr';
            inp.style.textAlign = isRTL ? 'right' : 'left';
        }
    });

    // Footer language blocks
    const footerEn = document.querySelector('.footer-en');
    const footerAr = document.querySelector('.footer-ar');
    if (footerEn && footerAr) {
        if (lang === 'en') { footerEn.style.display = ''; footerAr.style.display = 'none'; }
        else { footerEn.style.display = 'none'; footerAr.style.display = ''; }
    }

    // Update any dynamic content that depends on language
    loadOrderItems();
    updateOrderSummary();
}

function setupLanguageSwitcher() {
    const btns = document.querySelectorAll('.lang-btn');
    if (!btns.length) return;

    // Initialize from saved preference or from document
    // Check multiple storage keys to preserve user preference across pages
    const saved = localStorage.getItem('siteLang') || localStorage.getItem('language') || localStorage.getItem('mayasah_language');
    const initial = saved || document.documentElement.lang || 'ar';
    setLanguage(initial, false);

    btns.forEach(b => {
        b.addEventListener('click', () => {
            const lang = b.getAttribute('data-lang') || 'ar';
            setLanguage(lang, true);
        });
    });
}

function setLanguage(lang, emitEvent = true) {
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    try {
        localStorage.setItem('siteLang', lang);
        localStorage.setItem('language', lang);
        localStorage.setItem('mayasah_language', lang);
    } catch (e) {}

    // toggle active state on lang buttons
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === lang));

    applyTranslations(lang);

    if (emitEvent) {
        const ev = new CustomEvent('languageChanged', { detail: { lang } });
        document.dispatchEvent(ev);
    }
}

function generateOrderNumber() {
    const orderId = document.getElementById('orderId');
    if (orderId) {
        // Generate a random 8-digit order number
        const orderNumber = Math.floor(10000000 + Math.random() * 90000000);
        orderId.textContent = orderNumber;
    }
}

function populateCities() {
    const citySelect = document.getElementById('city');
    if (!citySelect) return;

    const lang = document.documentElement.lang || 'ar';

    // Default city lists (can be overridden by window.saudiCitiesAr / window.saudiCitiesEn)
    const saudiCitiesAr = window.saudiCitiesAr || [
        'الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الظهران','الطائف','تبوك','بريدة','خميس مشيط','حائل','أبها','جازان','نجران','الباحة','الجوف','القريات','رفحاء','سكاكا'
    ];
    const saudiCitiesEn = window.saudiCitiesEn || [
        'Riyadh','Jeddah','Makkah','Madinah','Dammam','Khobar','Dhahran','Taif','Tabuk','Buraidah','Khamis Mushait','Hail','Abha','Jazan','Najran','Al Baha','Al Jouf','Al Qurayyat','Rafha','Sakaka'
    ];

    const currentSelectedCity = citySelect.value;
    const cities = lang === 'en' ? saudiCitiesEn : saudiCitiesAr;

    // Preserve the first option (placeholder) if present
    const firstOption = citySelect.querySelector('option');
    citySelect.innerHTML = '';
    if (firstOption) citySelect.appendChild(firstOption);

    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });

    // Try to restore a previously selected city across languages using a small mapping
    if (currentSelectedCity && currentSelectedCity !== (firstOption ? firstOption.value : '')) {
        const cityMapping = {
            'Riyadh': 'الرياض', 'Jeddah': 'جدة', 'Makkah': 'مكة المكرمة', 'Madinah': 'المدينة المنورة',
            'Dammam': 'الدمام', 'Khobar': 'الخبر', 'Dhahran': 'الظهران', 'Taif': 'الطائف',
            'Tabuk': 'تبوك', 'Buraidah': 'بريدة', 'Khamis Mushait': 'خميس مشيط', 'Hail': 'حائل',
            'Abha': 'أبها', 'Jazan': 'جازان', 'Najran': 'نجران', 'Al Baha': 'الباحة',
            'Al Jouf': 'الجوف', 'Al Qurayyat': 'القريات', 'Rafha': 'رفحاء', 'Sakaka': 'سكاكا',
            // reverse mapping
            'الرياض': 'Riyadh', 'جدة': 'Jeddah', 'مكة المكرمة': 'Makkah', 'المدينة المنورة': 'Madinah',
            'الدمام': 'Dammam', 'الخبر': 'Khobar', 'الظهران': 'Dhahran', 'الطائف': 'Taif',
            'تبوك': 'Tabuk', 'بريدة': 'Buraidah', 'خميس مشيط': 'Khamis Mushait', 'حائل': 'Hail',
            'أبها': 'Abha', 'جازان': 'Jazan', 'نجران': 'Najran', 'الباحة': 'Al Baha',
            'الجوف': 'Al Jouf', 'القريات': 'Al Qurayyat', 'رفحاء': 'Rafha', 'سكاكا': 'Sakaka'
        };

        const correspondingCity = cityMapping[currentSelectedCity];
        if (correspondingCity && cities.includes(correspondingCity)) {
            citySelect.value = correspondingCity;
        }
    }
}

function updatePlaceholders() {
    const lang = document.documentElement.lang || 'ar';
    
    // Update address placeholder
    const addressField = document.getElementById('address');
    if (addressField) {
        const placeholderAr = addressField.getAttribute('data-placeholder-ar');
        const placeholderEn = addressField.getAttribute('data-placeholder-en');
        addressField.placeholder = lang === 'en' ? placeholderEn : placeholderAr;
    }
    
    // Update notes placeholder
    const notesField = document.getElementById('notes');
    if (notesField) {
        const placeholderAr = notesField.getAttribute('data-placeholder-ar');
        const placeholderEn = notesField.getAttribute('data-placeholder-en');
        notesField.placeholder = lang === 'en' ? placeholderEn : placeholderAr;
    }
}

function setupLocationDetection() {
    const detectBtn = document.getElementById('detectLocationBtn');
    if (!detectBtn) return;
    
    detectBtn.addEventListener('click', detectUserLocation);
    
    // Add street name suggestions dropdown
    addStreetNameSuggestions();
}

function addStreetNameSuggestions() {
    updateStreetSuggestions();
}

function updateStreetSuggestions() {
    const addressField = document.getElementById('address');
    if (!addressField) return;
    
    // Remove existing datalist if it exists
    const existingDatalist = document.getElementById('streetSuggestions');
    if (existingDatalist) {
        existingDatalist.remove();
    }
    
    // Create a new datalist for street name suggestions
    const datalist = document.createElement('datalist');
    datalist.id = 'streetSuggestions';
    
    const lang = document.documentElement.lang || 'ar';
    
    const commonStreets = lang === 'en' ? [
        'Al-Riyadh Street',
        'Al-Corniche Street', 
        'Al-Balad Street',
        'Al-Hamra Street',
        'Al-Sabeel Street',
        'Al-Rawdah Street',
        'Al-Safa Street',
        'Al-Zahra Street',
        'Al-Rehab Street',
        'Al-Samer Street'
    ] : [
        'شارع الرياض',
        'شارع الكورنيش',
        'شارع البلد',
        'شارع الحمراء',
        'شارع السبيل',
        'شارع الروضة',
        'شارع الصفا',
        'شارع الزهراء',
        'شارع الرحاب',
        'شارع السامر'
    ];
    
    commonStreets.forEach(street => {
        const option = document.createElement('option');
        option.value = street;
        datalist.appendChild(option);
    });
    
    // Add the datalist to the document
    document.body.appendChild(datalist);
    
    // Set the datalist attribute on the address field
    addressField.setAttribute('list', 'streetSuggestions');
}

function detectUserLocation() {
    const detectBtn = document.getElementById('detectLocationBtn');
    const addressField = document.getElementById('address');
    const citySelect = document.getElementById('city');
    const zipField = document.getElementById('zip');
    
    if (!detectBtn || !addressField || !citySelect) return;
    
    // Show loading state
    detectBtn.classList.add('loading');
    const originalText = detectBtn.innerHTML;
    const lang = document.documentElement.lang || 'ar';
    const translations = window.translations || {};
    const detectingText = translations[lang]?.detectingLocation || 'جاري تحديد الموقع...';
    detectBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>${detectingText}</span>`;
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        showLocationError('Geolocation is not supported by this browser.');
        resetLocationButton(detectBtn, originalText);
        return;
    }

    // If Permissions API is available, proactively check permission to avoid flashing an early error
    const tryGeolocate = () => {
        // Get user's location
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log('GPS Coordinates:', latitude, longitude);
                    
                    // Try Balady API first (Saudi-specific)
                    let address = await tryBaladyAPI(latitude, longitude);
                    
                    // If Balady fails, fall back to Nominatim
                    if (!address) {
                        console.log('Balady API failed, trying Nominatim...');
                        address = await reverseGeocode(latitude, longitude);
                    }
                    
                    if (address) {
                        console.log('Final Address Data:', address);
                        
                        // Fill in the address field
                        let finalAddress = address.street || '';
                        
                        // If no street name from API, try to extract from formatted address
                        if (!finalAddress && address.formatted_address) {
                            finalAddress = extractStreetFromFormattedAddress(address.formatted_address);
                        }
                        
                        addressField.value = finalAddress || '';
                        
                        // Fill in the postal code field
                        if (zipField && address.postal_code) {
                            zipField.value = address.postal_code;
                        }
                        
                        // Try to match city with our dropdown
                        if (address.city) {
                            const cities = lang === 'en' ? 
                                ['Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar', 'Dhahran', 'Taif', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Hail', 'Abha', 'Jazan', 'Najran', 'Al Baha', 'Al Jouf', 'Al Qurayyat', 'Rafha', 'Sakaka'] :
                                ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 'الطائف', 'تبوك', 'بريدة', 'خميس مشيط', 'حائل', 'أبها', 'جازان', 'نجران', 'الباحة', 'الجوف', 'القريات', 'رفحاء', 'سكاكا'];
                            
                            const matchedCity = findBestCityMatch(address.city, cities);
                            if (matchedCity) {
                                citySelect.value = matchedCity;
                            }
                        }
                        
                        // Show appropriate success message
                        const locationDetectedText = translations[lang]?.locationDetected || 'تم تحديد الموقع بنجاح!';
                        const cityDetectedNoStreetText = translations[lang]?.cityDetectedNoStreet || 'تم تحديد المدينة ولكن لم يتم العثور على اسم الشارع. يرجى إدخال اسم الشارع يدوياً.';
                        
                        if (finalAddress && finalAddress.length > 2) {
                            showNotification(locationDetectedText, 'success');
                        } else {
                            showNotification(cityDetectedNoStreetText, 'info');
                        }
                    } else {
                        const couldNotGetAddressText = translations[lang]?.couldNotGetAddress || 'تعذر الحصول على العنوان من الإحداثيات.';
                        showLocationError(couldNotGetAddressText);
                    }
                } catch (error) {
                    const errorGettingAddressText = translations[lang]?.errorGettingAddress || 'خطأ في الحصول على العنوان: ';
                    showLocationError(errorGettingAddressText + error.message);
                }
                
                resetLocationButton(detectBtn, originalText);
            },
            (error) => {
                // Don’t show a hard error if permission is in prompt state; just reset and let user try again
                const lang = document.documentElement.lang || 'ar';
                const status = (navigator.permissions && navigator.permissions.query) ? undefined : undefined;
                let showErr = true;
                if (error.code === error.PERMISSION_DENIED) {
                    // If user dismissed the prompt without a choice, some browsers report PERMISSION_DENIED
                    // We show a gentle info instead of an error
                    const msg = translations[lang]?.locationAccessDenied || 'تم رفض الوصول للموقع. يرجى السماح بالوصول للموقع أو الإدخال يدوياً.';
                    showNotification(msg, 'info');
                    showErr = false;
                }
                if (showErr) {
                    let errorMessage = 'Error getting location.';
                    switch (error.code) {
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = translations[lang]?.locationUnavailable || 'معلومات الموقع غير متوفرة.'; break;
                        case error.TIMEOUT:
                            errorMessage = translations[lang]?.locationTimeout || 'انتهت مهلة طلب الموقع.'; break;
                    }
                    showLocationError(errorMessage);
                }
                resetLocationButton(detectBtn, originalText);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000
            }
        );
    };

    if (navigator.permissions && navigator.permissions.query) {
        try {
            navigator.permissions.query({ name: 'geolocation' }).then(result => {
                // If already granted, proceed quickly; if prompt, proceed without showing early errors
                tryGeolocate();
            }).catch(() => tryGeolocate());
        } catch { tryGeolocate(); }
    } else {
        tryGeolocate();
    }
}

async function tryBaladyAPI(latitude, longitude) {
    try {
        console.log('Balady API is not configured - skipping to OpenStreetMap');
        // Balady API requires registration and API key
        // Returning null will make the system use OpenStreetMap instead
        // which provides accurate, real-time location data for all users
        return null;
        
    } catch (error) {
        console.log('Balady API error:', error);
        return null;
    }
}

async function reverseGeocode(latitude, longitude) {
    try {
        console.log('Using Nominatim API for reverse geocoding...');
        
        // Try multiple zoom levels for better results
        let data = null;
        let response = null;
        
        // First try with zoom=18 for maximum detail
        try {
            const lang = document.documentElement.lang || 'ar';
            const acceptLanguage = lang === 'en' ? 'en,ar' : 'ar,en';
            response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&extratags=1&namedetails=1&accept-language=${acceptLanguage}`
            );
            
            if (response.ok) {
                data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
            }
        } catch (error) {
            console.log('Zoom 18 failed, trying zoom 16...');
        }
        
        // If zoom 18 failed or returned insufficient data, try zoom 16
        if (!data || !data.address || Object.keys(data.address).length < 3) {
            try {
                const lang = document.documentElement.lang || 'ar';
                const acceptLanguage = lang === 'en' ? 'en,ar' : 'ar,en';
                response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&extratags=1&namedetails=1&accept-language=${acceptLanguage}`
                );
                
                if (response.ok) {
                    data = await response.json();
                    if (data.error) {
                        throw new Error(data.error);
                    }
                }
            } catch (error) {
                console.log('Zoom 16 failed, trying zoom 14...');
            }
        }
        
        // If still no good data, try zoom 14
        if (!data || !data.address || Object.keys(data.address).length < 3) {
            const lang = document.documentElement.lang || 'ar';
            const acceptLanguage = lang === 'en' ? 'en,ar' : 'ar,en';
            response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1&extratags=1&namedetails=1&accept-language=${acceptLanguage}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch address data');
            }
            
            data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
        }
        
        console.log('Nominatim API Response:', data);
        console.log('Address Components:', data.address);
        console.log('Display Name:', data.display_name);
        
        // Extract address components
        const address = data.address || {};
        const formattedAddress = data.display_name || '';
        
        // Build street address with priority system
        let streetAddress = '';
        
        // Priority 1: Direct street name from address components
        if (address.road) {
            streetAddress = address.road;
        } else if (address.street) {
            streetAddress = address.street;
        } else if (address.street_name) {
            streetAddress = address.street_name;
        }
        
        // Priority 2: Use neighbourhood as fallback with clear label
        if (!streetAddress || streetAddress.length < 2) {
            if (address.neighbourhood) {
                const lang = document.documentElement.lang || 'ar';
                const label = lang === 'en' ? 'Neighbourhood' : 'الحي';
                streetAddress = `${label}: ${address.neighbourhood}`;
            } else if (address.suburb) {
                const lang = document.documentElement.lang || 'ar';
                const label = lang === 'en' ? 'Area' : 'المنطقة';
                streetAddress = `${label}: ${address.suburb}`;
            } else {
                // Extract from display name as last resort
                streetAddress = extractStreetFromFormattedAddress(formattedAddress);
            }
        }
        
        // Determine city
        let city = '';
        if (address.city) {
            city = address.city;
        } else if (address.town) {
            city = address.town;
        } else if (address.village) {
            city = address.village;
        } else if (address.county) {
            city = address.county;
        } else if (address.state) {
            city = address.state;
        }
        
        // Extract postal code
        let postalCode = '';
        if (address.postcode) {
            postalCode = address.postcode;
        }
        
        return {
            street: streetAddress,
            city: city,
            country: address.country || '',
            postal_code: postalCode,
            formatted_address: formattedAddress
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

function extractStreetFromFormattedAddress(formattedAddress) {
    if (!formattedAddress) return '';
    
    const addressParts = formattedAddress.split(',');
    
    // Look for street-like patterns in the display name
    for (let i = 0; i < addressParts.length - 2; i++) {
        const part = addressParts[i].trim();
        
        // Skip obvious non-street parts
        if (part && part.length > 2 && 
            !part.toLowerCase().includes('saudi arabia') &&
            !part.toLowerCase().includes('المملكة العربية السعودية') &&
            !part.toLowerCase().includes('jeddah') &&
            !part.toLowerCase().includes('جدة') &&
            !part.toLowerCase().includes('riyadh') &&
            !part.toLowerCase().includes('الرياض') &&
            !part.toLowerCase().includes('region') &&
            !part.toLowerCase().includes('منطقة')) {
            
            const partLower = part.toLowerCase();
            
            // Common street indicators
            const streetIndicators = [
                'street', 'road', 'avenue', 'boulevard', 'lane', 'drive', 'way',
                'شارع', 'طريق', 'جادة', 'ممر', 'درب'
            ];
            
            // Check if part contains street indicators
            const hasStreetIndicator = streetIndicators.some(indicator => 
                partLower.includes(indicator)
            );
            
            // Check if part starts with common street prefixes
            const streetPrefixes = ['al-', 'al ', 'شارع', 'طريق'];
            const hasStreetPrefix = streetPrefixes.some(prefix => 
                partLower.startsWith(prefix)
            );
            
            if (hasStreetIndicator || hasStreetPrefix || part.length > 3) {
                return part;
            }
        }
    }
    
    // Try to find specific street names
    const formattedLower = formattedAddress.toLowerCase();
    const commonStreets = [
        'al-riyadh', 'al riyadh', 'الرياض', 'riyadh street', 'شارع الرياض', 'riyadh',
        'al-corniche', 'al corniche', 'الكورنيش', 'corniche', 'شارع الكورنيش',
        'al-balad', 'al balad', 'البلد', 'balad', 'شارع البلد',
        'al-hamra', 'al hamra', 'الحمراء', 'hamra', 'شارع الحمراء',
        'al-sabeel', 'al sabeel', 'السبيل', 'sabeel', 'شارع السبيل',
        'al-rawdah', 'al rawdah', 'الروضة', 'rawdah', 'شارع الروضة',
        'al-safa', 'al safa', 'الصفا', 'safa', 'شارع الصفا',
        'al-zahra', 'al zahra', 'الزهراء', 'zahra', 'شارع الزهراء',
        'al-rehab', 'al rehab', 'الرحاب', 'rehab', 'شارع الرحاب',
        'al-samer', 'al samer', 'السامر', 'samer', 'شارع السامر'
    ];
    
    for (const street of commonStreets) {
        if (formattedLower.includes(street)) {
            // Extract the complete street name from the formatted address
            const words = formattedAddress.split(' ');
            for (let i = 0; i < words.length; i++) {
                const word = words[i].toLowerCase();
                if (word.includes(street.split(' ')[0]) || 
                    word.includes(street.split('-')[0])) {
                    
                    // Get the complete street name (1-4 words)
                    let streetName = '';
                    for (let j = i; j < Math.min(i + 4, words.length); j++) {
                        const currentWord = words[j];
                        if (currentWord && currentWord.length > 0) {
                            streetName += (streetName ? ' ' : '') + currentWord;
                        }
                    }
                    
                    // Clean up the street name
                    streetName = streetName.replace(/[,\s]+$/, '').trim();
                    
                    if (streetName.length > 2) {
                        return streetName;
                    }
                }
            }
        }
    }
    
    // Fallback: use the first meaningful part
    for (let i = 0; i < Math.min(3, addressParts.length); i++) {
        const part = addressParts[i].trim();
        if (part && part.length > 2 && 
            !part.toLowerCase().includes('saudi arabia') &&
            !part.toLowerCase().includes('المملكة العربية السعودية') &&
            !part.toLowerCase().includes('jeddah') &&
            !part.toLowerCase().includes('جدة')) {
            return part;
        }
    }
    
    return '';
}

function findBestCityMatch(detectedCity, availableCities) {
    if (!detectedCity || !availableCities.length) return null;
    
    const detectedCityLower = detectedCity.toLowerCase().trim();
    
    // First, try exact match
    const exactMatch = availableCities.find(city => 
        city.toLowerCase() === detectedCityLower
    );
    if (exactMatch) return exactMatch;
    
    // Then, try partial match
    const partialMatch = availableCities.find(city => 
        city.toLowerCase().includes(detectedCityLower) || 
        detectedCityLower.includes(city.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Try matching with common variations and abbreviations
    const cityMappings = {
        // English variations
        'riyadh': ['الرياض', 'Riyadh'],
        'jeddah': ['جدة', 'Jeddah'],
        'makkah': ['مكة المكرمة', 'Makkah', 'Mecca'],
        'madinah': ['المدينة المنورة', 'Madinah', 'Medina'],
        'dammam': ['الدمام', 'Dammam'],
        'khobar': ['الخبر', 'Khobar', 'Al Khobar'],
        'dhahran': ['الظهران', 'Dhahran'],
        'taif': ['الطائف', 'Taif', 'At Taif'],
        'tabuk': ['تبوك', 'Tabuk'],
        'buraidah': ['بريدة', 'Buraidah', 'Buraydah'],
        'khamis mushait': ['خميس مشيط', 'Khamis Mushait'],
        'hail': ['حائل', 'Hail', 'Ha\'il'],
        'abha': ['أبها', 'Abha'],
        'jazan': ['جازان', 'Jazan', 'Jizan'],
        'najran': ['نجران', 'Najran'],
        'al baha': ['الباحة', 'Al Baha'],
        'al jouf': ['الجوف', 'Al Jouf', 'Al Jawf'],
        'al qurayyat': ['القريات', 'Al Qurayyat'],
        'rafha': ['رفحاء', 'Rafha'],
        'sakaka': ['سكاكا', 'Sakaka'],
        
        // Arabic variations
        'الرياض': ['الرياض', 'Riyadh'],
        'جدة': ['جدة', 'Jeddah'],
        'مكة': ['مكة المكرمة', 'Makkah'],
        'مكة المكرمة': ['مكة المكرمة', 'Makkah'],
        'المدينة': ['المدينة المنورة', 'Madinah'],
        'المدينة المنورة': ['المدينة المنورة', 'Madinah'],
        'الدمام': ['الدمام', 'Dammam'],
        'الخبر': ['الخبر', 'Khobar'],
        'الظهران': ['الظهران', 'Dhahran'],
        'الطائف': ['الطائف', 'Taif'],
        'تبوك': ['تبوك', 'Tabuk'],
        'بريدة': ['بريدة', 'Buraidah'],
        'خميس مشيط': ['خميس مشيط', 'Khamis Mushait'],
        'حائل': ['حائل', 'Hail'],
        'أبها': ['أبها', 'Abha'],
        'جازان': ['جازان', 'Jazan'],
        'نجران': ['نجران', 'Najran'],
        'الباحة': ['الباحة', 'Al Baha'],
        'الجوف': ['الجوف', 'Al Jouf'],
        'القريات': ['القريات', 'Al Qurayyat'],
        'رفحاء': ['رفحاء', 'Rafha'],
        'سكاكا': ['سكاكا', 'Sakaka']
    };
    
    // Check if we have a mapping for this city
    const mappedCities = cityMappings[detectedCityLower];
    if (mappedCities) {
        // Find the first mapped city that exists in our available cities
        for (const mappedCity of mappedCities) {
            if (availableCities.includes(mappedCity)) {
                return mappedCity;
            }
        }
    }
    
    // Try fuzzy matching with similarity
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const city of availableCities) {
        const cityLower = city.toLowerCase();
        
        // Calculate similarity score
        let similarity = 0;
        
        // Check if words match
        const detectedWords = detectedCityLower.split(/\s+/);
        const cityWords = cityLower.split(/\s+/);
        
        for (const detectedWord of detectedWords) {
            for (const cityWord of cityWords) {
                if (detectedWord === cityWord) {
                    similarity += 1;
                } else if (detectedWord.includes(cityWord) || cityWord.includes(detectedWord)) {
                    similarity += 0.5;
                }
            }
        }
        
        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = city;
        }
    }
    
    // Return best match if similarity is reasonable
    if (bestSimilarity >= 0.5) {
        return bestMatch;
    }
    
    return null;
}

function showLocationError(message) {
    showNotification(message, 'error');
}

function resetLocationButton(button, originalText) {
    button.classList.remove('loading');
    button.innerHTML = originalText;
}

function loadOrderItems() {
    console.log('loadOrderItems called - debugging order summary layout');
    console.log('dir =', document.documentElement.dir);
    const itemsList = document.getElementById('orderItemsList');
    if (!itemsList) return;
    
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const lang = document.documentElement.lang || 'ar';
    console.log('loadOrderItems called with language:', lang);
    console.log('Cart items:', cartItems);
    
    if (cartItems.length === 0) {
        itemsList.innerHTML = '<div class="empty-cart">لا توجد منتجات في السلة</div>';
        return;
    }
    
    itemsList.innerHTML = '';
    
    // Get productsData and translations from script.js
    const productsData = window.productsData || [];
    const translations = window.translations || {};
    
    // Helper to escape text inserted into innerHTML
    function escapeHTML(str) {
        if (!str && str !== 0) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    const getCurrencyHTML = window.getCurrencyHTML || function() { return document.documentElement.lang === 'ar' ? ' ر.س' : ' SAR'; };

    cartItems.forEach((item, index) => {
        const productData = productsData.find(p => p.id === item.id) || {};
        const name = (item.key && translations[lang] && translations[lang][item.key])
            ? translations[lang][item.key]
            : (productData && productData.key && translations[lang] && translations[lang][productData.key])
                ? translations[lang][productData.key]
                : item.name || '';

        console.log('Product translation:', {
            itemKey: item.key,
            productKey: productData?.key,
            lang: lang,
            translatedName: name
        });

        const imagePath = item.image || (productData?.images?.[0]) || 'images/abaya1.jpg';
        const priceTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);

    const itemElement = document.createElement('div');
    itemElement.className = 'order-item-compact';
    // Inline layout guard: ensure image -> info -> price order and sizes even if external CSS overrides
    itemElement.style.display = 'flex';
    itemElement.style.flexDirection = 'row';
    itemElement.style.gap = '12px';
    itemElement.style.alignItems = 'center';
    itemElement.style.padding = '8px 6px';
    itemElement.style.borderBottom = '1px dashed rgba(60, 42, 33, 0.04)';
    console.log('Created order item element:', itemElement);
        itemElement.innerHTML = `
            <div class="item-image-compact" style="flex:0 0 44px;width:44px;height:44px;order:1;display:flex;align-items:center;justify-content:center;">
                <img src="${escapeHTML(imagePath)}" alt="${escapeHTML(name)}" onerror="this.src='images/abaya1.jpg'" style="width:100%;height:100%;object-fit:cover;display:block;">
            </div>
            <div class="item-info-compact" style="flex:1 1 auto;min-width:0;order:2;display:flex;flex-direction:column;gap:4px;">
                <div class="item-meta-row">
                    <p class="item-name">${escapeHTML(name)}</p>
                    <div class="item-qty-pill">x${escapeHTML(item.quantity)}</div>
                </div>
                <div class="item-details-row">
                    <span class="item-size-badge">${escapeHTML(item.size || '')}</span>
                </div>
            </div>
            <div class="item-price-compact small" style="flex:0 0 84px;text-align:right;order:3;font-weight:800;">${priceTotal.toFixed(2)}${getCurrencyHTML()}</div>
        `;

        // Force child styles for robustness
        // Image container
        // (applies to .item-image-compact)
        // We use setTimeout to ensure children exist when applying to avoid synchronous layout issues.
        itemsList.appendChild(itemElement);
        console.log('Appended item element to list');
        setTimeout(() => {
            const imgWrap = itemElement.querySelector('.item-image-compact');
            if (imgWrap) {
                imgWrap.style.flex = '0 0 44px';
                imgWrap.style.width = '44px';
                imgWrap.style.height = '44px';
                imgWrap.style.order = '1';
                const img = imgWrap.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.display = 'block';
                }
            }
            const info = itemElement.querySelector('.item-info-compact');
            if (info) {
                info.style.flex = '1 1 auto';
                info.style.minWidth = '0';
                info.style.order = '2';
            }
            const price = itemElement.querySelector('.item-price-compact');
            if (price) {
                price.style.flex = '0 0 84px';
                price.style.textAlign = 'right';
                price.style.order = '3';
            }
            const computed = window.getComputedStyle(itemElement);
            const computedImage = itemElement.querySelector('.item-image-compact') ? window.getComputedStyle(itemElement.querySelector('.item-image-compact')) : null;
            const computedInfo = itemElement.querySelector('.item-info-compact') ? window.getComputedStyle(itemElement.querySelector('.item-info-compact')) : null;
            const computedPrice = itemElement.querySelector('.item-price-compact') ? window.getComputedStyle(itemElement.querySelector('.item-price-compact')) : null;
            console.log(`Computed layout for order item ${index}:`, {
                flexDirection: computed.flexDirection,
                direction: computed.direction,
                orderImage: computedImage?.order,
                orderInfo: computedInfo?.order,
                orderPrice: computedPrice?.order
            });
        }, 10);
    });

    // Update items count in header
    const itemsCountEl = document.getElementById('itemsCount');
    if (itemsCountEl) {
        itemsCountEl.textContent = lang === 'en' ? `${cartItems.length} items` : `${cartItems.length} عنصر`;
    }
}

function updateOrderSummary() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.15;
    const shipping = cartItems.length === 0 ? 0 : (subtotal >= 300 ? 0 : 20);
    const total = subtotal + vat + shipping;
    
    // Get currency function from script.js
    const getCurrencyHTML = window.getCurrencyHTML || function() {
        const lang = document.documentElement.lang || 'ar';
        return lang === 'ar' ? ' <img src="images/Saudi_Riyal_Symbol-1.png" alt="ر.س" style="width:1.2em;height:1.2em;vertical-align:middle;">' : ' SAR';
    };
    
    // Update summary amounts
    const subtotalEl = document.querySelector('.subtotal-amount');
    if (subtotalEl) subtotalEl.innerHTML = subtotal.toFixed(2) + getCurrencyHTML();
    
    const vatEl = document.querySelector('.vat-amount');
    if (vatEl) vatEl.innerHTML = vat.toFixed(2) + getCurrencyHTML();
    
    const shippingEl = document.querySelector('.shipping-amount');
    if (shippingEl) shippingEl.innerHTML = shipping.toFixed(2) + getCurrencyHTML();
    
    const totalEl = document.querySelector('.total-amount');
    if (totalEl) totalEl.innerHTML = total.toFixed(2) + getCurrencyHTML();
}

function setupFormSubmission() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleOrderSubmission();
    });

    // Fallback: if the submit button is clicked but the form submit event doesn't fire
    const submitBtn = document.querySelector('.confirm-order-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            // If the button is type=submit, browser will trigger form submit normally.
            // But some environments or JS may prevent it; ensure our handler runs.
            e.preventDefault();
            handleOrderSubmission();
        });
    }
}

async function handleOrderSubmission() {
    // Prevent duplicate submissions
    if (__checkoutIsSubmitting) {
        console.warn('handleOrderSubmission: already submitting, ignoring duplicate call');
        return;
    }
    __checkoutIsSubmitting = true;

    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);
    
    // Validate form
    if (!validateForm(formData)) {
        // Allow user to correct and resubmit
        __checkoutIsSubmitting = false;
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Prepare order data
    const orderData = prepareOrderData(formData);
    
    try {
            console.log('handleOrderSubmission: validation passed, starting payment');
            // For online card methods, create a hosted payment session and redirect user to it
            const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
            const method = selectedMethod ? selectedMethod.value : null;

            let paymentResult = null;
            if (['mada', 'visa'].includes(method)) {
                // Create server-side payment session
                // Include order_data (customer details + items) so the hosted gateway session can be used to send invoices after callback
                const sessionResp = await fetch((window.CREATE_SESSION_URL || 'http://localhost:3000/create-payment-session'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_id: orderData.order_id,
                        amount: orderData.order_total,
                        return_url: window.location.href,
                        order_data: {
                            customer_name: orderData.customer_name,
                            customer_email: orderData.customer_email,
                            customer_phone: orderData.customer_phone,
                            address: orderData.address,
                            city: orderData.city,
                            zip_code: orderData.zip_code,
                            notes: orderData.notes,
                            items: orderData.items,
                            subtotal: orderData.subtotal,
                            tax_rate: orderData.tax_rate,
                            shipping_cost: orderData.shipping_cost,
                            language: orderData.language
                        }
                    })
                }).then(r => r.json()).catch(e => ({ success: false, error: e.message || e }));

                if (sessionResp && sessionResp.success && sessionResp.url) {
                    // Persist full orderData so confirmation page and return handler can finalize the order after redirect back
                    try { localStorage.setItem('lastOrder', JSON.stringify(Object.assign({}, orderData, { payment_method: 'card', transaction_id: null, payment_timestamp: null }))); } catch (e) { }
                    // Redirect to hosted payment mock
                    window.location.href = sessionResp.url;
                    return; // flow continues after redirect
                } else {
                    showNotification(document.documentElement.lang === 'en' ? 'Failed to create payment session' : 'فشل في إنشاء جلسة الدفع', 'error');
                    __checkoutIsSubmitting = false;
                    hideLoadingState();
                    return;
                }
            } else {
                // Process payment client-side for non-hosted methods (cash, stcpay simulation)
                paymentResult = await processPayment(orderData);
                // Add payment info to order data
                orderData.payment_method = paymentResult.method;
                orderData.transaction_id = paymentResult.transactionId;
                orderData.payment_timestamp = paymentResult.timestamp;
            }

        // Persist lastOrder locally BEFORE network call so confirmation page can show it
        try {
            localStorage.setItem('lastOrder', JSON.stringify({
                order_id: orderData.order_id,
                total: orderData.order_total,
                language: document.documentElement.lang || 'ar',
                address: orderData.address,
                city: orderData.city,
                zip_code: orderData.zip_code,
                notes: orderData.notes,
                payment_method: orderData.payment_method,
                transaction_id: orderData.transaction_id,
                payment_timestamp: orderData.payment_timestamp
            }));
        } catch (persistErr) {
            console.warn('Failed to persist lastOrder before network call:', persistErr);
        }

        // Attempt to notify payment webhook first (idempotent, recommended)
        const webhookUrl = window.PAYMENT_WEBHOOK_URL || 'http://localhost:3000/payment-webhook';
        const apiKey = window.PAYMENT_API_KEY || null; // set via script.js if needed
        let sendResult = { success: false };
        try {
            // Try webhook with API key header if provided
            const controller = new AbortController();
            const timeoutMs = 15000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const resp = await fetch(webhookUrl, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, apiKey ? { 'x-api-key': apiKey } : {}),
                body: JSON.stringify(Object.assign({}, orderData, { amount: orderData.order_total, transaction_id: orderData.transaction_id })),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (resp.ok) {
                const d = await resp.json().catch(() => null);
                if (d && d.success) sendResult = { success: true, data: d };
                else sendResult = { success: false, data: d };
            } else {
                const txt = await resp.text().catch(() => null);
                sendResult = { success: false, data: txt || `HTTP ${resp.status}` };
            }
        } catch (err) {
            console.warn('Payment webhook failed, will fallback to send-order:', err && err.message ? err.message : err);
            // Fallback: try existing sendOrderToServer which sends emails and processes order
            sendResult = await sendOrderToServer(orderData);
        }
        const lang = document.documentElement.lang || 'ar';

        if (sendResult.success) {
            console.log('handleOrderSubmission: order saved and emails sent successfully');
            showSuccessState();
            processOrder(orderData);
            const successMessage = lang === 'ar' 
                ? `تم الطلب بنجاح! تم إرسال الفاتورة إلى بريدك الإلكتروني.`
                : `Order placed successfully! Invoice sent to your email.`;
            showNotification(successMessage, 'success');
        } else {
            console.error('handleOrderSubmission: failed to save order:', sendResult.error || sendResult.data);
            // Show actual error to user
            const errorMsg = lang === 'ar' 
                ? `فشل حفظ الطلب: ${sendResult.error || 'خطأ غير معروف'}`
                : `Failed to save order: ${sendResult.error || 'Unknown error'}`;
            showNotification(errorMsg, 'error');
            hideLoadingState();
            __checkoutIsSubmitting = false;
            return; // Stop here, don't redirect
        }

    } catch (error) {
        // Payment or other error
        showErrorState();
        console.error('Payment/Network error:', error);

        let errorMessage = '';
        if (error.message && error.message.includes('فشل في معالجة الدفع')) {
            errorMessage = error.message;
        } else if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            errorMessage = document.documentElement.lang === 'en' 
                ? 'Server is not running. Please start the server and try again.' 
                : 'الخادم غير متصل. يرجى تشغيل الخادم والمحاولة مرة أخرى.';
        } else if (error.message && error.message.includes('HTTP error! status: 500')) {
            errorMessage = document.documentElement.lang === 'en' 
                ? 'Server error. Please try again or contact support.' 
                : 'خطأ في الخادم. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.';
        } else {
            errorMessage = document.documentElement.lang === 'en' 
                ? 'Connection error. Please check your connection and try again.' 
                : 'خطأ في الاتصال. يرجى التحقق من الاتصال والمحاولة مرة أخرى.';
        }

        showNotification(errorMessage, 'error');
    }
    finally {
        // Allow future submissions or retries. Note: processOrder usually redirects.
        __checkoutIsSubmitting = false;
    }
}

function validateForm(formData) {
    const requiredFields = ['fullName', 'email', 'phone', 'city', 'address'];
    
    for (let field of requiredFields) {
        const value = formData.get(field);
        if (!value || value.trim() === '') {
            // Resolve a friendly field label: preference order -> TRANSLATIONS map, DOM label text, fallback to field id
            const lang = document.documentElement.lang || 'ar';
            let friendly = field;

            // Try translations map first
            try {
                const map = TRANSLATIONS[lang] || TRANSLATIONS['en'];
                // map keys in TRANSLATIONS use camel-case ids like fullName, phone, etc.
                if (map && map[field]) {
                    friendly = map[field];
                }
            } catch (e) {
                // ignore
            }

            // If still not friendly (e.g., 'email' in TRANSLATIONS not present), try to get label text from DOM
            if (!friendly || friendly === field) {
                const label = document.querySelector(`label[for="${field}"]`);
                if (label) {
                    // prefer the span inside label if present
                    const span = label.querySelector('[data-translate]') || label.querySelector('span');
                    if (span && span.textContent && span.textContent.trim().length > 0) {
                        friendly = span.textContent.trim();
                    } else if (label.textContent && label.textContent.trim().length > 0) {
                        friendly = label.textContent.trim().replace('*', '').trim();
                    }
                }
            }

            // Final fallback: map common field ids to readable english/ar labels
            const fallbackLabels = {
                fullName: lang === 'en' ? 'Full name' : 'الاسم الكامل',
                email: lang === 'en' ? 'Email' : 'البريد الإلكتروني',
                phone: lang === 'en' ? 'Phone' : 'رقم الجوال',
                city: lang === 'en' ? 'City' : 'المدينة',
                address: lang === 'en' ? 'Address' : 'العنوان التفصيلي'
            };
            if (!friendly || friendly === field) {
                friendly = fallbackLabels[field] || field;
            }

            showNotification(
                lang === 'en' ? `Please fill in ${friendly}` : `يرجى ملء حقل ${friendly}`,
                'error'
            );
            return false;
        }
    }
    
    // Validate email
    const email = formData.get('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification(
            document.documentElement.lang === 'en' 
                ? 'Please enter a valid email address' 
                : 'يرجى إدخال عنوان بريد إلكتروني صحيح',
            'error'
        );
        return false;
    }
    
    // Validate payment method
    if (!validatePaymentMethod()) {
        return false;
    }
    
    return true;
}

function prepareOrderData(formData) {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.15;
    const shipping = cartItems.length === 0 ? 0 : (subtotal >= 300 ? 0 : 20);
    const total = subtotal + vat + shipping;
    
    // Safely read order ID from DOM; if missing generate a fallback and write it back to DOM
    let orderId = '';
    try {
        const orderEl = document.getElementById('orderId');
        if (orderEl && orderEl.textContent && orderEl.textContent.trim().length > 0) {
            orderId = orderEl.textContent.trim();
        } else {
            // generate fallback order id
            orderId = 'ORD' + Date.now().toString().slice(-8);
            if (orderEl) orderEl.textContent = orderId;
        }
    } catch (e) {
        orderId = 'ORD' + Date.now().toString().slice(-8);
    }

    return {
        order_id: orderId,
        customer_name: formData.get('fullName'),
        customer_email: formData.get('email'),
        customer_phone: formData.get('phone'),
        city: formData.get('city'),
        address: formData.get('address'),
        zip_code: formData.get('zip'),
        notes: formData.get('notes'),
        items: cartItems,
        subtotal: subtotal,
        tax_rate: 15,
        tax: vat,
        shipping_cost: shipping,
        order_total: total,
        language: document.documentElement.lang || 'ar',
        support_phone: '0500000000',
        support_email: 'support@mayasahstyle.com',
        business_name: document.documentElement.lang === 'ar' ? 'مياسه ستيل' : 'Mayasah Style'
    };
}

function processOrder(orderData) {
    // Store order in localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Store last order for confirmation page
    localStorage.setItem('lastOrder', JSON.stringify({
        order_id: orderData.order_id,
        total: orderData.order_total,
        language: document.documentElement.lang || 'ar',
        address: orderData.address,
        city: orderData.city,
        zip_code: orderData.zip_code,
        notes: orderData.notes,
        payment_method: orderData.payment_method,
        transaction_id: orderData.transaction_id,
        payment_timestamp: orderData.payment_timestamp
    }));
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Clear saved form data since order is completed
    clearSavedFormData();
    
    // Clear all form fields
    const form = document.getElementById('checkoutForm');
    if (form) {
        form.reset();
        
        // Also clear individual fields to ensure they're empty
        const fieldsToClear = [
            'fullName', 'email', 'phone', 'city', 'address', 'zip', 'notes'
        ];
        
        fieldsToClear.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });
        
        // Reset city dropdown to default
        const citySelect = document.getElementById('city');
        if (citySelect) {
            citySelect.selectedIndex = 0;
        }
    }
    
    // Clear order summary section
    const orderItemsList = document.getElementById('orderItemsList');
    if (orderItemsList) {
        orderItemsList.innerHTML = '';
    }
    
    // Clear summary amounts
    const summaryElements = [
        '.subtotal-amount',
        '.vat-amount', 
        '.shipping-amount',
        '.total-amount'
    ];
    
    summaryElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = '0.00';
        }
    });
    
    // Clear order ID
    const orderIdElement = document.getElementById('orderId');
    if (orderIdElement) {
        orderIdElement.textContent = '';
    }
    
    // Reset location detection button
    const locationBtn = document.getElementById('detectLocationBtn');
    if (locationBtn) {
        locationBtn.classList.remove('loading');
        locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i><span data-translate="useMyLocation">استخدم موقعي</span>';
        locationBtn.disabled = false;
    }
    
    // Update cart count
    updateCartCount();
    
    // Track purchase event if analytics consent given
    if (window.pdplCookieManager && window.pdplCookieManager.hasConsent('analytics')) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const items = cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));
        
        if (window.trackPurchase) {
            window.trackPurchase(orderData.order_id, orderData.order_total, items);
        }
        if (window.trackFacebookPurchase) {
            window.trackFacebookPurchase(orderData.order_id, orderData.order_total, items);
        }
    }
    
    // Show success message
    showNotification(
        document.documentElement.lang === 'en' 
            ? 'Order placed successfully! Check your email for the invoice.' 
            : 'تم تقديم الطلب بنجاح! تحقق من بريدك الإلكتروني للحصول على الفاتورة.',
        'success'
    );
    
    // Redirect to confirmation page after a delay
    setTimeout(() => {
        window.location.href = 'confirmation.html';
    }, 2000);
}

function showLoadingState() {
    const submitBtn = document.querySelector('.confirm-order-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        const lang = document.documentElement.lang || 'ar';
        const text = lang === 'en' ? 'Processing order...' : 'جاري معالجة الطلب...';
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>${text}</span>`;
    }
}

function showSuccessState() {
    const submitBtn = document.querySelector('.confirm-order-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        const lang = document.documentElement.lang || 'ar';
        const text = lang === 'en' ? 'Order sent' : 'تم إرسال الطلب بنجاح';
        submitBtn.innerHTML = `<i class="fas fa-check"></i><span>${text}</span>`;
    }
}

function showErrorState() {
    const submitBtn = document.querySelector('.confirm-order-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
        const lang = document.documentElement.lang || 'ar';
        const text = lang === 'en' ? 'Confirm order & send invoice' : 'تأكيد الطلب وإرسال الفاتورة';
        submitBtn.innerHTML = `<i class="fas fa-times"></i><span>${text}</span>`;
    }
}

function hideLoadingState() {
    const submitBtn = document.querySelector('.confirm-order-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
        const lang = document.documentElement.lang || 'ar';
        const text = lang === 'en' ? 'Confirm order & send invoice' : 'تأكيد الطلب وإرسال الفاتورة';
        submitBtn.innerHTML = `<i class="fas fa-check"></i><span>${text}</span>`;
    }
}

// Send order to backend and return { success: boolean, data?, error? }
async function sendOrderToServer(orderData) {
    try {
        console.log('sendOrderToServer: preparing to send order');
        
        // Generate order ID
        const orderId = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
        
        // Send emails FIRST (this is the most important part!)
        console.log('Sending emails via Brevo...');
        try {
            await sendEmailsViaBrevo(orderData, orderId);
            console.log('✓ Emails sent successfully via Brevo');
        } catch (emailError) {
            console.error('Failed to send emails:', emailError);
            // Don't fail - continue to try saving to Appwrite
            // But let user know email failed
            throw new Error('Failed to send email: ' + emailError.message);
        }
        
        // Now try to save to Appwrite (optional - if collection doesn't exist, it's okay)
        try {
            // Initialize Appwrite client
            const { Client, Databases, ID } = Appwrite;
            const client = new Client();
            
            client
                .setEndpoint('https://cloud.appwrite.io/v1')
                .setProject('68eb3e280039fdf7e677');
            
            const databases = new Databases(client);
            
            // Prepare order document
            const orderDoc = {
                order_id: orderId,
                customer_name: orderData.customer_name,
                customer_email: orderData.customer_email,
                customer_phone: orderData.customer_phone,
                address: orderData.address || '',
                city: orderData.city || '',
                zip_code: orderData.zip_code || '',
                notes: orderData.notes || '',
                items: JSON.stringify(orderData.items),
                subtotal: parseFloat(orderData.subtotal || 0),
                tax: parseFloat(orderData.tax || 0),
                shipping_cost: parseFloat(orderData.shipping_cost || 0),
                total: parseFloat(orderData.order_total || 0),
                payment_method: orderData.payment_method || 'cod',
                payment_status: orderData.payment_status || 'pending',
                transaction_id: orderData.transaction_id || '',
                language: orderData.language || 'ar',
                order_date: new Date().toISOString(),
                status: 'pending',
                created_at: new Date().toISOString(),
                email_sent: true
            };
            
            // Try to save to Appwrite
            const savedOrder = await databases.createDocument(
                '68eb4036002db50c7171', // Database ID
                'orders', // Collection ID
                ID.unique(),
                orderDoc
            );
            
            console.log('✓ Order saved to Appwrite:', orderId);
        } catch (appwriteError) {
            // If Appwrite fails (collection doesn't exist), that's okay
            // The email was already sent, which is the most important part
            console.warn('Could not save to Appwrite (this is okay if collection does not exist):', appwriteError.message);
        }
        
        return { 
            success: true, 
            data: {
                order_id: orderId,
                message: 'Order processed and emails sent successfully'
            }
        };
        
    } catch (err) {
        console.error('Error processing order:', err);
        return { 
            success: false, 
            error: err.message || 'Failed to process order' 
        };
    }
}

// Send emails using Brevo API
async function sendEmailsViaBrevo(orderData, orderId) {
    // Check if Cloudflare Worker URL is configured
    if (!window.EMAIL_WORKER_URL) {
        console.error('Email worker URL not configured');
        throw new Error('Email service not configured. Please set EMAIL_WORKER_URL in config.js');
    }
    
    console.log('✓ Using Cloudflare Worker for email sending');
    
    const lang = orderData.language || 'ar';
    
    // Build email content
    const customerEmailContent = buildCustomerEmailHTML(orderData, orderId, lang);
    const ownerEmailContent = buildOwnerEmailHTML(orderData, orderId);
    
    // Send customer email
    await sendBrevoEmail({
        sender: { name: lang === 'ar' ? 'مياسه ستيل' : 'Mayasah Style', email: 'mayasahstyle@gmail.com' },
        to: [{ email: orderData.customer_email, name: orderData.customer_name }],
        subject: customerEmailContent.subject,
        htmlContent: customerEmailContent.html
    });
    
    // Send owner notification email
    await sendBrevoEmail({
        sender: { name: 'Mayasah Style System', email: 'mayasahstyle@gmail.com' },
        to: [{ email: 'mayasahstyle@gmail.com', name: 'Mayasah Style' }],
        subject: ownerEmailContent.subject,
        htmlContent: ownerEmailContent.html
    });
}

// Send email via Brevo API
async function sendBrevoEmail(emailData) {
    // Use Cloudflare Worker to send emails (secure - API key not exposed)
    if (!window.EMAIL_WORKER_URL) {
        throw new Error('Email worker URL not configured');
    }
    
    console.log('Calling Cloudflare Worker at:', window.EMAIL_WORKER_URL);
    
    const response = await fetch(window.EMAIL_WORKER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Worker error:', errorText);
        throw new Error(`Worker error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✓ Email sent via worker:', result);
    return result;
}

// Build customer email HTML content
function buildCustomerEmailHTML(orderData, orderId, lang) {
    const isArabic = lang === 'ar';
    const subject = isArabic 
        ? `فاتورة الطلب ${orderId} - مياسه ستيل`
        : `Order Invoice ${orderId} - Mayasah Style`;
    
    const itemsHtml = orderData.items.map(item => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 12px; text-align: ${isArabic ? 'right' : 'left'};">${item.name}</td>
            <td style="padding: 12px; text-align: center;">${item.size || '-'}</td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: ${isArabic ? 'left' : 'right'}; font-weight: bold;">${item.price.toFixed(2)} ${isArabic ? 'ر.س' : 'SAR'}</td>
        </tr>
    `).join('');
    
    const htmlContent = `
<!DOCTYPE html>
<html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3C2A21 0%, #5D4037 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">${isArabic ? 'مياسه ستيل' : 'Mayasah Style'}</h1>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">${isArabic ? 'فاتورة الطلب' : 'Order Invoice'}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px;">${isArabic ? 'عزيزي/عزيزتي' : 'Dear'} ${orderData.customer_name},</p>
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 20px;">
                ${isArabic 
                    ? 'شكراً لك على طلبك! نحن متحمسون لإعداد طلبك وإرساله إليك.'
                    : 'Thank you for your order! We are excited to prepare and send it to you.'}
            </p>
            
            <!-- Order Details -->
            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #3C2A21; margin: 0 0 15px; border-bottom: 2px solid #3C2A21; padding-bottom: 10px;">
                    ${isArabic ? 'تفاصيل الطلب' : 'Order Details'}
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">${isArabic ? 'رقم الطلب:' : 'Order Number:'}</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #3C2A21; text-align: ${isArabic ? 'left' : 'right'};">${orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">${isArabic ? 'التاريخ:' : 'Date:'}</td>
                        <td style="padding: 8px 0; color: #333; text-align: ${isArabic ? 'left' : 'right'};">${new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">${isArabic ? 'طريقة الدفع:' : 'Payment Method:'}</td>
                        <td style="padding: 8px 0; color: #333; text-align: ${isArabic ? 'left' : 'right'};">
                            ${orderData.payment_method === 'cod' ? (isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery') : (isArabic ? 'بطاقة' : 'Card')}
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Items Table -->
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 16px; color: #3C2A21; margin: 0 0 15px;">${isArabic ? 'المنتجات' : 'Items'}</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background-color: #3C2A21; color: white;">
                            <th style="padding: 12px; text-align: ${isArabic ? 'right' : 'left'};">${isArabic ? 'المنتج' : 'Product'}</th>
                            <th style="padding: 12px; text-align: center;">${isArabic ? 'المقاس' : 'Size'}</th>
                            <th style="padding: 12px; text-align: center;">${isArabic ? 'الكمية' : 'Qty'}</th>
                            <th style="padding: 12px; text-align: ${isArabic ? 'left' : 'right'};">${isArabic ? 'السعر' : 'Price'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
            
            <!-- Summary -->
            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">${isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</td>
                        <td style="padding: 8px 0; text-align: ${isArabic ? 'left' : 'right'};">${orderData.subtotal.toFixed(2)} ${isArabic ? 'ر.س' : 'SAR'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">${isArabic ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</td>
                        <td style="padding: 8px 0; text-align: ${isArabic ? 'left' : 'right'};">${orderData.tax.toFixed(2)} ${isArabic ? 'ر.س' : 'SAR'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">${isArabic ? 'الشحن:' : 'Shipping:'}</td>
                        <td style="padding: 8px 0; text-align: ${isArabic ? 'left' : 'right'};">${orderData.shipping_cost.toFixed(2)} ${isArabic ? 'ر.س' : 'SAR'}</td>
                    </tr>
                    <tr style="border-top: 2px solid #3C2A21;">
                        <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; color: #3C2A21;">${isArabic ? 'الإجمالي:' : 'Total:'}</td>
                        <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; color: #3C2A21; text-align: ${isArabic ? 'left' : 'right'};">${orderData.order_total.toFixed(2)} ${isArabic ? 'ر.س' : 'SAR'}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Shipping Address -->
            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="font-size: 16px; color: #3C2A21; margin: 0 0 10px;">${isArabic ? 'عنوان التوصيل' : 'Shipping Address'}</h3>
                <p style="margin: 5px 0; color: #666;">${orderData.address}</p>
                <p style="margin: 5px 0; color: #666;">${orderData.city}${orderData.zip_code ? `, ${orderData.zip_code}` : ''}</p>
                <p style="margin: 5px 0; color: #666;">${isArabic ? 'الهاتف:' : 'Phone:'} ${orderData.customer_phone}</p>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 20px 0;">
                ${isArabic 
                    ? 'إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.'
                    : 'If you have any questions, feel free to contact us.'}
            </p>
            <p style="font-size: 14px; color: #666; margin: 0;">
                ${isArabic ? 'مع أطيب التحيات،' : 'Best regards,'}<br>
                <strong style="color: #3C2A21;">${isArabic ? 'فريق مياسه ستيل' : 'Mayasah Style Team'}</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} ${isArabic ? 'مياسه ستيل' : 'Mayasah Style'}. ${isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
            <p style="margin: 10px 0 0; font-size: 12px; color: #999;">
                ${isArabic ? 'الهاتف:' : 'Phone:'} 0500000000 | ${isArabic ? 'البريد:' : 'Email:'} support@mayasahstyle.com
            </p>
        </div>
    </div>
</body>
</html>`;
    
    return {
        subject: subject,
        html: htmlContent
    };
}

// Build owner notification email HTML
function buildOwnerEmailHTML(orderData, orderId) {
    const itemsHtml = orderData.items.map(item => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 12px; text-align: right;">${item.name}</td>
            <td style="padding: 12px; text-align: center;">${item.size || '-'}</td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: left; font-weight: bold;">${item.price.toFixed(2)} ر.س</td>
        </tr>
    `).join('');
    
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🔔 طلب جديد</h1>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">لديك طلب جديد من موقع مياسه ستيل</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <!-- Order Summary -->
            <div style="background-color: #e8f4fd; border-right: 4px solid #3498db; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="font-size: 18px; color: #2c3e50; margin: 0 0 15px;">ملخص الطلب</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #555; font-weight: bold;">رقم الطلب:</td>
                        <td style="padding: 8px 0; color: #2c3e50; text-align: left; font-size: 18px; font-weight: bold;">${orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555; font-weight: bold;">التاريخ:</td>
                        <td style="padding: 8px 0; color: #333; text-align: left;">${new Date().toLocaleDateString('ar-SA')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555; font-weight: bold;">المبلغ الإجمالي:</td>
                        <td style="padding: 8px 0; color: #27ae60; text-align: left; font-size: 20px; font-weight: bold;">${orderData.order_total.toFixed(2)} ر.س</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555; font-weight: bold;">طريقة الدفع:</td>
                        <td style="padding: 8px 0; color: #333; text-align: left;">
                            ${orderData.payment_method === 'cod' ? 'الدفع عند الاستلام 💵' : 'بطاقة 💳'}
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Customer Info -->
            <div style="background-color: #fff3cd; border-right: 4px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="font-size: 16px; color: #2c3e50; margin: 0 0 15px;">معلومات العميل</h3>
                <p style="margin: 5px 0; color: #555;"><strong>الاسم:</strong> ${orderData.customer_name}</p>
                <p style="margin: 5px 0; color: #555;"><strong>الهاتف:</strong> <a href="tel:${orderData.customer_phone}" style="color: #3498db; text-decoration: none;">${orderData.customer_phone}</a></p>
                <p style="margin: 5px 0; color: #555;"><strong>البريد:</strong> <a href="mailto:${orderData.customer_email}" style="color: #3498db; text-decoration: none;">${orderData.customer_email}</a></p>
                <p style="margin: 5px 0; color: #555;"><strong>العنوان:</strong> ${orderData.address}</p>
                <p style="margin: 5px 0; color: #555;"><strong>المدينة:</strong> ${orderData.city}${orderData.zip_code ? ` - ${orderData.zip_code}` : ''}</p>
                ${orderData.notes ? `<p style="margin: 10px 0 0; padding: 10px; background-color: white; border-radius: 5px; color: #555;"><strong>ملاحظات:</strong> ${orderData.notes}</p>` : ''}
            </div>
            
            <!-- Items Table -->
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 16px; color: #2c3e50; margin: 0 0 15px;">المنتجات المطلوبة</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white;">
                            <th style="padding: 12px; text-align: right;">المنتج</th>
                            <th style="padding: 12px; text-align: center;">المقاس</th>
                            <th style="padding: 12px; text-align: center;">الكمية</th>
                            <th style="padding: 12px; text-align: left;">السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
            
            <!-- Financial Summary -->
            <div style="background-color: #d4edda; border-right: 4px solid #28a745; border-radius: 8px; padding: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #555;">المجموع الفرعي:</td>
                        <td style="padding: 8px 0; text-align: left; font-weight: bold;">${orderData.subtotal.toFixed(2)} ر.س</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;">ضريبة القيمة المضافة (15%):</td>
                        <td style="padding: 8px 0; text-align: left; font-weight: bold;">${orderData.tax.toFixed(2)} ر.س</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;">الشحن:</td>
                        <td style="padding: 8px 0; text-align: left; font-weight: bold;">${orderData.shipping_cost.toFixed(2)} ر.س</td>
                    </tr>
                    <tr style="border-top: 2px solid #28a745;">
                        <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; color: #2c3e50;">الإجمالي النهائي:</td>
                        <td style="padding: 12px 0 0; font-size: 20px; font-weight: bold; color: #28a745; text-align: left;">${orderData.order_total.toFixed(2)} ر.س</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #555; font-size: 14px;">📱 تواصل مع العميل الآن</p>
                <div style="margin-top: 15px;">
                    <a href="tel:${orderData.customer_phone}" style="display: inline-block; margin: 0 5px; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">📞 اتصل الآن</a>
                    <a href="https://wa.me/${orderData.customer_phone.replace(/[^0-9]/g, '')}" style="display: inline-block; margin: 0 5px; padding: 12px 24px; background-color: #25d366; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">💬 واتساب</a>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #ecf0f1;">
                تم إرسال هذا البريد تلقائياً من نظام مياسه ستيل
            </p>
            <p style="margin: 10px 0 0; font-size: 12px; color: #bdc3c7;">
                © ${new Date().getFullYear()} مياسه ستيل. جميع الحقوق محفوظة.
            </p>
        </div>
    </div>
</body>
</html>`;
    
    return {
        subject: `🛍️ طلب جديد ${orderId} - ${orderData.order_total.toFixed(2)} ر.س`,
        html: htmlContent
    };
}

function addRetryButton(orderData) {
    // Remove any previously added separate retry button to keep UI simple
    const existing = document.getElementById('retrySendBtn');
    if (existing) existing.remove();

    const confirmBtn = document.querySelector('.confirm-order-btn');
    if (!confirmBtn) return;

    const lang = document.documentElement.lang || 'ar';
    // store original HTML to restore later if needed
    if (!confirmBtn.dataset.origHtml) confirmBtn.dataset.origHtml = confirmBtn.innerHTML;

    // Set retry state on the primary button
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `<i class="fas fa-redo"></i><span>${lang === 'en' ? 'Try confirming again' : 'حاول التأكيد مرة أخرى'}</span>`;

    // Replace click behavior to attempt sending invoice only (no double-charging)
    confirmBtn.onclick = async function retryHandler(e) {
        e.preventDefault();

        if (__checkoutIsSubmitting) {
            console.warn('Retry already in progress, ignoring duplicate click');
            return;
        }
        __checkoutIsSubmitting = true;

        try {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>${lang === 'en' ? 'Retrying...' : 'جاري المحاولة...'}</span>`;

            const res = await sendOrderToServer(orderData);
            if (res.success) {
                showNotification(lang === 'en' ? 'Invoice sent successfully' : 'تم إرسال الفاتورة بنجاح', 'success');
                // finalize and redirect
                showSuccessState();
                processOrder(orderData);
                // restore original onclick (if any)
                confirmBtn.onclick = null;
            } else {
                showNotification(lang === 'en' ? 'Retry failed. Please contact support.' : 'فشل إعادة الإرسال. يرجى التواصل مع الدعم', 'error');
                // restore retry label and re-enable
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = `<i class="fas fa-redo"></i><span>${lang === 'en' ? 'Try confirming again' : 'حاول التأكيد مرة أخرى'}</span>`;
            }
        } finally {
            __checkoutIsSubmitting = false;
        }
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.background = '#28a745';
    } else if (type === 'error') {
        notification.style.background = '#dc3545';
    } else {
        notification.style.background = '#17a2b8';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Update cart count function (if not already defined)
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
    }
}

// Form persistence functions
function saveFormData() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    
    const formData = {
        fullName: form.querySelector('#fullName')?.value || '',
        email: form.querySelector('#email')?.value || '',
        phone: form.querySelector('#phone')?.value || '',
        city: form.querySelector('#city')?.value || '',
        address: form.querySelector('#address')?.value || '',
        zip: form.querySelector('#zip')?.value || '',
        notes: form.querySelector('#notes')?.value || ''
    };
    
    localStorage.setItem('checkoutFormData', JSON.stringify(formData));
}

function loadSavedFormData() {
    const savedData = localStorage.getItem('checkoutFormData');
    if (!savedData) return;
    
    try {
        const formData = JSON.parse(savedData);
        const form = document.getElementById('checkoutForm');
        if (!form) return;
        
        // Restore form fields
        if (formData.fullName) form.querySelector('#fullName').value = formData.fullName;
        if (formData.email) form.querySelector('#email').value = formData.email;
        if (formData.phone) form.querySelector('#phone').value = formData.phone;
        if (formData.city) form.querySelector('#city').value = formData.city;
    if (formData.address && formData.address !== 'null') form.querySelector('#address').value = formData.address;
    else if (form.querySelector('#address')) form.querySelector('#address').value = '';
        if (formData.zip) form.querySelector('#zip').value = formData.zip;
        if (formData.notes) form.querySelector('#notes').value = formData.notes;
        
        console.log('Form data restored from localStorage');
    } catch (error) {
        console.error('Error loading saved form data:', error);
    }
}

function setupFormAutoSave() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    
    // Save form data on input changes
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', saveFormData);
        input.addEventListener('change', saveFormData);
    });
    
    // Save form data before page unload
    window.addEventListener('beforeunload', saveFormData);
    
    // Save form data when user navigates away
    window.addEventListener('pagehide', saveFormData);
}

function clearSavedFormData() {
    localStorage.removeItem('checkoutFormData');
}

// Payment Methods Functions
function setupPaymentMethods() {
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    
    // Initialize Moyasar payment form
    if (typeof window.MoyasarPayment !== 'undefined') {
        try {
            window.moyasarInstance = window.MoyasarPayment.init();
            console.log('✓ Moyasar payment initialized');
        } catch (e) {
            console.error('Failed to initialize Moyasar:', e);
        }
    }
    
    // Show/hide Moyasar form based on payment method
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateMoyasarFormVisibility();
            updatePaymentButtonText();
        });
    });
    
    // Initial setup
    updateMoyasarFormVisibility();
    updatePaymentButtonText();
}

function updateMoyasarFormVisibility() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    const moyasarForm = document.getElementById('moyasar-payment-form');

    if (!selectedMethod || !moyasarForm) return;

    // Show Moyasar form only for card payment
    if (selectedMethod.value === 'card') {
        moyasarForm.style.display = 'block';
        
        // Update Moyasar amount
        if (typeof window.MoyasarPayment !== 'undefined') {
            const total = parseFloat(document.getElementById('orderTotal')?.textContent?.replace(/[^\d.]/g, '') || 0);
            window.MoyasarPayment.updateAmount(total);
        }
    } else {
        moyasarForm.style.display = 'none';
    }
}

function updateCardFormVisibility() {
    // This function is kept for backwards compatibility
    // but now we use Moyasar hosted form instead
    updateMoyasarFormVisibility();
}

function updatePaymentButtonText() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    const payButton = document.querySelector('.confirm-order-btn span');
    
    if (!selectedMethod || !payButton) return;
    
    const lang = document.documentElement.lang || 'ar';
    let buttonText = '';
    
    switch (selectedMethod.value) {
        case 'cod':
            buttonText = lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order';
            break;
        case 'card':
            buttonText = lang === 'ar' ? 'ادفع الآن' : 'Pay Now';
            break;
        default:
            buttonText = lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order';
    }
    
    payButton.textContent = buttonText;
}

function validatePaymentMethod() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!selectedMethod) {
        showNotification(document.documentElement.lang === 'en' ? 'Please choose a payment method' : 'يرجى اختيار طريقة دفع', 'error');
        return false;
    }
    
    const method = selectedMethod.value;
    
    // If method is a card (mada/visa) and we're using hosted checkout (default), skip client-side card validation.
    // To enable client-side card validation (NOT recommended for production), set window.FORCE_CLIENT_CARD = true before page load.
    if (['mada', 'visa'].includes(method) && !window.FORCE_CLIENT_CARD) {
        return true;
    }

    // If FORCE_CLIENT_CARD is enabled, fall through to any other validation you might add below (none by default).
    
    return true;
}

function processPayment(orderData) {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    const method = selectedMethod.value;
    
    // Simulate payment processing
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate different payment scenarios
            const successRate = 0.95; // 95% success rate
            
            if (Math.random() < successRate) {
                // Payment successful
                const paymentResult = {
                    success: true,
                    method: method,
                    transactionId: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    amount: orderData.order_total,
                    timestamp: new Date().toISOString()
                };
                resolve(paymentResult);
            } else {
                // Payment failed
                const errMsg = document.documentElement.lang === 'en' ? 'Payment processing failed. Please try again.' : 'فشل في معالجة الدفع. يرجى المحاولة مرة أخرى.';
                reject(new Error(errMsg));
            }
        }, 2000); // Simulate 2-second processing time
    });
}