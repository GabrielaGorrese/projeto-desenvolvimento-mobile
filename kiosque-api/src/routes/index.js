const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes')
const tableRoutes = require('./tableRoutes')

router.use('/auth', authRoutes)
router.use('/tables', tableRoutes)

const { authMiddleware } = require('../middlewares/auth')

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router;
