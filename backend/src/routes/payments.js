import express from 'express';
import { Payment, Booking } from '../db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create payment for a booking
router.post('/', auth, async (req, res) => {
  try {
    const { bookingId, amount, method } = req.body;
    if (!bookingId || !amount || !method) {
      return res.status(400).json({ message: 'bookingId, amount and method are required' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const payment = await Payment.create({
      booking: bookingId,
      user: req.user._id,
      amount,
      method,
      status: 'paid',
      transactionId: `TXN-${Date.now()}`
    });

    await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid' });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List payments for current user (We don't need sorting since we can do it on frontend or simple list)
router.get('/', auth, async (req, res) => {
  try {
    // Basic search on payments from db
    const db = await import('../db.js');
    const fs = await import('fs');
    const path = await import('path');
    const DB_FILE = path.resolve('./database.json');
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const payments = data.payments.filter(p => String(p.user) === String(req.user._id));
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
