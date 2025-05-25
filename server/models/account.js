const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountSchema = new Schema({
  account_number: { 
    type: String, 
    required: true, 
    unique: true 
  },
  user_id: { 
    type: String, 
    ref: 'User', 
    required: true 
  },
  account_type: { 
    type: String,
    enum: ['savings', 'current', 'fixed deposit', 'loan'],
    required: true 
  },
  balance: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  opening_date: { 
    type: Date, 
    default: Date.now 
  },
  closing_date: { 
    type: Date 
  },
  last_transaction_date: { 
    type: Date, 
  },
  interest_rate: { 
    type: Number, 
    default: 3 
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'dormant', 'closed'],
    default: 'active' 
  }
});

const Account = mongoose.model('Account', AccountSchema);
module.exports = Account;
