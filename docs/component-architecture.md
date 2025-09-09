# Component Architecture Documentation

## Overview
The Hospital Management System follows a modular component architecture with clear separation of concerns, reusable UI components, and feature-specific modules.

## Component Hierarchy

### Layout Components (`components/layout/`)

#### Header Component
**File**: `components/layout/header.tsx`
**Purpose**: Main navigation and user session management

**Features**:
- Role-based navigation menu
- User profile dropdown
- Logout functionality
- Hospital branding display

**Props Interface**:
```typescript
interface HeaderProps {
  user?: {
    name: string;
    role: string;
    email: string;
  };
}
```

#### Sidebar Component
**File**: `components/layout/sidebar.tsx`
**Purpose**: Side navigation for authenticated users

**Features**:
- Role-based menu items
- Active route highlighting
- Collapsible navigation
- Quick access shortcuts

**Navigation Structure**:
```typescript
const navigationItems = {
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard', icon: 'Home' },
    { href: '/patients', label: 'Patients', icon: 'Users' },
    { href: '/appointments', label: 'Appointments', icon: 'Calendar' },
    { href: '/billing', label: 'Billing', icon: 'CreditCard' },
    { href: '/reports', label: 'Reports', icon: 'BarChart' },
    { href: '/admin', label: 'Admin', icon: 'Settings' }
  ],
  DOCTOR: [
    { href: '/dashboard', label: 'Dashboard', icon: 'Home' },
    { href: '/doctor', label: 'My Patients', icon: 'Users' },
    { href: '/prescriptions', label: 'Prescriptions', icon: 'FileText' }
  ],
  RECEPTIONIST: [
    { href: '/dashboard', label: 'Dashboard', icon: 'Home' },
    { href: '/queue', label: 'Queue', icon: 'Clock' },
    { href: '/appointments', label: 'Appointments', icon: 'Calendar' },
    { href: '/billing', label: 'Billing', icon: 'CreditCard' }
  ]
};
```

### UI Components (`components/ui/`)

#### Base Components
- **Button**: Consistent button styling with variants
- **Input**: Form input with validation states
- **Modal**: Reusable modal dialog
- **Card**: Content container with consistent styling
- **Badge**: Status indicators and labels
- **Table**: Data table with sorting and pagination
- **Form**: Form wrapper with validation
- **Loading**: Loading states and spinners

**Button Component Example**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

### Feature Components

#### Appointment Components (`components/appointments/`)

##### BookAppointmentModal
**Purpose**: Modal for booking new appointments
**Features**:
- Patient selection/creation
- Doctor selection
- Session and time slot selection
- Priority setting
- Form validation

**State Management**:
```typescript
interface BookingState {
  selectedPatient: Patient | null;
  selectedDoctor: User | null;
  selectedSession: AppointmentSession | null;
  appointmentType: AppointmentType;
  priority: Priority;
  notes: string;
}
```

##### TokenPrint
**Purpose**: Generate and print appointment tokens
**Features**:
- QR code generation with appointment details
- Professional token design
- Print and download functionality
- Hospital branding integration
- Priority-based styling

**QR Code Data Structure**:
```typescript
interface TokenQRData {
  appointmentId: string;
  tokenNumber: string;
  patientName: string;
  sessionName: string;
  appointmentTime: string;
  priority: string;
}
```

#### Billing Components (`components/billing/`)

##### BillForm
**Purpose**: Create and manage bills
**Features**:
- Prescription integration
- Item management (add/remove/edit)
- GST calculations
- Discount application
- Payment method selection

**Bill Calculation Logic**:
```typescript
interface BillCalculation {
  subtotal: number;
  cgst: number;
  sgst: number;
  discount: number;
  finalAmount: number;
}

const calculateBill = (items: BillItem[], gstRate: number, discount: number) => {
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const gstAmount = (subtotal * gstRate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const finalAmount = subtotal + gstAmount - discount;
  
  return { subtotal, cgst, sgst, discount, finalAmount };
};
```

##### BillPrint
**Purpose**: Generate printable bills
**Features**:
- GST-compliant bill format
- Hospital letterhead
- Item breakdown
- Payment details
- QR code for digital verification

##### EditBillForm
**Purpose**: Modify existing bills
**Features**:
- Load existing bill data
- Edit items and amounts
- Recalculate totals
- Update payment status

#### Prescription Components (`components/prescriptions/`)

##### PrescriptionForm
**Purpose**: Create and manage prescriptions
**Features**:
- Patient auto-selection from consultation
- Medicine search and selection
- Dosage and instruction management
- SOAP notes integration
- Quick selection tools

**Medicine Interface**:
```typescript
interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}
```

##### PrescriptionList
**Purpose**: Display and manage prescription history
**Features**:
- Filter by patient/doctor/date
- Search functionality
- Status indicators
- Quick actions (view, edit, print)

##### PrescriptionPrint
**Purpose**: Generate printable prescriptions
**Features**:
- Professional prescription format
- Doctor signature area
- Hospital branding
- Medicine list with instructions

##### PrescriptionView
**Purpose**: Read-only prescription display
**Features**:
- Formatted prescription display
- SOAP notes view
- Patient and doctor information
- Print functionality

#### SOAP Components (`components/soap/`)

##### SOAPNotes
**Purpose**: Structured clinical documentation
**Features**:
- Subjective: Patient complaints and symptoms
- Objective: Clinical findings and vital signs
- Assessment: Diagnosis and clinical assessment
- Plan: Treatment plan and follow-up

**SOAP Interface**:
```typescript
interface SOAPNotes {
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    symptoms: string[];
  };
  objective: {
    vitalSigns: VitalSigns;
    physicalExamination: string;
    labResults: string;
  };
  assessment: {
    diagnosis: string[];
    differentialDiagnosis: string[];
  };
  plan: {
    treatment: string;
    medications: Medicine[];
    followUp: string;
    instructions: string;
  };
}
```

##### QuickSelectionTools
**Purpose**: Rapid clinical data entry
**Features**:
- Common symptoms checkboxes
- Vital signs input fields
- Common diagnoses selection
- Quick note templates

#### Chart Components (`components/charts/`)

##### PatientChartModal
**Purpose**: Individual patient analytics
**Features**:
- Appointment history timeline
- Vital signs trends
- Prescription history
- Billing summary

##### PatientsDistinctChartModal
**Purpose**: Patient demographics analytics
**Features**:
- Age distribution charts
- Gender distribution
- Geographic distribution
- Registration trends

##### RevenueChartModal
**Purpose**: Financial analytics
**Features**:
- Revenue trends over time
- Payment method breakdown
- Doctor-wise revenue
- Service-wise revenue

## State Management Patterns

### Local Component State
```typescript
// Using React hooks for local state
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType[]>([]);
```

### Form State Management
```typescript
// Using React Hook Form
const {
  register,
  handleSubmit,
  formState: { errors },
  setValue,
  watch
} = useForm<FormData>();
```

### API State Management
```typescript
// Custom hooks for API calls
const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchPatients = async () => {
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
  };
  
  return { patients, loading, fetchPatients };
};
```

## Component Communication Patterns

### Props Down, Events Up
```typescript
// Parent component
const ParentComponent = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  return (
    <PatientSelector
      patients={patients}
      selectedPatient={selectedPatient}
      onPatientSelect={setSelectedPatient}
    />
  );
};

// Child component
interface PatientSelectorProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
}
```

### Context for Shared State
```typescript
// Hospital settings context
const HospitalSettingsContext = createContext<HospitalSettings | null>(null);

export const useHospitalSettings = () => {
  const context = useContext(HospitalSettingsContext);
  if (!context) {
    throw new Error('useHospitalSettings must be used within HospitalSettingsProvider');
  }
  return context;
};
```

## Styling Architecture

### Tailwind CSS Classes
```typescript
// Consistent styling patterns
const buttonStyles = {
  base: 'px-4 py-2 rounded-md font-medium transition-colors',
  variants: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }
};
```

### Component Variants
```typescript
// Using class-variance-authority for consistent variants
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

## Error Handling Patterns

### Component Error Boundaries
```typescript
class ComponentErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### API Error Handling
```typescript
const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Redirect to login
    router.push('/auth/signin');
  } else if (error.response?.status === 403) {
    toast.error('Access denied');
  } else {
    toast.error(error.message || 'An error occurred');
  }
};
```

## Performance Optimization

### Component Memoization
```typescript
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return processComplexData(data);
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});
```

### Lazy Loading
```typescript
// Lazy load heavy components
const ChartModal = lazy(() => import('./components/charts/PatientChartModal'));

const ComponentWithChart = () => (
  <Suspense fallback={<Loading />}>
    <ChartModal />
  </Suspense>
);
```

## Testing Patterns

### Component Testing
```typescript
// Jest + React Testing Library
describe('PatientForm', () => {
  it('should validate required fields', async () => {
    render(<PatientForm onSubmit={mockSubmit} />);
    
    fireEvent.click(screen.getByText('Submit'));
    
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// Test component integration
describe('AppointmentBooking', () => {
  it('should complete booking flow', async () => {
    render(<AppointmentBookingFlow />);
    
    // Select patient
    fireEvent.click(screen.getByText('John Doe'));
    
    // Select session
    fireEvent.click(screen.getByText('Morning Session'));
    
    // Submit booking
    fireEvent.click(screen.getByText('Book Appointment'));
    
    expect(await screen.findByText('Appointment booked successfully')).toBeInTheDocument();
  });
});
```

## Future Component Enhancements

### Planned Components
- **NotificationCenter**: Real-time notifications
- **ChatWidget**: Patient-doctor communication
- **VideoCall**: Telemedicine integration
- **DocumentUpload**: Medical document management
- **ReportBuilder**: Custom report generation

### Mobile-First Components
- **SwipeableCard**: Touch-friendly interactions
- **PullToRefresh**: Mobile refresh patterns
- **BottomSheet**: Mobile modal alternative
- **FloatingActionButton**: Quick actions

This component architecture documentation provides a comprehensive guide for understanding, maintaining, and extending the frontend components of the Hospital Management System.
