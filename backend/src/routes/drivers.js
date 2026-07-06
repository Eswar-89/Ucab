import express from 'express';
import { Driver, Booking } from '../db.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get logged-in driver's own profile
router.get('/me', auth, requireRole('driver'), async (req, res) => {
  try {
    let driver = await Driver.findOne({ user: req.user._id });
    if (!driver) {
      // Auto-create profile if missing to prevent dashboard load failure
      driver = await Driver.create({
        user: req.user._id,
        licenseNumber: 'PENDING',
        vehicleType: 'car'
      });
      // reload
      driver = await Driver.findOne({ user: req.user._id });
    }
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle driver availability status (Online / Offline)
router.put('/toggle-availability', auth, requireRole('driver'), async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const driver = await Driver.findOneAndUpdate(
      { user: req.user._id },
      { isAvailable: isAvailable !== false }
    );
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete or update driver vehicle / details registration
router.post('/register', auth, requireRole('driver'), async (req, res) => {
  try {
    const { licenseNumber, vehicleNumber, vehicleModel } = req.body;
    if (!licenseNumber || !vehicleNumber || !vehicleModel) {
      return res.status(400).json({ message: 'All details are required' });
    }

    const driver = await Driver.findOneAndUpdate(
      { user: req.user._id },
      { licenseNumber, vehicleNumber, vehicleModel },
      { new: true, upsert: true }
    );

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get completed rides for logged-in driver
router.get('/my-rides', auth, requireRole('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

    // In db.js, Bookings are loaded and populated. Let's filter completed bookings for this driver.
    const allBookings = await Booking.find();
    const rides = allBookings.filter(b => 
      b.driver && 
      String(b.driver._id || b.driver) === String(driver._id) && 
      b.status === 'completed'
    );

    res.json(rides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list all drivers
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
