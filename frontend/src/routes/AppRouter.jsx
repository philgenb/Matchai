import { Route, Routes } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import LandingPage from '../pages/landing/components/LandingPage.tsx'
import SignUpPage from '../pages/signup/signup.tsx'

function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
