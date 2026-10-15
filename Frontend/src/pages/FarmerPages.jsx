import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiActivity, FiArrowDownRight, FiArrowRight, FiArrowUpRight, FiCalendar, FiCheck,
  FiCloudRain, FiDroplet, FiEdit2, FiFeather, FiMapPin, FiPlus,
  FiMinus, FiRefreshCw, FiTrash2, FiTrendingUp, FiWind, FiX,
} from 'react-icons/fi'
import crops from '../data/crops.json'
import api, { getErrorMessage } from '../lib/api'
import FarmLocationPicker from '../components/FarmLocationPicker'

const ProfitChart = lazy(() => import('./ProfitChart'))
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })
const dateLabel = (date) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
const shortDate = (date) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(date))
const cropForName = (name = '') => crops.find((crop) => name.toLowerCase().includes(crop.name.toLowerCase())) || crops[0]
function Heading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

function Notice({ children, tone = 'error', onClose }) {
  if (!children) return null
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}{onClose && <button className="icon-button" aria-label="Tutup" onClick={onClose}><FiX /></button>}</div>
}

function Loading({ label = 'Memuat data...' }) {
  return <div className="loading-state"><span className="spinner" />{label}</div>
}

function Empty({ icon: Icon = FiFeather, title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon /></span><h3>{title}</h3><p>{text}</p>{action}</div>
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Tutup"><FiX /></button></header>{children}</section></div>
}

function useFarms() {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    api.get('/farms')
      .then(({ data }) => {
        if (!active) return
        if (!Array.isArray(data)) throw new Error('Respons daftar lahan tidak valid.')
        setFarms(data)
        setError('')
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [attempt])
  const retry = useCallback(() => {
    setLoading(true)
    setAttempt((current) => current + 1)
  }, [])
  return { farms, setFarms, loading, error, setError, retry }
}

function StatCard({ label, value, hint, icon: Icon, tone = 'green' }) {
  return <article className={`stat-card stat-${tone}`}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon /></span></div><strong>{value}</strong><small>{hint}</small></article>
}

export function FarmerDashboard() {
  const { farms, loading: farmsLoading } = useFarms()
  const [activities, setActivities] = useState([])
  const [summaries, setSummaries] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/transactions/summary'), api.get('/activities')])
      .then(([summary, activity]) => {
        setSummaries(summary.data)
        setActivities(activity.data)
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false))
  }, [])

  const income = summaries.reduce((sum, season) => sum + season.totalIncome, 0)
  const cost = summaries.reduce((sum, season) => sum + season.totalCost, 0)
  const chartData = [...summaries].sort((a, b) => a.season.localeCompare(b.season)).map((season) => ({ season: season.season.replace(/^\d{4}-/, ''), profit: season.profit }))

  return (
    <>
      <Heading eyebrow="DASHBOARD PETANI" title="Selamat datang di lahan Anda" description="Pantau perkembangan pertanian dan rencanakan langkah berikutnya." action={<Link className="button button-primary" to="/app/farms"><FiPlus /> Tambah lahan</Link>} />
      <Notice>{error}</Notice>
      <div className="stats-grid">
        <StatCard label="Total lahan" value={farmsLoading ? '—' : farms.length} hint="lahan terdaftar" icon={FiMapPin} />
        <StatCard label="Total luas" value={farmsLoading ? '—' : `${number.format(farms.reduce((sum, farm) => sum + Number(farm.area), 0))} ha`} hint="dari seluruh lahan" icon={FiFeather} tone="blue" />
        <StatCard label="Pendapatan" value={loading ? '—' : currency.format(income)} hint="akumulasi semua musim" icon={FiArrowUpRight} tone="yellow" />
        <StatCard label="Laba bersih" value={loading ? '—' : currency.format(income - cost)} hint="pendapatan dikurangi biaya" icon={FiTrendingUp} tone="purple" />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading"><div><span className="eyebrow">KINERJA USAHA</span><h2>Laba bersih per musim</h2></div><span className="panel-chip"><FiTrendingUp /> Analitik</span></div>
          {loading ? <Loading /> : chartData.length ? <Suspense fallback={<Loading label="Memuat grafik..." />}><ProfitChart data={chartData} /></Suspense> : <Empty icon={FiTrendingUp} title="Belum ada data keuangan" text="Catat transaksi untuk melihat laba bersih per musim." action={<Link className="text-link" to="/app/finance">Buka keuangan <FiArrowRight /></Link>} />}
        </section>
        <section className="panel farm-preview">
          <div className="panel-heading"><div><span className="eyebrow">LAHAN ANDA</span><h2>Ringkasan lahan</h2></div><Link to="/app/farms" className="text-link">Semua <FiArrowRight /></Link></div>
          {farmsLoading ? <Loading /> : farms.length ? <div className="mini-farm-list">{farms.slice(0, 4).map((farm) => <div className="mini-farm" key={farm._id}><span className="mini-farm-icon"><FiFeather /></span><div><strong>{farm.name}</strong><span>{farm.cropType} · {number.format(farm.area)} ha</span></div><Link to="/app/weather" aria-label={`Cuaca lahan ${farm.name}`}><FiArrowRight /></Link></div>)}</div> : <Empty title="Belum ada lahan" text="Tambahkan lahan pertama Anda untuk memulai." action={<Link className="button button-secondary" to="/app/farms"><FiPlus /> Tambah lahan</Link>} />}
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading"><div><span className="eyebrow">AKTIVITAS TERBARU</span><h2>Catatan aktivitas</h2></div><Link to="/app/activities" className="text-link">Lihat logbook <FiArrowRight /></Link></div>
        {loading ? <Loading /> : activities.length ? <div className="activity-feed">{activities.slice(0, 4).map((activity) => <div className="feed-row" key={activity._id}><span className="feed-icon"><FiActivity /></span><div className="feed-main"><strong>{activityTitle(activity.type)}</strong><span>{activity.farm?.name || 'Lahan'}{activity.notes ? ` · ${activity.notes}` : ''}</span></div><time>{shortDate(activity.date)}</time></div>)}</div> : <p className="muted-copy">Belum ada aktivitas. Catat kegiatan budidaya melalui logbook.</p>}
      </section>
      {!farmsLoading && farms.length === 0 && <div className="welcome-callout"><div><span className="eyebrow">LANGKAH PERTAMA</span><h2>Mulai dengan mendaftarkan lahan</h2><p>Masukkan luas dan koordinat lahan untuk mendapatkan pengelolaan dan prakiraan cuaca yang relevan.</p></div><Link className="button button-primary" to="/app/farms">Daftarkan lahan <FiArrowRight /></Link></div>}
    </>
  )
}

export function FarmManagement() {
  const { farms, setFarms, loading, error, setError } = useFarms()
  const [editing, setEditing] = useState(null)
  const [farmLocation, setFarmLocation] = useState({ latitude: '', longitude: '', locationName: '' })
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  function openFarmForm(farm = {}) {
    setFarmLocation({
      latitude: farm.latitude ?? '',
      longitude: farm.longitude ?? '',
      locationName: farm.locationName || '',
    })
    setEditing(farm)
  }

  async function saveFarm(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      name: form.get('name').trim(), cropType: form.get('cropType').trim(),
      locationName: farmLocation.locationName.trim(),
      area: Number(form.get('area')),
      latitude: Number(farmLocation.latitude),
      longitude: Number(farmLocation.longitude),
    }
    if (farmLocation.latitude === '' || farmLocation.longitude === ''
      || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)
      || payload.latitude < -90 || payload.latitude > 90
      || payload.longitude < -180 || payload.longitude > 180) {
      setError('Masukkan koordinat yang valid atau pilih lokasi melalui peta sebelum menyimpan lahan.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (editing?._id) {
        const { data } = await api.put(`/farms/${editing._id}`, payload)
        setFarms((current) => current.map((farm) => farm._id === data._id ? data : farm))
      } else {
        const { data } = await api.post('/farms', payload)
        setFarms((current) => [data, ...current])
      }
      setEditing(null)
      setNotice(editing?._id ? 'Perubahan lahan berhasil disimpan.' : 'Lahan berhasil ditambahkan.')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  async function removeFarm(farm) {
    if (!window.confirm(`Hapus lahan "${farm.name}"?`)) return
    try {
      await api.delete(`/farms/${farm._id}`)
      setFarms((current) => current.filter((item) => item._id !== farm._id))
      setNotice('Lahan berhasil dihapus.')
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  return (
    <>
      <Heading eyebrow="MANAJEMEN LAHAN" title="Lahan saya" description="Kelola data dan titik koordinat setiap lahan pertanian." action={<button className="button button-primary" onClick={() => openFarmForm()}><FiPlus /> Tambah lahan</button>} />
      <Notice>{error}</Notice><Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
      {loading ? <Loading /> : farms.length ? <div className="farm-card-grid">{farms.map((farm) => <article className="farm-card" key={farm._id}><div className="farm-card-art"><span className="farm-art-sun" /><span className="farm-art-hill hill-one" /><span className="farm-art-hill hill-two" /><span className="farm-art-leaf"><FiFeather /></span><div className="farm-card-actions"><button className="icon-button" aria-label={`Edit ${farm.name}`} onClick={() => openFarmForm(farm)}><FiEdit2 /></button><button className="icon-button danger-icon" aria-label={`Hapus ${farm.name}`} onClick={() => removeFarm(farm)}><FiTrash2 /></button></div></div><div className="farm-card-body"><div className="farm-card-type">{farm.cropType}</div><h2>{farm.name}</h2><p><FiMapPin /> {farm.locationName || `${farm.latitude}, ${farm.longitude}`}</p><div className="farm-card-meta"><span><small>LUAS LAHAN</small><strong>{number.format(farm.area)} ha</strong></span><span><small>KOORDINAT</small><strong>{Number(farm.latitude).toFixed(4)}, {Number(farm.longitude).toFixed(4)}</strong></span></div><Link to="/app/weather" className="text-link">Lihat cuaca lahan <FiArrowRight /></Link></div></article>)}</div> : <section className="panel"><Empty title="Belum ada lahan terdaftar" text="Tambahkan lahan untuk mulai mencatat aktivitas dan memantau cuacanya." action={<button className="button button-primary" onClick={() => openFarmForm()}><FiPlus /> Tambah lahan</button>} /></section>}
      {editing && <Modal title={editing._id ? 'Edit data lahan' : 'Tambah lahan baru'} onClose={() => setEditing(null)}>
        <form className="modal-form" onSubmit={saveFarm}>
          <label className="field-label">Nama lahan<input name="name" required defaultValue={editing.name || ''} placeholder="Contoh: Sawah Utara" /></label>
          <div className="form-grid">
            <label className="field-label">Jenis tanaman<input name="cropType" required defaultValue={editing.cropType || ''} placeholder="Contoh: Padi" /></label>
            <label className="field-label">Luas (hektare)<input name="area" type="number" min="0.01" step="0.01" required defaultValue={editing.area || ''} placeholder="1.5" /></label>
          </div>
          <label className="field-label">Nama lokasi
            <input name="locationName" value={farmLocation.locationName} onChange={(event) => setFarmLocation((current) => ({ ...current, locationName: event.target.value }))} placeholder="Contoh: Sleman, Yogyakarta" />
          </label>
          <FarmLocationPicker key={editing._id || 'new-farm'} initialLocation={farmLocation} onChange={setFarmLocation} />
          <div className="form-grid">
            <label className="field-label">Latitude
              <input name="latitude" type="number" step="any" min="-90" max="90" required value={farmLocation.latitude} onChange={(event) => setFarmLocation((current) => ({ ...current, latitude: event.target.value }))} placeholder="-7.2575" />
            </label>
            <label className="field-label">Longitude
              <input name="longitude" type="number" step="any" min="-180" max="180" required value={farmLocation.longitude} onChange={(event) => setFarmLocation((current) => ({ ...current, longitude: event.target.value }))} placeholder="112.7521" />
            </label>
          </div>
          <div className="modal-actions">
            <button className="button button-quiet" type="button" onClick={() => setEditing(null)}>Batal</button>
            <button className="button button-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan lahan'}</button>
          </div>
        </form>
      </Modal>}
    </>
  )
}

const ACTIVITY_TYPES = [
  { value: 'planting', label: 'Penanaman' }, { value: 'fertilizing', label: 'Pemupukan' },
  { value: 'irrigation', label: 'Pengairan' }, { value: 'harvest', label: 'Panen' },
]
const activityTitle = (type) => ACTIVITY_TYPES.find((item) => item.value === type)?.label || type

export function ActivityLog() {
  const { farms, loading: farmsLoading } = useFarms()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/activities')
      setActivities(data)
      setError('')
    } catch (loadError) { setError(getErrorMessage(loadError)) } finally { setLoading(false) }
  }, [])
  useEffect(() => {
    api.get('/activities')
      .then(({ data }) => {
        setActivities(data)
        setError('')
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false))
  }, [])

  async function createActivity(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      await api.post('/activities', { farm: form.get('farm'), type: form.get('type'), date: form.get('date'), notes: form.get('notes').trim() })
      setModalOpen(false)
      setNotice('Aktivitas berhasil dicatat.')
      refresh()
    } catch (saveError) { setError(getErrorMessage(saveError)) } finally { setSubmitting(false) }
  }

  async function removeActivity(activity) {
    if (!window.confirm('Hapus catatan aktivitas ini?')) return
    try {
      await api.delete(`/activities/${activity._id}`)
      setActivities((current) => current.filter((item) => item._id !== activity._id))
    } catch (deleteError) { setError(getErrorMessage(deleteError)) }
  }

  const displayed = filter === 'all' ? activities : activities.filter((item) => item.type === filter)
  return <>
    <Heading eyebrow="LOGBOOK AKTIVITAS" title="Catatan budidaya" description="Dokumentasikan kegiatan di setiap lahan agar perjalanan musim tanam tercatat." action={<button className="button button-primary" onClick={() => setModalOpen(true)} disabled={!farms.length}><FiPlus /> Catat aktivitas</button>} />
    <Notice>{error}</Notice><Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
    <section className="panel table-panel">
      <div className="table-toolbar"><div><h2>Semua aktivitas</h2><span>{activities.length} catatan</span></div><select aria-label="Filter aktivitas" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua jenis</option>{ACTIVITY_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
      {loading || farmsLoading ? <Loading /> : !farms.length ? <Empty title="Tambahkan lahan terlebih dahulu" text="Logbook membutuhkan lahan sebagai tempat kegiatan." action={<Link className="button button-secondary" to="/app/farms">Ke manajemen lahan <FiArrowRight /></Link>} /> : displayed.length ? <div className="table-scroll"><table><thead><tr><th>KEGIATAN</th><th>LAHAN</th><th>TANGGAL</th><th>CATATAN</th><th /></tr></thead><tbody>{displayed.map((activity) => <tr key={activity._id}><td><span className="table-type-icon"><FiActivity /></span><strong>{activityTitle(activity.type)}</strong></td><td>{activity.farm?.name || 'Lahan'}</td><td>{dateLabel(activity.date)}</td><td className="notes-cell">{activity.notes || '—'}</td><td><button className="icon-button danger-icon" aria-label="Hapus aktivitas" onClick={() => removeActivity(activity)}><FiTrash2 /></button></td></tr>)}</tbody></table></div> : <Empty title="Belum ada catatan" text="Aktivitas pertama yang dicatat akan tampil di sini." action={<button className="button button-primary" onClick={() => setModalOpen(true)}><FiPlus /> Catat aktivitas</button>} />}
    </section>
    {modalOpen && <Modal title="Catat aktivitas baru" onClose={() => setModalOpen(false)}><form className="modal-form" onSubmit={createActivity}><label className="field-label">Pilih lahan<select name="farm" required>{farms.map((farm) => <option value={farm._id} key={farm._id}>{farm.name} · {farm.cropType}</option>)}</select></label><div className="form-grid"><label className="field-label">Jenis kegiatan<select name="type">{ACTIVITY_TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}</select></label><label className="field-label">Tanggal<input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label></div><label className="field-label">Catatan (opsional)<textarea name="notes" rows="3" placeholder="Kondisi tanaman, bahan yang digunakan, dan lainnya" /></label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setModalOpen(false)}>Batal</button><button className="button button-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan catatan'}</button></div></form></Modal>}
  </>
}

export function Finance() {
  const { farms, loading: farmsLoading } = useFarms()
  const [transactions, setTransactions] = useState([])
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [tx, summary] = await Promise.all([api.get('/transactions'), api.get('/transactions/summary')])
      setTransactions(tx.data)
      setSummaries(summary.data)
      setError('')
    } catch (loadError) { setError(getErrorMessage(loadError)) } finally { setLoading(false) }
  }, [])
  useEffect(() => {
    Promise.all([api.get('/transactions'), api.get('/transactions/summary')])
      .then(([tx, summary]) => {
        setTransactions(tx.data)
        setSummaries(summary.data)
        setError('')
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false))
  }, [])

  async function addTransaction(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      await api.post('/transactions', {
        farm: form.get('farm'), type: form.get('type'), category: form.get('category').trim(),
        amount: Number(form.get('amount')), date: form.get('date'),
        season: form.get('season').trim() || `${new Date().getFullYear()}-Musim-1`,
        description: form.get('description').trim(),
      })
      setModalOpen(false)
      setNotice('Transaksi berhasil ditambahkan.')
      refresh()
    } catch (saveError) { setError(getErrorMessage(saveError)) } finally { setSubmitting(false) }
  }

  async function removeTransaction(transaction) {
    if (!window.confirm('Hapus transaksi ini?')) return
    try {
      await api.delete(`/transactions/${transaction._id}`)
      setTransactions((current) => current.filter((item) => item._id !== transaction._id))
      refresh()
    } catch (deleteError) { setError(getErrorMessage(deleteError)) }
  }

  const income = summaries.reduce((sum, item) => sum + item.totalIncome, 0)
  const costs = summaries.reduce((sum, item) => sum + item.totalCost, 0)
  const visibleTransactions = typeFilter === 'all' ? transactions : transactions.filter((item) => item.type === typeFilter)

  return <>
    <Heading eyebrow="MANAJEMEN KEUANGAN" title="Keuangan usaha tani" description="Pantau arus kas dan pahami laba bersih dari setiap musim tanam." action={<button className="button button-primary" disabled={!farms.length} onClick={() => setModalOpen(true)}><FiPlus /> Tambah transaksi</button>} />
    <Notice>{error}</Notice><Notice tone="success" onClose={() => setNotice('')}>{notice}</Notice>
    <div className="stats-grid finance-stats"><StatCard label="Total pendapatan" value={loading ? '—' : currency.format(income)} hint="semua musim" icon={FiArrowUpRight} tone="green" /><StatCard label="Total biaya" value={loading ? '—' : currency.format(costs)} hint="semua musim" icon={FiArrowDownRight} tone="yellow" /><StatCard label="Laba bersih" value={loading ? '—' : currency.format(income - costs)} hint="pendapatan − biaya" icon={FiTrendingUp} tone="purple" /></div>
    <section className="panel table-panel"><div className="table-toolbar"><div><h2>Riwayat transaksi</h2><span>{transactions.length} transaksi tercatat</span></div><select aria-label="Filter transaksi" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Semua transaksi</option><option value="income">Pendapatan</option><option value="cost">Biaya</option></select></div>
      {loading || farmsLoading ? <Loading /> : !farms.length ? <Empty title="Tambahkan lahan terlebih dahulu" text="Setiap transaksi dicatat untuk satu lahan." action={<Link className="button button-secondary" to="/app/farms">Ke manajemen lahan <FiArrowRight /></Link>} /> : visibleTransactions.length ? <div className="table-scroll"><table><thead><tr><th>JENIS</th><th>KATEGORI</th><th>LAHAN</th><th>MUSIM</th><th>TANGGAL</th><th>JUMLAH</th><th /></tr></thead><tbody>{visibleTransactions.map((tx) => <tr key={tx._id}><td><span className={`status-pill ${tx.type === 'income' ? 'status-income' : 'status-cost'}`}>{tx.type === 'income' ? 'Pendapatan' : 'Biaya'}</span></td><td><strong>{tx.category || tx.description || 'Transaksi'}</strong></td><td>{tx.farm?.name || 'Lahan'}</td><td>{tx.season}</td><td>{dateLabel(tx.date)}</td><td className={tx.type === 'income' ? 'money-positive' : ''}>{tx.type === 'cost' ? '− ' : '+ '}{currency.format(tx.amount)}</td><td><button className="icon-button danger-icon" aria-label="Hapus transaksi" onClick={() => removeTransaction(tx)}><FiTrash2 /></button></td></tr>)}</tbody></table></div> : <Empty title="Belum ada transaksi" text="Tambahkan pendapatan atau biaya untuk mulai melihat analitik keuangan." action={<button className="button button-primary" onClick={() => setModalOpen(true)}><FiPlus /> Tambah transaksi</button>} />}
    </section>
    {summaries.length > 0 && <section className="panel season-summary"><div className="panel-heading"><div><span className="eyebrow">RINGKASAN MUSIM</span><h2>Hasil per musim tanam</h2></div></div><div className="season-list">{summaries.map((season) => <div className="season-row" key={season.season}><div><FiCalendar /><strong>{season.season}</strong></div><span>Pendapatan <b>{currency.format(season.totalIncome)}</b></span><span>Biaya <b>{currency.format(season.totalCost)}</b></span><span>Laba bersih <b className={season.profit >= 0 ? 'money-positive' : 'money-negative'}>{currency.format(season.profit)}</b></span></div>)}</div></section>}
    {modalOpen && <Modal title="Tambah transaksi" onClose={() => setModalOpen(false)}><form className="modal-form" onSubmit={addTransaction}><label className="field-label">Lahan<select name="farm" required>{farms.map((farm) => <option key={farm._id} value={farm._id}>{farm.name}</option>)}</select></label><div className="form-grid"><label className="field-label">Jenis<select name="type"><option value="income">Pendapatan</option><option value="cost">Biaya</option></select></label><label className="field-label">Kategori<input required name="category" placeholder="Contoh: Hasil panen" /></label></div><div className="form-grid"><label className="field-label">Jumlah (Rp)<input required min="1" type="number" name="amount" placeholder="1500000" /></label><label className="field-label">Tanggal<input required type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label></div><label className="field-label">Musim<input name="season" placeholder={`${new Date().getFullYear()}-Musim-1`} /></label><label className="field-label">Keterangan<textarea name="description" rows="2" placeholder="Catatan tambahan (opsional)" /></label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setModalOpen(false)}>Batal</button><button className="button button-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan transaksi'}</button></div></form></Modal>}
  </>
}

export function WeatherCalendar() {
  const { farms, loading: farmsLoading, error: farmsError, retry: retryFarms } = useFarms()
  const [selectedId, setSelectedId] = useState('')
  const [weather, setWeather] = useState(null)
  const [weatherRetry, setWeatherRetry] = useState(0)
  const [cropId, setCropId] = useState('')
  const selectedFarm = farms.find((farm) => farm._id === selectedId) || farms[0]
  const crop = crops.find((item) => item.id === cropId) || cropForName(selectedFarm?.cropType)
  const farmId = selectedFarm?._id
  const latitude = selectedFarm?.latitude
  const longitude = selectedFarm?.longitude
  const requestKey = farmId ? `${farmId}:${latitude}:${longitude}` : ''
  const loading = Boolean(requestKey && weather?.requestKey !== requestKey)
    || Boolean(requestKey && weather?.requestKey === requestKey && weather.loading)
  const error = weather?.requestKey === requestKey ? weather.error : ''
  const forecast = weather?.requestKey === requestKey && !error ? weather.data : null

  useEffect(() => {
    if (!farmId) return
    const controller = new AbortController()
    async function loadForecast() {
      setWeather({ requestKey, data: null, error: '', loading: true })
      try {
        const coordinates = [Number(latitude), Number(longitude)]
        if (latitude == null || longitude == null || latitude === '' || longitude === ''
          || !coordinates.every(Number.isFinite)
          || coordinates[0] < -90 || coordinates[0] > 90
          || coordinates[1] < -180 || coordinates[1] > 180) {
          throw new Error('Koordinat lahan tidak valid. Perbarui lokasi lahan terlebih dahulu.')
        }
        const { data } = await api.get('/weather/forecast', {
          params: { latitude: coordinates[0], longitude: coordinates[1] },
          signal: controller.signal,
        })
        if (!data || typeof data !== 'object') throw new Error('Respons layanan cuaca tidak valid.')
        const forecastDays = data.forecast?.forecastday
        if (!Array.isArray(forecastDays) || forecastDays.length === 0) {
          throw new Error('Data prakiraan kosong atau format respons tidak lengkap.')
        }
        const days = forecastDays.slice(0, 3).map((forecastDay) => ({
          date: forecastDay?.date,
          rain: forecastDay?.day?.totalprecip_mm,
          max: forecastDay?.day?.maxtemp_c,
          min: forecastDay?.day?.mintemp_c,
          condition: forecastDay?.day?.condition?.text,
        }))
        if (days.some((day) => typeof day.date !== 'string'
          || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)
          || !Number.isFinite(new Date(`${day.date}T12:00:00`).getTime())
          || ![day.rain, day.max, day.min].every((value) => typeof value === 'number' && Number.isFinite(value))
          || typeof day.condition !== 'string' || !day.condition.trim())) {
          throw new Error('Data prakiraan berisi nilai yang tidak valid.')
        }
        if (!controller.signal.aborted) setWeather({ requestKey, data: { days }, error: '', loading: false })
      } catch (weatherError) {
        if (!controller.signal.aborted && weatherError.name !== 'AbortError') {
          setWeather({
            requestKey,
            data: null,
            error: weatherError.message || 'Prakiraan cuaca tidak dapat dimuat.',
            loading: false,
          })
        }
      }
    }
    loadForecast()
    return () => controller.abort()
  }, [farmId, latitude, longitude, requestKey, weatherRetry])

  const days = useMemo(() => {
    return Array.isArray(forecast?.days) ? forecast.days : []
  }, [forecast])
  const recommended = days.find((day) => day.rain < (crop?.heavyRainMm ?? 10))
  const currentMonth = new Date().getMonth() + 1
  const seasonIsSuitable = crop?.seasonMonths?.includes(currentMonth) ?? false

  return <>
    <Heading eyebrow="CUACA & KALENDER TANAM" title="Rencanakan musim tanam" description="Prakiraan dihitung dari koordinat lahan terpilih, bukan lokasi umum perangkat." />
    {farmsLoading ? <Loading /> : farmsError ? <section className="panel weather-fallback" role="alert"><div><strong>Lahan tidak dapat dimuat.</strong><p>Periksa koneksi aplikasi lalu coba lagi.</p></div><button className="button button-secondary" onClick={retryFarms}><FiRefreshCw /> Coba lagi</button></section> : !farms.length ? <section className="panel"><Empty icon={FiCloudRain} title="Tambahkan lahan untuk melihat cuaca" text="Prakiraan cuaca akurat memerlukan koordinat dari data lahan Anda." action={<Link to="/app/farms" className="button button-primary"><FiPlus /> Tambah lahan</Link>} /></section> : <>
      <section className="weather-controls panel"><div><span className="eyebrow">PILIH AREA PANTAUAN</span><h2>Cuaca berdasarkan lahan</h2><p>Data cuaca menggunakan koordinat yang tersimpan pada lahan.</p></div><label className="field-label">Lahan<select value={selectedFarm?._id || ''} onChange={(event) => setSelectedId(event.target.value)}>{farms.map((farm) => <option key={farm._id} value={farm._id}>{farm.name} · {farm.locationName || farm.cropType}</option>)}</select></label></section>
      <div className="weather-location"><span className="weather-pin"><FiMapPin /></span><span><b>{selectedFarm?.name}</b><small>{selectedFarm?.locationName || 'Koordinat lahan'} · {Number(selectedFarm?.latitude).toFixed(4)}, {Number(selectedFarm?.longitude).toFixed(4)}</small></span><span className="weather-source">WeatherAPI · 3 hari</span></div>
      {loading ? <section className="panel"><Loading label="Memuat prakiraan cuaca untuk lahan..." /></section> : error || days.length === 0 ? <section className="panel weather-fallback" role="alert"><span className="panel-icon"><FiCloudRain /></span><div><strong>{error || 'Data prakiraan belum tersedia.'}</strong><p>Periksa koneksi internet atau koordinat lahan, lalu coba muat ulang prakiraan.</p></div><button className="button button-secondary" onClick={() => { setWeather(null); setWeatherRetry((current) => current + 1) }}><FiRefreshCw /> Coba lagi</button></section> : <div className="forecast-grid">{days.map((day, index) => <article className={`forecast-card ${index === 0 ? 'forecast-today' : ''}`} key={day.date}><span className="forecast-day">{index === 0 ? 'Hari ini' : new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(`${day.date}T12:00:00`))}</span><strong>{shortDate(`${day.date}T12:00:00`)}</strong><span className="forecast-icon">{day.rain >= (crop?.heavyRainMm ?? 10) ? <FiCloudRain /> : <FiWind />}</span><span className="forecast-condition">{day.condition}</span><span className="forecast-temp">{Math.round(day.max)}° <small>/ {Math.round(day.min)}°</small></span><span className={`rain-value ${day.rain >= (crop?.heavyRainMm ?? 10) ? 'rain-heavy' : ''}`}><FiDroplet /> {number.format(day.rain)} mm</span></article>)}</div>}
      <div className="calendar-grid">
        <section className="panel planting-panel"><div className="panel-heading"><div><span className="eyebrow">REKOMENDASI JADWAL</span><h2>Waktu tanam yang disarankan</h2></div><span className="panel-icon"><FiCalendar /></span></div><label className="field-label crop-select">Jenis tanaman<select value={cropId || crop.id} onChange={(event) => setCropId(event.target.value)}>{crops.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>{loading ? <Loading /> : error || days.length === 0 ? <div className="recommendation recommendation-caution"><span className="recommendation-check"><FiCloudRain /></span><div><strong>Rekomendasi belum tersedia</strong><small>Muat prakiraan cuaca yang valid terlebih dahulu.</small></div></div> : recommended ? <div className="recommendation"><span className="recommendation-check"><FiCheck /></span><div><span>Hari terdekat dengan prakiraan tidak hujan lebat</span><strong>{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${recommended.date}T12:00:00`))}</strong><small>Curah hujan {number.format(recommended.rain)} mm · Ambang {crop.name}: {crop.heavyRainMm} mm/hari</small></div></div> : <div className="recommendation recommendation-caution"><span className="recommendation-check"><FiCloudRain /></span><div><strong>Belum ada hari ideal dalam 3 hari</strong><small>Pertimbangkan menunda penanaman atau cek kembali prakiraan mendatang.</small></div></div>}<p className={`season-note ${seasonIsSuitable ? 'season-good' : ''}`}><FiCalendar /> {seasonIsSuitable ? 'Bulan ini termasuk rekomendasi musim tanam' : 'Bulan ini di luar rekomendasi musim tanam umum'} untuk {crop.name}. Sesuaikan dengan kondisi lokal.</p></section>
        <section className="panel calculator-panel"><div className="panel-heading"><div><span className="eyebrow">KALKULATOR KEBUTUHAN</span><h2>Estimasi input lahan</h2></div><span className="panel-icon"><FiDroplet /></span></div><label className="field-label">Hitung untuk tanaman<select value={cropId || crop.id} onChange={(event) => setCropId(event.target.value)}>{crops.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="calculator-results"><div><span className="calculator-result-icon"><FiFeather /></span><span><small>Kebutuhan pupuk</small><strong>{number.format(Number(selectedFarm?.area || 0) * (crop?.fertilizerKgPerHectare || 0))} <em>kg</em></strong></span></div><div><span className="calculator-result-icon water-icon"><FiDroplet /></span><span><small>Kebutuhan air</small><strong>{number.format(Number(selectedFarm?.area || 0) * (crop?.waterM3PerHectare || 0))} <em>m³</em></strong></span></div></div><p className="calculator-note">Rumus: luas lahan ({number.format(selectedFarm?.area || 0)} ha) × kebutuhan per hektare. Estimasi umum; sesuaikan dengan rekomendasi penyuluh dan kondisi tanah.</p></section>
      </div>
    </>}
  </>
}

export function Market() {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    api.get('/market-prices')
      .then(({ data }) => {
        if (!Array.isArray(data?.prices)) throw new Error('Format data harga pasar tidak valid.')
        if (active) {
          setPrices(data.prices)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [attempt])

  const retry = () => {
    setLoading(true)
    setAttempt((current) => current + 1)
  }

  return <>
    <Heading eyebrow="INFORMASI PASAR" title="Harga pasar" description="Pantau harga referensi komoditas pertanian untuk membantu merencanakan penjualan." />
    <section className="market-banner"><div className="market-banner-pattern"><span /><span /><span /></div><span className="eyebrow eyebrow-light">WAWASAN PASAR</span><h2>Panen yang baik dimulai<br />dari keputusan yang tepat.</h2><p>Pantau komoditas dan rencanakan waktu jual sesuai kondisi pasar di wilayah Anda.</p></section>
    <section className="panel table-panel market-table">
      <div className="table-toolbar"><div><h2>Harga komoditas</h2><span>Rupiah per kilogram</span></div></div>
      {error && <div className="notice" role="alert"><span>{error}</span><button className="button button-quiet" onClick={retry}><FiRefreshCw /> Coba lagi</button></div>}
      {loading ? <Loading label="Memuat harga komoditas..." /> : error ? null : prices.length ? (
        <div className="table-scroll"><table>
          <thead><tr><th>KOMODITAS</th><th>HARGA REFERENSI</th><th>RENTANG HARGA</th><th>PERUBAHAN HARIAN</th><th>SATUAN</th></tr></thead>
          <tbody>{prices.map((row) => {
            const change = Number(row.changePercent)
            const TrendIcon = row.trend === 'up' ? FiArrowUpRight : row.trend === 'down' ? FiArrowDownRight : FiMinus
            const changeClass = row.trend === 'up' ? 'money-positive' : row.trend === 'down' ? 'money-negative' : ''
            const trendLabel = row.trend === 'up' ? 'Naik' : row.trend === 'down' ? 'Turun' : 'Stabil'
            return <tr key={row.id}>
              <td><strong>{row.commodity}</strong></td>
              <td><strong>{currency.format(row.price)}</strong></td>
              <td>{currency.format(row.minPrice)} – {currency.format(row.maxPrice)}</td>
              <td className={changeClass}><TrendIcon /> {trendLabel} ({change > 0 ? '+' : ''}{number.format(change)}%)</td>
              <td>per {row.unit}</td>
            </tr>
          })}</tbody>
        </table></div>
      ) : <Empty title="Harga belum tersedia" text="Belum ada harga komoditas yang dapat ditampilkan." />}
    </section>
    <div className="market-footnote"><FiMapPin /><span>Harga dinyatakan dalam Rupiah per kilogram. Harga transaksi dapat berbeda menurut lokasi, kualitas, dan waktu.</span></div>
  </>
}

export function Notifications() {
  const { farms, loading: farmsLoading } = useFarms()
  const [activities, setActivities] = useState([])
  const [activityError, setActivityError] = useState('')
  useEffect(() => {
    api.get('/activities')
      .then(({ data }) => setActivities(data.slice(0, 3)))
      .catch((error) => setActivityError(getErrorMessage(error)))
  }, [])
  return <>
    <Heading eyebrow="PUSAT INFORMASI" title="Notifikasi & pengingat" description="Pengingat yang membantu Anda menjaga rutinitas dan kesiapan musim." />
    <div className="notice notice-info">Notifikasi ini dibuat di aplikasi berdasarkan data Anda. Belum ada layanan notifikasi push atau endpoint notifikasi pada backend.</div>
    {activityError && <Notice>{activityError}</Notice>}
    <div className="notification-list">
      <article className="notification-card notification-highlight"><span className="notification-icon"><FiMapPin /></span><div><span className="notification-time">PENGINGAT · SETUP</span><h2>{farmsLoading ? 'Memeriksa data lahan...' : farms.length ? `${farms.length} lahan siap dipantau` : 'Tambahkan lahan pertanian Anda'}</h2><p>{farms.length ? 'Pastikan koordinat lahan akurat untuk mendapatkan prakiraan cuaca yang sesuai.' : 'Koordinat lahan dibutuhkan untuk kalender tanam dan informasi cuaca yang akurat.'}</p>{!farmsLoading && <Link className="text-link" to={farms.length ? '/app/weather' : '/app/farms'}>{farms.length ? 'Lihat cuaca lahan' : 'Daftarkan lahan'} <FiArrowRight /></Link>}</div><span className="notification-unread" /></article>
      <article className="notification-card"><span className="notification-icon notification-icon-blue"><FiCloudRain /></span><div><span className="notification-time">SARAN BUDIDAYA</span><h2>Cek prakiraan sebelum memulai aktivitas di lahan</h2><p>Perubahan cuaca dapat memengaruhi jadwal pemupukan, pengairan, dan panen.</p><Link className="text-link" to="/app/weather">Buka prakiraan <FiArrowRight /></Link></div></article>
      <article className="notification-card"><span className="notification-icon notification-icon-yellow"><FiActivity /></span><div><span className="notification-time">LOGBOOK</span><h2>{activities.length ? 'Aktivitas terakhir Anda' : 'Lengkapi catatan aktivitas secara berkala'}</h2><p>{activities.length ? `${activityTitle(activities[0].type)}${activities[0].farm?.name ? ` · ${activities[0].farm.name}` : ''} dicatat pada ${dateLabel(activities[0].date)}.` : 'Catatan yang konsisten membantu Anda mengevaluasi hasil setiap musim.'}</p><Link className="text-link" to="/app/activities">Buka logbook <FiArrowRight /></Link></div></article>
    </div>
  </>
}
