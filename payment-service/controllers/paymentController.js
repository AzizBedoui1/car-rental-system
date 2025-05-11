const Payment = require('../models/payment');
const { Kafka } = require('kafkajs');

// Kafka Consumer
const kafka = new Kafka({ clientId: 'payment-service', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'payment-group' });

exports.createPayment = async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.startKafkaConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'reservations', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const reservation = JSON.parse(message.value);
      const payment = new Payment({ userId: reservation.userId, amount: 100 });
      await payment.save();
      console.log('Payment processed:', payment);
    }
  });
};