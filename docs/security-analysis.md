# Security Analysis & Hardening Guide

## Current Security Implementation

### Authentication & Authorization
✅ **Implemented**:
- NextAuth.js with JWT strategy
- bcrypt password hashing (salt rounds: 12)
- Role-based access control (ADMIN, DOCTOR, RECEPTIONIST)
- Session timeout management
- Protected API routes with middleware

⚠️ **Security Risks**:
- No password complexity requirements
- No account lockout after failed attempts
- No two-factor authentication (2FA)
- JWT tokens don't expire automatically
- No password reset functionality

### Data Protection
✅ **Implemented**:
- Prisma ORM prevents SQL injection
- Input validation with Zod schemas
- React's built-in XSS protection
- HTTPS enforcement in production

⚠️ **Security Risks**:
- Sensitive data in localStorage (session tokens)
- No data encryption at rest
- No audit logging for sensitive operations
- File uploads without virus scanning
- No rate limiting on API endpoints

### API Security
✅ **Implemented**:
- Authentication middleware for protected routes
- Role-based endpoint access
- Request validation and sanitization
- Consistent error handling

⚠️ **Security Risks**:
- No CORS configuration
- No API rate limiting
- No request size limits
- Verbose error messages in development
- No API versioning security

## Critical Security Vulnerabilities

### 1. Authentication Weaknesses
**Risk Level**: HIGH

**Issues**:
- Weak password policy (no complexity requirements)
- No account lockout mechanism
- Session tokens stored in localStorage (vulnerable to XSS)
- No session invalidation on password change

**Remediation**:
```typescript
// Password policy implementation
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    "Password must contain uppercase, lowercase, number, and special character");

// Account lockout implementation
interface LoginAttempt {
  email: string;
  attempts: number;
  lockedUntil?: Date;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
```

### 2. Data Exposure Risks
**Risk Level**: HIGH

**Issues**:
- Patient data transmitted without additional encryption
- No data masking in logs
- Sensitive data in client-side state
- No data retention policies

**Remediation**:
```typescript
// Data encryption utility
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('hospital-data'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

// Data masking for logs
const maskSensitiveData = (data: any) => {
  const masked = { ...data };
  if (masked.phone) masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  if (masked.email) masked.email = masked.email.replace(/(.{2}).*(@.*)/, '$1****$2');
  return masked;
};
```

### 3. API Security Gaps
**Risk Level**: MEDIUM

**Issues**:
- No rate limiting
- Missing CORS configuration
- No request size limits
- Information disclosure in error messages

**Remediation**:
```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

const createRateLimit = (windowMs: number, max: number) => rateLimit({
  windowMs,
  max,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API route protection
export const apiLimiter = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authLimiter = createRateLimit(15 * 60 * 1000, 5);   // 5 login attempts per 15 minutes

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

## Security Hardening Recommendations

### 1. Immediate Actions (Priority: HIGH)

#### Implement Strong Authentication
```typescript
// Enhanced auth configuration
export const authOptions: NextAuthOptions = {
  // ... existing config
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.iat = Math.floor(Date.now() / 1000);
      }
      
      // Check if token is expired
      const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number);
      if (tokenAge > 8 * 60 * 60) {
        throw new Error('Token expired');
      }
      
      return token;
    },
  },
};

// Password validation
const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};
```

#### Add Input Validation & Sanitization
```typescript
// Enhanced validation schemas
const patientSchema = z.object({
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s]+$/, "Only letters and spaces allowed"),
  lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s]+$/, "Only letters and spaces allowed"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    return birthDate < today && birthDate > new Date('1900-01-01');
  }, "Invalid birth date"),
});

// SQL injection prevention (already implemented via Prisma)
// XSS prevention
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};
```

#### Implement Audit Logging
```typescript
// Audit log model (add to schema.prisma)
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  resource  String   // PATIENT, APPOINTMENT, PRESCRIPTION, etc.
  resourceId String?
  oldValues String?  // JSON
  newValues String?  // JSON
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  user User? @relation(fields: [userId], references: [id])
  @@map("audit_logs")
}

// Audit logging utility
export const createAuditLog = async (
  userId: string | null,
  action: string,
  resource: string,
  resourceId?: string,
  oldValues?: any,
  newValues?: any,
  req?: NextRequest
) => {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      oldValues: oldValues ? JSON.stringify(maskSensitiveData(oldValues)) : null,
      newValues: newValues ? JSON.stringify(maskSensitiveData(newValues)) : null,
      ipAddress: req?.ip || req?.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req?.headers.get('user-agent') || 'unknown',
    },
  });
};
```

### 2. Medium Priority Actions

#### Implement Content Security Policy (CSP)
```typescript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
      font-src 'self';
      connect-src 'self';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];
```

#### File Upload Security
```typescript
// Secure file upload configuration
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validateFile = (file: File): boolean => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('File type not allowed');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size too large');
  }
  
  return true;
};

// Virus scanning integration (placeholder)
const scanFileForVirus = async (filePath: string): Promise<boolean> => {
  // Integrate with ClamAV or similar
  return true; // Placeholder
};
```

### 3. Long-term Security Enhancements

#### Two-Factor Authentication (2FA)
```typescript
// 2FA implementation with TOTP
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Add to User model
model User {
  // ... existing fields
  twoFactorSecret String?
  twoFactorEnabled Boolean @default(false)
  backupCodes String? // JSON array of backup codes
}

// 2FA setup
export const setup2FA = async (userId: string) => {
  const secret = speakeasy.generateSecret({
    name: 'Hospital Management System',
    account: user.email,
    issuer: 'MediCare Hospital',
  });
  
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32 },
  });
  
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
  return { secret: secret.base32, qrCode: qrCodeUrl };
};

// 2FA verification
export const verify2FA = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps of variance
  });
};
```

#### Data Encryption at Rest
```typescript
// Database field encryption
import { createCipher, createDecipher } from 'crypto';

// Encrypted field transformer
const encryptedField = {
  to: (value: string) => encrypt(value),
  from: (value: string) => decrypt(value),
};

// Apply to sensitive fields in Prisma schema
model Patient {
  // ... other fields
  phoneEncrypted String @map("phone") // Store encrypted
  emailEncrypted String? @map("email") // Store encrypted
  
  // Virtual fields for application use
  phone String @ignore
  email String? @ignore
}
```

## Compliance & Standards

### HIPAA Compliance Checklist
- [ ] Administrative Safeguards
  - [ ] Security Officer designation
  - [ ] Workforce training
  - [ ] Access management procedures
  - [ ] Incident response procedures

- [ ] Physical Safeguards
  - [ ] Facility access controls
  - [ ] Workstation use restrictions
  - [ ] Device and media controls

- [ ] Technical Safeguards
  - [ ] Access control (✅ Implemented)
  - [ ] Audit controls (⚠️ Partial)
  - [ ] Integrity controls (⚠️ Needs enhancement)
  - [ ] Person or entity authentication (✅ Implemented)
  - [ ] Transmission security (⚠️ Needs HTTPS enforcement)

### GDPR Compliance
- [ ] Data Protection Impact Assessment (DPIA)
- [ ] Right to be forgotten implementation
- [ ] Data portability features
- [ ] Consent management
- [ ] Data breach notification procedures

## Security Monitoring & Incident Response

### Monitoring Implementation
```typescript
// Security event monitoring
const securityEvents = {
  FAILED_LOGIN: 'failed_login',
  ACCOUNT_LOCKED: 'account_locked',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  DATA_EXPORT: 'data_export',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
};

const logSecurityEvent = async (event: string, details: any) => {
  await prisma.securityLog.create({
    data: {
      event,
      details: JSON.stringify(details),
      severity: getSeverityLevel(event),
      createdAt: new Date(),
    },
  });
  
  // Alert on critical events
  if (isCriticalEvent(event)) {
    await sendSecurityAlert(event, details);
  }
};
```

### Incident Response Plan
1. **Detection**: Automated monitoring alerts
2. **Analysis**: Log analysis and threat assessment
3. **Containment**: Immediate threat isolation
4. **Eradication**: Remove threat and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

## Security Testing Strategy

### Automated Security Testing
```typescript
// Security test cases
describe('Security Tests', () => {
  test('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/patients')
      .send({ firstName: maliciousInput });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });
  
  test('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const response = await request(app)
      .post('/api/patients')
      .send({ firstName: xssPayload });
    
    expect(response.status).toBe(400);
  });
  
  test('should enforce rate limiting', async () => {
    const requests = Array(10).fill(null).map(() => 
      request(app).post('/api/auth/signin').send({})
    );
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

### Penetration Testing Checklist
- [ ] Authentication bypass attempts
- [ ] Authorization escalation tests
- [ ] Input validation testing
- [ ] Session management testing
- [ ] Error handling analysis
- [ ] Information disclosure testing
- [ ] Business logic testing

## Production Security Checklist

### Pre-Deployment
- [ ] Security code review completed
- [ ] Vulnerability scanning performed
- [ ] Penetration testing completed
- [ ] Security configurations verified
- [ ] SSL/TLS certificates installed
- [ ] Environment variables secured
- [ ] Database security hardened
- [ ] Backup and recovery tested

### Post-Deployment
- [ ] Security monitoring enabled
- [ ] Log aggregation configured
- [ ] Incident response procedures documented
- [ ] Security team training completed
- [ ] Regular security assessments scheduled
- [ ] Compliance audits planned

This security analysis provides a comprehensive roadmap for hardening the Hospital Management System against current and future threats while maintaining compliance with healthcare regulations.
