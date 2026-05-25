# Firestore Schema Documentation

This document outlines the required Firestore schema for the Electro 2 e-commerce application, including all improvements for inventory management, order tracking, and OTP verification.

## Collections Overview

### 1. Products Collection
**Path:** `/products/{productId}`

```json
{
  "name": "string (required)",
  "price": "number (required)",
  "description": "string",
  "img": "string (image URL)",
  "length": "string",
  "category": "string",
  
  // Inventory Management Fields
  "inventory_status": "ENUM('in_stock', 'out_of_stock', 'discontinued')",
  "items_left": "number (default: 0) - quantity in stock",
  "is_hidden": "boolean (default: false) - hidden from listings",
  
  // Metadata
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Logic Rules:**
- When `items_left` reaches 0, system automatically sets `inventory_status` to `'out_of_stock'`
- Admin can manually override `inventory_status` or toggle `is_hidden` to `true` to hide product
- Products with `is_hidden=true` or `inventory_status='discontinued'` should not appear in product listings
- Products are only available for purchase if `items_left > 0` and `is_hidden=false`

---

### 2. Users Collection
**Path:** `/users/{userId}`

```json
{
  "uid": "string (required)",
  "email": "string (required, unique)",
  "fullName": "string",
  "phone": "string",
  "address": "string",
  
  // Role Management
  "role": "ENUM('customer', 'admin', 'delivery_rider')",
  
  // Email Verification
  "isEmailVerified": "boolean (default: false)",
  "emailVerifiedAt": "timestamp | null",
  
  // Delivery Rider Fields (if role = 'delivery_rider')
  "riderLicense": "string (URL to license document)",
  "riderVerified": "boolean (default: false)",
  "riderVerifiedAt": "timestamp | null",
  
  // Metadata
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

### 3. Orders Collection
**Path:** `/orders/{orderId}`

```json
{
  "userId": "string (required) - reference to user",
  "items": [
    {
      "id": "string",
      "name": "string",
      "price": "number",
      "quantity": "number",
      "img": "string",
      "paymentChoice": "ENUM('full', 'installment')",
      "installments": "number (2-6)",
      "paymentFrequency": "ENUM('weekly', 'monthly')",
      "periodPayment": "number - payment per period"
    }
  ],
  
  "deliveryInfo": {
    "address": "string",
    "city": "string",
    "state": "string",
    "phone": "string",
    "instructions": "string (optional)"
  },
  
  "totalAmount": "number (total order value including interest)",
  "amountPaid": "number (initial payment amount)",
  "status": "string (deprecated - use tracking_status)",
  
  // Order Tracking Fields
  "tracking_status": "ENUM('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned')",
  "delivery_due_date": "timestamp",
  "delivery_otp": "string (6-digit OTP for delivery verification)",
  "delivery_otp_hash": "string (hashed OTP - for security)",
  "delivery_token": "string (unique token for rider portal link)",
  "proof_of_delivery_image": "string (URL to proof of delivery image)",
  "delivery_confirmed_at": "timestamp | null",
  "delivery_confirmed_by": "string | null (rider ID)",
  
  // Status History for Audit Trail
  "status_history": [
    {
      "status": "string",
      "timestamp": "timestamp",
      "notes": "string (optional)"
    }
  ],
  
  // Payment Reference
  "paymentRef": "string (payment gateway reference)",
  
  // Metadata
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Status Flow:**
```
Pending → Paid → Processing → Shipped → Delivered
                                    ↓
                              (OTP Verification)
```

---

### 4. OTP_CODES Collection
**Path:** `/otp_codes/{otpId}`

```json
{
  "email": "string (required)",
  "type": "ENUM('registration', 'password_reset', 'email_verification', 'delivery_verification')",
  
  // OTP Storage
  "otp_hash": "string (base64 encoded OTP - never store plain OTP)",
  "created_at": "timestamp",
  "expires_at": "timestamp (expires in 10 minutes by default)",
  
  // Verification State
  "verified": "boolean (default: false)",
  "verified_at": "timestamp | null",
  
  // Security
  "attempts": "number (default: 0)",
  "max_attempts": "number (default: 5)",
  
  // For Delivery OTPs
  "order_id": "string (optional - for delivery_verification type)"
}
```

**Rules:**
- OTP expires after 10 minutes
- Maximum 5 verification attempts allowed
- After exceeding max attempts, OTP is deleted
- Different OTP types for different use cases
- OTPs stored as base64 hash, never plain text

---

### 5. Carousel Collection
**Path:** `/carousel/{carouselId}`

```json
{
  "title": "string",
  "image_url": "string (Firebase Storage URL preferred)",
  "link": "string (optional - target URL or route)",
  "order": "number (display order)",
  "is_active": "boolean (default: true)",
  
  // Metadata
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Image Handling:**
- Accept both file uploads and external URLs
- Uploaded files stored in `/carousel/*` folder in Firebase Storage
- External URLs accepted but should be validated
- Use `uploadCarouselImage()` utility for handling

---

## Firestore Indexes

### Composite Indexes Required

1. **Orders - User & Status:**
   - Collection: `orders`
   - Fields: `userId` (Ascending), `tracking_status` (Ascending)

2. **Orders - User & Created Date:**
   - Collection: `orders`
   - Fields: `userId` (Ascending), `created_at` (Descending)

3. **OTP Codes - Verification:**
   - Collection: `otp_codes`
   - Fields: `email` (Ascending), `type` (Ascending), `verified` (Ascending)

4. **Products - Inventory & Visibility:**
   - Collection: `products`
   - Fields: `is_hidden` (Ascending), `inventory_status` (Ascending)

5. **Products - Visibility & Stock:**
   - Collection: `products`
   - Fields: `is_hidden` (Ascending), `items_left` (Descending)

---

## Firestore Security Rules

```javascript
// Security Rules for Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Products: Public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Users: Own documents readable/writable, admin can read all
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId || isAdmin();
    }
    
    // Orders: Own orders readable/writable, admin can read all
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId || isAdmin();
      allow write: if request.auth.uid == resource.data.userId || isAdmin();
    }
    
    // OTP Codes: Admin only for creation/verification
    match /otp_codes/{otpId} {
      allow read: if isAdmin();
      allow write: if isAdmin() || isValidOTPCreation();
    }
    
    // Carousel: Public read, admin write
    match /carousel/{carouselId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Helper functions
    function isAdmin() {
      return request.auth.token.email == 'zealmart.ng@gmail.com';
    }
    
    function isValidOTPCreation() {
      return request.method == 'create' && 
             request.resource.data.keys().hasAll(['email', 'type', 'otp_hash']);
    }
  }
}
```

---

## API Integration Points

### Backend Functions Required

1. **Auto-generate & send OTP on order shipment:**
   ```javascript
   // When admin marks order as "Shipped":
   - Generate 6-digit OTP
   - Store hashed OTP in order document
   - Send OTP via SMS/Email to customer
   - Generate delivery token for rider
   ```

2. **Block admin from cart operations:**
   ```javascript
   // Middleware on /cart and /checkout routes:
   - Check if user.email === 'zealmart.ng@gmail.com'
   - If true, reject POST requests with 403 Forbidden
   ```

3. **Update inventory on order creation:**
   ```javascript
   // On successful payment:
   - Decrease items_left for each product
   - Auto-update inventory_status if items_left <= 0
   ```

4. **Clean up expired OTPs:**
   ```javascript
   // Scheduled Cloud Function (daily):
   - Query all OTPs where expires_at < now()
   - Delete expired OTPs
   ```

---

## Data Migration Guide

### For Existing Products
Add the following fields to each product document:

```javascript
{
  inventory_status: 'in_stock',
  items_left: 0, // Set to current stock
  is_hidden: false
}
```

### For Existing Orders
Add the following fields to each order document:

```javascript
{
  tracking_status: 'Delivered', // or current status
  delivery_due_date: Timestamp.now(),
  delivery_otp: null,
  delivery_otp_hash: null,
  delivery_token: null,
  proof_of_delivery_image: null,
  delivery_confirmed_at: null,
  delivery_confirmed_by: null,
  status_history: [{
    status: 'Delivered',
    timestamp: Timestamp.now(),
    notes: 'Migrated from old schema'
  }]
}
```

---

## Implementation Checklist

- [ ] Create Firestore composite indexes
- [ ] Update security rules
- [ ] Run data migration for existing products
- [ ] Run data migration for existing orders
- [ ] Deploy OTP cleanup Cloud Function
- [ ] Test RBAC restrictions on cart
- [ ] Test OTP generation on order shipment
- [ ] Test delivery portal with OTP verification
- [ ] Set up SMS/Email gateway for OTP delivery
- [ ] Train admins on new inventory management UI

---

## Utility Functions Reference

See the following files for utility functions:
- `src/utils/rbac.js` - Role-based access control
- `src/utils/otpService.js` - OTP generation & verification
- `src/utils/inventoryService.js` - Inventory management
- `src/utils/orderTrackingService.js` - Order tracking
- `src/utils/mediaUploadService.js` - Image upload handling
