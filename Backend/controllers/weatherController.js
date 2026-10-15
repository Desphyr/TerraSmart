import asyncHandler from '../middleware/asyncHandler.js'

export const getWeatherForecast = asyncHandler(async (req, res) => {
  const latitude = Number(req.query.latitude)
  const longitude = Number(req.query.longitude)

  if (req.query.latitude === undefined || req.query.longitude === undefined
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90
    || longitude < -180 || longitude > 180) {
    res.status(400)
    throw new Error('Valid latitude and longitude are required')
  }

  const apiKey = process.env.WEATHER_API_KEY?.trim()
  if (!apiKey) {
    res.status(503)
    throw new Error('API cuaca belum dikonfigurasi. Atur WEATHER_API_KEY pada Backend/.env.')
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: `${latitude},${longitude}`,
    days: '3',
  })

  let response
  let data
  try {
    response = await fetch(`https://api.weatherapi.com/v1/forecast.json?${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    data = await response.json()
  } catch (error) {
    if (error.name === 'TimeoutError') {
      res.status(504)
      throw new Error('Layanan cuaca tidak merespons tepat waktu.')
    }
    res.status(502)
    throw new Error('Layanan cuaca tidak dapat dihubungi.')
  }

  if (!response.ok || data?.error) {
    res.status(502)
    throw new Error(data?.error?.message || 'Layanan cuaca mengembalikan error.')
  }

  res.json(data)
})
