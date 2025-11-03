# Google OAuth Setup Guide

## 🚀 Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com
2. Sign in with your Google account
3. Click **"Create Project"** or select existing project
4. Enter project name: `Digital Asset Management`
5. Click **"Create"**

### Step 2: Enable Google+ API

1. In the left menu, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click on it → Click **"Enable"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted:
   - User type: **"External"**
   - Click **"Create"**
   - Fill in app information:
     - Name: `Digital Asset Management`
     - Support email: your email
     - Developer email: your email
     - Click **"Save and Continue"**

### Step 4: Configure OAuth Consent Screen

1. On "Scopes" screen, click **"Save and Continue"**
2. On "Test users" screen:
   - Click **"Add Users"**
   - Add your Gmail address
   - Click **"Save and Continue"**

### Step 5: Create OAuth Client ID

1. Application type: **"Web application"**
2. Name: `DAM Web Client`
3. Authorized JavaScript origins:
   ```
   http://localhost:3000
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:3000/auth/google/callback
   ```
5. Click **"Create"**

### Step 6: Copy Credentials

You'll see a popup with:
- **Client ID**: `xxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

**SAVE THESE VALUES** - you'll need them!

### Step 7: Update .env File

Open `dam-backend/.env` and add:

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Step 8: Enable GoogleOAuthStrategy

Open `dam-backend/src/auth/auth.module.ts` and add back GoogleOAuthStrategy:

```typescript
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';

@Module({
  // ... existing code ...
  providers: [AuthService, JwtStrategy, GoogleOAuthStrategy],
  // ...
})
```

### Step 9: Restart Server

```bash
npm run start:dev
```

### Step 10: Test Google OAuth

1. Open frontend: http://localhost:3001
2. Click **"Or login with Google"** link
3. You should be redirected to Google login
4. Authorize the app
5. You should be logged in!

---

## 🔒 Production Setup

For production, update these in Google Console:

**Authorized JavaScript origins:**
```
https://yourdomain.com
```

**Authorized redirect URIs:**
```
https://yourdomain.com/auth/google/callback
```

Update `.env`:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Check redirect URI in Google Console matches exactly
- Must include: `http://localhost:3000/auth/google/callback`
- No trailing slashes!

### Error: "Unknown authentication strategy google"
- GoogleOAuthStrategy not imported in auth.module.ts
- Check Step 8 above

### Error: "OAuth2Strategy requires a clientID"
- Credentials not set in `.env`
- Check Step 7 above

### Can't see "Login with Google" link
- Frontend is hardcoded for Google OAuth
- Link is always shown, even if not configured
- Works once Google credentials are set

---

## 📝 Summary

**Required:**
1. ✅ Google Cloud project
2. ✅ OAuth 2.0 credentials created
3. ✅ Credentials added to `.env`
4. ✅ GoogleOAuthStrategy enabled in module
5. ✅ Server restarted

**That's it!** 🎉

---

## ⚠️ Security Notes

1. **Never commit `.env` to Git**
2. **Keep client secret secure**
3. **Use different credentials for production**
4. **Add authorized domains for production**
5. **Review OAuth scopes** - we only request email/profile

---

**Need help?** Check Google Cloud Console → APIs & Services → OAuth consent screen for any warnings.


