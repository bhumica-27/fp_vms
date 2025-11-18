import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbHelpers } from '../database/inMemoryDB.js';

export const authRouter = express.Router();

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = dbHelpers.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret-change-this',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register (for guards/staff)
authRouter.post('/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    if (dbHelpers.getUserByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = dbHelpers.createUser({
      username,
      password: hashedPassword,
      email,
      role: role || 'guard'
    });
    
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
