import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../db/store.js';

const router = Router();
const jwtSecret = process.env.JWT_SECRET || 'local-development-only-change-me';
function makeToken(user) { return jwt.sign({ id: user.id, name: user.name, email: user.email }, jwtSecret, { expiresIn: '7d' }); }

router.post('/register', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ name,email,passwordHash });
    res.status(201).json({ token: makeToken(user), user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const foundUser = await findUserByEmail(email);
    if (!foundUser || !(await bcrypt.compare(String(req.body.password || ''), foundUser.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const { password_hash, ...user } = foundUser;
    res.json({ token: makeToken(user), user });
  } catch (error) { next(error); }
});

export default router;
