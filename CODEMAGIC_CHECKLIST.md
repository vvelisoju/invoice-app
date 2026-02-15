# Codemagic iOS Build Checklist

Use this checklist to ensure you've completed all necessary steps for iOS builds on Codemagic.

## ✅ Pre-Build Checklist

### Apple Developer Account
- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] Created App ID: `com.invoicebaba.app`
- [ ] Enabled Push Notifications capability
- [ ] Created app in App Store Connect
- [ ] Noted App Store Apple ID (numeric ID from URL)

### App Store Connect API Key
- [ ] Generated API key in App Store Connect
- [ ] Downloaded `.p8` key file (saved securely)
- [ ] Noted Issuer ID
- [ ] Noted Key ID
- [ ] Added API key to Codemagic integration

### Code Signing
- [ ] Set up automatic code signing in Codemagic
- [ ] Added Apple ID credentials
- [ ] Generated app-specific password
- [ ] Verified Bundle ID: `com.invoicebaba.app`

### Firebase Setup (Optional)
- [ ] Added iOS app to Firebase project
- [ ] Downloaded `GoogleService-Info.plist`
- [ ] Placed file in `app/ios/App/App/` directory
- [ ] Generated APNs authentication key (.p8)
- [ ] Uploaded APNs key to Firebase
- [ ] Committed `GoogleService-Info.plist` to repository

### Codemagic Configuration
- [ ] Connected repository to Codemagic
- [ ] Reviewed `codemagic.yaml` configuration
- [ ] Updated `APP_STORE_APPLE_ID` in codemagic.yaml
- [ ] Updated email recipients in codemagic.yaml
- [ ] Committed codemagic.yaml to repository

### Environment Variables
- [ ] Added `VITE_API_URL`
- [ ] Added `APP_STORE_APPLE_ID`
- [ ] Added Firebase variables (if using push notifications):
  - [ ] `VITE_FIREBASE_API_KEY`
  - [ ] `VITE_FIREBASE_AUTH_DOMAIN`
  - [ ] `VITE_FIREBASE_PROJECT_ID`
  - [ ] `VITE_FIREBASE_STORAGE_BUCKET`
  - [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `VITE_FIREBASE_APP_ID`
  - [ ] `VITE_FIREBASE_VAPID_KEY`
- [ ] Marked sensitive variables as "Secure"

## 🚀 Build Checklist

### First Build
- [ ] Started build from Codemagic dashboard
- [ ] Selected `ios-workflow`
- [ ] Monitored build logs
- [ ] Build completed successfully
- [ ] Received success email notification

### TestFlight
- [ ] App appeared in TestFlight (10-15 min after build)
- [ ] Added internal testers
- [ ] Sent test invitations
- [ ] Testers received invitation emails
- [ ] Testers installed app successfully

### Testing
- [ ] App launches without crashes
- [ ] Authentication works
- [ ] Invoice creation works
- [ ] PDF generation works
- [ ] Push notifications work (if enabled)
- [ ] All core features functional

## 🔄 Post-Build Checklist

### Automation
- [ ] Configured automatic builds on push to `main`
- [ ] Set up build triggers for specific branches
- [ ] Configured build notifications (Slack/Discord)

### Version Management
- [ ] Updated version in `package.json`
- [ ] Build number auto-increments correctly
- [ ] Version matches App Store Connect

### Documentation
- [ ] Updated README with build instructions
- [ ] Documented environment variables
- [ ] Created release notes

## 📋 Pre-Release Checklist

### App Store Submission
- [ ] Completed app metadata in App Store Connect
- [ ] Added app screenshots (all required sizes)
- [ ] Added app icon (1024x1024)
- [ ] Wrote app description
- [ ] Added privacy policy URL
- [ ] Added support URL
- [ ] Set age rating
- [ ] Added app category
- [ ] Set pricing (Free/Paid)

### Compliance
- [ ] Completed export compliance questionnaire
- [ ] Added content rights information
- [ ] Reviewed App Store Review Guidelines
- [ ] Prepared for app review

### Final Testing
- [ ] Tested on multiple iOS versions
- [ ] Tested on different device sizes
- [ ] Tested all user flows
- [ ] Fixed all critical bugs
- [ ] Performance testing completed

## 🐛 Troubleshooting Checklist

If build fails, check:
- [ ] Build logs for specific error messages
- [ ] Code signing configuration
- [ ] Environment variables are set correctly
- [ ] Bundle ID matches everywhere
- [ ] Provisioning profile is valid
- [ ] Certificates haven't expired
- [ ] Node/npm versions are correct
- [ ] Dependencies install successfully
- [ ] Capacitor sync completes
- [ ] Xcode version is compatible

## 📊 Build Metrics

Track your builds:
- First build date: ___________
- Average build time: ___________
- Build success rate: ___________
- Monthly build count: ___________
- TestFlight testers: ___________

## 🎯 Goals

- [ ] First successful build
- [ ] First TestFlight deployment
- [ ] 10 beta testers
- [ ] 100 beta testers
- [ ] App Store submission
- [ ] App Store approval
- [ ] First public release

## 📝 Notes

Use this space for notes, issues, or reminders:

```
Date: ___________
Issue: ___________
Solution: ___________

Date: ___________
Issue: ___________
Solution: ___________
```

---

**Last Updated:** [Date]
**Build Status:** [Pending/Success/Failed]
**Current Version:** [Version Number]
