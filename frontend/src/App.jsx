import AppRouter from './routes/AppRouter'
import { AuthSessionProvider } from './lib/authSession'

function App() {
  return (
    <AuthSessionProvider>
      <AppRouter />
    </AuthSessionProvider>
  )
}

export default App
