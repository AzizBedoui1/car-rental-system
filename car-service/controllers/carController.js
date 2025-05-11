const Car = require('../models/car');

exports.getCars = async (req, res) => {
  try {
    const cars = await Car.find();
    // Ensure valid data
    const validCars = cars.filter(car => car._id && car.model && car.pricePerDay);
    res.json(validCars);
  } catch (err) {
    console.error('Error fetching cars:', err);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
};

exports.createCar = async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();
    res.status(201).json(car);
  } catch (err) {
    console.error('Error creating car:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.listCarsGrpc = async (_, callback) => {
  try {
    const cars = await Car.find();
    const validCars = cars.filter(car => car._id && car.model && car.pricePerDay);
    callback(null, { cars: validCars });
  } catch (err) {
    console.error('gRPC error fetching cars:', err);
    callback(err);
  }
};