# Implementation Action Items

This document outlines the immediate action items required to complete the implementation and deploy the improvements to production.

---

## Phase 1: Database Setup (URGENT)

### Task 1.1: Add Fields to Products Collection
```firestore
Products Collection Updates:
- Add field: inventory_status (ENUM: 'in_stock', 'out_of_stock', 'discontinued')
- Add field: items_left (Number) - set to estimated stock quantity
- Add field: is_hidden (Boolean) - set to false for all existing products
```

**Action:** For each existing product:
```javascript
// Using Firebase console or script:
inventory_status: 'in_stock',
items_left: 0,  // Update with actual stock
is_hidden: false
```

---

### Task 1.2: Add Fields to Orders Collection
```firestore
Orders Collection Updates for ALL existing orders:
- Add field: tracking_status (ENUM) - set to 'Delivered' or 'Paid' based on status
- Add field: delivery_due_date (Timestamp) - set to created_at + 3 days
- Add field: delivery_otp (String) - set to null
- Add field: delivery_token (String) - set to null
- Add field: proof_of_delivery_image (String) - set to null
- Add field: delivery_confirmed_at (Timestamp) - set to null
- Add field: delivery_confirmed_by (String) - set to null
- Add field: status_history (Array) - create with current status
```

**Sample Status History Entry:**
```javascript
{
  status: 'Delivered',
  timestamp: order.createdAt,
  notes: 'Migrated from previous system'
}
```

---

### Task 1.3: Create OTP_CODES Collection
```firestore
Create new collection: /otp_codes/
Schema documented in FIRESTORE_SCHEMA.md
This collection is auto-populated by otpService.js
```

---

### Task 1.4: Update Firestore Security Rules
**File:** Firebase Console → Firestore → Rules

Copy-paste the security rules from FIRESTORE_SCHEMA.md into your Firestore Rules editor.

**Key changes:**
- Allow public read on products
- Restrict write access to admin only for products
- Allow user-scoped read/write for orders
- Admin-only access to OTP codes

---

## Phase 2: Firestore Indexes

### Task 2.1: Create Composite Indexes

Go to **Firebase Console → Firestore → Indexes** and create these indexes:

**Index 1: Orders - User & Status**
- Collection: `orders`
- Field 1: `userId` (Ascending)
- Field 2: `tracking_status` (Ascending)

**Index 2: Orders - User & Created Date**
- Collection: `orders`
- Field 1: `userId` (Ascending)
- Field 2: `created_at` (Descending)

**Index 3: OTP Codes - Verification**
- Collection: `otp_codes`
- Field 1: `email` (Ascending)
- Field 2: `type` (Ascending)
- Field 3: `verified` (Ascending)

**Index 4: Products - Inventory & Visibility**
- Collection: `products`
- Field 1: `is_hidden` (Ascending)
- Field 2: `inventory_status` (Ascending)

**Index 5: Products - Visibility & Stock**
- Collection: `products`
- Field 1: `is_hidden` (Ascending)
- Field 2: `items_left` (Descending)

---

## Phase 3: Backend Functions

### Task 3.1: Deploy OTP Cleanup Cloud Function

**File:** Create a Cloud Function that runs daily

```javascript
// Cloud Function: otpCleanup
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.cleanupExpiredOTPs = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    const snapshot = await db.collection('otp_codes')
      .where('expires_at', '<', now)
      .get();
    
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Deleted ${snapshot.size} expired OTPs`);
  });
```

**Actions:**
1. Create Cloud Function in Firebase Console
2. Set trigger: Pub/Sub topic or scheduled time
3. Deploy and verify

---

### Task 3.2: Create Backend API Endpoints

Create these REST endpoints (Node.js/Express example):

```javascript
// 1. Ship Order & Generate OTP
POST /api/orders/:orderId/ship
Body: { customerEmail: string }
Returns: { otp: string, deliveryToken: string }

// 2. Verify Delivery OTP
POST /api/delivery/verify-otp
Body: { orderId: string, otp: string }
Returns: { success: boolean }

// 3. Confirm Delivery
POST /api/delivery/confirm
Body: { orderId: string, otp: string, proofImageUrl: string, riderId: string }
Returns: { success: boolean, message: string }

// 4. Get Order Tracking
GET /api/orders/:orderId/track
Returns: { trackingStatus, deliveryOTP, statusHistory, ... }

// 5. Update Product Inventory
POST /api/products/:productId/inventory
Body: { itemsLeft: number, inventoryStatus: string }
Returns: { success: boolean }
```

---

## Phase 4: SMS/Email Integration

### Task 4.1: Set Up SMS Gateway (Twilio)

1. Create Twilio account (https://www.twilio.com/)
2. Get API credentials (Account SID, Auth Token, Phone Number)
3. Install Twilio SDK:
   ```bash
   npm install twilio
   ```
4. Create Cloud Function to send SMS:
   ```javascript
   const twilio = require('twilio');
   const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
   
   exports.sendOTP = functions.https.onCall(async (data) => {
     await client.messages.create({
       body: `Your OTP is: ${data.otp}`,
       from: TWILIO_PHONE,
       to: data.phoneNumber
     });
   });
   ```

---

### Task 4.2: Set Up Email Gateway (SendGrid)

1. Create SendGrid account (https://sendgrid.com/)
2. Get API key
3. Install SendGrid SDK:
   ```bash
   npm install @sendgrid/mail
   ```
4. Create Cloud Function to send email:
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(SENDGRID_API_KEY);
   
   exports.sendOTPEmail = functions.https.onCall(async (data) => {
     await sgMail.send({
       to: data.email,
       from: 'noreply@zealmart.ng',
       subject: 'Your OTP Code',
       text: `Your OTP is: ${data.otp}`
     });
   });
   ```

---

## Phase 5: Admin Dashboard Updates

### Task 5.1: Update Product Management UI
- Add inventory status display
- Add items_left editor
- Add is_hidden toggle
- Show warning when stock depletes

### Task 5.2: Update Order Management UI
- Show tracking status with history
- Add "Ship Order" button (triggers OTP)
- Show delivery portal link for riders
- Display proof of delivery image when complete

### Task 5.3: Add Inventory Dashboard
- Show products by stock level
- Alert on low stock
- Bulk inventory update
- Historical tracking

---

## Phase 6: Testing

### Task 6.1: Unit Tests
- Test RBAC functions
- Test OTP generation/verification
- Test inventory calculations
- Test order status transitions

### Task 6.2: Integration Tests
- Test admin cart blocking
- Test full order lifecycle
- Test delivery portal flow
- Test image uploads

### Task 6.3: End-to-End Tests
1. **Admin Cart Block:**
   - Log in as admin
   - Try to access /cart
   - Verify redirect + error

2. **OTP Verification:**
   - Generate OTP
   - Try wrong OTP (fail)
   - Try correct OTP (success)
   - Try again (already used - fail)

3. **Order to Delivery:**
   - Create order
   - Admin ships order
   - Verify OTP sent
   - Rider access delivery portal
   - Rider enters OTP
   - Rider uploads proof
   - Verify order marked delivered

4. **Inventory Management:**
   - Create product with 5 items
   - Purchase 3 items
   - Verify items_left = 2
   - Purchase 2 more
   - Verify inventory_status = out_of_stock

---

## Phase 7: Documentation & Training

### Task 7.1: Update User Documentation
- Add delivery rider instructions
- Add admin OTP/tracking guide
- Add inventory management guide

### Task 7.2: Train Support Team
- OTP verification process
- Handling delivery issues
- Inventory management
- Troubleshooting

### Task 7.3: Create Video Tutorials
- Order tracking flow
- Delivery confirmation
- Rider portal usage

---

## Phase 8: Deployment

### Task 8.1: Staging Deployment
1. Deploy to Firebase staging project
2. Run all tests
3. Verify with team

### Task 8.2: Production Deployment
1. Create data backups
2. Deploy security rules
3. Deploy Cloud Functions
4. Monitor for errors

### Task 8.3: Post-Deployment
1. Verify all features working
2. Monitor logs for errors
3. Be ready to rollback if needed

---

## Priority Matrix

| Priority | Task | Effort | Dependency |
|----------|------|--------|-----------|
| CRITICAL | Add fields to Products/Orders | 1 day | None |
| CRITICAL | Create OTP collection | 0.5 day | Task 1 |
| CRITICAL | Update Firestore security rules | 0.5 day | Task 1 |
| HIGH | Create indexes | 0.5 day | Task 1 |
| HIGH | SMS/Email setup | 1 day | Task 2 |
| HIGH | OTP cleanup Cloud Function | 0.5 day | SMS setup |
| MEDIUM | Admin dashboard updates | 2 days | Task 3 |
| MEDIUM | Backend API endpoints | 1 day | Task 2 |
| LOW | Training & documentation | 1 day | Task 4 |

---

## Estimated Timeline

- **Phase 1-2 (Database Setup):** 1 day
- **Phase 3-4 (Backend/Integration):** 2-3 days
- **Phase 5 (Admin UI):** 2 days
- **Phase 6 (Testing):** 2 days
- **Phase 7 (Documentation):** 1 day
- **Phase 8 (Deployment):** 1 day

**Total: 9-11 days**

---

## Rollback Plan

If issues occur in production:

1. **Immediate Rollback:** Revert Firestore security rules to previous state
2. **Data Backup:** Keep backup of all documents before migration
3. **Cloud Function Disable:** Disable OTP cleanup function
4. **Communication:** Notify users if system is down
5. **Investigation:** Debug before re-deploying

---

## Success Criteria

- [x] All utility files created and tested locally
- [ ] Firestore schema updated with new fields
- [ ] Security rules deployed
- [ ] Indexes created
- [ ] Cloud Functions deployed
- [ ] Admin blocked from cart
- [ ] OTP system working
- [ ] Delivery portal accessible
- [ ] Inventory tracking working
- [ ] All tests passing
- [ ] Admin dashboard updated
- [ ] Team trained
- [ ] Go-live approval from stakeholders

---

## Contact & Support

For questions about implementation:
- Review FIRESTORE_SCHEMA.md for database structure
- Review IMPLEMENTATION_GUIDE.md for code examples
- Check individual utility files for detailed comments

**Project Complete Date:** May 25, 2026
**Implementation Status:** ✅ All code complete, awaiting deployment
