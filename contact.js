// Contact Page JavaScript
console.log('=== CONTACT.JS LOADED ===');

// Test if elements exist immediately
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED ===');
    
    // Test element finding
    const testElements = {
        chatInput: document.getElementById('chatInput'),
        sendBtn: document.getElementById('sendMessage'),
        chatMessages: document.getElementById('chatMessages'),
        quickQuestions: document.querySelectorAll('.quick-question'),
        toggleBtns: document.querySelectorAll('.toggle-btn'),
        chatbotContent: document.getElementById('chatbotContent'),
        contactContent: document.getElementById('contactContent')
    };
    
    console.log('=== ELEMENT TEST ===');
    console.log('chatInput:', testElements.chatInput);
    console.log('sendBtn:', testElements.sendBtn);
    console.log('chatMessages:', testElements.chatMessages);
    console.log('quickQuestions count:', testElements.quickQuestions.length);
    console.log('toggleBtns count:', testElements.toggleBtns.length);
    console.log('chatbotContent:', testElements.chatbotContent);
    console.log('contactContent:', testElements.contactContent);
    
    // Test if elements are visible
    if (testElements.chatInput) {
        console.log('chatInput is visible:', testElements.chatInput.offsetParent !== null);
        console.log('chatInput style:', testElements.chatInput.style.display);
    }
    
    if (testElements.sendBtn) {
        console.log('sendBtn is visible:', testElements.sendBtn.offsetParent !== null);
        console.log('sendBtn style:', testElements.sendBtn.style.display);
    }
    
    initializeContactPage();
});

// Global variables for chatbot functionality
let chatInput, sendBtn, chatMessages, quickQuestions;

function initializeContactPage() {
    console.log('=== INITIALIZING CONTACT PAGE ===');
    setupToggleButtons();
    setupChatbot();
    setupContactForm();
    updatePlaceholders();
    
    // Listen for language changes
    document.addEventListener('languageChanged', function() {
        console.log('Language changed, updating content...');
        updatePlaceholders();
        updateChatbotContent();
    });
    
    console.log('Contact page initialization complete');
}

// Toggle between chatbot and contact info
function setupToggleButtons() {
    console.log('=== SETTING UP TOGGLE BUTTONS ===');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const chatbotContent = document.getElementById('chatbotContent');
    const contactContent = document.getElementById('contactContent');
    
    console.log('Toggle elements found:', {
        toggleBtns: toggleBtns.length,
        chatbotContent: !!chatbotContent,
        contactContent: !!contactContent
    });
    
    toggleBtns.forEach((btn, index) => {
        console.log(`Adding event listener to toggle button ${index}`);
        btn.addEventListener('click', function(e) {
            console.log('Toggle button clicked!', e);
            const mode = this.dataset.mode;
            console.log('Toggle button clicked, mode:', mode);
            
            // Update active button
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide content
            if (mode === 'chatbot') {
                chatbotContent.classList.remove('hidden');
                contactContent.classList.add('hidden');
            } else {
                chatbotContent.classList.add('hidden');
                contactContent.classList.remove('hidden');
            }
        });
        console.log(`Event listener added to toggle button ${index}`);
    });
    
    console.log('Toggle button event listeners attached');
}

// Chatbot functionality
function setupChatbot() {
    console.log('=== SETTING UP CHATBOT ===');
    chatInput = document.getElementById('chatInput');
    sendBtn = document.getElementById('sendMessage');
    chatMessages = document.getElementById('chatMessages');
    quickQuestions = document.querySelectorAll('.quick-question');
    
    // Debug logging
    console.log('Chatbot elements found:', {
        chatInput: !!chatInput,
        sendBtn: !!sendBtn,
        chatMessages: !!chatMessages,
        quickQuestions: quickQuestions.length
    });
    
    // Send message on button click
    if (sendBtn) {
        console.log('Adding click event to send button');
        sendBtn.addEventListener('click', function(e) {
            console.log('Send button clicked!', e);
            sendMessage();
        });
        console.log('Send button event listener attached');
    } else {
        console.log('ERROR: Send button not found!');
    }
    
    // Send message on Enter key
    if (chatInput) {
        console.log('Adding keypress event to chat input');
        chatInput.addEventListener('keypress', function(e) {
            console.log('Key pressed in chat input:', e.key);
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log('Enter pressed, sending message');
                sendMessage();
            }
        });
        console.log('Chat input event listener attached');
    } else {
        console.log('ERROR: Chat input not found!');
    }
    
    // Quick question buttons
    quickQuestions.forEach((btn, index) => {
        console.log(`Adding event listener to quick question ${index}`);
        btn.addEventListener('click', function(e) {
            console.log('Quick question clicked!', e);
            const question = this.dataset.question;
            console.log('Quick question clicked:', question);
            handleQuickQuestion(question);
        });
    });
    console.log('Quick question event listeners attached:', quickQuestions.length);
    
    // Initial scroll
    setTimeout(scrollToBottom, 100);
}

// Auto-scroll to bottom
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Send message function
function sendMessage() {
    console.log('=== SEND MESSAGE CALLED ===');
    if (!chatInput) {
        console.log('ERROR: Chat input not found');
        return;
    }
    
    const message = chatInput.value.trim();
    console.log('Message to send:', message);
    
    if (!message) {
        console.log('Empty message, returning');
        return;
    }
    
    console.log('Sending message:', message);
    
    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate bot response
    setTimeout(() => {
        hideTypingIndicator();
        const response = getBotResponse(message);
        console.log('Bot response:', response);
        addMessage(response, 'bot');
    }, 1000 + Math.random() * 2000);
}

// Handle quick questions
function handleQuickQuestion(question) {
    console.log('=== HANDLE QUICK QUESTION CALLED ===');
    console.log('handleQuickQuestion called with:', question);
    const questionText = getQuickQuestionText(question);
    console.log('Question text:', questionText);
    addMessage(questionText, 'user');
    
    showTypingIndicator();
    
    setTimeout(async () => {
        hideTypingIndicator();
        const response = await getQuickQuestionResponse(question);
        console.log('Quick question response:', response);
        addMessage(response, 'bot');
    }, 800 + Math.random() * 1500);
}

// Add message to chat
function addMessage(text, sender) {
    console.log('=== ADD MESSAGE CALLED ===');
    console.log('Adding message:', { text, sender });
    
    if (!chatMessages) {
        console.log('ERROR: Chat messages container not found');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const now = new Date();
    const lang = document.documentElement.lang;
    
    // Display time based on current language
    const timeString = lang === 'ar' 
        ? now.toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
        : now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    
    // Convert newlines to <br> tags for proper display
    const formattedText = text.replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${formattedText}</p>
        </div>
        <div class="message-time">${timeString}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    console.log('Message added to chat');
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    if (!chatMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator-message';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Bot responses
function getBotResponse(message) {
    const lang = document.documentElement.lang;
    const lowerMessage = message.toLowerCase();
    
    // Check if inventory assistant is available and can handle this query
    if (window.inventoryAssistant && window.inventoryAssistant.processInventoryQuery) {
        const inventoryResponse = window.inventoryAssistant.processInventoryQuery(message);
        if (inventoryResponse) {
            return inventoryResponse;
        }
    }
    
    // Arabic responses
    if (lang === 'ar') {
        // Product related queries
        if (lowerMessage.includes('المنتج') || lowerMessage.includes('المنتجات') || lowerMessage.includes('عباية') || lowerMessage.includes('عبايات')) {
            return 'نوفر مجموعة متنوعة من العبايات الأنيقة:\n• عباية سوداء كلاسيكية\n• عباية مطرزة بالخيط الذهبي\n• عباية كحلي بتصميم عصري\n• عباية رمادية بتفاصيل فضية\n\nجميع منتجاتنا مصنوعة من أجود الخامات وتصاميم عصرية أنيقة. يمكنك تصفح منتجاتنا من صفحة "المنتجات" في الموقع.';
        }
        
        // Price related queries
        else if (lowerMessage.includes('السعر') || lowerMessage.includes('الأسعار') || lowerMessage.includes('التكلفة') || lowerMessage.includes('كم') || lowerMessage.includes('التكلفة')) {
            return 'أسعار منتجاتنا تبدأ من 299 ر.س وتصل إلى 599 ر.س حسب التصميم والخامات المستخدمة. نقدم أيضاً عروض وخصومات دورية. للاطلاع على الأسعار الحالية، يمكنك زيارة صفحة المنتجات.';
        }
        
        // Shipping related queries
        else if (lowerMessage.includes('الشحن') || lowerMessage.includes('التوصيل') || lowerMessage.includes('الموصل') || lowerMessage.includes('الوصول')) {
            return 'نوفر خدمة شحن سريعة وآمنة:\n• الشحن المجاني للطلبات فوق 500 ر.س\n• وقت التوصيل: 3-5 أيام عمل\n• نغطي جميع مدن المملكة العربية السعودية\n• تتبع الطلب عبر الرابط المرسل لك\n\nنستخدم شركات شحن موثوقة لضمان وصول طلبك بأمان.';
        }
        
        // Size related queries
        else if (lowerMessage.includes('المقاس') || lowerMessage.includes('المقاسات') || lowerMessage.includes('القياس') || lowerMessage.includes('القياسات')) {
            return 'نوفر جميع المقاسات المعيارية:\n• XS - للبنات الصغيرات\n• S - صغير\n• M - متوسط\n• L - كبير\n• XL - كبير جداً\n• XXL - كبير جداً جداً\n\nيمكنك اختيار المقاس المناسب لك من صفحة المنتج. إذا كنت غير متأكدة من مقاسك، يمكننا مساعدتك في تحديده.';
        }
        
        // Payment related queries
        else if (lowerMessage.includes('الدفع') || lowerMessage.includes('الطريقة') || lowerMessage.includes('كيف') || lowerMessage.includes('الدفع')) {
            return 'طرق الدفع المتاحة:\n• الدفع عند الاستلام (الطريقة الأكثر شيوعاً)\n• التحويل البنكي\n• البطاقات الائتمانية\n• المحافظ الإلكترونية\n\nجميع المعاملات آمنة ومشفرة. يمكنك اختيار الطريقة التي تناسبك عند إتمام الطلب.';
        }
        
        // Return/Exchange related queries
        else if (lowerMessage.includes('الاسترجاع') || lowerMessage.includes('التبديل') || lowerMessage.includes('الاستبدال') || lowerMessage.includes('الرجوع')) {
            return 'سياسة الاسترجاع والتبديل:\n• يمكنك استرجاع المنتج خلال 14 يوم من تاريخ الاستلام\n• التبديل مجاني خلال 7 أيام\n• المنتج يجب أن يكون بحالته الأصلية وغير مستخدم\n• الشحن على حساب العميل في حالة الاسترجاع\n\nنهدف لرضاك التام عن منتجاتنا.';
        }
        
        // Working hours related queries
        else if (lowerMessage.includes('ساعات') || lowerMessage.includes('العمل') || lowerMessage.includes('الوقت') || lowerMessage.includes('متى')) {
            return 'ساعات العمل:\n• الأحد - الخميس: 9 صباحاً - 10 مساءً\n• الجمعة - السبت: 10 صباحاً - 11 مساءً\n\nيمكنك التواصل معنا عبر:\n• الهاتف: +966 50 123 4567\n• الواتساب: نفس الرقم\n• البريد الإلكتروني: info@abaya-store.com\n\nنحن متاحون لمساعدتك خلال ساعات العمل.';
        }
        
        // Location/Address related queries
        else if (lowerMessage.includes('العنوان') || lowerMessage.includes('الموقع') || lowerMessage.includes('أين') || lowerMessage.includes('المكان')) {
            return 'موقعنا:\n• العنوان: جدة، المملكة العربية السعودية\n• نغطي جميع مدن المملكة عبر خدمة الشحن\n• يمكنك زيارة متجرنا في جدة خلال ساعات العمل\n\nللطلبات عبر الإنترنت، نوصلك أينما كنت في المملكة.';
        }
        
        // Quality/Material related queries
        else if (lowerMessage.includes('الجودة') || lowerMessage.includes('الخامات') || lowerMessage.includes('المواد') || lowerMessage.includes('النسيج')) {
            return 'نحرص على جودة منتجاتنا:\n• نستخدم أجود أنواع الأقمشة المستوردة\n• خياطة احترافية ودقيقة\n• تصميمات عصرية وأنيقة\n• ضمان الجودة على جميع المنتجات\n\nنفخر بتقديم منتجات عالية الجودة تناسب ذوقك الرفيع.';
        }
        
        // Order tracking related queries
        else if (lowerMessage.includes('التتبع') || lowerMessage.includes('الطلب') || lowerMessage.includes('أين طلبي') || lowerMessage.includes('متى يصل')) {
            return 'تتبع الطلب:\n• بعد إتمام الطلب، ستتلقى رسالة تأكيد\n• سيتم إرسال رابط التتبع عبر البريد الإلكتروني\n• يمكنك متابعة طلبك خطوة بخطوة\n• وقت التوصيل: 3-5 أيام عمل\n\nنوفر تحديثات مستمرة لحالة طلبك.';
        }
        
        // Discount/Promotion related queries
        else if (lowerMessage.includes('الخصم') || lowerMessage.includes('العرض') || lowerMessage.includes('التخفيض') || lowerMessage.includes('الخصومات')) {
            return 'عروضنا وخصوماتنا:\n• خصم 10% على الطلبات الأولى\n• الشحن المجاني للطلبات فوق 500 ر.س\n• عروض موسمية على جميع المنتجات\n• خصومات خاصة للعملاء المخلصين\n\nتابع صفحتنا على وسائل التواصل الاجتماعي لمعرفة أحدث العروض.';
        }
        
        // General greeting/thanks
        else if (lowerMessage.includes('شكر') || lowerMessage.includes('ممتاز') || lowerMessage.includes('حلو') || lowerMessage.includes('أحسنت')) {
            return 'شكراً لك! يسعدنا أن نكون في خدمتك. إذا كان لديك أي استفسارات أخرى، لا تتردد في السؤال. نحن هنا لمساعدتك في كل ما تحتاجينه.';
        }
        
        // Website/Online related queries
        else if (lowerMessage.includes('الموقع') || lowerMessage.includes('الإنترنت') || lowerMessage.includes('أونلاين') || lowerMessage.includes('التسوق')) {
            return 'تسوقي معنا بسهولة:\n• موقع إلكتروني سهل الاستخدام\n• صور عالية الجودة لجميع المنتجات\n• وصف تفصيلي لكل منتج\n• نظام دفع آمن ومشفر\n• خدمة عملاء متاحة 24/7\n\nيمكنك التسوق من راحة منزلك!';
        }
        
        // Contact/Support related queries
        else if (lowerMessage.includes('التواصل') || lowerMessage.includes('الخدمة') || lowerMessage.includes('المساعدة') || lowerMessage.includes('الدعم')) {
            return 'نحن هنا لمساعدتك:\n• خدمة عملاء متاحة خلال ساعات العمل\n• واتساب للرد السريع: +966 50 123 4567\n• بريد إلكتروني: info@abaya-store.com\n• صفحة تواصل مخصصة في الموقع\n\nلا تترددي في التواصل معنا لأي استفسار.';
        }
        
        // Default response for any other message
        else {
            return 'شكراً لسؤالك! يمكنني مساعدتك في:\n\n📦 **المنتجات والأسعار**\n🚚 **الشحن والتوصيل**\n📏 **المقاسات المتوفرة**\n💳 **طرق الدفع**\n🔄 **سياسة الاسترجاع**\n⏰ **ساعات العمل**\n📍 **العنوان والموقع**\n🎁 **العروض والخصومات**\n\nأو يمكنك:\n• تصفح منتجاتنا من صفحة "المنتجات"\n• التواصل معنا مباشرة عبر الواتساب\n• زيارة متجرنا في جدة\n\nكيف يمكنني مساعدتك اليوم؟';
        }
    }
    
    // English responses
    else {
        // Product related queries
        if (lowerMessage.includes('product') || lowerMessage.includes('products') || lowerMessage.includes('abaya') || lowerMessage.includes('abayas')) {
            return 'We offer a variety of elegant abayas:\n• Classic Black Abaya\n• Abaya with Golden Embroidery\n• Modern Navy Abaya\n• Gray Abaya with Silver Details\n\nAll our products are made from premium materials with modern elegant designs. You can browse our products from the "Products" page on our website.';
        }
        
        // Price related queries
        else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much') || lowerMessage.includes('expensive')) {
            return 'Our product prices start from 299 SAR and go up to 599 SAR depending on the design and materials used. We also offer regular promotions and discounts. To see current prices, you can visit our products page.';
        }
        
        // Shipping related queries
        else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery') || lowerMessage.includes('ship') || lowerMessage.includes('arrive')) {
            return 'We provide fast and secure shipping:\n• Free shipping for orders above 500 SAR\n• Delivery time: 3-5 business days\n• We cover all cities in Saudi Arabia\n• Track your order via the link sent to you\n\nWe use reliable shipping companies to ensure your order arrives safely.';
        }
        
        // Size related queries
        else if (lowerMessage.includes('size') || lowerMessage.includes('sizes') || lowerMessage.includes('measurement') || lowerMessage.includes('fit')) {
            return 'We offer all standard sizes:\n• XS - For young girls\n• S - Small\n• M - Medium\n• L - Large\n• XL - Extra Large\n• XXL - Extra Extra Large\n\nYou can choose the appropriate size from the product page. If you\'re unsure about your size, we can help you determine it.';
        }
        
        // Payment related queries
        else if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('how to pay') || lowerMessage.includes('method')) {
            return 'Available payment methods:\n• Cash on delivery (most popular)\n• Bank transfer\n• Credit cards\n• E-wallets\n\nAll transactions are secure and encrypted. You can choose the method that suits you when completing your order.';
        }
        
        // Return/Exchange related queries
        else if (lowerMessage.includes('return') || lowerMessage.includes('exchange') || lowerMessage.includes('refund') || lowerMessage.includes('change')) {
            return 'Return and exchange policy:\n• You can return the product within 14 days of receipt\n• Free exchange within 7 days\n• Product must be in original condition and unused\n• Shipping is at customer\'s expense for returns\n\nWe aim for your complete satisfaction with our products.';
        }
        
        // Working hours related queries
        else if (lowerMessage.includes('hours') || lowerMessage.includes('work') || lowerMessage.includes('time') || lowerMessage.includes('when')) {
            return 'Working hours:\n• Sunday - Thursday: 9am - 10pm\n• Friday - Saturday: 10am - 11pm\n\nYou can contact us via:\n• Phone: +966 50 123 4567\n• WhatsApp: Same number\n• Email: info@abaya-store.com\n\nWe\'re available to help you during working hours.';
        }
        
        // Location/Address related queries
        else if (lowerMessage.includes('address') || lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('place')) {
            return 'Our location:\n• Address: Jeddah, Saudi Arabia\n• We cover all cities in the Kingdom through shipping service\n• You can visit our store in Jeddah during working hours\n\nFor online orders, we deliver anywhere in the Kingdom.';
        }
        
        // Quality/Material related queries
        else if (lowerMessage.includes('quality') || lowerMessage.includes('material') || lowerMessage.includes('fabric') || lowerMessage.includes('texture')) {
            return 'We ensure product quality:\n• We use the finest imported fabrics\n• Professional and precise tailoring\n• Modern and elegant designs\n• Quality guarantee on all products\n\nWe\'re proud to offer high-quality products that suit your refined taste.';
        }
        
        // Order tracking related queries
        else if (lowerMessage.includes('track') || lowerMessage.includes('order') || lowerMessage.includes('where is my order') || lowerMessage.includes('when will it arrive')) {
            return 'Order tracking:\n• After completing your order, you\'ll receive a confirmation message\n• Tracking link will be sent via email\n• You can follow your order step by step\n• Delivery time: 3-5 business days\n\nWe provide continuous updates on your order status.';
        }
        
        // Discount/Promotion related queries
        else if (lowerMessage.includes('discount') || lowerMessage.includes('offer') || lowerMessage.includes('sale') || lowerMessage.includes('promotion')) {
            return 'Our offers and discounts:\n• 10% discount on first orders\n• Free shipping for orders above 500 SAR\n• Seasonal offers on all products\n• Special discounts for loyal customers\n\nFollow our social media pages to know about the latest offers.';
        }
        
        // General greeting/thanks
        else if (lowerMessage.includes('thank') || lowerMessage.includes('great') || lowerMessage.includes('good') || lowerMessage.includes('nice')) {
            return 'Thank you! We\'re happy to be at your service. If you have any other questions, don\'t hesitate to ask. We\'re here to help you with everything you need.';
        }
        
        // Website/Online related queries
        else if (lowerMessage.includes('website') || lowerMessage.includes('online') || lowerMessage.includes('internet') || lowerMessage.includes('shop')) {
            return 'Shop with us easily:\n• User-friendly website\n• High-quality images for all products\n• Detailed description for each product\n• Secure and encrypted payment system\n• 24/7 customer service\n\nYou can shop from the comfort of your home!';
        }
        
        // Contact/Support related queries
        else if (lowerMessage.includes('contact') || lowerMessage.includes('service') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
            return 'We\'re here to help you:\n• Customer service available during working hours\n• WhatsApp for quick response: +966 50 123 4567\n• Email: info@abaya-store.com\n• Dedicated contact page on our website\n\nDon\'t hesitate to contact us for any inquiry.';
        }
        
        // Default response for any other message
        else {
            return 'Thank you for your question! I can help you with:\n\n📦 **Products and Prices**\n🚚 **Shipping and Delivery**\n📏 **Available Sizes**\n💳 **Payment Methods**\n🔄 **Return Policy**\n⏰ **Working Hours**\n📍 **Address and Location**\n🎁 **Offers and Discounts**\n\nOr you can:\n• Browse our products from the "Products" page\n• Contact us directly via WhatsApp\n• Visit our store in Jeddah\n\nHow can I help you today?';
        }
    }
}

function getQuickQuestionText(question) {
    const lang = document.documentElement.lang;
    
    const questions = {
        products: lang === 'ar' ? 'ما هي المنتجات المتوفرة؟' : 'What products are available?',
        shipping: lang === 'ar' ? 'معلومات الشحن والتوصيل' : 'Shipping and delivery information',
        sizes: lang === 'ar' ? 'المقاسات المتوفرة' : 'Available sizes',
        contact: lang === 'ar' ? 'كيف يمكنني التواصل معكم؟' : 'How can I contact you?'
    };
    
    return questions[question] || '';
}

async function getQuickQuestionResponse(question) {
    const lang = document.documentElement.lang;
    
    // Check for products question and use inventory if available
    if (question === 'products' && window.inventoryAssistant && window.inventoryAssistant.listProducts) {
        const inventoryResponse = await window.inventoryAssistant.listProducts();
        if (inventoryResponse) {
            return inventoryResponse;
        }
    }
    
    const responses = {
        products: lang === 'ar' 
            ? 'نوفر مجموعة متنوعة من العبايات الأنيقة:\n\n📦 **أنواع العبايات:**\n• عباية سوداء كلاسيكية\n• عباية مطرزة بالخيط الذهبي\n• عباية كحلي بتصميم عصري\n• عباية رمادية بتفاصيل فضية\n\n✨ **مميزات منتجاتنا:**\n• أجود أنواع الأقمشة المستوردة\n• خياطة احترافية ودقيقة\n• تصميمات عصرية وأنيقة\n• ضمان الجودة على جميع المنتجات\n\nيمكنك تصفح منتجاتنا من صفحة "المنتجات" في الموقع.'
            : 'We offer a variety of elegant abayas:\n\n📦 **Types of Abayas:**\n• Classic Black Abaya\n• Abaya with Golden Embroidery\n• Modern Navy Abaya\n• Gray Abaya with Silver Details\n\n✨ **Our Product Features:**\n• Finest imported fabrics\n• Professional and precise tailoring\n• Modern and elegant designs\n• Quality guarantee on all products\n\nYou can browse our products from the "Products" page on our website.',
        
        shipping: lang === 'ar'
            ? 'نوفر خدمة شحن سريعة وآمنة:\n\n🚚 **خدمة الشحن:**\n• الشحن المجاني للطلبات فوق 500 ر.س\n• وقت التوصيل: 3-5 أيام عمل\n• نغطي جميع مدن المملكة العربية السعودية\n• تتبع الطلب عبر الرابط المرسل لك\n\n🛡️ **ضمان الأمان:**\n• نستخدم شركات شحن موثوقة\n• تغليف آمن ومتين\n• تأمين على جميع الطلبات\n• تحديثات مستمرة لحالة الطلب'
            : 'We provide fast and secure shipping:\n\n🚚 **Shipping Service:**\n• Free shipping for orders above 500 SAR\n• Delivery time: 3-5 business days\n• We cover all cities in Saudi Arabia\n• Track your order via the link sent to you\n\n🛡️ **Safety Guarantee:**\n• We use reliable shipping companies\n• Safe and sturdy packaging\n• Insurance on all orders\n• Continuous updates on order status',
        
        sizes: lang === 'ar'
            ? 'نوفر جميع المقاسات المعيارية:\n\n📏 **المقاسات المتوفرة:**\n• XS - للبنات الصغيرات\n• S - صغير\n• M - متوسط\n• L - كبير\n• XL - كبير جداً\n• XXL - كبير جداً جداً\n\n💡 **نصائح لاختيار المقاس:**\n• يمكنك اختيار المقاس المناسب من صفحة المنتج\n• إذا كنت غير متأكدة من مقاسك، يمكننا مساعدتك\n• نقدم إرشادات مفصلة لقياس الجسم\n• إمكانية التبديل في حالة عدم ملائمة المقاس'
            : 'We offer all standard sizes:\n\n📏 **Available Sizes:**\n• XS - For young girls\n• S - Small\n• M - Medium\n• L - Large\n• XL - Extra Large\n• XXL - Extra Extra Large\n\n💡 **Size Selection Tips:**\n• You can choose the appropriate size from the product page\n• If you\'re unsure about your size, we can help you\n• We provide detailed body measurement guidelines\n• Exchange option if the size doesn\'t fit'
    };
    
    return responses[question] || '';
}

// Contact form functionality
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactFormSubmit();
        });
    }
}

async function handleContactFormSubmit() {
    const formData = new FormData(document.getElementById('contactForm'));
    const data = Object.fromEntries(formData);
    
    // Add language to the data
    data.language = document.documentElement.lang || 'ar';
    
    // Show loading notification
    showNotification(
        document.documentElement.lang === 'ar' 
            ? 'جاري إرسال الرسالة...' 
            : 'Sending message...',
        'info'
    );
    
    try {
        const response = await fetch('http://localhost:3000/send-contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            showNotification(
                document.documentElement.lang === 'ar' 
                    ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' 
                    : 'Your message has been sent successfully! We will contact you soon.',
                'success'
            );
            
            // Reset form
            document.getElementById('contactForm').reset();
        } else {
            // Show error message
            showNotification(
                result.message || (document.documentElement.lang === 'ar' 
                    ? 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.' 
                    : 'An error occurred while sending the message. Please try again.'),
                'error'
            );
        }
    } catch (error) {
        console.error('Contact form submission error:', error);
        
        // Show error message
        showNotification(
            document.documentElement.lang === 'ar' 
                ? 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.' 
                : 'An error occurred while sending the message. Please try again.',
            'error'
        );
    }
}

// Update placeholders based on language
function updatePlaceholders() {
    const lang = document.documentElement.lang;
    
    const placeholders = {
        chatInput: lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...',
        name: lang === 'ar' ? 'الاسم الكامل' : 'Full Name',
        email: lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address',
        phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
        message: lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'
    };
    
    // Update chat input placeholder
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.placeholder = placeholders.chatInput;
    }
    
    // Update form placeholders
    Object.keys(placeholders).forEach(key => {
        const element = document.getElementById(key);
        if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
            element.placeholder = placeholders[key];
        }
    });
}

// Update chatbot content based on language
function updateChatbotContent() {
    const lang = document.documentElement.lang;
    
    // Update quick questions
    const quickQuestions = document.querySelectorAll('.quick-question');
    quickQuestions.forEach(btn => {
        const question = btn.dataset.question;
        const text = getQuickQuestionText(question);
        const span = btn.querySelector('span');
        if (span) {
            span.textContent = text;
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-family: 'Montserrat', sans-serif;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add CSS animations
const contactStyle = document.createElement('style');
contactStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(contactStyle); 