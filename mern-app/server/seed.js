const Recommendation = require('./models/recommendationModel');

const recommendations = [
  // Glasses (No change)
  { category: 'glasses', key: 'Oval', advice: 'Most frames work well. Try bold shapes like square or aviator frames to add some angles.' },
  { category: 'glasses', key: 'Square', advice: 'Round or oval frames will soften your sharp features. Avoid boxy frames.' },
  { category: 'glasses', key: 'Round', advice: 'Rectangular or square frames will add definition. Avoid small or round frames.' },
  { category: 'glasses', key: 'Heart', advice: 'Frames that are wider at the bottom, like aviator or rimless styles, balance your features.' },
  { category: 'glasses', key: 'Oblong', advice: 'Tall, oversized frames or decorative temples add width to an oblong face.' },

  // --- NEW: Haircuts with Hair Texture ---
  // Male, Square Face
  { category: 'haircut_male', key: 'Square', subKey: 'Straight', advice: 'A textured quiff or a classic side-part with some volume works great with straight hair to soften angles.' },
  { category: 'haircut_male', key: 'Square', subKey: 'Wavy', advice: 'Embrace the waves! A messy crop or a longer, pushed-back style will complement your jawline perfectly.' },
  { category: 'haircut_male', key: 'Square', subKey: 'Curly', advice: 'Keep the sides shorter and let the curls have volume on top. A curly undercut or a high fade looks fantastic.' },
  // Male, Round Face
  { category: 'haircut_male', key: 'Round', subKey: 'Straight', advice: 'A pompadour or a flat top with sharp lines will add height and definition that contrasts with a round face.' },
  { category: 'haircut_male', key: 'Round', subKey: 'Wavy', advice: 'Use your waves to create volume on top. A side-swept fringe or a textured spiky look adds great angles.' },
  { category: 'haircut_male', key: 'Round', subKey: 'Curly', advice: 'A high fade with tight curls on top creates a strong, elongating silhouette.' },
  // Add more for other face shapes and textures...

  // Clothing Colors (No change)
  { category: 'clothing_color', key: 'Warm', advice: 'Shine in earthy tones like olive green, gold, coral, cream, and warm reds.' },
  { category: 'clothing_color', key: 'Cool', advice: 'Jewel tones like blue, emerald, deep purple, and silver will complement your skin.' },
  { category: 'clothing_color', key: 'Neutral', advice: 'You can wear almost any color, but look particularly good in muted shades like dusty pink, jade green, and cornflower blue.' },

  // --- NEW: Skincare with Specific Concerns ---
  { category: 'skincare', key: 'Acne', advice: 'Use a cleanser with salicylic acid. Avoid heavy, oily moisturizers and look for non-comedogenic products. Don\'t pick at blemishes.' },
  { category: 'skincare', key: 'Redness', advice: 'Use a gentle, fragrance-free cleanser. Look for ingredients like niacinamide or azelaic acid to calm the skin. Always use sunscreen.' },
  { category: 'skincare', key: 'Dry Patches', advice: 'Use a creamy, hydrating cleanser and a rich moisturizer with hyaluronic acid or ceramides. Avoid long, hot showers.' },

  // --- NEW: Style Goal Advice ---
  { category: 'style_goal', key: 'Professional', advice: 'Focus on well-fitting basics. Invest in a quality blazer, tailored trousers or a smart skirt, and classic leather shoes. Keep accessories minimal.' },
  { category: 'style_goal', key: 'Casual', advice: 'Comfort is key, but keep it stylish. High-quality t-shirts, well-fitting jeans, and clean sneakers are your foundation. Layer with a jacket or sweater.' },
  { category: 'style_goal', key: 'Edgy', advice: 'Play with textures like leather and denim. Don\'t be afraid of darker color palettes, band t-shirts, and statement boots or accessories.' },
  { category: 'style_goal', key: 'Minimalist', advice: 'Focus on a neutral color palette (black, white, grey, beige). Prioritize clean lines, simple silhouettes, and high-quality fabrics.' }
];

const seedDatabase = async () => {
  try {
    console.log('Seeding database with new recommendations...');
    // We use a loop with upserts to add new data without creating duplicates
    for (const rec of recommendations) {
      await Recommendation.updateOne(
        { category: rec.category, key: rec.key, subKey: rec.subKey || null },
        { $set: rec },
        { upsert: true } // This will insert if it doesn't exist, or update if it does
      );
    }
    console.log('Database seeding complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
