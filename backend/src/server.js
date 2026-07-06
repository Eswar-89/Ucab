import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import driverRoutes from './routes/drivers.js';
import paymentRoutes from './routes/payments.js';
import supportRoutes from './routes/support.js';
import { setIo } from './socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

setIo(io);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Driver joins a room based on their vehicleType so they receive matching ride requests
  socket.on('joinDriverRoom', ({ vehicleType }) => {
    socket.join(`driver_${vehicleType}`);
    console.log(`Driver joined room: driver_${vehicleType}`);
  });

  // Rider joins a personal room so driver accept event reaches only them
  socket.on('joinRiderRoom', ({ riderId }) => {
    socket.join(`rider_${riderId}`);
    console.log(`Rider joined room: rider_${riderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Ucab API (JSON file-based database edition)' });
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);

server.listen(PORT, () => {
  console.log(`Ucab backend running with file-based JSON DB on port ${PORT}`);
});
