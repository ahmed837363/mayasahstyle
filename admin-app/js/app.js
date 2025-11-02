'use strict';

/* global appwriteClient, APPWRITE_CONFIG, productsModule, dashboardI18n */

const appShell = (() => {
    const NAV_KEYS = ['products', 'orders', 'stats', 'settings'];
    const views = new Map();
    const navButtons = new Map();
    const loader = document.getElementById('globalLoader');
    const toast = document.getElementById('globalToast');
    const userBadge = document.getElementById('userBadge');
    const logoutBtn = document.getElementById('logoutBtn');
    const languageToggle = document.getElementById('languageToggle');
    const primaryPicker = document.getElementById('primaryColor');
    const secondaryPicker = document.getElementById('secondaryColor');
    const resetThemeBtn = document.getElementById('resetTheme');
    const statSalesValue = document.getElementById('statSalesValue');

    const i18n = window.dashboardI18n;

    let activeView = 'products';
    let userProfile = null;
    async function init() {
        registerLanguageToggle();
        applyLanguage(getCurrentLanguage());
        registerLanguageWatcher();

        const session = await appwriteClient.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }
        userProfile = session;
        applyThemeFromPreference();
        wireNavigation();
        registerLogout();
        registerThemeControls();
        await setUserBadge();
        await productsModule.init();
        productsModule.setLanguage?.(getCurrentLanguage());
        updateSalesStatDisplay();
        switchView(activeView);
    }

    function wireNavigation() {
        NAV_KEYS.forEach((key) => {
            const view = document.getElementById(`view-${key}`);
            const btn = document.querySelector(`[data-nav="${key}"]`);
            if (view) views.set(key, view);
            if (btn) {
                navButtons.set(key, btn);
                btn.addEventListener('click', () => switchView(key));
            }
        });
    }

    function registerLogout() {
        if (!logoutBtn) return;
        logoutBtn.addEventListener('click', async () => {
            try {
                await appwriteClient.account.deleteSession('current');
            } catch (error) {
                console.warn('Failed to delete session', error);
            } finally {
                window.location.href = 'index.html';
            }
        });
    }

    async function setUserBadge() {
        if (!userBadge) return;
        if (!userProfile) {
            userBadge.textContent = '';
            return;
        }
        const fallback = i18n && typeof i18n.t === 'function' ? i18n.t('headerGreetingFallback') : 'مدير';
        userBadge.textContent = userProfile.email || fallback;
    }

    function registerThemeControls() {
        if (primaryPicker) primaryPicker.addEventListener('input', saveThemePreferences);
        if (secondaryPicker) secondaryPicker.addEventListener('input', saveThemePreferences);
        if (resetThemeBtn) {
            resetThemeBtn.addEventListener('click', () => {
                const defaults = {};
                setPreference(defaults);
                applyTheme(defaults);
                if (primaryPicker) primaryPicker.value = '#8a2d52';
                if (secondaryPicker) secondaryPicker.value = '#c06c84';
            });
        }
    }

    function saveThemePreferences() {
        const prefs = getPreference();
        if (primaryPicker) prefs.primary = primaryPicker.value;
        if (secondaryPicker) prefs.secondary = secondaryPicker.value;
        setPreference(prefs);
        applyTheme(prefs);
    }

    function switchView(key) {
        if (!views.has(key)) return;
        navButtons.forEach((btn, btnKey) => {
            btn.classList.toggle('is-active', btnKey === key);
        });
        views.forEach((view, viewKey) => {
            view.classList.toggle('is-active', viewKey === key);
        });
        activeView = key;
        if (key === 'products' && productsModule && typeof productsModule.onShow === 'function') {
            productsModule.onShow();
        }
    }

    function setLoading(isLoading) {
        if (!loader) return;
        loader.classList.toggle('is-visible', Boolean(isLoading));
    }

    let toastTimer = null;
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        if (toastTimer) window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 2800);
    }

    function getPreference() {
        try {
            const stored = localStorage.getItem(APPWRITE_CONFIG.dashboardPreferencesKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to parse dashboard preferences', error);
            return {};
        }
    }

    function setPreference(prefs) {
        try {
            localStorage.setItem(
                APPWRITE_CONFIG.dashboardPreferencesKey,
                JSON.stringify(prefs)
            );
        } catch (error) {
            console.warn('Failed to persist preferences', error);
        }
    }

    function applyThemeFromPreference() {
        const prefs = getPreference();
        applyTheme(prefs);
        if (prefs.primary && primaryPicker) primaryPicker.value = prefs.primary;
        if (prefs.secondary && secondaryPicker) secondaryPicker.value = prefs.secondary;
    }

    function applyTheme(prefs) {
        const root = document.documentElement;
        if (prefs.primary) {
            root.style.setProperty('--rosa-primary', prefs.primary);
        } else {
            root.style.removeProperty('--rosa-primary');
        }
        if (prefs.secondary) {
            root.style.setProperty('--rosa-secondary', prefs.secondary);
        } else {
            root.style.removeProperty('--rosa-secondary');
        }
    }

    function getCurrentLanguage() {
        if (i18n && typeof i18n.getLanguage === 'function') {
            return i18n.getLanguage();
        }
        return document.documentElement.lang || 'ar';
    }

    function registerLanguageWatcher() {
        if (!i18n || typeof i18n.onChange !== 'function') return;
        i18n.onChange((lang) => {
            applyLanguage(lang);
            productsModule.setLanguage?.(lang);
            updateSalesStatDisplay();
            setUserBadge();
        });
    }

    function registerLanguageToggle() {
        if (!languageToggle || !i18n || typeof i18n.setLanguage !== 'function') return;
        languageToggle.addEventListener('click', () => {
            const next = getCurrentLanguage() === 'ar' ? 'en' : 'ar';
            i18n.setLanguage(next);
        });
    }

    function applyLanguage(lang) {
        if (!lang) return;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.body?.setAttribute('data-lang', lang);
        if (!i18n || typeof i18n.t !== 'function') return;

        document.title = i18n.t('pageTitle') || document.title;

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            const value = i18n.t(key);
            if (value !== undefined) {
                el.textContent = value;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (!key) return;
            const value = i18n.t(key);
            if (value !== undefined) {
                el.setAttribute('placeholder', value);
            }
        });

        if (languageToggle) {
            const buttonLabel = lang === 'ar' ? i18n.t('languageToggleToEnglish') : i18n.t('languageToggleToArabic');
            const ariaLabel = lang === 'ar' ? i18n.t('languageToggleAriaEnglish') : i18n.t('languageToggleAriaArabic');
            languageToggle.textContent = buttonLabel || '';
            if (ariaLabel) {
                languageToggle.setAttribute('aria-label', ariaLabel);
            }
            languageToggle.setAttribute('dir', lang === 'ar' ? 'ltr' : 'rtl');
            languageToggle.classList.toggle('is-arabic', lang !== 'ar');
        }

        updateSalesStatDisplay();
    }

    function updateSalesStatDisplay() {
        if (!statSalesValue) return;
        let amount = Number(statSalesValue.dataset.amount);
        if (Number.isNaN(amount)) {
            amount = 0;
        }
        statSalesValue.dataset.amount = String(amount);
        if (i18n && typeof i18n.t === 'function') {
            const lang = getCurrentLanguage();
            const formatted = amount.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                maximumFractionDigits: 0
            });
            const template = i18n.t('statsSalesValue', { value: formatted });
            if (template) {
                statSalesValue.textContent = template;
                return;
            }
        }
        statSalesValue.textContent = `${amount} ر.س`;
    }

    return {
        init,
        switchView,
        setLoading,
        showToast,
        getPreference,
        setPreference
    };
})();

window.appShell = appShell;

window.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.app === 'dashboard') {
        appShell.init();
    }
});
