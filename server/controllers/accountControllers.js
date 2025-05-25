const User = require('../models/user');
const Account = require('../models/account');
const Transaction = require('../models/transaction');
const Branch = require('../models/branch'); 
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});




// Function to generate a unique 10-digit account number starting with 9911
const generateAccountNumber = () => {
    return '9911' + Math.floor(100000 + Math.random() * 900000).toString(); // 10-digit account number
};

const generateLoanAccountNumber = () => {
    return 'LLN9911' + Math.floor(100000 + Math.random() * 900000).toString(); 
};

// Create New Account
exports.createAccount = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { account_type, balance, interest_rate, status } = req.body;

        // Check if user exists
        const user = await User.findOne({ user_id });
        if (!user) {
            return res.status(400).json({ message: 'USER NOT EXISTS' });
        }

        // Generate unique account number
        var account_number = generateAccountNumber();
        if (account_type === 'loan') {
            account_number = generateLoanAccountNumber();
        }
        

        // If the user does not have a primary account, set this as primary
        if (!user.primary_account && account_type === 'savings') {
            await User.updateOne({ user_id }, { primary_account: account_number });
        }

        // Create new account
        const newAccount = new Account({
            account_number,
            user_id,
            account_type,
            balance: balance || 0,
            interest_rate,
            status
        });

        await newAccount.save();

        // Email setup
        const mailOptions = {
            from: `"BankPro" <${process.env.EMAIL}>`,
            to: user.email,
            subject: "BankPro - Your Account Application Has Been Successfully Submitted",
            html: `
                <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: auto;">
                    <h2 style="color: #0066cc;">Thank You for Choosing XYZ Bank!</h2>
                    <p>Dear <strong>${user.full_name}</strong>,</p>
                    <p>We are pleased to confirm that your application for a new account with XYZ Bank has been successfully submitted. Here are the details you provided:</p>
                    <hr>
                    <p><b>Applicant Name:</b> ${user.full_name}</p>
                    <p><b>Account Type:</b> ${account_type}</p>
                    <p><b>Branch:</b> ${user.branch_id}</p>
                    <p><b>Registered Mobile Number:</b> ${user.mobile_no}</p>
                    <p><b>Registered Email:</b> ${user.email}</p>
                    <hr>
                    <p>Our team will review your application and process it as soon as possible. You will receive another email once your account is activated.</p>
                    <p>If you need any assistance or have any questions about your application, please contact our support team at <a href="mailto:support@xyzbank.com">support@xyzbank.com</a> or call <b>1800-XYZ-BANK</b>.</p>
                    <p>Thank you for your interest in XYZ Bank. We appreciate your patience during the account opening process.</p>
                    <p><strong>Best Regards,<br>BankPro Team</strong></p>
                    <p><a href="https://www.xyzbank.com">www.xyzbank.com</a></p>
                </div>
            `
        };
        

        await transporter.sendMail(mailOptions);

        res.status(201).json(newAccount);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getAllAccounts =  async (req, res) => {
    try {
        const { user_id } = req.params;

        // Find accounts by user_id
        const accounts = await Account.find({ user_id });
        if (!accounts.length) {
            return res.status(404).json({ message: 'No accounts found for this user' });
        }

        res.status(200).json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAll =  async (req, res) => {
    try {
        const accounts = await Account.find();
        if (!accounts.length) {
            return res.status(404).json({ message: 'NO ACCOUNTS FOUND' });
        }
        res.status(200).json(accounts); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getAccount =  async (req, res) => {
    try {
        const { account_number } = req.params;

        // Find account by account_number
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ message: 'ACCOUNT NOT FOUND' });
        }
        const user = await User.findOne({ user_id: account.user_id });
        if (!user) {
            return res.status(404).json({ message: 'USER NOT FOUND' });
        }
        // const branch = await Branch.findOne({ branch_id: user.branch_id });
        // if (!branch) {
        //     return res.status(404).json({ message: 'BRANCH NOT FOUND' });
        // }

        const accountDetails = {
            user_id: user.user_id,
            full_name: user.full_name,
            account_number: account.account_number,
            account_type: account.account_type,
            balance: account.balance,
            interest_rate: account.interest_rate,
            status: account.status,
            branch_id: user.branch_id,
            opening_date: account.opening_date,
            mobile_no: user.mobile_no,
            is_verified: account.is_verified,
            email: user.email,
            aadharno: user.aadharno,
            pan_no: user.pan_no,
        };

        

        res.status(200).json(accountDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getAccountsOnStatus = async (req, res) => {
    try {
        const {status} = req.params
        const unverifiedAccounts = await Account.find({ is_verified: status });
        
        if (unverifiedAccounts.length === 0) {
            return res.status(404).json({ message: "NO ACCOUNTS FOUND" });
        }

        res.status(200).json(unverifiedAccounts);
    } catch (error) {
        console.error("Error fetching accounts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.getAccountBalance = async (req, res) => {
    try {
        const { account_number } = req.params;

        // Check if account exists
        const account = await Account.findOne({ account_number });

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Extract relevant details
        const { balance, account_type, user_id } = account;

        res.status(200).json({
            account_number,
            account_type,
            balance: `₹${balance}`,
            message: "Account balance retrieved successfully"
        });

    } catch (error) {
        console.error("Error retrieving account balance:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getPrimaryAccount = async (req, res) => {
    try {
        const { user_id } = req.params;

        // Find user by user_id
        const user = await User.findOne({ user_id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find primary account by account_number
        const account = await Account.findOne({ account_number: user.primary_account });
        if (!account) {
            return res.status(404).json({ message: 'Primary account not found' });
        }

        res.status(200).json({ 
            account_number: account.account_number,
            account_type: account.account_type,
            balance: account.balance,
            is_verified: account.is_verified})

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}







exports.getAccountStatement = async (req, res) => {
    try {
        const { account_number } = req.params;
        const { start, end } = req.query;

        // Fetch data from database
        const account = await Account.findOne({ account_number });
        if (!account) return res.status(404).json({ message: 'Account not found' });

        const user = await User.findOne({ user_id: account.user_id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const branch = await Branch.findOne({ branch_id: user.branch_id });
        if (!branch) return res.status(404).json({ message: 'Branch not found' });

        // Prepare query with date range if provided
        let query = { account_number };
        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999);
            query.transaction_date = { $gte: startDate, $lte: endDate };
        }

        const transactions = await Transaction.find(query).sort({ transaction_date: 1 });

        // PDF Configuration
        const doc = new PDFDocument({ 
            margin: 30, 
            size: 'A4',
            bufferPages: true,
            info: {
                Title: `Account Statement - ${account_number}`,
                Author: 'BankPro Financial Services',
                Creator: 'BankPro Statement Generator'
            }
        });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=BankPro_Statement_${account_number}.pdf`);
        doc.pipe(res);

        // Colors
        const primaryColor = '#2c3e50';
        const secondaryColor = '#3498db';
        const accentColor = '#e74c3c';
        const lightGray = '#f5f5f5';
        const darkGray = '#333333';
        const white = '#ffffff';

        // Add header with logo and bank info
        const addHeader = () => {
            try {
                const logoPath = path.join(__dirname, '../public/images/bank-logo.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 30, 20, { width: 60 });
                }
            } catch (e) {
                console.log('Could not load logo:', e.message);
            }

            doc.fillColor(primaryColor)
               .fontSize(16)
               .font('Helvetica-Bold')
               .text('BANKPRO FINANCIAL SERVICES', 100, 25, { align: 'left' });
            
            doc.fillColor(darkGray)
               .fontSize(8)
               .font('Helvetica')
               .text('123 Financial District, Mumbai - 400001', 100, 45)
               .text('Phone: +91 22 12345678 | Email: info@bankpro.com', 100, 55)
               .text(`Statement Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
            
            // Add decorative line
            doc.moveTo(30, 70)
               .lineTo(570, 70)
               .lineWidth(1)
               .stroke(primaryColor);
        };

        // Add footer with page numbers
        const addFooter = () => {
            const pageCount = doc.bufferedPageRange().count;
            
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                
                // Footer line
                doc.moveTo(30, 800)
                   .lineTo(570, 800)
                   .lineWidth(0.5)
                   .stroke(lightGray);
                
                // Page number
                doc.fillColor(darkGray)
                   .fontSize(8)
                   .text(`Page ${i + 1} of ${pageCount}`, 30, 810, {
                       align: 'left'
                   });
                
                // Confidential notice
                doc.text('CONFIDENTIAL - Customer Copy', 570, 810, {
                    align: 'right'
                });
            }
        };

        // Format date as DD/MM/YYYY
        const formatDate = (date) => {
            const d = new Date(date);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };

        // Add header to first page
        addHeader();

        // Main title
        doc.fillColor(primaryColor)
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('ACCOUNT STATEMENT', { 
               align: 'center',
               underline: false,
               paragraphGap: 5
           })
           .moveDown(0.5);

        // Statement period
        const periodText = start && end 
            ? `Statement Period: ${formatDate(start)} to ${formatDate(end)}`
            : 'Complete Transaction History';
        
        doc.fillColor(secondaryColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(periodText, { 
               align: 'center',
               paragraphGap: 10
           });

        // Account information section
        doc.fillColor(primaryColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Account Summary', { 
               underline: false,
               paragraphGap: 5
           });
        
        // Account info box
        doc.lineWidth(0.5)
           .rect(30, 140, 540, 60)
           .stroke(lightGray)
           .fill(lightGray);
        
        doc.fillColor(darkGray)
           .fontSize(10)
           .text('Account Number:', 40, 150)
           .font('Helvetica-Bold')
           .text(account.account_number, 150, 150);
        
        doc.font('Helvetica')
           .text('Account Type:', 40, 170)
           .font('Helvetica-Bold')
           .text(account.account_type.toUpperCase(), 150, 170);
        
        doc.font('Helvetica')
           .text('Current Balance:', 350, 150)
           .font('Helvetica-Bold')
           .fillColor(account.balance >= 0 ? 'green' : 'red')
           .text(`₹${account.balance.toFixed(2)}`, 460, 150)
           .fillColor(darkGray);
        
        doc.font('Helvetica')
           .text('Account Status:', 350, 170)
           .font('Helvetica-Bold')
           .text(account.status.toUpperCase(), 460, 170);

        // Customer information section
        doc.fillColor(primaryColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Customer Information', 30, 220, { 
               underline: false,
               paragraphGap: 5
           });
        
        // Customer info box
        doc.lineWidth(0.5)
           .rect(30, 235, 540, 80)
           .stroke(lightGray)
           .fill(lightGray);
        
        doc.fillColor(darkGray)
           .fontSize(10)
           .text('Customer Name:', 40, 245)
           .font('Helvetica-Bold')
           .text(user.full_name, 150, 245);
        
        doc.font('Helvetica')
           .text('Customer ID:', 40, 265)
           .font('Helvetica-Bold')
           .text(user._id, 150, 265);
        
        doc.font('Helvetica')
           .text('Email:', 40, 285)
           .font('Helvetica-Bold')
           .text(user.email, 150, 285);
        
        doc.font('Helvetica')
           .text('Phone:', 350, 245)
           .font('Helvetica-Bold')
           .text(user.mobile_no, 460, 245);
        
        doc.font('Helvetica')
           .text('PAN:', 350, 265)
           .font('Helvetica-Bold')
           .text(user.pan_number || 'Not Provided', 460, 265);
        
        doc.font('Helvetica')
           .text('Date of Birth:', 350, 285)
           .font('Helvetica-Bold')
           .text(user.dob ? formatDate(user.dob) : 'Not Provided', 460, 285);

        // Branch information section
        doc.fillColor(primaryColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Branch Information', 30, 335, { 
               underline: false,
               paragraphGap: 5
           });
        
        // Branch info box
        doc.lineWidth(0.5)
           .rect(30, 350, 540, 60)
           .stroke(lightGray)
           .fill(lightGray);
        
        doc.fillColor(darkGray)
           .fontSize(10)
           .text('Branch Name:', 40, 360)
           .font('Helvetica-Bold')
           .text(branch.branch_name, 150, 360);
        
        doc.font('Helvetica')
           .text('Branch Code:', 40, 380)
           .font('Helvetica-Bold')
           .text(branch.branch_code || 'N/A', 150, 380);
        
        doc.font('Helvetica')
           .text('IFSC Code:', 350, 360)
           .font('Helvetica-Bold')
           .text(branch.ifsc_code, 460, 360);
        
        doc.font('Helvetica')
           .text('Branch Address:', 350, 380)
           .font('Helvetica-Bold')
           .text(formatAddress(branch.address), 460, 380, { width: 150 });

        // Transaction history section
        doc.fillColor(primaryColor)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Transaction History', { 
               align: 'center',
               underline: false,
               paragraphGap: 10
           });

        // Transaction table configuration
        const columns = [
            { title: 'Date', width: 70, align: 'left' },
            { title: 'Txn ID', width: 80, align: 'left' },
            { title: 'Description', width: 200, align: 'left' },
            { title: 'Type', width: 60, align: 'center' },
            { title: 'Amount (₹)', width: 80, align: 'right' },
            { title: 'Balance (₹)', width: 80, align: 'right' }
        ];
        
        let currentY = doc.y;
        
        // Table header background
        doc.fillColor(primaryColor)
           .rect(30, currentY, 540, 20)
           .fill();
        
        // Column headers
        doc.fillColor(white)
           .fontSize(10)
           .font('Helvetica-Bold');
        
        let x = 30;
        columns.forEach(col => {
            doc.text(col.title, x + 5, currentY + 5, { 
                width: col.width - 10, 
                align: col.align 
            });
            x += col.width;
        });
        
        currentY += 20;

        // Transaction rows
        doc.fontSize(9).font('Helvetica');
        
        let alternate = false;
        transactions.forEach((txn, index) => {
            // Alternate row colors
            if (alternate) {
                doc.fillColor(lightGray)
                   .rect(30, currentY, 540, 20)
                   .fill();
            }
            alternate = !alternate;
            
            doc.fillColor(darkGray);
            
            // Date
            doc.text(formatDate(txn.transaction_date), 35, currentY + 5, { 
                width: columns[0].width - 10, 
                align: columns[0].align 
            });
            
            // Transaction ID (truncated if too long)
            const txnId = txn.transaction_id ? 
                (txn.transaction_id.length > 8 ? txn.transaction_id.substring(0, 6) + '...' : txn.transaction_id) : 
                '-';
            doc.text(txnId, 105, currentY + 5, { 
                width: columns[1].width - 10, 
                align: columns[1].align 
            });
            
            // Description (with ellipsis if too long)
            const description = txn.description || '-';
            doc.text(description, 185, currentY + 5, { 
                width: columns[2].width - 10, 
                align: columns[2].align,
                ellipsis: true
            });
            
            // Type with color coding
            doc.fillColor(txn.transaction_type === 'credit' ? 'green' : accentColor)
               .text(txn.transaction_type.toUpperCase(), 385, currentY + 5, { 
                   width: columns[3].width - 10, 
                   align: columns[3].align 
               });
            
            // Amount (right aligned)
            doc.fillColor(darkGray)
               .text(`₹${txn.amount.toFixed(2)}`, 465, currentY + 5, { 
                   width: columns[4].width - 10, 
                   align: columns[4].align 
               });
            
            // Balance (right aligned)
            doc.text(`₹${txn.balance_after_transaction.toFixed(2)}`, 545, currentY + 5, { 
                width: columns[5].width - 10, 
                align: columns[5].align 
            });
            
            currentY += 20;
            
            // Add page if we're running out of space
            if (currentY > 750 && index < transactions.length - 1) {
                doc.addPage();
                addHeader();
                currentY = 120;
                alternate = false;
                
                // Repeat table headers on new page
                doc.fillColor(primaryColor)
                   .rect(30, currentY, 540, 20)
                   .fill();
                
                doc.fillColor(white)
                   .fontSize(10)
                   .font('Helvetica-Bold');
                
                x = 30;
                columns.forEach(col => {
                    doc.text(col.title, x + 5, currentY + 5, { 
                        width: col.width - 10, 
                        align: col.align 
                    });
                    x += col.width;
                });
                
                currentY += 20;
            }
        });

        // Summary page
        doc.addPage();
        addHeader();
        
        doc.fillColor(primaryColor)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Statement Summary', { 
               align: 'center',
               paragraphGap: 10
           });
        
        // Opening and closing balance
        const openingBalance = transactions.length > 0 
            ? transactions[0].balance_after_transaction - transactions[0].amount 
            : account.balance;
        
        doc.fillColor(darkGray)
           .fontSize(12)
           .text('Opening Balance:', 100, 150)
           .font('Helvetica-Bold')
           .text(`₹${openingBalance.toFixed(2)}`, 250, 150);
        
        doc.font('Helvetica')
           .text('Closing Balance:', 100, 175)
           .font('Helvetica-Bold')
           .text(`₹${account.balance.toFixed(2)}`, 250, 175);
        
        // Transaction summary
        const creditTxns = transactions.filter(t => t.transaction_type === 'credit');
        const debitTxns = transactions.filter(t => t.transaction_type === 'debit');
        const totalCredits = creditTxns.reduce((sum, t) => sum + t.amount, 0);
        const totalDebits = debitTxns.reduce((sum, t) => sum + t.amount, 0);
        const netChange = totalCredits - totalDebits;
        
        doc.font('Helvetica')
           .text('Total Credits:', 100, 200)
           .font('Helvetica-Bold')
           .text(`${creditTxns.length} transactions`, 250, 200)
           .text(`₹${totalCredits.toFixed(2)}`, 400, 200, { align: 'right' });
        
        doc.font('Helvetica')
           .text('Total Debits:', 100, 225)
           .font('Helvetica-Bold')
           .text(`${debitTxns.length} transactions`, 250, 225)
           .text(`₹${totalDebits.toFixed(2)}`, 400, 225, { align: 'right' });
        
        doc.font('Helvetica')
           .text('Net Change:', 100, 250)
           .font('Helvetica-Bold')
           .text(`₹${netChange.toFixed(2)}`, 250, 250)
           .fillColor(netChange >= 0 ? 'green' : accentColor)
           .text(`(${netChange >= 0 ? '+' : ''}${netChange.toFixed(2)})`, 400, 250, { align: 'right' })
           .fillColor(darkGray);

        // Terms and conditions
        doc.fillColor(primaryColor)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Terms and Conditions', 30, 300, { underline: false });
        
        doc.fillColor(darkGray)
           .fontSize(10)
           .list([
               'This is a computer generated statement and does not require a signature.',
               'Please report any discrepancies within 15 days of receiving this statement.',
               'BankPro is not responsible for unauthorized transactions if not reported within 30 days.',
               'The bank reserves the right to correct any errors in this statement.',
               'For any queries, please contact your branch or call our customer care.'
           ], 40, 320, { bulletRadius: 2, textIndent: 10, lineGap: 5 });

        // Signature area
        doc.moveDown(5)
           .text('For BankPro Financial Services', { align: 'right' })
           .moveDown(2)
           .text('_________________________', { align: 'right' })
           .text('Authorized Signatory', { align: 'right', fontSize: 10 });

        // Add footer to all pages
        addFooter();

        doc.end();
    } catch (error) {
        console.error('Error generating statement:', error);
        res.status(500).json({ error: error.message });
    }
};

function formatAddress(address) {
    if (!address) return 'N/A';
    
    const parts = [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country
    ].filter(Boolean);
    
    return parts.join(', ');
}

exports.updateAccount = async (req, res) => {
    try {
        const { account_number } = req.params;
        const update = req.body;

        // Check if account exists and update
        const updatedAccount = await Account.findOneAndUpdate(
            { account_number },
            { $set: update },
            { new: true, runValidators: true } // Return updated document and enforce validation
        );

        if (!updatedAccount) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const account = await Account.findOne({ account_number: account_number });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Fetch user details for email
        const user = await User.findOne({ user_id: account.user_id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send account opening email
        const mailOptions = {
            from: `"BankPro" <${process.env.EMAIL}>`, // Your Gmail address
            to: user.email,
            subject: "Account Opening Confirmation",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd;">
                    <h2 style="color: #2c3e50;">Account Opening Confirmation</h2>
                    <p>Dear ${user.full_name},</p>
                    <p>We are pleased to inform you that your account has been successfully opened.</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #3498db; margin-top: 0;">Account Details</h3>
                        <p><strong>Account Number:</strong> ${account_number}</p>
                        <p><strong>Account Type:</strong> ${updatedAccount.account_type}</p>
                        <p><strong>Activation Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>Thank you for choosing our bank. If you have any questions, please contact our support team at support@example.com.</p>
                    
                    <p style="margin-top: 30px; color: #7f8c8d;">
                        Best regards,<br>
                        The Bank Team
                    </p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(200).json({ message: 'Account updated successfully', account: updatedAccount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// In your backend routes
exports.mail = async (req, res) => {
    try {
        const { to, userName, accountNumber, accountType } = req.body;

        const mailOptions = {
            from: `"BankPro" <${process.env.EMAIL}>`,
            to: to,
            subject: "Account Successfully Activated",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd;">
                    <h2 style="color: #2c3e50;">Account Activation Confirmation</h2>
                    <p>Dear ${userName},</p>
                    <p>We are pleased to inform you that your account has been successfully verified and activated.</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #3498db; margin-top: 0;">Account Details</h3>
                        <p><strong>Account Number:</strong> ${accountNumber}</p>
                        <p><strong>Account Type:</strong> ${accountType}</p>
                        <p><strong>Activation Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>You can now enjoy full access to all banking services associated with your account.</p>
                    <p>If you have any questions, contact our support team at support@bank.com or call 1800-123-4567.</p>
                    
                    <p style="margin-top: 30px; color: #7f8c8d;">
                        Best regards,<br>
                        The Bank Team
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { account_number } = req.params;

        // Check if account exists
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Delete the account
        await Account.deleteOne({ account_number });

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.countAccountsEachType = async (req, res) => {
    try {
        const accountType = req.params.account_type; // Get account type from request parameters
        
        // If account type is specified in header, return count for that type only
        if (accountType) {
            // Validate account type
            if (!['savings', 'current', 'loan'].includes(accountType)) {
                return res.status(400).json({ error: 'Invalid account type. Must be savings, current, or loan.' });
            }
            
            const count = await Account.countDocuments({ account_type: accountType });
            
            return res.status(200).json({
                count
            });
        }
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



     
