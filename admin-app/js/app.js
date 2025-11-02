'use strict';

/* global appwriteClient, APPWRITE_CONFIG, productsModule */

const appShell = (() => {
    const NAV_KEYS = ['products', 'orders', 'stats', 'settings'];
    const views = new Map();
    const navButtons = new Map();
    const loader = document.getElementById('globalLoader');
    const toast = document.getElementById('globalToast');
    const userBadge = document.getElementById('userBadge');
    const logoutBtn = document.getElementById('logoutBtn');
    const primaryPicker = document.getElementById('primaryColor');
    const secondaryPicker = document.getElementById('secondaryColor');
    const resetThemeBtn = document.getElementById('resetTheme');

    let activeView = 'products';
    let userProfile = null;

    async function init() {
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
        userBadge.textContent = userProfile.email || 'مدير';
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
        if (key === 'products') {
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
