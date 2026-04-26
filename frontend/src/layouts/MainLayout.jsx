import { Outlet } from 'react-router-dom'
import AccessibilityWidget from '../components/accessibility/AccessibilityWidget'

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <Outlet />
      </main>
      <AccessibilityWidget />
    </div>
  )
}

export default MainLayout
