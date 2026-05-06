import { useEffect, useState } from 'react'
import {
  collection, query, where, orderBy, limit, onSnapshot, doc,
  getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

// Live stream a Firestore collection.
export function useCollection(collectionName, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let q = collection(db, collectionName)
    const constraints = []
    if (options.where) {
      for (const w of options.where) constraints.push(where(...w))
    }
    if (options.orderBy) constraints.push(orderBy(...options.orderBy))
    if (options.limit) constraints.push(limit(options.limit))
    if (constraints.length > 0) q = query(q, ...constraints)

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setData(list)
      setLoading(false)
    }, (err) => {
      console.error(`useCollection(${collectionName}) error`, err)
      setError(err)
      setLoading(false)
    })

    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, JSON.stringify(options)])

  return { data, loading, error }
}

// Live stream a single document.
export function useDoc(collectionName, docId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!docId) { setLoading(false); return }
    const ref = doc(db, collectionName, docId)
    const unsub = onSnapshot(ref, (snap) => {
      setData(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    }, (err) => {
      console.error(`useDoc(${collectionName}/${docId}) error`, err)
      setLoading(false)
    })
    return () => unsub()
  }, [collectionName, docId])

  return { data, loading }
}

// CRUD helpers
export const createDoc = (collectionName, payload) =>
  addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

export const updateDocById = (collectionName, id, payload) =>
  updateDoc(doc(db, collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp()
  })

export const setDocById = (collectionName, id, payload) =>
  setDoc(doc(db, collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp()
  })

export const deleteDocById = (collectionName, id) =>
  deleteDoc(doc(db, collectionName, id))

// Subcollection helpers
export const useSubcollection = (parentColl, parentId, subColl, opts = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!parentId) { setLoading(false); return }
    let q = collection(db, parentColl, parentId, subColl)
    const constraints = []
    if (opts.orderBy) constraints.push(orderBy(...opts.orderBy))
    if (opts.limit) constraints.push(limit(opts.limit))
    if (constraints.length > 0) q = query(q, ...constraints)
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error(`useSubcollection error`, err)
      setLoading(false)
    })
    return () => unsub()
  }, [parentColl, parentId, subColl, JSON.stringify(opts)])
  return { data, loading }
}

export const addSubdoc = (parentColl, parentId, subColl, payload) =>
  addDoc(collection(db, parentColl, parentId, subColl), {
    ...payload,
    createdAt: serverTimestamp()
  })

// Generate next sequential code (LEAD-2026-0001 / TND-2026-0001)
export const generateCode = async (collectionName, prefix) => {
  const year = new Date().getFullYear()
  const yearStart = new Date(year, 0, 1)
  const q = query(
    collection(db, collectionName),
    where('createdAt', '>=', Timestamp.fromDate(yearStart))
  )
  const snap = await getDocs(q)
  return `${prefix}-${year}-${String(snap.size + 1).padStart(4, '0')}`
}
