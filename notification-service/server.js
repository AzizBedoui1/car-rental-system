const { Kafka } = require('kafkajs');

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

async function startConsumer() {
  try {
    // Connect to Kafka
    await consumer.connect();
    console.log('[Kafka] Consumer connected');

    // Subscribe to reservations topic
    await consumer.subscribe({ topic: 'reservations', fromBeginning: true });
    console.log('[Kafka] Subscribed to reservations topic');

    // Process messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const reservation = JSON.parse(message.value.toString());
          console.log('[Notification] Received reservation:', reservation);
          console.log(
            `[Notification] Simulated email sent for reservation ID: ${reservation.id}, User: ${reservation.userId}, Car: ${reservation.carId}`
          );
        } catch (error) {
          console.error('[Notification] Error processing message:', error.message);
        }
      },
    });
  } catch (error) {
    console.error('[Kafka] Consumer error:', error.message);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Kafka] Disconnecting consumer...');
  await consumer.disconnect();
  process.exit(0);
});

startConsumer().catch(error => {
  console.error('[Kafka] Failed to start consumer:', error);
});