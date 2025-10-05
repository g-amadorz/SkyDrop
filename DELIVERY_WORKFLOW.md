# SkyDrop Delivery Workflow & API Documentation

## 🚀 Complete Delivery Workflow

### **Step 1: Shipper Creates Product & Initiates Delivery**

**Endpoint:** `POST /api/products`

**Request Body:**
```json
{
  "name": "Electronics Package",
  "description": "Laptop and accessories",
  "sender": "USER_ID",
  "currentLocation": "ACCESS_POINT_ID_ORIGIN",
  "destinationAccessPoint": "ACCESS_POINT_ID_DESTINATION",
  "recipient": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "604-555-0001"
  }
}
```

**What Happens:**
1. ✅ Validates shipper exists and has 'sender' role
2. ✅ Calculates delivery cost based on station hops: `(hops × $1.50) × 1.10`
3. ✅ Checks shipper has sufficient points
4. ✅ Deducts total cost from shipper's wallet
5. ✅ Creates Product record with status `'pending'`
6. ✅ Creates Delivery record with status `'awaiting-pickup'`
7. ✅ Generates 6-digit verification code for recipient
8. ✅ Returns product, delivery, cost, and verification code

---

### **Step 2: Commuter Claims Package**

**Endpoint:** `POST /api/deliveries/claim`

**Request Body:**
```json
{
  "deliveryId": "DELIVERY_ID",
  "commuterId": "COMMUTER_USER_ID",
  "packageIds": ["DELIVERY_ID"]
}
```

**What Happens:**
1. ✅ Validates commuter exists and has 'rider' role
2. ✅ Checks delivery status is `'awaiting-pickup'`
3. ✅ Validates commuter capacity (max 5 concurrent packages)
4. ✅ Creates new delivery leg with pickup time
5. ✅ Updates delivery status to `'in-transit'`
6. ✅ Assigns commuter to delivery
7. ✅ Updates product status to `'in-transit'`
8. ✅ Adds product to commuter's `activeProductIds`

---

### **Step 3A: Commuter Drops at Intermediate Station**

**Endpoint:** `POST /api/deliveries/dropoff`

**Request Body:**
```json
{
  "deliveryId": "DELIVERY_ID",
  "commuterId": "COMMUTER_USER_ID",
  "accessPointId": "INTERMEDIATE_ACCESS_POINT_ID"
}
```

**What Happens:**
1. ✅ Validates commuter owns this delivery
2. ✅ Completes current delivery leg
3. ✅ Calculates earnings for this leg: `(hops × $1.50) × 1.10`
4. ✅ Pays commuter immediately
5. ✅ Updates delivery status to `'awaiting-pickup'`
6. ✅ Clears `currentCommuterId` (ready for next commuter)
7. ✅ Updates product `currentLocation`
8. ✅ Removes product from commuter's `activeProductIds`
9. ✅ Package is now available for another commuter to claim

---

### **Step 3B: Commuter Drops at Final Destination**

**Endpoint:** `POST /api/deliveries/dropoff`

**Request Body:**
```json
{
  "deliveryId": "DELIVERY_ID",
  "commuterId": "COMMUTER_USER_ID",
  "accessPointId": "DESTINATION_ACCESS_POINT_ID"
}
```

**What Happens:**
1. ✅ Validates commuter owns this delivery
2. ✅ Completes final delivery leg
3. ✅ Calculates earnings for this leg
4. ✅ Pays commuter immediately
5. ✅ Updates delivery status to `'ready-for-recipient'`
6. ✅ Updates product status to `'delivered'`
7. ✅ Updates product `currentLocation` to destination
8. ✅ Removes product from commuter's `activeProductIds`
9. ✅ Package is now ready for recipient pickup

---

### **Step 4: Recipient Picks Up Package**

**Endpoint:** `POST /api/deliveries/pickup`

**Request Body:**
```json
{
  "deliveryId": "DELIVERY_ID",
  "recipientPhone": "604-555-0001",
  "recipientName": "John Doe"
}
```

**What Happens:**
1. ✅ Validates delivery status is `'ready-for-recipient'`
2. ✅ Verifies verification code matches (if provided)
3. ✅ Calculates unused funds (reserved - paid)
4. ✅ Refunds unused funds to shipper
5. ✅ Updates delivery status to `'completed'`
6. ✅ Sets `completedAt` timestamp
7. ✅ Delivery is now complete

---

## 📊 Pricing Model

### **Delivery Cost Formula**
```
hops = number of stations between origin and destination
baseCost = hops × $1.50
platformFee = baseCost × 0.10 (10%)
totalCost = baseCost + platformFee
```

### **Commuter Earnings Per Leg**
```
legHops = stations traveled in this leg
legCost = legHops × $1.50
platformFee = legCost × 0.10
earnings = legCost + platformFee
```

### **Example Pricing:**
| Route | Hops | Cost |
|-------|------|------|
| VCC-Clark → Commercial-Broadway | 1 | $1.65 |
| VCC-Clark → Lougheed | 10 | $16.50 |
| VCC-Clark → Lafarge | 16 | $26.40 |
| Commercial-Broadway → Burquitlam | 10 | $16.50 |

---

## 🎯 Concurrent Package Handling

### **Commuter Capacity Rules:**
- **Max Capacity:** 5 packages simultaneously
- **Validation:** Checked in `claimPackage()` before assignment
- **Tracking:** Managed via `Commuter.activeProductIds[]`

### **Benefits:**
- Commuters can pick up multiple packages going the same direction
- Maximize earnings per trip
- Efficient use of transit rides

### **Example Multi-Package Scenario:**
```
Commuter at Commercial-Broadway going to Lafarge:
1. Claims Package A (Commercial → Lougheed) - $16.50
2. Claims Package B (Commercial → Burquitlam) - $16.50
3. Claims Package C (Commercial → Lafarge) - $23.10

Total potential earnings: $56.10 for one trip
```

---

## 🔐 Admin Seeding for Demo

### **Seed Database:**
`POST /api/admin/seed`

**Creates:**
- **5 Users:**
  - 1 Admin (10,000 points)
  - 2 Shippers (500 & 300 points)
  - 2 Commuters (50 & 75 points)
- **6 Access Points:**
  - VCC-Clark, Commercial-Broadway, Renfrew, Lougheed, Burquitlam, Lafarge
- **3 Products** with deliveries ready to claim
- **Password for all:** `password123`

---

## 📍 Query Endpoints

### **Get Available Packages (for Commuters)**
`GET /api/deliveries/available?accessPointId=XXX`

Returns all packages at a specific access point awaiting pickup.

### **Get Shipper's Deliveries**
`GET /api/deliveries?shipperId=USER_ID`

Returns all deliveries created by a shipper.

### **Get Commuter's Active Deliveries**
`GET /api/deliveries?commuterId=USER_ID`

Returns all packages currently being carried by a commuter.

### **Get Specific Delivery**
`GET /api/deliveries/[id]`

Returns full delivery details with all legs.

---

## 💡 Additional Features Implemented

### **Payment Flow:**
- Shipper pays upfront (deducted immediately)
- Funds reserved in delivery
- Commuters paid per leg (immediate)
- Unused funds refunded to shipper on completion

### **Status Transitions:**
```
Product:  pending → in-transit → delivered
Delivery: awaiting-pickup → in-transit → ready-for-recipient → completed
```

### **Multi-Hop Support:**
- Package can be dropped at any intermediate station
- Each leg is tracked separately
- Each commuter is paid for their portion
- No limit on number of hops

---

## 🧪 Testing the Workflow

### **1. Seed the database:**
```bash
curl -X POST http://localhost:3000/api/admin/seed
```

### **2. Create a new delivery:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Package",
    "description": "Test delivery",
    "sender": "SHIPPER_USER_ID",
    "currentLocation": "VCC_CLARK_AP_ID",
    "destinationAccessPoint": "LAFARGE_AP_ID",
    "recipient": {
      "name": "Test Recipient",
      "email": "test@example.com",
      "phone": "604-555-9999"
    }
  }'
```

### **3. Commuter claims package:**
```bash
curl -X POST http://localhost:3000/api/deliveries/claim \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryId": "DELIVERY_ID",
    "commuterId": "COMMUTER_USER_ID",
    "packageIds": ["DELIVERY_ID"]
  }'
```

### **4. Commuter drops off:**
```bash
curl -X POST http://localhost:3000/api/deliveries/dropoff \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryId": "DELIVERY_ID",
    "commuterId": "COMMUTER_USER_ID",
    "accessPointId": "DESTINATION_AP_ID"
  }'
```

### **5. Recipient picks up:**
```bash
curl -X POST http://localhost:3000/api/deliveries/pickup \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryId": "DELIVERY_ID",
    "recipientPhone": "604-555-9999",
    "recipientName": "Test Recipient"
  }'
```

---

## ⚙️ Environment Setup

Add to `.env.local`:
```env
MONGODB_URI=your_mongodb_connection_string
```

Install missing dependencies:
```bash
npm install @types/bcrypt
```
