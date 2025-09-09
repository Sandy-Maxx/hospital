# Mobile App Strategy - React Native Conversion

## Overview
This document outlines the strategy for converting the Hospital Management System into a React Native mobile application, enabling cross-platform deployment on iOS and Android devices.

## Mobile App Architecture

### 1. Technology Stack
```typescript
// Core Technologies
- React Native 0.72+
- TypeScript
- Expo SDK 49+ (for rapid development)
- React Navigation 6
- React Query (TanStack Query)
- Zustand (State Management)
- React Hook Form
- Zod (Validation)

// Native Modules
- @react-native-async-storage/async-storage
- react-native-keychain (Secure Storage)
- react-native-camera (QR Code Scanning)
- react-native-print (Document Printing)
- react-native-share (File Sharing)
- react-native-biometrics (Fingerprint/Face ID)
- react-native-push-notification
```

### 2. App Structure
```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Cross-platform components
│   │   ├── forms/          # Form components
│   │   └── charts/         # Data visualization
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── dashboard/      # Dashboard screens
│   │   ├── patients/       # Patient management
│   │   ├── appointments/   # Appointment screens
│   │   ├── prescriptions/  # Prescription screens
│   │   └── billing/        # Billing screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API services
│   ├── store/              # State management
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript definitions
├── assets/                 # Images, fonts, etc.
└── app.json               # Expo configuration
```

## Code Sharing Strategy

### 1. Shared Business Logic
```typescript
// Shared utilities and types
// packages/shared/
├── types/
│   ├── patient.ts
│   ├── appointment.ts
│   ├── prescription.ts
│   └── billing.ts
├── utils/
│   ├── validation.ts
│   ├── formatting.ts
│   └── calculations.ts
├── api/
│   ├── client.ts
│   ├── endpoints.ts
│   └── types.ts
└── constants/
    ├── roles.ts
    ├── status.ts
    └── config.ts

// Usage in both web and mobile
import { Patient, validatePatient } from '@hospital/shared';
```

### 2. API Client Abstraction
```typescript
// services/api.ts
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async setAuthToken(token: string) {
    this.token = token;
    await SecureStore.setItemAsync('auth_token', token);
  }

  async request<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      return await response.json();
    } catch (error) {
      throw new ApiError(0, error.message);
    }
  }

  // Specific API methods
  async getPatients(filters?: PatientFilters): Promise<Patient[]> {
    const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    const response = await this.request<{ patients: Patient[] }>(`/api/patients${queryString}`);
    return response.data.patients;
  }

  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    const response = await this.request<{ appointment: Appointment }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data.appointment;
  }
}
```

## Mobile-Specific Features

### 1. Offline Support
```typescript
// store/offline.ts
interface OfflineStore {
  isOnline: boolean;
  pendingActions: PendingAction[];
  cachedData: CachedData;
}

class OfflineManager {
  private db: SQLite.Database;

  async init() {
    this.db = await SQLite.openDatabase('hospital_offline.db');
    await this.createTables();
  }

  async cacheData(key: string, data: any, ttl: number = 3600000) {
    const expiresAt = Date.now() + ttl;
    await this.db.executeSql(
      'INSERT OR REPLACE INTO cache (key, data, expires_at) VALUES (?, ?, ?)',
      [key, JSON.stringify(data), expiresAt]
    );
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    const result = await this.db.executeSql(
      'SELECT data FROM cache WHERE key = ? AND expires_at > ?',
      [key, Date.now()]
    );

    if (result.rows.length > 0) {
      return JSON.parse(result.rows.item(0).data);
    }
    return null;
  }

  async queueAction(action: PendingAction) {
    await this.db.executeSql(
      'INSERT INTO pending_actions (id, type, data, created_at) VALUES (?, ?, ?, ?)',
      [action.id, action.type, JSON.stringify(action.data), Date.now()]
    );
  }

  async syncPendingActions() {
    if (!NetInfo.isConnected) return;

    const result = await this.db.executeSql('SELECT * FROM pending_actions ORDER BY created_at');
    
    for (let i = 0; i < result.rows.length; i++) {
      const action = result.rows.item(i);
      try {
        await this.executeAction(action);
        await this.db.executeSql('DELETE FROM pending_actions WHERE id = ?', [action.id]);
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
      }
    }
  }
}
```

### 2. Push Notifications
```typescript
// services/notifications.ts
class NotificationService {
  async initialize() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Notification permissions not granted');
    }

    const token = await Notifications.getExpoPushTokenAsync();
    await this.registerDevice(token.data);
  }

  async registerDevice(pushToken: string) {
    await apiClient.request('/api/devices/register', {
      method: 'POST',
      body: JSON.stringify({
        pushToken,
        platform: Platform.OS,
        deviceId: await Application.getAndroidId(),
      }),
    });
  }

  setupNotificationHandlers() {
    // Handle notifications when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Handle notification responses
    Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      this.handleNotificationAction(data);
    });
  }

  private handleNotificationAction(data: any) {
    switch (data.type) {
      case 'APPOINTMENT_REMINDER':
        navigation.navigate('AppointmentDetails', { id: data.appointmentId });
        break;
      case 'QUEUE_UPDATE':
        navigation.navigate('Queue');
        break;
      case 'PRESCRIPTION_READY':
        navigation.navigate('Prescriptions', { id: data.prescriptionId });
        break;
    }
  }
}
```

### 3. Biometric Authentication
```typescript
// services/biometrics.ts
class BiometricAuth {
  async isAvailable(): Promise<boolean> {
    const biometryType = await TouchID.isSupported();
    return biometryType !== false;
  }

  async authenticate(): Promise<boolean> {
    try {
      await TouchID.authenticate('Use your fingerprint to access the app', {
        fallbackLabel: 'Use Passcode',
        unifiedErrors: false,
        passcodeFallback: true,
      });
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async enableBiometricLogin(userId: string) {
    const isAuthenticated = await this.authenticate();
    if (isAuthenticated) {
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      await SecureStore.setItemAsync('biometric_user_id', userId);
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync('biometric_enabled');
    return enabled === 'true';
  }
}
```

## Screen Adaptations

### 1. Dashboard Screen
```typescript
// screens/DashboardScreen.tsx
const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { data: metrics, isLoading } = useQuery(['dashboard-metrics'], fetchDashboardMetrics);

  return (
    <ScrollView style={styles.container}>
      <Header title="Dashboard" user={user} />
      
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Today's Appointments"
          value={metrics?.todayAppointments || 0}
          icon="calendar"
          color="#3b82f6"
        />
        <StatCard
          title="Waiting Patients"
          value={metrics?.waitingPatients || 0}
          icon="clock"
          color="#f59e0b"
        />
      </View>

      {/* Quick Actions */}
      <QuickActions role={user.role} />

      {/* Recent Activity */}
      <RecentActivity />
    </ScrollView>
  );
};

const QuickActions: React.FC<{ role: string }> = ({ role }) => {
  const navigation = useNavigation();

  const actions = getActionsForRole(role);

  return (
    <View style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => navigation.navigate(action.screen)}
          >
            <Icon name={action.icon} size={24} color="#3b82f6" />
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
```

### 2. Patient Management
```typescript
// screens/PatientListScreen.tsx
const PatientListScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PatientFilters>({});
  
  const {
    data: patients,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    ['patients', searchQuery, filters],
    ({ pageParam = 1 }) => fetchPatients({ page: pageParam, search: searchQuery, ...filters }),
    {
      getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
    }
  );

  const renderPatient = ({ item }: { item: Patient }) => (
    <PatientCard
      patient={item}
      onPress={() => navigation.navigate('PatientDetails', { id: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search patients..."
      />
      
      <FilterBar filters={filters} onFiltersChange={setFilters} />

      <FlatList
        data={patients?.pages.flatMap(page => page.data) || []}
        renderItem={renderPatient}
        keyExtractor={(item) => item.id}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.1}
        ListFooterComponent={isLoading ? <LoadingSpinner /> : null}
        refreshing={isLoading}
        onRefresh={() => refetch()}
      />

      <FloatingActionButton
        icon="plus"
        onPress={() => navigation.navigate('CreatePatient')}
      />
    </View>
  );
};
```

### 3. QR Code Scanner
```typescript
// screens/QRScannerScreen.tsx
const QRScannerScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    
    try {
      const appointmentData = JSON.parse(data);
      if (appointmentData.appointmentId) {
        navigation.navigate('AppointmentDetails', { id: appointmentData.appointmentId });
      }
    } catch (error) {
      Alert.alert('Invalid QR Code', 'This QR code is not recognized.');
    }
  };

  if (hasPermission === null) {
    return <LoadingScreen />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <Button title="Grant Permission" onPress={() => Linking.openSettings()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.instructions}>
            Point your camera at the appointment QR code
          </Text>
        </View>
      </Camera>

      {scanned && (
        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
      )}
    </View>
  );
};
```

## Navigation Structure

### 1. Tab Navigation (Role-based)
```typescript
// navigation/TabNavigator.tsx
const TabNavigator: React.FC = () => {
  const { user } = useAuth();

  const getTabsForRole = (role: string) => {
    const baseTabs = [
      { name: 'Dashboard', component: DashboardScreen, icon: 'home' },
    ];

    switch (role) {
      case 'ADMIN':
        return [
          ...baseTabs,
          { name: 'Patients', component: PatientNavigator, icon: 'users' },
          { name: 'Appointments', component: AppointmentNavigator, icon: 'calendar' },
          { name: 'Billing', component: BillingNavigator, icon: 'credit-card' },
          { name: 'Reports', component: ReportsNavigator, icon: 'bar-chart' },
        ];
      case 'DOCTOR':
        return [
          ...baseTabs,
          { name: 'Queue', component: QueueScreen, icon: 'clock' },
          { name: 'Patients', component: PatientNavigator, icon: 'users' },
          { name: 'Prescriptions', component: PrescriptionNavigator, icon: 'file-text' },
        ];
      case 'RECEPTIONIST':
        return [
          ...baseTabs,
          { name: 'Queue', component: QueueScreen, icon: 'clock' },
          { name: 'Appointments', component: AppointmentNavigator, icon: 'calendar' },
          { name: 'Billing', component: BillingNavigator, icon: 'credit-card' },
        ];
      default:
        return baseTabs;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const tab = getTabsForRole(user.role).find(t => t.name === route.name);
          return <Icon name={tab?.icon || 'home'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {getTabsForRole(user.role).map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ headerShown: false }}
        />
      ))}
    </Tab.Navigator>
  );
};
```

## Performance Optimizations

### 1. Image Optimization
```typescript
// components/OptimizedImage.tsx
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[style, styles.container]}>
      {loading && (
        <View style={styles.placeholder}>
          {placeholder || <ActivityIndicator />}
        </View>
      )}
      
      <Image
        {...props}
        source={source}
        style={[style, { opacity: loading ? 0 : 1 }]}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        resizeMode="cover"
      />
      
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="image-off" size={24} color="#gray" />
        </View>
      )}
    </View>
  );
};
```

### 2. List Performance
```typescript
// components/VirtualizedList.tsx
const VirtualizedPatientList: React.FC<VirtualizedListProps> = ({
  data,
  onEndReached,
  refreshing,
  onRefresh,
}) => {
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: Patient) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Patient }) => <PatientCard patient={item} />,
    []
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      refreshing={refreshing}
      onRefresh={onRefresh}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
    />
  );
};
```

## Testing Strategy

### 1. Unit Testing
```typescript
// __tests__/services/ApiClient.test.ts
describe('ApiClient', () => {
  let apiClient: ApiClient;
  
  beforeEach(() => {
    apiClient = new ApiClient('https://api.example.com');
  });

  it('should make authenticated requests', async () => {
    await apiClient.setAuthToken('test-token');
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { patients: [] } }),
    });

    const patients = await apiClient.getPatients();
    
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/patients',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });
});
```

### 2. Component Testing
```typescript
// __tests__/components/PatientCard.test.tsx
describe('PatientCard', () => {
  const mockPatient: Patient = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    phone: '1234567890',
    email: 'john@example.com',
  };

  it('should render patient information', () => {
    const { getByText } = render(<PatientCard patient={mockPatient} />);
    
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('1234567890')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PatientCard patient={mockPatient} onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('patient-card'));
    expect(onPress).toHaveBeenCalledWith(mockPatient);
  });
});
```

## Deployment Strategy

### 1. Expo Configuration
```json
// app.json
{
  "expo": {
    "name": "Hospital Management",
    "slug": "hospital-management",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hospital.management",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.hospital.management",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-camera",
      "expo-print",
      "expo-sharing",
      "expo-secure-store"
    ]
  }
}
```

### 2. Build Configuration
```bash
# Development build
expo build:android --type apk
expo build:ios --type simulator

# Production build
expo build:android --type app-bundle
expo build:ios --type archive

# Over-the-air updates
expo publish --release-channel production
```

## Migration Timeline

### Phase 1: Foundation (4-6 weeks)
- [ ] Set up React Native project structure
- [ ] Implement shared business logic
- [ ] Create basic navigation
- [ ] Implement authentication
- [ ] Set up API client

### Phase 2: Core Features (6-8 weeks)
- [ ] Patient management screens
- [ ] Appointment booking flow
- [ ] Dashboard implementation
- [ ] Queue management
- [ ] Basic offline support

### Phase 3: Advanced Features (4-6 weeks)
- [ ] Prescription management
- [ ] Billing system
- [ ] QR code scanning
- [ ] Push notifications
- [ ] Biometric authentication

### Phase 4: Polish & Testing (2-4 weeks)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] App store preparation
- [ ] Documentation

This mobile app strategy provides a comprehensive roadmap for converting the Hospital Management System into a feature-rich, cross-platform mobile application while maintaining code sharing and consistency with the web version.
