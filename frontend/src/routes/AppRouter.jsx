import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import LandingPage from '../pages/landing/LandingPage'
import SignUpPage from '../pages/signup/SignUpPage'
import { api, hasFrontendAuthCredential } from '../lib/api'
import { groupRoute, useAuthSession } from '../lib/authSession'
import {
  CreateGroupPage,
  GroupMatchPage,
  OnboardingPage,
  WaitingForGroupMatchPage,
} from '../pages/flow/GroupFlowPages'

const PENDING_JOIN_GROUP_ID_KEY = 'matchai:pendingJoinGroupId'

function PublicOnlyRoute({ children }) {
  if (hasFrontendAuthCredential()) {
    return <Navigate to="/app" replace />
  }

  return children
}

function LoadingScreen({ message = 'Loading...', error = '' }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6 text-center font-['Outfit',sans-serif]">
      <div>
        {error ? (
          <p className="text-[18px] font-bold text-[#303030]">{error}</p>
        ) : (
          <div role="status" aria-label={message} className="mx-auto h-[54px] w-[54px] animate-spin rounded-full border-[5px] border-[#e4e4e4] border-t-[var(--color-primary)]" />
        )}
        {error && <p className="mt-3 max-w-[420px] text-[14px] font-medium text-[#979797]">Please try signing in again.</p>}
      </div>
    </main>
  )
}

function homeTarget(groups) {
  return groups.length > 0 ? groupRoute(groups[0]) : '/groups/new'
}

function AppGate({ children, onboarding = 'completed', blockExistingGroup = false }) {
  const { ensureGroups, ensureSession, error, groups, groupsStatus, isOnboarded, status } = useAuthSession()

  useEffect(() => {
    ensureSession()
  }, [ensureSession])

  useEffect(() => {
    if (status === 'ready' && isOnboarded && (blockExistingGroup || onboarding === 'incomplete')) {
      ensureGroups()
    }
  }, [blockExistingGroup, ensureGroups, isOnboarded, onboarding, status])

  if (!hasFrontendAuthCredential()) {
    return <Navigate to="/" replace />
  }

  if (status !== 'ready') {
    return <LoadingScreen error={status === 'error' ? error : ''} />
  }

  if (onboarding === 'completed' && !isOnboarded) {
    return <Navigate to="/onboarding" replace />
  }

  if (onboarding === 'incomplete' && isOnboarded) {
    if (groupsStatus !== 'ready') {
      return <LoadingScreen error={groupsStatus === 'error' ? error : ''} />
    }

    return <Navigate to={homeTarget(groups)} replace />
  }

  if (blockExistingGroup && groupsStatus !== 'ready') {
    return <LoadingScreen error={groupsStatus === 'error' ? error : ''} />
  }

  if (blockExistingGroup && groups.length > 0) {
    return <Navigate to={groupRoute(groups[0])} replace />
  }

  return children
}

function AuthRedirectPage() {
  const { ensureGroups, ensureSession, error, groups, groupsStatus, isOnboarded, refreshSession, status } = useAuthSession()
  const [joinTarget, setJoinTarget] = useState('')
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    ensureSession()
  }, [ensureSession])

  useEffect(() => {
    if (status === 'ready' && isOnboarded && !window.localStorage.getItem(PENDING_JOIN_GROUP_ID_KEY)) {
      ensureGroups()
    }
  }, [ensureGroups, isOnboarded, status])

  useEffect(() => {
    if (status !== 'ready' || joinTarget) return

    const pendingGroupId = window.localStorage.getItem(PENDING_JOIN_GROUP_ID_KEY)
    if (!pendingGroupId) return

    let cancelled = false

    async function joinPendingGroup() {
      try {
        const group = await api.joinGroupById(pendingGroupId)
        window.localStorage.removeItem(PENDING_JOIN_GROUP_ID_KEY)
        window.localStorage.setItem('matchai:lastGroupId', group.id)
        const nextSession = await refreshSession()
        if (cancelled) return

        setJoinTarget(nextSession.isOnboarded ? `/groups/${group.id}/waiting` : '/onboarding')
      } catch (caught) {
        if (cancelled) return
        setJoinError(caught instanceof Error ? caught.message : 'Could not join this group.')
        window.localStorage.removeItem(PENDING_JOIN_GROUP_ID_KEY)
      }
    }

    joinPendingGroup()

    return () => {
      cancelled = true
    }
  }, [joinTarget, refreshSession, status])

  if (!hasFrontendAuthCredential()) {
    return <Navigate to="/" replace />
  }

  if (joinTarget) {
    return <Navigate to={joinTarget} replace />
  }

  if (window.localStorage.getItem(PENDING_JOIN_GROUP_ID_KEY)) {
    return <LoadingScreen message="Joining your group..." error={joinError} />
  }

  if (status !== 'ready') {
    return <LoadingScreen error={status === 'error' ? error : ''} />
  }

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />
  }

  if (groupsStatus !== 'ready') {
    return <LoadingScreen error={groupsStatus === 'error' ? error : ''} />
  }

  return <Navigate to={homeTarget(groups)} replace />
}

function JoinGroupPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const { refreshSession } = useAuthSession()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!groupId) return

    if (!hasFrontendAuthCredential()) {
      window.localStorage.setItem(PENDING_JOIN_GROUP_ID_KEY, groupId)
      navigate('/signup', { replace: true })
      return
    }

    let cancelled = false

    async function joinGroup() {
      try {
        const group = await api.joinGroupById(groupId)
        window.localStorage.setItem('matchai:lastGroupId', group.id)
        const nextSession = await refreshSession()
        if (cancelled) return

        navigate(nextSession.isOnboarded ? `/groups/${group.id}/waiting` : '/onboarding', { replace: true })
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not join this group.')
        }
      }
    }

    joinGroup()

    return () => {
      cancelled = true
    }
  }, [groupId, navigate, refreshSession])

  return <LoadingScreen message="Joining your group..." error={error} />
}

function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><SignUpPage initialMode="signup" /></PublicOnlyRoute>} />
        <Route path="/signin" element={<PublicOnlyRoute><SignUpPage initialMode="signin" /></PublicOnlyRoute>} />
        <Route path="/app" element={<AuthRedirectPage />} />
        <Route path="/groups/join/:groupId" element={<JoinGroupPage />} />
        <Route path="/onboarding" element={<AppGate onboarding="incomplete"><OnboardingPage /></AppGate>} />
        <Route path="/groups/new" element={<AppGate blockExistingGroup><CreateGroupPage /></AppGate>} />
        <Route path="/groups/:groupId/waiting" element={<AppGate><WaitingForGroupMatchPage /></AppGate>} />
        <Route path="/groups/:groupId/match" element={<AppGate><GroupMatchPage /></AppGate>} />
        <Route path="*" element={<Navigate to={hasFrontendAuthCredential() ? '/app' : '/'} replace />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
