import express from 'express';
import { Pool } from 'pg';

const router = express.Router();

// Add logging middleware for this router
router.use((req, res, next) => {
  console.log('Exercise router hit:', req.method, req.path);
  next();
});

// Add this test route at the top
router.get('/test', async (req, res) => {
  try {
    const { pool } = await import('../config/db.config');
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, timestamp: result.rows[0] });
  } catch (error: any) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Get user's exercises with 1RMs (more specific route first)
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('Fetching user exercises for userId:', req.params.userId);
    const { userId } = req.params;
    const { pool } = await import('../config/db.config');
    
    const result = await pool.query(`
      SELECT e.*, ue.one_rep_max, ue.updated_at 
      FROM exercises e 
      LEFT JOIN user_exercises ue ON e.id = ue.exercise_id AND ue.user_id = $1
      ORDER BY id
    `, [userId]);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching user exercises:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user exercises',
      details: error.message 
    });
  }
});

// Get all exercises (general route after specific ones)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all exercises');
    const { pool } = await import('../config/db.config');
    const result = await pool.query('SELECT * FROM exercises ORDER BY id');
    console.log('Query result:', result.rows);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ 
      error: 'Failed to fetch exercises',
      details: error.message 
    });
  }
});

// Get exercise by ID (specific route)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = await import('../config/db.config');
    
    const result = await pool.query('SELECT * FROM exercises WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ 
      error: 'Failed to fetch exercise',
      details: error.message 
    });
  }
});

// Add a new exercise
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Exercise name is required' });
    }

    const { pool } = await import('../config/db.config');
    const result = await pool.query(
      'INSERT INTO exercises (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ 
      error: 'Failed to create exercise',
      details: error.message 
    });
  }
});

// Delete an exercise
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = await import('../config/db.config');

    // First check if exercise exists
    const checkResult = await pool.query('SELECT * FROM exercises WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Delete the exercise
    await pool.query('DELETE FROM exercises WHERE id = $1', [id]);
    
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ 
      error: 'Failed to delete exercise',
      details: error.message 
    });
  }
});

// Update an exercise
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Exercise name is required' });
    }

    const { pool } = await import('../config/db.config');
    
    const result = await pool.query(
      'UPDATE exercises SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ 
      error: 'Failed to update exercise',
      details: error.message 
    });
  }
});

// Update user's exercise 1RM
router.patch('/user/:userId/:exerciseId', async (req, res) => {
  try {
    const { userId, exerciseId } = req.params;
    const { one_rep_max } = req.body;  // Changed from oneRepMax to match client

    console.log('Updating 1RM:', { userId, exerciseId, one_rep_max });

    const { pool } = await import('../config/db.config');
    
    // Try to update first
    const updateResult = await pool.query(
      'UPDATE user_exercises SET one_rep_max = $1 WHERE user_id = $2 AND exercise_id = $3 RETURNING *',
      [one_rep_max, userId, exerciseId]
    );

    if (updateResult.rows.length === 0) {
      // If no row was updated, insert a new one
      const insertResult = await pool.query(
        'INSERT INTO user_exercises (user_id, exercise_id, one_rep_max) VALUES ($1, $2, $3) RETURNING *',
        [userId, exerciseId, one_rep_max]
      );
      res.json(insertResult.rows[0]);
    } else {
      res.json(updateResult.rows[0]);
    }
  } catch (error: any) {
    console.error('Error updating exercise 1RM:', error);
    res.status(500).json({ 
      error: 'Failed to update exercise 1RM',
      details: error.message 
    });
  }
});

export default router; 