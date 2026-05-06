import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)        // Firestore user record (with role)
  const [authUser, setAuthUser] = useState(null) // Firebase Auth user
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAuthUser(null)
        setUser(null)
        setLoading(false)
        return
      }
      setAuthUser(fbUser)
      // Subscribe to user doc so role changes propagate live
      const ref = doc(db, 'users', fbUser.uid)
      const userUnsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setUser({ uid: fbUser.uid, ...snap.data() })
        } else {
          setUser({ uid: fbUser.uid, name: fbUser.displayName || fbUser.email, role: 'SALES', email: fbUser.email })
        }
        setLoading(false)
      }, (err) => {
        console.error('User doc subscription error', err)
        setLoading(false)
      })
      return () => userUnsub()
    })
    return () => unsub()
  }, [])

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }
  const logout = async () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, authUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
