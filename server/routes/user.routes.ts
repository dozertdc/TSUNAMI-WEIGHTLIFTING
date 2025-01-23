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

export default router; 