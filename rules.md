# Hospital Management System - Development Rules

## 🏥 Project Overview
This is a comprehensive Hospital Management System built with Next.js, Prisma, NextAuth.js, and SQLite. The system handles patient management, appointments, consultations, prescriptions, billing, and role-based authentication for Admin, Doctor, and Receptionist roles.

## 🎯 Core Principles

### 1. Single Source of Truth (SSOT)
- **Hospital Settings**: All hospital configuration must come from `data/hospital-settings.json` and `HospitalSettings` model
- **User Authentication**: All auth logic must go through NextAuth.js configuration in `lib/auth.ts`
- **Database Schema**: All data models must be defined in `prisma/schema.prisma` only
- **API Routes**: Each entity should have ONE primary API route (e.g., `/api/appointments`, `/api/bills`)
- **Component Props**: Pass data down through props, avoid duplicate data fetching in child components

### 2. DRY (Don't Repeat Yourself)
- **Reusable Components**: Use existing components in `components/` directory before creating new ones
- **Utility Functions**: Common logic must be placed in `lib/utils.ts`
- **API Helpers**: Database operations should use shared Prisma instance from `lib/prisma.ts`
- **Type Definitions**: Extend existing types in `types/` rather than creating duplicates
- **Styling**: Use existing Tailwind classes and component patterns

### 3. Cautious Development Approach
- **NEVER modify existing database schema without understanding full impact**
- **ALWAYS check existing API routes before creating new ones**
- **PRESERVE existing component interfaces and prop structures**
- **MAINTAIN backward compatibility with existing features**
- **TEST changes with existing user flows before implementing new features**

## 📁 Architecture & File Structure

### Core Directories
```
app/
├── (authenticated)/          # Protected routes requiring login
│   ├── admin/               # Admin dashboard and management
│   ├── doctor/              # Doctor dashboard and consultation
│   ├── receptionist/        # Reception desk and appointments
│   ├── appointments/        # Appointment management
│   ├── billing/             # Billing and payment processing
│   ├── patients/            # Patient records and history
│   └── prescriptions/       # Prescription management
├── api/                     # API routes for backend operations
├── auth/                    # Authentication pages (signin)
└── globals.css              # Global styles

components/
├── appointments/            # Appointment-related components
├── billing/                 # Billing and payment components
├── charts/                  # Analytics and chart components
├── layout/                  # Header, sidebar, navigation
├── patients/                # Patient management components
└── ui/                      # Reusable UI components

lib/
├── auth.ts                  # NextAuth configuration
├── prisma.ts                # Prisma client instance
├── seed.ts                  # Database seeding script
└── utils.ts                 # Utility functions

prisma/
└── schema.prisma            # Database schema definition
```

## 🔐 Authentication & Authorization

### User Roles & Permissions
- **ADMIN**: Full system access, user management, settings
- **DOCTOR**: Patient consultation, prescriptions, medical records
- **RECEPTIONIST**: Appointment booking, patient registration, billing

### Authentication Rules
1. **NEVER bypass NextAuth.js authentication**
2. **ALWAYS check user role before granting access to features**
3. **USE session data from `useSession()` hook for client-side auth**
4. **PROTECT API routes with `getServerSession()` for server-side auth**
5. **REDIRECT users to appropriate dashboards based on role**

### Login Credentials (Test Users)
```
Admin: admin@hospital.com / admin123
Doctor: doctor@hospital.com / doctor123
Receptionist: reception@hospital.com / reception123
```

## 🗄️ Database Rules

### Schema Modifications
- **NEVER delete existing models or fields without migration plan**
- **ALWAYS use `Float` type instead of `Decimal` for SQLite compatibility**
- **MAINTAIN existing relationships and foreign keys**
- **ADD new fields as optional (`?`) to avoid breaking existing data**

### Data Integrity
- **USE Prisma transactions for multi-table operations**
- **VALIDATE data at both client and server levels**
- **HANDLE database errors gracefully with user-friendly messages**
- **BACKUP database before major schema changes**

### Key Models & Relationships
```
User (Admin/Doctor/Receptionist)
├── appointments (1:many)
├── consultations (1:many)
├── prescriptions (1:many)
└── bills (1:many)

Patient
├── appointments (1:many)
├── prescriptions (1:many)
├── bills (1:many)
└── vitals (1:many)

Appointment
├── patient (many:1)
├── doctor (many:1)
├── session (many:1)
├── consultation (1:1)
└── bills (1:many)
```

## 🎨 UI/UX Guidelines

### Component Development
- **EXTEND existing component patterns, don't create new ones**
- **USE Lucide React icons consistently**
- **FOLLOW existing modal and form patterns**
- **MAINTAIN responsive design with Tailwind classes**

### User Experience
- **PROVIDE immediate feedback for user actions (toast notifications)**
- **SHOW loading states during async operations**
- **HANDLE errors gracefully with clear error messages**
- **MAINTAIN consistent navigation and layout across pages**

### Styling Standards
- **USE existing color scheme (blue primary, professional medical theme)**
- **FOLLOW existing spacing and typography patterns**
- **MAINTAIN accessibility standards (proper contrast, keyboard navigation)**
- **KEEP mobile-responsive design principles**

## 🔧 API Development

### API Route Standards
- **ONE primary route per entity** (`/api/appointments`, `/api/patients`, etc.)
- **USE proper HTTP methods** (GET, POST, PUT, DELETE)
- **RETURN consistent JSON response format**
- **HANDLE authentication in middleware or route handlers**
- **VALIDATE request data with proper error responses**

### Response Format
```typescript
// Success Response
{
  success: true,
  data: {...},
  message?: "Optional success message"
}

// Error Response
{
  success: false,
  error: "Error message",
  details?: "Additional error details"
}
```

## 📋 Feature Development Rules

### Before Adding New Features
1. **CHECK if similar functionality already exists**
2. **REVIEW existing components that could be extended**
3. **UNDERSTAND current user workflows and integration points**
4. **PLAN database changes carefully to avoid breaking existing data**

### Token & Appointment System
- **RESPECT existing token generation logic** (format: `{prefix}-{session}-{number}`)
- **USE AppointmentSession model for session management**
- **MAINTAIN sequential token numbering within sessions**
- **PRESERVE priority-based queue system**

### Billing System
- **FOLLOW GST-compliant calculations** (CGST + SGST = Total GST)
- **USE existing BillItem model for line items**
- **INTEGRATE with prescription data for automatic billing**
- **MAINTAIN payment status tracking**

### Prescription System
- **PRESERVE SOAP notes structure** (Subjective, Objective, Assessment, Plan)
- **MAINTAIN medicine selection and dosage patterns**
- **INTEGRATE with billing for seamless workflow**
- **KEEP consultation data linked to appointments**

## 🚨 Critical Don'ts

### Database
- ❌ **NEVER use `Decimal` type with SQLite** (use `Float` instead)
- ❌ **NEVER delete existing models without migration**
- ❌ **NEVER change primary key structures**
- ❌ **NEVER break existing foreign key relationships**

### Authentication
- ❌ **NEVER bypass NextAuth.js authentication**
- ❌ **NEVER hardcode user credentials in production**
- ❌ **NEVER expose sensitive user data in client-side code**
- ❌ **NEVER allow unauthorized access to protected routes**

### Code Structure
- ❌ **NEVER duplicate existing components**
- ❌ **NEVER create multiple API routes for the same entity**
- ❌ **NEVER modify existing component interfaces without checking usage**
- ❌ **NEVER break existing user workflows**

## 🔍 Testing & Validation

### Before Deployment
1. **TEST all user roles and their specific workflows**
2. **VERIFY token printing and billing functionality**
3. **CHECK appointment booking and consultation flow**
4. **VALIDATE prescription creation and billing integration**
5. **ENSURE responsive design works on mobile devices**

### User Workflow Testing
- **Admin**: User management, system settings, reports
- **Doctor**: Patient consultation, prescription creation, dashboard analytics
- **Receptionist**: Appointment booking, token printing, billing

## 📚 Dependencies & Libraries

### Core Dependencies (DO NOT CHANGE)
- **Next.js 14**: Framework and routing
- **NextAuth.js**: Authentication and session management
- **Prisma**: Database ORM and migrations
- **React Hook Form**: Form handling and validation
- **Tailwind CSS**: Styling and responsive design
- **Lucide React**: Icon library
- **React Hot Toast**: Notifications

### Adding New Dependencies
- **JUSTIFY the need for new dependencies**
- **CHECK if existing libraries can handle the requirement**
- **ENSURE compatibility with existing stack**
- **UPDATE package.json with proper version constraints**

## 🎯 Performance Guidelines

### Database Optimization
- **USE Prisma's `select` to fetch only required fields**
- **IMPLEMENT pagination for large data sets**
- **AVOID N+1 queries with proper `include` statements**
- **INDEX frequently queried fields**

### Client-Side Performance
- **LAZY load components when appropriate**
- **OPTIMIZE images and assets**
- **MINIMIZE bundle size by avoiding unnecessary imports**
- **USE React.memo for expensive components**

## 📝 Documentation Standards

### Code Comments
- **DOCUMENT complex business logic**
- **EXPLAIN non-obvious database relationships**
- **COMMENT API route purposes and expected payloads**
- **DESCRIBE component prop interfaces**

### Commit Messages
```
feat: Add patient consultation queue management
fix: Resolve token printing QR code generation
refactor: Optimize appointment booking workflow
docs: Update API documentation for billing endpoints
```

## 🔄 Maintenance & Updates

### Regular Maintenance
- **REVIEW and update dependencies quarterly**
- **MONITOR database performance and optimize queries**
- **BACKUP database regularly**
- **UPDATE documentation when adding features**

### Version Control
- **USE meaningful branch names** (`feature/patient-analytics`, `fix/billing-gst`)
- **KEEP commits atomic and focused**
- **WRITE descriptive commit messages**
- **REVIEW code before merging to main branch**

---

## 🎉 Summary

This Hospital Management System is a production-ready application with comprehensive features. When extending or modifying the system:

1. **RESPECT existing architecture and patterns**
2. **MAINTAIN single source of truth principles**
3. **FOLLOW DRY principles to avoid code duplication**
4. **TEST thoroughly before deploying changes**
5. **DOCUMENT new features and changes**

The system is designed to be maintainable, scalable, and user-friendly. Any modifications should enhance these qualities while preserving the existing functionality that users depend on.

**Remember: This is a healthcare system. Reliability, security, and data integrity are paramount.**
