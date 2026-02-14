# Invoice Baba - Frontend Client

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: JavaScript
- **Styling**: TailwindCSS
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Offline**: IndexedDB (Dexie)
- **PWA**: vite-plugin-pwa
- **Mobile**: Capacitor (Android/iOS)

## Project Structure
```
app/
├── src/
│   ├── ui/                # UI components & pages
│   ├── features/          # Feature modules
│   ├── domain/            # Business logic
│   ├── data/              # Repositories & API
│   ├── offline/           # IndexedDB & sync
│   ├── state/             # Global state
│   ├── pwa/               # Service worker
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Getting Started

### Installation
```bash
cd app
npm install
```

### Development
```bash
npm run dev
```
App will start on http://localhost:5173

### Build
```bash
npm run build
```
Output in `dist/`

### Preview Production Build
```bash
npm run preview
```

## Key Features

### 1. Offline-First Architecture
- All data writes go to IndexedDB first
- Outbox queue for pending sync
- Background sync when online
- Draft recovery on app restart

### 2. Invoice Creation Flow
- Minimal required fields
- Auto-save on every change
- Customer/product suggestions
- GST calculation (invoice-level)
- PDF generation (requires online)

### 3. Template Customization
- Visual editor with live preview
- Per-business configuration
- Color picker, toggles, layout controls
- Preview PDF before saving

### 4. WhatsApp Sharing
- Primary CTA after PDF generation
- OS share sheet integration
- Download and print options

### 5. Plan Limits
- Soft warnings at 80% usage
- Block with upgrade prompt at limit
- Clear messaging and upgrade path

## Offline Storage (IndexedDB)

### Tables
- `customers`
- `products`
- `invoices`
- `invoiceLineItems`
- `businessSettings`
- `templateConfigs`
- `outbox` (sync queue)
- `syncMeta` (sync state)

### Sync Strategy
1. Push outbox items to server (with idempotency)
2. Pull server deltas since last sync
3. Reconcile conflicts (last-write-wins)
4. Update local DB atomically

## Mobile App (Capacitor)

The app uses **Capacitor 5** to build native Android and iOS apps from the same React codebase.

### Capacitor Plugins (9 total)
| Plugin | Purpose |
|--------|---------|
| `@capacitor/app` | Back button, app state, deep links |
| `@capacitor/browser` | Open external URLs (WhatsApp, etc.) |
| `@capacitor/filesystem` | Save PDFs to device for sharing |
| `@capacitor/keyboard` | iOS keyboard behavior |
| `@capacitor/network` | Connectivity status monitoring |
| `@capacitor/push-notifications` | Native FCM push (iOS/Android) |
| `@capacitor/share` | Native share sheet for PDFs |
| `@capacitor/splash-screen` | App launch splash screen |
| `@capacitor/status-bar` | Status bar styling |

### Quick Start
```bash
# Build web assets + sync to native projects
npm run cap:build

# Open in Android Studio
npm run cap:open:android

# Open in Xcode (macOS only)
npm run cap:open:ios
```

### Development Workflow
```bash
# 1. Start dev server
npm run dev

# 2. In another terminal — sync and open IDE
npx cap sync
npx cap open android   # or: npx cap open ios
```

For **live reload** during development, temporarily add to `capacitor.config.json`:
```json
{
  "server": {
    "url": "http://YOUR_LOCAL_IP:5173",
    "cleartext": true
  }
}
```
> ⚠️ Remove this before production builds.

### Production Build
```bash
# 1. Build optimized web bundle
npm run build

# 2. Sync to native projects
npx cap sync

# 3. Open in IDE and build release
npx cap open android
npx cap open ios
```

### Firebase Push Notifications (FCM)

Push notifications are already implemented and work on both platforms.

**Android Setup:**
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add an Android app with package name `com.invoicebaba.app`
3. Download `google-services.json`
4. Place it in `android/app/google-services.json`

**iOS Setup:**
1. In the same Firebase project, add an iOS app with bundle ID `com.invoicebaba.app`
2. Download `GoogleService-Info.plist`
3. Place it in `ios/App/App/GoogleService-Info.plist`
4. Enable Push Notifications capability in Xcode
5. Configure APNs key in Firebase Console → Project Settings → Cloud Messaging

**Server Setup:**
- Set `FIREBASE_SERVICE_ACCOUNT_KEY` env var with the Firebase service account JSON

### Android Signing (Release Build)
1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore invoice-baba.jks -keyalg RSA -keysize 2048 -validity 10000 -alias invoicebaba
   ```
2. In Android Studio: Build → Generate Signed Bundle/APK
3. Or configure `android/app/build.gradle` with signing config

### iOS Signing (Release Build)
1. Open `ios/App/App.xcworkspace` in Xcode
2. Set your Team in Signing & Capabilities
3. Configure provisioning profiles
4. Archive and upload to App Store Connect

### Splash Screen & App Icon
- **Android**: Replace files in `android/app/src/main/res/drawable*/`
- **iOS**: Replace files in `ios/App/App/Assets.xcassets/`
- Source assets: `public/assets/brand/` (icon.png, logo-full.png)

### Troubleshooting
- **White screen on launch**: Ensure `npm run build` was run before `npx cap sync`
- **API calls failing**: Check `VITE_API_URL` points to your production server (not localhost)
- **Push not working**: Verify `google-services.json` / `GoogleService-Info.plist` are in place
- **PDF download not working**: The app uses `@capacitor/filesystem` + `@capacitor/share` on native — ensure both plugins are synced

## Testing
```bash
npm test
```

## Linting & Formatting
```bash
npm run lint
npm run format
```

## PWA Features
- Offline app shell caching
- Background sync
- Update notifications
- Install prompt

## Environment Variables
Create `.env.local`:
```
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Invoice App
```

## Production Deployment
- Build optimized bundle
- Deploy to CDN (Vercel, Netlify, Cloudflare Pages)
- Configure service worker caching
- Set up analytics and error tracking
