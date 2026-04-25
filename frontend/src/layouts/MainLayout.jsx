import { Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
