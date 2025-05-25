const User = require('../models/user');
const Account = require('../models/account');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const verificationCodes = {};

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const generateUserId = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

exports.register = async (req, res) => {
    try {
        const { username, password, full_name, date_of_birth, mobile_no, email, address, aadhar_number, PAN_number, role, branch_id } = req.body;

        // Check if user already exists
        let existingUser = await User.findOne({ 
            $or: [{ username }, { email }, { mobile_no }, { aadhar_number }] 
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User with given details already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword,
            user_id: generateUserId(),
            full_name,
            date_of_birth,
            mobile_no,
            email,
            address,
            aadhar_number,
            PAN_number,
            role: role || 'customer',
            branch_id,
            created_at: new Date(),
            updated_at: new Date()
        });

        await newUser.save();

        if (password === `${username}1234`) {
            // Send Registration Confirmation Email with Default Password
            await sendRegistrationEmail2(newUser, password);
        } else {
        // Send Registration Confirmation Email
        await sendRegistrationEmail1(newUser);
        }

        res.status(201).json({ message: 'User registered successfully', user_id: newUser.user_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Function to send a professional bank-style registration email
const sendRegistrationEmail1 = async (user) => {
    const bankName = "XYZ Bank"; // Replace with actual bank name
    const mailOptions = {
        from: `"XYZ Bank" <${process.env.BANK_EMAIL}>`,
        to: user.email,
        subject: `Welcome to ${bankName} - Account Successfully Created! 🎉`,
        html: `
            <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: auto;">
                <h2 style="color: #0066cc;">Welcome to ${bankName}!</h2>
                <p>Dear <strong>${user.full_name}</strong>,</p>
                <p>We are delighted to inform you that your account has been successfully created with ${bankName}. Here are your registered details:</p>
                <hr>
                <p><b>Customer ID:</b> ${user.user_id}</p>
                <p><b>Mobile Number:</b> ${user.mobile_no}</p>
                <p><b>Email:</b> ${user.email}</p>
                <hr>
                <p>Use these details to proceed with further account-related processes.</p>
                <p>If you need any assistance, feel free to contact our support team at <a href="mailto:support@xyzbank.com">support@xyzbank.com</a> or call <b>1800-XYZ-BANK</b>.</p>
                <p>Thank you for choosing ${bankName}. We look forward to serving you!</p>
                <p><strong>${bankName} Team</strong></p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Registration email sent to ${user.email}`);
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }
};


const sendRegistrationEmail2 = async (user, password) => {
    const bankName = "XYZ Bank"; // Replace with actual bank name
    const mailOptions = {
        from: `"XYZ Bank" <${process.env.BANK_EMAIL}>`,
        to: user.email,
        subject: `Welcome to ${bankName} - Account Successfully Created! 🎉`,
        html: `
            <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: auto;">
                <h2 style="color: #0066cc;">Welcome to ${bankName}!</h2>
                <p>Dear <strong>${user.full_name}</strong>,</p>
                <p>We are delighted to inform you that your account has been successfully created with ${bankName}. Here are your registered details:</p>
                <hr>
                <p><b>Customer ID:</b> ${user.user_id}</p>
                <p><b>Mobile Number:</b> ${user.mobile_no}</p>
                <p><b>Email:</b> ${user.email}</p>
                <p><b>Default Password:</b> ${password}</p>
                <hr>
                <p><strong>Important:</strong> For security reasons, please change your default password when you first log in to your account.</p>
                <p>Use these details to proceed with further account-related processes.</p>
                <p>If you need any assistance, feel free to contact our support team at <a href="mailto:support@xyzbank.com">support@xyzbank.com</a> or call <b>1800-XYZ-BANK</b>.</p>
                <p>Thank you for choosing ${bankName}. We look forward to serving you!</p>
                <p><strong>${bankName} Team</strong></p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Registration email sent to ${user.email}`);
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }
};




// exports.login = async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         // Find user
//         const user = await User.findOne({ username });
//         if (!user) {
//             return res.status(400).json({ message: "Invalid credentials" });
//         }

//         // Compare password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: "Invalid credentials" });
//         }

//         // Directly Generate JWT Token Without OTP
//         const token = jwt.sign(
//             { user_id: user.user_id, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: "1h" }
//         );

//         res.json({ token, role: user.role, user_id:user.user_id,message: "Login successful" });

//         // OTP Code - Commented Out for Testing
//         /*
//         const email = user.email;
//         const verificationCode = generateVerificationCode();
//         verificationCodes[username] = verificationCode; // Store OTP temporarily

//         const mailOptions = {
//             from: process.env.EMAIL,
//             to: email,
//             subject: "Verification Code",
//             text: `Your verification code is ${verificationCode}`,
//         };

//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 return res.status(500).json({ error: error.message });
//             }
//             res.json({ message: "Verification code sent to email. Please verify to continue.", email });
//         });
//         */
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const email = user.email;
        const verificationCode = generateVerificationCode();
        verificationCodes[username] = verificationCode; // Store OTP temporarily

        // Email options
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Verification Code",
            text: `Your verification code is ${verificationCode}`,
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            res.json({ message: "Verification code sent to email. Please verify to continue.", email });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const verificationAttempts = {}; // Store failed OTP attempts per user

exports.verifyCode = async (req, res) => {
    try {
        const { username, verificationCode } = req.body;

        // Initialize attempts if not set
        if (!verificationAttempts[username]) {
            verificationAttempts[username] = 0;
        }

        // Check if OTP exists
        if (!verificationCodes[username]) {
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        // Check if OTP is correct
        if (verificationCodes[username] !== verificationCode) {
            verificationAttempts[username]++; // Increase attempt count

            if (verificationAttempts[username] >= 3) {
                // Delete OTP and reset attempts after 3 failures
                delete verificationCodes[username];
                delete verificationAttempts[username];
                return res.status(400).json({ message: "OTP expired after 3 failed attempts. Request a new one." });
            }

            return res.status(400).json({ 
                message: `Invalid OTP. You have ${3 - verificationAttempts[username]} attempts left.` 
            });
        }

        // OTP is correct - Generate JWT Token
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const data = {
            user_id: user.user_id,
            role: user.role
        }

        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Remove OTP and reset attempts after successful verification
        delete verificationCodes[username];
        delete verificationAttempts[username];

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user
        = await
        User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const verificationCode = generateVerificationCode();
        verificationCodes[email] = verificationCode; // Store OTP temporarily

        // Email options
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Reset Password",
            text: `Your verification code is ${verificationCode}`,
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            res.json({ message: "Verification code sent to email. Please verify to continue.", email , verificationCode });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { email, verificationCode, newPassword } = req.body;

        // Check if OTP exists
        if (!verificationCodes[email]) {
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        // Check if OTP is correct
        if (verificationCodes[email] !== verificationCode) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await User.updateOne({ email }, { password: hashedPassword });

        // Remove OTP after successful password reset
        delete verificationCodes[email];

        // Email content
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset Successful',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color:rgb(76, 122, 175);">Your Password Has Been Reset</h2>
                    <p>Hello,</p>
                    <p>Your password has been successfully reset. If you did not make this change, please contact support immediately.</p>
                    <p>Thank you for using our services.</p>
                    <br>
                    <p>Best Regards,<br>Your Bank Team</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.changePassword = async (req, res) => {
    try {
        const { user_id, oldPassword, newPassword } = req.body;

        // Find user
        const user = await User.findOne({ user_id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }   

        // Compare old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid old password" });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({ message: "New password cannot be the same as old password" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        
        // Email content
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Password Changed Successfully',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color:rgb(76, 122, 175);">Your Password Has Been Changed</h2>
                    <p>Hello <b>${user.full_name}</b>,</p>
                    <p>Your password has been successfully changed.</p>
                    <p>If you did not make this change, please contact support immediately.</p>
                    <p>Thank you for using our services.</p>
                    <br>
                    <p>Best Regards,<br>Your Bank Team</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ message: "Password changed successfully & notification email sent." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.changePrimary = async (req, res) => {
    try {
        const { user_id, account_number } = req.body;
        // Find user    

        const user = await User.findOne({ user_id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }   

        // Find account
        const account = await Account.findOne({ account_number });
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }
        if (account.user_id !== user.user_id) {
            return res.status(403).json({ message: "Account does not belong to this user" });
        }

        // Update primary account
        const updatedUser = await User.findOneAndUpdate(
            { user_id },
            { primary_account: account_number },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }       

        // Email content
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Primary Account Changed Successfully',    
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color:rgb(76, 122, 175);">Your Primary Account Has Been Changed</h2>
                    <p>Hello <b>${user.full_name}</b>,</p>
                    <p>Your primary account has been successfully changed to account number ${account_number}.</p>
                    <p>If you did not make this change, please contact support immediately.</p>
                    <p>Thank you for using our services.</p>
                    <br>
                    <p>Best Regards,<br>Your Bank Team</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);
        res.json({ message: "Primary account changed successfully & notification email sent." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
        


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const user = await User.findOne({ user_id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const profileDetails = {
            user_id: user.user_id,
            username: user.username,
            full_name: user.full_name,
            date_of_birth: user.date_of_birth,
            mobile_no: user.mobile_no,
            email: user.email,
            address: user.address,
            aadhar_number: user.aadhar_number,
            PAN_number: user.PAN_number,
            branch_id: user.branch_id,
            role: user.role,
            primary_account: user.primary_account,
        };

        res.json(profileDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const { user_id } = req.params; // Get user_id from URL parameters
        const updateData = req.body;

        // Validate request body
        if (!Object.keys(updateData).length) {
            return res.status(400).json({ error: 'No update data provided' });
        }

        // Find and update user (use findOneAndUpdate if user_id is not _id)
        const updatedUser = await User.findOneAndUpdate({ user_id: user_id }, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }


        // Email content
        const mailOptions = {
            from: process.env.EMAIL,
            to: updatedUser.email,
            subject: 'Profile Updated Successfully',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color:rgb(76, 122, 175);">Your Profile Has Been Updated</h2>
                    <p>Hello <b>${updatedUser.full_name}</b>,</p>
                    <p>Your profile details have been successfully updated.</p>
                    <p>If you did not make these changes, please contact support immediately.</p>
                    <p>Thank you for using our services.</p>
                    <br>
                    <p>Best Regards,<br>Your Bank Team</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'User details updated successfully & notification email sent.', updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user details' });
    }
};




exports.getAccountDetails = async (req, res) => {
    try {
        // Get token from request header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid Token" });
        }

        // Find the account using the user ID from token
        const account = await Account.findOne({ user_id: decoded.user_id });
        const user = await User.findOne({ user_id: decoded.user_id });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        // Send account details
        res.status(200).json({
            success: true,
            name: user.full_name,
            accountNumber: account.account_number,
            balance: account.balance,
            branch: account.branch,
            accountType: account.account_type,
            createdAt: account.createdAt,
        });

    } catch (error) {
        console.error("Error fetching account details:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { user_id } = req.params; // Get user_id from URL parameters

        // Find and delete user
        const deletedUser = await User.findOneAndDelete({ user_id: user_id });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find all accounts linked to this user
        const userAccounts = await Account.find({ user_id: user_id });

        if (userAccounts.length === 0) {
            return res.status(200).json({
                message: 'User deleted successfully. No associated accounts found.',
                deletedUser
            });
        }

        // Extract account numbers
        const accountNumbers = userAccounts.map(account => account.account_number);

        // Delete all accounts linked to this user
        const deletedAccounts = await Account.deleteMany({ user_id: user_id });

        // Delete loan details for loan accounts
        const loanAccounts = userAccounts.filter(account => account.account_type === 'loan');
        let deletedLoansCount = 0;

        if (loanAccounts.length > 0) {
            const loanAccountNumbers = loanAccounts.map(account => account.account_number);
            const deletedLoans = await Loan.deleteMany({ account_number: { $in: loanAccountNumbers } });
            deletedLoansCount = deletedLoans.deletedCount;
        }

        res.status(200).json({
            message: 'User, associated accounts, and loans (if any) deleted successfully',
            deletedUser,
            deletedAccountsCount: deletedAccounts.deletedCount,
            deletedLoansCount
        });

    } catch (error) {
        console.error('Error deleting user, accounts, and loans:', error);
        res.status(500).json({ error: 'Failed to delete user, accounts, and loans' });
    }
};


exports.getUserCount = async (req, res) => {
    try {
        const customerCount = await User.countDocuments({ role: 'customer' });
        const employeeCount = await User.countDocuments({ role: 'employee' });
        const adminCount = await User.countDocuments({ role: 'admin' });

        res.status(200).json({
            customerCount,
            employeeCount,
            adminCount
        });
    } catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).json({ error: 'Failed to fetch user count' });
    }
}

// Fetch user by identifier (username, mobile_no, or user_id)
exports.searchUser = async (req, res) => {
    try {
        const { identifier } = req.params;

        let query;

        if (/^\d{8}$/.test(identifier)) {
            query = { user_id: identifier }; // Search by user_id
        } else if (/^\d{10}$/.test(identifier)) {
            query = { mobile_no: identifier }; // Search by mobile number (assuming 10-digit numbers)
        } else {
            query = { username: identifier }; // Search by username
        }

        const user = await User.findOne(query);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};




