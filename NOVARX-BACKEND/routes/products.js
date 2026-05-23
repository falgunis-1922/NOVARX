// routes/products.js
// GET  /api/products         — sabhi products (filter, search support)
// GET  /api/products/:id     — ek product
// POST /api/products         — naya product add (admin only)

const express = require('express')
const { PrismaClient } = require('@prisma/client')
const verifyToken = require('../middleware/verifyToken')

const router = express.Router()
const prisma  = new PrismaClient()

// ─────────────────────────────────────────────────────────
// GET /api/products
// Query params: ?cat=vitamins  ?search=paracetamol  ?limit=20
// ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { cat, search, limit = 50 } = req.query

    // Build filter object for Prisma
    const where = {}

    if (cat && cat !== 'all') {
      where.category = cat
    }

    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      take:    parseInt(limit),
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({ products })

  } catch (error) {
    console.error('Get products error:', error)
    return res.status(500).json({ error: 'Server error fetching products.' })
  }
})

// ─────────────────────────────────────────────────────────
// GET /api/products/:id  — single product
// ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    return res.status(200).json({ product })

  } catch (error) {
    console.error('Get product error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/products  — add new product (admin only)
// ─────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    // Only admin can add products
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required.' })
    }

    const { name, brand, pack, price, oldPrice, category, badge, bg, st, stock } = req.body

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price and category are required.' })
    }

    const product = await prisma.product.create({
      data: {
        name,
        brand:    brand    || '',
        pack:     pack     || '',
        price:    parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        category,
        badge:    badge    || null,
        bg:       bg       || '#eff6ff',
        st:       st       || '#3b82f6',
        stock:    stock    ? parseInt(stock) : 100,
      }
    })

    return res.status(201).json({ message: 'Product added!', product })

  } catch (error) {
    console.error('Add product error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})

module.exports = router
