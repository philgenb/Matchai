/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { api, hasFrontendAuthCredential } from './api'

const AuthSessionContext = createContext(null)

const initialState = {
  status: 'idle',
  user: null,
  isOnboarded: false,
  preferences: null,
  groups: [],
  groupsStatus: 'idle',
  error: '',
}

export function groupRoute(group) {
  if (group.status === 'proposal_found' || group.status === 'confirmed') {
    return `/groups/${group.id}/match`
  }

  return `/groups/${group.id}/waiting`
}

export function AuthSessionProvider({ children }) {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(initialState)
  const inFlightRequestRef = useRef(null)

  const setSessionState = useCallback((nextState) => {
    stateRef.current = typeof nextState === 'function' ? nextState(stateRef.current) : nextState
    setState(stateRef.current)
  }, [])

  const clearSession = useCallback(() => {
    inFlightRequestRef.current = null
    setSessionState(initialState)
  }, [setSessionState])

  const refreshSession = useCallback(async () => {
    if (!hasFrontendAuthCredential()) {
      setSessionState(initialState)
      return initialState
    }

    if (inFlightRequestRef.current) {
      return inFlightRequestRef.current
    }

    setSessionState((current) => ({ ...current, status: 'loading', error: '' }))

    inFlightRequestRef.current = (async () => {
      const user = await api.me()
      const nextState = {
        status: 'ready',
        user,
        isOnboarded: Boolean(user.onboarding_completed),
        preferences: { onboarding_completed: Boolean(user.onboarding_completed) },
        groups: [],
        groupsStatus: 'idle',
        error: '',
      }
      setSessionState(nextState)
      return nextState
    })()
      .catch((caught) => {
        const nextState = {
          status: 'error',
          user: null,
          isOnboarded: false,
          preferences: null,
          groups: [],
          groupsStatus: 'idle',
          error: caught instanceof Error ? caught.message : 'Could not load your profile.',
        }
        setSessionState(nextState)
        return nextState
      })
      .finally(() => {
        inFlightRequestRef.current = null
      })

    return inFlightRequestRef.current
  }, [setSessionState])

  const ensureSession = useCallback(async () => {
    if (!hasFrontendAuthCredential()) {
      setSessionState(initialState)
      return initialState
    }

    const currentState = stateRef.current

    if (currentState.status === 'ready') {
      return currentState
    }

    if (currentState.status === 'loading' && inFlightRequestRef.current) {
      return inFlightRequestRef.current
    }

    return refreshSession()
  }, [refreshSession, setSessionState])

  const ensureGroups = useCallback(async () => {
    if (!hasFrontendAuthCredential()) {
      setSessionState(initialState)
      return []
    }

    const session = stateRef.current.status === 'ready' ? stateRef.current : await ensureSession()
    if (session.status !== 'ready' || !session.isOnboarded) {
      return []
    }

    const currentState = stateRef.current
    if (currentState.groupsStatus === 'ready') {
      return currentState.groups
    }

    setSessionState((current) => ({ ...current, groupsStatus: 'loading', error: '' }))

    try {
      const groups = await api.listGroups()
      setSessionState((current) => ({ ...current, groups, groupsStatus: 'ready', error: '' }))
      return groups
    } catch (caught) {
      setSessionState((current) => ({
        ...current,
        groups: [],
        groupsStatus: 'error',
        error: caught instanceof Error ? caught.message : 'Could not load your groups.',
      }))
      return []
    }
  }, [ensureSession, setSessionState])

  const value = useMemo(
    () => ({
      ...state,
      clearSession,
      ensureGroups,
      ensureSession,
      refreshSession,
    }),
    [clearSession, ensureGroups, ensureSession, refreshSession, state],
  )

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession() {
  const session = useContext(AuthSessionContext)
  if (!session) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider')
  }

  return session
}
