import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { FiMapPin, FiSearch } from 'react-icons/fi'
import 'leaflet/dist/leaflet.css'
import markerUrl from 'leaflet/dist/images/marker-icon.png'
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

const markerIcon = L.icon({
  iconUrl: markerUrl,
  iconRetinaUrl: markerRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
const indonesiaCenter = [-2.5, 118]

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 120)
    return () => window.clearTimeout(timer)
  }, [map])
  return null
}

function MapView({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 13), { duration: 0.5 })
  }, [map, position])
  return null
}

function waitForNominatim(signal, lastRequest) {
  const delay = Math.max(0, 1000 - (Date.now() - lastRequest.current))
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Permintaan dibatalkan.', 'AbortError'))
      return
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      lastRequest.current = Date.now()
      resolve()
    }, delay)
    function onAbort() {
      window.clearTimeout(timer)
      reject(new DOMException('Permintaan dibatalkan.', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export default function FarmLocationPicker({ initialLocation, onChange }) {
  const latestLocation = useRef(initialLocation)
  useEffect(() => {
    latestLocation.current = initialLocation
  }, [initialLocation])
  const position = useMemo(() => {
    if (initialLocation.latitude === '' || initialLocation.longitude === '') return null
    const latitude = Number(initialLocation.latitude)
    const longitude = Number(initialLocation.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
    return [latitude, longitude]
  }, [initialLocation.latitude, initialLocation.longitude])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')
  const reverseController = useRef(null)
  const searchController = useRef(null)
  const lastNominatimRequest = useRef(0)

  useEffect(() => () => {
    reverseController.current?.abort()
    searchController.current?.abort()
  }, [])

  async function reverseGeocode(latitude, longitude, signal) {
    setResolving(true)
    setError('')
    try {
      await waitForNominatim(signal, lastNominatimRequest)
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(latitude),
        lon: String(longitude),
        zoom: '14',
        addressdetails: '1',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
        signal,
        headers: { 'Accept-Language': 'id' },
      })
      if (!response.ok) throw new Error(`Pencarian lokasi merespons ${response.status}.`)
      const data = await response.json()
      if (signal.aborted) return
      if (!data?.display_name) throw new Error('Nama wilayah tidak ditemukan. Koordinat tetap tersimpan.')
      const currentLocation = latestLocation.current
      if (Number(currentLocation.latitude) !== latitude || Number(currentLocation.longitude) !== longitude
        || currentLocation.locationName) return
      onChange({ latitude, longitude, locationName: data.display_name })
    } catch (lookupError) {
      if (lookupError.name !== 'AbortError') setError(lookupError.message || 'Nama wilayah tidak dapat ditemukan.')
    } finally {
      if (!signal.aborted) setResolving(false)
    }
  }

  async function searchLocations() {
    if (!query.trim()) {
      setError('Masukkan nama tempat yang ingin dicari.')
      return
    }
    reverseController.current?.abort()
    setResolving(false)
    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    setSearching(true)
    setError('')
    setResults([])
    try {
      await waitForNominatim(controller.signal, lastNominatimRequest)
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'jsonv2',
        addressdetails: '1',
        limit: '5',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'id' },
      })
      if (!response.ok) throw new Error(`Pencarian lokasi merespons ${response.status}.`)
      const locations = await response.json()
      if (!Array.isArray(locations) || locations.length === 0) {
        setError('Lokasi tidak ditemukan. Coba gunakan nama desa atau kecamatan.')
        return
      }
      const validLocations = locations.filter((location) =>
        location && typeof location.display_name === 'string'
        && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lon))
        && Number(location.lat) >= -90 && Number(location.lat) <= 90
        && Number(location.lon) >= -180 && Number(location.lon) <= 180,
      )
      if (!validLocations.length) setError('Hasil pencarian tidak berisi koordinat lokasi yang valid.')
      else setResults(validLocations)
    } catch (lookupError) {
      if (lookupError.name !== 'AbortError') setError(lookupError.message || 'Pencarian lokasi tidak dapat dilakukan.')
    } finally {
      if (!controller.signal.aborted) setSearching(false)
    }
  }

  function selectSearchResult(result) {
    const latitude = Number(result.lat)
    const longitude = Number(result.lon)
    reverseController.current?.abort()
    setResolving(false)
    onChange({ latitude, longitude, locationName: result.display_name })
    setQuery(result.display_name)
    setResults([])
    setError('')
  }

  function selectMapPoint(latitude, longitude) {
    reverseController.current?.abort()
    searchController.current?.abort()
    setSearching(false)
    setResolving(false)
    setResults([])
    onChange({ latitude, longitude, locationName: '' })
    const controller = new AbortController()
    reverseController.current = controller
    reverseGeocode(latitude, longitude, controller.signal)
  }

  const mapCenter = position || indonesiaCenter

  return (
    <section className="location-picker" aria-label="Pilih lokasi lahan">
      <div className="location-search">
        <label className="field-label" htmlFor="farm-location-search">Cari nama lokasi</label>
        <div className="location-search-row">
          <input
            id="farm-location-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                searchLocations()
              }
            }}
            placeholder="Contoh: Sleman, Yogyakarta"
            autoComplete="off"
          />
          <button className="button button-secondary" type="button" onClick={searchLocations} disabled={searching}>
            <FiSearch /> {searching ? 'Mencari...' : 'Cari'}
          </button>
        </div>
      </div>
      {results.length > 0 && (
        <ul className="location-results" aria-label="Hasil pencarian lokasi">
          {results.map((result) => (
            <li key={result.place_id}>
              <button type="button" onClick={() => selectSearchResult(result)}>
                <FiMapPin /><span>{result.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <MapContainer center={mapCenter} zoom={position ? 14 : 5} scrollWheelZoom className="farm-location-map">
        <MapResizer />
        <MapClickHandler onSelect={selectMapPoint} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <Marker position={position} icon={markerIcon} />}
        <MapView position={position} />
      </MapContainer>
      <p className="form-hint"><FiMapPin /> Pilih hasil pencarian atau klik peta. Nama lokasi dan koordinat dapat disunting di kolom formulir.</p>
      {resolving && <p className="location-feedback" role="status">Mengambil nama wilayah...</p>}
      {initialLocation.locationName && <p className="location-selected">Lokasi terpilih: {initialLocation.locationName}</p>}
      {error && <p className="location-error" role="alert">{error}</p>}
    </section>
  )
}
