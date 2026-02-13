# Notification System Design — Invoice Baba

> **Version**: 1.0  
> **Date**: 2026-02-13  
> **Status**: Design (Pre-Implementation)

---

## 1. Overview

A full in-app + push-ready notification system for Invoice Baba. Phase 1 delivers **in-app notifications** (bell icon, notification center, read/unread tracking). Phase 2 adds **Firebase Cloud Messaging (FCM)** push delivery for mobile (Capacitor) and web.

### Design Principles
- **Event-driven**: Notifications are triggered by business events (invoice issued, plan changed, etc.) via a central `NotificationService`
- **Two audiences**: System-generated notifications for users + Super Admin custom broadcasts
- **Push-ready**: Architecture supports FCM from day one; Phase 1 stores device tokens but doesn't send pushes
- **Minimal coupling**: Existing features call `NotificationService.emit()` — they don't know about delivery channels
- **Offline-friendly**: In-app notifications are fetched via API polling; push is additive

---

## 2. Database Schema (Already Exists)

The Prisma schema already has the three required models. **No migrations needed.**

### 2.1 `Notification` (the message itself)
```
id            String   @id @default(uuid())
templateKey   String?                // predefined template key (e.g., "invoice_issued")
title         String
body          String
type          String                 // "PUSH" | "IN_APP" | "BOTH"
targetType    String                 // "ALL" | "PLAN" | "BUSINESS" | "USER"
targetId      String?                // planId, businessId, or userId depending on targetType
data          Json?                  // deep-link URL, action metadata, entity references
sentBy        String?                // admin userId who sent it (null = system-generated)
sentAt        DateTime
totalTargets  Int      @default(0)
delivered     Int      @default(0)
failed        Int      @default(0)
```

### 2.2 `NotificationRead` (per-user read tracking)
```
id             String   @id @default(uuid())
notificationId String
userId         String
readAt         DateTime @default(now())
@@unique([notificationId, userId])
```

### 2.3 `DeviceToken` (FCM tokens for Phase 2)
```
id        String   @id @default(uuid())
userId    String
token     String   @unique   // FCM device token
platform  String             // "web" | "android" | "ios"
isActive  Boolean  @default(true)
```

---

## 3. Notification Templates (Predefined Events)

Each system event maps to a `templateKey`. The service uses these to build `title` and `body` with variable interpolation.

### 3.1 Template Registry

| # | templateKey | Category | targetType | Trigger Point | title | body |
|---|-------------|----------|------------|---------------|-------|------|
| 1 | `welcome` | Onboarding | USER | After first login / business creation | "Welcome to Invoice Baba! 🎉" | "Your business {businessName} is ready. Create your first invoice now!" |
| 2 | `invoice_issued` | Invoice | USER | `POST /invoices/:id/issue` | "Invoice {invoiceNumber} Issued" | "Invoice {invoiceNumber} for ₹{total} to {customerName} has been issued." |
| 3 | `invoice_paid` | Invoice | USER | `PATCH /invoices/:id/status` → PAID | "Payment Received! ₹{total}" | "Invoice {invoiceNumber} to {customerName} marked as paid." |
| 4 | `invoice_overdue` | Invoice | USER | Scheduled cron (daily) | "Invoice Overdue: {invoiceNumber}" | "Invoice {invoiceNumber} for ₹{total} was due on {dueDate}. Follow up with {customerName}." |
| 5 | `invoice_cancelled` | Invoice | USER | `PATCH /invoices/:id/status` → CANCELLED | "Invoice Cancelled" | "Invoice {invoiceNumber} has been cancelled." |
| 6 | `plan_activated` | Plan | USER | `POST /plans/verify-payment` | "Plan Activated: {planName}" | "Your {planName} plan is now active. Enjoy premium features!" |
| 7 | `plan_expiring_soon` | Plan | USER | Scheduled cron (7 days before expiry) | "Plan Expiring Soon" | "Your {planName} plan expires on {expiryDate}. Renew to avoid interruption." |
| 8 | `plan_expired` | Plan | USER | Scheduled cron (on expiry day) | "Plan Expired" | "Your {planName} plan has expired. Upgrade to continue using premium features." |
| 9 | `plan_changed_by_admin` | Plan | USER | Admin `PATCH /admin/businesses/:id/plan` | "Plan Updated" | "Your plan has been changed to {planName} by the administrator." |
| 10 | `usage_limit_warning` | Usage | USER | Invoice creation when ≥80% of monthly limit | "Usage Limit Warning" | "You've used {used}/{limit} invoices this month. Upgrade your plan for more." |
| 11 | `usage_limit_reached` | Usage | USER | Invoice creation when 100% of monthly limit | "Monthly Limit Reached" | "You've reached your {limit} invoice limit for this month. Upgrade to continue." |
| 12 | `business_suspended` | Account | USER | Admin `PATCH /admin/businesses/:id/status` → SUSPENDED | "Account Suspended" | "Your business account has been suspended. Contact support for details." |
| 13 | `business_reactivated` | Account | USER | Admin `PATCH /admin/businesses/:id/status` → ACTIVE (from SUSPENDED/BANNED) | "Account Reactivated" | "Your business account is now active again. Welcome back!" |
| 14 | `payment_success` | Billing | USER | Razorpay webhook / verify-payment | "Payment Successful" | "₹{amount} payment for {planName} received. Invoice #{invoiceNumber} generated." |
| 15 | `payment_failed` | Billing | USER | Razorpay webhook (failed) | "Payment Failed" | "Your payment of ₹{amount} for {planName} failed. Please try again." |
| 16 | `new_feature` | Platform | ALL | Admin custom notification | "New Feature: {featureName}" | "{description}" |
| 17 | `maintenance` | Platform | ALL | Admin custom notification | "Scheduled Maintenance" | "Invoice Baba will be under maintenance on {date} from {startTime} to {endTime}." |
| 18 | `custom` | Custom | varies | Admin sends custom notification | "{title}" | "{body}" |

### 3.2 Template Interpolation

```js
// Example: resolveTemplate('invoice_issued', { invoiceNumber: 'INV-001', total: '5000', customerName: 'Acme' })
// → { title: "Invoice INV-001 Issued", body: "Invoice INV-001 for ₹5000 to Acme has been issued." }
```

Variables are replaced using `{variableName}` syntax in title/body strings.

---

## 4. Architecture

### 4.1 System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TRIGGER SOURCES                              │
│                                                                     │
│  Invoice Service ──┐                                                │
│  Plan Service    ──┤                                                │
│  Auth Service    ──┼──► NotificationService.emit(templateKey, ctx)  │
│  Admin Service   ──┤         │                                      │
│  Cron Jobs       ──┘         ▼                                      │
│                     ┌────────────────┐                              │
│                     │ Template Engine │ Resolve title/body           │
│                     └───────┬────────┘                              │
│                             ▼                                       │
│                     ┌────────────────┐                              │
│                     │ Target Resolver│ Determine target users       │
│                     └───────┬────────┘                              │
│                             ▼                                       │
│                     ┌────────────────┐                              │
│                     │ Notification DB│ Insert Notification record   │
│                     └───────┬────────┘                              │
│                             ▼                                       │
│                     ┌────────────────┐                              │
│                     │ Channel Router │ IN_APP / PUSH / BOTH         │
│                     └───────┬────────┘                              │
│                        ┌────┴────┐                                  │
│                        ▼         ▼                                  │
│                   [IN_APP]    [PUSH]                                │
│                   (stored)   (Phase 2: FCM)                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        CONSUMPTION                                  │
│                                                                     │
│  Frontend (User)                                                    │
│    ├── Bell icon with unread badge (header)                         │
│    ├── Notification dropdown / panel                                │
│    ├── Mark as read (individual / all)                              │
│    └── Click → deep-link navigation                                 │
│                                                                     │
│  Frontend (Admin)                                                   │
│    ├── Notification management page                                 │
│    ├── Send custom notification form                                │
│    ├── View sent notifications + delivery stats                     │
│    └── Notification history with filters                            │
│                                                                     │
│  Mobile (Phase 2)                                                   │
│    ├── FCM push → system notification tray                          │
│    ├── Tap → deep-link into app                                     │
│    └── Badge count on app icon                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Target Resolution

| targetType | targetId | Resolved Users |
|------------|----------|----------------|
| `USER` | userId | Single user |
| `BUSINESS` | businessId | Business owner (User who owns the business) |
| `PLAN` | planId | All users whose business is on that plan |
| `ALL` | null | All active users |

### 4.3 Deep-Link Data Schema

The `data` JSON field stores navigation context:

```json
{
  "action": "navigate",       // "navigate" | "open_url" | "none"
  "route": "/invoices/abc123", // frontend route to navigate to
  "entityType": "invoice",     // for context: invoice, plan, business, etc.
  "entityId": "abc123",        // entity ID
  "url": null                  // external URL (for open_url action)
}
```

---

## 5. Backend Implementation Plan

### 5.1 New Files

```
server/src/features/notifications/
  ├── routes.js           # API routes (user + admin)
  ├── handlers.js         # Request handlers
  ├── service.js          # Core notification logic
  └── templates.js        # Template registry + interpolation
```

### 5.2 API Endpoints

#### User Endpoints (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/notifications` | List notifications for current user (paginated, newest first) |
| `GET` | `/notifications/unread-count` | Get unread notification count (for badge) |
| `POST` | `/notifications/:id/read` | Mark a single notification as read |
| `POST` | `/notifications/read-all` | Mark all notifications as read |
| `POST` | `/notifications/device-token` | Register/update FCM device token (Phase 2 ready) |
| `DELETE` | `/notifications/device-token` | Remove device token (logout/unregister) |

#### Admin Endpoints (super admin)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/notifications` | List all sent notifications (paginated, with delivery stats) |
| `GET` | `/admin/notifications/:id` | Get single notification details + read stats |
| `POST` | `/admin/notifications` | Send a custom notification (broadcast or targeted) |
| `GET` | `/admin/notifications/templates` | List available notification templates |

### 5.3 Service Methods

```js
// ── Core ──────────────────────────────────────────────────────────
NotificationService.emit(templateKey, context)
  // Main entry point. Called by other services.
  // context: { userId, businessId, planId, data, variables }

NotificationService.sendCustom(adminUserId, { title, body, targetType, targetId, data })
  // Admin sends a custom notification

// ── Query ─────────────────────────────────────────────────────────
NotificationService.listForUser(userId, { limit, offset, unreadOnly })
  // Returns notifications targeted at this user (USER + BUSINESS + PLAN + ALL)

NotificationService.getUnreadCount(userId)
  // Returns count of unread notifications

NotificationService.markAsRead(userId, notificationId)
NotificationService.markAllAsRead(userId)

// ── Admin ─────────────────────────────────────────────────────────
NotificationService.listAll({ limit, offset, targetType, templateKey })
NotificationService.getDetails(notificationId)

// ── Device Tokens (Phase 2 ready) ────────────────────────────────
NotificationService.registerDeviceToken(userId, token, platform)
NotificationService.removeDeviceToken(userId, token)
```

### 5.4 Query Strategy for User Notifications

A user sees notifications where:
1. `targetType = 'USER'` AND `targetId = user.id`
2. `targetType = 'BUSINESS'` AND `targetId = user.businessId`
3. `targetType = 'PLAN'` AND `targetId = user.business.planId`
4. `targetType = 'ALL'`

```sql
SELECT n.* FROM "Notification" n
WHERE
  (n."targetType" = 'ALL')
  OR (n."targetType" = 'USER' AND n."targetId" = $userId)
  OR (n."targetType" = 'BUSINESS' AND n."targetId" = $businessId)
  OR (n."targetType" = 'PLAN' AND n."targetId" = $planId)
ORDER BY n."sentAt" DESC
LIMIT $limit OFFSET $offset
```

Unread = no row in `NotificationRead` for this `(notificationId, userId)`.

---

## 6. Integration Points (Where to Add `emit()` Calls)

### 6.1 Invoice Service → `server/src/features/invoices/service.js`

| Event | Where | Template | Variables |
|-------|-------|----------|-----------|
| Invoice issued | After `handleIssueInvoice` succeeds | `invoice_issued` | `invoiceNumber, total, customerName` |
| Invoice paid | After `handleUpdateStatus` → PAID | `invoice_paid` | `invoiceNumber, total, customerName` |
| Invoice cancelled | After `handleUpdateStatus` → CANCELLED | `invoice_cancelled` | `invoiceNumber` |

### 6.2 Plan Service → `server/src/features/plans/service.js` (or handlers)

| Event | Where | Template | Variables |
|-------|-------|----------|-----------|
| Plan activated | After `verifyPayment` succeeds | `plan_activated` | `planName` |
| Payment success | After `verifyPayment` succeeds | `payment_success` | `amount, planName, invoiceNumber` |
| Payment failed | After Razorpay webhook (future) | `payment_failed` | `amount, planName` |

### 6.3 Admin Service → `server/src/features/admin/service.js`

| Event | Where | Template | Variables |
|-------|-------|----------|-----------|
| Business suspended | After `updateBusinessStatus` → SUSPENDED | `business_suspended` | — |
| Business reactivated | After `updateBusinessStatus` → ACTIVE | `business_reactivated` | — |
| Plan changed by admin | After `updateBusinessPlan` | `plan_changed_by_admin` | `planName` |

### 6.4 Auth Service → `server/src/features/auth/service.js`

| Event | Where | Template | Variables |
|-------|-------|----------|-----------|
| Welcome | After first business creation (or first login) | `welcome` | `businessName` |

### 6.5 Scheduled Jobs (New: Cron)

| Event | Schedule | Template | Variables |
|-------|----------|----------|-----------|
| Invoice overdue | Daily at 9:00 AM IST | `invoice_overdue` | `invoiceNumber, total, dueDate, customerName` |
| Plan expiring soon | Daily at 10:00 AM IST | `plan_expiring_soon` | `planName, expiryDate` |
| Plan expired | Daily at 10:00 AM IST | `plan_expired` | `planName` |
| Usage limit warning | On invoice create (≥80%) | `usage_limit_warning` | `used, limit` |
| Usage limit reached | On invoice create (100%) | `usage_limit_reached` | `limit` |

> **Note**: For V1, overdue/plan-expiry checks can be simple interval-based checks using `setInterval` or a lightweight scheduler like `node-cron`. No need for a heavy job queue.

---

## 7. Frontend Implementation Plan

### 7.1 New Files

```
app/src/features/notifications/
  ├── NotificationBell.jsx         # Bell icon + unread badge (header component)
  ├── NotificationPanel.jsx        # Dropdown/slide-over panel listing notifications
  ├── NotificationItem.jsx         # Single notification row
  └── useNotifications.js          # TanStack Query hooks

app/src/features/admin/
  └── AdminNotificationsPage.jsx   # Admin: send + view notifications
```

### 7.2 User-Facing Components

#### NotificationBell (in AppHeader)
- Bell icon (Lucide `Bell`) in the top-right of `AppHeader`
- Red badge with unread count (hidden when 0)
- Polls `/notifications/unread-count` every 30 seconds (TanStack Query `refetchInterval`)
- Click → opens `NotificationPanel`

#### NotificationPanel
- Slide-over panel (mobile) or dropdown (desktop) anchored to bell
- Header: "Notifications" + "Mark all as read" link
- Scrollable list of `NotificationItem` components
- Infinite scroll / "Load more" pagination
- Empty state: "No notifications yet"

#### NotificationItem
- Unread indicator (blue dot)
- Icon based on `templateKey` category (invoice → FileText, plan → Crown, account → Shield, etc.)
- Title (bold if unread)
- Body (truncated to 2 lines)
- Relative time ("2m ago", "1h ago", "Yesterday")
- Click → mark as read + navigate to `data.route` (if present)

### 7.3 Admin Notifications Page

#### Route: `/admin/notifications`

**Two tabs:**

**Tab 1: Send Notification**
- Form fields:
  - **Target**: Radio group → All Users | Specific Plan | Specific Business | Specific User
  - **Plan/Business/User selector**: Conditional searchable dropdown based on target
  - **Title**: Text input (required)
  - **Body**: Textarea (required)
  - **Deep Link Route**: Optional text input (e.g., `/plans`)
- "Send Notification" button
- Confirmation dialog before sending

**Tab 2: Notification History**
- DataTable with columns: Title, Target, Type, Sent At, Targets, Delivered, Read
- Filters: targetType, date range
- Click row → detail view with read stats

### 7.4 Hooks (`useNotifications.js`)

```js
// User hooks
useNotifications({ limit, offset, unreadOnly })   // GET /notifications
useUnreadCount()                                    // GET /notifications/unread-count (polling)
useMarkAsRead()                                     // POST /notifications/:id/read (mutation)
useMarkAllAsRead()                                  // POST /notifications/read-all (mutation)

// Admin hooks
useAdminNotifications({ limit, offset })            // GET /admin/notifications
useSendNotification()                               // POST /admin/notifications (mutation)
```

### 7.5 API Client Additions (`lib/api.js`)

```js
// Notification API (User)
export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  registerDeviceToken: (data) => api.post('/notifications/device-token', data),
  removeDeviceToken: () => api.delete('/notifications/device-token'),
}

// Admin API additions
adminApi.listNotifications = (params) => api.get('/admin/notifications', { params })
adminApi.getNotification = (id) => api.get(`/admin/notifications/${id}`)
adminApi.sendNotification = (data) => api.post('/admin/notifications', data)
adminApi.getNotificationTemplates = () => api.get('/admin/notifications/templates')
```

---

## 8. Phase 2: Firebase Push Notifications

### 8.1 Prerequisites
- Firebase project created
- `FIREBASE_SERVICE_ACCOUNT_KEY` env var (server-side)
- `firebase-messaging` SDK on frontend + Capacitor Push plugin

### 8.2 Server Changes
- Add `firebase-admin` package
- New file: `server/src/common/firebase.js` — initialize Firebase Admin SDK
- `NotificationService` gains a `sendPush(userIds, notification)` method
- When `type = 'PUSH'` or `'BOTH'`, after DB insert, call `sendPush`
- Batch FCM sends (up to 500 tokens per `sendEachForMulticast`)
- Handle token invalidation (remove stale tokens from `DeviceToken`)

### 8.3 Frontend Changes
- Initialize Firebase Messaging in `App.jsx` or a dedicated `initFirebase.js`
- Request notification permission on first login
- On token received → `POST /notifications/device-token`
- On token refresh → update device token
- Service Worker for background push (`firebase-messaging-sw.js`)

### 8.4 Capacitor (Mobile) Changes
- `@capacitor/push-notifications` plugin
- Register for push on app start
- Handle push tap → deep-link to `data.route`
- Badge count management

### 8.5 Config Additions

```env
# .env (server)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# .env (frontend)  
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

---

## 9. Notification Lifecycle & Retention

| Aspect | Policy |
|--------|--------|
| **Retention** | Keep notifications for 90 days, then auto-delete (cron job) |
| **Max per user** | Show last 100 notifications in the panel |
| **Rate limiting** | Max 1 notification per templateKey per user per hour (dedup) |
| **Batch dedup** | If admin sends to "ALL" with 1000 users, create 1 `Notification` row (not 1000) |
| **Read tracking** | `NotificationRead` row created on first view/click |

---

## 10. Implementation Order

### Phase 1A: Core Backend (Estimated: 1 day)
1. `server/src/features/notifications/templates.js` — Template registry + interpolation
2. `server/src/features/notifications/service.js` — Core service (emit, query, read tracking)
3. `server/src/features/notifications/handlers.js` — Request handlers
4. `server/src/features/notifications/routes.js` — User + admin routes
5. Register notification routes in `server/src/index.js`

### Phase 1B: Integration Hooks (Estimated: 0.5 day)
6. Add `emit()` calls in invoice service/handlers (issued, paid, cancelled)
7. Add `emit()` calls in admin service (business status, plan change)
8. Add `emit()` calls in plan handlers (plan activated, payment success)
9. Add `emit()` call in auth service (welcome notification)

### Phase 1C: Frontend — User Notifications (Estimated: 1 day)
10. `notificationApi` in `lib/api.js`
11. `useNotifications.js` hooks
12. `NotificationBell.jsx` component
13. `NotificationPanel.jsx` + `NotificationItem.jsx`
14. Integrate `NotificationBell` into `AppHeader`

### Phase 1D: Frontend — Admin Panel (Estimated: 0.5 day)
15. `AdminNotificationsPage.jsx`
16. Add admin notification API methods
17. Add route `/admin/notifications` in `App.jsx`
18. Add nav link in `AdminLayout`

### Phase 1E: Scheduled Notifications (Estimated: 0.5 day)
19. Cron for invoice overdue check
20. Cron for plan expiry warnings
21. Cron for notification cleanup (90-day retention)
22. Usage limit warnings in invoice creation flow

### Phase 2: Push Notifications (Future)
23. Firebase Admin SDK setup
24. Push delivery in NotificationService
25. Frontend Firebase Messaging init
26. Capacitor push plugin integration
27. Service worker for background notifications

---

## 11. Data Flow Examples

### Example 1: Invoice Issued
```
User clicks "Issue" on invoice page
  → Frontend: POST /invoices/:id/issue
  → Backend: invoiceService.issueInvoice()
    → Updates invoice status to ISSUED
    → Calls NotificationService.emit('invoice_issued', {
        userId: business.ownerUserId,
        businessId: invoice.businessId,
        variables: { invoiceNumber: 'INV-001', total: '5,000', customerName: 'Acme Corp' },
        data: { action: 'navigate', route: '/invoices/abc123', entityType: 'invoice', entityId: 'abc123' }
      })
    → NotificationService:
      1. Resolves template → title: "Invoice INV-001 Issued", body: "Invoice INV-001 for ₹5,000..."
      2. Determines targetType: USER, targetId: userId
      3. Inserts Notification row
      4. (Phase 2) Sends FCM push if user has device tokens
  → Response: { data: invoice }

Next time user opens app / notification panel:
  → Frontend polls GET /notifications/unread-count → count: 1
  → Bell shows red badge "1"
  → User clicks bell → GET /notifications → sees "Invoice INV-001 Issued"
  → User clicks notification → POST /notifications/:id/read + navigate to /invoices/abc123
```

### Example 2: Admin Sends Custom Broadcast
```
Admin fills form on AdminNotificationsPage:
  Title: "New Feature: Multi-Currency Support"
  Body: "You can now create invoices in USD, EUR, and GBP!"
  Target: All Users
  Deep Link: /settings

  → Frontend: POST /admin/notifications { title, body, targetType: 'ALL', data: { route: '/settings' } }
  → Backend: NotificationService.sendCustom(adminUserId, payload)
    1. Inserts Notification row (targetType: ALL, sentBy: adminUserId)
    2. Counts total active users → sets totalTargets
    3. (Phase 2) Batch FCM send to all device tokens
  → Admin sees notification in history with delivery stats
  
All users see it next time they poll /notifications/unread-count
```

---

## 12. Error Handling

| Scenario | Handling |
|----------|----------|
| `emit()` fails | Log error, do NOT fail the parent operation (fire-and-forget with try/catch) |
| Invalid template key | Log warning, skip notification |
| User has no business (targetType=BUSINESS) | Skip notification for that user |
| FCM token expired (Phase 2) | Mark `DeviceToken.isActive = false`, remove from future sends |
| Admin sends to non-existent target | Return 404 validation error |
| Rate limit exceeded (same notification type) | Skip silently, log info |

---

## 13. Security Considerations

- **User endpoints**: Can only read/mark-read their own notifications (filtered by userId + business context)
- **Admin endpoints**: Require `SUPER_ADMIN` role (existing `authenticateAdmin` middleware)
- **No delete**: Users cannot delete notifications (only mark as read). Cleanup is automated.
- **Input sanitization**: Admin custom notification title/body are stored as plain text, rendered with HTML escaping on frontend
- **Rate limiting**: Admin custom sends are rate-limited (e.g., max 10 broadcasts per hour)
- **Device tokens**: Validated on registration, stale tokens pruned automatically

---

## 14. Monitoring & Observability

- Log every `emit()` call with `templateKey`, `targetType`, and result
- Log FCM delivery failures with token details (Phase 2)
- Dashboard widget on Admin page: "Notifications sent today", "Unread rate"
- Optional: Add notification stats to existing `/admin/dashboard` endpoint

---

## 15. File Change Summary

### New Files (to create)
| File | Purpose |
|------|---------|
| `server/src/features/notifications/templates.js` | Template registry + variable interpolation |
| `server/src/features/notifications/service.js` | Core notification service |
| `server/src/features/notifications/handlers.js` | API request handlers |
| `server/src/features/notifications/routes.js` | Fastify route definitions |
| `app/src/features/notifications/NotificationBell.jsx` | Bell icon + badge |
| `app/src/features/notifications/NotificationPanel.jsx` | Notification list panel |
| `app/src/features/notifications/NotificationItem.jsx` | Single notification row |
| `app/src/features/notifications/useNotifications.js` | TanStack Query hooks |
| `app/src/features/admin/AdminNotificationsPage.jsx` | Admin notification management |

### Existing Files (to modify)
| File | Change |
|------|--------|
| `server/src/index.js` | Import + register notification routes |
| `server/src/features/invoices/handlers.js` | Add `emit()` after issue/status-change |
| `server/src/features/plans/handlers.js` | Add `emit()` after payment verification |
| `server/src/features/admin/service.js` | Add `emit()` after business status/plan changes |
| `server/src/features/auth/service.js` | Add `emit()` on first login/business creation |
| `app/src/lib/api.js` | Add `notificationApi` + admin notification methods |
| `app/src/components/layout/AppHeader.jsx` | Add `NotificationBell` component |
| `app/src/features/admin/AdminLayout.jsx` | Add notifications nav link |
| `app/src/App.jsx` | Add `/admin/notifications` route |

---

## Approval Checklist

- [ ] Schema models reviewed (already in Prisma) — no migration needed
- [ ] Template list approved (17 system + 1 custom)
- [ ] API endpoint design approved
- [ ] Integration points confirmed
- [ ] Phase 2 (FCM) approach agreed
- [ ] Implementation order agreed

---

*Ready for implementation upon approval.*
