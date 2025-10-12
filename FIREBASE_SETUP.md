# Firebase Setup Instructions

Follow these steps to set up Firebase authentication and Firestore for your NeuroAI application.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `neuroai` (or any name you prefer)
4. Enable Google Analytics if desired
5. Click "Create project"

## 2. Enable Authentication

1. In the Firebase console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following sign-in providers:
   - **Email/Password**: Click on it and toggle "Enable"
   - **Google**: Click on it, toggle "Enable", and add your project's support email

## 3. Setup Firestore Database

1. In the Firebase console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security rules later)
4. Select a location close to your users
5. Click "Done"

## 4. Get Firebase Configuration

1. In the Firebase console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on the web icon `</>`
4. Register your app with name "NeuroAI"
5. Copy the config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 5. Update Configuration File

Replace the placeholder values in `src/firebase/config.js` with your actual Firebase configuration:

```javascript
// Replace the firebaseConfig object with your actual values
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 6. Setup Firestore Security Rules (Optional but Recommended)

In the Firestore console, go to the "Rules" tab and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read and write their own chats
      match /chats/{chatId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 7. Configure Google OAuth (for Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add your domain to authorized origins:
   - `http://localhost:5173` (for development)
   - Your production domain (when deployed)
7. Add redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain (when deployed)

## 8. Test the Setup

1. Start your development server: `npm run dev`
2. Try creating an account with email/password
3. Try signing in with Google
4. Check the Firebase console to see if users are being created
5. Check Firestore to see if chat data is being saved

## 9. Environment Variables (Optional but Recommended)

For better security, you can store your Firebase config in environment variables:

Create a `.env.local` file in your project root:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Then update `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## 10. Features Included

✅ **User Authentication**
- Email/password registration and login
- Google OAuth sign-in
- Password reset functionality
- User profile management

✅ **Cloud Storage**
- Chat sessions saved to Firestore
- Real-time sync across devices
- Automatic migration from localStorage
- User-specific data isolation

✅ **User Experience**
- Persistent login sessions
- Profile pictures from Google
- Sync status indicators
- Chat session management

## Troubleshooting

### Common Issues:

1. **"Firebase config not found"**
   - Make sure you've updated the config in `src/firebase/config.js`

2. **Google sign-in not working**
   - Check that OAuth 2.0 is properly configured in Google Cloud Console
   - Verify authorized domains are correct

3. **Firestore permission denied**
   - Check that security rules are properly set up
   - Make sure user is authenticated before accessing Firestore

4. **Development server issues**
   - Make sure you're running on `http://localhost:5173`
   - Check that this URL is in your OAuth authorized origins

## Support

If you encounter any issues, check:
- Firebase Console for error logs
- Browser developer console for JavaScript errors
- Firestore rules simulator for permission issues