// Firebase configuration for Mediford Inquiry web app.

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
  appId: '1:24072414839:web:00aac80cd2639b6e984872'
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
