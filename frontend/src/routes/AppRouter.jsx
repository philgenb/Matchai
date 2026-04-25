import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import LandingPage from '../pages/landing/LandingPage'
import SignUpPage from '../pages/signup/SignUpPage'
import {
  CreateGroupPage,
  GroupMatchPage,
  OnboardingPage,
  WaitingForGroupMatchPage,
} from '../pages/flow/GroupFlowPages'

function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage initialMode="signup" />} />
        <Route path="/signin" element={<SignUpPage initialMode="signin" />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/groups/new" element={<CreateGroupPage />} />
        <Route path="/groups/:groupId/waiting" element={<WaitingForGroupMatchPage />} />
        <Route path="/groups/:groupId/match" element={<GroupMatchPage />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
