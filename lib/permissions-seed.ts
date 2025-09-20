import { prisma } from "./prisma";

export const PERMISSIONS_SEED = [
  // Patients Module
  { module: "patients", action: "create", displayName: "Create Patients", description: "Create new patient records" },
  { module: "patients", action: "read", displayName: "View Patients", description: "View patient information and records" },
  { module: "patients", action: "update", displayName: "Update Patients", description: "Edit patient information" },
  { module: "patients", action: "delete", displayName: "Delete Patients", description: "Delete patient records" },
  { module: "patients", action: "manage", displayName: "Manage Patients", description: "Full patient management access" },

  // Appointments Module
  { module: "appointments", action: "create", displayName: "Create Appointments", description: "Schedule new appointments" },
  { module: "appointments", action: "read", displayName: "View Appointments", description: "View appointment schedules and details" },
  { module: "appointments", action: "update", displayName: "Update Appointments", description: "Modify appointment details and status" },
  { module: "appointments", action: "delete", displayName: "Cancel Appointments", description: "Cancel or delete appointments" },
  { module: "appointments", action: "assign", displayName: "Assign Doctors", description: "Assign or reassign doctors to appointments" },
  { module: "appointments", action: "manage", displayName: "Manage Appointments", description: "Full appointment management access" },

  // Bills & Financial Module
  { module: "bills", action: "create", displayName: "Create Bills", description: "Generate bills and invoices" },
  { module: "bills", action: "read", displayName: "View Bills", description: "View billing information and financial data" },
  { module: "bills", action: "update", displayName: "Update Bills", description: "Edit billing information" },
  { module: "bills", action: "delete", displayName: "Delete Bills", description: "Delete or void bills" },
  { module: "bills", action: "manage", displayName: "Manage Billing", description: "Full billing management access" },

  // Prescriptions Module
  { module: "prescriptions", action: "create", displayName: "Create Prescriptions", description: "Write new prescriptions" },
  { module: "prescriptions", action: "read", displayName: "View Prescriptions", description: "View prescription history and details" },
  { module: "prescriptions", action: "update", displayName: "Update Prescriptions", description: "Modify prescription details" },
  { module: "prescriptions", action: "delete", displayName: "Delete Prescriptions", description: "Remove or void prescriptions" },
  { module: "prescriptions", action: "manage", displayName: "Manage Prescriptions", description: "Full prescription management access" },

  // IPD (In-Patient Department) Module
  { module: "ipd", action: "read", displayName: "View IPD", description: "View ward and bed information" },
  { module: "ipd", action: "update", displayName: "Update IPD", description: "Update bed status and patient assignments" },
  { module: "ipd", action: "admit", displayName: "Admit Patients", description: "Admit patients to IPD" },
  { module: "ipd", action: "discharge", displayName: "Discharge Patients", description: "Discharge patients from IPD" },
  { module: "ipd", action: "manage", displayName: "Manage IPD", description: "Full IPD management including ward configuration" },

  // Laboratory Module
  { module: "lab", action: "create", displayName: "Create Lab Tests", description: "Order and create lab test requests" },
  { module: "lab", action: "read", displayName: "View Lab Reports", description: "View lab test results and reports" },
  { module: "lab", action: "update", displayName: "Update Lab Tests", description: "Update test status and results" },
  { module: "lab", action: "manage", displayName: "Manage Laboratory", description: "Full laboratory management access" },

  // Imaging Module
  { module: "imaging", action: "create", displayName: "Create Imaging Requests", description: "Order imaging procedures for patients" },
  { module: "imaging", action: "read", displayName: "View Imaging Orders & Results", description: "View imaging requests, schedules and results" },
  { module: "imaging", action: "update", displayName: "Update Imaging Requests", description: "Update imaging request status and upload results" },
  { module: "imaging", action: "manage", displayName: "Manage Imaging", description: "Full imaging management including services & procedures" },

  // Operation Theatre (OT) Module
  { module: "ot", action: "create", displayName: "Create OT Requests", description: "Schedule and create OT/procedure requests" },
  { module: "ot", action: "read", displayName: "View OT Requests", description: "View OT schedules and procedure requests" },
  { module: "ot", action: "update", displayName: "Update OT Requests", description: "Update OT request status and completion" },
  { module: "ot", action: "manage", displayName: "Manage OT", description: "Full OT management including services & procedures" },

  // Pharmacy Module (granular)
  { module: "pharmacy", action: "create", displayName: "Create Pharmacy Records", description: "Create pharmacy entries and actions" },
  { module: "pharmacy", action: "read", displayName: "View Pharmacy", description: "View pharmacy data and operations" },
  { module: "pharmacy", action: "update", displayName: "Update Pharmacy Records", description: "Update pharmacy records and operations" },
  { module: "pharmacy", action: "delete", displayName: "Delete Pharmacy Records", description: "Delete pharmacy records where allowed" },
  { module: "pharmacy", action: "manage", displayName: "Manage Pharmacy", description: "Full pharmacy management access" },
  // Pharmacy sub-features
  { module: "pharmacy", action: "stock.read", displayName: "View Stock", description: "View medicine stock levels" },
  { module: "pharmacy", action: "stock.update", displayName: "Update Stock", description: "Adjust and update stock levels" },
  { module: "pharmacy", action: "stock.manage", displayName: "Manage Stock", description: "Full stock management access" },
  { module: "pharmacy", action: "medicines.read", displayName: "View Medicines", description: "View medicines and details" },
  { module: "pharmacy", action: "medicines.create", displayName: "Create Medicines", description: "Add new medicines" },
  { module: "pharmacy", action: "medicines.update", displayName: "Update Medicines", description: "Edit medicine details" },
  { module: "pharmacy", action: "medicines.delete", displayName: "Delete Medicines", description: "Remove medicines" },
  { module: "pharmacy", action: "categories.read", displayName: "View Categories", description: "View medicine categories" },
  { module: "pharmacy", action: "categories.create", displayName: "Create Categories", description: "Add new medicine categories" },
  { module: "pharmacy", action: "categories.update", displayName: "Update Categories", description: "Edit medicine category details" },
  { module: "pharmacy", action: "suppliers.read", displayName: "View Suppliers", description: "View suppliers list" },
  { module: "pharmacy", action: "suppliers.create", displayName: "Create Suppliers", description: "Add new suppliers" },
  { module: "pharmacy", action: "suppliers.update", displayName: "Update Suppliers", description: "Edit supplier details" },
  { module: "pharmacy", action: "dispatch.read", displayName: "View Dispatch Queue", description: "View pharmacy dispatch queue" },
  { module: "pharmacy", action: "dispatch.create", displayName: "Create Dispatch", description: "Create dispatch jobs" },
  { module: "pharmacy", action: "dispatch.update", displayName: "Update Dispatch", description: "Update dispatch status" },

  // Users & Staff Module
  { module: "users", action: "create", displayName: "Create Users", description: "Add new staff members and users" },
  { module: "users", action: "read", displayName: "View Users", description: "View user profiles and information" },
  { module: "users", action: "update", displayName: "Update Users", description: "Edit user profiles and information" },
  { module: "users", action: "delete", displayName: "Delete Users", description: "Remove user accounts" },
  { module: "users", action: "manage", displayName: "Manage Users", description: "Full user management access" },

  // Settings & Configuration Module
  { module: "settings", action: "read", displayName: "View Settings", description: "View hospital configuration and settings" },
  { module: "settings", action: "update", displayName: "Update Settings", description: "Modify hospital settings and configuration" },
  { module: "settings", action: "manage", displayName: "Manage Settings", description: "Full settings management access" },

  // Reports & Analytics Module
  { module: "reports", action: "read", displayName: "View Reports", description: "View hospital reports and analytics" },
  { module: "reports", action: "create", displayName: "Generate Reports", description: "Create and generate custom reports" },
  { module: "reports", action: "manage", displayName: "Manage Reports", description: "Full reports management access" },

  // Role Management Module
  { module: "roles", action: "create", displayName: "Create Roles", description: "Create new custom roles" },
  { module: "roles", action: "read", displayName: "View Roles", description: "View role definitions and assignments" },
  { module: "roles", action: "update", displayName: "Update Roles", description: "Modify role permissions and settings" },
  { module: "roles", action: "delete", displayName: "Delete Roles", description: "Remove custom roles" },
  { module: "roles", action: "assign", displayName: "Assign Roles", description: "Assign roles to users" },
  { module: "roles", action: "manage", displayName: "Manage Roles", description: "Full role management access" },

  // Queue Management Module
  { module: "queue", action: "read", displayName: "View Queue", description: "View patient queues and waiting lists" },
  { module: "queue", action: "update", displayName: "Manage Queue", description: "Manage patient queue and consultations" },

  // Marketing Module
  { module: "marketing", action: "read", displayName: "View Marketing", description: "View marketing campaigns and data" },
  { module: "marketing", action: "create", displayName: "Create Campaigns", description: "Create marketing campaigns" },
  { module: "marketing", action: "update", displayName: "Update Marketing", description: "Modify marketing campaigns" },
  { module: "marketing", action: "manage", displayName: "Manage Marketing", description: "Full marketing management access" }
];

export const CUSTOM_ROLES_SEED = [
  {
    name: "NURSE_SUPERVISOR",
    displayName: "Nurse Supervisor",
    description: "Senior nurse with additional supervisory responsibilities",
    isSystem: false,
    permissions: [
      "patients.read", "patients.update",
      "appointments.read", "appointments.update",
      "prescriptions.read",
      "ipd.read", "ipd.update", "ipd.admit", "ipd.discharge",
      "queue.read", "queue.update",
      "users.read"
    ]
  },
  {
    name: "LAB_TECHNICIAN",
    displayName: "Lab Technician",
    description: "Laboratory technician with test management access",
    isSystem: false,
    permissions: [
      "lab.create", "lab.read", "lab.update",
      "patients.read",
      "prescriptions.read"
    ]
  },
  {
    name: "BILLING_MANAGER",
    displayName: "Billing Manager",
    description: "Financial manager with billing oversight",
    isSystem: false,
    permissions: [
      "bills.create", "bills.read", "bills.update", "bills.manage",
      "patients.read",
      "appointments.read",
      "prescriptions.read",
      "reports.read", "reports.create"
    ]
  },
  {
    name: "CHIEF_DOCTOR",
    displayName: "Chief Medical Officer",
    description: "Senior doctor with administrative privileges",
    isSystem: false,
    permissions: [
      "patients.manage",
      "appointments.manage",
      "prescriptions.manage",
      "ipd.manage",
      "lab.read", "lab.update",
      "users.read", "users.update",
      "queue.read", "queue.update",
      "reports.read", "reports.create"
    ]
  },
  {
    name: "PHARMACY_MANAGER",
    displayName: "Pharmacy Manager",
    description: "Pharmacy operations manager",
    isSystem: false,
    permissions: [
      "prescriptions.read", "prescriptions.update",
      "patients.read",
      "bills.create", "bills.read",
      "reports.read"
    ]
  }
];

export async function seedPermissionsAndRoles() {
  console.log("🔐 Seeding permissions and custom roles...");
  
  try {
    // Seed permissions
    console.log("Creating permissions...");
    for (const perm of PERMISSIONS_SEED) {
      await prisma.permission.upsert({
        where: { name: `${perm.module}.${perm.action}` },
        update: {
          displayName: perm.displayName,
          description: perm.description,
          module: perm.module,
          action: perm.action,
          isActive: true
        },
        create: {
          name: `${perm.module}.${perm.action}`,
          displayName: perm.displayName,
          description: perm.description,
          module: perm.module,
          action: perm.action,
          isActive: true
        }
      });
    }
    
    console.log(`✅ Created ${PERMISSIONS_SEED.length} permissions`);

    // Seed custom roles
    console.log("Creating custom roles...");
    for (const roleData of CUSTOM_ROLES_SEED) {
      // Create or update role
      const role = await prisma.customRole.upsert({
        where: { name: roleData.name },
        update: {
          displayName: roleData.displayName,
          description: roleData.description,
          isActive: true
        },
        create: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: roleData.isSystem,
          isActive: true
        }
      });

      console.log(`  ✅ Role: ${role.displayName}`);

      // Assign permissions to role
      for (const permissionName of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }

      console.log(`    ✅ Assigned ${roleData.permissions.length} permissions`);
    }

    console.log("✅ Permissions and roles seeded successfully!");
    
    // Show summary
    const totalPermissions = await prisma.permission.count();
    const totalCustomRoles = await prisma.customRole.count();
    const totalRolePermissions = await prisma.rolePermission.count();
    
    console.log(`📊 Summary: ${totalPermissions} permissions, ${totalCustomRoles} custom roles, ${totalRolePermissions} role-permission assignments`);
    
  } catch (error) {
    console.error("❌ Error seeding permissions and roles:", error);
    throw error;
  }
}

if (require.main === module) {
  seedPermissionsAndRoles()
    .then(() => {
      console.log("✅ Permissions and roles seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Permissions and roles seeding failed:", error);
      process.exit(1);
    });
}
