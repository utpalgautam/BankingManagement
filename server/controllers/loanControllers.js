const User = require('../models/user');
const Loan = require('../models/loan');
const Account = require('../models/account');
const bcrypt = require('bcrypt');

// Function to generate a unique 10-digit account number starting with 9911
const generateAccountNumber = () => {
    return '9911' + Math.floor(100000 + Math.random() * 900000).toString(); // 10-digit account number
};

// Create New Account
exports.requestLoan = async (req, res) => {
    try {
        const { account_number } = req.params;
        const { loan_type, amount, interest_rate, term_months, collateral } = req.body;

        if (!loan_type || !amount || !interest_rate || !term_months) {
            return res.status(400).json({ error: 'All loan details are required' });
        }

        // Check if account exists
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Create loan request (NO due_date YET)
        const newLoan = new Loan({
            account_number,
            loan_type,
            amount,
            interest_rate,
            term_months,
            total_amount_paid: 0,
            remaining_balance: amount,
            collateral,
            monthly_payment: 0, // Not calculated yet
            approved_by: null,
            approval_date: null,
            disbursed_date: null,
            status: "pending" // Still pending approval
        });

        await newLoan.save();

        return res.status(201).json({
            message: 'Loan request submitted successfully. Awaiting approval.',
            account_number: newLoan.account_number,
            status: newLoan.status
        });

    } catch (error) {
        console.error('Loan Request Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.approveLoan = async (req, res) => {
    try {
        const { account_number } = req.params;
        const { approved_by } = req.body;

        if (!approved_by) {
            return res.status(400).json({ error: 'Approver ID is required' });
        }

        // Check if loan exists
        const loan = await Loan.findOne({ account_number });
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        const account = await Account.findOne({ account_number });
        if (!account) { 
            return res.status(404).json({ error: 'Account not found' });
        }

        // Ensure loan is pending
        if (loan.status !== "pending") {
            return res.status(400).json({ error: 'Loan is already approved or rejected' });
        }

        // Validate approver (must be an employee/admin)
        const approver = await User.findOne({ user_id: approved_by, role: { $in: ['manager', 'employee'] } });
        if (!approver) {
            return res.status(403).json({ error: 'Invalid approver. Only employees/admins can approve loans' });
        }

        // Calculate monthly payment using EMI formula
        const principal = loan.amount;
        const monthlyInterestRate = loan.interest_rate / 100 / 12;
        const numberOfMonths = loan.term_months;

        let monthlyPayment;
        if (monthlyInterestRate === 0) {
            monthlyPayment = principal / numberOfMonths;
        } else {
            monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfMonths)) / 
                             (Math.pow(1 + monthlyInterestRate, numberOfMonths) - 1);
        }

        monthlyPayment = parseFloat(monthlyPayment); // Round to 2 decimal places

        // Set due date (first EMI due after 1 month from approval)
        const due_date = new Date();
        due_date.setMonth(due_date.getMonth() + 1);

        // Update loan details
        loan.status = "approved";
        loan.monthly_payment = monthlyPayment;
        loan.approved_by = approved_by;
        loan.approval_date = new Date();
        loan.disbursed_date = new Date();
        loan.due_date = due_date;
        await loan.save();

        account.balance += parseFloat(loan.amount); // Increase account balance by loan amount
        await account.save();

        return res.status(200).json({
            message: 'Loan approved successfully',
            loan_account_number: loan.account_number,
            status: loan.status,
            monthly_payment: loan.monthly_payment,
            disbursed_date: loan.disbursed_date,
            due_date: loan.due_date
        });

    } catch (error) {
        console.error('Loan Approval Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.rejectLoan = async (req, res) => {
    try {
        const { account_number } = req.params;
        const { rejected_by, rejection_reason } = req.body;

        if (!rejected_by || !rejection_reason) {
            return res.status(400).json({ error: 'Approver ID and rejection reason are required' });
        }

        // Check if loan exists
        const loan = await Loan.findOne({ account_number });
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        // Ensure loan is still pending
        if (loan.status !== "pending") {
            return res.status(400).json({ error: 'Loan is already approved or rejected' });
        }

        // Validate approver (must be an employee/admin)
        const approver = await User.findOne({ user_id: rejected_by, role: { $in: ['manager', 'employee'] } });
        if (!approver) {
            return res.status(403).json({ error: 'Invalid approver. Only employees/admins can reject loans' });
        }

        // Update loan status to rejected
        loan.status = "rejected";
        loan.rejected_by = rejected_by;
        loan.rejection_reason = rejection_reason;
        loan.rejection_date = new Date();
        await loan.save();

        return res.status(200).json({
            message: 'Loan rejected successfully',
            status: loan.status,
            rejected_by: loan.rejected_by,
            rejection_reason: loan.rejection_reason,
            rejection_date: loan.rejection_date
        });

    } catch (error) {
        console.error('Loan Rejection Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};



// Retrieve Loan Account Information
exports.getLoanAccount = async (req, res) => {
    try {
        const { account_number } = req.params;

        // Find the loan account
        const loanAccount = await Account.findOne({ account_number, account_type: 'loan' });
        if (!loanAccount) {
            return res.status(404).json({ message: 'Loan account not found' });
        }

        // Find loan details
        const loanDetails = await Loan.findOne({ account_number });
        if (!loanDetails) {
            return res.status(404).json({ message: 'Loan details not found' });
        }

        res.status(200).json(loanDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve All Loan Accounts
exports.getAllLoanAccounts = async (req, res) => {
    try {
        const loanAccounts = await Account.find({ account_type: 'loan' });
        res.status(200).json(loanAccounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

