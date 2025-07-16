# Supabase Migration Setup

This guide will help you migrate your teams management from file-based storage to Supabase.

## 🎯 **Why Supabase?**

- **Cloud-Ready**: Perfect for deployment on Vercel, Netlify, etc.
- **Scalable**: PostgreSQL database with real-time features
- **Free Tier**: Generous limits for development and small teams
- **Easy Setup**: Minimal configuration required

## 🚀 **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose organization and enter project details:
   - **Name**: `cursor-analytics-dashboard`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Wait for project creation (2-3 minutes)

## 🗄️ **Step 2: Set Up Database**

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the entire contents of `database/schema.sql`
3. Click **RUN** to create tables and indexes
4. Verify tables were created in **Table Editor**

## 🔑 **Step 3: Get API Keys**

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **Public anon key**: `eyJhbGc...` (long token)

## 🔧 **Step 4: Configure Environment Variables**

Add these to your `.env.local` file:

```bash
# Existing Cursor API
CURSOR_API_KEY=your_cursor_api_key_here

# New Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚚 **Step 5: Run Migration**

Transfer your existing team data to Supabase:

```bash
# Make sure you have the environment variables set
node scripts/migrate-to-supabase.js
```

Expected output:
```
🚀 Starting migration from files to Supabase...

📋 Found 3 teams to migrate: frontend, backend, televox

🔄 Migrating team: frontend
  ✅ Created team: frontend
  ✅ Migrated 5 members for frontend

🔄 Migrating team: backend
  ✅ Created team: backend
  ✅ Migrated 8 members for backend

🔄 Migrating team: televox
  ✅ Created team: televox
  ✅ Migrated 3 members for televox

✅ Migration completed successfully!
```

## 🧪 **Step 6: Test the Application**

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Verify functionality:
   - ✅ Teams load in the dropdown
   - ✅ Team members display correctly
   - ✅ Can add/remove team members
   - ✅ Can create/delete teams
   - ✅ Export functionality works

## 🚀 **Step 7: Deploy to Production**

### Vercel Deployment

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `CURSOR_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Other Platforms

For Railway, Netlify, or other platforms:
1. Add the same environment variables
2. Ensure the platform supports Next.js API routes
3. Deploy your application

## 🔒 **Security Notes**

- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose in client-side code
- Row Level Security (RLS) is enabled on all tables
- Current policies allow all operations (adjust for production if needed)

## 🛠️ **Troubleshooting**

### Migration Issues

**Error: "Missing Supabase environment variables"**
- Ensure `.env.local` exists and has correct values
- Check for typos in variable names

**Error: "Team already exists"**
- This is normal if running migration multiple times
- Existing teams will be updated with new members

### Runtime Issues

**Error: "Failed to fetch teams"**
- Check Supabase project is active
- Verify environment variables are set
- Check network connectivity

**Teams not loading**
- Open browser dev tools and check for API errors
- Verify Supabase URL is correct
- Check if tables were created properly

## 📊 **Database Schema**

The migration creates these tables:

```sql
teams (
  id uuid PRIMARY KEY,
  name text UNIQUE,
  created_at timestamp,
  updated_at timestamp
)

team_members (
  id uuid PRIMARY KEY,
  team_id uuid REFERENCES teams(id),
  email text,
  added_at timestamp,
  UNIQUE(team_id, email)
)
```

## 🔄 **Rolling Back**

If you need to rollback to file-based storage:

1. Keep your `teams/` directory as backup
2. Revert the API route changes
3. Use git to restore previous versions of:
   - `src/app/api/teams/`
   - `src/hooks/useTeams.ts`

## 🎉 **Success!**

Your Cursor Analytics Dashboard is now ready for cloud deployment with a scalable database backend! 