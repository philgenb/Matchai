import { firebaseConfigured, getFirebaseIdToken, getStoredFirebaseToken, signOutOfFirebase } from './firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const DEV_EMAIL_KEY = 'matchai:devEmail'

export function setDevEmail(email) {
  if (email) {
    window.localStorage.setItem(DEV_EMAIL_KEY, email)
  }
}

export function getDevEmail() {
  return window.localStorage.getItem(DEV_EMAIL_KEY) || 'johannes@gmail.com'
}

export async function signOutFrontend() {
  window.localStorage.removeItem(DEV_EMAIL_KEY)
  await signOutOfFirebase()
}

export function hasFrontendAuthCredential() {
  if (firebaseConfigured) {
    return Boolean(getStoredFirebaseToken())
  }

  return Boolean(window.localStorage.getItem(DEV_EMAIL_KEY))
}

function endpoint(path) {
  if (API_BASE_URL.endsWith('/') && path.startsWith('/')) {
    return `${API_BASE_URL.slice(0, -1)}${path}`
  }

  return `${API_BASE_URL}${path}`
}

async function request(path, options = {}) {
  const firebaseToken = await getFirebaseIdToken()
  if (firebaseConfigured && !firebaseToken) {
    throw new Error('Please sign in before continuing.')
  }

  const authToken = firebaseToken || `dev:${getDevEmail()}`

  const response = await fetch(endpoint(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response
      .json()
      .then((body) => body.detail || response.statusText)
      .catch(() => response.statusText)
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  me: () => request('/me'),
  getPreferences: () => request('/users/me/preferences'),
  savePreferences: (preferences) =>
    request('/users/me/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    }),
  getCalendarStatus: () => request('/users/me/calendar/status'),
  connectCalendar: () => request('/users/me/calendar/connect'),
  listGroups: () => request('/groups'),
  createGroup: (group) =>
    request('/groups', {
      method: 'POST',
      body: JSON.stringify(group),
    }),
  getGroup: (groupId) => request(`/groups/${groupId}`),
  joinGroupById: (groupId) =>
    request(`/groups/${groupId}/join`, {
      method: 'POST',
    }),
  scheduleGroup: (groupId) =>
    request(`/groups/${groupId}/schedule`, {
      method: 'POST',
    }),
  getProposal: (groupId) => request(`/groups/${groupId}/proposal`),
  rsvp: (proposalId, status) =>
    request(`/proposals/${proposalId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  addToCalendar: (proposalId) =>
    request(`/proposals/${proposalId}/add-to-calendar`, {
      method: 'POST',
    }),
}
