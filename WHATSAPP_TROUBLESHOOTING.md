# WhatsApp Notifications Troubleshooting Guide

## Quick Test

1. **Open your browser console** (F12 → Console tab)
2. **Run this command**:
   ```javascript
   window.quickWhatsAppTest()
   ```

## Step-by-Step Debugging

### 1. Check Configuration
Go to `/admin/whatsapp-settings` and verify:

- ✅ **Account SID**: Should start with "AC..." (e.g., AC1234567890abcdef1234567890abcdef)
- ✅ **Auth Token**: Should be a long string (e.g., 1234567890abcdef1234567890abcdef)
- ✅ **WhatsApp Number**: Should be in format `whatsapp:+1234567890`
- ✅ **Admin Number**: Your phone number (e.g., `+221771234567`)
- ✅ **Order Notifications**: Should be enabled

### 2. Test Connection
1. Go to `/admin/whatsapp-debug`
2. Click "Load Configuration"
3. Click "Test Connection"
4. Check if you receive a test message

### 3. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Create a test order
4. Look for debug messages like:
   - "Starting WhatsApp notification for order:"
   - "WhatsApp config retrieved:"
   - "Admin number to use:"
   - "Making Twilio API request..."

## Common Issues & Solutions

### Issue 1: "WhatsApp configuration not found"
**Solution**: 
- Go to `/admin/whatsapp-settings`
- Fill in all required fields
- Click "Save"
- Make sure "Order Notifications" is enabled

### Issue 2: "Admin WhatsApp number not configured"
**Solution**:
- Add your phone number in the "Admin Number" field
- Format: `+221771234567` (with country code)

### Issue 3: "Order notifications are disabled"
**Solution**:
- Enable "Order Notifications" in WhatsApp settings

### Issue 4: Twilio API errors
**Common causes**:
- Invalid Account SID or Auth Token
- Wrong WhatsApp number format
- Twilio account not activated for WhatsApp
- Insufficient Twilio credits

**Solutions**:
1. Verify your Twilio credentials
2. Check Twilio console for errors
3. Ensure WhatsApp Business is enabled in Twilio
4. Add credits to your Twilio account

### Issue 5: No console logs appear
**Solution**:
- Check if the order creation is actually calling the WhatsApp service
- Verify the order has a valid phone number
- Check for JavaScript errors in console

## Testing Commands

Run these in your browser console:

```javascript
// Check configuration
window.checkWhatsAppConfig()

// Test connection
window.testWhatsApp()

// Test order notification (replace ORDER_ID)
window.testOrderNotification('your-order-id-here')

// Run all tests
window.quickWhatsAppTest()
```

## Twilio Setup Checklist

- [ ] Twilio account created
- [ ] WhatsApp Business enabled
- [ ] Account SID copied
- [ ] Auth Token copied
- [ ] WhatsApp number configured
- [ ] Account has credits
- [ ] WhatsApp number is active

## Environment Variables (if using)

Make sure these are set in your `.env` file:
```
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
VITE_ADMIN_WHATSAPP_NUMBER=+221771234567
```

## Still Not Working?

1. **Check Twilio Console**: Look for failed message attempts
2. **Verify Phone Number**: Make sure your admin number is correct
3. **Test with Twilio Console**: Try sending a message directly from Twilio
4. **Check Network**: Ensure your app can reach Twilio API
5. **Review Logs**: Check browser console and server logs

## Support

If you're still having issues:
1. Run `window.quickWhatsAppTest()` and share the console output
2. Check your Twilio console for any error messages
3. Verify your WhatsApp settings are saved correctly 