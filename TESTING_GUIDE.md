# Quick iPhone Testing Guide

## Test on Your iPhone Right Now (3 Easy Steps)

### Step 1: Start Your Server
```powershell
# Navigate to your project folder
cd "c:\Users\USER\Desktop\mayasah style final"

# Start the server
npx http-server -p 3000
```

### Step 2: Find Your Computer's IP Address
```powershell
# In a new PowerShell window, run:
ipconfig

# Look for "IPv4 Address" under your active network connection
# Example: 192.168.1.5 or 192.168.0.105
```

### Step 3: Open on iPhone
1. Make sure your iPhone is on the **same Wi-Fi network** as your computer
2. Open **Safari** on your iPhone
3. Type in the address bar: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.5:3000`
4. Press Go

## Alternative: Use Tunnel (if iPhone is on different network)

### Option 1: LocalTunnel
```powershell
# Terminal 1: Start server
npx http-server -p 3000

# Terminal 2: Start tunnel
npx localtunnel --port 3000

# It will give you a URL like: https://xxxx-xxxx-xxxx.loca.lt
# Open this URL on your iPhone
```

### Option 2: Ngrok (more reliable)
```powershell
# Install ngrok (one-time)
choco install ngrok
# OR download from https://ngrok.com/download

# Start server
npx http-server -p 3000

# In new terminal, start ngrok
ngrok http 3000

# Copy the "Forwarding" URL (https://xxxx-xxxx.ngrok-free.app)
# Open on iPhone
```

## What to Test on iPhone

### Homepage (index.html)
- [ ] Hero section shows properly (no text cutoff)
- [ ] Product cards show in 2 columns
- [ ] All images load
- [ ] Language switcher works
- [ ] Cart icon is tappable
- [ ] Navigation menu is easy to tap

### Products Page (products.html)
- [ ] Products show in 2 columns
- [ ] Product cards are not too small
- [ ] Tapping a product opens detail page

### Product Detail (product-detail.html)
- [ ] Product image shows full-width
- [ ] Arrow buttons are tappable
- [ ] Size selector is easy to use
- [ ] Quantity buttons are easy to tap
- [ ] "Add to Cart" button is tappable

### Cart (cart.html)
- [ ] Cart items show clearly
- [ ] Quantity controls work
- [ ] Remove button is tappable
- [ ] Checkout button is tappable
- [ ] No horizontal scrolling

### Checkout (checkout.html)
- [ ] Form inputs don't zoom when tapping
- [ ] All fields are easy to fill
- [ ] Buttons are easy to tap
- [ ] Progress steps show clearly

### Contact (contact.html)
- [ ] Toggle buttons work
- [ ] Chatbot interface is usable
- [ ] Form inputs don't zoom

## Common Issues & Fixes

### Issue: "Cannot GET /"
**Solution**: Make sure you're in the project folder
```powershell
cd "c:\Users\USER\Desktop\mayasah style final"
npx http-server -p 3000
```

### Issue: Can't connect from iPhone
**Solutions**:
1. Check both devices are on same Wi-Fi
2. Check Windows Firewall allows port 3000
3. Try tunnel method instead (localtunnel/ngrok)

### Issue: Inputs zoom when tapping (iOS)
**Already Fixed**: All form inputs use 16px font size to prevent auto-zoom

### Issue: Buttons too small to tap
**Already Fixed**: All buttons are minimum 44×44px (Apple guidelines)

## Testing Checklist

### Visual Layout
- [ ] No horizontal scrolling on any page
- [ ] No text overlapping or cutoff
- [ ] Images scale properly
- [ ] Spacing looks good
- [ ] Colors are consistent

### Interaction
- [ ] All buttons are tappable (not too small)
- [ ] Links work correctly
- [ ] Forms are usable
- [ ] No accidental taps (targets not too close)
- [ ] Scrolling is smooth

### Typography
- [ ] Text is readable (not too small)
- [ ] Headers are properly sized
- [ ] Line height is comfortable
- [ ] No text wrapping issues

### Navigation
- [ ] Menu is easy to use
- [ ] Language switcher works
- [ ] Back buttons work
- [ ] Cart icon shows count

## Browser Dev Tools Testing (Desktop Simulation)

### Chrome/Edge DevTools
1. Open website: `http://localhost:3000`
2. Press `F12` (or right-click → Inspect)
3. Click device icon (or `Ctrl+Shift+M`)
4. Select iPhone model from dropdown:
   - iPhone SE (375px) - smallest
   - iPhone 13 Pro (390px)
   - iPhone 14 Pro Max (430px) - largest
5. Refresh page and test

### Firefox Responsive Design Mode
1. Press `Ctrl+Shift+M`
2. Select iPhone from device list
3. Test in both portrait and landscape

## Performance Testing

### Check Load Speed
```powershell
# In DevTools Console:
performance.now()
```

### Test with Slow Network
1. Open DevTools (F12)
2. Go to "Network" tab
3. Change throttling to "Slow 3G"
4. Reload page

## Screenshots for Testing
Take screenshots on iPhone at:
- Homepage (full scroll)
- Products page
- Product detail page
- Cart page
- Checkout page

Compare with desktop version to verify responsive design works.

---

**Tip**: Test in Safari iOS first (native iPhone browser), then Chrome iOS if needed.
