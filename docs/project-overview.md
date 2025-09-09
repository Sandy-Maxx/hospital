# Hospital Management System - Project Overview

## System Architecture

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript, React 18
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: NextAuth.js with JWT strategy
- **Database**: SQLite with Prisma ORM
- **State Management**: React hooks and context
- **UI Components**: Custom components with Lucide React icons
- **File Handling**: HTML2Canvas, jsPDF for printing
- **QR Codes**: qrcode.react for token generation

### Project Structure
```
d:\Hospital\
├── app/                          # Next.js 13+ App Router
│   ├── (authenticated)/          # Protected routes
│   │   ├── admin/               # Admin dashboard
│   │   ├── appointments/        # Appointment management
│   │   ├── billing/            # Billing system
│   │   ├── dashboard/          # Main dashboard
│   │   ├── doctor/             # Doctor interface
│   │   ├── patients/           # Patient management
│   │   ├── prescriptions/      # Prescription system
│   │   ├── queue/              # Queue management
│   │   └── reports/            # Reporting system
│   ├── api/                    # API routes
│   │   ├── appointments/       # Appointment APIs
│   │   ├── auth/              # Authentication APIs
│   │   ├── bills/             # Billing APIs
│   │   ├── doctors/           # Doctor management APIs
│   │   ├── patients/          # Patient APIs
│   │   ├── prescriptions/     # Prescription APIs
│   │   └── sessions/          # Session management APIs
│   ├── auth/                  # Authentication pages
│   ├── book-appointment/      # Public booking
│   └── globals.css           # Global styles
├── components/               # Reusable components
│   ├── appointments/        # Appointment components
│   ├── billing/            # Billing components
│   ├── charts/             # Chart components
│   ├── layout/             # Layout components
│   ├── prescriptions/      # Prescription components
│   ├── soap/               # SOAP notes components
│   └── ui/                 # Base UI components
├── lib/                    # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   └── seed.ts            # Database seeding
├── prisma/                # Database schema
├── data/                  # Configuration files
└── types/                 # TypeScript definitions
```

## Core Features

### 1. Authentication & Authorization
- **NextAuth.js Integration**: JWT-based authentication
- **Role-Based Access**: ADMIN, DOCTOR, RECEPTIONIST roles
- **Session Management**: Secure session handling
- **Protected Routes**: Route-level authorization

### 2. Patient Management
- **Patient Registration**: Comprehensive patient profiles
- **Medical History**: Track patient medical records
- **Contact Information**: Emergency contacts and communication
- **Search & Filter**: Advanced patient search capabilities

### 3. Appointment System
- **Token-Based Scheduling**: Sequential token generation (MED-M-001 format)
- **Session Management**: Configurable time slots (Morning, Afternoon, Evening, Late Eve)
- **Public Booking**: Anonymous appointment booking
- **Queue Management**: Real-time appointment status tracking
- **Priority System**: EMERGENCY, HIGH, NORMAL, LOW priorities
- **Status Workflow**: SCHEDULED → ARRIVED → WAITING → IN_CONSULTATION → COMPLETED

### 4. Doctor Dashboard
- **Appointment Queue**: Real-time patient queue
- **Consultation Interface**: Start/complete consultations
- **Patient History**: Access to patient medical records
- **Prescription Management**: Create and manage prescriptions

### 5. Prescription System
- **SOAP Notes Integration**: Subjective, Objective, Assessment, Plan
- **Medicine Management**: Comprehensive drug database
- **Dosage Instructions**: Detailed prescription instructions
- **Quick Selection Tools**: Common symptoms and diagnoses
- **Consultation Mode**: Integrated with appointment workflow

### 6. Billing System
- **GST Compliance**: CGST/SGST calculations
- **Multiple Item Types**: Consultation, Medicine, Lab Test, Therapy, Procedure
- **Prescription Integration**: Auto-populate from prescriptions
- **Payment Tracking**: Multiple payment methods and status
- **Bill Generation**: Professional bill printing with hospital branding

### 7. Hospital Configuration
- **Settings Management**: Centralized hospital configuration
- **Session Templates**: Configurable appointment sessions
- **Token Configuration**: Customizable token prefixes and formats
- **Business Hours**: Flexible scheduling parameters
- **Branding**: Logo, colors, and contact information

## Data Flow Architecture

### Authentication Flow
```
User Login → NextAuth.js → Credential Validation → JWT Token → Protected Routes
```

### Appointment Booking Flow
```
Public Form → Patient Registration/Update → Session Selection → Token Generation → Appointment Creation
```

### Consultation Flow
```
Doctor Dashboard → Start Consultation → Prescription Page (SOAP) → Complete Consultation → Billing
```

### Billing Flow
```
Prescription → Billing Module → Item Selection → GST Calculation → Payment Processing → Bill Generation
```

## Database Design Principles

### Single Source of Truth (SSOT)
- Hospital settings from `data/hospital-settings.json` and `HospitalSettings` model
- User roles and permissions centralized in `User` model
- Appointment sessions managed through `AppointmentSession` model

### Relationship Integrity
- Foreign key constraints ensure data consistency
- Cascade deletes for dependent records (BillItems)
- Audit trails for critical operations (AppointmentAssignmentLog)

### Performance Considerations
- Indexed fields for frequent queries (email, phone, tokenNumber)
- JSON fields for flexible data storage (medicines, vitals)
- Optimized queries with proper relations

## Security Architecture

### Authentication Security
- bcrypt password hashing
- JWT token-based sessions
- Role-based access control
- Session timeout management

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention through Prisma
- XSS protection through React's built-in sanitization
- CSRF protection through NextAuth.js

### API Security
- Authentication middleware for protected routes
- Role-based endpoint access
- Request validation and sanitization
- Error handling without information leakage

## Configuration Management

### Environment Variables
- Database connection strings
- NextAuth.js secrets
- API keys and external service credentials
- Environment-specific configurations

### Hospital Settings
- Centralized configuration in `data/hospital-settings.json`
- Runtime configuration updates
- Session template management
- Branding and contact information

## Integration Points

### Internal Integrations
- NextAuth.js with Prisma adapter
- React Hook Form with Zod validation
- Tailwind CSS with custom design tokens
- HTML2Canvas with jsPDF for printing

### External Integration Readiness
- API structure ready for external EMR systems
- Webhook support for real-time notifications
- Export capabilities for data migration
- Standard medical data formats support

## Performance Characteristics

### Current Performance
- SQLite database for development and small deployments
- Client-side rendering with server-side API calls
- Optimized component re-rendering with React hooks
- Lazy loading for large data sets

### Scalability Considerations
- Database migration path to PostgreSQL/MySQL
- API rate limiting implementation ready
- Caching strategies for frequently accessed data
- Component-level code splitting opportunities

## Development Workflow

### Code Organization
- Feature-based component organization
- Shared utilities in `lib/` directory
- Type definitions in `types/` directory
- API routes following RESTful conventions

### Development Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Consistent naming conventions
- Component composition patterns

## Deployment Architecture

### Current Setup
- Next.js application with SQLite database
- File-based session storage
- Local file uploads for hospital assets
- Development and production environment separation

### Production Readiness
- Environment variable configuration
- Database migration scripts
- Asset optimization and CDN readiness
- Monitoring and logging integration points

## Business Logic Implementation

### Appointment Scheduling
- Token generation with hospital prefix
- Session capacity management
- Priority-based queue ordering
- Automatic status transitions

### Billing Calculations
- GST rate application (CGST = GST/2, SGST = GST/2)
- Discount calculations
- Payment status tracking
- Bill number generation

### User Management
- Role-based feature access
- Department and specialization tracking
- Activity logging and audit trails
- Password security requirements

This overview provides the foundation for understanding the system architecture and serves as a reference for all development, debugging, and enhancement activities.
