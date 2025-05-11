const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('proto/car.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const carProto = grpc.loadPackageDefinition(packageDefinition).car;

const client = new carProto.CarService('127.0.0.1:5001', grpc.credentials.createInsecure());

function testCheckCarAvailability(carId) {
  return new Promise((resolve, reject) => {
    client.CheckCarAvailability({ carId }, (err, response) => {
      if (err) {
        console.error('Error calling CheckCarAvailability:', err.message);
        return reject(err);
      }
      console.log('CheckCarAvailability response:', response);
      resolve(response);
    });
  });
}

async function main() {
  try {
    const carId = '68208143eab8635428d90d35'; // Verify this ID
    await testCheckCarAvailability(carId);
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

main();