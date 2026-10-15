import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiActivity, FiCloudRain, FiFeather, FiMapPin, FiRefreshCw, FiUsers,
} from 'react-icons/fi'
import api, { getErrorMessage } from '../lib/api'

const dateTime = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
const dateOnly = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric',
})
const activityNames = {
  planting: 'Penanaman',
  fertilizing: 'Pemupukan',
  irrigation: 'Pengairan',
  harvest: 'Panen',
}
const roleNames = { admin: 'Administrator', farmer: 'Petani' }

function Heading({ title, description, action }) {
  return (
    <div className="page-heading">
      <div><span className="eyebrow">ADMINISTRATOR</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  )
}

function Loading() {
  return <div className="loading-state"><span className="spinner" />Memuat data...</div>
}

function Empty({ children = 'Belum ada data untuk ditampilkan.' }) {
  return <div className="admin-empty">{children}</div>
}

function useAdminData(path, initialData) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    api.get(path)
      .then(({ data: responseData }) => {
        if (!active) return
        setData(responseData)
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [path, attempt])

  return {
    data,
    loading,
    error,
    retry: () => {
      setLoading(true)
      setAttempt((current) => current + 1)
    },
  }
}

function RequestError({ message, retry }) {
  return (
    <div className="notice" role="alert">
      <span>{message}</span>
      <button className="button button-quiet" onClick={retry}><FiRefreshCw /> Coba lagi</button>
    </div>
  )
}

export function AdminOverview() {
  const { data, loading, error, retry } = useAdminData('/admin/stats', {})
  const stats = [
    { label: 'Total pengguna', value: data.totalUsers, hint: 'semua akun terdaftar', icon: FiUsers, tone: 'green' },
    { label: 'Total petani', value: data.totalFarmers, hint: 'akun dengan peran petani', icon: FiFeather, tone: 'blue' },
    { label: 'Total lahan', value: data.totalFarms, hint: 'seluruh lahan terdaftar', icon: FiMapPin, tone: 'yellow' },
    { label: 'Total aktivitas', value: data.totalActivities, hint: 'log aktivitas tercatat', icon: FiActivity, tone: 'purple' },
  ]

  return (
    <>
      <Heading title="Ringkasan admin" description="Pantau data pengguna, lahan, dan aktivitas pertanian TerraSmart." />
      {error && <RequestError message={error} retry={retry} />}
      <div className="stats-grid admin-stats-grid">
        {stats.map(({ label, value, hint, icon: Icon, tone }) => (
          <article className={`stat-card stat-${tone}`} key={label}>
            <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon /></span></div>
            <strong>{loading ? '—' : Number(value || 0).toLocaleString('id-ID')}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </div>
      {!loading && !error && (
        <section className="panel admin-shortcuts">
          <span className="eyebrow">PENGELOLAAN SISTEM</span>
          <h2>Jelajahi data TerraSmart</h2>
          <p>Data berikut mencakup seluruh pengguna, seluruh lahan, dan semua log aktivitas dari semua petani.</p>
          <div>
            <Link className="button button-secondary" to="/admin/users"><FiUsers /> Kelola pengguna</Link>
            <Link className="button button-secondary" to="/admin/farms"><FiMapPin /> Lihat semua lahan</Link>
            <Link className="button button-secondary" to="/admin/activities"><FiActivity /> Lihat aktivitas</Link>
          </div>
        </section>
      )}
      {loading && <section className="panel"><Loading /></section>}
    </>
  )
}

export function AdminUsers() {
  const { data: users, loading, error, retry } = useAdminData('/admin/users', [])
  const [query, setQuery] = useState('')
  const search = query.trim().toLocaleLowerCase('id-ID')
  const visibleUsers = users.filter((user) =>
    [user.name, user.email, user.phone, roleNames[user.role] || user.role]
      .some((value) => value?.toLocaleLowerCase('id-ID').includes(search)),
  )

  return (
    <>
      <Heading title="Kelola pengguna" description="Daftar semua akun yang terdaftar beserta peran dan informasi kontaknya." />
      {error && <RequestError message={error} retry={retry} />}
      <section className="panel table-panel admin-table-panel">
        <div className="table-toolbar">
          <div><h2>Semua pengguna</h2><span>{loading ? 'Memuat...' : `${users.length} akun terdaftar`}</span></div>
          <input className="admin-search" type="search" aria-label="Cari pengguna" placeholder="Cari nama, email, atau peran" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        {loading ? <Loading /> : visibleUsers.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>NAMA</th><th>EMAIL</th><th>TELEPON</th><th>PERAN</th><th>TERDAFTAR</th></tr></thead>
              <tbody>{visibleUsers.map((user) => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email || '—'}</td>
                  <td>{user.phone || '—'}</td>
                  <td><span className={`admin-role role-${user.role}`}>{roleNames[user.role] || user.role}</span></td>
                  <td>{user.createdAt ? dateOnly.format(new Date(user.createdAt)) : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <Empty>{query ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna terdaftar.'}</Empty>}
      </section>
    </>
  )
}

function useFarmForecasts(farms) {
  const [forecasts, setForecasts] = useState({})

  useEffect(() => {
    if (!farms.length) return undefined
    const controller = new AbortController()
    let active = true

    Promise.all(farms.map(async (farm) => {
      const latitude = Number(farm.latitude)
      const longitude = Number(farm.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return [farm._id, { error: 'Koordinat lahan tidak tersedia.' }]
      }
      try {
        const { data: result } = await api.get('/weather/forecast', {
          params: { latitude, longitude },
          signal: controller.signal,
        })
        const current = result?.current
        const day = result?.forecast?.forecastday?.[0]?.day
        const valid = current && day
          && Number.isFinite(current.temp_c)
          && Number.isFinite(day.mintemp_c)
          && Number.isFinite(day.maxtemp_c)
          && Number.isFinite(day.totalprecip_mm)
          && typeof current.condition?.text === 'string'
          && typeof day.condition?.text === 'string'
        if (!valid) throw new Error('Data prakiraan cuaca tidak tersedia atau tidak valid.')
        return [farm._id, { current, day }]
      } catch (forecastError) {
        if (forecastError.name === 'AbortError') return [farm._id, null]
        return [farm._id, { error: forecastError.message || 'Prakiraan cuaca tidak dapat dimuat.' }]
      }
    })).then((results) => {
      if (active) setForecasts(Object.fromEntries(results.filter(([, value]) => value)))
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [farms])

  return forecasts
}

function FarmWeather({ forecast }) {
  if (!forecast) return <span className="farm-weather-muted">Memuat prakiraan...</span>
  if (forecast.error) return <span className="farm-weather-error">{forecast.error}</span>
  const { current, day } = forecast
  return (
    <span className="farm-weather">
      <FiCloudRain />
      <span><strong>{Math.round(current.temp_c)}°C · {current.condition.text}</strong>
        <small>Hari ini {Math.round(day.mintemp_c)}°–{Math.round(day.maxtemp_c)}°C · Hujan {day.totalprecip_mm} mm</small></span>
    </span>
  )
}

export function AdminFarms() {
  const { data: farms, loading, error, retry } = useAdminData('/admin/farms', [])
  const forecasts = useFarmForecasts(farms)

  return (
    <>
      <Heading title="Semua lahan" description="Lahan dari seluruh petani, lengkap dengan lokasi dan informasi pemilik." />
      {error && <RequestError message={error} retry={retry} />}
      <section className="panel table-panel admin-table-panel">
        <div className="table-toolbar"><div><h2>Daftar lahan</h2><span>{loading ? 'Memuat...' : `${farms.length} lahan terdaftar`}</span></div></div>
        {loading ? <Loading /> : farms.length ? (
          <div className="table-scroll">
            <table className="admin-farms-table">
              <thead><tr><th>LAHAN</th><th>PEMILIK</th><th>LOKASI</th><th>KOORDINAT</th><th>LUAS</th><th>PRAKIRAAN CUACA</th></tr></thead>
              <tbody>{farms.map((farm) => (
                <tr key={farm._id}>
                  <td><strong>{farm.name}</strong><small className="table-subline">{farm.cropType || 'Tanaman belum ditentukan'}</small></td>
                  <td><strong>{farm.owner?.name || 'Pemilik tidak tersedia'}</strong><small className="table-subline">{farm.owner?.email || farm.owner?.phone || '—'}</small></td>
                  <td>{farm.locationName || 'Lokasi tidak disebutkan'}</td>
                  <td>{farm.latitude}, {farm.longitude}</td>
                  <td>{Number(farm.area).toLocaleString('id-ID')} ha</td>
                  <td><FarmWeather forecast={forecasts[farm._id]} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <Empty>Belum ada lahan terdaftar.</Empty>}
      </section>
      <p className="admin-weather-source">Prakiraan cuaca otomatis berdasarkan koordinat lahan dari <a href="https://www.weatherapi.com/" target="_blank" rel="noreferrer">WeatherAPI.com</a>.</p>
    </>
  )
}

export function AdminActivities() {
  const { data: activities, loading, error, retry } = useAdminData('/admin/activities', [])

  return (
    <>
      <Heading title="Semua aktivitas" description="Log aktivitas pertanian yang tercatat di seluruh lahan dan petani." />
      {error && <RequestError message={error} retry={retry} />}
      <section className="panel table-panel admin-table-panel">
        <div className="table-toolbar"><div><h2>Log aktivitas</h2><span>{loading ? 'Memuat...' : `${activities.length} catatan aktivitas`}</span></div></div>
        {loading ? <Loading /> : activities.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>JENIS AKTIVITAS</th><th>LAHAN</th><th>PETANI</th><th>TANGGAL</th><th>CATATAN</th></tr></thead>
              <tbody>{activities.map((activity) => (
                <tr key={activity._id}>
                  <td><span className="table-type-icon"><FiActivity /></span><strong>{activityNames[activity.type] || activity.type}</strong></td>
                  <td><strong>{activity.farm?.name || 'Lahan tidak tersedia'}</strong><small className="table-subline">{activity.farm?.locationName || activity.farm?.cropType || '—'}</small></td>
                  <td>{activity.owner?.name || 'Pemilik tidak tersedia'}<small className="table-subline">{activity.owner?.email || activity.owner?.phone || ''}</small></td>
                  <td>{activity.date ? dateTime.format(new Date(activity.date)) : '—'}</td>
                  <td className="admin-notes-cell">{activity.notes || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <Empty>Belum ada aktivitas tercatat.</Empty>}
      </section>
    </>
  )
}
