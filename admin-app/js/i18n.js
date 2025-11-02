'use strict';

(function () {
    const STORAGE_KEY = 'mayasah_admin_lang';
    const SUPPORTED_LANGS = ['ar', 'en'];

    const translations = {
        ar: {
            pageTitle: 'لوحة التحكم - مياسه ستايل',
            headerBrand: 'مياسة برو',
            headerLogout: 'تسجيل الخروج',
            headerGreetingFallback: 'مدير',
            languageToggleToEnglish: 'English',
            languageToggleToArabic: 'العربية',
            languageToggleAriaEnglish: 'التبديل إلى اللغة الإنجليزية',
            languageToggleAriaArabic: 'التبديل إلى اللغة العربية',
            productsTitle: 'إدارة المنتجات',
            addProduct: 'إضافة منتج',
            searchPlaceholder: 'ابحث عن منتج بالاسم أو SKU',
            category_all: 'الكل',
            category_black: 'سوداء',
            category_color: 'ملونة',
            category_embroidery: 'مطرزة',
            category_modern: 'عصرية',
            emptyTitle: 'لا توجد منتجات بعد',
            emptySubtitle: 'ابدأ بإضافة منتجاتك الأولى لتظهر في متجرك.',
            emptyAdd: 'إضافة منتج جديد',
            ordersTitle: 'الطلبات',
            ordersEmptyTitle: 'متابعة الطلبات قيد التطوير',
            ordersEmptySubtitle: 'سنضيف لوحة تفصيلية للطلبات قريباً. يمكنك ربط مجموعة بيانات الطلبات عبر Appwrite واستعراضها هنا.',
            statsTitle: 'نظرة عامة',
            statsSales: 'إجمالي المبيعات (الشهر)',
            statsActive: 'المنتجات النشطة',
            statsLow: 'مخزون منخفض',
            statsSalesValue: '{value} ر.س',
            productsCurrencySuffix: 'ر.س',
            settingsTitle: 'التخصيص',
            settingsCardTitle: 'ألوان الواجهة',
            settingsPrimary: 'اللون الرئيسي',
            settingsSecondary: 'اللون الثانوي',
            settingsReset: 'إعادة الضبط',
            nav_products: 'المنتجات',
            nav_orders: 'الطلبات',
            nav_stats: 'الإحصائيات',
            nav_settings: 'الإعدادات',
            editorAddTitle: 'إضافة منتج جديد',
            editorEditTitle: 'تعديل المنتج',
            editorImageLabel: 'صورة المنتج',
            editorNoImage: 'لم يتم اختيار صورة',
            editorNameAr: 'اسم المنتج (عربي)',
            editorNameEn: 'اسم المنتج (English)',
            editorSku: 'رمز المنتج (SKU)',
            editorPrice: 'السعر',
            editorDiscount: 'نسبة الخصم %',
            editorCurrentStock: 'المخزون الحالي',
            editorInitialStock: 'المخزون الابتدائي',
            editorCategory: 'التصنيف',
            editorBadge: 'الشارة',
            editorBadgePlaceholder: 'مثال: new',
            editorDescriptionAr: 'الوصف (عربي)',
            editorDescriptionEn: 'الوصف (English)',
            editorCancel: 'إلغاء',
            editorSave: 'حفظ',
            categoryOption_black: 'سوداء',
            categoryOption_color: 'ملونة',
            categoryOption_embroidery: 'مطرزة',
            categoryOption_modern: 'عصرية',
            productCardNoName: 'منتج بدون اسم',
            productCardStock: 'المخزون',
            productCardEdit: 'تعديل',
            productCardDelete: 'حذف',
            toastLoadProductsError: 'تعذر تحميل المنتجات',
            toastImageUploadSuccess: 'تم رفع الصورة بنجاح',
            toastImageUploadError: 'تعذر رفع الصورة',
            toastUpdateSuccess: 'تم تحديث المنتج',
            toastCreateSuccess: 'تم إضافة المنتج',
            toastSaveError: 'تعذر حفظ المنتج',
            toastDeleteSuccess: 'تم حذف المنتج',
            toastDeleteError: 'تعذر حذف المنتج',
            confirmDelete: 'هل تريد حذف المنتج "{name}"؟',
            productPrice: '{amount} ر.س'
        },
        en: {
            pageTitle: 'Dashboard - Mayasah Style',
            headerBrand: 'Mayasah Pro',
            headerLogout: 'Log out',
            headerGreetingFallback: 'Admin',
            languageToggleToEnglish: 'English',
            languageToggleToArabic: 'العربية',
            languageToggleAriaEnglish: 'Switch to English',
            languageToggleAriaArabic: 'Switch to Arabic',
            productsTitle: 'Products Management',
            addProduct: 'Add product',
            searchPlaceholder: 'Search by name or SKU',
            category_all: 'All',
            category_black: 'Black',
            category_color: 'Color',
            category_embroidery: 'Embroidered',
            category_modern: 'Modern',
            emptyTitle: 'No products yet',
            emptySubtitle: 'Start by adding your first products to show in the store.',
            emptyAdd: 'Create product',
            ordersTitle: 'Orders',
            ordersEmptyTitle: 'Order tracking in progress',
            ordersEmptySubtitle: 'A detailed orders dashboard is coming soon. Connect your Appwrite collection to review orders here.',
            statsTitle: 'Overview',
            statsSales: 'Total sales (month)',
            statsActive: 'Active products',
            statsLow: 'Low stock',
            statsSalesValue: '{value} SAR',
            productsCurrencySuffix: 'SAR',
            settingsTitle: 'Customization',
            settingsCardTitle: 'Interface colors',
            settingsPrimary: 'Primary color',
            settingsSecondary: 'Secondary color',
            settingsReset: 'Reset',
            nav_products: 'Products',
            nav_orders: 'Orders',
            nav_stats: 'Stats',
            nav_settings: 'Settings',
            editorAddTitle: 'Add new product',
            editorEditTitle: 'Edit product',
            editorImageLabel: 'Product image',
            editorNoImage: 'No image selected',
            editorNameAr: 'Product name (Arabic)',
            editorNameEn: 'Product name (English)',
            editorSku: 'SKU',
            editorPrice: 'Price',
            editorDiscount: 'Discount %',
            editorCurrentStock: 'Current stock',
            editorInitialStock: 'Initial stock',
            editorCategory: 'Category',
            editorBadge: 'Badge',
            editorBadgePlaceholder: 'Example: new',
            editorDescriptionAr: 'Description (Arabic)',
            editorDescriptionEn: 'Description (English)',
            editorCancel: 'Cancel',
            editorSave: 'Save',
            categoryOption_black: 'Black',
            categoryOption_color: 'Color',
            categoryOption_embroidery: 'Embroidered',
            categoryOption_modern: 'Modern',
            productCardNoName: 'Untitled product',
            productCardStock: 'Stock',
            productCardEdit: 'Edit',
            productCardDelete: 'Delete',
            toastLoadProductsError: 'Failed to load products',
            toastImageUploadSuccess: 'Image uploaded successfully',
            toastImageUploadError: 'Image upload failed',
            toastUpdateSuccess: 'Product updated',
            toastCreateSuccess: 'Product created',
            toastSaveError: 'Could not save product',
            toastDeleteSuccess: 'Product deleted',
            toastDeleteError: 'Could not delete product',
            confirmDelete: 'Delete product "{name}"?',
            productPrice: '{amount} SAR'
        }
    };

    function normalizeLanguage(value) {
        return SUPPORTED_LANGS.includes(value) ? value : 'ar';
    }

    function getInitialLanguage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return normalizeLanguage(stored);
        } catch (error) {
            console.warn('Failed to read language preference', error);
        }
        const documentLang = document.documentElement.lang;
        return normalizeLanguage(documentLang);
    }

    let currentLanguage = getInitialLanguage();
    const listeners = new Set();

    function formatTemplate(template, params) {
        if (!params) return template;
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            if (Object.prototype.hasOwnProperty.call(params, key)) {
                return params[key];
            }
            return match;
        });
    }

    function translate(key, params) {
        if (!key) return '';
        const langTable = translations[currentLanguage] || translations.ar;
        let template = langTable[key];
        if (template === undefined) {
            template = (translations.ar && translations.ar[key]) || '';
        }
        if (typeof template !== 'string') {
            return template !== undefined ? String(template) : key;
        }
        return formatTemplate(template, params);
    }

    function setLanguage(lang) {
        const next = normalizeLanguage(lang);
        if (next === currentLanguage) return;
        currentLanguage = next;
        try {
            localStorage.setItem(STORAGE_KEY, currentLanguage);
        } catch (error) {
            console.warn('Failed to persist language preference', error);
        }
        listeners.forEach((cb) => {
            try {
                cb(currentLanguage);
            } catch (err) {
                console.error('Language change listener failed', err);
            }
        });
    }

    function onChange(callback) {
        if (typeof callback !== 'function') return () => {};
        listeners.add(callback);
        return () => listeners.delete(callback);
    }

    window.dashboardI18n = {
        t: translate,
        setLanguage,
        onChange,
        getLanguage() {
            return currentLanguage;
        },
        getDirection() {
            return currentLanguage === 'ar' ? 'rtl' : 'ltr';
        },
        translations
    };
})();
