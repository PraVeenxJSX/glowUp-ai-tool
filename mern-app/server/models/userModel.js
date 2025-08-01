const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const analysisResultSchema = new mongoose.Schema({
    analysis: {
        faceShape: String,
        skinTone: String,
    },
    bmi: {
        value: String,
        category: String,
        advice: String,
    },
    recommendations: {
        glasses: String,
        clothingColor: String,
        haircut: String,
        skincare: String,
        styleGoal: String,
    },
    imageUrl: String, // We'll store the image URL for the journey
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    journey: [analysisResultSchema] // An array of all their past results
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
