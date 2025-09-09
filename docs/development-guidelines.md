# Development Guidelines & Best Practices

## Core Development Principles

### 1. Single Source of Truth (SSOT)
All configuration and data must have a single authoritative source to prevent inconsistencies.

**Implementation**:
- Hospital settings: `data/hospital-settings.json` + `HospitalSettings` model
- User roles: Centralized in `User` model with role field
- API responses: Consistent format across all endpoints
- Component props: TypeScript interfaces for type safety

**Example**:
```typescript
// ❌ Bad: Multiple sources of truth
const sessions = getSessionsFromConfig();
const dbSessions = await prisma.appointmentSession.findMany();

// ✅ Good: Single source of truth
const sessions = await getSessionsFromHospitalSettings();
```

### 2. DRY (Don't Repeat Yourself)
Eliminate code duplication through reusable components, utilities, and patterns.

**Implementation**:
- Shared UI components in `components/ui/`
- Common utilities in `lib/` directory
- Reusable hooks for API calls
- Consistent styling with Tailwind classes

**Example**:
```typescript
// ❌ Bad: Repeated API call logic
const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => setPatients(data.patients))
      .finally(() => setLoading(false));
  }, []);
};

// ✅ Good: Reusable hook
const usePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { patients, loading, fetchPatients };
};
```

### 3. Cautious Development
Preserve existing functionality while adding new features.

**Implementation**:
- Never modify existing database schema without migration plan
- Maintain backward compatibility in API changes
- Use feature flags for new functionality
- Comprehensive testing before deployment

## Critical Development Rules

### ⚠️ Database Rules

#### 1. NEVER use Decimal type with SQLite
**Reason**: SQLite doesn't have native Decimal support, causing precision issues.

```prisma
// ❌ Bad: Decimal with SQLite
model Bill {
  totalAmount Decimal
}

// ✅ Good: Float with SQLite
model Bill {
  totalAmount Float
}
```

#### 2. NEVER bypass NextAuth.js authentication
**Reason**: Maintains consistent security across the application.

```typescript
// ❌ Bad: Custom authentication bypass
if (req.headers.authorization === 'Bearer admin-override') {
  // Skip auth
}

// ✅ Good: Always use NextAuth.js
const session = await getServerSession(req, res, authOptions);
if (!session) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

#### 3. ALWAYS check existing components before creating new ones
**Reason**: Prevents code duplication and maintains consistency.

```bash
# Before creating a new component, search existing ones
grep -r "PatientSelector" components/
find components/ -name "*patient*" -type f
```

### 4. MAINTAIN backward compatibility
**Reason**: Prevents breaking existing user workflows.

```typescript
// ✅ Good: Backward compatible API changes
interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  // New optional fields don't break existing calls
  dateOfBirth?: string;
  gender?: string;
}
```

### 5. USE existing API routes and patterns
**Reason**: Maintains consistent API design and reduces complexity.

```typescript
// ✅ Good: Follow existing patterns
// GET /api/patients - List with pagination
// POST /api/patients - Create new
// GET /api/patients/[id] - Get by ID
// PUT /api/patients/[id] - Update
// DELETE /api/patients/[id] - Soft delete
```

## Code Organization Standards

### 1. File Structure
```
app/
├── (authenticated)/          # Protected routes
│   ├── [feature]/           # Feature-based organization
│   └── layout.tsx           # Authenticated layout
├── api/                     # API routes
│   ├── [resource]/          # RESTful resource organization
│   └── auth/               # Authentication endpoints
└── globals.css             # Global styles

components/
├── [feature]/              # Feature-specific components
├── ui/                     # Reusable UI components
└── layout/                 # Layout components

lib/
├── auth.ts                 # Authentication configuration
├── prisma.ts              # Database client
└── utils.ts               # Utility functions
```

### 2. Naming Conventions

#### Components
```typescript
// PascalCase for components
const PatientForm = () => {};
const AppointmentModal = () => {};

// camelCase for props and variables
interface PatientFormProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
}
```

#### Files
```bash
# kebab-case for file names
patient-form.tsx
appointment-modal.tsx
book-appointment-modal.tsx

# PascalCase for component files when they export default
PatientForm.tsx
AppointmentModal.tsx
```

#### API Routes
```bash
# RESTful naming
/api/patients              # GET, POST
/api/patients/[id]         # GET, PUT, DELETE
/api/patients/[id]/appointments  # Nested resources
```

### 3. TypeScript Standards

#### Interface Definitions
```typescript
// Use descriptive interface names
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Props interfaces
interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: CreatePatientData) => Promise<void>;
  onCancel: () => void;
}

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: string;
}
```

#### Type Guards
```typescript
// Use type guards for runtime type checking
const isPatient = (obj: any): obj is Patient => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.phone === 'string';
};
```

## Component Development Standards

### 1. Component Structure
```typescript
// Standard component structure
interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = ({
  // Destructured props
}) => {
  // Hooks (useState, useEffect, custom hooks)
  
  // Event handlers
  
  // Render helpers
  
  // Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### 2. State Management Patterns
```typescript
// Local state for component-specific data
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Custom hooks for reusable logic
const usePatientForm = (initialPatient?: Patient) => {
  const [patient, setPatient] = useState(initialPatient);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validatePatient = (data: Patient) => {
    // Validation logic
  };
  
  return { patient, errors, validatePatient };
};

// Context for shared state
const PatientContext = createContext<{
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
} | null>(null);
```

### 3. Error Handling
```typescript
// Consistent error handling pattern
const handleApiCall = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await fetch('/api/patients');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Operation failed');
    }
    
    return data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    console.error('API call failed:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

## API Development Standards

### 1. Request/Response Format
```typescript
// Consistent API response format
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: string;
}

// Success response
return NextResponse.json({
  success: true,
  data: patients,
  message: 'Patients retrieved successfully'
});

// Error response
return NextResponse.json({
  success: false,
  data: null,
  message: 'Failed to retrieve patients',
  error: 'DATABASE_ERROR'
}, { status: 500 });
```

### 2. Input Validation
```typescript
// Use Zod for input validation
const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
});

// Validate in API route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPatientSchema.parse(body);
    
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        data: null,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: error.errors
      }, { status: 400 });
    }
  }
}
```

### 3. Authentication Middleware
```typescript
// Reusable authentication middleware
export const withAuth = (handler: Function, requiredRoles?: string[]) => {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        data: null,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      }, { status: 401 });
    }
    
    if (requiredRoles && !requiredRoles.includes(session.user.role)) {
      return NextResponse.json({
        success: false,
        data: null,
        message: 'Insufficient permissions',
        error: 'FORBIDDEN'
      }, { status: 403 });
    }
    
    return handler(request, session);
  };
};

// Usage
export const GET = withAuth(async (request: NextRequest, session: Session) => {
  // Handler logic with authenticated session
}, ['ADMIN', 'DOCTOR']);
```

## Database Development Standards

### 1. Prisma Schema Guidelines
```prisma
// Use descriptive model names
model Patient {
  id        String   @id @default(cuid())
  firstName String
  lastName  String
  phone     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  appointments Appointment[]
  
  @@map("patients") // Explicit table name
}

// Add indexes for performance
model Appointment {
  // ... fields
  
  @@index([patientId, dateTime])
  @@index([doctorId, status])
  @@map("appointments")
}
```

### 2. Database Query Patterns
```typescript
// Use include/select for efficient queries
const appointments = await prisma.appointment.findMany({
  include: {
    patient: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true
      }
    },
    doctor: {
      select: {
        id: true,
        name: true,
        specialization: true
      }
    }
  },
  where: {
    dateTime: {
      gte: startDate,
      lte: endDate
    }
  },
  orderBy: {
    dateTime: 'asc'
  }
});

// Use transactions for related operations
const result = await prisma.$transaction(async (tx) => {
  const appointment = await tx.appointment.create({
    data: appointmentData
  });
  
  const session = await tx.appointmentSession.update({
    where: { id: sessionId },
    data: { currentTokens: { increment: 1 } }
  });
  
  return { appointment, session };
});
```

## Testing Standards

### 1. Unit Testing
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientForm } from './PatientForm';

describe('PatientForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });
  
  it('should validate required fields', async () => {
    render(<PatientForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByText('Submit'));
    
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  it('should submit valid data', async () => {
    render(<PatientForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText('Phone'), {
      target: { value: '1234567890' }
    });
    
    fireEvent.click(screen.getByText('Submit'));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890'
    });
  });
});
```

### 2. API Testing
```typescript
// API route testing
import { createMocks } from 'node-mocks-http';
import handler from '../api/patients';

describe('/api/patients', () => {
  it('should create a new patient', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890'
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('John');
  });
});
```

## Performance Guidelines

### 1. Component Optimization
```typescript
// Use React.memo for expensive components
const PatientCard = React.memo(({ patient, onClick }: PatientCardProps) => {
  return (
    <div onClick={() => onClick(patient)}>
      {patient.firstName} {patient.lastName}
    </div>
  );
});

// Use useMemo for expensive calculations
const PatientList = ({ patients, searchTerm }: PatientListProps) => {
  const filteredPatients = useMemo(() => {
    return patients.filter(patient =>
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);
  
  return (
    <div>
      {filteredPatients.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
};

// Use useCallback for event handlers
const PatientForm = ({ onSubmit }: PatientFormProps) => {
  const handleSubmit = useCallback((data: PatientData) => {
    onSubmit(data);
  }, [onSubmit]);
  
  return <form onSubmit={handleSubmit}>{/* form content */}</form>;
};
```

### 2. Database Optimization
```typescript
// Use proper indexes
// Add to schema.prisma
@@index([firstName, lastName]) // For name searches
@@index([phone]) // For phone lookups
@@index([createdAt]) // For date sorting

// Optimize queries with select
const patients = await prisma.patient.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    phone: true,
    // Don't select large fields unless needed
  }
});

// Use pagination for large datasets
const getPatients = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.patient.count()
  ]);
  
  return {
    patients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
```

## Security Guidelines

### 1. Input Sanitization
```typescript
// Always validate and sanitize inputs
import { z } from 'zod';
import DOMPurify from 'dompurify';

const sanitizeString = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

const patientSchema = z.object({
  firstName: z.string().min(1).max(50).transform(sanitizeString),
  lastName: z.string().min(1).max(50).transform(sanitizeString),
  phone: z.string().regex(/^\d{10}$/),
});
```

### 2. Authentication Checks
```typescript
// Always verify authentication and authorization
const requireAuth = (requiredRoles: string[] = []) => {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions');
    }
    
    return session;
  };
};
```

## Git Workflow Standards

### 1. Branch Naming
```bash
# Feature branches
feature/patient-search-enhancement
feature/appointment-booking-flow

# Bug fixes
bugfix/patient-form-validation
bugfix/appointment-status-update

# Hotfixes
hotfix/security-patch-auth
hotfix/database-connection-issue
```

### 2. Commit Messages
```bash
# Format: type(scope): description
feat(patients): add advanced search functionality
fix(appointments): resolve token generation issue
docs(api): update authentication documentation
refactor(components): extract reusable form components
test(billing): add unit tests for GST calculations
```

### 3. Pull Request Guidelines
- Include clear description of changes
- Reference related issues
- Add screenshots for UI changes
- Ensure all tests pass
- Request appropriate reviewers
- Update documentation if needed

## Code Review Checklist

### 1. Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is implemented
- [ ] Performance considerations addressed

### 2. Code Quality
- [ ] Follows naming conventions
- [ ] No code duplication
- [ ] Proper TypeScript types
- [ ] Comments for complex logic

### 3. Security
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] No sensitive data exposed
- [ ] SQL injection prevention

### 4. Testing
- [ ] Unit tests included
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases tested

This development guidelines document ensures consistent, maintainable, and secure code across the Hospital Management System while preserving existing functionality and following established patterns.
