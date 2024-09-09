const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model
require('dotenv').config();

const router = express.Router();

// Signup Route (storing user in MongoDB)
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).send('User already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in MongoDB
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            isVerified: false
        });

        // Save the user to the database
        await newUser.save();

        // Send response
        res.status(201).send({
            message: 'User registered successfully!',
            user: newUser
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send('An error occurred during signup.');
    }
});

module.exports = router;
