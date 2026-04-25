import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import LandingPage from '../pages/landing/LandingPage'
import SignUpPage from '../pages/signup/SignUpPage'
import { api, hasFrontendAuthCredential } from '../lib/api'
import {
  CreateGroupPage,
  GroupMatchPage,
  OnboardingPage,
  WaitingForGroupMatchPage,
} from '../pages/flow/GroupFlowPages'

function groupRoute(group) {
  if (group.status === 'proposal_found' || group.status === 'confirmed') {
    return `/groups/${group.id}/match`
  }

  return `/groups/${group.id}/waiting`
}

function PublicOnlyRoute({ children }) {
  if (hasFrontendAuthCredential()) {
    return <Navigate to="/app" replace />
  }

  return children
}

function ProtectedRoute({ children }) {
  if (!hasFrontendAuthCredential()) {
    return <Navigate to="/" replace />
  }

  return children
}

function PreferenceGate({ children, requireCompleted }) {
  const [onboardingCompleted, setOnboardingCompleted] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    api.getPreferences()
      .then((preferences) => {
        if (!cancelled) {
          setOnboardingCompleted(Boolean(preferences.onboarding_completed))
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not load your onboarding state.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!hasFrontendAuthCredential()) {
    return <Navigate to="/" replace />
  }

  if (onboardingCompleted === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6 text-center font-['Outfit',sans-serif]">
        <p className="text-[18px] font-bold text-[#303030]">{error || 'Loading your MatchAI setup...'}</p>
      </main>
    )
  }

  if (requireCompleted && !onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  if (!requireCompleted && onboardingCompleted) {
    return <Navigate to="/app" replace />
  }

  return children
}

function ExistingGroupGate({ children }) {
  const [target, setTarget] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api.listGroups()
      .then((groups) => {
        if (cancelled) return
        setTarget(groups.length > 0 ? groupRoute(groups[0]) : '')
      })
      .catch(() => {
        if (!cancelled) {
          setTarget('')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6 text-center font-['Outfit',sans-serif]">
        <p className="text-[18px] font-bold text-[#303030]">Loading your groups...</p>
      </main>
    )
  }

  if (target) {
    return <Navigate to={target} replace />
  }

  return children
}

function AuthRedirectPage() {
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function resolveTarget() {
      if (!hasFrontendAuthCredential()) {
        setTarget('/')
        return
      }

      try {
        const [preferences, groups] = await Promise.all([api.getPreferences(), api.listGroups()])
        if (cancelled) return

        if (!preferences.onboarding_completed) {
          setTarget('/onboarding')
          return
        }

        if (groups.length > 0) {
          setTarget(groupRoute(groups[0]))
          return
        }

        setTarget('/groups/new')
      } catch (caught) {
        if (cancelled) return
        setError(caught instanceof Error ? caught.message : 'Could not load your profile.')
      }
    }

    resolveTarget()

    return () => {
      cancelled = true
    }
  }, [])

  if (target) {
    return <Navigate to={target} replace />
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6 text-center font-['Outfit',sans-serif]">
      <div>
        <p className="text-[18px] font-bold text-[#303030]">{error || 'Loading your MatchAI setup...'}</p>
        {error && <p className="mt-3 max-w-[420px] text-[14px] font-medium text-[#979797]">Please try signing in again.</p>}
      </div>
    </main>
  )
}

function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><SignUpPage initialMode="signup" /></PublicOnlyRoute>} />
        <Route path="/signin" element={<PublicOnlyRoute><SignUpPage initialMode="signin" /></PublicOnlyRoute>} />
        <Route path="/app" element={<AuthRedirectPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><PreferenceGate requireCompleted={false}><OnboardingPage /></PreferenceGate></ProtectedRoute>} />
        <Route path="/groups/new" element={<ProtectedRoute><PreferenceGate requireCompleted><ExistingGroupGate><CreateGroupPage /></ExistingGroupGate></PreferenceGate></ProtectedRoute>} />
        <Route path="/groups/:groupId/waiting" element={<ProtectedRoute><PreferenceGate requireCompleted><WaitingForGroupMatchPage /></PreferenceGate></ProtectedRoute>} />
        <Route path="/groups/:groupId/match" element={<ProtectedRoute><PreferenceGate requireCompleted><GroupMatchPage /></PreferenceGate></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={hasFrontendAuthCredential() ? '/app' : '/'} replace />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
