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
  console.log('User Service: Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});
const User = mongoose.model('User', userSchema);

// REST Routes
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Missing name or email' });
    }
    const user = new User({ name, email });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// gRPC Server
const packageDefinition = protoLoader.loadSync('../proto/user.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

const server = new grpc.Server();

server.addService(userProto.UserService.service, {
  GetUser: async (call, callback) => {
    try {
      console.log(`[gRPC] GetUser called with id: ${call.request.id}`);
      const user = await User.findById(call.request.id);
      if (!user) {
        return callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
      }
      callback(null, { id: user._id.toString(), name: user.name, email: user.email });
    } catch (err) {
      console.error(`[gRPC] GetUser error: ${err.message}`);
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
});

server.bindAsync('0.0.0.0:5006', grpc.ServerCredentials.createInsecure(), () => {
  console.log('User Service (gRPC) on port 5006');
});

// Start REST server
app.listen(5002, () => console.log('User Service (REST) on http://localhost:5002'));