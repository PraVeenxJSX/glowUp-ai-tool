const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Recommendation = require('../models/recommendationModel');

const router = express.Router();

// Setup multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// This route handles the initial image analysis
router.post('/analyze', upload.single('faceImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const { age, height, weight } = req.body;

    // --- 1. Forward image to Python AI Service ---
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiServiceResponse = await axios.post('http://localhost:5000/process-image', form, {
      headers: { ...form.getHeaders() },
    });

    const analysis = aiServiceResponse.data;
    if (analysis.error) {
        return res.status(500).json({ message: analysis.error });
    }

    // --- 2. Perform Backend Calculations ---
    let bmiData = null;
    if (height && weight && height > 0 && weight > 0) {
        const heightInMeters = parseFloat(height) / 100;
        const bmi = (parseFloat(weight) / (heightInMeters * heightInMeters)).toFixed(2);
        let bmiCategory = 'Normal weight';
        if (bmi < 18.5) bmiCategory = 'Underweight';
        if (bmi >= 25 && bmi < 29.9) bmiCategory = 'Overweight';
        if (bmi >= 30) bmiCategory = 'Obesity';
        const bmiAdvice = `Your BMI is ${bmi}, which is considered ${bmiCategory}. A healthy weight range for your height is approximately between ${(18.5 * heightInMeters * heightInMeters).toFixed(1)} kg and ${(24.9 * heightInMeters * heightInMeters).toFixed(1)} kg.`;
        bmiData = { value: bmi, category: bmiCategory, advice: bmiAdvice };
    }
    
    // --- 3. Fetch GENERAL recommendations ---
    const [glassesRec, colorRec] = await Promise.all([
        Recommendation.findOne({ category: 'glasses', key: analysis.faceShape }),
        Recommendation.findOne({ category: 'clothing_color', key: analysis.skinTone }),
    ]);
    
    // --- 4. Compile and Send Initial Response ---
    const initialResponse = {
        analysis: {
            faceShape: analysis.faceShape,
            skinTone: analysis.skinTone,
        },
        bmi: bmiData,
        recommendations: {
            glasses: glassesRec ? glassesRec.advice : "No specific recommendation found.",
            clothingColor: colorRec ? colorRec.advice : "No specific recommendation found.",
        }
    };

    res.status(200).json(initialResponse);

  } catch (error) {
    console.error('Error in /analyze route:', error.message);
    res.status(500).json({ message: 'An error occurred on the server.' });
  }
});


// --- NEW ROUTE for getting refined, hyper-personalized results ---
router.post('/refine', async (req, res) => {
    try {
        const { faceShape, hairTexture, styleGoal, skincareConcern } = req.body;

        if (!faceShape) {
            return res.status(400).json({ message: 'Face shape is required to refine results.' });
        }

        // Build a dynamic query to fetch all relevant advice in one go
        const queries = [];
        
        if (hairTexture) {
            queries.push(Recommendation.findOne({ category: 'haircut_male', key: faceShape, subKey: hairTexture }));
        }
        if (styleGoal) {
            queries.push(Recommendation.findOne({ category: 'style_goal', key: styleGoal }));
        }
        if (skincareConcern) {
            queries.push(Recommendation.findOne({ category: 'skincare', key: skincareConcern }));
        }

        const results = await Promise.all(queries);

        // --- FIXED: Robustly process results regardless of order ---
        let haircutRec = null;
        let styleGoalRec = null;
        let skincareRec = null;

        results.forEach(result => {
            if (result) { // Ensure the database found a recommendation
                switch (result.category) {
                    case 'haircut_male':
                        haircutRec = result;
                        break;
                    case 'style_goal':
                        styleGoalRec = result;
                        break;
                    case 'skincare':
                        skincareRec = result;
                        break;
                }
            }
        });

        const refinedResponse = {
            haircut: haircutRec ? haircutRec.advice : "Select your hair texture for a specific recommendation.",
            styleGoal: styleGoalRec ? styleGoalRec.advice : "Select a style goal for tailored advice.",
            skincare: skincareRec ? skincareRec.advice : "Select a concern for a specific skincare tip."
        };

        res.status(200).json(refinedResponse);

    } catch (error) {
        console.error('Error in /refine route:', error.message);
        res.status(500).json({ message: 'An error occurred while refining results.' });
    }
});


module.exports = router;
