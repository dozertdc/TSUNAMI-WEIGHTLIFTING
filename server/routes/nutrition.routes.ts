import express from 'express';
import { pool } from '../config/db.config';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get nutrition data for a user within a date range
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('Received request:', req.params, req.query);
    
    // Remove parseInt since IDs are strings
    const userId = req.params.userId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    console.log('Fetching nutrition data:', { userId, startDate, endDate });

    // Update validation
    if (!userId) {
      return res.status(400).json({ 
        error: 'Invalid user ID', 
        details: 'A valid user ID is required' 
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing dates', 
        details: 'Start date and end date are required' 
      });
    }

    const result = await pool.query(
      `SELECT *, 
              date::text as date_string  -- Convert date to string explicitly
       FROM user_nutrition 
       WHERE user_id = $1 
       AND date BETWEEN $2 AND $3
       ORDER BY date`,
      [userId, startDate, endDate]
    );

    console.log('Found nutrition records:', {
      count: result.rows.length,
      sample: result.rows[0],
      dates: result.rows.map(r => r.date_string)
    });
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching nutrition:', error);
    res.status(500).json({ 
      error: 'Failed to fetch nutrition data',
      details: error.message 
    });
  }
});

// Save or update nutrition data for a specific date
router.post('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { 
      date,
      protein_grams,
      carbs_grams,
      fat_grams,
      steps,
      sleep_hours,
      bodyweight_kg
    } = req.body;

    console.log('Received nutrition data:', {
      userId,
      date,
      protein_grams,
      carbs_grams,
      fat_grams,
      steps,
      sleep_hours,
      bodyweight_kg
    });

    // Update validation
    if (!userId) {
      return res.status(400).json({ 
        error: 'Invalid user ID', 
        details: 'A valid user ID is required' 
      });
    }

    // Validate date
    if (!date || !Date.parse(date)) {
      return res.status(400).json({ 
        error: 'Invalid date', 
        details: 'A valid date is required' 
      });
    }

    // Try to update first
    const updateResult = await pool.query(
      `UPDATE user_nutrition 
       SET protein_grams = $1, carbs_grams = $2, fat_grams = $3,
           steps = $4, sleep_hours = $5, bodyweight_kg = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $7 AND date = $8
       RETURNING *`,
      [
        protein_grams || 0, 
        carbs_grams || 0, 
        fat_grams || 0, 
        steps || 0, 
        sleep_hours || 0, 
        bodyweight_kg || 0, 
        userId,
        date
      ]
    );

    if (updateResult.rowCount === 0) {
      // Generate a new UUID for the id column
      const nutritionId = uuidv4();
      
      const insertResult = await pool.query(
        `INSERT INTO user_nutrition 
         (id, user_id, date, protein_grams, carbs_grams, fat_grams, steps, sleep_hours, bodyweight_kg)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          nutritionId,
          userId, 
          date, 
          protein_grams || 0, 
          carbs_grams || 0, 
          fat_grams || 0, 
          steps || 0, 
          sleep_hours || 0, 
          bodyweight_kg || 0
        ]
      );
      return res.json(insertResult.rows[0]);
    }

    res.json(updateResult.rows[0]);
  } catch (error: any) {
    console.error('Error saving nutrition:', error);
    res.status(500).json({ 
      error: 'Failed to save nutrition data',
      details: error.message 
    });
  }
});

export default router; 