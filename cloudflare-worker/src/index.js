addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Cloudflare Worker with inventory management.
 * Endpoints:
 *  - GET /api/products - returns all products with stock levels
 *  - POST /api/send-order - accepts order and decrements stock
 *  - POST /api/payment-webhook - webhook for payment processing
 *  - GET /api/health - health check
 *
 * Uses KV storage for products (key: 'products') and orders (key: 'order:{id}')
 */

// Initial product data - will be stored in KV on first run
const INITIAL_PRODUCTS = [
  {
    id: "1", name_ar: "عباية سوداء كلاسيكية", name_en: "Classic Black Abaya",
    image: "images/abaya1.jpg", price: 299, discount: 15,
    initial_stock: 50, current_stock: 50, sku: "ABY-001"
  },
  {
    id: "2", name_ar: "عباية مطرزة بالخيط الذهبي", name_en: "Gold Thread Embroidered Abaya",
    image: "images/abaya2.jpg", price: 449, discount: 0, badge: "new",
    initial_stock: 30, current_stock: 30, sku: "ABY-002"
  },
  {
    id: "3", name_ar: "عباية كحلي بتصميم عصري", name_en: "Modern Navy Blue Abaya",
    image: "images/abaya3.jpg", price: 349, discount: 0,
    initial_stock: 40, current_stock: 40, sku: "ABY-003"
  },
  {
    id: "4", name_ar: "عباية رمادية بتفاصيل فضية", name_en: "Grey Abaya with Silver Details",
    image: "images/abaya4.jpg", price: 399, discount: 10,
    initial_stock: 35, current_stock: 35, sku: "ABY-004"
  }
]

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  try {
    // GET /api/products - return all products with stock
    if (url.pathname === '/api/products' && request.method === 'GET') {
      const products = await getProducts()
      return new Response(JSON.stringify({ success: true, products }), {
        status: 200,
        headers: jsonHeaders()
      })
    }

    // GET /api/health
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ ok: true, now: Date.now() }), {
        status: 200,
        headers: jsonHeaders()
      })
    }

    // POST /api/send-order or /api/payment-webhook - process order with stock check
    if ((url.pathname === '/api/send-order' || url.pathname === '/api/payment-webhook') && request.method === 'POST') {
      const contentType = request.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        return new Response(JSON.stringify({ error: 'expected application/json' }), {
          status: 400,
          headers: jsonHeaders()
        })
      }

      const body = await request.json()
      const orderId = body.order_id || `ORD-${Date.now()}`
      const customer = body.customer || {}
      const items = Array.isArray(body.items) ? body.items : []

      if (!customer.name || !customer.phone) {
        return new Response(JSON.stringify({ error: 'missing customer.name or customer.phone' }), {
          status: 400,
          headers: jsonHeaders()
        })
      }

      // Check and decrement stock
      const stockCheck = await decrementStock(items)
      if (!stockCheck.success) {
        return new Response(JSON.stringify({ 
          error: 'out of stock', 
          message: stockCheck.message,
          out_of_stock_items: stockCheck.out_of_stock_items
        }), {
          status: 400,
          headers: jsonHeaders()
        })
      }

      const stored = {
        order_id: orderId,
        received_at: new Date().toISOString(),
        remote_addr: request.headers.get('CF-Connecting-IP') || null,
        ua: request.headers.get('User-Agent') || null,
        customer,
        items,
        raw: body
      }

      try {
        await ORDERS.put(`order:${orderId}`, JSON.stringify(stored))
      } catch (err) {
        return new Response(JSON.stringify({ error: 'failed to store order', details: String(err) }), {
          status: 500,
          headers: jsonHeaders()
        })
      }

      return new Response(JSON.stringify({ success: true, order_id: orderId }), {
        status: 200,
        headers: jsonHeaders()
      })
    }

    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: jsonHeaders() })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'internal error', details: String(err) }), { status: 500, headers: jsonHeaders() })
  }
}

async function getProducts() {
  let productsData = await ORDERS.get('products', { type: 'json' })
  if (!productsData) {
    // Initialize with default products
    productsData = INITIAL_PRODUCTS
    await ORDERS.put('products', JSON.stringify(productsData))
  }
  return productsData
}

async function decrementStock(items) {
  const products = await getProducts()
  const productMap = {}
  products.forEach(p => { productMap[p.id] = p })

  const out_of_stock_items = []

  // Check availability first
  for (const item of items) {
    const product = productMap[item.id || item.product_id]
    if (!product) continue
    const requestedQty = item.quantity || 1
    if (product.current_stock < requestedQty) {
      out_of_stock_items.push({
        id: product.id,
        name: product.name_en,
        available: product.current_stock,
        requested: requestedQty
      })
    }
  }

  if (out_of_stock_items.length > 0) {
    return {
      success: false,
      message: 'Some items are out of stock',
      out_of_stock_items
    }
  }

  // Decrement stock
  for (const item of items) {
    const product = productMap[item.id || item.product_id]
    if (!product) continue
    const requestedQty = item.quantity || 1
    product.current_stock -= requestedQty
    if (product.current_stock < 0) product.current_stock = 0
  }

  // Save updated products
  await ORDERS.put('products', JSON.stringify(products))

  return { success: true }
}


function jsonHeaders() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders()
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}
