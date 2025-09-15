# Database Schema Documentation

## Overview

The Hospital Management System uses SQLite with Prisma ORM for data persistence. The schema is designed with strong relationships, audit trails, and scalability in mind.

## Core Models

### User Model

**Purpose**: Manages all system users (Admin, Doctor, Receptionist)

```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String
  password       String    // bcrypt hashed
  role           String    // ADMIN, DOCTOR, RECEPTIONIST
  department     String?
  specialization String?
  isActive       Boolean   @default(true)
  lastLogin      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

**Key Relationships**:

- One-to-many with Appointments (as doctor)
- One-to-many with Consultations
- One-to-many with Prescriptions
- One-to-many with Bills (as doctor and creator)
- One-to-many with DoctorConsultationFee

**Business Rules**:

- Email must be unique across system
- Password stored as bcrypt hash
- isActive flag for soft deletion
- Role-based access control implementation

### Patient Model

**Purpose**: Stores patient demographic and medical information

```prisma
model Patient {
  id               String    @id @default(cuid())
  firstName        String
  lastName         String
  email            String?
  phone            String    @unique
  dateOfBirth      DateTime?
  gender           String?   // MALE, FEMALE, OTHER
  address          String?
  idProof          String?
  idNumber         String?
  emergencyContact String?
  bloodGroup       String?
  allergies        String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

**Key Relationships**:

- One-to-many with Appointments
- One-to-many with Prescriptions
- One-to-many with Bills
- One-to-many with Vitals
- One-to-many with Consultations

**Business Rules**:

- Phone number must be unique (primary identifier)
- Email is optional (for walk-in patients)
- Supports multiple ID proof types
- Emergency contact for critical situations

### Appointment Model

**Purpose**: Manages appointment scheduling with token-based system

```prisma
model Appointment {
  id                String    @id @default(cuid())
  patientId         String
  doctorId          String
  consultationId    String?   @unique
  dateTime          DateTime
  type              String    @default("CONSULTATION")
  status            String    @default("SCHEDULED")
  notes             String?
  tokenNumber       String?   // Format: MED-M-001
  sessionId         String?
  priority          String    @default("NORMAL")
  estimatedDuration Int?      @default(30)
  actualStartTime   DateTime?
  actualEndTime     DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

**Appointment Types**:

- CONSULTATION: Regular doctor consultation
- FOLLOW_UP: Follow-up appointment
- EMERGENCY: Emergency consultation
- ROUTINE_CHECKUP: Preventive care

**Appointment Status Flow**:

```
SCHEDULED → ARRIVED → WAITING → IN_CONSULTATION → COMPLETED
                                      ↓
                               CANCELLED / NO_SHOW
```

**Priority Levels**:

- EMERGENCY: Immediate attention required
- HIGH: Urgent but not emergency
- NORMAL: Standard appointment
- LOW: Non-urgent consultation

### AppointmentSession Model

**Purpose**: Manages time-based appointment sessions

```prisma
model AppointmentSession {
  id            String   @id @default(cuid())
  date          DateTime
  name          String   // "Morning", "Afternoon", "Evening"
  shortCode     String   // "M", "N", "E", "LE"
  startTime     String   // "09:00"
  endTime       String   // "13:00"
  maxTokens     Int      @default(50)
  currentTokens Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Session Configuration**:

- Sessions defined in hospital-settings.json
- Daily session creation based on templates
- Token capacity management per session
- Unique constraint on date + shortCode

### Consultation Model

**Purpose**: Detailed consultation records

```prisma
model Consultation {
  id             String    @id @default(cuid())
  appointmentId  String    @unique
  patientId      String
  doctorId       String
  subjective     String?   // Patient complaints and symptoms
  objective      String?   // Clinical findings and examination results
  assessment     String?   // Diagnosis and clinical assessment
  plan           String?   // Treatment plan and follow-up instructions
  notes          String?
  followUpDate   DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

**SOAP Integration**:

- chiefComplaint: Subjective (S)
- examination: Objective (O)
- diagnosis: Assessment (A)
- treatment: Plan (P)

### Prescription Model

**Purpose**: Medicine prescriptions with SOAP notes

```prisma
model Prescription {
  id             String   @id @default(cuid())
  consultationId String   @unique
  patientId      String
  doctorId       String
  medicines      String   // JSON array of medicine objects
  instructions   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Medicine JSON Structure**:

```json
[
  {
    "name": "Paracetamol",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "duration": "5 days",
    "instructions": "After meals"
  }
]
```

### Bill Model

**Purpose**: GST-compliant billing system

```prisma
model Bill {
  id              String   @id @default(cuid())
  billNumber      String   @unique
  patientId       String
  prescriptionId  String?
  appointmentId   String?
  doctorId        String
  consultationFee Float?
  totalAmount     Float
  cgst            Float?   // Central GST
  sgst            Float?   // State GST
  igst            Float?   // Integrated GST
  discountAmount  Float?
  finalAmount     Float
  paymentStatus   String   @default("PENDING")
  paymentMethod   String?
  paidAmount      Float?
  balanceAmount   Float?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
}
```

**Payment Status Flow**:

```
PENDING → PARTIAL → PAID
    ↓         ↓
CANCELLED  REFUNDED
```

**GST Calculation Logic**:

- CGST = GST Rate / 2
- SGST = GST Rate / 2
- IGST = GST Rate (for inter-state transactions)

### BillItem Model

**Purpose**: Individual items in a bill

```prisma
model BillItem {
  id          String  @id @default(cuid())
  billId      String
  itemType    String  // CONSULTATION, MEDICINE, LAB_TEST, THERAPY, PROCEDURE, OTHER
  itemName    String
  quantity    Int     @default(1)
  unitPrice   Float?
  totalPrice  Float?
  gstRate     Float?
}
```

**Item Types**:

- CONSULTATION: Doctor consultation fees
- MEDICINE: Prescribed medications
- LAB_TEST: Laboratory investigations
- THERAPY: Physiotherapy, etc.
- PROCEDURE: Medical procedures
- OTHER: Miscellaneous charges

## Configuration Models

### HospitalSettings Model

**Purpose**: Centralized hospital configuration

```prisma
model HospitalSettings {
  id                     String  @id @default(cuid())
  name                   String  @default("MediCare Hospital")
  tagline                String  @default("Your Health, Our Priority")
  logo                   String?
  primaryColor           String  @default("#2563eb")
  secondaryColor         String  @default("#1e40af")
  phone                  String  @default("+1 (555) 123-4567")
  email                  String  @default("info@medicare.com")
  address                String  @default("123 Health Street")
  tokenPrefix            String  @default("T")
  sessionPrefix          String  @default("S")
  defaultSessionDuration Int     @default(240)
  maxTokensPerSession    Int     @default(50)
  allowPublicBooking     Boolean @default(true)
  requirePatientDetails  Boolean @default(true)
  autoAssignTokens       Boolean @default(true)
  enableCarryForward     Boolean @default(true)
  businessStartTime      String  @default("09:00")
  businessEndTime        String  @default("17:00")
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

### DoctorConsultationFee Model

**Purpose**: Doctor-specific consultation rates

```prisma
model DoctorConsultationFee {
  id               String  @id @default(cuid())
  doctorId         String
  consultationType String  @default("GENERAL")
  fee              Float
  isActive         Boolean @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Consultation Types**:

- GENERAL: Standard consultation
- SPECIALIST: Specialized consultation
- EMERGENCY: Emergency consultation

## Audit and Tracking Models

### AppointmentAssignmentLog Model

**Purpose**: Audit trail for doctor reassignments

```prisma
model AppointmentAssignmentLog {
  id            String   @id @default(cuid())
  appointmentId String
  fromDoctorId  String?
  toDoctorId    String
  changedBy     String
  reason        String?
  createdAt     DateTime @default(now())
}
```

### DoctorAvailability Model

**Purpose**: Doctor schedule and availability management

```prisma
model DoctorAvailability {
  id          String    @id @default(cuid())
  doctorId    String
  type        String    // UNAVAILABLE, LEAVE, HOLIDAY, CUSTOM
  startDate   DateTime
  endDate     DateTime?
  startTime   String?
  endTime     String?
  weekdays    String?   // JSON array [1,2,3] for recurring
  reason      String?
  isRecurring Boolean   @default(false)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Supporting Models

### Medicine Model

**Purpose**: Master medicine database

```prisma
model Medicine {
  id           String   @id @default(cuid())
  name         String   @unique
  genericName  String?
  category     String?
  dosageForm   String?  // tablet, syrup, injection
  strength     String?
  manufacturer String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Vital Model

**Purpose**: Patient vital signs tracking

```prisma
model Vital {
  id            String   @id @default(cuid())
  patientId     String
  temperature   Float?
  bloodPressure String?  // "120/80"
  heartRate     Int?
  weight        Float?
  height        Float?
  bmi           Float?
  notes         String?
  recordedAt    DateTime @default(now())
  recordedBy    String?
}
```

## Database Constraints and Indexes

### Unique Constraints

- User.email
- Patient.phone
- Bill.billNumber
- Medicine.name
- AppointmentSession(date, shortCode)
- DoctorConsultationFee(doctorId, consultationType)

### Foreign Key Relationships

All models maintain referential integrity through Prisma foreign key constraints with appropriate cascade behaviors.

### Performance Indexes

- User: email, role
- Patient: phone, firstName, lastName
- Appointment: patientId, doctorId, dateTime, status, tokenNumber
- Bill: patientId, doctorId, billNumber, paymentStatus
- Prescription: patientId, doctorId, consultationId

## Data Migration Considerations

### SQLite to PostgreSQL/MySQL

- CUID primary keys are database-agnostic
- DateTime fields compatible across databases
- JSON fields supported in modern databases
- Float fields can be migrated to DECIMAL for financial data

### Backup and Recovery

- Regular database backups recommended
- Export scripts for data migration
- Seed scripts for initial data setup
- Development data reset capabilities

## Security Considerations

### Data Protection

- Password hashing with bcrypt
- No sensitive data in logs
- Audit trails for critical operations
- Soft deletion for user records

### Access Control

- Role-based data access
- User session management
- API endpoint protection
- Data validation at model level

## Schema Updates & Configuration Notes

- HospitalSettings additions
  - vision: string — Organization vision statement
  - mission: string — Organization mission statement
  - lunchBreakStart/lunchBreakEnd: string — Business hours refinement
  - socialFacebook/socialTwitter/socialInstagram/socialLinkedin: optional links

- Token and Session formatting
  - tokenPrefix (settings) and sessionShortCode (session) compose the tokenNumber:
    Example: MED-M-001. Short codes are configurable (e.g., M/E/L or S1/S2/S3).

- New relation models
  - DoctorSessionAssignment: links doctors to AppointmentSession with isActive flag; enforces @@unique([doctorId, sessionId]) for one doctor per session assignment entry.

- Problem Categories linkage
  - AppointmentProblemCategory provides a many-to-many mapping between appointments and problem categories with uniqueness on (appointmentId, problemCategoryId).

This schema documentation provides the foundation for understanding data relationships and implementing new features while maintaining data integrity.
