# Editions (Basic, Advanced, Enterprise)

Overview
- Ship a single build, enable features per deployment using environment variables.
- Default entitlements are defined in lib/edition.ts. You can optionally override them per deployment.

Tiers and included features
- Basic
  - Dashboard, Patients, Appointments, Queue, Prescriptions
  - Billing (basic), Reports (basic)
  - Admin, Settings, Users, Doctor Availability
- Advanced
  - Everything in Basic, plus: IPD, Lab, Imaging, OT, Pharmacy (+Queue)
  - Roles, Permissions, Advanced Reports, SSE (real-time)
- Enterprise
  - Everything in Advanced, plus: Doctor QR, Marketing, Multi-location
  - Offline, Audit Logs, and other enterprise capabilities

Environment configuration
- Use these variables at deploy time:
  - NEXT_PUBLIC_HOSPITAL_EDITION=BASIC|ADVANCED|ENTERPRISE
  - HOSPITAL_EDITION=BASIC|ADVANCED|ENTERPRISE
  - Optional granular override (server-side only):
    - HOSPITAL_ENTITLEMENTS=patients,appointments,queue,prescriptions,billing.basic,reports.basic

Examples
- Basic (clinic):
  - NEXT_PUBLIC_HOSPITAL_EDITION=BASIC
  - HOSPITAL_EDITION=BASIC
- Advanced (hospital):
  - NEXT_PUBLIC_HOSPITAL_EDITION=ADVANCED
  - HOSPITAL_EDITION=ADVANCED
- Enterprise (group/chain):
  - NEXT_PUBLIC_HOSPITAL_EDITION=ENTERPRISE
  - HOSPITAL_EDITION=ENTERPRISE
- Override a specific feature set:
  - HOSPITAL_ENTITLEMENTS=patients,appointments,queue,prescriptions,billing.basic,reports.basic,ipd

Upgrade checklist (safe, in-place)
1) Confirm license/contract with the customer for the new tier.
2) Update environment:
   - Change NEXT_PUBLIC_HOSPITAL_EDITION and HOSPITAL_EDITION to the higher tier.
   - Optional: adjust HOSPITAL_ENTITLEMENTS for custom combinations.
3) Restart the application (pm2, Docker, systemd, or hosting provider controls).
4) Validate UI:
   - Sidebar shows new modules (e.g., IPD, Lab, Imaging).
   - Admin > Roles > Permissions lists all available permissions (auto-synced on access).
5) (Optional) Enforce on API routes:
   - For sensitive modules, add server-side checks using hasFeature from lib/edition.ts.
6) Communicate changes to end users and provide short training if needed.

Notes
- No database migration is required to move between tiers.
- The UI is gated via feature entitlements; server-side enforcement can be added selectively.
- For enterprise deployments, consider enabling Offline and Multi-location, and set up monitoring.

Offline availability
- The app supports offline-first basics via a client-side IndexedDB cache (see lib/offline.ts):
  - GET requests cache responses; reads prefer cache when offline.
  - Mutations are queued while offline and synced automatically when back online.
  - This ensures basic read/write continuity without network.
- Implementation tips:
  - Wrap fetch with a thin client (e.g., lib/offline.ts) that writes reads to cache and enqueues writes.
  - Add a small online/offline indicator in the UI for transparency.
  - Prefer idempotent server endpoints for robust replay.

Pricing recommendations (India, typical ranges)
- Basic: INR 10,000 – 15,000 / month
- Advanced: INR 25,000 – 40,000 / month
- Enterprise: INR 50,000+ / month (includes advanced integrations, priority support, optional services)
- Adjust by client segment, add-ons (pay-per-use), and volume discounts as needed.
