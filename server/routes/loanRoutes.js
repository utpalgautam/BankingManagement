const express = require('express');
const router = express.Router();
const loanControllers = require('../controllers/loanControllers');

router.post('/create/:account_number', loanControllers.requestLoan)
//router.get('/all/:user_id', loanControllers.getAllLoanAccounts)
router.post('/approve/:account_number', loanControllers.approveLoan)
router.post('/reject/:account_number', loanControllers.rejectLoan) 
router.get('/:account_number', loanControllers.getLoanAccount)

module.exports = router;