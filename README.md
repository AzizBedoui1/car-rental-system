# Car Rental System Documentation

## 1. Project Overview
The **Car Rental System** is a microservices-based application designed to manage car rentals, allowing users to create reservations for cars after validating user existence and car availability. The system uses a combination of **REST**, **GraphQL**, **gRPC**, and **Apache Kafka** for communication, with MongoDB for persistence. It demonstrates service-oriented architecture (SOA) principles, including loose coupling, scalability, and event-driven processing.

### 1.1 Purpose
The system enables:
- **Users** to register and view their details.
- **Cars** to be added and listed with pricing.
- **Reservations** to be created, ensuring valid users and available cars.
- **Notifications** for reservation confirmations (simulated via logging).
- **Event-driven architecture** using Kafka to decouple services.

### 1.2 Key Features
- **REST APIs** for user, car, and reservation management.
- **GraphQL API** for flexible querying and mutations.
- **gRPC** for efficient inter-service communication (user validation, car availability).
- **Kafka** for publishing and consuming reservation events.
- **MongoDB** for data storage.
- **API Gateway** to unify access to services.

### 1.3 Technologies
- **Node.js v20.19.1**: Backend runtime.
- **Express**: REST API framework.
- **Apollo Server**: GraphQL server.
- **gRPC**: High-performance RPC for inter-service communication.
- **Kafka (KafkaJS)**: Event streaming for asynchronous communication.
- **MongoDB**: NoSQL database.
- **Docker**: For running Kafka and ZooKeeper.
- **Environment**: Windows (developed on Lenovo machine).

---

## 2. System Architecture
The system follows a **microservices architecture** with the following components:

### 2.1 Services
1. **User Service**:
   - Manages user data (name, email).
   - Exposes REST (`http://localhost:5002`) and gRPC (`localhost:5006`) endpoints.
2. **Car Service**:
   - Manages car data (model, price per day).
   - Exposes REST (`http://localhost:5005`) and gRPC (`localhost:5001`) endpoints.
3. **Reservation Service**:
   - Manages reservations (user ID, car ID, creation time).
   - Exposes REST (`http://localhost:5003`) and uses gRPC to validate users and check car availability.
4. **API Gateway**:
   - Unifies access via REST and GraphQL (`http://localhost:5000`).
   - Proxies requests to services and publishes reservation events to Kafka.
5. **Notification Service**:
   - Consumes reservation events from Kafka and logs simulated notifications.
6. **Kafka**:
   - Single broker (`localhost:9092`) with ZooKeeper (`localhost:2181`).
   - Hosts `reservations` topic for event streaming.
7. **MongoDB**:
   - Stores data in `car_db` (users, cars, reservations).

### 2.2 Communication
- **REST**: Used by clients (e.g., Postman) and **API Gateway** to interact with services.
- **GraphQL**: Provides a flexible query/mutation interface via **API Gateway**.
- **gRPC**: Used by **reservation service** for efficient validation (user existence, car availability).
- **Kafka**: Publishes reservation events from **API Gateway** and consumes them in **notification service**.

### 2.3 Data Flow
1. A client sends a `createReservation` GraphQL mutation to `http://localhost:5000/graphql`.
2. **API Gateway** proxies the request to `http://localhost:5003/reservations`.
3. **Reservation Service**:
   - Validates user via gRPC (`user.UserService.GetUser`).
   - Checks car availability via gRPC (`car.CarService.CheckCarAvailability`).
   - Saves reservation to MongoDB.
4. **API Gateway** publishes the reservation to Kafka `reservations` topic.
5. **Notification Service** consumes the event and logs a simulated notification.

### 2.4 Diagram

        [Client/Postman]
             |
             v
        [API Gateway] <----> [Kafka (reservations topic)]
        |    |      |                      |
        v    v      v                      v
    [User] [Car] [Reservation] [Notification]
     |      |          |
     v      v          v
    [MongoDB ( car_db ) ]


## 3. Component Details
### 3.1 User Service
- **Location**: `user-service/`
- **Ports**:
  - REST: `http://localhost:5002`
  - gRPC: `localhost:5006`
- **Endpoints**:
  - **POST /users**: Create a user (`{ name, email }`).
  - **GET /users**: List all users.
  - **gRPC GetUser**: Fetch user by ID (`user.UserService.GetUser`).
- **Database**: `car_db.users` (MongoDB).
- **Key Files**:
  - `server.js`: REST and gRPC server logic.
  - `models/user.js`: Mongoose schema.
  - `proto/user.proto`: gRPC service definition.

### 3.2 Car Service
- **Location**: `car-service/`
- **Ports**:
  - REST: `http://localhost:5005`
  - gRPC: `localhost:5001`
- **Endpoints**:
  - **POST /cars**: Add a car (`{ model, pricePerDay }`).
  - **GET /cars**: List all cars.
  - **gRPC CheckCarAvailability**: Check if a car is available (`car.CarService.CheckCarAvailability`).
- **Database**: `car_db.cars` (MongoDB).
- **Key Files**:
  - `server.js`: REST and gRPC server logic.
  - `models/car.js`: Mongoose schema.
  - `proto/car.proto`: gRPC service definition.

### 3.3 Reservation Service
- **Location**: `reservation-service/`
- **Port**: REST: `http://localhost:5003`
- **Endpoints**:
  - **POST /reservations**: Create a reservation (`{ userId, carId }`).
  - **GET /reservations**: List all reservations.
- **gRPC Clients**:
  - Calls `user.UserService.GetUser` to validate user.
  - Calls `car.CarService.CheckCarAvailability` to check car availability.
- **Database**: `car_db.reservations` (MongoDB).
- **Key Files**:
  - `server.js`: REST server and gRPC clients.
  - `models/reservation.js`: Mongoose schema.

### 3.4 API Gateway
- **Location**: `api-gateway/`
- **Port**: `http://localhost:5000`
- **Endpoints**:
  - **REST**:
    - Proxies `/users` to `http://localhost:5002`.
    - Proxies `/cars` to `http://localhost:5005`.
    - Proxies `/reservations` to `http://localhost:5003`.
  - **GraphQL**: `POST /graphql` for queries and mutations.
- **GraphQL Schema**:
  - Types: `User`, `Car`, `Reservation`.
  - Queries: `users`, `cars`, `reservations`.
  - Mutation: `createReservation(userId: String!, carId: String!): Reservation`.
- **Kafka Producer**:
  - Publishes reservation events to `reservations` topic after `createReservation`.
- **Key Files**:
  - `server.js`: Express, Apollo Server, Kafka producer.
  - `routes/gatewayRoutes.js`: REST proxy routes.

### 3.5 Notification Service
- **Location**: `notification-service/`
- **Function**: Consumes messages from Kafka `reservations` topic and logs simulated notifications.
- **Kafka Consumer**:
  - Subscribes to `reservations` with `groupId: notification-group`.
  - Logs messages like: `Simulated email sent for reservation ID: <id>`.
- **Key File**:
  - `server.js`: KafkaJS consumer logic.

### 3.6 Kafka
- **Location**: `kafka/`
- **Components**:
  - ZooKeeper: `localhost:2181`
  - Kafka Broker: `localhost:9092`
  - Topic: `reservations` (1 partition, replication factor 1)
- **Setup**: Docker Compose (`kafka/docker-compose.yml`).
- **Purpose**: Handles event streaming for reservation events.

### 3.7 MongoDB
- **Database**: `car_db`
- **Collections**:
  - `users`: `{ _id, name, email }`
  - `cars`: `{ _id, model, pricePerDay }`
  - `reservations`: `{ _id, userId, carId, createdAt }`
- **Connection**: `mongodb://localhost:27017/car_db`



## 4. Setup Instructions
### 4.1 Prerequisites
- **Node.js**: v20.19.1
- **MongoDB**: Local server (`mongod --dbpath C:\mongodb\data`)
- **Docker Desktop**: For Kafka and ZooKeeper
- **Postman**: For testing APIs
- **Windows**: Tested on Lenovo machine

### 4.2 Installation
1. **Clone Project** (if applicable):
   - Project is at `C:\Users\lenovo\Desktop\cours polytechnique\4eme\s2\soa\car-rental-system`.
2. **Install Dependencies**:
   ```powershell
   cd car-service && npm install
   cd ../user-service && npm install
   cd ../reservation-service && npm install
   cd ../api-gateway && npm install
   cd ../notification-service && npm install
   ```
3. **Set Up Kafka**:
   ```powershell
   cd kafka
   docker-compose up -d
   docker exec -it <kafka-container-name> kafka-topics --create --topic reservations --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
   ```

### 4.3 Running the System
1. **Start MongoDB**:
   ```powershell
   mongod --dbpath C:\mongodb\data
   ```
2. **Start Kafka**:
   ```powershell
   cd C:\Users\lenovo\Desktop\cours polytechnique\4eme\s2\soa\car-rental-system\kafka
   docker-compose up -d
   ```
3. **Start Services**:
   ```powershell
   cd car-service && node server.js
   cd ../user-service && node server.js
   cd ../reservation-service && node server.js
   cd ../api-gateway && node server.js
   cd ../notification-service && node server.js
   ```

### 4.4 Expected Output
- **User Service**: `User Service (REST) on http://localhost:5002`, `User Service (gRPC) on port 5006`
- **Car Service**: `Car Service on http://localhost:5005`, `gRPC server running on port 5001`
- **Reservation Service**: `Reservation Service on http://localhost:5003`
- **API Gateway**: `API Gateway on http://localhost:5000/graphql`, `[Kafka] Producer connected`
- **Notification Service**: `[Kafka] Consumer connected`, `[Kafka] Subscribed to reservations topic`

---

## 5. Usage
### 5.1 Creating a User
- **Endpoint**: `POST http://localhost:5002/users`
- **Body**:
  ```json
  {"name": "Bob", "email": "bob@example.com"}
  ```
- **Response**:
  ```json
  {"_id": "6820810d62e81c5514d74f89", "name": "Bob", "email": "bob@example.com"}
  ```

### 5.2 Adding a Car
- **Endpoint**: `POST http://localhost:5005/cars`
- **Body**:
  ```json
  {"model": "Test Car", "pricePerDay": 100}
  ```
- **Response**:
  ```json
  {"_id": "68208c4572b59084e104a155", "model": "Test Car", "pricePerDay": 100}
  ```

### 5.3 Creating a Reservation (GraphQL)
- **Endpoint**: `POST http://localhost:5000/graphql`
- **Body**:
  ```json
  {
    "query": "mutation { createReservation(userId: \"6820810d62e81c5514d74f89\", carId: \"68208c4572b59084e104a155\") { id userId carId createdAt } }"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "createReservation": {
        "id": "<reservationId>",
        "userId": "6820810d62e81c5514d74f89",
        "carId": "68208c4572b59084e104a155",
        "createdAt": "<timestamp>"
      }
    }
  }
  ```
- **Side Effect**: Publishes to Kafka `reservations` topic, consumed by **notification service**.

### 5.4 Viewing Notifications
- Check **notification service** logs:
  ```
  [Notification] Received reservation: { id: '<reservationId>', userId: '6820810d62e81c5514d74f89', carId: '68208c4572b59084e104a155', createdAt: '<timestamp>' }
  [Notification] Simulated email sent for reservation ID: <reservationId>, User: 6820810d62e81c5514d74f89, Car: 68208c4572b59084e104a155
  ```

### 5.5 Testing gRPC
- Use `test-user-grpc.js` and `test-car-grpc.js`:
  ```powershell
  node test-user-grpc.js
  node test-car-grpc.js
  ```

---

## 6. Testing
- **Postman**:
  - Test REST endpoints (`/users`, `/cars`, `/reservations`).
  - Test GraphQL mutation (`createReservation`).
- **GraphQL Playground**: Access `http://localhost:5000/graphql` for interactive testing.
- **Kafka Console Consumer**:
  ```powershell
  docker exec -it <kafka-container-name> kafka-console-consumer --bootstrap-server localhost:9092 --topic reservations --fromBeginning
  ```
- **MongoDB**:
  ```powershell
  mongosh
  use car_db
  db.users.find()
  db.cars.find()
  db.reservations.find()
  ```

---

## 7. Known Issues
- **Socket Hang Up**: REST `POST` requests via **API Gateway** (`http://localhost:5000/reservations`) may fail with `socket hang up`. Likely caused by `http-proxy-middleware` in `gatewayRoutes.js`.
- **Kafka Limitations**:
  - Single broker setup is not production-ready.
  - `reservations` topic has one partition, limiting parallelism.
- **Notification Service**: Currently logs notifications; real email integration requires Nodemailer and email provider setup.

---

## 8. Future Improvements
1. **Enhance Kafka**:
   - Add partitions to `reservations` topic:
     ```powershell
     docker exec -it <kafka-container-name> kafka-topics --alter --topic reservations --partitions 3
     ```
   - Use Confluent Cloud for managed Kafka in production.
2. **Real Notifications**:
   - Integrate Nodemailer in `notification-service`:
     ```javascript
     const nodemailer = require('nodemailer');
     const transporter = nodemailer.createTransport({
       service: 'gmail',
       auth: { user: 'your-email@gmail.com', pass: 'your-app-password' },
     });
     ```
   - Fetch user email via `axios.get('http://localhost:5002/users')`.
3. **Add Date Ranges**:
   - Update `car.proto` to include `startDate` and `endDate` for availability checks:
     ```proto
     message CheckCarAvailabilityRequest {
       string carId = 1;
       string startDate = 2;
       string endDate = 3;
     }
     ```
4. **Authentication**:
   - Add JWT-based authentication to REST and GraphQL endpoints.
5. **Monitoring**:
   - Integrate Prometheus and Grafana for metrics.
   - Add logging with Winston or ELK stack.
6. **Testing**:
   - Write unit tests with Jest.
   - Add integration tests for end-to-end flows.

---

## 9. Maintenance
- **Logs**:
  - Check service logs in each terminal.
  - Kafka logs: `docker logs <kafka-container-name>`.
- **Debugging**:
  - Use `console.log` statements (e.g., `[Kafka]`, `[GraphQL]`, `[Notification]`).
  - Inspect MongoDB with `mongosh`.
- **Shutdown**:
  - Stop services with `Ctrl+C`.
  - Stop Kafka:
    ```powershell
    cd kafka
    docker-compose down
    ```

---

## 10. Appendix
### 10.1 Sample Data
- **User**:
  ```json
  {"_id": "6820810d62e81c5514d74f89", "name": "Bob", "email": "bob@example.com"}
  ```
- **Car**:
  ```json
  {"_id": "68208c4572b59084e104a155", "model": "Test Car", "pricePerDay": 100}
  ```
- **Reservation**:
  ```json
  {"_id": "<reservationId>", "userId": "6820810d62e81c5514d74f89", "carId": "68208c4572b59084e104a155", "createdAt": "<timestamp>"}
  ```

### 10.2 Key Commands
- **Start MongoDB**: `mongod --dbpath C:\mongodb\data`
- **Start Kafka**: `cd kafka && docker-compose up -d`
- **Create Topic**: `docker exec -it <kafka-container-name> kafka-topics --create --topic reservations --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1`
- **Consume Kafka Messages**: `docker exec -it <kafka-container-name> kafka-console-consumer --bootstrap-server localhost:9092 --topic reservations --fromBeginning`

### 10.3 Dependencies
- **Common**: `express`, `mongoose`, `axios`, `cors`
- **User Service**: `grpc`, `@grpc/proto-loader`
- **Car Service**: `grpc`, `@grpc/proto-loader`
- **Reservation Service**: `grpc`, `@grpc/proto-loader`
- **API Gateway**: `apollo-server-express`, `graphql`, `http-proxy-middleware`, `kafkajs`
- **Notification Service**: `kafkajs`

---
## 11. Presentation Du Projet

https://www.canva.com/design/DAGnLexhDpU/HNzn-bVccbDuq3hovXJelA/edit?utm_content=DAGnLexhDpU&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

## 12. Contact
For issues or contributions, contact the developer at [beduiaziz18@gmail.com] or refer to the project repository (if hosted).
