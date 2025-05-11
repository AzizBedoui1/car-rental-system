const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('proto/user.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

const client = new userProto.UserService('127.0.0.1:5006', grpc.credentials.createInsecure());

function testGetUser(userId) {
  return new Promise((resolve, reject) => {
    client.GetUser({ id: userId }, (err, response) => {
      if (err) {
        console.error('Error calling GetUser:', err.message);
        return reject(err);
      }
      console.log('GetUser response:', response);
      resolve(response);
    });
  });
}

async function main() {
  try {
    const userId = '6820810d62e81c5514d74f89'; // Verify this ID
    await testGetUser(userId);
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

main();