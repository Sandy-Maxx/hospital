# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a comprehensive **Hospital Management System** built with **Next.js 14**, **TypeScript**, **Prisma ORM**, and **SQLite**. The system manages patients, appointments, consultations, prescriptions, and billing with role-based authentication for Admin, Doctor, and Receptionist users.

## Key Development Commands

### Database Operations
```bash
# Push database schema changes to SQLite
npm run db:push

# Open Prisma Studio database browser
npm run db:studio

# Generate Prisma client after schema changes
npm run db:generate

# Seed database with initial data (includes test users)
npm run seed
```

### Development Workflow
```bash
# Start development server (Next.js)
npm run dev

# Build for production
npm run build

# Run production server
npm run start

# Run ESLint
npm run lint

# Initial project setup (database + seed)
npm run setup
```

### Database Seeding
The seed script creates test users with these credentials:
- **Admin**: admin@hospital.com / admin123
- **Doctor**: doctor@hospital.com / doctor123  
- **Receptionist**: reception@hospital.com / reception123

## Architecture & Structure

### Core Architecture Pattern
This is a **monolithic Next.js application** using the App Router with:
- **Route Groups**: `(authenticated)` for protected routes
- **Role-based Access Control**: Implemented via NextAuth.js with JWT
- **Server-side Rendering**: API routes + page components
- **Real-time Features**: Socket.io for live queue updates

### Database Design
**SQLite** database with **Prisma ORM** following these key relationships:
```
User (roles: ADMIN, DOCTOR, RECEPTIONIST)
├── appointments (1:many)
├── consultations (1:many) 
├── prescriptions (1:many)
└── bills (1:many)

Patient
├── appointments (1:many)
├── consultations (1:many)
├── prescriptions (1:many)
└── vitals (1:many)

Appointment → Patient + Doctor + Session
├── consultation (1:1)
├── bills (1:many)
└── tokenNumber (auto-generated)
```

### Directory Structure
```
app/
├── (authenticated)/           # Protected routes requiring authentication
│   ├── admin/                # Admin dashboard and management
│   ├── doctor/               # Doctor console and consultation
│   ├── receptionist/         # Reception desk operations
│   ├── appointments/         # Appointment management
│   ├── billing/              # Billing and payments
│   ├── patients/             # Patient records
│   └── prescriptions/        # Prescription management
├── api/                      # Next.js API routes
│   ├── appointments/         # Appointment CRUD operations
│   ├── patients/            # Patient management
│   ├── bills/               # Billing operations
│   └── consultations/       # Medical consultation records
└── auth/signin/             # Authentication pages

components/
├── ui/                      # Reusable UI components (Button, Card, Input, etc.)
├── layout/                  # Header, Sidebar navigation
├── appointments/            # Appointment booking, token printing
├── billing/                 # Bill forms and payment components
└── charts/                  # Patient chart modals

lib/
├── auth.ts                  # NextAuth.js configuration
├── prisma.ts               # Prisma client singleton
├── utils.ts                # Utility functions (cn, etc.)
└── seed.ts                 # Database seeding script

prisma/
└── schema.prisma           # Database schema definition
```

## Critical Development Rules

### Authentication & Authorization
- **ALL protected routes** must verify session via `getServerSession(authOptions)`
- **Role-based menu items** are defined in `components/layout/sidebar.tsx`
- **User roles** control access to different dashboard sections
- **JWT tokens** include user role for client-side authorization

### Database Schema Rules
- **NEVER use `Decimal` type** - SQLite requires `Float` for monetary values
- **Maintain existing foreign key relationships** - breaking these breaks the system
- **Add new fields as optional** to avoid breaking existing data
- **Use Prisma transactions** for multi-table operations

### Token & Queue System
- **Token format**: `{prefix}-{session}-{number}` (e.g., "T-M-001")
- **Session management** via `AppointmentSession` model with shortCodes (S1, S2, S3)
- **Sequential numbering** within sessions, auto-generated in API routes
- **Queue status tracking**: SCHEDULED → ARRIVED → WAITING → IN_CONSULTATION → COMPLETED

### API Patterns
All API routes follow this structure:
```typescript
// Success Response
{
  success: true,
  data: {...},
  message?: "Optional message"
}

// Error Response  
{
  success: false,
  error: "Error message",
  details?: "Additional details"
}
```

### Component Architecture
- **Role-based navigation** in sidebar with dynamic menu items
- **Consistent form patterns** using React Hook Form + Zod validation
- **Toast notifications** for user feedback via react-hot-toast
- **Modal patterns** for appointment booking, patient charts
- **Lucide React icons** throughout the application

## Key Business Logic

### Appointment Workflow
1. **Session Selection**: Choose from active AppointmentSessions (Morning/S1, Afternoon/S2, Evening/S3)
2. **Doctor Assignment**: Based on availability and session assignments
3. **Token Generation**: Auto-generated sequential tokens per session
4. **Status Progression**: Tracks patient journey through consultation
5. **Billing Integration**: Automatic bill creation upon consultation completion

### Prescription System
- **SOAP Format**: Subjective, Objective, Assessment, Plan structure
- **Medicine Database**: JSON-stored medicine objects with dosages
- **Integration**: Linked to consultations and automatically generates bills
- **Digital Format**: Includes QR codes for verification

### Billing System
- **GST Compliance**: CGST + SGST calculations for Indian tax requirements  
- **Multiple Payment Methods**: Cash, Card, UPI support
- **Prescription Integration**: Auto-populated from consultation fees
- **Status Tracking**: PENDING → PARTIAL → PAID workflow

## Testing & Development

### Manual Testing Workflow
1. **Login** with different role credentials to test role-based access
2. **Patient Registration** → **Appointment Booking** → **Token Generation**
3. **Doctor Console** → **Consultation** → **Prescription** → **Billing**
4. **Queue Management** → Live status updates between receptionist/doctor views

### Key Integration Points
- **NextAuth.js session** drives all authentication
- **Prisma client** (`lib/prisma.ts`) handles all database operations
- **Hospital settings** (`data/hospital-settings.json`) configures token prefixes
- **Socket.io** enables real-time queue updates across user sessions

## Performance Considerations

### Database Optimization
- Use Prisma `select` to fetch only required fields
- Implement pagination for large datasets (appointments, patients)
- Avoid N+1 queries with proper `include` statements

### Critical Dependencies
- **Next.js 14**: Framework and App Router
- **NextAuth.js**: Authentication and session management  
- **Prisma**: Database ORM with SQLite
- **React Hook Form + Zod**: Form handling and validation
- **Tailwind CSS**: Styling system
- **Socket.io**: Real-time updates

This system prioritizes **data integrity**, **role-based security**, and **healthcare workflow optimization**. All modifications must preserve existing user workflows and maintain HIPAA-style data protection standards.
