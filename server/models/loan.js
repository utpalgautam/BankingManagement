const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoanSchema = new Schema({
  account_number: { 
    type: String, 
    required: true, 
    ref: 'Account' 
  },
  loan_type: { 
    type: String, 
    required: true,
    enum: ['home loan', 'car loan', 'personal loan', 'education loan', 'business loan']
  },
  amount: { 
    type: Number, 
    required: true,
    min: 1000 // Minimum loan amount
  },
  interest_rate: { 
    type: Number, 
    required: true,
    min: 1 // Minimum interest rate
  },
  term_months: { 
    type: Number, 
    required: true,
    min: 1 // Ensures at least a 1-month loan
  },
  due_date: { 
    type: Date, 
  },
  total_amount_paid: { 
    type: Number, 
    default: 0 
  },
  remaining_balance: { 
    type: Number, 
  },
  collateral: { 
    type: {
      type: String, 
      enum: ['property', 'vehicle', 'gold', 'other'], 
    },
    estimated_value: Number,
    description: String
  },
  monthly_payment: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approved_by: { 
    type: String, 
    ref: 'User' // Refers to the bank manager/admin approving the loan
  },
  rejected_by: {
    type: String, 
    ref: 'User' // Refers to the bank manager/admin rejecting the
  },
  approval_date: { 
    type: Date 
  },
  rejection_date: { 
    type: Date 
  },
  rejection_reason: { 
    type: String 
  },
  disbursed_date: { 
    type: Date 
  }
});

const Loan = mongoose.model('Loan', LoanSchema);
module.exports = Loan;
