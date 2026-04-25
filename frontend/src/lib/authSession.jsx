/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { api, hasFrontendAuthCredential } from './api'

const AuthSessionContext = createContext(null)

const initialState = {
  status: 'idle',
  preferences: null,
  groups: [],
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
      const [preferences, groups] = await Promise.all([api.getPreferences(), api.listGroups()])
      const nextState = {
        status: 'ready',
        preferences,
        groups,
        error: '',
      }
      setSessionState(nextState)
      return nextState
    })()
      .catch((caught) => {
        const nextState = {
          status: 'error',
          preferences: null,
          groups: [],
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

  const value = useMemo(
    () => ({
      ...state,
      clearSession,
      ensureSession,
      refreshSession,
    }),
    [clearSession, ensureSession, refreshSession, state],
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
