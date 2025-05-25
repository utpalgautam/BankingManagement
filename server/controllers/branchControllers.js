const Branch = require('../models/branch');
const User = require('../models/user');

// Function to generate a unique Branch ID
const generateBranchId = () => {
    return `BR-${Math.floor(100000 + Math.random() * 900000)}`;
};

// Create Branch API
exports.createBranch = async (req, res) => {
    try {
        const { branch_id, branch_name, ifsc_code, address, manager_id, contact_number, opening_date } = req.body;

        // Check if IFSC code or branch name already exists
        let existingBranch = await Branch.findOne({ $or: [{ ifsc_code }] });
        if (existingBranch) {
            return res.status(400).json({ message: 'Branch with this IFSC code already exists' });
        }

        // Validate manager_id (must be an employee if provided)
        if (manager_id) {
            const manager = await User.findOne({ user_id: manager_id, role: 'manager' });
            if (!manager) {
                return res.status(400).json({ message: 'Invalid manager ID or manager is not an employee' });
            }
        }

        // Create new branch
        const newBranch = new Branch({
            branch_id: branch_id,
            branch_name,
            ifsc_code,
            address,
            manager_id,
            contact_number,
            opening_date: new Date(opening_date)
        });

        await newBranch.save();

        res.status(201).json({ message: 'Branch created successfully', branch_id: newBranch.branch_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all Branches API
exports.getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.find();
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Branch by ID API
exports.getBranchById = async (req, res) => {
    try {
        const branch = await
        Branch.findOne({ branch_id: req.params.branch_id });
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        const data = {
            branch_id: branch.branch_id,
            branch_name: branch.branch_name,
            ifsc_code: branch.ifsc_code,
            address: branch.address,
            manager_id: branch.manager_id,
            contact_number: branch.contact_number,
            opening_date: branch.opening_date
        };

        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}   



