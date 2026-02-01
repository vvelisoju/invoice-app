# Invoice App - Frontend Client

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

### Setup
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
```

### Build & Sync
```bash
npm run build
npx cap sync
```

### Open in Native IDE
```bash
npx cap open android
npx cap open ios
```

### Required Plugins
- `@capacitor/share` (WhatsApp sharing)
- `@capacitor/filesystem` (PDF storage)
- `@capacitor/network` (connectivity status)

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
