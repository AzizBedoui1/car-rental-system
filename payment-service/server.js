const express = require('express');
const mongoose = require('mongoose');
const paymentController = require('./controllers/paymentController');

mongoose.connect('mongodb://127.0.0.1:27017/payment_db')
  .then(() => console.log('Payment Service: Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

const app = express();
app.use(express.json());
app.post('/payments', paymentController.createPayment);

paymentController.startKafkaConsumer().catch(console.error);

app.listen(5004, () => console.log('Payment Service on http://localhost:5004'));