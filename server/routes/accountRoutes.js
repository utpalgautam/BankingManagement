const express = require('express');
const router = express.Router();
const accountControllers = require('../controllers/accountControllers');

router.post('/create/:user_id', accountControllers.createAccount);
router.get('/all/:user_id', accountControllers.getAllAccounts);
router.get('/all', accountControllers.getAll);
router.get('/:account_number', accountControllers.getAccount);
router.get('/statement/:account_number', accountControllers.getAccountStatement);
router.get('/balance/:account_number', accountControllers.getAccountBalance);
router.get('/primary/:user_id', accountControllers.getPrimaryAccount);
router.get('/status/:status', accountControllers.getAccountsOnStatus);
router.put('/update/:account_number', accountControllers.updateAccount);
router.post('/mail', accountControllers.mail);
router.get('/count/:account_type', accountControllers.countAccountsEachType);

module.exports = router;