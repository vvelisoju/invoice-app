# Codemagic iOS Build Setup Guide

This guide will help you set up Codemagic CI/CD for building your Invoice Baba iOS app without needing a Mac.

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Enrolled in the Apple Developer Program
   - Access to App Store Connect

2. **Codemagic Account**
   - Sign up at https://codemagic.io
   - Connect your GitHub/GitLab/Bitbucket repository

3. **Required Certificates & Profiles**
   - iOS Distribution Certificate
   - App Store Provisioning Profile

## Step 1: Prepare Your Apple Developer Account

### 1.1 Create App ID
1. Go to https://developer.apple.com/account
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → Continue
5. Enter:
   - Description: `Invoice Baba`
   - Bundle ID: `com.invoicebaba.app` (Explicit)
6. Enable capabilities:
   - Push Notifications
   - Associated Domains (if using deep links)
7. Click **Continue** → **Register**

### 1.2 Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: Invoice Baba
   - Primary Language: English
   - Bundle ID: com.invoicebaba.app
   - SKU: invoice-baba-001
4. Click **Create**
5. Note down your **Apple ID** (numeric ID in the URL)

## Step 2: Set Up Codemagic

### 2.1 Connect Repository
1. Log in to https://codemagic.io
2. Click **Add application**
3. Select your Git provider (GitHub/GitLab/Bitbucket)
4. Authorize Codemagic to access your repository
5. Select the `Invoice-app` repository

### 2.2 Configure App Store Connect Integration
1. In Codemagic, go to **Teams** → **Integrations**
2. Click **App Store Connect**
3. Click **Add key**
4. You'll need to create an App Store Connect API key:
   
   **Creating App Store Connect API Key:**
   - Go to https://appstoreconnect.apple.com/access/api
   - Click **Keys** → **+** (Generate API Key)
   - Name: `Codemagic CI`
   - Access: **Admin** or **App Manager**
   - Click **Generate**
   - Download the `.p8` file (you can only download once!)
   - Note the **Issuer ID** and **Key ID**

5. Back in Codemagic, enter:
   - Key name: `codemagic`
   - Issuer ID: (from App Store Connect)
   - Key ID: (from App Store Connect)
   - API key: (paste contents of .p8 file)
6. Click **Save**

### 2.3 Configure iOS Code Signing
1. In your app settings, go to **Code signing identities**
2. Click **iOS code signing**
3. Choose **Automatic** (recommended) or **Manual**

**For Automatic (Recommended):**
- Codemagic will automatically manage certificates and profiles
- You need to provide your Apple Developer Portal credentials
- Click **Add certificate** → **Automatic**
- Enter your Apple ID and App-specific password

**Creating App-Specific Password:**
- Go to https://appleid.apple.com
- Sign in with your Apple ID
- Go to **Security** → **App-Specific Passwords**
- Click **Generate Password**
- Label: `Codemagic`
- Copy the generated password

**For Manual:**
- You need to upload your Distribution Certificate (.p12) and Provisioning Profile
- Generate these using Xcode on a Mac or using third-party tools

### 2.4 Set Environment Variables
1. Go to **Environment variables**
2. Add the following variables:

**Required Variables:**
```
VITE_API_URL=https://your-api-domain.com
APP_STORE_APPLE_ID=1234567890  # Your app's numeric ID from App Store Connect
```

**Firebase Variables (if using push notifications):**
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:ios:abcdef
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

**Optional Variables:**
```
CM_KEYSTORE_PASSWORD=your_keystore_password  # For Android
GOOGLE_SERVICES_JSON=base64_encoded_json  # For Android
```

3. Mark sensitive variables as **Secure** (they'll be encrypted)

## Step 3: Configure Firebase (for Push Notifications)

### 3.1 Add iOS App to Firebase
1. Go to https://console.firebase.google.com
2. Select your project
3. Click **Add app** → **iOS**
4. Enter Bundle ID: `com.invoicebaba.app`
5. Download `GoogleService-Info.plist`

### 3.2 Upload APNs Certificate to Firebase
1. In Firebase Console, go to **Project Settings** → **Cloud Messaging**
2. Under **Apple app configuration**, click **Upload**
3. You need an APNs Authentication Key:
   - Go to https://developer.apple.com/account/resources/authkeys
   - Click **+** → Select **Apple Push Notifications service (APNs)**
   - Download the `.p8` key file
   - Note the **Key ID**
4. Upload the `.p8` file to Firebase
5. Enter your **Team ID** (found in Apple Developer account)

### 3.3 Add GoogleService-Info.plist to iOS Project
1. Place `GoogleService-Info.plist` in `app/ios/App/App/` directory
2. Commit to your repository

## Step 4: Update codemagic.yaml

The `codemagic.yaml` file has been created in your project root. Update these values:

```yaml
# Line 13: Replace with your App Store Apple ID
APP_STORE_APPLE_ID: 1234567890

# Line 55: Replace with your email
recipients:
  - your-email@example.com

# Line 62: Update beta groups if needed
beta_groups:
  - Internal Testers
```

## Step 5: Commit and Push

```bash
git add codemagic.yaml
git commit -m "Add Codemagic CI/CD configuration"
git push origin main
```

## Step 6: Start Your First Build

1. Go to Codemagic dashboard
2. Select your app
3. Click **Start new build**
4. Select branch: `main` or `dev`
5. Select workflow: **ios-workflow**
6. Click **Start new build**

The build will:
1. Install npm dependencies
2. Build the React web app
3. Sync with Capacitor iOS
4. Set up code signing
5. Build the iOS app (.ipa)
6. Upload to TestFlight

## Step 7: Monitor Build

- Watch the build logs in real-time
- Build typically takes 15-25 minutes
- You'll receive an email when complete
- If successful, the app will appear in TestFlight within 10-15 minutes

## Troubleshooting

### Build Fails: Code Signing Error
- Verify your Apple Developer account credentials
- Check that your Bundle ID matches exactly: `com.invoicebaba.app`
- Ensure your provisioning profile includes the device UDIDs (for Ad Hoc)

### Build Fails: Missing GoogleService-Info.plist
- Ensure the file is committed to `app/ios/App/App/GoogleService-Info.plist`
- Check file permissions and path

### Build Fails: Node/npm Errors
- Clear Codemagic cache: Settings → Build → Clear cache
- Verify `package.json` has correct dependencies

### TestFlight Upload Fails
- Check App Store Connect API key permissions
- Verify the app exists in App Store Connect
- Ensure version/build number is higher than previous builds

### Environment Variables Not Working
- Ensure variables are set in Codemagic (not just in .env file)
- Check variable names match exactly (case-sensitive)
- Verify secure variables are properly encrypted

## Best Practices

1. **Use Separate Workflows**
   - `ios-workflow` for iOS builds
   - `android-workflow` for Android builds
   - Create a `dev-workflow` for development builds

2. **Version Management**
   - The workflow auto-increments build numbers
   - Update version number in `package.json` for major releases

3. **Branch Strategy**
   - Use `main` branch for production builds
   - Use `dev` branch for TestFlight beta builds
   - Configure automatic builds on push to specific branches

4. **Notifications**
   - Set up Slack/Discord webhooks for build notifications
   - Configure email alerts for failures

5. **Caching**
   - Codemagic caches `node_modules` by default
   - Speeds up subsequent builds significantly

## Cost Considerations

**Codemagic Free Tier:**
- 500 build minutes/month
- Unlimited team members
- Suitable for small projects

**Paid Plans:**
- Professional: $99/month (2,500 minutes)
- Team: $299/month (10,000 minutes)
- Enterprise: Custom pricing

**Build Time Estimates:**
- iOS build: ~15-25 minutes
- Android build: ~10-15 minutes
- With cache: ~8-12 minutes

## Additional Resources

- [Codemagic Documentation](https://docs.codemagic.io/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

## Support

If you encounter issues:
1. Check Codemagic build logs
2. Review [Codemagic Community](https://community.codemagic.io/)
3. Contact Codemagic support (support@codemagic.io)
4. Check Apple Developer Forums

---

**Note:** Keep your API keys, certificates, and passwords secure. Never commit them to your repository. Always use Codemagic's secure environment variables for sensitive data.
