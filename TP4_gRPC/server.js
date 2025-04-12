const grpc = require('@grpc/grpc-js');
const protoloader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'hello.proto');

const packageDefinition = protoloader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello; // loadPackageDefinition est une fonction synchrone qui renvoie un objet contenant les définitions de tous les services et messages définis dans le fichier .proto pour le package hello.

function sayHello(call, callback) {
    const { name } = call.request;
    const reply = { message: `Bonjour, ${name} !` }; 
    callback(null, reply);
}

function main() {
    const server = new grpc.Server();
    server.addService(helloProto.Greeter.service, {
        SayHello: sayHello
    });
    const port = '0.0.0.0:50051';
    server.bindAsync(port, grpc.ServerCredentials.createInsecure(), () => {
        console.log(`Serveur gRPC démarré sur ${port}`); 
    });
}
main();