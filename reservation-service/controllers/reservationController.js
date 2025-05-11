const Reservation = require('../models/reservation');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('../proto/car.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const carProto = grpc.loadPackageDefinition(packageDefinition).car;
const carClient = new carProto.CarService('127.0.0.1:5001', grpc.credentials.createInsecure());

exports.createReservation = async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
    carClient.ListCars({}, (err, response) => {
      if (err) {
        console.error('gRPC error:', err);
        return res.status(500).json({ error: 'Failed to fetch cars' });
      }
      res.json({ reservation, cars: response.cars });
    });
  } catch (err) {
    console.error('Reservation error:', err);
    res.status(400).json({ error: err.message });
  }
};