// routes/orders.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const verifyToken = require('../middleware/verifyToken')
 
const router = express.Router()
const prisma = new PrismaClient()
 
// GET /api/orders — user ke saare orders
router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return res.status(200).json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})
 
// POST /api/orders — naya order create karo
router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress, paymentMethod } = req.body
    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items in order.' })
    }
 
    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        totalAmount: parseFloat(totalAmount),
        deliveryAddress: deliveryAddress || '',
        paymentMethod: paymentMethod || 'card',
        status: 'PLACED',
        paymentStatus: 'paid',
        items: {
          create: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: parseFloat(i.price)
          }))
        }
      },
      include: { items: { include: { product: true } } }
    })
 
    // Cart clear karo after order
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.userId } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }
 
    return res.status(201).json({ message: 'Order placed!', order })
  } catch (error) {
    console.error('Create order error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})
 
// GET /api/orders/:id — single order details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { items: { include: { product: true } } }
    })
    if (!order) return res.status(404).json({ error: 'Order not found.' })
    return res.status(200).json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})
 
module.exports = router
