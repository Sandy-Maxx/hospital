# Pharmacy Management Module

## Overview

The Pharmacy Management Module is a comprehensive solution for managing medicine inventory, pricing, GST compliance, and integration with prescriptions and billing systems in your hospital management system.

## Features

### 🏥 **Medicine Master Database**
- Complete Indian pharmaceutical database with real market medicines
- Generic names, brand names, manufacturers, and compositions
- Proper strength, dosage forms, and pack size information
- HSN codes for GST compliance
- Prescription requirements tracking

### 💰 **Indian GST Compliance**
- Pre-configured GST slabs (0%, 5%, 12%, 18%, 28%)
- Category-wise GST mapping for medicines
- Automatic GST calculation in pricing
- HSN code management for tax compliance

### 📦 **Advanced Stock Management**
- Batch-wise inventory tracking
- Expiry date monitoring with alerts
- FIFO (First In, First Out) stock allocation
- Location-based storage management
- Stock adjustment and transaction history

### 🔔 **Smart Alerts System**
- Low stock warnings
- Expiry alerts (30-day advance warning)
- Out-of-stock notifications
- Expired stock identification

### 💼 **Supplier Management**
- Complete supplier database with GST numbers
- Credit terms and payment tracking
- License number verification
- Purchase order management

### 🔗 **System Integration**
- Prescription auto-suggestions
- Real-time pricing for billing
- Stock availability checking
- Automatic inventory updates on sales

## Database Schema

### Core Tables

#### 1. Medicine Categories
```sql
MedicineCategory {
  id: String (Primary Key)
  name: String (Unique)
  description: String
  gstRate: Float (Default: 12.0)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 2. GST Slabs
```sql
GSTSlab {
  id: String (Primary Key)
  rate: Float (Unique)
  description: String
  isActive: Boolean (Default: true)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 3. Medicines
```sql
Medicine {
  id: String (Primary Key)
  genericName: String
  brandName: String
  manufacturer: String
  composition: String
  strength: String
  dosageForm: String
  packSize: Integer
  unit: String
  categoryId: String (Foreign Key)
  gstSlabId: String (Foreign Key)
  mrp: Float
  purchasePrice: Float
  sellingPrice: Float
  marginPercentage: Float
  isActive: Boolean (Default: true)
  requiresPrescription: Boolean (Default: true)
  storageCondition: String
  usage: String
  sideEffects: String
  contraindications: String
  drugInteractions: String
  barcode: String (Unique)
  hsn: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 4. Stock Management
```sql
MedicineStock {
  id: String (Primary Key)
  medicineId: String (Foreign Key)
  batchNumber: String
  supplierId: String (Foreign Key)
  quantity: Integer
  availableQuantity: Integer
  purchasePrice: Float
  sellingPrice: Float
  mrp: Float
  manufactureDate: DateTime
  expiryDate: DateTime
  location: String
  isActive: Boolean (Default: true)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## API Endpoints

### Medicine Management

#### Get Medicines
```http
GET /api/pharmacy/medicines
```

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search in name, generic, manufacturer
- `category` (string): Filter by category ID
- `manufacturer` (string): Filter by manufacturer
- `requiresPrescription` (boolean): Filter prescription medicines
- `isActive` (boolean): Filter active medicines
- `sortBy` (string): Sort field (default: brandName)
- `sortOrder` (string): asc/desc (default: asc)

**Response:**
```json
{
  "medicines": [
    {
      "id": "med_crocin_500",
      "genericName": "Paracetamol",
      "brandName": "Crocin 500",
      "manufacturer": "GSK",
      "strength": "500mg",
      "dosageForm": "Tablet",
      "mrp": 42.50,
      "sellingPrice": 40.00,
      "totalStock": 150,
      "stockStatus": "IN_STOCK",
      "category": { "name": "Analgesics" },
      "gstSlab": { "rate": 12.0 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 50,
    "totalPages": 3
  }
}
```

#### Create Medicine
```http
POST /api/pharmacy/medicines
```

**Request Body:**
```json
{
  "genericName": "Paracetamol",
  "brandName": "Crocin 500",
  "manufacturer": "GSK",
  "composition": "Paracetamol 500mg",
  "strength": "500mg",
  "dosageForm": "Tablet",
  "packSize": 20,
  "unit": "pieces",
  "categoryId": "cat_analgesic",
  "gstSlabId": "gst_12",
  "mrp": 42.50,
  "purchasePrice": 35.00,
  "sellingPrice": 40.00,
  "hsn": "30042010",
  "barcode": "BAR001"
}
```

### Stock Management

#### Get Stock
```http
GET /api/pharmacy/stock
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `medicineId`: Filter by medicine
- `supplierId`: Filter by supplier
- `lowStock`: Show low stock items (boolean)
- `nearExpiry`: Show items expiring soon (boolean)
- `expired`: Show expired items (boolean)
- `search`: Search in medicine names or batch numbers

#### Add Stock
```http
POST /api/pharmacy/stock
```

**Request Body:**
```json
{
  "medicineId": "med_crocin_500",
  "batchNumber": "BATCH001",
  "supplierId": "supp_cipla",
  "quantity": 100,
  "purchasePrice": 35.00,
  "sellingPrice": 40.00,
  "mrp": 42.50,
  "manufactureDate": "2024-01-15",
  "expiryDate": "2026-01-15",
  "location": "A1-S2"
}
```

### Medicine Suggestions

#### Get Suggestions for Prescriptions
```http
GET /api/pharmacy/suggestions?q=paracetamol&includeStock=true
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "med_crocin_500",
      "displayText": "Crocin 500 (Paracetamol) - 500mg",
      "genericName": "Paracetamol",
      "brandName": "Crocin 500",
      "stockInfo": {
        "totalStock": 150,
        "stockStatus": "IN_STOCK",
        "availableBatches": 3,
        "nearestExpiry": "2025-06-15T00:00:00.000Z"
      }
    }
  ]
}
```

#### Get Pricing for Billing
```http
POST /api/pharmacy/suggestions/pricing
```

**Request Body:**
```json
{
  "medicineIds": ["med_crocin_500"],
  "quantities": {
    "med_crocin_500": 10
  }
}
```

**Response:**
```json
{
  "medicines": [
    {
      "medicineId": "med_crocin_500",
      "requestedQuantity": 10,
      "canFulfill": true,
      "pricing": {
        "subtotal": 400.00,
        "gstRate": 12.0,
        "gstAmount": 48.00,
        "totalAmount": 448.00,
        "mrpTotal": 425.00,
        "savings": -23.00,
        "savingsPercentage": -5.41
      },
      "batchAllocations": [
        {
          "batchNumber": "BATCH001",
          "quantity": 10,
          "unitPrice": 40.00,
          "expiryDate": "2025-06-15T00:00:00.000Z"
        }
      ]
    }
  ],
  "totals": {
    "subtotal": 400.00,
    "gstAmount": 48.00,
    "totalAmount": 448.00
  }
}
```

## Indian Market Medicine Database

The system comes pre-loaded with common Indian medicines including:

### Categories with GST Rates:
- **Analgesics** (12% GST): Crocin, Combiflam, Volini
- **Antibiotics** (5% GST): Azithral, Augmentin, Ciproflox
- **Cardiovascular** (5% GST): Telma, Amlodac, Ecosprin
- **Antidiabetic** (5% GST): Glycomet, Amaryl, Januvia
- **Vitamins** (18% GST): Becadexamin, Shelcal, Zincovit
- **Dermatological** (18% GST): Candid, Betnovate
- **And many more...**

### Sample Medicines Include:
- **Crocin 500** - Paracetamol 500mg, GSK
- **Azithral 500** - Azithromycin 500mg, Alembic
- **Telma 40** - Telmisartan 40mg, Glenmark
- **Glycomet 500** - Metformin 500mg, USV
- **Asthalin Inhaler** - Salbutamol, Cipla
- **And 30+ more commonly used medicines**

## Usage Examples

### 1. Adding New Medicine
```typescript
const newMedicine = await fetch('/api/pharmacy/medicines', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    genericName: 'Paracetamol',
    brandName: 'Dolo 650',
    manufacturer: 'Micro Labs',
    // ... other fields
  })
});
```

### 2. Getting Medicine Suggestions in Prescription
```typescript
const suggestions = await fetch(
  '/api/pharmacy/suggestions?q=para&includeStock=true'
);
const data = await suggestions.json();
// Use data.suggestions in autocomplete dropdown
```

### 3. Calculating Bill Amount
```typescript
const pricing = await fetch('/api/pharmacy/suggestions/pricing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    medicineIds: ['med_crocin_500'],
    quantities: { 'med_crocin_500': 5 }
  })
});
```

## Stock Alerts

The system automatically generates alerts for:

### Low Stock Alert
- Triggered when available quantity ≤ 10 units
- Severity: MEDIUM
- Action: Order new stock

### Expiry Alert
- 30 days before expiry: EXPIRING_SOON
- After expiry date: EXPIRED
- Severity: HIGH for expired items

### Out of Stock Alert
- When available quantity = 0
- Severity: CRITICAL
- Action: Immediate restocking required

## Integration Points

### 1. Prescription System
- Auto-complete medicine names
- Check prescription requirements
- Validate medicine interactions
- Stock availability checking

### 2. Billing System
- Real-time pricing calculation
- GST computation
- Batch-wise billing
- MRP vs selling price tracking

### 3. Inventory Management
- Automatic stock deduction on sales
- Purchase order integration
- Supplier management
- Expiry tracking

## Security & Permissions

### Admin Only Access
- Full CRUD operations on medicines
- Stock management
- Supplier management
- GST configuration

### Future Pharmacist Role
- Stock viewing and adjustments
- Purchase entry
- Alert management
- Sales transactions

## Installation & Setup

1. **Database Migration**
   ```bash
   # Apply the pharmacy module migration
   npx prisma db push
   ```

2. **Seed Sample Data**
   ```sql
   # Run the sample medicine data SQL
   psql -d hospital_db -f data/indian_medicines_sample.sql
   ```

3. **Access the Module**
   - Navigate to `/admin/pharmacy`
   - Available only to ADMIN users
   - Future: Custom permissions for pharmacists

## Technical Architecture

### Backend (API Layer)
- RESTful APIs with Next.js App Router
- Prisma ORM for database operations
- Type-safe with TypeScript
- Comprehensive error handling

### Frontend (UI Layer)
- React with Next.js 14
- Tailwind CSS for styling
- shadcn/ui components
- Real-time search and filtering

### Database Layer
- PostgreSQL with proper indexing
- Foreign key constraints
- Optimized queries for performance
- Transaction safety for stock operations

This pharmacy module provides a complete solution for medicine management in your hospital system, ensuring compliance with Indian GST regulations while providing seamless integration with existing prescription and billing workflows.
