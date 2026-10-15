export const notFound = (req, res, next) => {
  res.status(404)
  next(new Error(`Not found - ${req.originalUrl}`))
}

export const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500
  let message = err.message

  if (err.name === 'ValidationError') status = 400
  if (err.name === 'CastError') {
  status = 400
  message = 'Invalid ID format'
  }
  if (err.code === 11000) {
    status = 400
    message = 'Data already exists (duplicate value)'
  }

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  })
}