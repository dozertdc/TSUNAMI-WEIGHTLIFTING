import express from 'express';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, getAllUsers, User } from '../models/user.model';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    
    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      console.log('Missing fields:', {
        hasEmail: !!email,
        hasPassword: !!password,
        hasFirstName: !!first_name,
        hasLastName: !!last_name
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: req.body 
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user: User = {
      email,
      password_hash,
      first_name,
      last_name
    };

    console.log('Attempting to create user...');
    const newUser = await createUser(user);
    console.log('User created successfully:', newUser);
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Detailed server error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: error.message || 'Error creating user',
      details: {
        code: error.code,
        message: error.message
      }
    });
  }
});

router.get('/test-db', async (req, res) => {
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Login attempt for:', email); // Debug log

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Found user:', { email: user.email, hasPassword: !!user.password_hash }); // Debug log

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password comparison:', { isValid: isValidPassword }); // Debug log

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Don't send password hash back to client
    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// Get user's coach
router.get('/:userId/coach', async (req, res) => {
  try {
    const { userId } = req.params;
    const { pool } = await import('../config/db.config');
    
    const result = await pool.query(`
      SELECT c.id, c.first_name, c.last_name, c.email 
      FROM users u
      JOIN users c ON u.coached_by = c.id
      WHERE u.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      res.json(null); // No coach assigned
    } else {
      res.json(result.rows[0]);
    }
  } catch (error: any) {
    console.error('Error fetching coach:', error);
    res.status(500).json({ 
      error: 'Failed to fetch coach',
      details: error.message 
    });
  }
});

// Update user's coach
router.patch('/:userId/coach', async (req, res) => {
  try {
    const { userId } = req.params;
    const { coachId } = req.body;
    const { pool } = await import('../config/db.config');
    
    // Verify the coach exists
    const coachCheck = await pool.query('SELECT id FROM users WHERE id = $1', [coachId]);
    if (coachCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    
    const result = await pool.query(`
      UPDATE users 
      SET coached_by = $1 
      WHERE id = $2 
      RETURNING id, first_name, last_name, email, coached_by
    `, [coachId, userId]);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating coach:', error);
    res.status(500).json({ 
      error: 'Failed to update coach',
      details: error.message 
    });
  }
});

// Get coach's athletes
router.get('/:coachId/athletes', async (req, res) => {
  try {
    const { coachId } = req.params;
    const { pool } = await import('../config/db.config');
    
    const result = await pool.query(`
      SELECT id, first_name, last_name, email 
      FROM users 
      WHERE coached_by = $1
      ORDER BY last_name, first_name
    `, [coachId]);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching athletes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch athletes',
      details: error.message 
    });
  }
});

// Get user profile
router.get('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { pool } = await import('../config/db.config');
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.birthdate,
        u.is_coach,
        u.is_athlete,
        u.coached_by,
        c.first_name as coach_first_name,
        c.last_name as coach_last_name
      FROM users u
      LEFT JOIN users c ON u.coached_by = c.id
      WHERE u.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      details: error.message 
    });
  }
});

// Get all coaches
router.get('/coaches', async (req, res) => {
  try {
    const { pool } = await import('../config/db.config');
    
    const result = await pool.query(`
      SELECT id, first_name, last_name, email 
      FROM users 
      WHERE is_coach = true
      ORDER BY last_name, first_name
    `);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch coaches',
      details: error.message 
    });
  }
});

// Update user profile
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      email, 
      first_name, 
      last_name, 
      birthdate, 
      is_coach, 
      is_athlete, 
      coached_by 
    } = req.body;

    console.log('Updating profile with data:', {
      userId,
      coached_by,
      is_coach,
      is_athlete
    });

    const { pool } = await import('../config/db.config');

    // First check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If updating email, check if new email is already taken
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const result = await pool.query(`
      UPDATE users 
      SET 
        email = COALESCE($1, email),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        birthdate = $4,
        is_coach = COALESCE($5, is_coach),
        is_athlete = COALESCE($6, is_athlete),
        coached_by = $7
      WHERE id = $8
      RETURNING id, email, first_name, last_name, birthdate, is_coach, is_athlete, coached_by
    `, [
      email,
      first_name,
      last_name,
      birthdate || null,
      is_coach,
      is_athlete,
      coached_by || null,
      userId
    ]);

    console.log('Updated user:', result.rows[0]);

    // Don't send password hash back to client
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
});

// Get user and coached athletes
router.get('/:userId/user-and-athletes', async (req, res) => {
  try {
    const { pool } = await import('../config/db.config');
    
    // Get the current user's ID from the request
    const { userId } = req.params;

    // First get the current user's info and check if they're a coach
    const userResult = await pool.query(`
      SELECT id, first_name, last_name, is_coach 
      FROM users 
      WHERE id = $1
    `, [userId]);

    const currentUser = userResult.rows[0];
    let users = [currentUser]; // Start with current user

    // If user is a coach, get their athletes
    if (currentUser.is_coach) {
      const athletesResult = await pool.query(`
        SELECT id, first_name, last_name 
        FROM users 
        WHERE coached_by = $1
        ORDER BY last_name, first_name
      `, [userId]);
      
      users = [...users, ...athletesResult.rows];
    }

    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

export default router; 