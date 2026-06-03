# Google OAuth Setup Guide

## ✅ Backend Setup Complete!

Your Google OAuth integration is now fully implemented. Follow these steps to get it working:

## 📋 Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown and create a **New Project**
3. Name it "Kenynamy" or similar
4. Once created, go to **APIs & Services** → **Library**
5. Search for "Google+ API" and enable it
6. Go to **APIs & Services** → **Credentials**
7. Click **Create Credentials** → **OAuth 2.0 Client ID**
8. Choose **Web application** as application type
9. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:4000/api/auth/google/callback
   ```
10. Click **Create**
11. Copy your **Client ID** and **Client Secret**

## 🔑 Step 2: Update Environment Variables

Open your `.env` file and replace the placeholders:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

**Example:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

## 🚀 Step 3: Test It

1. Restart your server: `npm start`
2. Open your app in browser: `http://localhost:4000`
3. Click **"Continue with Google"** button
4. You'll be redirected to Google to login
5. After login, you'll be automatically logged into your app!

## ✨ Features

- ✅ New users are automatically created from Google profile
- ✅ Existing users can link their Google account
- ✅ Profile picture is automatically imported from Google
- ✅ Username auto-generated if using Google OAuth

## 🐛 Troubleshooting

**"Invalid Client" error?**
- Check your Client ID and Secret in `.env`
- Make sure they're exactly as shown in Google Cloud Console
- Restart your server after updating `.env`

**Redirect URI mismatch?**
- Ensure the redirect URI in Google Console exactly matches:
  `http://localhost:4000/api/auth/google/callback`
- Don't add trailing slashes or change the path

**Still not working?**
- Check browser console for errors (F12)
- Check server logs for any error messages
- Make sure MongoDB is running

## 📝 Notes

- Passwords are optional for Google OAuth users
- The same email can't be used for both regular signup and Google OAuth with a different account
- For production, use HTTPS and update the callback URL accordingly

Enjoy! 🎉
