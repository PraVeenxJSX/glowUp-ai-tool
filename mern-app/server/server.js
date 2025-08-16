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

// --- NEW: CORS Configuration for specific origins ---
const allowedOrigins = [
    'http://localhost:3000', // Common React port
    'http://localhost:5173', // Your current Vite/React port
    // Add your Vercel URL here when you deploy, e.g., 'https://ai-glowup-tool.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));
// --- End of NEW Configuration ---


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
