const express = require('express');
const router = express.Router();
const employeeControllers = require('../controllers/employeeControllers');
const auth = require('../middleware/auth'); 


router.post('/add',employeeControllers.createEmployee);
router.get('/all',employeeControllers.getAllEmployees);
router.get('/get/:user_id',employeeControllers.getEmployeeById);   

module.exports = router;