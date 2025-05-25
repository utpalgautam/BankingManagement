const express = require('express');
const router = express.Router();
const transactionControllers = require('../controllers/transactionControllers');

router.post('/deposit', transactionControllers.deposit);
router.post('/withdraw', transactionControllers.withdraw);
router.post('/transfer', transactionControllers.transfer);
router.get('/last5/:account_number', transactionControllers.getLast5Transactions);
router.get('/all/:account_number', transactionControllers.getAllTransactionsForAccount);
router.get('/all', transactionControllers.getAllTransaction)
router.get('/:transaction_id', transactionControllers.getTransaction);
router.post('/payBill/mobile', transactionControllers.payMobileBill);
router.post('/payBill/dth', transactionControllers.payDTHBill);
router.post('/payBill/electricity', transactionControllers.payElectricityBill);
router.post('/payBill/creditCard', transactionControllers.payCreditCardBill);
router.post('/payBill/broadband', transactionControllers.payBroadbandBill);
router.get('/today/get', transactionControllers.transactionToday);

module.exports = router;