const express = require('express')
const cors    = require('cors')
require('dotenv').config()
 
const app = express()
 
app.use(cors({ origin: '*' }))
app.use(express.json())
 
const authRoutes     = require('./routes/auth')
const productRoutes  = require('./routes/products')
const seedRoutes     = require('./routes/seed')
const cartRoutes     = require('./routes/cart')
const orderRoutes    = require('./routes/orders')
const wishlistRoutes = require('./routes/wishlist')
 
app.use('/api/auth',     authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/seed',     seedRoutes)
app.use('/api/cart',     cartRoutes)
app.use('/api/orders',   orderRoutes)
app.use('/api/wishlist', wishlistRoutes)
 
app.get('/', (req, res) => {
  res.json({ message: 'NovaRX backend is running!' })
})
 
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Server error' })
})
 
const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`✅ NovaRX server running on http://localhost:${PORT}`)
})
