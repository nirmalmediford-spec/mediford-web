// Firebase configuration for Mediford Inquiry web app.
// Uses the SAME project as the Android app — same auth, same data.
//
// User must add a Web App in Firebase Console to get the appId.
// Steps shown in DEPLOY-WEB-GUIDE.md.

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyA5cOTC4DkSCy_npy7YMcGWAxAVYWoj8Lo',
  authDomain: 'mediford-inquiry.firebaseapp.com',
  projectId: 'mediford-inquiry',
  storageBucket: 'mediford-inquiry.firebasestorage.app',
  messagingSenderId: '24072414839',
  appId: '__REPLACE_WITH_WEB_APP_ID__'
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
