# Deployment Issues & Fixes

## Issues Identified

1. **API 500 Errors**: `/api/pharmacy/stock` returning 500 Internal Server Error (HTTP 500)
2. **Reports Page 404 Error**: The reports page shows 404 in production
3. **Database Schema Issues**: Pharmacy tables may not exist in production database

## Fixes Required

### 1. Database Schema Migration

The pharmacy/stock API errors are likely due to missing database tables. You need to run Prisma migrations in production.

**Steps to fix:**

1. **Check if migrations have been run:**
   ```bash
   # In your production environment or locally connected to production DB
   npx prisma migrate status
   ```

2. **Run migrations if needed:**
   ```bash
   # Deploy all pending migrations
   npx prisma migrate deploy
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Verify tables exist:**
   ```bash
   # Check if pharmacy tables exist
   npx prisma db pull
   ```

### 2. Environment Variables in Vercel

Ensure these environment variables are set in your Vercel project:

```env
# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key

# Database (Supabase)
DATABASE_URL=your-supabase-connection-string
DIRECT_DATABASE_URL=your-direct-connection-string

# Node environment
NODE_ENV=production
```

**To set in Vercel:**
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable above

### 3. Fix Page Routing

Vercel's production build might have issues with the routing for the Reports page. Try these fixes:

1. **Ensure reports page exists in build**:
   - Check that `/app/(authenticated)/reports/page.tsx` exists in your local codebase
   - Verify that it's properly included in your Git repository

2. **Update Next.js cache and routing**:
   ```bash
   # Clear Next.js cache in Vercel (via Vercel dashboard)
   # or redeploy with the following command locally:
   npx vercel --prod
   ```

3. **Check for URL routing issues**:
   - In your Vercel dashboard, go to Settings > Functions > Routing
   - Ensure there are no conflicting route definitions

### 4. Debug API Errors

To debug the 500 errors on the pharmacy/stock API:

1. **Check server logs**:
   - In Vercel dashboard, navigate to your project's Functions tab
   - Look for error messages related to `/api/pharmacy/stock`

2. **Test API locally**:
   ```bash
   # Run this command to test the API locally
   curl http://localhost:3000/api/pharmacy/stock
   ```

3. **Debug database connection**:
   ```bash
   # Add debugging code to the API route file
   console.log("Database URL:", process.env.DATABASE_URL);
   ```

4. **Verify table existence**:
   ```sql
   -- Run this SQL in your database
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'medicine_stock'
   );
   ```

### 5. Use the Troubleshooting Script

Run the automated troubleshooting script to diagnose issues:

```bash
# Make the script executable
chmod +x ./scripts/troubleshoot-production.js

# Run diagnostics
node ./scripts/troubleshoot-production.js
```

This script will:
- ✅ Check database connectivity
- ✅ Verify all required tables exist
- ✅ Check pharmacy data integrity
- 🌱 Offer to seed basic data if tables are empty

### 6. Quick Fix Commands

If migrations are missing, run these commands in order:

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Deploy migrations to production DB
npx prisma migrate deploy

# 3. Optionally reset and seed (⚠️ WARNING: This will delete all data)
# npx prisma migrate reset --force
# npm run seed

# 4. Restart your Vercel deployment
npx vercel --prod
```

## Expected Results After Fixes

✅ **Reports page should load** at `/reports` with charts and analytics  
✅ **Pharmacy API should work** at `/api/pharmacy/stock`  
✅ **No more 500 errors** in browser console  
✅ **All dashboard features functional**

## Still Having Issues?

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Look for any error messages in recent deployments

2. **Test API endpoints directly**:
   ```bash
   curl https://your-app.vercel.app/api/pharmacy/stock
   curl https://your-app.vercel.app/api/patients
   ```

3. **Check environment variables in Vercel**:
   - Ensure `DATABASE_URL` is set correctly
   - Ensure `NEXTAUTH_URL` matches your domain
   - Verify `NEXTAUTH_SECRET` is set

4. **Contact support** with the output from the troubleshooting script
