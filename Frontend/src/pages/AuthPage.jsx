import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiEye, FiEyeOff, FiFeather, FiLock, FiMail, FiPhone, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/useAuth'
import { getErrorMessage } from '../lib/api'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { user, authenticate } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', identifier: '', phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = isRegister
        ? { name: form.name.trim(), email: form.identifier.includes('@') ? form.identifier.trim() : undefined, phone: form.phone.trim() || undefined, password: form.password }
        : { identifier: form.identifier.trim(), password: form.password }
      if (isRegister && !payload.email && !payload.phone) throw new Error('Isi email atau nomor telepon untuk mendaftar.')
      const result = await authenticate(isRegister ? '/users/register' : '/users/login', payload)
      navigate(result.role === 'admin' ? '/admin' : '/app', { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link to="/login" className="brand-lockup auth-brand-lockup">
          <span className="brand-mark"><FiFeather /></span>
          <span>terra<span className="brand-accent">smart</span><small>PERTANIAN LEBIH CERDAS</small></span>
        </Link>
        <div className="auth-promo">
          <span className="eyebrow eyebrow-light">TUMBUH BERSAMA ALAM</span>
          <h1>Setiap musim<br />punya <em>peluang.</em></h1>
          <p>Kelola lahan, catat aktivitas, dan ambil keputusan yang lebih baik untuk pertanian Anda.</p>
          <div className="promo-stats"><span><b>01</b> Kenali lahan</span><span><b>02</b> Rencanakan musim</span><span><b>03</b> Tumbuh lebih baik</span></div>
        </div>
        <div className="auth-brand-foot">Dirancang untuk petani Indonesia <span>·</span> v1.0</div>
      </div>
      <section className="auth-panel">
        <div className="auth-mobile-brand"><FiFeather /> TerraSmart</div>
        <div className="auth-form-wrap">
          <span className="eyebrow">{isRegister ? 'MULAI PERJALANAN' : 'SELAMAT DATANG KEMBALI'}</span>
          <h2>{isRegister ? 'Buat akun baru' : 'Masuk ke akun Anda'}</h2>
          <p className="auth-subtitle">{isRegister ? 'Kelola pertanian Anda dalam satu tempat.' : 'Lanjutkan mengelola pertanian Anda.'}</p>
          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && <label className="field-label">Nama lengkap<div className="input-wrap"><FiUser /><input required autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Nama Anda" /></div></label>}
            <label className="field-label">{isRegister ? 'Email (opsional)' : 'Email atau nomor telepon'}<div className="input-wrap">{form.identifier.includes('@') || isRegister ? <FiMail /> : <FiPhone />}<input required={!isRegister} type="text" autoComplete={isRegister ? 'email' : 'username'} value={form.identifier} onChange={(event) => update('identifier', event.target.value)} placeholder={isRegister ? 'nama@email.com' : 'nama@email.com atau 08...'} /></div></label>
            {isRegister && <label className="field-label">Nomor telepon (opsional)<div className="input-wrap"><FiPhone /><input type="tel" autoComplete="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="08xxxxxxxxxx" /></div></label>}
            <label className="field-label">Kata sandi<div className="input-wrap"><FiLock /><input required minLength={6} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="Minimal 6 karakter" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label>
            {error && <div role="alert" className="form-error">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Mohon tunggu...' : isRegister ? 'Buat akun' : 'Masuk'} {!submitting && <FiArrowRight />}</button>
          </form>
          <p className="auth-switch">{isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Masuk' : 'Daftar sekarang'}</Link></p>
          {!isRegister && <p className="auth-security"><FiLock /> Akses aman dengan enkripsi token</p>}
        </div>
      </section>
    </div>
  )
}
