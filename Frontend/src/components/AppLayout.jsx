import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiActivity, FiBell, FiCloudRain, FiDollarSign, FiFeather, FiGrid, FiLogOut, FiMenu,
  FiPlus, FiShoppingBag, FiUsers, FiX,
} from 'react-icons/fi'
import { useAuth } from '../context/useAuth'

const farmerLinks = [
  { to: '/app', label: 'Ringkasan', icon: FiGrid, end: true },
  { to: '/app/farms', label: 'Lahan saya', icon: FiFeather },
  { to: '/app/activities', label: 'Logbook aktivitas', icon: FiActivity },
  { to: '/app/finance', label: 'Keuangan', icon: FiDollarSign },
  { to: '/app/weather', label: 'Cuaca & kalender', icon: FiCloudRain },
  { to: '/app/market', label: 'Harga pasar', icon: FiShoppingBag },
  { to: '/app/notifications', label: 'Notifikasi', icon: FiBell },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const links = isAdmin
    ? [
      { to: '/admin', label: 'Ringkasan', icon: FiGrid, end: true },
      { to: '/admin/users', label: 'Kelola pengguna', icon: FiUsers },
      { to: '/admin/farms', label: 'Semua lahan', icon: FiFeather },
      { to: '/admin/activities', label: 'Semua aktivitas', icon: FiActivity },
    ]
    : farmerLinks

  function signOut() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      {menuOpen && <button className="sidebar-scrim" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <span className="brand-mark"><FiFeather /></span>
          <span>terra<span className="brand-accent">smart</span><small>PERTANIAN LEBIH CERDAS</small></span>
          <button className="icon-button mobile-close" aria-label="Tutup menu" onClick={() => setMenuOpen(false)}><FiX /></button>
        </div>
        <div className="sidebar-label">MENU UTAMA</div>
        <nav className="side-nav" aria-label="Navigasi utama">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon /><span>{label}</span>
              {label === 'Notifikasi' && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        {!isAdmin && (
          <div className="sidebar-tip">
            <div className="tip-icon"><FiCloudRain /></div>
            <strong>Rencanakan musim</strong>
            <p>Gunakan prakiraan cuaca lahan untuk menentukan waktu tanam terbaik.</p>
            <NavLink to="/app/weather" onClick={() => setMenuOpen(false)}>Lihat kalender <span>→</span></NavLink>
          </div>
        )}
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
            <div className="user-chip-copy"><strong>{user?.name || 'Pengguna'}</strong><span>{isAdmin ? 'Administrator' : 'Petani'}</span></div>
            <button className="icon-button logout-button" aria-label="Keluar" onClick={signOut}><FiLogOut /></button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Buka menu" onClick={() => setMenuOpen(true)}><FiMenu /></button>
          <div className="topbar-context"><span className="live-indicator" /> <span>Musim tanam <b>{new Date().getFullYear()}</b></span></div>
          <div className="topbar-actions">
            {!isAdmin && <NavLink className="topbar-quicklink" to="/app/farms"><FiPlus /> Tambah lahan</NavLink>}
            <span className="topbar-divider" />
            <div className="topbar-user"><div className="avatar avatar-small">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div><span>{user?.name?.split(' ')[0] || 'Pengguna'}</span></div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="app-footer"><span>© {new Date().getFullYear()} TerraSmart</span><span>Menanam masa depan, hari ini.</span></footer>
      </div>
    </div>
  )
}
