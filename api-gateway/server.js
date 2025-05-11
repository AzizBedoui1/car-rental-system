const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const axios = require('axios');
const cors = require('cors');
const router = require('./routes/gatewayRoutes');
const { Kafka } = require('kafkajs');

const app = express();

// Enable CORS
app.use(cors());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[API Gateway] Received: ${req.method} ${req.originalUrl}`);
  next();
});

// Initialize Kafka Producer
const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: ['localhost:9092'],
});
const producer = kafka.producer();

// GraphQL Schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String
  }
  type Car {
    id: ID!
    model: String!
    pricePerDay: Float!
  }
  type Reservation {
    id: ID!
    userId: String!
    carId: String!
    createdAt: String!
  }
  type Query {
    users: [User]
    cars: [Car]
    reservations: [Reservation]
  }
  type Mutation {
    createReservation(userId: String!, carId: String!): Reservation
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    users: async () => {
      try {
        const response = await axios.get('http://localhost:5002/users', { timeout: 5000 });
        return response.data.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
        }));
      } catch (error) {
        console.error('[GraphQL] Error fetching users:', error.message);
        return [];
      }
    },
    cars: async () => {
      try {
        const response = await axios.get('http://localhost:5005/cars', { timeout: 5000 });
        return response.data
          .filter(car => car._id && car.model && car.pricePerDay)
          .map(car => ({
            id: car._id,
            model: car.model,
            pricePerDay: car.pricePerDay,
          }));
      } catch (error) {
        console.error('[GraphQL] Error fetching cars:', error.message);
        return [];
      }
    },
    reservations: async () => {
      try {
        const response = await axios.get('http://localhost:5003/reservations', { timeout: 5000 });
        return response.data.map(reservation => ({
          id: reservation._id,
          userId: reservation.userId,
          carId: reservation.carId,
          createdAt: reservation.createdAt,
        }));
      } catch (error) {
        console.error('[GraphQL] Error fetching reservations:', error.message);
        return [];
      }
    },
  },
  Mutation: {
    createReservation: async (_, { userId, carId }) => {
      try {
        console.log(`[GraphQL] Creating reservation: userId=${userId}, carId=${carId}`);
        const response = await axios.post(
          'http://localhost:5003/reservations',
          { userId, carId },
          { timeout: 5000 }
        );
        const reservation = {
          id: response.data._id,
          userId: response.data.userId,
          carId: response.data.carId,
          createdAt: response.data.createdAt,
        };
        console.log('[GraphQL] Reservation created:', reservation);

        // Publish to Kafka
        await producer.send({
          topic: 'reservations',
          messages: [
            {
              value: JSON.stringify(reservation),
            },
          ],
        });
        console.log('[Kafka] Published reservation to reservations topic:', reservation);

        return reservation;
      } catch (error) {
        console.error('[GraphQL] Error creating reservation:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Failed to create reservation');
      }
    },
  },
};

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});

async function startServer() {
  // Start Apollo Server
  await server.start();

  // Apply Apollo middleware for /graphql
  server.applyMiddleware({ app, path: '/graphql' });

  // Parse JSON bodies for non-GraphQL routes
  app.use((req, res, next) => {
    if (req.path === '/graphql') return next();
    express.json()(req, res, next);
  });

  // Proxy REST routes
  app.use('/', router);

  // Connect Kafka Producer
  await producer.connect();
  console.log('[Kafka] Producer connected');

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('[API Gateway] Express error:', err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  // Start Express server
  const PORT = 5000;
  app.listen(PORT, () =>
    console.log(`API Gateway on http://localhost:${PORT}${server.graphqlPath}`)
  );
}

startServer().catch(error => {
  console.error('[API Gateway] Failed to start server:', error);
});