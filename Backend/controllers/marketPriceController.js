import { readFile } from 'node:fs/promises'
import asyncHandler from '../middleware/asyncHandler.js'

const fallbackPath = new URL('../data/marketPricesFallback.json', import.meta.url)
const fallbackPricesPromise = readFile(fallbackPath, 'utf8').then((content) => JSON.parse(content))
const commodityAliases = [
  { id: 'beras', commodity: 'Beras', aliases: ['beras'] },
  { id: 'cabai-rawit', commodity: 'Cabai Rawit', aliases: ['cabai rawit', 'cabe rawit'] },
  { id: 'bawang-merah', commodity: 'Bawang Merah', aliases: ['bawang merah'] },
  { id: 'bawang-putih', commodity: 'Bawang Putih', aliases: ['bawang putih'] },
  { id: 'jagung', commodity: 'Jagung', aliases: ['jagung'] },
  { id: 'kedelai', commodity: 'Kedelai', aliases: ['kedelai', 'soybean'] },
]
const nameFields = ['commodity', 'komoditas', 'nama_komoditas', 'nama', 'name', 'item']
const priceFields = ['price', 'harga', 'harga_rata_rata', 'harga_konsumen', 'nilai']
const previousPriceFields = ['previousPrice', 'previous_price', 'harga_sebelumnya', 'harga_kemarin']
const minPriceFields = ['minPrice', 'min_price', 'harga_minimum', 'harga_terendah']
const maxPriceFields = ['maxPrice', 'max_price', 'harga_maksimum', 'harga_tertinggi']

function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(/[^\d,.-]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized.includes(',') && normalized.includes('.')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function fieldValue(record, fields) {
  for (const field of fields) {
    if (record[field] !== undefined && record[field] !== null && record[field] !== '') return record[field]
  }
  return null
}

function findCommodity(record) {
  const name = String(fieldValue(record, nameFields) || '').toLocaleLowerCase('id-ID')
  return commodityAliases.find((item) => item.aliases.some((alias) => name.includes(alias)))
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return null
  for (const key of ['prices', 'data', 'results', 'items']) {
    if (Array.isArray(payload[key])) return payload[key]
  }
  return null
}

function normalizePublicPrices(payload) {
  const rows = extractRows(payload)
  if (!rows) throw new Error('Public market price response does not contain a price list')

  const grouped = new Map()
  for (const record of rows) {
    if (!record || typeof record !== 'object') continue
    const commodity = findCommodity(record)
    const price = numericValue(fieldValue(record, priceFields))
    if (!commodity || price === null || price <= 0) continue
    const items = grouped.get(commodity.id) || []
    items.push({
      price,
      previousPrice: numericValue(fieldValue(record, previousPriceFields)),
      minPrice: numericValue(fieldValue(record, minPriceFields)),
      maxPrice: numericValue(fieldValue(record, maxPriceFields)),
    })
    grouped.set(commodity.id, items)
  }

  if (grouped.size !== commodityAliases.length) {
    throw new Error('Public market price response is missing one or more supported commodities')
  }

  return commodityAliases.map((commodity) => {
    const items = grouped.get(commodity.id)
    const price = Math.round(items.reduce((sum, item) => sum + item.price, 0) / items.length)
    const previousValues = items.map((item) => item.previousPrice).filter((value) => value !== null)
    const candidatePreviousPrice = previousValues.length
      ? Math.round(previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length)
      : price
    const previousPrice = candidatePreviousPrice > 0 ? candidatePreviousPrice : price
    const minValues = items.map((item) => item.minPrice).filter((value) => value !== null)
    const maxValues = items.map((item) => item.maxPrice).filter((value) => value !== null)
    const reportedMin = minValues.length ? Math.min(...minValues) : null
    const reportedMax = maxValues.length ? Math.max(...maxValues) : null
    return {
      ...commodity,
      price,
      previousPrice,
      minPrice: reportedMin > 0 && reportedMin <= price ? reportedMin : Math.round(price * 0.9),
      maxPrice: reportedMax >= price ? reportedMax : Math.round(price * 1.1),
      unit: 'kg',
    }
  })
}

function serializePrices(prices) {
  return prices.map((item) => {
    const changePercent = Number((((item.price - item.previousPrice) / item.previousPrice) * 100).toFixed(2))
    return {
      ...item,
      changePercent,
      trend: changePercent > 0.1 ? 'up' : changePercent < -0.1 ? 'down' : 'stable',
    }
  })
}

async function getPricesFromPublicSource() {
  const sourceUrl = process.env.MARKET_PRICE_SOURCE_URL?.trim()
  if (!sourceUrl) throw new Error('MARKET_PRICE_SOURCE_URL is not configured')

  let parsedUrl
  try {
    parsedUrl = new URL(sourceUrl)
  } catch {
    throw new Error('MARKET_PRICE_SOURCE_URL must be a valid URL')
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('MARKET_PRICE_SOURCE_URL must use HTTP or HTTPS')
  }

  const response = await fetch(parsedUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error(`Public market price source returned HTTP ${response.status}`)
  return normalizePublicPrices(await response.json())
}

export const getMarketPrices = asyncHandler(async (req, res) => {
  let prices
  let source
  let isFallback = false

  try {
    prices = await getPricesFromPublicSource()
    source = process.env.MARKET_PRICE_SOURCE_NAME?.trim() || 'Public open data'
  } catch (sourceError) {
    console.warn(`Market price source unavailable; using local fallback: ${sourceError.message}`)
    prices = await fallbackPricesPromise
    source = 'Local fallback'
    isFallback = true
  }

  res.json({
    source,
    isFallback,
    updatedAt: new Date().toISOString(),
    currency: 'IDR',
    prices: serializePrices(prices),
  })
})
