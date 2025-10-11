// chatbot.js - Inventory integration for Mayasah Smart Assistant

class InventoryAssistant {
  constructor() {
    this.products = null;
    this.apiBase = 'https://mayasahstyle.me/api'; // Production API
    this.init();
  }

  async init() {
    await this.loadProducts();
    // Wait for contact.js to set up the interface first
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhanceAssistant());
    } else {
      setTimeout(() => this.enhanceAssistant(), 100);
    }
  }

  async loadProducts() {
    // Priority 1: Try to load from production API
    try {
      const response = await fetch(`${this.apiBase}/products`);
      if (response.ok) {
        const data = await response.json();
        this.products = data.products || [];
        console.log('Products loaded from API:', this.products);
        return;
      }
    } catch (error) {
      console.warn('API not available, trying fallback sources:', error);
    }
    
    // Priority 2: Use productsData from script.js (product detail page data)
    if (window.productsData && Array.isArray(window.productsData)) {
      this.products = window.productsData.map(p => ({
        id: String(p.id),
        name_ar: window.translations?.ar?.[p.key] || p.key,
        name_en: window.translations?.en?.[p.key] || p.key,
        image: p.images?.[0] || "images/abaya1.jpg",
        price: p.price,
        discount: p.discount ? (p.original ? Math.round((1 - p.price/p.original) * 100) : 0) : 0,
        original_price: p.original || null,
        current_stock: 50, // Default stock when using script.js data
        sku: `ABY-00${p.id}`
      }));
      console.log('Products loaded from window.productsData (script.js):', this.products);
      return;
    }
    
    // Priority 3: Try to load from data/products.json (local file)
    try {
      const localResponse = await fetch('data/products.json');
      if (localResponse.ok) {
        const localData = await localResponse.json();
        this.products = localData.products || [];
        console.log('Products loaded from local file:', this.products);
        return;
      }
    } catch (error) {
      console.warn('Local products.json not available:', error);
    }
    
    // Final fallback with minimal data (will show as unavailable)
    this.products = [
      {
        id: "1", name_ar: "عباية سوداء كلاسيكية", name_en: "Classic Black Abaya",
        image: "images/abaya1.jpg", price: 0, discount: 0,
        initial_stock: 0, current_stock: 0, sku: "ABY-001"
      },
      {
        id: "2", name_ar: "عباية مطرزة بالخيط الذهبي", name_en: "Gold Thread Embroidered Abaya",
        image: "images/abaya2.jpg", price: 0, discount: 0, badge: "new",
        initial_stock: 0, current_stock: 0, sku: "ABY-002"
      },
      {
        id: "3", name_ar: "عباية كحلي بتصميم عصري", name_en: "Modern Navy Blue Abaya",
        image: "images/abaya3.jpg", price: 0, discount: 0,
        initial_stock: 0, current_stock: 0, sku: "ABY-003"
      },
      {
        id: "4", name_ar: "عباية رمادية بتفاصيل فضية", name_en: "Grey Abaya with Silver Details",
        image: "images/abaya4.jpg", price: 0, discount: 0,
        initial_stock: 0, current_stock: 0, sku: "ABY-004"
      }
    ];
    console.log('Using minimal fallback data (prices/stock unavailable)');
  }

  enhanceAssistant() {
    // Expose methods globally so contact.js can use them
    window.inventoryAssistant = {
      checkStock: (productId) => this.checkProductStock(productId),
      listProducts: () => this.listAllProducts(),
      showStock: () => this.showAllStock(),
      processInventoryQuery: (message) => this.processInventoryMessage(message),
      refreshProducts: () => this.loadProducts() // Add refresh method
    };
    
    console.log('Inventory Assistant enhanced and ready');
  }

  processInventoryMessage(message) {
    const lowerMsg = message.toLowerCase();
    
    // Keywords for stock inquiry
    const stockKeywords = ['متوفر', 'available', 'stock', 'مخزون', 'توفر', 'كمية'];
    const productKeywords = ['منتجات', 'products', 'عباية', 'abaya'];
    
    // Check if asking about stock
    if (stockKeywords.some(kw => lowerMsg.includes(kw))) {
      return this.showAllStock();
    }

    // Check if asking about products list
    if (productKeywords.some(kw => lowerMsg.includes(kw))) {
      return this.listAllProducts();
    }

    // Check for specific product mentions
    if (this.products) {
      for (const product of this.products) {
        const nameAr = product.name_ar.toLowerCase();
        const nameEn = product.name_en.toLowerCase();
        
        if (lowerMsg.includes(nameAr) || lowerMsg.includes(nameEn) || lowerMsg.includes(product.id)) {
          return this.showProductDetails(product);
        }
      }
    }

    return null; // Let contact.js handle other messages
  }

  showProductDetails(product) {
    const lang = document.documentElement.lang || 'ar';
    const name = lang === 'ar' ? product.name_ar : product.name_en;
    const available = product.current_stock > 0;
    
    let message = `<div class="inventory-response">`;
    message += `<strong>📦 ${name}</strong><br><br>`;
    
    if (available) {
      message += `<span style="color: green;">✅ ${lang === 'ar' ? 'متوفر' : 'Available'}: ${product.current_stock} ${lang === 'ar' ? 'قطعة' : 'pcs'}</span><br><br>`;
      
      // Handle both price formats: discount % or original price
      const currentPrice = product.price;
      const originalPrice = product.original_price || null;
      const discountPercent = product.discount || 0;
      
      if (originalPrice && originalPrice > currentPrice) {
        // Format 1: Has original price (from script.js)
        const discount = Math.round((1 - currentPrice/originalPrice) * 100);
        message += `💰 <span style="text-decoration: line-through; color: #999;">${originalPrice.toFixed(2)} ${lang === 'ar' ? 'ريال' : 'SAR'}</span><br>`;
        message += `🏷️ ${lang === 'ar' ? 'السعر بعد الخصم' : 'Price after discount'}: <strong>${currentPrice.toFixed(2)} ${lang === 'ar' ? 'ريال' : 'SAR'}</strong> <span style="color: #8B4049;">(${discount}% ${lang === 'ar' ? 'خصم' : 'off'})</span>`;
      } else if (discountPercent > 0) {
        // Format 2: Has discount percentage (from API/JSON)
        const finalPrice = currentPrice - (currentPrice * discountPercent / 100);
        message += `💰 <span style="text-decoration: line-through; color: #999;">${currentPrice.toFixed(2)} ${lang === 'ar' ? 'ريال' : 'SAR'}</span><br>`;
        message += `🏷️ ${lang === 'ar' ? 'بعد الخصم' : 'After discount'}: <strong>${finalPrice.toFixed(2)} ${lang === 'ar' ? 'ريال' : 'SAR'}</strong> <span style="color: #8B4049;">(${discountPercent}% ${lang === 'ar' ? 'خصم' : 'off'})</span>`;
      } else {
        // No discount
        message += `💰 ${lang === 'ar' ? 'السعر' : 'Price'}: <strong>${currentPrice.toFixed(2)} ${lang === 'ar' ? 'ريال' : 'SAR'}</strong>`;
      }
    } else {
      message += `<span style="color: red;">❌ ${lang === 'ar' ? 'نفذت الكمية' : 'Sold out'}</span>`;
    }
    
    message += `</div>`;
    return message;
  }

  async showAllStock() {
    // Reload products from API to get fresh data
    await this.loadProducts();
    
    if (!this.products || this.products.length === 0) {
      const lang = document.documentElement.lang || 'ar';
      return lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...';
    }

    const lang = document.documentElement.lang || 'ar';
    let message = `<div class="inventory-response">`;
    message += `<strong>${lang === 'ar' ? '📦 حالة المخزون' : '📦 Stock Status'}</strong><br><br>`;
    
    this.products.forEach((product, index) => {
      const name = lang === 'ar' ? product.name_ar : product.name_en;
      const stock = product.current_stock;
      const status = stock > 0 
        ? `<span style="color: green;">✅ ${stock} ${lang === 'ar' ? 'متوفر' : 'available'}</span>`
        : `<span style="color: red;">❌ ${lang === 'ar' ? 'نفذت الكمية' : 'Sold out'}</span>`;
      message += `<strong>${index + 1}. ${name}</strong><br>${status}<br><br>`;
    });

    message += `</div>`;
    return message;
  }

  async listAllProducts() {
    // Reload products from API to get fresh data
    await this.loadProducts();
    
    if (!this.products || this.products.length === 0) {
      const lang = document.documentElement.lang || 'ar';
      return lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...';
    }

    const lang = document.documentElement.lang || 'ar';
    let message = `<div class="inventory-response">`;
    message += `<strong>${lang === 'ar' ? '🛍️ منتجاتنا' : '🛍️ Our Products'}</strong><br><br>`;
    
    this.products.forEach((product, index) => {
      const name = lang === 'ar' ? product.name_ar : product.name_en;
      const currentPrice = product.price;
      const originalPrice = product.original_price || null;
      const discountPercent = product.discount || 0;
      const stock = product.current_stock;
      
      message += `<strong>${index + 1}. ${name}</strong><br>`;
      
      // Handle both price formats
      if (originalPrice && originalPrice > currentPrice) {
        // Format 1: Has original price (from script.js)
        const discount = Math.round((1 - currentPrice/originalPrice) * 100);
        message += `💰 <strong>${currentPrice.toFixed(2)} ${lang === 'ar' ? 'ريال' : 'SAR'}</strong>`;
        message += ` <span style="color: #999; text-decoration: line-through;">${originalPrice.toFixed(2)}</span>`;
        message += ` <span style="color: #8B4049;">(${discount}% ${lang === 'ar' ? 'خصم' : 'off'})</span>`;
      } else if (discountPercent > 0) {
        // Format 2: Has discount percentage (from API/JSON)
        const finalPrice = currentPrice - (currentPrice * discountPercent / 100);
        message += `💰 <strong>${finalPrice.toFixed(2)} ${lang === 'ar' ? 'ريال' : 'SAR'}</strong>`;
        message += ` <span style="color: #999; text-decoration: line-through;">${currentPrice.toFixed(2)}</span>`;
        message += ` <span style="color: #8B4049;">(${discountPercent}% ${lang === 'ar' ? 'خصم' : 'off'})</span>`;
      } else {
        // No discount
        message += `💰 <strong>${currentPrice.toFixed(2)} ${lang === 'ar' ? 'ريال' : 'SAR'}</strong>`;
      }
      
      message += `<br>📦 `;
      if (stock > 0) {
        message += `<span style="color: green;">${stock} ${lang === 'ar' ? 'متوفر' : 'available'}</span>`;
      } else {
        message += `<span style="color: red;">${lang === 'ar' ? 'نفذت الكمية' : 'Sold out'}</span>`;
      }
      message += `<br><br>`;
    });

    message += `</div>`;
    return message;
  }

  checkProductStock(productId) {
    if (!this.products) return null;
    const product = this.products.find(p => p.id === productId);
    return product ? product.current_stock : null;
  }
}

// Initialize inventory assistant
window.inventoryAssistantInstance = new InventoryAssistant();
