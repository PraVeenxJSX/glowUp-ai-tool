const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
        'glasses', 
        'haircut_male', 
        'haircut_female', 
        'clothing_color', 
        'skincare',
        'style_goal' // New category for style goals
    ]
  },
  key: { // e.g., 'Oval', 'Warm', 'Professional'
    type: String,
    required: true,
  },
  subKey: { // Optional secondary key, e.g., 'Curly', 'Wavy' for haircuts
    type: String,
    default: null
  },
  advice: {
    type: String,
    required: true,
  }
});

// Create a compound index to ensure uniqueness for key-subkey pairs within a category
recommendationSchema.index({ category: 1, key: 1, subKey: 1 }, { unique: true });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
