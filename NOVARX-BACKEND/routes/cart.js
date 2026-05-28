// routes/cart.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const verifyToken = require('../middleware/verifyToken')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/cart — cart dekho
router.get('/', verifyToken, async (req, res) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    })
    if (!cart) return res.status(200).json({ cart: null, items: [] })
    return res.status(200).json({ cart, items: cart.items })
  } catch (error) {
    console.error('Get cart error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})

// POST /api/cart/add — item add karo
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body
    if (!productId) return res.status(400).json({ error: 'Product ID required.' })

    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId }
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.userId }
      })
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    })

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity }
      })
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } }
    })
    return res.status(200).json({ message: 'Added to cart!', cart: updatedCart })
  } catch (error) {
    console.error('Add to cart error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})

// PUT /api/cart/update — quantity update karo
router.put('/update', verifyToken, async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body
    if (!cartItemId || !quantity) return res.status(400).json({ error: 'CartItem ID and quantity required.' })

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } })
      return res.status(200).json({ message: 'Item removed.' })
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    })
    return res.status(200).json({ message: 'Cart updated!' })
  } catch (error) {
    console.error('Update cart error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})

// DELETE /api/cart/remove/:cartItemId — item remove karo
router.delete('/remove/:cartItemId', verifyToken, async (req, res) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.cartItemId } })
    return res.status(200).json({ message: 'Item removed from cart!' })
  } catch (error) {
    console.error('Remove cart error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})

// DELETE /api/cart/clear — poora cart clear karo
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.userId } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }
    return res.status(200).json({ message: 'Cart cleared!' })
  } catch (error) {
    console.error('Clear cart error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})

module.exports = router