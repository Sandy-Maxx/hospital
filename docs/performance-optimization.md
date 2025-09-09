# Performance Optimization Guide

## Current Performance Analysis

### Application Performance Metrics

- **Initial Load Time**: ~2-3 seconds (development)
- **Database Query Time**: 50-200ms average
- **API Response Time**: 100-500ms average
- **Bundle Size**: ~2.5MB (unoptimized)
- **Memory Usage**: 50-100MB typical

### Performance Bottlenecks Identified

#### 1. Database Performance Issues

**Problem**: N+1 query problems and missing indexes
**Impact**: HIGH - Slow page loads and API responses

**Current Issues**:

```typescript
// Inefficient: N+1 query problem
const appointments = await prisma.appointment.findMany();
for (const appointment of appointments) {
  const patient = await prisma.patient.findUnique({
    where: { id: appointment.patientId },
  });
}

// Missing indexes on frequently queried fields
// - Patient.phone (used in search)
// - Appointment.tokenNumber (used in queue)
// - Bill.billNumber (used in billing)
```

**Optimization Solutions**:

```typescript
// Efficient: Use include/select for related data
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
    },
    session: true
  }
});

// Add database indexes (schema.prisma)
model Patient {
  // ... existing fields
  @@index([phone])
  @@index([firstName, lastName])
  @@index([createdAt])
}

model Appointment {
  // ... existing fields
  @@index([tokenNumber])
  @@index([patientId, dateTime])
  @@index([doctorId, status])
  @@index([sessionId, status])
}

model Bill {
  // ... existing fields
  @@index([billNumber])
  @@index([patientId, createdAt])
  @@index([paymentStatus])
}
```

#### 2. Frontend Performance Issues

**Problem**: Large bundle size and unnecessary re-renders
**Impact**: MEDIUM - Slow initial load and laggy interactions

**Current Issues**:

- All components loaded on initial page load
- No code splitting implemented
- Heavy libraries loaded upfront (jsPDF, html2canvas)
- Unnecessary component re-renders

**Optimization Solutions**:

```typescript
// Implement code splitting
const PatientChartModal = lazy(() => import('./components/charts/PatientChartModal'));
const BillPrint = lazy(() => import('./components/billing/BillPrint'));
const TokenPrint = lazy(() => import('./components/appointments/TokenPrint'));

// Optimize component re-renders with React.memo
const PatientListItem = React.memo(({ patient, onSelect }: PatientListItemProps) => {
  return (
    <div onClick={() => onSelect(patient)}>
      {patient.firstName} {patient.lastName}
    </div>
  );
});

// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedPatientList = ({ patients }: { patients: Patient[] }) => (
  <List
    height={400}
    itemCount={patients.length}
    itemSize={60}
    itemData={patients}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <PatientListItem patient={data[index]} />
      </div>
    )}
  </List>
);
```

#### 3. API Performance Issues

**Problem**: No caching and inefficient data fetching
**Impact**: MEDIUM - Repeated API calls and slow responses

**Current Issues**:

- No response caching
- Large payloads with unnecessary data
- No pagination on large datasets
- Synchronous processing

**Optimization Solutions**:

```typescript
// Implement API response caching
import { NextRequest, NextResponse } from "next/server";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const withCache = (handler: Function) => {
  return async (req: NextRequest) => {
    const cacheKey = `${req.method}:${req.url}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const response = await handler(req);
    const data = await response.json();

    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return NextResponse.json(data);
  };
};

// Implement pagination
export const getPaginatedResults = async (
  model: any,
  page: number = 1,
  limit: number = 10,
  where: any = {},
  include: any = {},
) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    model.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Optimize data selection
const getPatients = async () => {
  return await prisma.patient.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      createdAt: true,
      // Don't select large fields like allergies, address unless needed
    },
  });
};
```

## Database Optimization Strategy

### 1. Query Optimization

```sql
-- Add composite indexes for common query patterns
CREATE INDEX idx_appointment_doctor_date ON appointments(doctorId, dateTime);
CREATE INDEX idx_appointment_patient_status ON appointments(patientId, status);
CREATE INDEX idx_bill_patient_payment ON bills(patientId, paymentStatus);
CREATE INDEX idx_prescription_doctor_date ON prescriptions(doctorId, createdAt);

-- Optimize full-text search
CREATE INDEX idx_patient_search ON patients(firstName, lastName, phone);
CREATE INDEX idx_medicine_search ON medicines(name, genericName);
```

### 2. Connection Pool Optimization

```typescript
// Optimize Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

// Connection pool settings for production
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=20&pool_timeout=20&socket_timeout=60`,
    },
  },
});
```

### 3. Database Migration to PostgreSQL

```typescript
// Migration strategy for better performance
// 1. Setup PostgreSQL with proper configuration
// 2. Migrate data with zero downtime
// 3. Optimize for concurrent connections

// PostgreSQL optimized schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add full-text search capabilities
model Patient {
  // ... existing fields
  searchVector String? // For full-text search

  @@index([searchVector], type: Gin)
}
```

## Frontend Performance Optimization

### 1. Bundle Size Optimization

```typescript
// Dynamic imports for heavy components
const ChartComponents = {
  PatientChart: lazy(() => import("./charts/PatientChartModal")),
  RevenueChart: lazy(() => import("./charts/RevenueChartModal")),
  DistributionChart: lazy(() => import("./charts/PatientsDistinctChartModal")),
};

// Tree-shaking optimization
// Import only needed functions
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
// Instead of: import * as dateFns from 'date-fns';

// Optimize Tailwind CSS
// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Only include used utilities
    },
  },
  plugins: [],
  // Enable JIT mode for smaller CSS
  mode: "jit",
};
```

### 2. State Management Optimization

```typescript
// Implement efficient state management
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AppState {
  patients: Patient[];
  appointments: Appointment[];
  loading: boolean;
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
}

const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    patients: [],
    appointments: [],
    loading: false,

    setPatients: (patients) => set({ patients }),

    addPatient: (patient) => set((state) => ({
      patients: [...state.patients, patient]
    })),

    updatePatient: (id, updates) => set((state) => ({
      patients: state.patients.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    })),
  }))
);

// Selective subscriptions to prevent unnecessary re-renders
const PatientList = () => {
  const patients = useAppStore(state => state.patients);
  const loading = useAppStore(state => state.loading);

  return (
    <div>
      {loading ? <Loading /> : <PatientItems patients={patients} />}
    </div>
  );
};
```

### 3. Image and Asset Optimization

```typescript
// Optimize images with Next.js Image component
import Image from 'next/image';

const HospitalLogo = () => (
  <Image
    src="/logo.png"
    alt="Hospital Logo"
    width={200}
    height={100}
    priority // For above-the-fold images
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
  />
);

// Implement progressive loading for large datasets
const useProgressiveLoading = (initialCount: number = 20) => {
  const [displayCount, setDisplayCount] = useState(initialCount);

  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + initialCount);
  }, [initialCount]);

  return { displayCount, loadMore };
};
```

## Caching Strategy

### 1. Client-Side Caching

```typescript
// Implement React Query for API caching
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const usePatients = () => {
  return useQuery({
    queryKey: ["patients"],
    queryFn: () => fetch("/api/patients").then((res) => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patient: CreatePatientData) =>
      fetch("/api/patients", {
        method: "POST",
        body: JSON.stringify(patient),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};

// Local storage caching for settings
const useHospitalSettings = () => {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("hospital-settings");
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });

  const updateSettings = (newSettings: HospitalSettings) => {
    setSettings(newSettings);
    localStorage.setItem("hospital-settings", JSON.stringify(newSettings));
  };

  return { settings, updateSettings };
};
```

### 2. Server-Side Caching

```typescript
// Redis caching for API responses
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export const withRedisCache = (key: string, ttl: number = 300) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await redis.setex(cacheKey, ttl, JSON.stringify(result));

      return result;
    };
  };
};

// Usage in API routes
class PatientService {
  @withRedisCache("patients", 300) // 5 minutes
  async getPatients(filters: PatientFilters) {
    return await prisma.patient.findMany({
      where: filters,
      include: { appointments: true },
    });
  }
}
```

## Real-Time Performance Monitoring

### 1. Performance Metrics Collection

```typescript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

const sendToAnalytics = (metric: any) => {
  // Send to your analytics service
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify(metric),
  });
};

// Collect all Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// Custom performance monitoring
const performanceMonitor = {
  startTimer: (label: string) => {
    performance.mark(`${label}-start`);
  },

  endTimer: (label: string) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label)[0];
    sendToAnalytics({
      name: label,
      duration: measure.duration,
      timestamp: Date.now(),
    });
  },
};

// Usage in components
const PatientForm = () => {
  const handleSubmit = async (data: PatientData) => {
    performanceMonitor.startTimer("patient-creation");

    try {
      await createPatient(data);
    } finally {
      performanceMonitor.endTimer("patient-creation");
    }
  };
};
```

### 2. Database Performance Monitoring

```typescript
// Prisma query logging and monitoring
const prismaWithLogging = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prismaWithLogging.$on("query", (e) => {
  if (e.duration > 1000) {
    // Log slow queries (>1s)
    console.warn("Slow query detected:", {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });

    // Send alert for very slow queries
    if (e.duration > 5000) {
      sendSlowQueryAlert(e);
    }
  }
});

// Query performance analysis
const analyzeQueryPerformance = async () => {
  const slowQueries = await prisma.$queryRaw`
    SELECT query, avg_exec_time, calls
    FROM pg_stat_statements
    WHERE avg_exec_time > 1000
    ORDER BY avg_exec_time DESC
    LIMIT 10;
  `;

  return slowQueries;
};
```

## Mobile Performance Optimization

### 1. Progressive Web App (PWA) Implementation

```typescript
// Service Worker for caching
// public/sw.js
const CACHE_NAME = 'hospital-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/static/css/main.css',
  '/static/js/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// PWA manifest
// public/manifest.json
{
  "name": "Hospital Management System",
  "short_name": "HMS",
  "description": "Complete hospital management solution",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Offline Support Strategy

```typescript
// Offline data synchronization
class OfflineManager {
  private db: IDBDatabase;

  async init() {
    this.db = await this.openDB();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("HospitalDB", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        db.createObjectStore("patients", { keyPath: "id" });
        db.createObjectStore("appointments", { keyPath: "id" });
        db.createObjectStore("pendingSync", { keyPath: "id" });
      };
    });
  }

  async saveOfflineData(storeName: string, data: any) {
    const transaction = this.db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    await store.put(data);
  }

  async syncWhenOnline() {
    if (navigator.onLine) {
      const pendingData = await this.getPendingSync();

      for (const item of pendingData) {
        try {
          await this.syncItem(item);
          await this.removePendingSync(item.id);
        } catch (error) {
          console.error("Sync failed for item:", item.id, error);
        }
      }
    }
  }
}
```

## Performance Testing Strategy

### 1. Load Testing

```typescript
// Artillery.js load testing configuration
// artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "Patient Management Flow"
    flow:
      - get:
          url: "/api/patients"
      - post:
          url: "/api/patients"
          json:
            firstName: "Test"
            lastName: "Patient"
            phone: "1234567890"
      - get:
          url: "/api/appointments"

// Performance benchmarking
const benchmarkAPI = async () => {
  const startTime = performance.now();

  const promises = Array(100).fill(null).map(() =>
    fetch('/api/patients').then(r => r.json())
  );

  await Promise.all(promises);

  const endTime = performance.now();
  console.log(`100 concurrent requests took ${endTime - startTime}ms`);
};
```

### 2. Automated Performance Testing

```typescript
// Lighthouse CI configuration
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/", "http://localhost:3000/dashboard"],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.8 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

## Performance Optimization Roadmap

### Phase 1: Immediate Optimizations (1-2 weeks)

- [ ] Add database indexes for common queries
- [ ] Implement code splitting for heavy components
- [ ] Add React.memo for frequently re-rendering components
- [ ] Optimize API responses with proper data selection
- [ ] Implement basic caching for static data

### Phase 2: Advanced Optimizations (2-4 weeks)

- [ ] Migrate to PostgreSQL for better performance
- [ ] Implement Redis caching layer
- [ ] Add virtual scrolling for large lists
- [ ] Optimize bundle size with tree shaking
- [ ] Implement progressive loading patterns

### Phase 3: Infrastructure Optimizations (4-8 weeks)

- [ ] Set up CDN for static assets
- [ ] Implement database read replicas
- [ ] Add application-level caching
- [ ] Optimize server-side rendering
- [ ] Implement offline support with service workers

### Phase 4: Advanced Features (8-12 weeks)

- [ ] Real-time updates with WebSockets
- [ ] Advanced analytics and monitoring
- [ ] Machine learning for predictive caching
- [ ] Edge computing for global performance
- [ ] Advanced PWA features

This performance optimization guide provides a comprehensive strategy for improving the Hospital Management System's speed, scalability, and user experience across all platforms and use cases.
