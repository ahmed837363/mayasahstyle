// Language Switching - Full Translation System
function translatePage(lang) {
    // First handle all elements with translation spans
    document.querySelectorAll('[data-translate-ar], [data-translate-en]').forEach(span => {
        if (span.hasAttribute('data-translate-ar')) {
            span.style.display = lang === 'ar' ? 'inline' : 'none';
        }
        if (span.hasAttribute('data-translate-en')) {
            span.style.display = lang === 'en' ? 'inline' : 'none';
        }
    });

    // Then handle elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (!translations[lang] || !translations[lang][key]) return;
        // Skip if element contains translation spans
        if (!element.querySelector('[data-translate-ar], [data-translate-en]')) {
            // If it's a badge, preserve whitespace/formatting
            if (
                element.classList.contains('home-product-discount') ||
                element.classList.contains('product-badge') ||
                element.classList.contains('discount')
            ) {
                // Only update if the element is visible (not hidden by style)
                if (element.offsetParent !== null || element.style.display !== 'none') {
                    element.textContent = translations[lang][key];
                }
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Ensure targeted product title class is updated after language switch
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    const product = window.productsData ? window.productsData.find(p => p.id === id) : null;
    const titleEl = document.getElementById('product-title');
    if (titleEl && product) {
        if (lang === 'en' && product.key === 'product2') {
            titleEl.classList.add('product-title-golden-embroidery-en');
        } else {
            titleEl.classList.remove('product-title-golden-embroidery-en');
        }
    }

    // Handle special elements like placeholders
    const promoInput = document.getElementById('promo-code');
    if (promoInput && translations[lang] && translations[lang]['promoCode']) {
        promoInput.setAttribute('placeholder', translations[lang]['promoCode']);
    }

    // Handle all elements with data-translate-placeholder attribute
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.setAttribute('placeholder', translations[lang][key]);
        }
    });

    // Handle size selector
    const sizeSelect = document.getElementById('size');
    if (sizeSelect) {
        const sizeLabel = document.querySelector('label[for="size"][data-translate="size"]');
        if (sizeLabel && translations[lang] && translations[lang]['size']) {
            sizeLabel.textContent = translations[lang]['size'];
        }
        const selectOption = sizeSelect.querySelector('option[data-translate="selectSize"]');
        if (selectOption && translations[lang] && translations[lang]['selectSize']) {
            selectOption.textContent = translations[lang]['selectSize'];
        }
    }

    // Show/hide separate footers
    if (lang === 'ar') {
        document.querySelectorAll('.footer-ar').forEach(el => {
            el.style.display = 'flex';
        });
        document.querySelectorAll('.footer-en').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        document.querySelectorAll('.footer-ar').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.footer-en').forEach(el => {
            el.style.display = 'flex';
        });
    }

    // Update cookie banner language if it exists
    if (window.pdplCookieManager) {
        window.pdplCookieManager.setLanguage(lang);
    }
}

// --- Cart/Checkout/Shipping Constants (must be above all functions that use them) ---

const productsData = [
    {
        id: 1,
        images: [
            "images/product1 front.jpg", // front
            "images/product1 left.jpg", // left
            "images/product1 right.jpg", // right
            "images/product1 back.jpg" // back
        ],
        key: "product1",
        desc_ar: "عباية سوداء بتصميم كلاسيكي وجودة عالية، مناسبة لجميع المناسبات.",
        desc_en: "Classic black abaya with high quality, suitable for all occasions.",
        price: 199.99,
        original: 249.99,
        discount: "-15%"
    },
    {
        id: 2,
        images: [
            "images/abaya2.jpg",
            "images/abaya2_left.jpg",
            "images/abaya2_right.jpg",
            "images/abaya2_back.jpg"
        ],
        key: "product2",
        desc_ar: "عباية مطرزة بالخيط الذهبي لإطلالة فاخرة.",
        desc_en: "Abaya embroidered with golden thread for a luxurious look.",
        price: 349.99,
        original: null,
        // CHANGE: Remove hardcoded Arabic "جديد" and use translation key
        discount: "new"
    },
    {
        id: 3,
        images: [
            "images/abaya3.jpg",
            "images/abaya3_left.jpg",
            "images/abaya3_right.jpg",
            "images/abaya3_back.jpg"
        ],
        key: "product3",
        desc_ar: "عباية كحلي بتصميم عصري وأنيق.",
        desc_en: "Modern and elegant navy abaya.",
        price: 279.99,
        original: null,
        discount: null
    },
    {
        id: 4,
        images: [
            "images/abaya4.jpg",
            "images/abaya4_left.jpg",
            "images/abaya4_right.jpg",
            "images/abaya4_back.jpg"
        ],
        key: "product4",
        desc_ar: "عباية رمادية بتفاصيل فضية راقية.",
        desc_en: "Gray abaya with elegant silver details.",
        price: 249.99,
        original: null,
        discount: null
    }
];

// Make productsData available globally for updateProductDetailContent
window.productsData = productsData;

// --- Product Detail Image Carousel Logic ---
document.addEventListener('DOMContentLoaded', function() {
    // Only run on product-detail page
    if (!document.body.classList.contains('product-detail-page')) return;
    // Get product id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = productsData.find(p => p.id === productId);
    if (!product || !product.images) return;
    let currentImageIndex = 0;
    const productImage = document.getElementById('product-image');
    const arrowLeft = document.getElementById('arrow-left');
    const arrowRight = document.getElementById('arrow-right');
    // Helper to update image
    function updateImage() {
        productImage.src = product.images[currentImageIndex];
        // Optionally, update alt text for accessibility
        const sides = ['front', 'left', 'right', 'back'];
        productImage.alt = productImage.alt = `${product.key} ${sides[currentImageIndex] || ''}`;
    }
    // Initial image
    updateImage();
    // Arrow click handlers
    arrowLeft.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
        updateImage();
    });
    arrowRight.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex + 1) % product.images.length;
        updateImage();
    });
});

const translations = {
    ar: {
        product1: "عباية سوداء كلاسيكية",
        product2: "عباية مطرزة بالخيط الذهبي",
        product3: "عباية كحلي بتصميم عصري",
        product4: "عباية رمادية بتفاصيل فضية",
        size: "المقاس",
        selectSize: "اختر المقاس",
        addToCart: "أضف للسلة",
        storeName: "مياسه ستيل",
        home: "الرئيسية",
        products: "المنتجات",
        cart: "عربة التسوق",
        contact: "اتصل بنا",
        aboutStore: "عن المتجر",
        aboutText: "متجر مياسه ستيل يقدم أحدث تصاميم العباءات للسيدات المتميزات في المملكة العربية السعودية. نقدم جودة عالية وتصاميم أنيقة تناسب جميع الأذواق.",
        quickLinks: "روابط سريعة",
        contactInfo: "معلومات التواصل",
        contactLocation: "جدة، المملكة العربية السعودية",
        copyright: "جميع الحقوق محفوظة © 2023 مياسه ستيل | تم تطويره بحب في المملكة العربية السعودية",
        new: "جديد",
        discount15: "خصم 15%",
        discount10: "خصم 10%",
        emptyCart: "سلة التسوق فارغة",
        promoCode: "أدخل رمز الخصم",
        checkout: "إتمام الشراء",
        remove: "إزالة",
        sizeLabel: "المقاس",
        subtotal: "المجموع الفرعي",
        vat: "ضريبة القيمة المضافة",
        shipping: "الشحن",
        total: "الإجمالي",
        freeShipping: "!مبروك! الشحن مجاني لهذا الطلب",
        addMoreForFreeShipping: "أضف منتجات بقيمة {amount} أخرى لتحصل على شحن مجاني",
        checkoutSubtitle: "أكمل طلبك باتباع الخطوات التالية",
        shippingInfoDesc: "أدخل معلومات التوصيل الخاصة بك",
        orderNotes: "ملاحظات الطلب",
        items: "المنتجات",
        quantity: "الكمية",
        estimatedDelivery: "التوصيل المتوقع خلال 3-5 أيام عمل",
        orderNote: "سيتم إرسال تفاصيل الطلب والفواتير إلى بريدك الإلكتروني",
        selectCity: "اختر المدينة",
        congratulations: "!مبروك! الشحن مجاني لهذا الطلب",
        orderSummary: "ملخص الطلب",
        confirmOrder: "تأكيد الطلب",
        contactPhone: "+966 50 123 4567",
        contactEmail: "mayasahstyle@gmail.com",
        instagram: "انستقرام",
        twitter: "تويتر",
        snapchat: "سناب شات",
        tiktok: "تيك توك",
        heroTitle: "عبايات فاخرة بتصاميم عصرية",
        heroDesc: "تسوقي أحدث تشكيلات العبايات الفاخرة بجودة عالية وتصاميم تناسب جميع الأذواق. توصيل سريع لجميع مدن المملكة.",
        heroSubtitle: "اكتشف أحدث تشكيلات العباءات المصممة بعناية لتناسب ذوقك الرفيع",
        heroBtn: "تسوقي الآن",
        browseCollection: "تصفح المجموعة",
        whyChooseUs: "لماذا تختار متجرنا",
        shippingInfo: "معلومات الشحن",
        fullName: "الاسم الكامل",
        email: "البريد الإلكتروني",
        phone: "رقم الجوال",
        address: "العنوان",
        city: "المدينة",
        zip: "الرمز البريدي",
        paymentMethod: "طرق الدفع",
        apply: "تطبيق",
        orderConfirmed: "تم تأكيد طلبك بنجاح!",
        thankYou: "شكراً لشرائك من مياسه ستيل. لقد تم استلام طلبك بنجاح وسيتم تجهيزه للشحن في أقرب وقت ممكن. سوف تتلقى بريداً إلكترونياً بتفاصيل الطلب وتتبع الشحن بمجرد شحن طلبك.",
        orderNumber: "رقم الطلب:",
        orderDate: "تاريخ الطلب:",
        totalAmount: "المجموع الكلي:",
        shippingAddress: "عنوان الشحن:",
        trackingNumber: "رقم التتبع:",
        continueShopping: "استمر في التسوق",
        whyUs: "لماذا نحن؟",
        featuredProducts: "أفضل المنتجات",
        feature1Title: "جودة عالية",
        feature1Desc: "نستخدم أفضل الخامات والتطريزات لضمان الجودة.",
        feature2Title: "توصيل سريع",
        feature2Desc: "شحن سريع وآمن لجميع مناطق المملكة.",
        feature3Title: "دعم عملاء 24/7",
        feature3Desc: "فريق دعم متواجد دائماً لخدمتك.",
        new: "جديد",
        useMyLocation: "استخدم موقعي",
        detectingLocation: "جاري تحديد الموقع...",
        locationDetected: "تم تحديد الموقع بنجاح!",
        cityDetectedNoStreet: "تم تحديد المدينة ولكن لم يتم العثور على اسم الشارع. يرجى إدخال اسم الشارع يدوياً.",
        locationAccessDenied: "تم رفض الوصول للموقع. يرجى السماح بالوصول للموقع أو الإدخال يدوياً.",
        locationUnavailable: "معلومات الموقع غير متوفرة.",
        locationTimeout: "انتهت مهلة طلب الموقع.",
        couldNotGetAddress: "تعذر الحصول على العنوان من الإحداثيات.",
        errorGettingAddress: "خطأ في الحصول على العنوان: ",
        emailInvoice: "فاتورة بريد إلكتروني",
        chatWithBot: "تحدث مع المساعد الذكي",
        mayasahAssistant: "مساعد مياسه الذكي",
        online: "متصل الآن",
        welcomeMessage: "مرحباً! أنا مساعد مياسه الذكي. كيف يمكنني مساعدتك اليوم؟",
        askProducts: "المنتجات المتوفرة",
        askShipping: "معلومات الشحن",
        // Payment translations
        paymentInfo: "معلومات الدفع",
        paymentInfoDesc: "اختر طريقة الدفع المفضلة لديك",
        madaCard: "بطاقة مدى",
        madaDesc: "بطاقة مدى الائتمانية أو المدى المباشر",
        visaCard: "فيزا / ماستركارد",
        visaDesc: "بطاقات فيزا وماستركارد الدولية",
        applePay: "Apple Pay",
        applePayDesc: "الدفع عبر Apple Pay",
        stcPay: "STC Pay",
        stcPayDesc: "الدفع عبر تطبيق STC Pay",
        cashOnDelivery: "الدفع عند الاستلام",
        codDesc: "ادفع نقداً عند استلام الطلب",
        cardNumber: "رقم البطاقة",
        cardHolder: "اسم حامل البطاقة",
        expiryDate: "تاريخ الانتهاء",
        cvv: "رمز الأمان",
        paymentSecurity: "جميع المدفوعات محمية ومشفرة. لن نشارك بياناتك مع أي طرف ثالث.",
        payNow: "ادفع الآن",
        transactionId: "رقم المعاملة",
        askSizes: "المقاسات المتوفرة",
        askContact: "التواصل المباشر",
        typeMessage: "اكتب رسالتك هنا...",
        sendMessage: "أرسل لنا رسالة",
        subject: "الموضوع",
        selectSubject: "اختر الموضوع",
        generalInquiry: "استفسار عام",
        orderInquiry: "استفسار عن الطلب",
        productInquiry: "استفسار عن المنتج",
        complaint: "شكوى",
        suggestion: "اقتراح",
        typeYourMessage: "اكتب رسالتك هنا...",
        contactWhatsapp: "تواصل عبر واتساب",
        workingHours: "ساعات العمل",
        message: "الرسالة",
        workingHoursText: "9 صباحاً - 10 مساءً",
        name: "الاسم",
        phoneOptional: "رقم الهاتف (اختياري)",
        aboutUs: "من نحن",
        aboutUsTitle: "مياسه ستيل - رحلة من الأناقة والتميز",
        aboutUsIntro: "مرحباً بكم في مياسه ستيل، وجهتكم المثالية لأحدث وأجمل تشكيلات العباءات النسائية. نحن متجر متخصص في تقديم أفضل أنواع العباءات التي تجمع بين الأناقة العصرية والأصالة التراثية.",
        aboutUsMission: "منذ تأسيسنا، كان هدفنا الأساسي هو تقديم قطع فريدة تعكس جمال وأناقة المرأة العربية. نختار بعناية فائقة كل قطعة في مجموعتنا لضمان الجودة العالية والتصميم المتميز.",
        aboutUsCollection: "نفتخر بتقديم مجموعة واسعة من العباءات التي تناسب جميع المناسبات، من العباءات اليومية البسيطة إلى القطع المطرزة الفاخرة للمناسبات الخاصة.",
        highQuality: "الجودة العالية",
        highQualityDesc: "نختار أفضل الخامات والأقمشة لضمان الراحة والأناقة",
        passionForExcellence: "شغف بالتميز",
        passionForExcellenceDesc: "نعمل بشغف لتقديم أفضل تجربة تسوق لعملائنا الكرام",
        customerService: "خدمة العملاء",
        customerServiceDesc: "فريق دعم متخصص متواجد دائماً لخدمتكم ومساعدتكم",
        ourMission: "رسالتنا",
        missionStatement: "نسعى لنكون الخيار الأول للمرأة العربية في عالم الأزياء، من خلال تقديم عباءات تجمع بين الأناقة والجودة والراحة، مع الحفاظ على القيم الأصيلة والتطلع نحو المستقبل",
        termsConditions: "الشروط والأحكام",
        lastUpdated: "آخر تحديث: يناير 2025",
        termsAcceptance: "قبول الشروط",
        termsAcceptanceText: "باستخدام موقع مياسه ستيل الإلكتروني، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام موقعنا.",
        useLicense: "ترخيص الاستخدام",
        useLicenseText: "يتم منح ترخيص مؤقت للوصول إلى المواد الموجودة على موقع مياسه ستيل للاستخدام الشخصي غير التجاري فقط. هذا الترخيص لا يشمل:",
        licenseRestriction1: "تعديل أو نسخ المواد",
        licenseRestriction2: "استخدام المواد لأغراض تجارية",
        licenseRestriction3: "محاولة عكس هندسة أي برنامج على موقع مياسه ستيل",
        licenseRestriction4: "إزالة أي حقوق نشر أو إشعارات الملكية",
        productInformation: "معلومات المنتجات",
        productInformationText: "نسعى جاهدين لضمان دقة جميع المعلومات المتعلقة بالمنتجات، بما في ذلك الأوصاف والأسعار والصور. ومع ذلك، لا نضمن أن المعلومات دقيقة أو كاملة أو محدثة.",
        pricingAndPayment: "الأسعار والدفع",
        pricingAndPaymentText: "جميع الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة. نحتفظ بالحق في تغيير الأسعار في أي وقت دون إشعار مسبق. يجب دفع جميع المبالغ بالكامل عند الطلب.",
        shippingAndDelivery: "الشحن والتوصيل",
        shippingAndDeliveryText: "نقوم بالتوصيل إلى جميع مدن المملكة العربية السعودية. وقت التوصيل المتوقع هو 3-5 أيام عمل. قد تتأخر أوقات التوصيل في المناسبات الخاصة أو الظروف الاستثنائية.",
        returnsAndRefunds: "الإرجاع والاسترداد",
        returnsAndRefundsText: "يمكن إرجاع المنتجات خلال 14 يوماً من تاريخ الاستلام بشرط أن تكون بحالة ممتازة وغير مستخدمة. سيتم خصم رسوم الشحن من مبلغ الاسترداد.",
        privacyAndData: "الخصوصية وحماية البيانات",
        privacyAndDataText: "نحن نلتزم بحماية خصوصيتك. يتم جمع واستخدام معلوماتك الشخصية وفقاً لسياسة الخصوصية الخاصة بنا. باستخدام موقعنا، فإنك توافق على جمع واستخدام هذه المعلومات.",
        intellectualProperty: "الملكية الفكرية",
        intellectualPropertyText: "جميع المحتويات الموجودة على موقع مياسه ستيل، بما في ذلك النصوص والصور والتصاميم، محمية بموجب قوانين حقوق النشر والملكية الفكرية.",
        limitationOfLiability: "حدود المسؤولية",
        limitationOfLiabilityText: "لن تكون مياسه ستيل مسؤولة عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو خاصة تنشأ عن استخدام موقعنا أو المنتجات.",
        governingLaw: "القانون المطبق",
        governingLawText: "تخضع هذه الشروط والأحكام لقوانين المملكة العربية السعودية. أي نزاعات تنشأ عن هذه الشروط ستخضع للاختصاص الحصري لمحاكم المملكة العربية السعودية.",
        changesToTerms: "تغييرات الشروط",
        changesToTermsText: "نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم نشر التغييرات على هذه الصفحة، وسيستمر استخدامك للموقع بعد التغييرات في التعديلات.",
        contactInformation: "معلومات التواصل",
        contactInformationText: "إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى التواصل معنا عبر:",
        contactAddress: "العنوان: جدة، المملكة العربية السعودية",
        privacyPolicy: "سياسة الخصوصية",
        privacyCommitment: "التزامنا بالخصوصية",
        privacyCommitmentText: "نحن في مياسه ستيل نلتزم بحماية خصوصيتك وبياناتك الشخصية. هذه السياسة توضح كيفية جمع واستخدام وحماية معلوماتك عند استخدام موقعنا الإلكتروني.",
        informationWeCollect: "المعلومات التي نجمعها",
        informationWeCollectText: "نقوم بجمع المعلومات التالية:",
        personalInfo: "المعلومات الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف)",
        shippingInfo: "معلومات الشحن والعنوان",
        paymentInfo: "معلومات الدفع (لا نخزن بيانات البطاقة)",
        orderHistory: "تاريخ الطلبات والمنتجات المشتراة",
        websiteUsage: "بيانات استخدام الموقع والتفاعل",
        howWeUseInfo: "كيفية استخدام المعلومات",
        howWeUseInfoText: "نستخدم معلوماتك للأغراض التالية:",
        usePurpose1: "معالجة الطلبات وإتمام المبيعات",
        usePurpose2: "التواصل معك بخصوص طلباتك",
        usePurpose3: "تحسين خدماتنا وتجربة المستخدم",
        usePurpose4: "إرسال عروض خاصة وتحديثات (بموافقتك)",
        usePurpose5: "الامتثال للقوانين واللوائح المعمول بها",
        informationSharing: "مشاركة المعلومات",
        informationSharingText: "لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:",
        sharingCase1: "مع شركات الشحن لتوصيل طلباتك",
        sharingCase2: "مع مزودي خدمات الدفع لمعالجة المدفوعات",
        sharingCase3: "عندما يقتضي القانون ذلك",
        sharingCase4: "بموافقتك الصريحة",
        dataSecurity: "أمان البيانات",
        dataSecurityText: "نتخذ إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو الاستخدام أو الكشف أو التعديل أو التدمير. نستخدم تقنيات التشفير والجدران النارية لحماية بياناتك.",
        cookies: "ملفات تعريف الارتباط (Cookies)",
        cookiesText: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. هذه الملفات تساعدنا في تذكر تفضيلاتك وتقديم محتوى مخصص. يمكنك إدارة إعدادات ملفات تعريف الارتباط في متصفحك.",
        yourRights: "حقوقك",
        yourRightsText: "لديك الحق في:",
        right1: "الوصول إلى معلوماتك الشخصية",
        right2: "تصحيح أي معلومات غير دقيقة",
        right3: "حذف معلوماتك الشخصية",
        right4: "الانسحاب من الرسائل التسويقية",
        right5: "تقديم شكوى إلى السلطات المختصة",
        dataRetention: "احتفاظ البيانات",
        dataRetentionText: "نحتفظ بمعلوماتك الشخصية طالما كانت ضرورية لتقديم خدماتنا أو للامتثال للالتزامات القانونية. عند عدم الحاجة إلى هذه المعلومات، نقوم بحذفها بشكل آمن.",
        childrenPrivacy: "خصوصية الأطفال",
        childrenPrivacyText: "لا نجمع عمداً معلومات شخصية من الأطفال دون سن 13 عاماً. إذا كنت أحد الوالدين أو الوصي وتعتقد أن طفلك قد زودنا بمعلومات شخصية، يرجى التواصل معنا فوراً.",
        internationalTransfers: "التحويلات الدولية",
        internationalTransfersText: "قد يتم نقل معلوماتك إلى دول أخرى لمعالجة الطلبات أو لتقديم الخدمات. نتأكد من أن هذه التحويلات تتم وفقاً للقوانين المعمول بها وبإجراءات أمنية مناسبة.",
        policyChanges: "تغييرات السياسة",
        policyChangesText: "قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار على موقعنا. يرجى مراجعة هذه السياسة بانتظام.",
        contactUs: "تواصل معنا",
        contactUsText: "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه أو ممارساتنا في التعامل مع البيانات، يرجى التواصل معنا عبر:"
    },
    en: {
        product1: "Classic Black Abaya",
        product2: "Abaya with Golden Embroidery",
        product3: "Modern Navy Abaya",
        product4: "Gray Abaya with Silver Details",
        new: "New",
        size: "Size",
        selectSize: "Select Size",
        addToCart: "Add to Cart",
        storeName: "Mayasah Style",
        home: "Home",
        products: "Products",
        cart: "Cart",
        contact: "Contact Us",
        aboutStore: "About the Store",
        aboutText: "Mayasah Style offers the latest abaya designs for distinguished ladies in Saudi Arabia. We provide high quality and elegant designs for all tastes.",
        quickLinks: "Quick Links",
        contactInfo: "Contact Information",
        contactLocation: "Jeddah, Saudi Arabia",
        copyright: "All rights reserved © 2023 Mayasah Style | Developed with love in Saudi Arabia",
        new: "New",
        discount15: "15% Off",
        discount10: "10% Off",
        emptyCart: "Your cart is empty",
        promoCode: "Enter promo code",
        checkout: "Checkout",
        remove: "Remove",
        sizeLabel: "Size",
        subtotal: "Subtotal",
        vat: "VAT",
        shipping: "Shipping",
        total: "Total",
        freeShipping: "Congratulations! Free shipping for this order!",
        addMoreForFreeShipping: "Add {amount} SAR more to get free shipping",
        checkoutSubtitle: "Complete your order by following these steps",
        shippingInfoDesc: "Enter your shipping information",
        orderNotes: "Order Notes",
        items: "Items",
        quantity: "Quantity",
        estimatedDelivery: "Estimated delivery within 3-5 business days",
        orderNote: "Order details and invoices will be sent to your email",
        selectCity: "Select City",
        congratulations: "Congratulations! Free shipping for this order!",
        orderSummary: "Order Summary",
        confirmOrder: "Confirm Order",
        contactPhone: "+966 50 123 4567",
        contactEmail: "mayasahstyle@gmail.com",
        instagram: "Instagram",
        twitter: "Twitter",
        snapchat: "Snapchat",
        tiktok: "TikTok",
        heroTitle: "Luxury Abayas with Modern Designs",
        heroDesc: "Shop the latest luxury abaya collections with high quality and designs for every taste. Fast delivery to all Saudi cities.",
        heroSubtitle: "Discover the latest abaya collections, carefully designed to suit your refined taste.",
        heroBtn: "Shop Now",
        browseCollection: "Browse Collection",
        whyChooseUs: "Why Choose Our Store",
        shippingInfo: "Shipping Information",
        fullName: "Full Name",
        email: "Email",
        phone: "Mobile Number",
        address: "Address",
        city: "City",
        zip: "Postal Code",
        paymentMethod: "Payment Method",
        apply: "Apply",
        orderConfirmed: "Your order has been confirmed!",
        thankYou: "Thank you for shopping at Mayasah Style. Your order has been received and will be prepared for shipping as soon as possible. You will receive an email with order details and tracking once your order is shipped.",
        orderNumber: "Order Number:",
        orderDate: "Order Date:",
        totalAmount: "Total Amount:",
        shippingAddress: "Shipping Address:",
        trackingNumber: "Tracking Number:",
        continueShopping: "Continue Shopping",
        whyUs: "Why Us?",
        featuredProducts: "Featured Products",
        feature1Title: "High Quality",
        feature1Desc: "We use the best fabrics and embroidery for guaranteed quality.",
        feature2Title: "Fast Delivery",
        feature2Desc: "Quick and safe shipping to all regions of Saudi Arabia.",
        feature3Title: "24/7 Customer Support",
        feature3Desc: "Our support team is always here for you.",
        useMyLocation: "Use My Location",
        detectingLocation: "Detecting location...",
        locationDetected: "Location detected successfully!",
        cityDetectedNoStreet: "City detected but street address not found. Please enter your street name manually.",
        locationAccessDenied: "Location access denied. Please allow location access or enter manually.",
        locationUnavailable: "Location information unavailable.",
        locationTimeout: "Location request timed out.",
        couldNotGetAddress: "Could not get address from coordinates.",
        errorGettingAddress: "Error getting address: ",
        emailInvoice: "Email Invoice",
        chatWithBot: "Chat with Smart Assistant",
        mayasahAssistant: "Mayasah Smart Assistant",
        online: "Online Now",
        welcomeMessage: "Hello! I'm the Mayasah Smart Assistant. How can I help you today?",
        askProducts: "Available Products",
        askShipping: "Shipping Information",
        // Payment translations
        paymentInfo: "Payment Information",
        paymentInfoDesc: "Choose your preferred payment method",
        madaCard: "Mada Card",
        madaDesc: "Mada credit card or Mada direct",
        visaCard: "Visa / Mastercard",
        visaDesc: "International Visa and Mastercard",
        applePay: "Apple Pay",
        applePayDesc: "Pay with Apple Pay",
        stcPay: "STC Pay",
        stcPayDesc: "Pay with STC Pay app",
        cashOnDelivery: "Cash on Delivery",
        codDesc: "Pay cash when you receive your order",
        cardNumber: "Card Number",
        cardHolder: "Cardholder Name",
        expiryDate: "Expiry Date",
        cvv: "CVV",
        paymentSecurity: "All payments are protected and encrypted. We will not share your data with any third party.",
        payNow: "Pay Now",
        transactionId: "Transaction ID",
        askSizes: "Available Sizes",
        askContact: "Direct Contact",
        typeMessage: "Type your message here...",
        sendMessage: "Send us a Message",
        subject: "Subject",
        selectSubject: "Select Subject",
        generalInquiry: "General Inquiry",
        orderInquiry: "Order Inquiry",
        productInquiry: "Product Inquiry",
        complaint: "Complaint",
        suggestion: "Suggestion",
        typeYourMessage: "Type your message here...",
        contactWhatsapp: "Contact via WhatsApp",
        workingHours: "Working Hours",
        message: "Message",
        workingHoursText: "9am - 10pm",
        name: "Name",
        phoneOptional: "Phone Number (optional)",
        aboutUs: "About Us",
        aboutUsTitle: "Mayasah Style - A Journey of Elegance and Excellence",
        aboutUsIntro: "Welcome to Mayasah Style, your perfect destination for the latest and most beautiful women's abaya collections. We are a specialized store offering the best types of abayas that combine modern elegance with traditional authenticity.",
        aboutUsMission: "Since our establishment, our primary goal has been to provide unique pieces that reflect the beauty and elegance of Arab women. We carefully select every piece in our collection to ensure high quality and distinguished design.",
        aboutUsCollection: "We are proud to offer a wide range of abayas suitable for all occasions, from simple daily abayas to luxurious embroidered pieces for special occasions.",
        highQuality: "High Quality",
        highQualityDesc: "We select the best materials and fabrics to ensure comfort and elegance",
        passionForExcellence: "Passion for Excellence",
        passionForExcellenceDesc: "We work with passion to provide the best shopping experience for our valued customers",
        customerService: "Customer Service",
        customerServiceDesc: "A specialized support team always available to serve and assist you",
        ourMission: "Our Mission",
        missionStatement: "We strive to be the first choice for Arab women in the world of fashion, by providing abayas that combine elegance, quality, and comfort, while preserving authentic values and looking towards the future",
        termsConditions: "Terms & Conditions",
        lastUpdated: "Last Updated: January 2025",
        termsAcceptance: "Acceptance of Terms",
        termsAcceptanceText: "By using the Mayasah Style website, you agree to comply with these Terms and Conditions. If you do not agree to any part of these terms, please do not use our website.",
        useLicense: "Use License",
        useLicenseText: "A temporary license is granted to access materials on the Mayasah Style website for personal, non-commercial use only. This license does not include:",
        licenseRestriction1: "Modifying or copying materials",
        licenseRestriction2: "Using materials for commercial purposes",
        licenseRestriction3: "Attempting to reverse engineer any software on the Mayasah Style website",
        licenseRestriction4: "Removing any copyright or proprietary notices",
        productInformation: "Product Information",
        productInformationText: "We strive to ensure the accuracy of all product information, including descriptions, prices, and images. However, we do not guarantee that the information is accurate, complete, or up-to-date.",
        pricingAndPayment: "Pricing and Payment",
        pricingAndPaymentText: "All prices are in Saudi Riyals and include VAT. We reserve the right to change prices at any time without prior notice. All amounts must be paid in full at the time of order.",
        shippingAndDelivery: "Shipping and Delivery",
        shippingAndDeliveryText: "We deliver to all cities in Saudi Arabia. Expected delivery time is 3-5 business days. Delivery times may be delayed during special occasions or exceptional circumstances.",
        returnsAndRefunds: "Returns and Refunds",
        returnsAndRefundsText: "Products can be returned within 14 days of receipt, provided they are in excellent condition and unused. Shipping fees will be deducted from the refund amount.",
        privacyAndData: "Privacy and Data Protection",
        privacyAndDataText: "We are committed to protecting your privacy. Your personal information is collected and used in accordance with our Privacy Policy. By using our website, you agree to the collection and use of this information.",
        intellectualProperty: "Intellectual Property",
        intellectualPropertyText: "All content on the Mayasah Style website, including texts, images, and designs, is protected by copyright and intellectual property laws.",
        limitationOfLiability: "Limitation of Liability",
        limitationOfLiabilityText: "Mayasah Style will not be liable for any direct, indirect, incidental, or special damages arising from the use of our website or products.",
        governingLaw: "Governing Law",
        governingLawText: "These Terms and Conditions are governed by the laws of Saudi Arabia. Any disputes arising from these terms will be subject to the exclusive jurisdiction of Saudi Arabian courts.",
        changesToTerms: "Changes to Terms",
        changesToTermsText: "We reserve the right to modify these Terms and Conditions at any time. Changes will be posted on this page, and your continued use of the website after changes constitutes acceptance of the modifications.",
        contactInformation: "Contact Information",
        contactInformationText: "If you have any questions about these Terms and Conditions, please contact us via:",
        contactAddress: "Address: Jeddah, Saudi Arabia",
        privacyPolicy: "Privacy Policy",
        privacyCommitment: "Our Privacy Commitment",
        privacyCommitmentText: "At Mayasah Style, we are committed to protecting your privacy and personal data. This policy explains how we collect, use, and protect your information when you use our website.",
        informationWeCollect: "Information We Collect",
        informationWeCollectText: "We collect the following information:",
        personalInfo: "Personal information (name, email, phone number)",
        shippingInfo: "Shipping and address information",
        paymentInfo: "Payment information (we do not store card data)",
        orderHistory: "Order history and purchased products",
        websiteUsage: "Website usage and interaction data",
        howWeUseInfo: "How We Use Information",
        howWeUseInfoText: "We use your information for the following purposes:",
        usePurpose1: "Processing orders and completing sales",
        usePurpose2: "Communicating with you about your orders",
        usePurpose3: "Improving our services and user experience",
        usePurpose4: "Sending special offers and updates (with your consent)",
        usePurpose5: "Complying with applicable laws and regulations",
        informationSharing: "Information Sharing",
        informationSharingText: "We do not sell, rent, or share your personal information with third parties except in the following cases:",
        sharingCase1: "With shipping companies to deliver your orders",
        sharingCase2: "With payment service providers to process payments",
        sharingCase3: "When required by law",
        sharingCase4: "With your explicit consent",
        dataSecurity: "Data Security",
        dataSecurityText: "We take appropriate security measures to protect your personal information from unauthorized access, use, disclosure, alteration, or destruction. We use encryption and firewall technologies to protect your data.",
        cookies: "Cookies",
        cookiesText: "We use cookies to improve your experience on our website. These files help us remember your preferences and provide personalized content. You can manage cookie settings in your browser.",
        yourRights: "Your Rights",
        yourRightsText: "You have the right to:",
        right1: "Access your personal information",
        right2: "Correct any inaccurate information",
        right3: "Delete your personal information",
        right4: "Withdraw from marketing communications",
        right5: "File a complaint with relevant authorities",
        dataRetention: "Data Retention",
        dataRetentionText: "We retain your personal information as long as necessary to provide our services or comply with legal obligations. When this information is no longer needed, we securely delete it.",
        childrenPrivacy: "Children's Privacy",
        childrenPrivacyText: "We do not knowingly collect personal information from children under 13 years of age. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.",
        internationalTransfers: "International Transfers",
        internationalTransfersText: "Your information may be transferred to other countries for order processing or service provision. We ensure these transfers comply with applicable laws and appropriate security measures.",
        policyChanges: "Policy Changes",
        policyChangesText: "We may update this policy from time to time. We will notify you of any material changes via email or through a notice on our website. Please review this policy regularly.",
        contactUs: "Contact Us",
        contactUsText: "If you have any questions about this Privacy Policy or our data handling practices, please contact us via:"
    }
};

// Make translations available globally for updateProductDetailContent
window.translations = translations;

// --- Inject language buttons if missing ---
function ensureLanguageButtons() {
    document.querySelectorAll('.lang-switcher').forEach(switcher => {
        if (!switcher.querySelector('.lang-btn')) {
            switcher.innerHTML = `
                <button class="lang-btn" data-lang="ar">العربية</button>
                <button class="lang-btn" data-lang="en">English</button>
            `;
        }
    });
}

function updateLangToggleActive(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
}

function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    // Persist language under a few keys for backward compatibility across pages
    try {
        localStorage.setItem('language', lang);
        localStorage.setItem('siteLang', lang);
        localStorage.setItem('mayasah_language', lang);
    } catch (e) {
        // ignore storage errors
    }
    translatePage(lang);
    updateLangToggleActive(lang);
    updateAllProductPrices();
    populateProductCards(); // <-- ensure product cards update on language switch
    if (typeof renderCartItems === 'function') renderCartItems();
    if (typeof updateCartSummary === 'function') updateCartSummary();
    if (typeof updateCheckoutSummary === 'function') updateCheckoutSummary();
    if (typeof updateProductDetailContent === 'function') updateProductDetailContent();
    
    // Dispatch languageChanged event for other pages to listen to
    const languageChangedEvent = new CustomEvent('languageChanged', { detail: { language: lang } });
    document.dispatchEvent(languageChangedEvent);
}

function setupLanguageButtons() {
    ensureLanguageButtons();
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = function() {
            setLanguage(btn.getAttribute('data-lang'));
        };
    });
    // Set initial language: check all known storage keys for compatibility
    const lang = localStorage.getItem('language') || localStorage.getItem('siteLang') || localStorage.getItem('mayasah_language') || document.documentElement.lang || 'ar';
    setLanguage(lang);
}

// --- Product Detail Loader ---

// --- Product Detail Page Logic ---

// Add to Cart handler for product detail page
function addToCartFromDetail() {
    // Get product id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    let product = null;
    if (!isNaN(id)) {
        product = productsData.find(p => p.id === id);
    }
    if (!product) {
        product = productsData[0]; // fallback to first product
    }
    // Get selected size
    const sizeSelect = document.getElementById('size') || document.querySelector('.size-select');
    const selectedSize = sizeSelect ? sizeSelect.value : '';
    // Prevent adding to cart if no size is selected or default option is picked
    if (!selectedSize || selectedSize === '' || selectedSize === 'select' || selectedSize === 'اختر المقاس' || selectedSize === 'Select Size') {
        showNotification(document.documentElement.lang === 'ar' ? 'يرجى اختيار المقاس أولاً' : 'Please select a size first');
        if (sizeSelect) sizeSelect.focus();
        return;
    }
    showLoadingOverlay();
    setTimeout(() => {
        // Default quantity is 1
        const quantity = 1;
        // Prepare cart item
        const cartItem = {
            id: product.id,
            key: product.key,
            name: product.key, // will be translated in cart
            image: product.images[0], // Use first image from images array
            price: product.price,
            size: selectedSize,
            quantity: quantity
        };
        // Get cart from localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        // Check if same product with same size already in cart
        const existingIdx = cart.findIndex(item => item.id === cartItem.id && item.size === cartItem.size);
        if (existingIdx !== -1) {
            cart[existingIdx].quantity += 1;
        } else {
            cart.push(cartItem);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        hideLoadingOverlay();
        showNotification(document.documentElement.lang === 'ar' ? 'تمت إضافة المنتج إلى السلة' : 'Product added to cart');
        
        // Track add to cart event if analytics consent given
        if (window.pdplCookieManager && window.pdplCookieManager.hasConsent('analytics')) {
            if (window.trackAddToCart) {
                window.trackAddToCart(product.id, product.key, product.price, quantity);
            }
            if (window.trackFacebookAddToCart) {
                window.trackFacebookAddToCart(product.id, product.key, product.price, quantity);
            }
        }
    }, 600); // Simulate loading for 600ms
}
function updateProductDetailContent(retry) {
    // Only attempt to run this updater on the product detail page.
    // This prevents the function from repeatedly retrying on other pages
    // (which was causing many console warnings like "No .product-detail-info found, retry: N").
    if (!window.location.pathname.endsWith('product-detail.html') && !document.body.classList.contains('product-detail-page')) {
        // Early exit when not on product detail to avoid noisy retries.
        return;
    }
    console.log('updateProductDetailContent called', { retry });
    // Helper: show error on page
    function showDetailError(msg) {
        console.error('Product Detail Error:', msg);
        let err = document.getElementById('product-detail-error');
        if (!err) {
            err = document.createElement('div');
            err.id = 'product-detail-error';
            err.style.position = 'fixed';
            err.style.top = '10px';
            err.style.left = '50%';
            err.style.transform = 'translateX(-50%)';
            err.style.background = '#c00';
            err.style.color = '#fff';
            err.style.padding = '10px 20px';
            err.style.zIndex = 99999;
            err.style.fontSize = '1.2em';
            err.style.borderRadius = '6px';
            document.body.appendChild(err);
        }
        err.textContent = 'Product Detail Error: ' + msg;
        setTimeout(() => { if (err) err.remove(); }, 6000);
    }
    // Only run on product detail page
    const info = document.querySelector('.product-detail-info');
    if (!info) {
        // If still on the product-detail page, allow a few retries while the DOM finishes
        // loading or other scripts insert the target element. Use a small number of retries
        // and a slightly larger delay to avoid flooding the console.
        console.warn('No .product-detail-info found, retry:', retry);
        const count = typeof retry === 'number' ? retry : 0;
        if (count < 8) {
            setTimeout(() => updateProductDetailContent(count + 1), 150);
        } else {
            // Give up after a few attempts to be friendly to console logs.
            console.error('updateProductDetailContent: giving up after multiple retries.');
        }
        return;
    }
    // Defensive: ensure productsData and translations are loaded
    if (!window.productsData || !Array.isArray(productsData) || productsData.length === 0) {
        console.warn('productsData not loaded or empty');
        return;
    }
    if (!window.translations) {
        console.warn('translations not loaded');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    console.log('Parsed product id:', id);
    let product = null;
    if (!isNaN(id)) {
        product = productsData.find(p => p.id === id);
    }
    if (!product) {
        showDetailError('No product found for id=' + id + '. Showing default product.');
        product = productsData[0];
    }
    console.log('Product to display:', product);
    const lang = document.documentElement.lang || 'ar';
    const langObj = translations[lang] || translations['ar'];

    // Set image
    const img = document.getElementById('product-image') || document.querySelector('.product-image img');
    if (img) {
        img.src = product.images[0]; // Use first image from images array
        img.alt = langObj[product.key] || product.key || '';
        img.style.display = '';
    } else {
        showDetailError('Missing #product-image or .product-image img');
    }

    // Set product title safely
    const title = document.getElementById('product-title') || document.querySelector('.product-title');
    if (title) {
        title.textContent = langObj[product.key] || '';
        setGoldenEmbroideryTitleClass(product, lang, title);
    } else {
        showDetailError('Missing .product-title or #product-title');
    }
// Helper to set targeted class for golden embroidery product title
function setGoldenEmbroideryTitleClass(product, lang, titleEl) {
    if (!titleEl || !product) return;
    if (lang === 'en' && product.key === 'product2') {
        titleEl.classList.add('product-title-golden-embroidery-en');
    } else {
        titleEl.classList.remove('product-title-golden-embroidery-en');
    }
}
    // Ensure targeted product title class is updated after language switch
    const urlParams_gp = new URLSearchParams(window.location.search);
    const id_gp = parseInt(urlParams_gp.get('id'));
    const product_gp = window.productsData ? window.productsData.find(p => p.id === id_gp) : null;
    const titleEl_gp = document.getElementById('product-title');
    setGoldenEmbroideryTitleClass(product_gp, lang, titleEl_gp);

    // Set description
    const desc = document.getElementById('product-description') || document.querySelector('.product-description');
    if (desc) {
        desc.textContent = lang === 'ar' ? product.desc_ar : product.desc_en;
    } else {
        showDetailError('Missing #product-description or .product-description');
    }

    // Set prices and currency
    const currentPrice = document.querySelector('.current-price') || document.getElementById('current-price');
    if (currentPrice) {
        currentPrice.innerHTML = product.price.toFixed(2) + getCurrencyHTML();
        currentPrice.setAttribute('data-price', product.price);
        currentPrice.style.display = '';
    } else {
        showDetailError('Missing .current-price or #current-price');
    }

    // Try both id and class for original price
    let originalPrice = document.getElementById('original-price') || document.querySelector('.original-price');
    if (originalPrice) {
        if (product.original && product.original > product.price) {
            originalPrice.innerHTML = product.original.toFixed(2) + getCurrencyHTML();
            originalPrice.style.display = '';
            originalPrice.setAttribute('data-price', product.original);
        } else {
            originalPrice.style.display = 'none';
        }
    } // original price is optional

    // Set discount badge
    const discountBadge = document.getElementById('discount-badge') || document.querySelector('.discount');
    if (discountBadge) {
        if (product.discount) {
            // If discount is a translation key (like "new"), use translation
            const lang = document.documentElement.lang || 'ar';
            const langObj = translations[lang] || translations['ar'];
            if (langObj[product.discount]) {
                discountBadge.textContent = langObj[product.discount];
            } else {
                discountBadge.textContent = product.discount;
            }
            discountBadge.style.display = '';
        } else {
            discountBadge.style.display = 'none';
        }
    } // discount badge is optional

    // Ensure size label, select option, and add-to-cart button are translated and visible
    const sizeLabel = document.querySelector('label[for="size"][data-translate="size"]') || document.querySelector('label[for="size"]');
    if (sizeLabel && langObj['size']) {
        sizeLabel.textContent = langObj['size'];
    } else if (!sizeLabel) {
        showDetailError('Missing label[for="size"]');
    }
    const sizeSelect = document.getElementById('size') || document.querySelector('.size-select');
    if (sizeSelect) {
        const selectOption = sizeSelect.querySelector('option[data-translate="selectSize"]') || sizeSelect.querySelector('option');
        if (selectOption && langObj['selectSize']) {
            selectOption.textContent = langObj['selectSize'];
        }
        sizeSelect.style.display = '';
    } else {
        showDetailError('Missing #size or .size-select');
    }
    let addToCartBtn = document.querySelector('.add-to-cart.full-width-btn') || document.querySelector('.add-to-cart');
    if (addToCartBtn) {
        const addToCartText = addToCartBtn.querySelector('.add-to-cart-text[data-translate="addToCart"]') || addToCartBtn.querySelector('.add-to-cart-text') || addToCartBtn;
        if (addToCartText && langObj['addToCart']) {
            addToCartText.textContent = langObj['addToCart'];
        }
        addToCartBtn.style.display = '';
        // Attach Add to Cart handler
        addToCartBtn.onclick = addToCartFromDetail;
    } else {
        showDetailError('Missing .add-to-cart button');
    }
    // Defensive: always show info section
    if (info) info.style.display = '';
}

// --- Populate Product Cards ---
function populateProductCards() {
    // For each product card, always update the image, info, and prices
    document.querySelectorAll('.product-card').forEach((card, idx) => {
        // Get product id from link or fallback to index
        let id = idx + 1;
        const link = card.querySelector('a.product-link');
        if (link) {
            const url = new URL(link.href, window.location.origin);
            const paramId = url.searchParams.get('id');
            if (paramId) id = parseInt(paramId);
        }
        const product = productsData.find(p => p.id === id);
        if (!product) return;
        // Always fill image
        const imgDiv = card.querySelector('.product-image');
        if (imgDiv) {
            imgDiv.innerHTML = `<img src="${product.image}" alt="">`;
        }
        // Always fill info (add name/desc)
        const infoDiv = card.querySelector('.product-info');
        if (infoDiv) {
            const lang = document.documentElement.lang || 'ar';
            const name = (product.key && translations[lang] && translations[lang][product.key]) ? translations[lang][product.key] : (lang === 'ar' ? product.desc_ar : product.desc_en);
            infoDiv.innerHTML = `<span>${name || product.key || ''}</span>`;
        }
        // Always fill price spans
        const currentPrice = card.querySelector('.current-price');
        if (currentPrice) {
            currentPrice.innerHTML = product.price.toFixed(2) + getCurrencyHTML();
            currentPrice.setAttribute('data-price', product.price);
            currentPrice.style.display = '';
        }
        const originalPrice = card.querySelector('.original-price');
        if (originalPrice) {
            if (product.original && product.original > product.price) {
                originalPrice.innerHTML = product.original.toFixed(2) + getCurrencyHTML();
                originalPrice.setAttribute('data-price', product.original);
                originalPrice.style.display = '';
            } else {
                originalPrice.style.display = 'none';
            }
        }
        const discount = card.querySelector('.discount');
        if (discount) {
            if (product.discount) {
                discount.textContent = product.discount;
                discount.style.display = '';
            } else {
                discount.style.display = 'none';
            }
        }
    });
}

// --- On DOMContentLoaded, initialize everything ---

function fullAppInit() {
    // Inject language buttons if missing and set up event handlers
    ensureLanguageButtons();
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = function() {
            setLanguage(btn.getAttribute('data-lang'));
        };
    });
    // Set initial language from localStorage or default
    const lang = localStorage.getItem('language') || document.documentElement.lang || 'ar';
    setLanguage(lang);
    
    // Robust loader for product detail page
    document.addEventListener('DOMContentLoaded', function() {
        // Only run on product-detail.html
        if (window.location.pathname.endsWith('product-detail.html')) {
            // Wait until productsData and translations are loaded
            function tryLoadDetail(retry) {
                if (window.productsData && Array.isArray(productsData) && productsData.length > 0 && window.translations) {
                    updateProductDetailContent();
                } else if ((retry || 0) < 20) {
                    setTimeout(() => tryLoadDetail((retry || 0) + 1), 100);
                } else {
                    // Show error if data never loads
                    if (typeof showDetailError === 'function') {
                        showDetailError('productsData or translations not loaded after waiting.');
                    } else {
                        alert('productsData or translations not loaded.');
                    }
                }
            }
            tryLoadDetail(0);
        }
    });
}

document.addEventListener('DOMContentLoaded', fullAppInit);


// --- Cart Count Updater ---
function updateCartCount() {
    // Defensive: only update if cart icon exists
    const cartCount = document.querySelector('.cart-count');
    if (!cartCount) return;
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartCount.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

// --- Loading overlay functions ---
function showLoadingOverlay() {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(255,255,255,0.7)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = 9999;
        overlay.innerHTML = '<div class="spinner" style="border:6px solid #f3f3f3;border-top:6px solid var(--deep-rose);border-radius:50%;width:48px;height:48px;animation:spin 1s linear infinite;"></div>';
        document.body.appendChild(overlay);
        const style = document.createElement('style');
        style.textContent = '@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}';
        document.head.appendChild(style);
    } else {
        overlay.style.display = 'flex';
    }
}
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = 'var(--deep-rose)';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    notification.style.transition = 'all 0.3s ease';
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

updateCartCount();

const vatRate = 0.15;
const freeShippingThreshold = 300;
const promoCodes = {
    'WELCOME10': 0.10,
    'SAVE15': 0.15,
    'FREESHIP': 'freeship'
};
const saudiCitiesAr = [
    "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
    "الطائف", "تبوك", "بريدة", "خميس مشيط", "الهفوف",
    "حفر الباطن", "الجبيل", "الظهران", "أبها", "نجران"
];
const saudiCitiesEn = [
    "Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam",
    "Taif", "Tabuk", "Buraidah", "Khamis Mushait", "Hofuf",
    "Hafar Al-Batin", "Jubail", "Dhahran", "Abha", "Najran"
];

function renderCartItems() {
    cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartContainer = document.querySelector('.cart-items');
    if (!cartContainer) return;
    cartContainer.innerHTML = '';

    if (!cartItems.length) {
        cartContainer.innerHTML = `<p data-translate="emptyCart">${translations[document.documentElement.lang].emptyCart}</p>`;
        updateCheckoutButton();
        return;
    }

    cartItems.forEach((item, idx) => {
        if (typeof item.price !== 'number' || isNaN(item.price)) return;
        const removeText = document.documentElement.lang === 'ar' ? 'إزالة' : 'Remove';
        // --- Use translated name for cart item ---
        const lang = document.documentElement.lang || 'ar';
        const productData = productsData.find(p => p.id === item.id);
        // Always use translation key if present, fallback to item.name
        const name = (item.key && translations[lang][item.key])
            ? translations[lang][item.key]
            : (productData && productData.key && translations[lang][productData.key])
                ? translations[lang][productData.key]
                : (item.name || (lang === 'ar' ? (productData && productData.name_ar) : (productData && productData.name_en)) || '');
        // --- Add size dropdown ---
        const sizes = ['S','M','L','XL'];
        const sizeOptions = sizes.map(sz => `<option value="${sz}"${item.size===sz?' selected':''}>${sz}</option>`).join('');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        // Ensure image path is correct
        const imagePath = item.image || (productsData.find(p => p.id === item.id)?.images?.[0]) || 'images/abaya1.jpg';
        
        itemDiv.innerHTML = `
            <button class="remove-item-btn" data-idx="${idx}">&#10006;</button>
            <div class="cart-item-image">
                <img src="${imagePath}" alt="${name}" onerror="this.src='images/abaya1.jpg'">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-title">${name}</h4>
                <div class="cart-item-info">
                    <div class="cart-item-price">
                        <span class="price-label">${document.documentElement.lang === 'en' ? 'Price' : 'السعر'}:</span>
                        <span class="price-value">${item.price.toFixed(2)}${getCurrencyHTML()}</span>
                    </div>
                    <div class="cart-item-size">
                        <span class="size-label">${document.documentElement.lang === 'en' ? 'Size' : 'المقاس'}:</span>
                        <select class="cart-size-select" data-idx="${idx}">${sizeOptions}</select>
                    </div>
                    <div class="cart-item-quantity">
                        <span class="quantity-label">${document.documentElement.lang === 'en' ? 'Quantity' : 'الكمية'}:</span>
                        <div class="quantity-controls">
                            <button class="qty-btn decrease" data-idx="${idx}">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="qty-btn increase" data-idx="${idx}">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        cartContainer.appendChild(itemDiv);
    });

    cartContainer.querySelectorAll('.qty-btn.increase').forEach(btn => {
        btn.addEventListener('click', function() {
            cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            const idx = parseInt(this.dataset.idx);
            cartItems[idx].quantity++;
            localStorage.setItem('cart', JSON.stringify(cartItems));
            renderCartItems();
            updateCartSummary();
            updateCartCount();
        });
    });
    cartContainer.querySelectorAll('.qty-btn.decrease').forEach(btn => {
        btn.addEventListener('click', function() {
            cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            const idx = parseInt(this.dataset.idx);
            if (cartItems[idx].quantity > 1) {
                cartItems[idx].quantity--;
            } else {
                cartItems.splice(idx, 1);
            }
            localStorage.setItem('cart', JSON.stringify(cartItems));
            renderCartItems();
            updateCartSummary();
            updateCartCount();
        });
    });
    cartContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            const idx = parseInt(this.dataset.idx);
            cartItems.splice(idx, 1);
            localStorage.setItem('cart', JSON.stringify(cartItems));
            renderCartItems();
            updateCartSummary();
            updateCartCount();
        });
    });
    // --- Handle size change in cart ---
    cartContainer.querySelectorAll('.cart-size-select').forEach(sel => {
        sel.addEventListener('change', function() {
            cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            const idx = parseInt(this.dataset.idx);
            cartItems[idx].size = this.value;
            localStorage.setItem('cart', JSON.stringify(cartItems));
            renderCartItems();
            updateCartSummary();
            updateCartCount();
        });
    });
    updateCheckoutButton();
}

function updateCartSummary() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * vatRate;
    const shipping = cartItems.length === 0 ? 0 : (subtotal >= freeShippingThreshold ? 0 : 20);

    const promoCodeInput = document.querySelector('#promo-code');
    let promoCode = promoCodeInput ? promoCodeInput.value.trim().toUpperCase() : '';
    let promoDiscount = 0;
    let promoShippingDiscount = false;

    if (promoCode && promoCodes[promoCode]) {
        if (typeof promoCodes[promoCode] === 'number') {
            promoDiscount = subtotal * promoCodes[promoCode];
        } else if (promoCodes[promoCode] === 'freeship') {
            promoShippingDiscount = true;
        }
    }

    const total = subtotal + vat + (promoShippingDiscount ? 0 : shipping) - promoDiscount;

    // --- FIX: Only update if element exists ---
    const subtotalEl = document.querySelector('.subtotal-amount');
    if (subtotalEl) subtotalEl.innerHTML = subtotal.toFixed(2) + getCurrencyHTML();

    const vatEl = document.querySelector('.vat-amount');
    if (vatEl) vatEl.innerHTML = vat.toFixed(2) + getCurrencyHTML();

    const shippingEl = document.querySelector('.shipping-amount');
    if (shippingEl) shippingEl.innerHTML = (promoShippingDiscount ? 0 : shipping).toFixed(2) + getCurrencyHTML();

    const totalEl = document.querySelector('.total-amount');
    if (totalEl) totalEl.innerHTML = total.toFixed(2) + getCurrencyHTML();

    const freeShippingMsg = document.querySelector('.free-shipping-msg');
    if (freeShippingMsg) {
        if (shipping === 0 || promoShippingDiscount) {
            freeShippingMsg.textContent = document.documentElement.lang === 'en' 
                ? 'Congratulations! Free shipping for this order!' 
                : '!مبروك! الشحن مجاني لهذا الطلب';
            freeShippingMsg.style.color = '#28a745';
        } else {
            const needed = freeShippingThreshold - subtotal;
            if (needed > 0) {
                if (document.documentElement.lang === 'en') {
                    freeShippingMsg.textContent = `Add ${needed.toFixed(2)} SAR more to get free shipping`;
                } else {
                    freeShippingMsg.innerHTML = `أضف منتجات بقيمة ${needed.toFixed(2)}${getCurrencyHTML()} أخرى لتحصل على شحن مجاني`;
                }
                freeShippingMsg.style.color = 'var(--muted-red)';
            }
        }
    }

    localStorage.setItem('shippingCost', (promoShippingDiscount ? 0 : shipping).toFixed(2));
}

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    renderCartItems();
    updateCartSummary();
    updateCartCount();
}

function updateCheckoutButton() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        if (cartItems.length === 0) {
            checkoutBtn.classList.add('disabled');
            checkoutBtn.setAttribute('aria-disabled', 'true');
            checkoutBtn.onclick = function(e) {
                e.preventDefault();
                showNotification(document.documentElement.lang === 'en'
                    ? 'Your cart is empty, add products first'
                    : 'سلة التسوق فارغة، أضف منتجات أولاً');
            };
        } else {
            checkoutBtn.classList.remove('disabled');
            checkoutBtn.removeAttribute('aria-disabled');
            checkoutBtn.onclick = null;
        }
    }
}

function updateCheckoutSummary() {
    const lang = document.documentElement.lang;
    const items = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = +(subtotal * 0.15).toFixed(2);
    const shipping = parseFloat(localStorage.getItem('shippingCost')) || 0;
    const total = +(subtotal + vat + shipping).toFixed(2);
    const currency = getCurrency();

    const subtotalEl = document.querySelector('.subtotal-amount');
    if (subtotalEl) subtotalEl.innerHTML = subtotal.toFixed(2) + getCurrencyHTML();
    const vatEl = document.querySelector('.vat-amount');
    if (vatEl) vatEl.innerHTML = vat.toFixed(2) + getCurrencyHTML();
    const shippingEl = document.querySelector('.shipping-amount');
    if (shippingEl) shippingEl.innerHTML = shipping.toFixed(2) + getCurrencyHTML();
    const totalEl = document.querySelector('.total-amount');
    if (totalEl) totalEl.innerHTML = total.toFixed(2) + getCurrencyHTML();
}

function populateCities(lang) {
    const citySelect = document.getElementById('city');
    if (!citySelect) return;
    citySelect.innerHTML = '<option value="">' + (lang === 'en' ? 'Select City' : 'اختر المدينة') + '</option>';
    const cities = lang === 'en' ? saudiCitiesEn : saudiCitiesAr;
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

function getCurrency() {
    return document.documentElement.lang === 'en' ? 'SAR' : '﷼';
}

function getCurrencyHTML() {
    if (document.documentElement.lang === 'ar') {
        // Use new Saudi Riyal symbol (ر.س)
        return ' <span style="font-family: Arial, sans-serif; font-size: 1.2em; vertical-align: middle;">ر.س</span>';
    } else {
        return ' SAR';
    }
}

function updateAllProductPrices() {
    document.querySelectorAll('.current-price').forEach(el => {
        const price = parseFloat(el.getAttribute('data-price'));
        if (!isNaN(price)) {
            el.innerHTML = price.toFixed(2) + getCurrencyHTML();
        }
    });
    document.querySelectorAll('.original-price').forEach(el => {
        const price = parseFloat(el.getAttribute('data-price'));
        if (!isNaN(price)) {
            el.innerHTML = price.toFixed(2) + getCurrencyHTML();
        }
    });
}

// CSS Styles for cart item layout
const style = document.createElement('style');
style.textContent = `
.cart-item {
    position: relative;
    padding-top: 32px;
}
.remove-item-btn {
    z-index: 2;
}
`;
document.head.appendChild(style);

// Reminder: For cart icon, ensure this is in your <head>:
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
// And you have internet connection, or use a local copy for offline use.

// Expose required variables and functions globally for checkout.js
window.saudiCitiesAr = saudiCitiesAr;
window.saudiCitiesEn = saudiCitiesEn;
window.getCurrencyHTML = getCurrencyHTML;
window.populateCities = populateCities;

// End of file