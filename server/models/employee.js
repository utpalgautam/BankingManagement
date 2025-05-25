const mongoose = require('mongoose');
const { ref, dash } = require('pdfkit');
const Schema = mongoose.Schema;

const EmployeeSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    salary: {
        type: Number,
        required: true,
        min: 10000
    },
    date_of_joining: {
        type: Date,
        default: Date.now
    }
});

const Employee = mongoose.model('Employee', EmployeeSchema);
module.exports = Employee;