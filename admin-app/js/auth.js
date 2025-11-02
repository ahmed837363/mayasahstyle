'use strict';

/* global appwriteClient */

const authView = (() => {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginBtn');
    const alertBox = document.getElementById('alert');

    async function init() {
        if (!loginForm) return;
        const session = await appwriteClient.getSession();
        if (session) {
            window.location.href = 'app.html';
            return;
        }
        loginForm.addEventListener('submit', handleSubmit);
    }

    function setLoading(isLoading, label) {
        if (!loginButton) return;
        loginButton.disabled = isLoading;
        loginButton.innerHTML = isLoading ? label : loginButton.dataset.defaultLabel;
    }

    function showAlert(message, type) {
        if (!alertBox) return;
        alertBox.textContent = message;
        alertBox.className = type === 'success' ? 'alert success' : 'alert error';
        alertBox.style.display = 'block';
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showAlert('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
            return;
        }

        setLoading(true, 'جاري تسجيل الدخول...');
        try {
            await appwriteClient.account.createEmailPasswordSession(email, password);
            showAlert('✅ تم تسجيل الدخول بنجاح!', 'success');
            setTimeout(() => (window.location.href = 'app.html'), 600);
        } catch (error) {
            console.warn('Login failed', error);
            showAlert(error?.message || 'بيانات تسجيل الدخول غير صحيحة', 'error');
            setLoading(false);
        }
    }

    return { init };
})();

window.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('loginBtn');
    if (button) {
        button.dataset.defaultLabel = button.textContent;
    }
    authView.init();
});
