import express from 'express';
import jwt from 'jsonwebtoken';
import { User, Driver } from '../db.js';

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'ucab_secret_jwt_key_123', {
    expiresIn: '7d'
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, licenseNumber, vehicleType } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (role === 'driver' && (!licenseNumber || !vehicleType)) {
      return res.status(400).json({ message: 'License number and vehicle type are required for drivers' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, phone, password, role: role || 'rider' });

    // If driver, create a Driver profile linked to this user
    if (role === 'driver') {
      await Driver.create({
        user: user._id,
        licenseNumber,
        vehicleType
      });
    }

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If driver, fetch driver profile for driverId
    let driverId = null;
    if (user.role === 'driver') {
      let driver = await Driver.findOne({ user: user._id });
      if (!driver) {
        // Auto-create to prevent dashboard issues
        driver = await Driver.create({
          user: user._id,
          licenseNumber: 'PENDING',
          vehicleType: 'car'
        });
      }
      driverId = driver._id;
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driverId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
