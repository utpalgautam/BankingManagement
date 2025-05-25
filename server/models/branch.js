const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BranchSchema = new Schema({
  branch_id: {    
    type: String, 
    required: true, 
    unique: true 
  },
  branch_name: { 
    type: String, 
    required: true 
  },
  ifsc_code: { 
    type: String, 
    required: true, 
    unique: true 
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  manager_id: { 
    type: String, 
    ref: 'User' 
  },
  contact_number: { 
    type: String, 
    required: true 
  },
  opening_date: { 
    type: Date, 
    required: true 
  }
});

const Branch = mongoose.model('Branch', BranchSchema);
module.exports = Branch;
