const express = require('express');
const mongoose = require('mongoose');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const Reservation = require('./models/reservation');

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose
  .connect('mongodb://127.0.0.1:27017/car_db', {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log('Reservation Service: Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// gRPC Clients
const userPackageDefinition = protoLoader.loadSync('../proto/user.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(userPackageDefinition).user;
const userClient = new userProto.UserService('127.0.0.1:5006', grpc.credentials.createInsecure());

const carPackageDefinition = protoLoader.loadSync('../proto/car.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const carProto = grpc.loadPackageDefinition(carPackageDefinition).car;
const carClient = new carProto.CarService('127.0.0.1:5001', grpc.credentials.createInsecure());

// REST Routes
app.post('/reservations', async (req, res) => {
  const { userId, carId } = req.body;
  try {
    if (!userId || !carId) {
      return res.status(400).json({ error: 'Missing userId or carId' });
    }

    // Validate user via gRPC
    console.log(`[gRPC] Calling user.UserService.GetUser with id: ${userId}`);
    const user = await new Promise((resolve, reject) => {
      userClient.GetUser({ id: userId }, (err, response) => {
        if (err) {
          console.error(`[gRPC] GetUser error: ${err.message}`);
          return reject(err);
        }
        console.log(`[gRPC] GetUser response:`, response);
        resolve(response);
      });
    });

    // Check car availability via gRPC
    console.log(`[gRPC] Calling car.CarService.CheckCarAvailability with carId: ${carId}`);
    const availability = await new Promise((resolve, reject) => {
      carClient.CheckCarAvailability({ carId }, (err, response) => {
        if (err) {
          console.error(`[gRPC] CheckCarAvailability error: ${err.message}`);
          return reject(err);
        }
        console.log(`[gRPC] CheckCarAvailability response:`, response);
        resolve(response);
      });
    });

    if (!availability.isAvailable) {
      return res.status(400).json({ error: 'Car is not available', details: availability.message });
    }

    // Create reservation
    const reservation = new Reservation({ userId, carId });
    await reservation.save();
    res.status(201).json(reservation);
  } catch (err) {
    console.error('Error creating reservation:', err.message);
    res.status(400).json({ error: 'Failed to create reservation', details: err.message });
  }
});

app.get('/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.json(reservations);
  } catch (err) {
    console.error('Error fetching reservations:', err.message);
    res.status(500).json({ error: 'Failed to fetch reservations', details: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
const PORT = 5003;
app.listen(PORT, () => console.log(`Reservation Service on http://localhost:${PORT}`));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down Reservation Service...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});