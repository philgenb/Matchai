import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  getAuth,
  onIdTokenChanged,
  setPersistence,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
)

export const firebaseApp = firebaseConfigured ? initializeApp(firebaseConfig) : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const googleProvider = new GoogleAuthProvider()
export const FIREBASE_TOKEN_KEY = 'matchai:firebaseIdToken'
const expectedProjectId = firebaseConfig.projectId

if (auth) {
  setPersistence(auth, browserLocalPersistence)
  onIdTokenChanged(auth, async (user) => {
    if (!user) {
      clearStoredFirebaseToken()
      return
    }

    await persistFirebaseToken(user)
  })
}

export function clearStoredFirebaseToken() {
  window.sessionStorage.removeItem(FIREBASE_TOKEN_KEY)
  window.localStorage.removeItem(FIREBASE_TOKEN_KEY)
}

export function getStoredFirebaseToken() {
  const token = window.sessionStorage.getItem(FIREBASE_TOKEN_KEY) || window.localStorage.getItem(FIREBASE_TOKEN_KEY)
  if (!token || !tokenMatchesProject(token)) {
    clearStoredFirebaseToken()
    return null
  }

  return token
}

export async function persistFirebaseToken(user = auth?.currentUser) {
  if (!user) {
    clearStoredFirebaseToken()
    return null
  }

  const token = await user.getIdToken(true)
  window.sessionStorage.setItem(FIREBASE_TOKEN_KEY, token)
  window.localStorage.setItem(FIREBASE_TOKEN_KEY, token)
  return token
}

export async function getFirebaseIdToken() {
  if (auth?.currentUser) {
    return persistFirebaseToken(auth.currentUser)
  }

  return getStoredFirebaseToken()
}

function tokenMatchesProject(token) {
  if (!expectedProjectId) {
    return false
  }

  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded.aud === expectedProjectId || decoded.iss === `https://securetoken.google.com/${expectedProjectId}`
  } catch {
    return false
  }
}

export async function signInWithGoogle() {
  if (!auth) {
    return null
  }

  return signInWithPopup(auth, googleProvider)
}

export async function signInWithEmail(email, password) {
  if (!auth) {
    return null
  }

  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmail({ name, email, password }) {
  if (!auth) {
    return null
  }

  const credentials = await createUserWithEmailAndPassword(auth, email, password)
  if (name) {
    await updateProfile(credentials.user, { displayName: name })
  }
  return credentials
}

export async function signOutOfFirebase() {
  if (!auth) {
    clearStoredFirebaseToken()
    return
  }

  await signOut(auth)
  clearStoredFirebaseToken()
}
