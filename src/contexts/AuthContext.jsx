import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  console.log('AuthProvider render:', { loading, hasCurrentUser: !!currentUser });

  // Sign up with email and password
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }

    // Create user document in Firestore
    const userDoc = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName || userCredential.user.email.split('@')[0],
      photoURL: userCredential.user.photoURL || null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        theme: 'light',
        exportFormat: 'text'
      }
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
    setUserProfile(userDoc);
    
    return userCredential;
  }

  // Sign in with email and password
  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login time
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      lastLoginAt: new Date()
    }, { merge: true });

    return userCredential;
  }

  // Sign in with Google
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user document exists, if not create it
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const userDoc = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || userCredential.user.email.split('@')[0],
        photoURL: userCredential.user.photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          theme: 'light',
          exportFormat: 'text'
        }
      };
      await setDoc(userDocRef, userDoc);
      setUserProfile(userDoc);
    } else {
      // Update last login time
      await setDoc(userDocRef, {
        lastLoginAt: new Date()
      }, { merge: true });
      setUserProfile(userDocSnap.data());
    }

    return userCredential;
  }

  // Sign out
  async function logout() {
    console.log('Logging out user');
    setLoading(true); // Set loading during logout
    setUserProfile(null);
    const result = await signOut(auth);
    // Loading will be set to false by the auth state change listener
    return result;
  }

  // Reset password
  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Update user profile
  async function updateUserProfile(updates) {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, updates, { merge: true });
    
    setUserProfile(prev => ({ ...prev, ...updates }));
  }

  // Refresh user profile to get latest data (including chat counts)
  async function refreshUserProfile() {
    if (!currentUser) return null;
    
    console.log('Refreshing user profile data');
    return await loadUserProfile(currentUser);
  }

  // Load user profile from Firestore
  async function loadUserProfile(user) {
    if (!user) return null;

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const profile = userDocSnap.data();
      console.log('Loaded user profile with totalChats:', profile.totalChats || 0);
      setUserProfile(profile);
      return profile;
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', { userId: user?.uid || null, userEmail: user?.email || null });
      setCurrentUser(user);
      
      if (user) {
        try {
          await loadUserProfile(user);
          console.log('User profile loaded successfully');
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
      console.log('Auth loading state set to false');
    });

    // Failsafe: If loading takes too long, force it to false
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    refreshUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};