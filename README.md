# Hospital Management System

A comprehensive hospital management solution built with Next.js, TypeScript, and modern web technologies.

## Features

### Phase 1: Foundation ✅
- **User Roles & Authentication**: Admin, Doctor, Receptionist with secure login
- **Patient Registration**: Complete patient demographics and medical information
- **Role-based Dashboards**: Customized interfaces for each user type

### Phase 2: Receptionist Flow ✅
- **Appointment Management**: Book, reschedule, cancel appointments
- **Queue Management**: Real-time patient status tracking
- **Token System**: Automated token generation for walk-ins

### Phase 3: Doctor Flow (In Progress)
- **Doctor Dashboard**: Live patient queue synchronization
- **Patient Consultation**: Unified patient profiles with medical history
- **Prescription System**: Digital prescriptions with medicine database

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **UI Components**: Custom component library with Lucide icons
- **Real-time**: Socket.io for live updates

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd hospital-management-system
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
# Update the environment variables as needed
```

4. Initialize the database
```bash
npx prisma db push
npx prisma generate
```

5. Seed the database with sample data
```bash
npx tsx lib/seed.ts
```

6. Start the development server
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Login Credentials

- **Admin**: admin@hospital.com / admin123
- **Doctor**: doctor@hospital.com / doctor123  
- **Receptionist**: reception@hospital.com / reception123

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── patients/          # Patient management
│   ├── appointments/      # Appointment management
│   └── queue/             # Queue management
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── appointments/     # Feature-specific components
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions
```

## Key Features

### Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (RBAC)
- Protected routes and API endpoints

### Patient Management
- Complete patient registration
- Search and filter capabilities
- Medical history tracking
- Demographics and contact information

### Appointment System
- Real-time appointment booking
- Doctor availability checking
- Appointment status tracking
- Token-based queue management

### Queue Management
- Live patient queue updates
- Status progression tracking
- Real-time synchronization between receptionist and doctor

### Modern UI/UX
- Responsive design for all devices
- Intuitive navigation with collapsible sidebar
- Real-time notifications
- Professional medical interface

## Database Schema

The system uses a comprehensive database schema with the following main entities:
- Users (Admin, Doctor, Receptionist)
- Patients (Demographics, medical info)
- Appointments (Scheduling, status tracking)
- Consultations (Medical records)
- Prescriptions (Digital prescriptions)
- Medicines (Drug database)
- Vitals (Patient measurements)
- Bills (Billing and payments)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open Prisma Studio

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
