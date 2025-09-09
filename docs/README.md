# Hospital Management System Documentation

This documentation provides comprehensive information for AI models to understand, develop, debug, test, and enhance the Hospital Management System.

## Documentation Structure

### Core Documentation
- [`project-overview.md`](./project-overview.md) - Complete system overview and architecture
- [`database-schema.md`](./database-schema.md) - Database design and relationships
- [`api-documentation.md`](./api-documentation.md) - API endpoints and specifications
- [`component-architecture.md`](./component-architecture.md) - Frontend components and structure

### Development & Maintenance
- [`security-analysis.md`](./security-analysis.md) - Security risks and hardening recommendations
- [`performance-optimization.md`](./performance-optimization.md) - Performance issues and optimization strategies
- [`ui-ux-improvements.md`](./ui-ux-improvements.md) - User experience enhancement recommendations
- [`deployment-guide.md`](./deployment-guide.md) - Production deployment and configuration
- [`development-guidelines.md`](./development-guidelines.md) - Coding standards and best practices

### Feature Documentation
- [`feature-specifications.md`](./feature-specifications.md) - Detailed feature descriptions and workflows
- [`business-logic.md`](./business-logic.md) - Business rules and validation logic
- [`integration-points.md`](./integration-points.md) - External integrations and APIs

### Quality Assurance
- [`testing-strategy.md`](./testing-strategy.md) - Testing approaches and test cases
- [`bug-tracking.md`](./bug-tracking.md) - Known issues and resolution strategies
- [`code-quality.md`](./code-quality.md) - Code quality metrics and improvement areas

### Future Development
- [`roadmap.md`](./roadmap.md) - Feature roadmap and enhancement plans
- [`mobile-app-strategy.md`](./mobile-app-strategy.md) - React Native conversion strategy
- [`offline-support.md`](./offline-support.md) - Local SQLite and offline functionality
- [`pricing-tiers.md`](./pricing-tiers.md) - Feature bundling and pricing strategy

## Quick Start for AI Models

1. **Understanding the System**: Start with `project-overview.md`
2. **Database Operations**: Reference `database-schema.md` and `api-documentation.md`
3. **Frontend Development**: Use `component-architecture.md` and `ui-ux-improvements.md`
4. **Security & Performance**: Review `security-analysis.md` and `performance-optimization.md`
5. **Deployment**: Follow `deployment-guide.md` and `development-guidelines.md`

## System Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: 2025-01-09
- **Technology Stack**: Next.js 14, TypeScript, Prisma, SQLite, Tailwind CSS
- **Authentication**: NextAuth.js with JWT
- **Database**: SQLite with Prisma ORM

## Key Features Implemented

✅ User Authentication & Role Management  
✅ Patient Management  
✅ Appointment Scheduling with Token System  
✅ Doctor Dashboard & Consultation Management  
✅ Prescription Management with SOAP Notes  
✅ Billing System with GST Compliance  
✅ Hospital Settings Configuration  
✅ Public Appointment Booking  
✅ Token Printing with QR Codes  
✅ Real-time Queue Management  

## Critical Development Rules

⚠️ **NEVER** use Decimal type with SQLite - use Float instead  
⚠️ **NEVER** bypass NextAuth.js authentication  
⚠️ **ALWAYS** check existing components before creating new ones  
⚠️ **MAINTAIN** backward compatibility with existing features  
⚠️ **USE** existing API routes and component patterns  

For detailed development rules, see [`development-guidelines.md`](./development-guidelines.md).
