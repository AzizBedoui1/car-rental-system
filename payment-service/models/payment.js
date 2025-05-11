const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true }
});

module.exports = mongoose.model('Payment', paymentSchema);