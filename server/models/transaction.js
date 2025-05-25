const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  transaction_id: { 
    type: String, 
    required: true, 
    unique: true 
  },  
  account_number: { 
    type: String, 
    required: true, 
    ref: 'Account' 
  },
  transaction_type: { 
    type: String,
    enum: ['credit', 'debit', 'transfer', 'withdrawal', 'deposit', 'refund', 'Bill Payment'],
    required: true 
  },
  transaction_method: { 
    type: String, 
    enum: ['NEFT', 'RTGS', 'IMPS', 'UPI', 'cash', 'cheque', 'internal','BBPS'],
    required: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 1 // Prevents zero or negative transactions
  },
  transaction_date: { 
    type: Date, 
    default: Date.now 
  },
  description: { 
    type: String 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'completed', 'failed', 'reversed', 'disputed', 'on-hold'], 
    default: 'pending'
  },
  recipient_account_number: { 
    type: String, 
    ref: 'Account' 
  },
  balance_after_transaction: { 
    type: Number, 
    required: true 
  }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
module.exports = Transaction;
