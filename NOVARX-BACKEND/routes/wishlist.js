// routes/wishlist.js
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const verifyToken = require('../middleware/verifyToken')
 
const router = express.Router()
const prisma = new PrismaClient()
 
// GET /api/wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { wishlist: true }
    })
    return res.status(200).json({ wishlist: user?.wishlist || [] })
  } catch (error) {
    console.error('Get wishlist error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})
 
// POST /api/wishlist — wishlist save karo
router.post('/', verifyToken, async (req, res) => {
  try {
    const { wishlist } = req.body
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { wishlist: wishlist || [] }
    })
    return res.status(200).json({ message: 'Wishlist saved!', wishlist })
  } catch (error) {
    console.error('Save wishlist error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})
 
module.exports = router
