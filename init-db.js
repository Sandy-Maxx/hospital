const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function initDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Initializing database...')
    
    // Test connection and create tables
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Create default users
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@hospital.com' },
      update: {},
      create: {
        email: 'admin@hospital.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    })
    
    const doctor = await prisma.user.upsert({
      where: { email: 'doctor@hospital.com' },
      update: {},
      create: {
        email: 'doctor@hospital.com',
        name: 'Dr. Smith',
        password: hashedPassword,
        role: 'DOCTOR',
        department: 'General Medicine',
        specialization: 'General Practitioner',
        isActive: true
      }
    })
    
    const receptionist = await prisma.user.upsert({
      where: { email: 'reception@hospital.com' },
      update: {},
      create: {
        email: 'reception@hospital.com',
        name: 'Reception Staff',
        password: hashedPassword,
        role: 'RECEPTIONIST',
        isActive: true
      }
    })
    
    console.log('✅ Test users created:')
    console.log('- Admin: admin@hospital.com / admin123')
    console.log('- Doctor: doctor@hospital.com / doctor123')
    console.log('- Receptionist: reception@hospital.com / reception123')
    
    // Create hospital settings
    await prisma.hospitalSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'MediCare Hospital',
        tagline: 'Your Health, Our Priority',
        phone: '+91 98765 43210',
        email: 'info@medicare.com',
        address: '123 Health Street, Medical City, India'
      }
    })
    
    console.log('✅ Hospital settings initialized')
    console.log('🎉 Database initialization complete!')
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

initDatabase()
