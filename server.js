const express = require('express');
const connectDB = require('./db');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();

app.use(express.json()); // Middleware to parse JSON

// Connect to MongoDB
connectDB();

// Use the user routes
app.use('/', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
