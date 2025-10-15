/**
 * Moyasar Payment Gateway Integration
 * Handles card payments, Apple Pay, and payment processing
 */

// Moyasar Configuration
const MOYASAR_CONFIG = {
    // Replace with your actual Moyasar Publishable Key from dashboard
    // Test key (for testing): pk_test_xxxxxxxxxxxxxxxx
    // Live key (for production): pk_live_xxxxxxxxxxxxxxxx
    publishableKey: 'pk_test_REPLACE_WITH_YOUR_KEY',
    
    // Payment methods to enable
    methods: ['creditcard', 'applepay'],
    
    // Apple Pay configuration
    applePay: {
        country: 'SA',
        currency: 'SAR',
        label: 'Mayasah Style',
        validateMerchant: true
    },
    
    // UI customization
    style: {
        base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            '::placeholder': {
                color: '#aab7c4'
            }
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
        }
    }
};

/**
 * Initialize Moyasar Payment Form
 */
function initializeMoyasarPayment() {
    // Check if Moyasar SDK is loaded
    if (typeof Moyasar === 'undefined') {
        console.error('Moyasar SDK not loaded. Please check your internet connection.');
        return null;
    }

    const lang = document.documentElement.lang || 'ar';
    const isArabic = lang === 'ar';

    // Moyasar payment form container
    const paymentContainer = document.getElementById('moyasar-payment-form');
    if (!paymentContainer) {
        console.error('Moyasar payment container not found');
        return null;
    }

    try {
        // Initialize Moyasar payment form
        const moyasar = Moyasar.init({
            element: paymentContainer,
            amount: 0, // Will be updated dynamically
            currency: 'SAR',
            description: isArabic ? 'طلب من مياسه ستايل' : 'Order from Mayasah Style',
            publishable_api_key: MOYASAR_CONFIG.publishableKey,
            callback_url: window.location.origin + '/confirmation.html',
            methods: MOYASAR_CONFIG.methods,
            
            // Apple Pay specific config
            apple_pay: MOYASAR_CONFIG.applePay,
            
            // Styling
            style: MOYASAR_CONFIG.style,
            
            // Language
            language: isArabic ? 'ar' : 'en',
            
            // Metadata (optional - for tracking)
            metadata: {
                source: 'website',
                platform: 'mayasahstyle'
            },
            
            // On payment token created
            on_completed: function(payment) {
                handleMoyasarSuccess(payment);
            },
            
            // On payment error
            on_failure: function(error) {
                handleMoyasarError(error);
            }
        });

        return moyasar;
    } catch (error) {
        console.error('Error initializing Moyasar:', error);
        showNotification(
            isArabic ? 'خطأ في تهيئة نظام الدفع' : 'Error initializing payment system',
            'error'
        );
        return null;
    }
}

/**
 * Process payment with Moyasar
 */
async function processMoyasarPayment(orderData) {
    const lang = document.documentElement.lang || 'ar';
    const isArabic = lang === 'ar';

    try {
        // Validate order data
        if (!orderData || !orderData.total) {
            throw new Error('Invalid order data');
        }

        // Convert SAR to halalas (Moyasar uses smallest currency unit)
        // 1 SAR = 100 halalas
        const amountInHalalas = Math.round(orderData.total * 100);

        // Create payment request
        const paymentData = {
            amount: amountInHalalas,
            currency: 'SAR',
            description: `${isArabic ? 'طلب رقم' : 'Order'} ${orderData.order_id || 'ORD' + Date.now()}`,
            publishable_api_key: MOYASAR_CONFIG.publishableKey,
            callback_url: window.location.origin + '/confirmation.html?order_id=' + (orderData.order_id || ''),
            
            // Customer information
            source: {
                type: 'creditcard',
                name: orderData.customer_name || '',
                company: 'Mayasah Style',
                email: orderData.customer_email || '',
                phone: orderData.customer_phone || ''
            },
            
            // Metadata for tracking
            metadata: {
                order_id: orderData.order_id || '',
                customer_name: orderData.customer_name || '',
                customer_email: orderData.customer_email || '',
                customer_phone: orderData.customer_phone || '',
                items_count: orderData.items ? orderData.items.length : 0,
                language: lang
            }
        };

        // Submit payment
        return new Promise((resolve, reject) => {
            Moyasar.createPayment(paymentData, function(payment) {
                if (payment.status === 'paid' || payment.status === 'authorized') {
                    resolve({
                        success: true,
                        payment_id: payment.id,
                        transaction_id: payment.id,
                        status: payment.status,
                        payment
                    });
                } else if (payment.status === 'failed') {
                    reject({
                        success: false,
                        error: payment.source?.message || 'Payment failed',
                        payment
                    });
                } else {
                    // Pending or other status
                    resolve({
                        success: true,
                        payment_id: payment.id,
                        transaction_id: payment.id,
                        status: payment.status,
                        pending: true,
                        payment
                    });
                }
            }, function(error) {
                reject({
                    success: false,
                    error: error.message || 'Payment error',
                    errorDetails: error
                });
            });
        });

    } catch (error) {
        console.error('Moyasar payment error:', error);
        return {
            success: false,
            error: error.message || 'Payment processing failed'
        };
    }
}

/**
 * Handle successful Moyasar payment
 */
function handleMoyasarSuccess(payment) {
    const lang = document.documentElement.lang || 'ar';
    const isArabic = lang === 'ar';

    console.log('✓ Payment successful:', payment);

    // Show success notification
    showNotification(
        isArabic ? 'تم الدفع بنجاح!' : 'Payment successful!',
        'success'
    );

    // Store payment info
    try {
        const paymentInfo = {
            payment_id: payment.id,
            transaction_id: payment.id,
            amount: payment.amount / 100, // Convert halalas back to SAR
            currency: payment.currency,
            status: payment.status,
            payment_method: 'moyasar_' + (payment.source?.type || 'card'),
            payment_timestamp: new Date().toISOString(),
            card_brand: payment.source?.company || '',
            card_last4: payment.source?.number?.slice(-4) || ''
        };

        localStorage.setItem('lastPayment', JSON.stringify(paymentInfo));

        // Update order with payment info
        const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || '{}');
        if (lastOrder) {
            lastOrder.payment_id = payment.id;
            lastOrder.transaction_id = payment.id;
            lastOrder.payment_status = 'paid';
            lastOrder.payment_method = paymentInfo.payment_method;
            localStorage.setItem('lastOrder', JSON.stringify(lastOrder));
        }
    } catch (e) {
        console.error('Error storing payment info:', e);
    }

    // Trigger order completion
    if (typeof window.completeMoyasarOrder === 'function') {
        window.completeMoyasarOrder(payment);
    }
}

/**
 * Handle Moyasar payment error
 */
function handleMoyasarError(error) {
    const lang = document.documentElement.lang || 'ar';
    const isArabic = lang === 'ar';

    console.error('✗ Payment failed:', error);

    // Parse error message
    let errorMessage = isArabic ? 'فشل الدفع. يرجى المحاولة مرة أخرى.' : 'Payment failed. Please try again.';

    if (error.message) {
        errorMessage = error.message;
    } else if (error.type === 'ValidationError') {
        errorMessage = isArabic ? 'بيانات البطاقة غير صحيحة' : 'Invalid card details';
    } else if (error.type === 'CardError') {
        errorMessage = isArabic ? 'تم رفض البطاقة' : 'Card declined';
    } else if (error.type === 'NetworkError') {
        errorMessage = isArabic ? 'خطأ في الاتصال. يرجى التحقق من الإنترنت' : 'Network error. Please check your connection';
    }

    // Show error notification
    showNotification(errorMessage, 'error');

    // Re-enable submit button
    const submitBtn = document.querySelector('.confirm-order-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-check-circle"></i><span>${isArabic ? 'تأكيد الطلب' : 'Confirm Order'}</span>`;
    }
}

/**
 * Update Moyasar payment amount
 */
function updateMoyasarAmount(amount) {
    if (typeof Moyasar === 'undefined') return;

    const amountInHalalas = Math.round(amount * 100);
    
    // Update Moyasar form if it exists
    const moyasarContainer = document.getElementById('moyasar-payment-form');
    if (moyasarContainer && moyasarContainer.moyasarInstance) {
        try {
            moyasarContainer.moyasarInstance.setAmount(amountInHalalas);
        } catch (e) {
            console.error('Error updating Moyasar amount:', e);
        }
    }
}

/**
 * Check if Apple Pay is available
 */
function isApplePayAvailable() {
    if (typeof Moyasar === 'undefined') return false;
    
    try {
        return Moyasar.isApplePayAvailable && Moyasar.isApplePayAvailable();
    } catch (e) {
        return false;
    }
}

/**
 * Show/Hide Moyasar payment form based on payment method selection
 */
function toggleMoyasarPaymentForm(show) {
    const moyasarContainer = document.getElementById('moyasar-payment-form');
    if (moyasarContainer) {
        moyasarContainer.style.display = show ? 'block' : 'none';
    }
}

// Export functions for use in checkout.js
if (typeof window !== 'undefined') {
    window.MoyasarPayment = {
        init: initializeMoyasarPayment,
        process: processMoyasarPayment,
        updateAmount: updateMoyasarAmount,
        isApplePayAvailable: isApplePayAvailable,
        toggle: toggleMoyasarPaymentForm,
        config: MOYASAR_CONFIG
    };
}

console.log('✓ Moyasar Payment Integration loaded');
