# Invoice App - Testing Guide

## Prerequisites

### Backend Setup
1. **Database**: Ensure PostgreSQL is running
2. **Environment**: Copy `.env.example` to `.env` and configure:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/invoice_app"
   JWT_SECRET="your-secret-key"
   PORT=3000
   ```
3. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```
4. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```
5. **Seed default data** (optional - create a Free plan):
   ```bash
   npx prisma db seed
   ```
6. **Start server**:
   ```bash
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

### Frontend Setup
1. **Install dependencies**:
   ```bash
   cd app
   npm install
   ```
2. **Configure API URL** in `app/src/lib/api.js`:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000'
   ```
3. **Start development server**:
   ```bash
   npm run dev
   ```
   App should open in browser at `http://localhost:5173`

---

## Test Plan: Phase by Phase

### Phase 1: MVP (OTP Auth + Invoice Creation + PDF)

#### Test 1.1: OTP Registration & Authentication ✅

**Steps:**
1. Open app in browser
2. You should see the Phone Number entry screen
3. Enter a valid Indian phone number (e.g., `9876543210`)
4. Click "Send OTP"

**Expected:**
- Backend logs show OTP generated (check console)
- OTP is logged in server console (for testing)
- Frontend navigates to OTP verification screen

**Verify:**
5. Enter the OTP from server logs (6-digit code)
6. Click "Verify"

**Expected:**
- JWT token is generated and stored
- Business is auto-created for the user
- User is redirected to Home page (`/home`)
- Bottom tab navigation is visible

**Database Check:**
```sql
SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM "Business" ORDER BY "createdAt" DESC LIMIT 1;
```

---

#### Test 1.2: Create First Invoice (Draft) ✅

**Steps:**
1. From Home page, click "New Invoice" button
2. You should see the New Invoice form

**Fill Invoice Details:**
3. **Customer**: 
   - Click on customer typeahead
   - Type "Acme Corp" (new customer)
   - Select "Add new customer: Acme Corp"
   - Customer should be added to local IndexedDB

4. **Invoice Date**: Should default to today
5. **Due Date**: Set to 7 days from now (optional)

6. **Line Items**:
   - Click "Add Item"
   - Product: Type "Web Design" → Add new
   - Quantity: 1
   - Rate: 50000
   - Line total should auto-calculate to ₹50,000

7. **Add another item**:
   - Product: "Logo Design"
   - Quantity: 1
   - Rate: 10000
   - Subtotal should show ₹60,000

8. **Tax** (expand Advanced Details):
   - Tax Rate: 18%
   - Tax should calculate to ₹10,800
   - Total: ₹70,800

9. **Notes**: "Thank you for your business"
10. Click "Save Draft"

**Expected:**
- Invoice is saved to IndexedDB (local storage)
- Invoice has auto-generated number (e.g., INV-0001)
- Success toast appears
- You can navigate away and come back - data persists

**IndexedDB Check** (Browser DevTools → Application → IndexedDB):
- `invoices` table should have 1 entry
- `invoiceLineItems` table should have 2 entries
- `customers` table should have "Acme Corp"
- `products` table should have "Web Design" and "Logo Design"

---

#### Test 1.3: Generate PDF from Invoice ✅

**Steps:**
1. From the New Invoice page (with saved draft), click "Generate PDF"
2. You should navigate to `/invoices/{id}/pdf`

**Expected:**
- PDF preview loads (may take a few seconds)
- PDF shows:
  - Invoice number (INV-0001)
  - Business name (if set)
  - Customer: Acme Corp
  - Line items with quantities and rates
  - Subtotal: ₹60,000
  - Tax (18%): ₹10,800
  - Total: ₹70,800
  - Notes section

3. Click "Download PDF"

**Expected:**
- PDF file downloads as `Invoice-INV-0001.pdf`
- Open PDF - should be properly formatted

4. Click "Share" (if on mobile/Capacitor)

**Expected:**
- Native share sheet opens (on mobile)
- Can share via WhatsApp, email, etc.

---

### Phase 2: Invoice Lifecycle + Settings

#### Test 2.1: Invoice List Screen ✅

**Steps:**
1. Navigate to "Invoices" tab (bottom navigation)
2. You should see invoice list page

**Expected:**
- Invoice INV-0001 appears in list
- Shows customer name (Acme Corp)
- Shows total (₹70,800)
- Shows status badge (DRAFT - gray)
- Shows date

3. Try search: Type "Acme" in search bar

**Expected:**
- Invoice filters to show only matching results

4. Try status filter: Select "Draft" segment

**Expected:**
- Shows only draft invoices

5. Pull down to refresh

**Expected:**
- Refresh animation plays
- Data reloads

---

#### Test 2.2: Invoice Detail Screen ✅

**Steps:**
1. From invoice list, tap on INV-0001
2. Navigate to detail view

**Expected:**
- Full invoice details displayed
- Status badge shows "DRAFT"
- Customer info section
- Line items listed (2 items)
- Totals breakdown
- Notes displayed
- Action buttons: "View PDF", "Share"

3. Click three-dot menu (top right)

**Expected:**
- Action sheet opens with options:
  - Edit Invoice
  - Delete
  - Cancel (close)

4. Select "Edit Invoice"

**Expected:**
- Navigate back to edit form
- All data pre-filled

5. Go back to detail, click "Delete" from menu

**Expected:**
- Confirmation alert appears
- "Are you sure?" message

6. Cancel the delete (for now)

---

#### Test 2.3: Settings Screen ✅

**Steps:**
1. Navigate to "Settings" tab
2. Settings page loads

**Expected:**
- Plan Usage Card at top (shows Free plan, 0 of 10 invoices)
- Template customization link
- Accordions for:
  - Business Information
  - GST Settings
  - Bank & Payment Details
  - Invoice Defaults
- Logout button at bottom

3. Expand "Business Information"
4. Fill in:
   - Business Name: "My Design Studio"
   - Phone: 9876543210
   - Email: studio@example.com
   - Address: "123 MG Road, Bangalore"

5. Click "Save" (top right)

**Expected:**
- Success toast: "Settings saved"
- Data persists

6. Expand "GST Settings"
7. Toggle "Enable GST" ON
8. Fill:
   - GSTIN: 29ABCDE1234F1Z5
   - State Code: KA
   - Default Tax Rate: 18

9. Save

**Expected:**
- GST settings saved
- Will be used for future invoices

---

### Phase 3: India GST + Reports

#### Test 3.1: GST Calculation in Invoice ✅

**Steps:**
1. Create a new invoice (New Invoice button)
2. Add customer with different state:
   - Name: "Delhi Client"
   - State Code: DL (different from business KA)

3. Add line item:
   - Product: "Consulting"
   - Quantity: 1
   - Rate: 100000

4. Set Tax Rate: 18%

**Expected:**
- Tax mode should be IGST (interstate)
- Tax breakup shows:
  - IGST 18%: ₹18,000
- Total: ₹118,000

5. Now create another invoice with same-state customer:
   - Name: "Bangalore Client"
   - State Code: KA (same as business)

6. Add item, set 18% tax

**Expected:**
- Tax mode should be CGST+SGST (intrastate)
- Tax breakup shows:
  - CGST 9%: ₹9,000
  - SGST 9%: ₹9,000
- Total: ₹118,000

---

#### Test 3.2: Reports Screen ✅

**Steps:**
1. Navigate to "Reports" tab
2. Reports page loads with 3 tabs

**Tab 1: Summary**
- Shows total invoices count
- Shows total revenue
- Breakdown by subtotal, discount, tax
- By Status section (Draft, Issued, Paid counts)

**Tab 2: GST**
- Taxable value total
- Total GST collected
- Breakup: CGST, SGST, IGST
- By Tax Rate section (18% invoices)

**Tab 3: Trend**
- Last 6 months data
- Monthly invoice count
- Monthly revenue
- Paid vs unpaid amounts

3. Pull to refresh on each tab

**Expected:**
- Data refreshes from server

---

### Phase 4: Templates

#### Test 4.1: Template Selection ✅

**Steps:**
1. Go to Settings → Click "Invoice Template" link
2. Template selection page loads

**Expected:**
- List of available templates (at least 1 default)
- Current template is highlighted
- "Customize Template" button

3. Click "Customize Template"
4. Template editor loads

---

#### Test 4.2: Template Customization ✅

**Steps:**
1. In template editor, expand "Colors" accordion
2. Change Primary Color to #FF5722 (orange)
3. Change Secondary Color to #333333
4. Click "Save"

**Expected:**
- Success toast
- Template config saved

5. Expand "Header (Business Info)"
6. Toggle OFF "Show Business Email"
7. Save

8. Expand "Footer Section"
9. Toggle OFF "Show Signature"
10. Add Custom Footer Text: "Powered by My Studio"
11. Save

12. Expand "Custom Labels"
13. Change "Invoice Title" to "TAX INVOICE"
14. Save

---

#### Test 4.3: Verify Template in PDF ✅

**Steps:**
1. Go back to an existing invoice
2. Click "View PDF"

**Expected:**
- PDF should reflect template changes:
  - Title shows "TAX INVOICE" (not "INVOICE")
  - Business email is hidden
  - Signature section is hidden
  - Custom footer text appears
  - Colors may not be visible in basic PDF (depends on template implementation)

---

### Phase 5: Offline Sync

#### Test 5.1: Offline Invoice Creation ✅

**Steps:**
1. Open Browser DevTools → Network tab
2. Set to "Offline" mode
3. Check sync status chip (top right of Home page)

**Expected:**
- Shows "Offline" status (yellow/warning color)

4. Create a new invoice:
   - Customer: "Offline Customer"
   - Item: "Offline Service", Qty: 1, Rate: 25000
   - Save Draft

**Expected:**
- Invoice saved to IndexedDB
- Sync status shows "1 pending" or similar
- No error (works offline)

5. Try to create another invoice offline
6. Edit the first offline invoice

**Expected:**
- All operations work offline
- Data stored locally

---

#### Test 5.2: Sync When Online ✅

**Steps:**
1. In DevTools Network tab, set back to "Online"
2. Wait 30 seconds (auto-sync interval)

**Expected:**
- Sync status chip shows "Syncing..." (blue)
- Then shows "Synced" (green) with timestamp
- Pending count goes to 0

3. Check server database:
```sql
SELECT * FROM "Invoice" ORDER BY "createdAt" DESC LIMIT 5;
```

**Expected:**
- Offline-created invoices are now in database
- Have proper IDs, timestamps

4. Refresh the page

**Expected:**
- Invoices still appear (synced to server)
- No data loss

---

#### Test 5.3: Sync Status UI ✅

**Steps:**
1. Observe sync status chip in header
2. When online and synced, should show:
   - Green checkmark icon
   - "Just now" or time since last sync

3. Click on the sync chip

**Expected:**
- Triggers manual sync
- Shows "Syncing..." briefly

4. When offline, status bar appears below header:
   - Yellow background
   - "Offline • X pending" message

---

### Phase 6: Plan Limits

#### Test 6.1: View Plan Usage ✅

**Steps:**
1. Go to Settings tab
2. View Plan Usage Card at top

**Expected:**
- Shows "Free Plan"
- Shows "X of 10 invoices used"
- Progress bar (should be low if only few invoices)
- Green/normal color

---

#### Test 6.2: Issue Invoices to Reach Limit ✅

**Steps:**
1. Create and save 10 draft invoices (if not already)
2. For each invoice, click "Issue" or change status to "ISSUED"

**Note:** You need to implement the "Issue" action. For now, you can:
- Go to invoice detail
- Use action menu to mark as "Issued"

3. After issuing 10 invoices, check Plan Usage Card

**Expected:**
- Shows "10 of 10 invoices used"
- Progress bar is full (red/danger color)
- Warning message: "Limit reached. Upgrade to continue."
- "Upgrade" link appears

---

#### Test 6.3: Attempt to Issue 11th Invoice ✅

**Steps:**
1. Create an 11th invoice (draft)
2. Try to issue it (change status to ISSUED)

**Expected:**
- API returns error: `PLAN_LIMIT_REACHED`
- Frontend shows error toast
- Invoice remains in DRAFT status
- Upgrade prompt modal may appear

4. Click "Upgrade" link in Plan Usage Card

**Expected:**
- Upgrade prompt modal opens
- Shows current plan (Free)
- Shows upgrade options (Pro, Business)
- Shows pricing
- Shows benefits list

5. Click "Maybe Later" to close

---

## API Testing (Optional)

### Using cURL or Postman

#### 1. Request OTP
```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

#### 2. Verify OTP
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'
```

Save the `token` from response.

#### 3. Get Business Profile
```bash
curl http://localhost:3000/business \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Create Invoice
```bash
curl -X POST http://localhost:3000/invoices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": null,
    "date": "2024-01-15",
    "lineItems": [
      {"name": "Service", "quantity": 1, "rate": 10000}
    ],
    "taxRate": 18
  }'
```

---

## Common Issues & Troubleshooting

### Issue: OTP not received
- **Solution**: Check server console logs - OTP is printed there for testing
- In production, integrate with SMS provider (Twilio, etc.)

### Issue: Database connection error
- **Solution**: Verify PostgreSQL is running and DATABASE_URL is correct
- Run `npx prisma migrate dev` to ensure schema is up to date

### Issue: CORS errors in browser
- **Solution**: Ensure backend CORS is configured to allow frontend origin
- Check `server/src/index.js` - CORS should allow `http://localhost:5173`

### Issue: IndexedDB not working
- **Solution**: Clear browser data and reload
- Check browser console for Dexie errors

### Issue: PDF not generating
- **Solution**: Check browser console for errors
- Ensure all invoice data is valid (no null values in required fields)

### Issue: Sync not working
- **Solution**: Check network tab for API errors
- Verify JWT token is valid and not expired
- Check sync service logs in browser console

---

## Next Steps After Testing

1. **Fix any bugs found** during testing
2. **Add seed data** for easier testing (sample customers, products, plans)
3. **Implement payment integration** for plan upgrades (Razorpay, Stripe)
4. **Add SMS provider** for real OTP delivery
5. **Deploy to staging** environment
6. **Mobile testing** with Capacitor on iOS/Android
7. **Performance testing** with larger datasets
8. **Security audit** (rate limiting, input validation)

---

## Test Checklist

- [ ] Phase 1: OTP Registration works
- [ ] Phase 1: Business auto-created
- [ ] Phase 1: Invoice draft creation
- [ ] Phase 1: PDF generation and download
- [ ] Phase 2: Invoice list with search/filters
- [ ] Phase 2: Invoice detail view
- [ ] Phase 2: Settings page with all sections
- [ ] Phase 3: GST calculation (IGST vs CGST+SGST)
- [ ] Phase 3: Reports (Summary, GST, Trend)
- [ ] Phase 4: Template selection
- [ ] Phase 4: Template customization
- [ ] Phase 4: Template applied to PDF
- [ ] Phase 5: Offline invoice creation
- [ ] Phase 5: Auto-sync when online
- [ ] Phase 5: Sync status UI
- [ ] Phase 6: Plan usage display
- [ ] Phase 6: Limit enforcement
- [ ] Phase 6: Upgrade prompt

**All tests passing? 🎉 The Invoice App is ready for production!**
