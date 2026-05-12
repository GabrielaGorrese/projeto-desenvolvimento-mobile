const express = require('express');
const router =  express.Router();
const authController = require('../controllers/authController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/login', authController.login);
router.post('/users', authController.register);

router.delete('/users', authMiddleware, roleMiddleware('manager'), authController.deleteUser);
router.put('/users', authMiddleware, roleMiddleware('manager'), authController.alterPassword);
router.get('/users',authMiddleware, roleMiddleware('manager'), authController.getAll)

module.exports = router;