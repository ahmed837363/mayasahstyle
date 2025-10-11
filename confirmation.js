// Confirmation Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for script.js to load and initialize
    setTimeout(() => {
        initializeConfirmation();
    }, 100);
});

function initializeConfirmation() {
    // Load order details
    loadOrderDetails();
    
    // Update cart count
    updateCartCount();
    
    // Listen for language changes
    document.addEventListener('languageChanged', (event) => {
        console.log('Language changed event received in confirmation.js:', event.detail);
        loadOrderDetails();
    });
}

function loadOrderDetails() {
    const lastOrder = localStorage.getItem('lastOrder');
    
    if (!lastOrder) {
        // No order found, redirect to products page
        window.location.href = 'products.html';
        return;
    }
    
    try {
        const orderData = JSON.parse(lastOrder);
        const lang = document.documentElement.lang || 'ar';
        
        // Update order details
        document.getElementById('orderNumber').textContent = orderData.order_id || '-';
        document.getElementById('orderDate').textContent = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
        document.getElementById('totalAmount').textContent = (orderData.total || 0).toFixed(2) + ' ريال';
        document.getElementById('shippingAddress').textContent = `${orderData.address || ''}, ${orderData.city || ''}, ${orderData.zip_code || ''}`;
        
        // Update payment information
        updatePaymentInfo(orderData, lang);
        
        // Generate tracking number
        const trackingNumber = 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase();
        document.getElementById('trackingNumber').textContent = trackingNumber;
        
    } catch (error) {
        console.error('Error loading order details:', error);
        window.location.href = 'products.html';
    }
}

function updatePaymentInfo(orderData, lang) {
    const paymentMethodElement = document.getElementById('paymentMethod');
    const transactionIdElement = document.getElementById('transactionId');
    
    if (orderData.payment_method) {
        // Display payment method
        const paymentMethodText = getPaymentMethodText(orderData.payment_method, lang);
        paymentMethodElement.textContent = paymentMethodText;
        
        // Display transaction ID if available
        if (orderData.transaction_id) {
            transactionIdElement.textContent = orderData.transaction_id;
        } else {
            transactionIdElement.textContent = lang === 'ar' ? 'غير متوفر' : 'Not available';
        }
    } else {
        // Fallback for old orders without payment info
        paymentMethodElement.textContent = lang === 'ar' ? 'فاتورة بريد إلكتروني' : 'Email Invoice';
        transactionIdElement.textContent = lang === 'ar' ? 'غير متوفر' : 'Not available';
    }
}

function getPaymentMethodText(method, lang) {
    const paymentMethods = {
        mada: {
            ar: 'بطاقة مدى',
            en: 'Mada Card'
        },
        visa: {
            ar: 'فيزا / ماستركارد',
            en: 'Visa / Mastercard'
        },
        applepay: {
            ar: 'Apple Pay',
            en: 'Apple Pay'
        },
        stcpay: {
            ar: 'STC Pay',
            en: 'STC Pay'
        },
        cod: {
            ar: 'الدفع عند الاستلام',
            en: 'Cash on Delivery'
        }
    };
    
    return paymentMethods[method]?.[lang] || method;
}

// Update cart count function
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
    }
} 