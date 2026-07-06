import express from 'express';
import { SupportTicket } from '../db.js';
import { auth, requireRole } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const DB_FILE = path.resolve('./database.json');

// Create a support ticket
router.post('/', auth, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      message,
      status: 'open'
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List tickets for current user
router.get('/', auth, async (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const tickets = data.tickets.filter(t => String(t.user) === String(req.user._id));
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ticket status (admin only)
router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const index = data.tickets.findIndex(t => String(t._id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    data.tickets[index].status = status;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    res.json(data.tickets[index]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
