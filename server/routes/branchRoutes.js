const express = require('express');
const router = express.Router();
const branchControllers = require('../controllers/branchControllers');
const auth = require('../middleware/auth');

router.post('/add',branchControllers.createBranch);
router.get('/all',branchControllers.getAllBranches);
router.get('/:branch_id',branchControllers.getBranchById);

module.exports = router;