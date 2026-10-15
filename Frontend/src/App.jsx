import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import './App.css'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const FarmerDashboard = lazy(() => import('./pages/FarmerPages').then((pages) => ({ default: pages.FarmerDashboard })))
const FarmManagement = lazy(() => import('./pages/FarmerPages').then((pages) => ({ default: pages.FarmManagement })))
const ActivityLog = lazy(() => import('./pages/FarmerPages').then((pages) => ({ default: pages.ActivityLog })))
const Finance = lazy(() => import('./pages/FarmerPages').then((pages) => ({ default: pages.Finance })))
const WeatherCalendar = lazy(() => import('./pages/FarmerPages').then((pages) => ({ default: pages.WeatherCalendar })))
const Market = lazy(() => import('./pages/FarmerPages').then((pages) => ({ default: pages.Market })))
const Notifications = lazy(() => import('./pages/FarmerPages').then((pages) => ({ default: pages.Notifications })))
const AdminDashboard = lazy(() => import('./pages/FarmerPages').then((pages) => ({ default: pages.AdminDashboard })))

function RouteGuard({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-loading"><span className="spinner" /> Memvalidasi sesi...</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />
  return children
}

function RoleHome() {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-loading"><span className="spinner" /> Memuat TerraSmart...</div>
  return <Navigate to={user ? (user.role === 'admin' ? '/admin' : '/app') : '/login'} replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="auth-loading"><span className="spinner" /> Memuat halaman...</div>}>
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/app" element={<RouteGuard role="farmer"><AppLayout /></RouteGuard>}>
          <Route index element={<FarmerDashboard />} />
          <Route path="farms" element={<FarmManagement />} />
          <Route path="activities" element={<ActivityLog />} />
          <Route path="finance" element={<Finance />} />
          <Route path="weather" element={<WeatherCalendar />} />
          <Route path="market" element={<Market />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        <Route path="/admin" element={<RouteGuard role="admin"><AppLayout /></RouteGuard>}>
          <Route index element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<RoleHome />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
