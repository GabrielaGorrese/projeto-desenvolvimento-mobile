const express = require('express');
const router =  express.Router();
const authController = require('../controllers/authController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.post('/login', authController.login);



router.post('/register', authMiddleware, roleMiddleware('manager'), authController.register);
router.delete('/delete', authMiddleware, roleMiddleware('manager'), authController.deleteUser);
router.put('/alterPassword', authMiddleware, roleMiddleware('manager'), authController.alterPassword);
router.get('/allUsers',authMiddleware, roleMiddleware('manager'), authController.getAllUsers)

module.exports = router