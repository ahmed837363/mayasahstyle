# Mayasah Style - Inventory & Chatbot System Documentation

## Overview
This document explains the complete inventory management and smart assistant system implemented for Mayasah Style e-commerce website.

---

## 🎯 Features Implemented

### 1. **Product Inventory System**
- Real-time stock tracking for all products
- Initial stock quantities defined per product
- Automatic stock deduction when orders are placed
- Stock availability checks before order acceptance

### 2. **Visual Stock Indicators**
- **Sold Out Overlay**: Dark overlay with red badge on product images when stock = 0
- **Low Stock Badge**: Yellow badge when 5 or fewer items remain
- **Disabled Purchase**: Products with zero stock cannot be added to cart

### 3. **Smart Assistant Integration**
- Chatbot on contact page can answer inventory questions
- Real-time stock queries
- Product availability information
- Pricing and discount details

### 4. **API Endpoints**
All endpoints are accessible at `https://mayasahstyle.me/api/`

- `GET /api/products` - Returns all products with current stock levels
- `POST /api/send-order` - Processes orders and decrements stock
- `POST /api/payment-webhook` - Handles payment confirmations
- `GET /api/health` - Health check endpoint

---

## 📦 Product Data Structure

Each product contains:
```json
{
  "id": "1",
  "name_ar": "عباية سوداء كلاسيكية",
  "name_en": "Classic Black Abaya",
  "image": "images/abaya1.jpg",
  "price": 299,
  "discount": 15,
  "initial_stock": 50,
  "current_stock": 50,
  "sku": "ABY-001"
}
```

### Initial Stock Levels:
1. Classic Black Abaya - 50 units
2. Gold Thread Embroidered Abaya - 30 units
3. Modern Navy Blue Abaya - 40 units
4. Grey Abaya with Silver Details - 35 units

---

## 🤖 Smart Assistant Capabilities

### Questions the Assistant Can Answer:

**Stock Inquiries (Arabic):**
- "هل المنتجات متوفرة؟" (Are products available?)
- "توفر المخزون" (Stock availability)
- "كمية العبايات" (Abaya quantity)

**Stock Inquiries (English):**
- "What products are available?"
- "Check stock"
- "Product availability"

**Product Listings:**
- "المنتجات" (Products)
- "عباية" (Abaya)
- Shows all products with prices, discounts, and stock

**Specific Product Queries:**
- Ask about any product by name
- Example: "عباية سوداء" or "black abaya"
- Returns detailed info: price, discount, stock count

---

## 🔧 Technical Implementation

### Files Created/Modified:

**New Files:**
- `data/products.json` - Product inventory database
- `inventory.js` - Frontend stock display manager
- `chatbot.js` - Smart Assistant inventory integration
- `chatbot.css` - (Not used - integrated with existing assistant)

**Modified Files:**
- `cloudflare-worker/src/index.js` - Added inventory API & stock checks
- `products.css` - Sold-out overlay & stock badges
- `products.html` - Added inventory.js script
- `index.html` - Added inventory.js script
- `contact.html` - Added chatbot.js for inventory queries

### Backend (Cloudflare Worker):

**Functions:**
- `getProducts()` - Fetches products from KV storage
- `decrementStock(items)` - Validates and reduces stock
- Stores products under KV key: `products`
- Stores orders under KV key: `order:{order_id}`

**Stock Deduction Logic:**
1. Check if all items are available
2. If any item is out of stock, reject order with details
3. If all available, decrement stock for each item
4. Save updated product data to KV
5. Store order and return success

---

## 🌐 API Usage Examples

### Get All Products
```bash
GET https://mayasahstyle.me/api/products

Response:
{
  "success": true,
  "products": [
    {
      "id": "1",
      "name_ar": "عباية سوداء كلاسيكية",
      "name_en": "Classic Black Abaya",
      "current_stock": 45,
      "price": 299,
      "discount": 15
    },
    ...
  ]
}
```

### Place Order
```bash
POST https://mayasahstyle.me/api/send-order
Content-Type: application/json

{
  "order_id": "ORD12345",
  "customer": {
    "name": "Ahmed",
    "phone": "+966501234567"
  },
  "items": [
    {
      "id": "1",
      "quantity": 2
    }
  ]
}

Success Response:
{
  "success": true,
  "order_id": "ORD12345"
}

Out of Stock Response:
{
  "error": "out of stock",
  "message": "Some items are out of stock",
  "out_of_stock_items": [
    {
      "id": "1",
      "name": "Classic Black Abaya",
      "available": 1,
      "requested": 2
    }
  ]
}
```

---

## 🎨 UI/UX Features

### Product Cards:
- **Normal State**: Product displayed with price and discount
- **Low Stock (≤5)**: Yellow badge showing remaining quantity
- **Sold Out (0)**: 
  - Dark overlay on image
  - Red "نفذت الكمية" / "Sold Out" badge
  - Link disabled (not clickable)
  - Reduced opacity (60%)

### Smart Assistant Interface:
- Integrated into existing "Mayasah Smart Assistant" on contact page
- No separate floating widget
- Responses formatted with:
  - Icons (📦, 💰, ✅, ❌)
  - Color coding (green for available, red for sold out)
  - Bilingual support (Arabic & English)

---

## 📱 Mobile Responsive

- Stock badges scale properly on mobile devices
- Sold-out overlay covers full product image
- Smart Assistant maintains usability on small screens
- Inventory fetch works on all devices

---

## 🚀 Deployment Status

### ✅ Completed:
- Cloudflare Worker deployed with inventory features
- KV namespace `ORDERS` created and bound
- Worker accessible at `mayasahstyle.me/api/*`
- Products initialized with starting stock
- Frontend inventory manager integrated
- Smart Assistant enhanced with stock queries

### ⏳ Pending:
- **DNS Propagation**: Waiting for Namecheap nameservers to fully propagate to Cloudflare
- **SSL Certificate**: Will be auto-provisioned by Cloudflare once zone is active
- **Final Testing**: End-to-end order flow once DNS is live

---

## 🔐 Security & Data Storage

- All product data stored in Cloudflare KV (serverless)
- Orders stored with timestamp and customer details
- Stock updates are atomic (checked before deduction)
- CORS enabled for API access from your domain
- No credit card required (Cloudflare Free plan)

---

## 📊 Monitoring & Management

### Check Current Stock:
1. Visit contact page
2. Ask Smart Assistant: "Check stock" or "توفر المخزون"
3. View real-time inventory levels

### Update Stock Manually:
Currently, stock updates automatically via orders. To manually adjust:
1. Access Cloudflare Dashboard → Workers & Pages → KV
2. Find namespace `ORDERS`
3. Edit key `products`
4. Modify `current_stock` values

Future Enhancement: Create an admin panel to manage inventory via UI.

---

## 🎯 Next Steps (After DNS Active)

1. **Test Health Endpoint**: `https://mayasahstyle.me/api/health`
2. **Verify Products API**: `https://mayasahstyle.me/api/products`
3. **Test Smart Assistant**: Ask about product availability
4. **Place Test Order**: Verify stock decrements correctly
5. **Check Sold Out UI**: Set a product to 0 stock and view on products page

---

## 💡 Usage Tips

### For Customers:
- Check product availability before ordering
- Ask the Smart Assistant any inventory questions
- "Sold Out" products will be restocked soon

### For Store Owners:
- Monitor stock levels via Smart Assistant
- Orders automatically decrement inventory
- Low stock warnings (≤5) help you restock in time
- View all orders in Cloudflare KV → `order:*` keys

---

## 📞 Support

If you encounter any issues:
1. Check DNS propagation status at https://dnschecker.org (search: mayasahstyle.me)
2. Verify Cloudflare zone is "Active" in dashboard
3. Test API endpoints once SSL is active
4. Contact for troubleshooting: mayasahstyle@gmail.com

---

**System Status**: ✅ Deployed and Ready (Waiting for DNS)
**Last Updated**: October 10, 2025
**Version**: 1.0
