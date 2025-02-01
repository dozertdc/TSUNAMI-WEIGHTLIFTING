import { Router } from 'express';
import { pool } from '../config/db.config';

const router = Router();

// Get workouts for a user within a date range
router.get('/', async (req, res) => {
  const { userId, startDate, endDate } = req.query;
  
  try {
    // Validate required parameters
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'userId, startDate, and endDate are required'
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate as string) || 
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate as string)) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Dates must be in YYYY-MM-DD format'
      });
    }

    const workoutsQuery = `
      WITH complex_exercise_sets AS (
        SELECT 
          we.id as exercise_id,
          json_agg(
            json_build_object(
              'id', wes.id,
              'weight', wes.weight,
              'reps', (
                SELECT SUM(wep.reps)
                FROM workout_exercise_part wep
                WHERE wep.workout_exercise_set_id = wes.id
              ),
              'setOrder', wes.set_order,
              'parts', (
                SELECT json_agg(
                  json_build_object(
                    'id', wep.id,
                    'name', wep.name,
                    'reps', wep.reps,
                    'orderIndex', wep.order_index
                  ) ORDER BY wep.order_index
                )
                FROM workout_exercise_part wep
                WHERE wep.workout_exercise_set_id = wes.id
              )
            ) ORDER BY wes.set_order
          ) as sets,
          (
            SELECT json_agg(
              json_build_object(
                'name', name,
                'orderIndex', order_index
              )
            )
            FROM (
              SELECT DISTINCT name, order_index
              FROM workout_exercise_part wep
              WHERE wep.workout_exercise_id = we.id
              ORDER BY order_index
            ) distinct_parts
          ) as complexParts
        FROM workout_exercises we
        LEFT JOIN workout_exercise_sets wes ON we.id = wes.workout_exercise_id
        LEFT JOIN workout_exercise_part wep ON wes.id = wep.workout_exercise_set_id
        WHERE we.is_complex = true
        GROUP BY we.id
      ),
      regular_exercise_sets AS (
        SELECT 
          we.id as exercise_id,
          json_agg(
            json_build_object(
              'id', wes.id,
              'weight', wes.weight,
              'reps', wes.reps,
              'setOrder', wes.set_order
            ) ORDER BY wes.set_order
          ) as sets
        FROM workout_exercises we
        LEFT JOIN workout_exercise_sets wes ON we.id = wes.workout_exercise_id
        WHERE we.is_complex = false
        GROUP BY we.id
      )
      SELECT 
        w.id as id,
        w.date,
        w.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', we.id,
              'name', we.name,
              'isComplex', we.is_complex,
              'complexParts', CASE 
                WHEN we.is_complex THEN ces.complexParts
                ELSE NULL
              END,
              'sets', CASE 
                WHEN we.is_complex THEN COALESCE(ces.sets, '[]'::json)
                ELSE COALESCE(res.sets, '[]'::json)
              END
            ) ORDER BY we.order_index
          ) FILTER (WHERE we.id IS NOT NULL),
          '[]'
        ) as exercises
      FROM workouts w
      LEFT JOIN workout_exercises we ON w.id = we.workout_id
      LEFT JOIN complex_exercise_sets ces ON we.id = ces.exercise_id
      LEFT JOIN regular_exercise_sets res ON we.id = res.exercise_id
      WHERE w.user_id = $1
        AND w.date BETWEEN $2 AND $3
      GROUP BY w.id, w.date, w.status
      ORDER BY w.date;
    `;

    console.log('Executing query with params:', { userId, startDate, endDate });

    const result = await pool.query(workoutsQuery, [userId, startDate, endDate]);
    console.log('Query result:', result.rows);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workouts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save a new workout
router.post('/', async (req, res) => {
  const { userId, date, status, exercises } = req.body;

  try {
    if (!userId || !date || !exercises) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: `Required: userId, date, exercises. Received: ${JSON.stringify({ userId, date, exercises: !!exercises })}`
      });
    }

    console.log('Received workout data:', { userId, date, exercises });

    await pool.query('BEGIN');

    // Insert workout
    const workoutResult = await pool.query(
      `INSERT INTO workouts (id, user_id, date, status) 
       VALUES (gen_random_uuid(), $1, $2, $3) 
       RETURNING id`,
      [userId, date, status || 'completed']
    );
    const workoutId = workoutResult.rows[0].id;

    // Insert exercises
    for (const [index, exercise] of exercises.entries()) {
      if (!exercise.name) {
        throw new Error(`Exercise at index ${index} is missing a name`);
      }

      const exerciseResult = await pool.query(
        `INSERT INTO workout_exercises (id, workout_id, name, is_complex, order_index) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4) 
         RETURNING id`,
        [workoutId, exercise.name, exercise.isComplex || false, index]
      );
      const exerciseId = exerciseResult.rows[0].id;

      // Insert sets
      if (!Array.isArray(exercise.sets)) {
        throw new Error(`Exercise "${exercise.name}" has invalid sets`);
      }

      for (const [setIndex, set] of exercise.sets.entries()) {
        if (exercise.isComplex) {
          // For complex exercises, first create a main set record
          const setResult = await pool.query(
            `INSERT INTO workout_exercise_sets (id, workout_exercise_id, weight, reps, set_order) 
             VALUES (gen_random_uuid(), $1, $2, $3, $4) 
             RETURNING id`,
            [exerciseId, set.weight || 0, set.reps || 0, setIndex]
          );  
          const setId = setResult.rows[0].id;

          // Then create part records for each component of the complex exercise
          if (exercise.complexParts) {
            for (const [partIndex, part] of exercise.complexParts.entries()) {
              await pool.query(
                `INSERT INTO workout_exercise_part (
                  id, 
                  workout_exercise_id, 
                  workout_exercise_set_id,
                  name,
                  reps, 
                  order_index
                ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                [
                  exerciseId,
                  setId,
                  part.name,
                  set[`exercise${partIndex}Reps`] || 0,
                  partIndex
                ]
              );
            }
          }
        } else {
          // Handle regular exercise sets
          await pool.query(
            `INSERT INTO workout_exercise_sets (id, workout_exercise_id, weight, reps, set_order) 
             VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
            [exerciseId, set.weight || 0, set.reps || 0, setIndex]
          );
        }
      }
    }

    await pool.query('COMMIT');

    const savedWorkout = await pool.query(`
      WITH exercise_sets AS (
        SELECT 
          we.id as exercise_id,
          json_agg(
            json_build_object(
              'id', wes.id,
              'weight', wes.weight,
              'reps', wes.reps,
              'setOrder', wes.set_order
            ) ORDER BY wes.set_order
          ) as sets
        FROM workout_exercises we
        LEFT JOIN workout_exercise_sets wes ON we.id = wes.workout_exercise_id
        WHERE we.workout_id = $1
        GROUP BY we.id
      )
      SELECT 
        w.id,
        w.date,
        w.status,
        json_agg(
          json_build_object(
            'id', we.id,
            'name', we.name,
            'isComplex', we.is_complex,
            'sets', COALESCE(es.sets, '[]'::json)
          ) ORDER BY we.order_index
        ) as exercises
      FROM workouts w
      LEFT JOIN workout_exercises we ON w.id = we.workout_id
      LEFT JOIN exercise_sets es ON we.id = es.exercise_id
      WHERE w.id = $1
      GROUP BY w.id, w.date, w.status;
    `, [workoutId]);

    res.json({ 
      workoutId,
      workout: savedWorkout.rows[0]
    });
  } catch (error: unknown) {
    await pool.query('ROLLBACK');
    console.error('Error saving workout:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    res.status(500).json({ 
      error: 'Failed to save workout', 
      details: errorMessage 
    });
  }
});

// Update a workout
router.put('/:workoutId', async (req, res) => {
  const { workoutId } = req.params;
  const { status, exercises } = req.body;

  try {
    console.log('Updating workout:', { workoutId, status, exercises });
    
    await pool.query('BEGIN');

    // Update workout status if provided
    if (status) {
      await pool.query(
        'UPDATE workouts SET status = $1 WHERE id = $2',
        [status, workoutId]
      );
    }

    // Update exercises if provided
    if (exercises) {
      // Get existing exercise IDs for this workout
      const existingExercises = await pool.query(
        'SELECT id FROM workout_exercises WHERE workout_id = $1',
        [workoutId]
      );
      const existingIds = new Set(existingExercises.rows.map(row => row.id));

      // Process each exercise
      for (const [index, exercise] of exercises.entries()) {
        let exerciseId;

        if (exercise.id && existingIds.has(exercise.id)) {
          // Update existing exercise
          await pool.query(
            `UPDATE workout_exercises 
             SET name = $1, is_complex = $2, order_index = $3
             WHERE id = $4`,
            [exercise.name, exercise.isComplex || false, index, exercise.id]
          );
          exerciseId = exercise.id;
          existingIds.delete(exercise.id);
        } else {
          // Insert new exercise
          const exerciseResult = await pool.query(
            `INSERT INTO workout_exercises (id, workout_id, name, is_complex, order_index) 
             VALUES (gen_random_uuid(), $1, $2, $3, $4) 
             RETURNING id`,
            [workoutId, exercise.name, exercise.isComplex || false, index]
          );
          exerciseId = exerciseResult.rows[0].id;
        }

        // Delete existing sets for this exercise
        await pool.query(
          'DELETE FROM workout_exercise_sets WHERE workout_exercise_id = $1',
          [exerciseId]
        );

        // Insert updated sets
        for (const [setIndex, set] of exercise.sets.entries()) {
          if (exercise.isComplex) {
            // First create the main set record
            console.log('Creating main set record:', { exerciseId, set });
            const setResult = await pool.query(
              `INSERT INTO workout_exercise_sets (id, workout_exercise_id, weight, reps, set_order) 
               VALUES (gen_random_uuid(), $1, $2, $3, $4) 
               RETURNING id`,
              [exerciseId, set.weight || 0, set.reps || 0, setIndex]
            );
            const setId = setResult.rows[0].id;

            // Then create the part records
            if (exercise.complexParts) {
              for (const [partIndex, part] of exercise.complexParts.entries()) {
                await pool.query(
                  `INSERT INTO workout_exercise_part (
                    id, 
                    workout_exercise_id, 
                    workout_exercise_set_id,
                    name,
                    reps, 
                    order_index
                  ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                  [
                    exerciseId,
                    setId,
                    part.name,
                    set[`exercise${partIndex}Reps`] || 0,
                    partIndex
                  ]
                );
              }
            }
          } else {
            // Handle regular exercise sets
            await pool.query(
              `INSERT INTO workout_exercise_sets (id, workout_exercise_id, weight, reps, set_order) 
               VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
              [exerciseId, set.weight || 0, set.reps || 0, setIndex]
            );
          }
        }
      }

      // Delete any remaining old exercises
      if (existingIds.size > 0) {
        await pool.query(
          'DELETE FROM workout_exercises WHERE id = ANY($1)',
          [Array.from(existingIds)]
        );
      }
    }

    await pool.query('COMMIT');

    const savedWorkout = await pool.query(`
      WITH exercise_sets AS (
        SELECT 
          we.id as exercise_id,
          json_agg(
            json_build_object(
              'id', wes.id,
              'weight', wes.weight,
              'reps', wes.reps,
              'setOrder', wes.set_order
            ) ORDER BY wes.set_order
          ) as sets
        FROM workout_exercises we
        LEFT JOIN workout_exercise_sets wes ON we.id = wes.workout_exercise_id
        WHERE we.workout_id = $1
        GROUP BY we.id
      )
      SELECT 
        w.id,
        w.date,
        w.status,
        json_agg(
          json_build_object(
            'id', we.id,
            'name', we.name,
            'isComplex', we.is_complex,
            'sets', COALESCE(es.sets, '[]'::json)
          ) ORDER BY we.order_index
        ) as exercises
      FROM workouts w
      LEFT JOIN workout_exercises we ON w.id = we.workout_id
      LEFT JOIN exercise_sets es ON we.id = es.exercise_id
      WHERE w.id = $1
      GROUP BY w.id, w.date, w.status;
    `, [workoutId]);

    res.json({ 
      workoutId,
      workout: savedWorkout.rows[0]
    });
  } catch (error: unknown) {
    await pool.query('ROLLBACK');
    console.error('Error updating workout:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to update workout',
      details: errorMessage
    });
  }
});

// Delete a workout
router.delete('/:workoutId', async (req, res) => {
  const { workoutId } = req.params;

  try {
    await pool.query('DELETE FROM workouts WHERE id = $1', [workoutId]);
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// Delete an exercise from a workout
router.delete('/:workoutId/exercises/:exerciseId', async (req, res) => {
  const { workoutId, exerciseId } = req.params;

  try {
    // Validate parameters
    if (!workoutId || !exerciseId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Both workoutId and exerciseId are required'
      });
    }

    await pool.query('BEGIN');

    // Check if the exercise exists and belongs to the workout
    const exerciseCheck = await pool.query(
      'SELECT id FROM workout_exercises WHERE id = $1 AND workout_id = $2',
      [exerciseId, workoutId]
    );

    if (exerciseCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        error: 'Exercise not found',
        details: 'Exercise does not exist or does not belong to this workout'
      });
    }

    // Delete the exercise (cascade will handle sets)
    await pool.query(
      'DELETE FROM workout_exercises WHERE id = $1 AND workout_id = $2',
      [exerciseId, workoutId]
    );

    // Check if this was the last exercise
    const remainingExercises = await pool.query(
      'SELECT COUNT(*) FROM workout_exercises WHERE workout_id = $1',
      [workoutId]
    );

    if (parseInt(remainingExercises.rows[0].count) === 0) {
      // If no exercises left, delete the workout
      await pool.query('DELETE FROM workouts WHERE id = $1', [workoutId]);
      await pool.query('COMMIT');
      res.json({ 
        message: 'Exercise and empty workout deleted successfully',
        workoutDeleted: true
      });
    } else {
      await pool.query('COMMIT');
      res.json({ 
        message: 'Exercise deleted successfully',
        workoutDeleted: false
      });
    }
  } catch (error: unknown) {
    await pool.query('ROLLBACK');
    console.error('Error deleting exercise:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to delete exercise',
      details: errorMessage 
    });
  }
});

// Delete a set from an exercise
router.delete('/:workoutId/exercises/:exerciseId/sets/:setId', async (req, res) => {
  const { workoutId, exerciseId, setId } = req.params;

  try {
    await pool.query('BEGIN');

    // First check if the exercise exists and get its type
    const exerciseResult = await pool.query(
      'SELECT is_complex FROM workout_exercises WHERE id = $1 AND workout_id = $2',
      [exerciseId, workoutId]
    );

    if (exerciseResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const isComplex = exerciseResult.rows[0].is_complex;

    if (isComplex) {
      // For complex exercises, first delete the parts
      await pool.query(
        'DELETE FROM workout_exercise_part WHERE workout_exercise_set_id = $1',
        [setId]
      );
      // Then delete the set
      await pool.query(
        'DELETE FROM workout_exercise_sets WHERE id = $1 AND workout_exercise_id = $2',
        [setId, exerciseId]
      );
    } else {
      // For regular exercises, just delete the set
      await pool.query(
        'DELETE FROM workout_exercise_sets WHERE id = $1 AND workout_exercise_id = $2',
        [setId, exerciseId]
      );
    }

    await pool.query('COMMIT');
    res.json({ message: 'Set deleted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting set:', error);
    res.status(500).json({ error: 'Failed to delete set' });
  }
});

export default router; 