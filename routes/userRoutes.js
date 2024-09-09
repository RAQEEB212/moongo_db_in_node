const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Import the User model
require('dotenv').config(); // Load environment variables

const router = express.Router();

// Nodemailer setup (assuming Gmail SMTP for simplicity)
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

// Signup Route (store user data in MongoDB)
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

        // Generate email verification token (JWT)
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send verification email
        const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Verify Your Email',
            text: `Hello ${name}, please verify your email by clicking on the link: ${verificationLink}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending verification email');
            }
            res.status(201).send({
                message: 'Signup successful! Please verify your email.',
                user: newUser
            });
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send('An error occurred during signup.');
    }
});

// Email Verification Route
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    try {
        const { email } = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user by email and update their verification status
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('User not found');

        if (user.isVerified) return res.status(400).send('User is already verified');

        user.isVerified = true;
        await user.save();

        res.send('Email successfully verified! You can now log in.');
    } catch (error) {
        console.error('Verification error:', error);
        res.status(400).send('Invalid or expired token.');
    }
});

// Login Route (authenticate user)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('Invalid email or password');

        // Check if the user's email is verified
        if (!user.isVerified) return res.status(400).send('Please verify your email first');

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send('Invalid email or password');

        // Generate JWT token for authentication
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.send({
            message: 'Login successful!',
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('An error occurred during login.');
    }
});

// Fetch all users
router.get('/users', async (req, res) => {
    try {
        // Find all users in the database
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('An error occurred while fetching users.');
    }
});

// Fetch a specific user by ID
router.get('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        // Find the user by ID in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('An error occurred while fetching the user.');
    }
});

module.exports = router;
