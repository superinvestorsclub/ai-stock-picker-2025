# Supabase Google OAuth Setup Guide

## Step 1: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to configure it
5. Toggle **Enable sign in with Google** to ON

## Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client IDs**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local development)
   - Copy the **Client ID** and **Client Secret**

## Step 3: Configure Google Provider in Supabase

1. Back in Supabase Dashboard → Authentication → Providers → Google
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

## Step 4: Update Site URL (Important!)

1. In Supabase Dashboard → Authentication → Settings
2. Set **Site URL** to your domain: `https://investian-ai-stock-p-ql4v.bolt.host`
3. Add **Redirect URLs**:
   - `https://investian-ai-stock-p-ql4v.bolt.host/**`
   - `http://localhost:5173/**` (for local development)
   - `http://localhost:3000/**` (alternative local development port)

## Step 5: Test the Integration

After completing the above steps:
1. Try signing in with Google again
2. The error should be resolved

## Common Issues:

- **"Unsupported provider"**: Google provider not enabled in Supabase
- **"Invalid redirect URI"**: Check that your redirect URIs match exactly
- **"Client ID not found"**: Verify Google OAuth credentials are correctly entered

## Environment Variables Required:

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in Supabase Dashboard → Settings → API