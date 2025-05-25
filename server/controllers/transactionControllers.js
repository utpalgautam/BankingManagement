const nodemailer = require('nodemailer');
const Transaction = require('../models/transaction');
const Account = require('../models/account');
const User = require('../models/user');

const generateTransactionId = () => {
    return 'uttu' + Math.floor(1000000000 + Math.random() * 9000000000).toString() + 'py';
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, // Your Gmail email
        pass: process.env.PASSWORD // Your App Password (Not your Gmail password)
    }
});

exports.deposit = async (req, res) => {
    try {
        const { account_number, amount, transaction_method, description } = req.body;
    
        // Validate deposit amount
        if (!amount || amount <= 0) {
          return res.status(400).json({ error: 'Invalid deposit amount' });
        }
    
        // Find the account
        const account = await Account.findOne({ account_number });
        if (!account) {
          return res.status(404).json({ error: 'Account not found' });
        }
    
        // Update account balance
        account.balance += parseFloat(amount);
        await account.save();
    
        // Create a transaction record
        const transaction = new Transaction({
          transaction_id: generateTransactionId(),
          account_number,
          transaction_type: 'credit',
          transaction_method,
          amount,
          transaction_date: new Date(),
          description: description || 'Deposit',
          status: 'completed',
          balance_after_transaction: account.balance
        });
    
        await transaction.save();
    
        return res.status(200).json({
          message: 'Deposit successful',
          transaction_id: transaction.transaction_id,
          updated_balance: account.balance
        });
    
      } catch (error) {
        console.error('Deposit Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
};

exports.withdraw = async (req, res) => {
    try {
        const { account_number, amount, transaction_method, description } = req.body;
    
        // Validate withdrawal amount
        if (!amount || amount <= 0) {
          return res.status(400).json({ error: 'Invalid withdrawal amount' });
        }
    
        // Find the account
        const account = await Account.findOne({ account_number });
        if (!account) {
          return res.status(404).json({ error: 'Account not found' });
        }
    
        // Check if the account has sufficient balance
        if (account.balance < amount) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }
    
        // Deduct the amount from account balance
        account.balance -= parseFloat(amount);
        await account.save();
    
        // Create a transaction record
        const transaction = new Transaction({
          transaction_id: generateTransactionId(),
          account_number,
          transaction_type: 'debit',
          transaction_method,
          amount,
          transaction_date: new Date(),
          description: description || 'Withdrawal',
          status: 'completed',
          balance_after_transaction: account.balance
        });
    
        await transaction.save();
    
        return res.status(200).json({
          message: 'Withdrawal successful',
          transaction_id: transaction.transaction_id,
          updated_balance: account.balance
        });
    
      } catch (error) {
        console.error('Withdrawal Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
};

exports.transfer = async (req, res) => {
    try {
        const { account_number, recipient_account_number, amount, transaction_method, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid transfer amount' });
        }

        const senderAccount = await Account.findOne({ account_number });
        const recipientAccount = await Account.findOne({ account_number: recipient_account_number });

        if (!senderAccount || !recipientAccount) {
            return res.status(404).json({ message: 'One or both accounts not found' });
        }

        if (senderAccount.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance', status: 'failed' });
        }

        const sender = await User.findOne({ user_id: senderAccount.user_id });
        const recipient = await User.findOne({ user_id: recipientAccount.user_id });

        // Step 1: Create "Pending" Transactions
        const senderTransaction = new Transaction({
            transaction_id: generateTransactionId(),
            account_number,
            transaction_type: 'debit',
            transaction_method,
            amount,
            description: description || 'Fund Transfer',
            status: 'pending',
            recipient_account_number,
            balance_after_transaction: senderAccount.balance - parseFloat(amount)
        });

        const recipientTransaction = new Transaction({
            transaction_id: generateTransactionId(),
            account_number: recipient_account_number,
            transaction_type: 'credit',
            transaction_method,
            amount,
            description: description || 'Fund Transfer',
            status: 'pending',
            balance_after_transaction: recipientAccount.balance + parseFloat(amount)
        });

        await senderTransaction.save();
        await recipientTransaction.save();

        // Step 2: Process the Transfer
        senderAccount.balance -= parseFloat(amount);
        recipientAccount.balance += parseFloat(amount);

        await senderAccount.save();
        await recipientAccount.save();

        // Step 3: Mark Transactions as "Completed"
        senderTransaction.status = 'completed';
        recipientTransaction.status = 'completed';

        await senderTransaction.save();
        await recipientTransaction.save();

        // Step 4: Send Email Notifications
        await sendTransactionEmail(recipient.email, 'Credit', amount, transaction_method, recipientAccount.account_number, description, 'completed');
        await sendTransactionEmail(sender.email, 'Debit', amount, transaction_method, senderAccount.account_number, description, 'completed');

    res.status(200).json({message: 'Transfer successful', transaction_id: senderTransaction.transaction_id, updated_balance: senderAccount.balance});
    } catch (error) {
        console.error('Transfer Error:', error.message);

        // Step 5: Mark as "Failed" if an error occurs
        // await Transaction.updateOne({ transaction_id: senderTransaction.transaction_id }, { status: 'failed' });

        // await sendTransactionEmail(senderAccount.email, 'Debit', amount, transaction_method, recipientAccount.account_number, description, 'failed');

        res.status(500).json({ message: 'Transaction failed due to an error', error: error.message });
    }
};

// Function to send bank-style transaction emails
const sendTransactionEmail = async (email, type, amount, transaction_method, counterparty_account, description, status) => {
    const bankName = "XYZ Bank"; // Replace with actual bank name
    const transactionTime = new Date().toLocaleString();

    const mailOptions = {
        from: `"BankPro" <${process.env.BANK_EMAIL}>`, // Bank email as sender
        to: email,
        subject: `Transaction Alert: ₹${amount} ${type.toUpperCase()} - ${status.toUpperCase()}`,
        html: `
            <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: auto;">
                <h2 style="color: #0066cc;">${bankName} Transaction Alert</h2>
                <p>Dear Customer,</p>
                <p>Your ${type.toLowerCase()} transaction has been processed.</p>
                <hr>
                <p><strong>Transaction Details:</strong></p>
                <p><b>Amount:</b> ₹${amount}</p>
                <p><b>Type:</b> ${type.toUpperCase()}</p>
                <p><b>Method:</b> ${transaction_method}</p>
                <p><b>Account:</b> ${counterparty_account}</p>
                <p><b>Description:</b> ${description || 'N/A'}</p>
                <p><b>Status:</b> ${status.toUpperCase()}</p>
                <p><b>Date & Time:</b> ${transactionTime}</p>
                <hr>
                <p>For any queries, please contact our support at <a href="mailto:support@xyzbank.com">support@xyzbank.com</a></p>
                <p>Thank you for banking with ${bankName}.</p>
                <p><strong>XYZ Bank Team</strong></p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email} for ${type} transaction`);
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }
};



// Retrieve Last 5 Transactions of an Account
exports.getLast5Transactions = async (req, res) => {
    try {
        const { account_number } = req.params;
        const transactions = await Transaction.find({ account_number })
            .sort({ transaction_date: -1 })
            .limit(5);

        
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.getAllTransactionsForAccount = async (req, res) => {
    try {
        const { account_number } = req.params;
        const { start, end, transaction_type } = req.query;

        // Basic validation
        if (!account_number) {
            return res.status(400).json({ message: "Account number is required" });
        }

        let query = { account_number };

        // Date range filtering
        if (start || end) {
            query.transaction_date = {};
            
            if (start) {
                const startDate = new Date(start);
                if (isNaN(startDate.getTime())) {
                    return res.status(400).json({ message: "Invalid start date format" });
                }
                query.transaction_date.$gte = startDate;
            }

            if (end) {
                const endDate = new Date(end);
                if (isNaN(endDate.getTime())) {
                    return res.status(400).json({ message: "Invalid end date format" });
                }
                endDate.setHours(23, 59, 59, 999);
                query.transaction_date.$lte = endDate;
            }
        }

        // SINGLE transaction type filter (matches frontend select input)
        if (transaction_type && transaction_type !== 'all') {
            query.transaction_type = transaction_type; // Direct equality match
        }

        const transactions = await Transaction.find(query).sort({ transaction_date: -1 });

        res.status(200).json(transactions);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getAllTransaction = async (req, res) => {
    try {
        const { start, end, transaction_type } = req.query;
        let query = {}; // Initialize query object

        // Date range filtering
        if (start || end) {
            query.transaction_date = {};
            
            if (start) {
                const startDate = new Date(start);
                if (isNaN(startDate.getTime())) {
                    return res.status(400).json({ message: "Invalid start date format" });
                }
                query.transaction_date.$gte = startDate;
            }

            if (end) {
                const endDate = new Date(end);
                if (isNaN(endDate.getTime())) {
                    return res.status(400).json({ message: "Invalid end date format" });
                }
                endDate.setHours(23, 59, 59, 999); // Set end date to the last moment of the day
                query.transaction_date.$lte = endDate;
            }
        }

        // Transaction type filtering
        if (transaction_type) {
            // Convert to array if multiple types are provided as comma-separated string
            const types = transaction_type.split(',');
            query.transaction_type = { $in: types };
        }

        const transactions = await Transaction.find(query).sort({ transaction_date: -1 });

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Retrieve Transaction Details by Transaction ID
exports.getTransaction = async (req, res) => {
    try {
        const { transaction_id } = req.params;
        const transaction = await Transaction.findOne({ transaction_id });
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json({ transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.payMobileBill = async (req, res) => {
    try {
        const { account_number, mobile_number, amount, provider } = req.body;

        // Validate input
        if (!account_number || !mobile_number || !amount || !provider) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find the user's account
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check if the account has sufficient balance
        if (account.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct the amount
        account.balance -= parseFloat(amount);
        await account.save();

        // Create a transaction record
        const transaction = new Transaction({
            account_number: account.account_number,
            transaction_id: generateTransactionId(),
            transaction_type: 'Bill Payment',
            amount,
            transaction_date: new Date(),
            status: 'completed',
            transaction_method: 'BBPS',
            balance_after_transaction: account.balance,
            description:`Mobile Bill Payment ${mobile_number}/(${provider})`
        });

        await transaction.save();

        res.status(200).json({
            message: 'Mobile bill payment successful',
            transaction_id: transaction.transaction_id,
            transaction_date:transaction.transaction_date
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.payDTHBill = async (req, res) => {
    try {
        const { account_number, dth_number, amount, provider } = req.body;

        // Validate input
        if (!account_number || !dth_number || !amount || !provider) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find the user's account
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check if the account has sufficient balance
        if (account.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct the amount
        account.balance -= parseFloat(amount);
        await account.save();

        // Create a transaction record
        const transaction = new Transaction({
            account_number: account.account_number,
            transaction_id: generateTransactionId(),
            transaction_type: 'Bill Payment',
            amount,
            transaction_date: new Date(),
            status: 'completed',
            transaction_method: 'BBPS',
            balance_after_transaction: account.balance,
            description:`DTH Bill Payment ${dth_number}/(${provider})`
        });

        await transaction.save();

        res.status(200).json({
            message: 'DTH bill payment successful',
            transaction_id: transaction.transaction_id,
            transaction_date:transaction.transaction_date,
            balance: account.balance
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.payBroadbandBill = async (req, res) => {
    try {
        const { account_number, broadband_number, amount, provider } = req.body;

        // Validate input
        if (!account_number || !broadband_number || !amount || !provider) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find the user's account
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check if the account has sufficient balance
        if (account.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct the amount
        account.balance -= amount;
        await account.save();

        // Create a transaction record
        const transaction = new Transaction({
            account_number: account.account_number,
            transaction_id: generateTransactionId(),
            transaction_type: 'Bill Payment',
            amount,
            transaction_date: new Date(),
            status: 'completed',
            transaction_method: 'BBPS',
            balance_after_transaction: account.balance,
            description:`Broadband Bill Payment ${broadband_number}/(${provider})`
        });

        await transaction.save();

        res.status(200).json({
            message: 'Broadband bill payment successful',
            transaction_id: transaction._id,
            balance: account.balance
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.payElectricityBill = async (req, res) => {
    try {
        const { account_number, consumer_number, amount, provider } = req.body;

        // Validate input
        if (!account_number || !consumer_number || !amount || !provider) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find the user's account
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check if the account has sufficient balance
        if (account.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct the amount
        account.balance -= amount;
        await account.save();

        // Create a transaction record
        const transaction = new Transaction({
            account_number: account.account_number,
            transaction_id: generateTransactionId(),
            transaction_type: 'Bill Payment',
            amount,
            transaction_date: new Date(),
            status: 'completed',
            transaction_method: 'BBPS',
            balance_after_transaction: account.balance,
            description:`Electricity Bill Payment ${consumer_number}/(${provider})`
        });

        await transaction.save();

        res.status(200).json({
            message: 'Electricity bill payment successful',
            transaction_id: transaction._id,
            balance: account.balance
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.payCreditCardBill = async (req, res) => {
    try {
        const { account_number, credit_card_number, amount, provider } = req.body;

        // Validate input
        if (!account_number || !credit_card_number || !amount || !provider) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Find the user's account
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check if the account has sufficient balance
        if (account.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct the amount
        account.balance -= amount;
        await account.save();

        // Create a transaction record
        const transaction = new Transaction({
            account_number: account.account_number,
            transaction_id: generateTransactionId(),
            transaction_type: 'Bill Payment',
            amount,
            transaction_date: new Date(),
            status: 'completed',
            transaction_method: 'BBPS',
            balance_after_transaction: account.balance,
            description:`Credit Card Bill Payment ${credit_card_number}/(${provider})`
        });

        await transaction.save();

        res.status(200).json({
            message: 'Credit card bill payment successful',
            transaction_id: transaction._id,
            balance: account.balance
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.transactionToday = async (req, res) => {
    try {
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);


        // Fetch completed transactions for today
        const transactions = await Transaction.find({
            transaction_date: { $gte: startOfDay, $lte: endOfDay },
            status: { $regex: /^completed$/i }
        });

        // Check if transactions exist
        if (transactions.length === 0) {
            return res.status(404).json({ message: "No completed transactions found for today" });
        }

        let totalAmountIn = 0;
        let totalAmountOut = 0;

        transactions.forEach(transaction => {
            if (['credit', 'deposit', 'refund'].includes(transaction.transaction_type.toLowerCase())) {
                totalAmountIn += transaction.amount;
            } else if (['debit', 'withdrawal', 'transfer', 'bill payment'].includes(transaction.transaction_type.toLowerCase())) {
                totalAmountOut += transaction.amount;
            }
        });

        res.status(200).json({
            date: startOfDay.toISOString().split('T')[0],
            total_transactions: transactions.length,
            total_amount_in: totalAmountIn,
            total_amount_out: totalAmountOut,
            net_amount: totalAmountIn - totalAmountOut
        });

    } catch (error) {
        console.error('Error fetching transaction summary:', error);
        res.status(500).json({ error: 'Failed to fetch transaction summary' });
    }
};




