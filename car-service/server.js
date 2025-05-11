const express = require('express');
const mongoose = require('mongoose');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/car_db', {
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log('Car Service: Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Car Schema
const carSchema = new mongoose.Schema({
  model: String,
  pricePerDay: Number,
});
const Car = mongoose.model('Car', carSchema);

// Reservation Schema (minimal, for availability check)
const reservationSchema = new mongoose.Schema({
  userId: String,
  carId: String,
  createdAt: Date,
});
const Reservation = mongoose.model('Reservation', reservationSchema);

// REST Routes
app.post('/cars', async (req, res) => {
  try {
    const { model, pricePerDay } = req.body;
    if (!model || typeof pricePerDay !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }
    const car = new Car({ model, pricePerDay });
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create car', details: error.message });
  }
});

app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cars', details: error.message });
  }
});

// gRPC Server
const packageDefinition = protoLoader.loadSync('../proto/car.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const carProto = grpc.loadPackageDefinition(packageDefinition).car;

const server = new grpc.Server();

server.addService(carProto.CarService.service, {
  GetCar: async (call, callback) => {
    try {
      console.log(`[gRPC] GetCar called with id: ${call.request.id}`);
      const car = await Car.findById(call.request.id);
      if (!car) {
        return callback({ code: grpc.status.NOT_FOUND, message: 'Car not found' });
      }
      callback(null, { id: car._id.toString(), model: car.model, pricePerDay: car.pricePerDay });
    } catch (err) {
      console.error(`[gRPC] GetCar error: ${err.message}`);
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
  CheckCarAvailability: async (call, callback) => {
    try {
      console.log(`[gRPC] CheckCarAvailability called with carId: ${call.request.carId}`);
      const car = await Car.findById(call.request.carId);
      if (!car) {
        return callback({ code: grpc.status.NOT_FOUND, message: 'Car not found' });
      }
      const reservation = await Reservation.findOne({ carId: call.request.carId });
      if (reservation) {
        return callback(null, { isAvailable: false, message: 'Car is already reserved' });
      }
      callback(null, { isAvailable: true, message: 'Car is available' });
    } catch (err) {
      console.error(`[gRPC] CheckCarAvailability error: ${err.message}`);
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
});

server.bindAsync('0.0.0.0:5001', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Car Service (gRPC) on port 5001');
});

// Start REST server
app.listen(5005, () => console.log('Car Service (REST) on http://localhost:5005'));