const User = require('../models/user');
const Employee = require('../models/employee');



exports.createEmployee = async (req, res) => {
    const { user_id, salary, date_of_joining } = req.body;
    try {
        // Check if user_id exists and is an employee
        const user = await User.findOne({ user_id, role: 'employee' });
        if (!user) {
            return res.status(400).json({ message: 'Invalid user ID or user is not an employee' });
        }

        // Check if employee already exists
        let existingEmployee = await Employee.findOne({ user_id });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee already exists' });
        }

        // Create new employee
        const newEmployee = new Employee({
            user_id,
            salary,
            date_of_joining: new Date(date_of_joining)
        });

        await newEmployee.save();

        res.status(201).json({ message: 'Employee created successfully', user_id: newEmployee.user_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get all Employees API
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get Employee by ID API
exports.getEmployeeById = async (req, res) => {
    try {
        const user_id = req.params.user_id
        const employee = await Employee.findOne({ user_id });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json(employee);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}