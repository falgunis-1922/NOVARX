// routes/auth.js
// All authentication routes for NovaRX:
//   POST /api/auth/register  → create new account
//   POST /api/auth/login     → sign in, get token
//   GET  /api/auth/me        → get current user (protected)

const express    = require('express')
const bcrypt     = require('bcrypt')
const jwt        = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const verifyToken = require('../middleware/verifyToken')

const router = express.Router()
const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────
// HELPER: create a JWT token for a user
// ─────────────────────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email:  user.email,
      role:   user.role,
    },
    process.env.JWT_SECRET,       // secret key from your .env file
    { expiresIn: '7d' }           // token expires in 7 days
  )
}

// ─────────────────────────────────────────────────────────────
// HELPER: send a clean user object (never send the password!)
// ─────────────────────────────────────────────────────────────
function safeUser(user) {
  const { password, ...rest } = user   // remove password field
  return rest
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { firstName, lastName, email, phone, password }
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body

    // ── Step 1: Validate required fields ──────────────────────
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'First name, last name, email and password are required.'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters.'
      })
    }

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email.' })
    }

    // ── Step 2: Check if email is already registered ──────────
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'This email is already registered. Please sign in.'
      })
    }

    // ── Step 3: Hash the password ─────────────────────────────
    // bcrypt.hash scrambles the password so it can NEVER be read.
    // The number 10 is the "salt rounds" — higher = more secure but slower.
    const hashedPassword = await bcrypt.hash(password, 10)

    // ── Step 4: Save new user to PostgreSQL ───────────────────
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.toLowerCase().trim(),
        phone:     phone || null,
        password:  hashedPassword,
        role:      'PATIENT',
      }
    })

    // ── Step 5: Create a JWT token so they are logged in immediately
    const token = generateToken(newUser)

    // ── Step 6: Send response ─────────────────────────────────
    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: safeUser(newUser)
    })

  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // ── Step 1: Validate ──────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // ── Step 2: Find user in database ─────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    // NOTE: We give the same vague error whether email is wrong
    // or password is wrong — this prevents hackers from knowing
    // which one is incorrect (security best practice).
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // ── Step 3: Compare entered password with stored hash ──────
    // bcrypt.compare hashes the entered password and checks if it
    // matches the stored hash — it never "decrypts" the hash.
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // ── Step 4: Create JWT token ──────────────────────────────
    const token = generateToken(user)

    // ── Step 5: Send token and user data back ─────────────────
    return res.status(200).json({
      message: 'Signed in successfully!',
      token,
      user: safeUser(user)
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me   (PROTECTED — requires token in header)
// Returns the currently logged-in user's data
// Frontend sends: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    // req.user is set by the verifyToken middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        email:     true,
        phone:     true,
        role:      true,
        createdAt: true,
        // password is NOT selected — never send it
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    return res.status(200).json({ user })

  } catch (error) {
    console.error('Me error:', error)
    return res.status(500).json({ error: 'Server error.' })
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// JWT tokens are stateless — "logout" just means the frontend
// deletes its copy of the token. Nothing needed server-side.
// ─────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully.' })
})

module.exports = router
