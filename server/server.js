const express = require('express');
const dotenv = require('dotenv');

const cors = require("cors");

const connectToDB = require('./config/db');
connectToDB();

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors()); // Allows requests from any origin



app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/loan', require('./routes/loanRoutes'));
app.use('/api/branch', require('./routes/branchRoutes'));
app.use('/api/employee', require('./routes/employeeRoutes'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SERVER IS RUNNING AT PORT ${PORT}`);
})
