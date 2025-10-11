// inventory.js - Product inventory management for Mayasah Style

// Production API endpoint
const API_BASE = 'https://mayasahstyle.me/api';

// Fetch products from API
async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) {
      console.error('Failed to fetch products:', response.status);
      return null;
    }
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
}

// Update product cards with stock information
async function updateProductStock() {
  const products = await fetchProducts();
  if (!products) return;

  // Create product map for quick lookup
  const productMap = {};
  products.forEach(p => {
    productMap[p.id] = p;
  });

  // Update all product cards on the page
  document.querySelectorAll('.home-product-card').forEach(card => {
    const link = card.closest('a[href*="product-detail.html"]');
    if (!link) return;

    // Extract product ID from URL
    const url = new URL(link.href, window.location.origin);
    const productId = url.searchParams.get('id');
    if (!productId) return;

    const product = productMap[productId];
    if (!product) return;

    // Add stock indicator
    const bottomRow = card.querySelector('.home-product-bottom-row');
    if (!bottomRow) return;

    // Remove existing stock badge if any
    const existingBadge = bottomRow.querySelector('.stock-badge');
    if (existingBadge) existingBadge.remove();

    // Check if sold out
    if (product.current_stock <= 0) {
      // Add sold out overlay
      const imageContainer = card.querySelector('.home-product-image');
      if (imageContainer && !imageContainer.querySelector('.sold-out-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sold-out-overlay';
        overlay.innerHTML = '<span data-translate="soldOut">نفذت الكمية</span>';
        imageContainer.style.position = 'relative';
        imageContainer.appendChild(overlay);
      }

      // Add sold out badge
      const badge = document.createElement('span');
      badge.className = 'stock-badge sold-out';
      badge.setAttribute('data-translate', 'soldOut');
      badge.textContent = 'نفذت الكمية';
      bottomRow.appendChild(badge);

      // Disable link
      link.style.pointerEvents = 'none';
      link.style.opacity = '0.6';
    } else if (product.current_stock <= 5) {
      // Low stock warning
      const badge = document.createElement('span');
      badge.className = 'stock-badge low-stock';
      badge.textContent = `${product.current_stock} ${document.documentElement.lang === 'ar' ? 'متبقي' : 'left'}`;
      bottomRow.appendChild(badge);
    }
  });

  // Re-apply translations if available
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }
}

// Check product availability before adding to cart
async function checkProductAvailability(productId, quantity = 1) {
  const products = await fetchProducts();
  if (!products) {
    return { available: false, message: 'Unable to check stock' };
  }

  const product = products.find(p => p.id === productId);
  if (!product) {
    return { available: false, message: 'Product not found' };
  }

  if (product.current_stock <= 0) {
    return { 
      available: false, 
      message: document.documentElement.lang === 'ar' ? 'نفذت الكمية' : 'Sold out' 
    };
  }

  if (product.current_stock < quantity) {
    return { 
      available: false, 
      message: `${document.documentElement.lang === 'ar' ? 'متوفر فقط' : 'Only'} ${product.current_stock} ${document.documentElement.lang === 'ar' ? 'قطعة' : 'available'}` 
    };
  }

  return { available: true, stock: product.current_stock };
}

// Initialize stock display when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateProductStock);
} else {
  updateProductStock();
}

// Export for use in other scripts
window.InventoryManager = {
  fetchProducts,
  updateProductStock,
  checkProductAvailability
};
