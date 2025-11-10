import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

export const registerUser = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, timers: user.timers }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, timers: user.timers }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserWithTimers = async (userId, res) => {
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }
  return user;
};

const filterByStatus = (timers, status) => {
  if (status === 'all') return timers;
  if (status === 'deleted') return timers.filter((timer) => timer.status === 'deleted');
  return timers.filter((timer) => timer.status !== 'deleted');
};

export const getTimers = async (req, res) => {
  const { status = 'active' } = req.query;
  try {
    const user = await getUserWithTimers(req.userId, res);
    if (!user) return;
    res.json(filterByStatus(user.timers, status));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTimer = async (req, res) => {
  const { title, description, targetDate } = req.body;

  if (!title || !targetDate) {
    return res.status(400).json({ message: 'Title and target date are required' });
  }

  try {
    const user = await getUserWithTimers(req.userId, res);
    if (!user) return;

    user.timers.push({ title, description, targetDate, status: 'active' });
    await user.save();

    res.status(201).json(user.timers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTimer = async (req, res) => {
  const { timerId } = req.params;
  const { title, description, targetDate } = req.body;

  try {
    const user = await getUserWithTimers(req.userId, res);
    if (!user) return;

    const timer = user.timers.id(timerId);
    if (!timer || timer.status === 'deleted') {
      return res.status(404).json({ message: 'Timer not found' });
    }

    if (title) timer.title = title;
    if (description !== undefined) timer.description = description;
    if (targetDate) timer.targetDate = targetDate;
    timer.updatedAt = new Date();

    await user.save();
    res.json(user.timers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTimer = async (req, res) => {
  const { timerId } = req.params;

  try {
    const user = await getUserWithTimers(req.userId, res);
    if (!user) return;

    const timer = user.timers.id(timerId);
    if (!timer) {
      return res.status(404).json({ message: 'Timer not found' });
    }

    timer.status = 'deleted';
    timer.deletedAt = new Date();

    await user.save();

    res.json(user.timers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchTimers = async (req, res) => {
  const { q, status = 'active' } = req.query;

  try {
    const user = await getUserWithTimers(req.userId, res);
    if (!user) return;

    if (!q) {
      return res.json(filterByStatus(user.timers, status));
    }

    const lower = q.toLowerCase();
    const filtered = filterByStatus(user.timers, status).filter((timer) =>
      timer.title.toLowerCase().includes(lower) ||
      (timer.description || '').toLowerCase().includes(lower)
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
