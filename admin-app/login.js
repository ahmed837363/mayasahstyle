const { Client, Account } = Appwrite;

const client = new Client();
client.setEndpoint('https://cloud.appwrite.io/v1').setProject('65eb3e280039fdf7e677');

const account = new Account(client);
const loginForm = document.getElementById('loginForm');
const alertDiv = document.getElementById('alert');
const loginBtn = document.getElementById('loginBtn');

checkSession();

async function checkSession() {
    try {
        const session = await account.get();
        if (session) window.location.href = 'dashboard.html';
    } catch (error) {}
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    loginBtn.disabled = true;
    loginBtn.innerHTML = 'جاري تسجيل الدخول...';
    
    try {
        await account.createEmailPasswordSession(email, password);
        const user = await account.get();
        localStorage.setItem('admin_user', JSON.stringify(user));
        showAlert(' تم تسجيل الدخول بنجاح!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (error) {
        let msg = 'فشل تسجيل الدخول';
        if (error.code === 401) msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        else if (error.message) msg = error.message;
        showAlert(' ' + msg, 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'تسجيل الدخول ';
    }
});

function showAlert(message, type) {
    alertDiv.innerHTML = message;
    alertDiv.style.display = 'block';
    alertDiv.style.background = type === 'success' ? '#d1fae5' : '#fee2e2';
    alertDiv.style.color = type === 'success' ? '#065f46' : '#991b1b';
    alertDiv.style.borderLeft = '4px solid ' + (type === 'success' ? '#10b981' : '#ef4444');
}