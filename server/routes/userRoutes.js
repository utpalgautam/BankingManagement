const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userControllers');
const auth = require('../middleware/auth');

router.post('/register', userControllers.register);
router.post('/login', userControllers.login);
router.post('/verify', userControllers.verifyCode);
router.post('/forgotpassword', userControllers.forgotPassword);
router.post('/resetpassword', userControllers.resetPassword);
router.post('/change/password', userControllers.changePassword)
router.get('/profile/:user_id', userControllers.getUser);
router.get('/all', userControllers.getAllUsers);
router.get('/details',userControllers.getAccountDetails);
router.delete('/delete/:user_id', userControllers.deleteUser);
router.put('/update/:user_id', userControllers.updateUser);
router.get('/count', userControllers.getUserCount);
router.get('/search/:identifier', userControllers.searchUser);
router.post('/change/primary', userControllers.changePrimary);


module.exports = router;