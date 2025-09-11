# Hospital Management System Documentation

This documentation provides comprehensive information for contributors to understand, develop, debug, test, and enhance the Hospital Management System.

## Documentation Structure

### Core Documentation

- [`project-overview.md`](./project-overview.md) - Complete system overview and architecture
- [`database-schema.md`](./database-schema.md) - Database design and relationships
- [`api-documentation.md`](./api-documentation.md) - API endpoints and specifications
- [`component-architecture.md`](./component-architecture.md) - Frontend components and structure

### Development & Maintenance

- [`security-analysis.md`](./security-analysis.md) - Security risks and hardening recommendations
- [`performance-optimization.md`](./performance-optimization.md) - Performance issues and optimization strategies
- [`deployment-guide.md`](./deployment-guide.md) - Production deployment and configuration
- [`development-guidelines.md`](./development-guidelines.md) - Coding standards and best practices
- [`ui-ux-improvements.md`](./ui-ux-improvements.md) - User experience enhancement recommendations

### Feature Documentation

- [`feature-specifications.md`](./feature-specifications.md) - Detailed feature descriptions and workflows
- [`mobile-app-strategy.md`](./mobile-app-strategy.md) - React Native conversion strategy

## Quick Start

1. Understanding the System: Start with `project-overview.md`
2. Database Operations: Reference `database-schema.md` and `api-documentation.md`
3. Frontend Development: Use `component-architecture.md` and `ui-ux-improvements.md`
4. Security & Performance: Review `security-analysis.md` and `performance-optimization.md`
5. Deployment: Follow `deployment-guide.md` and `development-guidelines.md`

## System Status

- Version: 1.0.0
- Status: Active development
- Last Updated: 2025-09-11
- Technology Stack: Next.js 14, TypeScript, Prisma, SQLite, Tailwind CSS
- Authentication: NextAuth.js with JWT
- Database: SQLite with Prisma ORM

## Key Features Implemented

- ✅ User Authentication & Role Management
- ✅ Patient Management
- ✅ Appointment Scheduling with Token System
- ✅ Doctor Dashboard & Consultation Management
- ✅ Prescription Management with SOAP Notes
- ✅ Billing System with GST Compliance
- ✅ Hospital Settings Configuration (branding, business hours, session templates)
- ✅ Public Appointment Booking
- ✅ Token Printing with QR Codes
- ✅ Real-time Queue Management
- ✅ Departments Management (admin)
- ✅ Problem Categories Taxonomy with appointment tagging
- ✅ Media Uploads (logo, favicon, PWA icon, avatars, signatures)

## Critical Development Rules

- ⚠️ NEVER use Decimal type with SQLite — use Float instead
- ⚠️ NEVER bypass NextAuth.js authentication
- ⚠️ ALWAYS check existing components before creating new ones
- ⚠️ MAINTAIN backward compatibility with existing features
- ⚠️ USE existing API routes and component patterns

For detailed development rules, see [`development-guidelines.md`](./development-guidelines.md).
