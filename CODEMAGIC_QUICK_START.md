# Codemagic Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Create Accounts
- [ ] Apple Developer Account ($99/year) - https://developer.apple.com
- [ ] Codemagic Account (Free) - https://codemagic.io

### 2. Apple Developer Setup
```
1. Create App ID: com.invoicebaba.app
2. Create App in App Store Connect
3. Note your App Store Apple ID (numeric)
```

### 3. Codemagic Setup
```
1. Connect your repository
2. Add App Store Connect API key
3. Set up iOS code signing (Automatic)
4. Add environment variables
```

### 4. Required Environment Variables in Codemagic

**Minimum Required:**
```
VITE_API_URL=https://your-backend-url.com
APP_STORE_APPLE_ID=1234567890
```

**Firebase (Optional - for push notifications):**
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:ios:abcdef
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### 5. Update codemagic.yaml

Edit `codemagic.yaml` and replace:
```yaml
# Line 13
APP_STORE_APPLE_ID: YOUR_NUMERIC_APP_ID

# Line 55
recipients:
  - your-email@example.com
```

### 6. Commit and Push
```bash
git add codemagic.yaml CODEMAGIC_SETUP.md
git commit -m "Add Codemagic iOS build configuration"
git push origin main
```

### 7. Start Build
1. Go to Codemagic dashboard
2. Select your app
3. Click "Start new build"
4. Select workflow: **ios-workflow**
5. Click "Start new build"

## ⏱️ Build Timeline

- **Setup:** 2-3 minutes (install dependencies)
- **Build:** 10-15 minutes (compile iOS app)
- **Upload:** 2-3 minutes (TestFlight)
- **Total:** ~15-25 minutes

## 📱 Testing on Device

After successful build:
1. Open TestFlight app on iPhone
2. Accept invitation email
3. Install "Invoice Baba"
4. Test the app

## 🔧 Common Issues

### Issue: Code signing failed
**Solution:** 
- Verify Apple Developer credentials in Codemagic
- Check Bundle ID matches: `com.invoicebaba.app`
- Ensure provisioning profile is valid

### Issue: Build fails at npm install
**Solution:**
- Clear Codemagic cache
- Check `package.json` for errors
- Verify Node version (v20.11.0)

### Issue: Environment variables not working
**Solution:**
- Check variable names (case-sensitive)
- Mark sensitive vars as "Secure"
- Rebuild after adding variables

### Issue: TestFlight upload fails
**Solution:**
- Verify App Store Connect API key
- Check app exists in App Store Connect
- Ensure build number is incremented

## 📊 Workflow Explanation

```yaml
ios-workflow:
  1. Install dependencies (npm ci)
  2. Set environment variables
  3. Build React app (npm run build)
  4. Sync Capacitor (cap sync ios)
  5. Set up code signing
  6. Increment build number
  7. Build IPA
  8. Upload to TestFlight
```

## 💰 Cost Breakdown

**Free Tier:**
- 500 build minutes/month
- ~20-25 iOS builds/month
- Perfect for getting started

**Paid Plans:**
- Professional: $99/month (2,500 minutes = ~100 builds)
- Team: $299/month (10,000 minutes = ~400 builds)

## 🎯 Next Steps

After first successful build:
1. ✅ Test app on TestFlight
2. ✅ Set up automatic builds on push
3. ✅ Configure Android workflow
4. ✅ Add beta testers
5. ✅ Prepare for App Store submission

## 📚 Full Documentation

For detailed setup instructions, see: **CODEMAGIC_SETUP.md**

## 🆘 Need Help?

- Codemagic Docs: https://docs.codemagic.io/
- Codemagic Community: https://community.codemagic.io/
- Support: support@codemagic.io

---

**Pro Tip:** Enable automatic builds on push to `main` branch for continuous deployment!
