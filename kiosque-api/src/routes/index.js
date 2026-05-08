const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes')

router.use('/auth', authRoutes)

const { authMiddleware } = require('../middlewares/auth')

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})



module.exports = router;