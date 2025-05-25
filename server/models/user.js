const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
   username: { 
        type: String, 
        required: true, 
        unique: true 
   },
   password: { 
        type: String, 
        required: true 
   },
   user_id: {
        type: String,
        required: true,
        unique: true
   },
  full_name: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['customer', 'employee', 'admin'],
    default: 'customer'
  },
  branch_id: { 
    type: String, 
    ref: 'Branch' 
  },
  date_of_birth: { 
    type: Date, 
    required: true 
  },
  mobile_no: { 
    type: String, 
    required: true,
    unique: true
  },
  email: { 
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
  aadhar_number: { 
    type: String, 
    required: true, 
    unique: true 
  },
  PAN_number: { 
    type: String, 
    unique: true, 
    sparse: true // Optional field
  },
  primary_account: {
    type: String,
    ref: 'Account'
  },
  last_login: { 
    type: Date 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
