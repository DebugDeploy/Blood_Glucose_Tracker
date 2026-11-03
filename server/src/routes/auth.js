import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../db/store.js';

const router = Router();

// Get JWT secret from environment or use default
const jwtSecret = process.env.JWT_SECRET || 'local-development-secret';

// Create JWT token for a user
function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    jwtSecret,
    { expiresIn: '7d' } // Token valid for 7 days
  );
}

// Route: Register a new user
router.post('/register', async (req, res) => {
  try {
    // Get data from request body
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email and password are required.'
      });
    }

    // Basic email validation
    if (!email.includes('@')) {
      return res.status(400).json({
        error: 'Please enter a valid email address.'
      });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters.'
      });
    }

    // Hash the password (never store plain text passwords!)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await createUser({ name, email, passwordHash });

    // Create JWT token
    const token = createToken(user);

    // Send success response
    res.status(201).json({
      token: token,
      user: user
    });

  } catch (error) {
    // Handle duplicate email error
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'An account with this email already exists.'
      });
    }

    // Handle other errors
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

// Route: Login existing user
router.post('/login', async (req, res) => {
  try {
    // Get email and password from request
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    // Find user by email
    const user = await findUserByEmail(email);

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        error: 'Email or password is incorrect.'
      });
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Email or password is incorrect.'
      });
    }

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    // Create JWT token
    const token = createToken(userWithoutPassword);

    // Send success response
    res.json({
      token: token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

export default router;
