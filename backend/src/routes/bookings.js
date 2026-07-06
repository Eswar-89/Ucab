import express from 'express';
import { Booking, Driver } from '../db.js';
import { auth, requireRole } from '../middleware/auth.js';
import { getIo } from '../socket.js';

const router = express.Router();

// Static captain pool — guaranteed for ALL locations, ALL vehicle types
const CAPTAINS = {
  bike:   { name: "Amit Sharma",   phone: "+91 98765 00001", plate: "DL-01-CA-1122", model: "Hero Splendor",        rating: 4.8, eta: "2 mins" },
  auto:   { name: "Karan Patel",   phone: "+91 98765 00002", plate: "GJ-01-AB-3344", model: "Bajaj RE Auto",        rating: 4.6, eta: "3 mins" },
  car:    { name: "Rajesh Kumar",  phone: "+91 98765 00003", plate: "KA-03-ME-7788", model: "Maruti Suzuki Swift",  rating: 4.9, eta: "4 mins" },
  suv:    { name: "Suresh Pillai", phone: "+91 98765 00004", plate: "TN-07-BY-5566", model: "Toyota Innova Crysta", rating: 4.7, eta: "6 mins" },
  parcel: { name: "Anil Reddy",    phone: "+91 98765 00006", plate: "AP-02-TZ-1234", model: "TVS King Auto",        rating: 4.8, eta: "5 mins" },
};

// Create a booking — captain assigned INSTANTLY, status = accepted on creation
router.post('/', auth, requireRole('rider'), async (req, res) => {
  try {
    const {
      pickupLocation, dropLocation,
      pickupCoords, dropCoords,
      vehicleType, fare, distance
    } = req.body;

    if (!pickupLocation || !dropLocation || !vehicleType || !pickupCoords || !dropCoords) {
      return res.status(400).json({ message: 'All booking fields are required' });
    }

    const cap = CAPTAINS[vehicleType] || CAPTAINS['car'];

    const booking = await Booking.create({
      rider: req.user._id,
      pickupLocation,
      dropLocation,
      pickupCoords,
      dropCoords,
      vehicleType,
      fare: fare || 0,
      distance: distance || 0,
      status: 'accepted',
      assignedCaptain: cap,
    });

    console.log(`[UCab] ${booking._id} → instantly assigned to ${cap.name} (${vehicleType})`);

    // Return the booking WITH captain details so frontend shows them immediately
    res.status(201).json({ ...booking, assignedCaptain: cap });
  } catch (error) {
    console.error('BOOKING CREATE ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Driver accepts ride (real driver flow)
router.put('/:id/accept', auth, requireRole('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Booking not found' });
    if (existing.status !== 'pending') {
      return res.status(400).json({ message: 'Ride already taken' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { driver: driver._id, status: 'accepted' }
    );

    await Driver.findByIdAndUpdate(driver._id, { isAvailable: false });

    const io = getIo();
    if (io) {
      io.to(`rider_${existing.rider}`).emit('rideAccepted', {
        bookingId: booking._id,
        driverName: driver.user?.name,
        driverPhone: driver.user?.phone,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        vehicleModel: driver.vehicleModel,
        rating: driver.rating,
      });
    }

    res.json({ message: 'Ride accepted', booking });
  } catch (error) {
    console.error('ACCEPT ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Driver rejects ride
router.put('/:id/reject', auth, requireRole('driver'), async (req, res) => {
  try {
    res.json({ message: 'Ride rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark ride as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', rideEndTime: new Date().toISOString() }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.driver) {
      await Driver.findByIdAndUpdate(booking.driver, {
        isAvailable: true,
        $inc: { completedRides: 1 }
      });
    }
    res.json({ message: 'Ride completed', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate the driver
router.put('/:id/rate', auth, requireRole('rider'), async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    await Booking.findByIdAndUpdate(req.params.id, { rating });
    res.json({ message: 'Rating submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending bookings for driver
router.get('/pending', auth, requireRole('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });
    const bookings = await Booking.find({ vehicleType: driver.vehicleType, status: 'pending' });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings for current rider
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ rider: req.user._id });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
