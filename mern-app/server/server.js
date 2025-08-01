const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const analysisRoutes = require('./routes/analysisRoutes');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const seedDatabase = require('./seed');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected...');
    seedDatabase();
  })
  .catch(err => console.log(err));

// API Routes
app.use('/api', analysisRoutes);
app.use('/api/users', userRoutes); // Use the new user routes

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
