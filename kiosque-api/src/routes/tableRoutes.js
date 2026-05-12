const express = require('express');
const router =  express.Router();
const tableController = require('../controllers/tableCotroller')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');


router.get('/',tableController.getAllTables);
router.post('/',tableController.create);
router.patch('/',tableController.update);
router.delete('/',tableController.deleteTable);
router.put('/',tableController.statusTable);

module.exports = router;