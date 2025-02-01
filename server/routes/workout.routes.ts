import express from 'express';
import { pool } from '../config/db.config';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get workouts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const workouts = await pool.query(
      `SELECT w.*, 
              json_agg(json_build_object(
                'id', e.id,
                'name', e.name,
                'sets', e.sets,
                'reps', e.reps,
                'weight', e.weight,
                'notes', e.notes,
                'order_index', e.order_index
              ) ORDER BY e.order_index) as exercises
       FROM workouts w
       LEFT JOIN exercises e ON w.id = e.workout_id
       WHERE w.user_id = $1 
       AND w.date BETWEEN $2 AND $3
       GROUP BY w.id
       ORDER BY w.date DESC`,
      [userId, startDate, endDate]
    );

    res.json(workouts.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch workouts', details: error.message });
  }
});

// Save a workout
router.post('/user/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const { date, name, notes, exercises } = req.body;

    await client.query('BEGIN');

    // Create workout
    const workoutId = uuidv4();
    const workoutResult = await client.query(
      `INSERT INTO workouts (id, user_id, date, name, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workoutId, userId, date, name, notes]
    );

    // Create exercises
    const exercisePromises = exercises.map((exercise: any, index: number) => {
      return client.query(
        `INSERT INTO exercises 
         (id, workout_id, name, sets, reps, weight, notes, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          uuidv4(),
          workoutId,
          exercise.name,
          exercise.sets,
          exercise.reps,
          exercise.weight,
          exercise.notes,
          index
        ]
      );
    });

    const exerciseResults = await Promise.all(exercisePromises);
    await client.query('COMMIT');

    res.json({
      ...workoutResult.rows[0],
      exercises: exerciseResults.map(result => result.rows[0])
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to save workout', details: error.message });
  } finally {
    client.release();
  }
});

export default router; 