const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use(express.static(path.join(__dirname, '..')));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]), 'utf8');
}

// Simple order endpoint - just save and respond quickly
app.post('/send-order', async (req, res) => {
    try {
        console.log('📦 New order received:', req.body.order_id);
        
        // Save order to file
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]');
        orders.push({
            ...req.body,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
        
        console.log('✓ Order saved successfully:', req.body.order_id);
        
        // Respond immediately
        res.json({ 
            success: true, 
            message: 'Order received successfully',
            order_id: req.body.order_id
        });
        
        console.log('✓ Response sent to client');
        
    } catch (error) {
        console.error('✗ Error processing order:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Payment webhook endpoint (for cash orders)
app.post('/payment-webhook', async (req, res) => {
    try {
        console.log('💰 Payment webhook received:', req.body.order_id || 'unknown');
        
        // Save order to file
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]');
        orders.push({
            ...req.body,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
        
        console.log('✓ Cash order saved:', req.body.order_id);
        
        // Respond immediately
        res.json({ 
            success: true, 
            message: 'Order received successfully',
            order_id: req.body.order_id
        });
        
    } catch (error) {
        console.error('✗ Error processing payment webhook:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create payment session endpoint (dummy - just returns success for cash)
app.post('/create-payment-session', async (req, res) => {
    try {
        console.log('💳 Payment session requested (cash order)');
        
        // For cash orders, just return success
        res.json({ 
            success: true, 
            message: 'Cash order - no payment session needed'
        });
        
    } catch (error) {
        console.error('✗ Error creating payment session:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  MAYASAH STYLE - SIMPLE ORDER SERVER');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✓ Server running on port ${PORT}`);
    console.log(`  ✓ Local: http://localhost:${PORT}`);
    console.log(`  ✓ Network: http://192.168.8.118:${PORT}`);
    console.log(`  ✓ Orders saved to: ${ORDERS_FILE}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Note: Emails disabled for now. Orders are saved to file.');
    console.log('🔄 Keep this window open while testing your website');
    console.log('');
});

// Keep server alive
server.on('error', (err) => {
    console.error('Server error:', err);
});

process.on('SIGINT', () => {
    console.log('\n✓ Server shutting down gracefully...');
    server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
    });
});
