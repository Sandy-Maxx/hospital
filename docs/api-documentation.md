# API Documentation

## Overview

The Hospital Management System provides RESTful APIs built with Next.js API routes. All APIs follow consistent patterns for authentication, error handling, and response formatting.

## Authentication

All protected API routes require authentication via NextAuth.js JWT tokens. Include the session token in requests to authenticated endpoints.

### Authentication Headers

```
Authorization: Bearer <jwt_token>
Cookie: next-auth.session-token=<session_token>
```

## Response Format

All APIs return consistent JSON responses:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## Authentication APIs

### POST /api/auth/signin

**Purpose**: User authentication
**Access**: Public

**Request Body**:

```json
{
  "email": "doctor@hospital.com",
  "password": "password123"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "doctor@hospital.com",
      "name": "Dr. Smith",
      "role": "DOCTOR"
    },
    "token": "jwt_token"
  }
}
```

## Patient APIs

### GET /api/patients

**Purpose**: Retrieve all patients with pagination
**Access**: ADMIN, DOCTOR, RECEPTIONIST

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for name/phone
- `sortBy`: Sort field (name, createdAt)
- `sortOrder`: asc/desc

**Response**:

```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "patient_id",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "1234567890",
        "email": "john@example.com",
        "dateOfBirth": "1990-01-01T00:00:00.000Z",
        "gender": "MALE",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### POST /api/patients

**Purpose**: Create new patient
**Access**: ADMIN, RECEPTIONIST

**Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "email": "john@example.com",
  "dateOfBirth": "1990-01-01",
  "gender": "MALE",
  "address": "123 Main St",
  "emergencyContact": "9876543210",
  "bloodGroup": "O+",
  "allergies": "None"
}
```

### GET /api/patients/[id]

**Purpose**: Get patient by ID
**Access**: ADMIN, DOCTOR, RECEPTIONIST

### PUT /api/patients/[id]

**Purpose**: Update patient information
**Access**: ADMIN, RECEPTIONIST

### DELETE /api/patients/[id]

**Purpose**: Soft delete patient
**Access**: ADMIN

## Appointment APIs

### GET /api/appointments

**Purpose**: Retrieve appointments with filters
**Access**: ADMIN, DOCTOR, RECEPTIONIST

**Query Parameters**:

- `date`: Filter by date (YYYY-MM-DD)
- `doctorId`: Filter by doctor
- `patientId`: Filter by patient
- `status`: Filter by status
- `sessionId`: Filter by session

**Response**:

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "appointment_id",
        "tokenNumber": "MED-M-001",
        "dateTime": "2024-01-01T09:00:00.000Z",
        "type": "CONSULTATION",
        "status": "SCHEDULED",
        "priority": "NORMAL",
        "consultationId": "consultation_id_if_exists",
        "patient": {
          "firstName": "John",
          "lastName": "Doe",
          "phone": "1234567890"
        },
        "doctor": {
          "name": "Dr. Smith",
          "specialization": "General Medicine"
        },
        "session": {
          "name": "Morning",
          "shortCode": "M"
        }
      }
    ]
  }
}
```

### POST /api/appointments

**Purpose**: Create new appointment
**Access**: ADMIN, RECEPTIONIST

**Request Body**:

```json
{
  "patientId": "patient_id",
  "doctorId": "doctor_id",
  "dateTime": "2024-01-01T09:00:00.000Z",
  "type": "CONSULTATION",
  "priority": "NORMAL",
  "sessionId": "session_id",
  "notes": "Patient complaint"
}
```

### POST /api/appointments/book-public

Note: Token format is derived from HospitalSettings.tokenPrefix and session short code configured in session templates (e.g., MED-M-001).

**Purpose**: Public appointment booking
**Access**: Public

**Request Body**:

```json
{
  "patient": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "email": "john@example.com"
  },
  "appointment": {
    "sessionId": "session_id",
    "type": "CONSULTATION",
    "priority": "NORMAL",
    "notes": "Health checkup"
  }
}
```

### PUT /api/appointments/[id]/status

**Purpose**: Update appointment status
**Access**: ADMIN, DOCTOR, RECEPTIONIST

**Request Body**:

```json
{
  "status": "IN_CONSULTATION",
  "actualStartTime": "2024-01-01T09:15:00.000Z"
}
```

## Session APIs

### GET /api/sessions

**Purpose**: Get appointment sessions for date
**Access**: Public

**Query Parameters**:

- `date`: Date (YYYY-MM-DD)

**Response**:

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_id",
        "name": "Morning",
        "shortCode": "M",
        "startTime": "09:00",
        "endTime": "13:00",
        "maxTokens": 100,
        "currentTokens": 25,
        "availableTokens": 75,
        "isActive": true
      }
    ]
  }
}
```

### POST /api/sessions

**Purpose**: Create sessions for date
**Access**: ADMIN

**Request Body**:

```json
{
  "date": "2024-01-01",
  "templates": [
    {
      "name": "Morning",
      "shortCode": "M",
      "startTime": "09:00",
      "endTime": "13:00",
      "maxTokens": 100
    }
  ]
}
```

## Prescription APIs

### GET /api/prescriptions

**Purpose**: Get prescriptions with filters
**Access**: ADMIN, DOCTOR

**Query Parameters**:

- `patientId`: Filter by patient
- `doctorId`: Filter by doctor
- `date`: Filter by date

### POST /api/prescriptions

**Purpose**: Create new prescription
**Access**: DOCTOR

**Request Body**:

```json
{
  "patientId": "patient_id",
  "appointmentId": "appointment_id",
  "consultation": {
    "soapNotes": {
      "subjective": "Patient reports fever and headache for 2 days.",
      "objective": "Temperature: 101.5°F, BP: 120/80 mmHg, Pulse: 85 bpm.",
      "assessment": "Viral fever, likely influenza.",
      "plan": "Prescribe Paracetamol, recommend rest and hydration."
    },
    "quickNotes": {
      "symptoms": ["Fever", "Headache"],
      "diagnoses": ["Viral Infection"]
    }
  },
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "5 days",
      "instructions": "After meals"
    }
  ]
}
```

### GET /api/prescriptions/pending-billing

**Purpose**: Get prescriptions needing billing
**Access**: ADMIN, RECEPTIONIST

**Response**:

```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": "prescription_id",
        "patient": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "doctor": {
          "name": "Dr. Smith"
        },
        "medicines": [...],
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ]
  }
}
```

## Billing APIs

### GET /api/bills

**Purpose**: Retrieve bills with filters
**Access**: ADMIN, RECEPTIONIST

**Query Parameters**:

- `patientId`: Filter by patient
- `doctorId`: Filter by doctor
- `paymentStatus`: Filter by payment status
- `dateFrom`: Start date filter
- `dateTo`: End date filter

### POST /api/bills

**Purpose**: Create new bill
**Access**: ADMIN, RECEPTIONIST

**Request Body**:

```json
{
  "patientId": "patient_id",
  "doctorId": "doctor_id",
  "prescriptionId": "prescription_id",
  "appointmentId": "appointment_id",
  "items": [
    {
      "itemType": "CONSULTATION",
      "itemName": "General Consultation",
      "quantity": 1,
      "unitPrice": 500,
      "gstRate": 18
    },
    {
      "itemType": "MEDICINE",
      "itemName": "Paracetamol 500mg",
      "quantity": 10,
      "unitPrice": 5,
      "gstRate": 12
    }
  ],
  "discountAmount": 50,
  "paymentMethod": "CASH",
  "notes": "Regular consultation"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "bill": {
      "id": "bill_id",
      "billNumber": "BILL-2024-001",
      "totalAmount": 550,
      "cgst": 49.5,
      "sgst": 49.5,
      "discountAmount": 50,
      "finalAmount": 599,
      "paymentStatus": "PAID",
      "items": [...]
    }
  }
}
```

### PUT /api/bills/[id]/payment

**Purpose**: Update bill payment status
**Access**: ADMIN, RECEPTIONIST

**Request Body**:

```json
{
  "paymentStatus": "PAID",
  "paidAmount": 599,
  "paymentMethod": "UPI"
}
```

## Doctor APIs

### GET /api/doctors

**Purpose**: Get all doctors
**Access**: ADMIN, RECEPTIONIST

### GET /api/doctors/consultation-fees

**Purpose**: Get doctor consultation fees
**Access**: ADMIN, RECEPTIONIST

**Response**:

```json
{
  "success": true,
  "data": {
    "fees": [
      {
        "doctorId": "doctor_id",
        "doctorName": "Dr. Smith",
        "consultationType": "GENERAL",
        "fee": 500,
        "isActive": true
      }
    ]
  }
}
```

### POST /api/doctors/consultation-fees

**Purpose**: Set doctor consultation fee
**Access**: ADMIN

**Request Body**:

```json
{
  "doctorId": "doctor_id",
  "consultationType": "GENERAL",
  "fee": 500
}
```

## Medicine APIs

### GET /api/medicines

**Purpose**: Get medicine database
**Access**: DOCTOR

**Query Parameters**:

- `search`: Search term
- `category`: Filter by category

### POST /api/medicines

**Purpose**: Add new medicine
**Access**: ADMIN

**Request Body**:

```json
{
  "name": "Paracetamol",
  "genericName": "Acetaminophen",
  "category": "Analgesic",
  "dosageForm": "Tablet",
  "strength": "500mg",
  "manufacturer": "ABC Pharma"
}
```

## Hospital Settings APIs

### GET /api/settings

**Purpose**: Get hospital settings
**Access**: ADMIN

### PUT /api/settings

**Purpose**: Update hospital settings
**Access**: ADMIN

**Request Body**:

```json
{
  "name": "MediCare Hospital",
  "tagline": "Your Health, Our Priority",
  "phone": "1234567890",
  "email": "info@medicare.com",
  "address": "123 Health Street",
  "tokenPrefix": "MED",
  "maxTokensPerSession": 100,
  "businessStartTime": "09:00",
  "businessEndTime": "22:00"
}
```

## Error Codes

### Authentication Errors

- `AUTH_REQUIRED`: Authentication required
- `INVALID_CREDENTIALS`: Invalid email/password
- `ACCESS_DENIED`: Insufficient permissions
- `SESSION_EXPIRED`: Session has expired

### Validation Errors

- `VALIDATION_ERROR`: Request validation failed
- `MISSING_REQUIRED_FIELD`: Required field missing
- `INVALID_FORMAT`: Invalid data format
- `DUPLICATE_ENTRY`: Duplicate record exists

### Business Logic Errors

- `PATIENT_NOT_FOUND`: Patient does not exist
- `APPOINTMENT_CONFLICT`: Appointment time conflict
- `SESSION_FULL`: Session has reached capacity
- `INVALID_STATUS_TRANSITION`: Invalid status change
- `PRESCRIPTION_NOT_FOUND`: Prescription not found

### System Errors

- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Rate Limiting

- Public APIs: 100 requests per minute per IP
- Authenticated APIs: 1000 requests per minute per user
- File upload APIs: 10 requests per minute per user

## API Versioning

Current API version: v1
Version header: `API-Version: v1`

Future versions will maintain backward compatibility for at least 6 months.

## Testing Endpoints

Use the following test credentials for API testing:

**Admin**:

- Email: admin@hospital.com
- Password: admin123

**Doctor**:

- Email: doctor@hospital.com
- Password: doctor123

**Receptionist**:

- Email: reception@hospital.com
- Password: reception123

## WebSocket APIs (Future)

Real-time features planned:

- Appointment queue updates
- Notification system
- Live chat support
- System status monitoring

## Additional and Updated APIs (Summary)

The following endpoints are available in addition to the sections above. All endpoints follow the same authentication and response format described earlier.

- Departments
  - GET /api/departments — List departments
  - POST /api/departments — Create department (ADMIN)
  - GET /api/departments/[id] — Get department
  - PUT /api/departments/[id] — Update department (ADMIN)
  - DELETE /api/departments/[id] — Soft delete/disable (ADMIN)

- Problem Categories
  - GET /api/problem-categories — List categories
  - POST /api/problem-categories — Create category (ADMIN)
  - GET /api/problem-categories/[id] — Get category
  - PUT /api/problem-categories/[id] — Update category (ADMIN)
  - DELETE /api/problem-categories/[id] — Delete category (ADMIN)

- Doctors
  - GET /api/doctors/public — Public doctor directory
  - GET /api/doctors/available — Availability by date/session
  - GET /api/doctors/availability — Admin/doctor schedule management
  - GET /api/doctors/routine — Routine/working hours overview

- Sessions (Extended)
  - POST /api/sessions/assign-doctors — Bulk assign doctors to sessions (ADMIN)
  - POST /api/sessions/create-default — Create sessions from templates for date (ADMIN)
  - GET /api/sessions/templates — List session templates from settings
  - GET /api/sessions/simple — Lightweight session listing for public booking
  - GET /api/sessions/[id] — Get session details

- Settings
  - GET /api/settings — Current system settings (ADMIN)
  - PUT /api/settings — Update general settings (ADMIN)
  - GET /api/settings/hospital — Detailed hospital branding/business settings (ADMIN)
  - GET /api/settings/lookups — Lookups for forms (e.g., genders, payment methods)

- Profile
  - GET /api/profile/me — Current user profile
  - GET /api/profile/stats — Personal dashboard metrics
  - PUT /api/profile/availability — Update doctor availability
  - POST /api/profile/me/avatar — Upload avatar
  - POST /api/profile/me/signature — Upload signature
  - GET /api/profile/public-card — Public profile card
  - GET /api/profile/[id] — Public profile by ID

- Uploads
  - POST /api/media-upload — Upload media (admin UI)
  - POST /api/upload — General upload endpoint for forms

- Queue & Realtime
  - GET /api/queue/stream — Server-Sent Events (SSE) stream for live queue updates

- Analytics & Reports
  - POST /api/analytics — Web vitals and custom metrics ingestion
  - POST /api/reports/link — Generate shareable report link
  - POST /api/reports/download — Generate/download report PDFs
  - POST /api/reports/notify — Notify users with report link

- Lab & Tests (if enabled)
  - GET/POST /api/lab-tests — Manage master lab tests
  - POST /api/lab/dispatch — Dispatch requests to lab
  - GET /api/lab/jobs — Lab job tracking
  - GET /api/lab/reports-state — Lab reports processing state

- Marketing & Notifications
  - GET/POST /api/marketing/campaigns — Campaign management
  - GET/POST /api/notifications and /api/notifications/[id]

- Users & Team
  - GET/POST /api/users — User management (ADMIN)
  - GET/PUT/DELETE /api/users/[id]
  - GET /api/team/public — Public-facing team listing

Notes
- Token format is configurable: typically {tokenPrefix}-{sessionShortCode}-{###} (e.g., MED-M-001). Session short codes (e.g., M/E/L or S1/S2) come from settings.
- All dates/times are ISO 8601 unless stated otherwise.

This API documentation provides comprehensive information for integrating with and extending the Hospital Management System.
