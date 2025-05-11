const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  carId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Reservation', reservationSchema);