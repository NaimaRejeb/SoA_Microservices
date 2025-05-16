const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const travelerProtoPath = path.join(__dirname, '../Protos/Traveler.proto');
const travelerProtoDefinition = protoLoader.loadSync(travelerProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const travelerProto = grpc.loadPackageDefinition(travelerProtoDefinition).traveler;

const getTravelerClient = () =>
  new travelerProto.TravelerService('localhost:50050', grpc.credentials.createInsecure());

const travelerResolvers = {
  Query: {
    traveler: (_, { id }) => {
      const client = getTravelerClient();
      return new Promise((resolve, reject) => {
        client.getTraveler({ traveler_id: id }, (err, response) => {
          err ? reject(err) : resolve(response.traveler);
        });
      });
    },
    travelers: () => {
      const client = getTravelerClient();
      return new Promise((resolve, reject) => {
        client.listAllTravelers({}, (err, response) => {
          err ? reject(err) : resolve(response.travelers);
        });
      });
    },
    findTravelerByEmail: (_, { email }) => {
      const client = getTravelerClient();
      return new Promise((resolve, reject) => {
        client.findTravelerByEmail({ email }, (err, response) => {
          err ? reject(err) : resolve(response.traveler);
        });
      });
    },
  },
  Mutation: {
    createTraveler: (_, { name, email, phoneNumber, preferences }) => {
      const client = getTravelerClient();
      return new Promise((resolve, reject) => {
        client.createTraveler({ 
          name, 
          email, 
          phoneNumber, 
          preferences: preferences ? {
            seatPreference: preferences.seatPreference || null,
            mealPreference: preferences.mealPreference || null,
            notificationEnabled: preferences.notificationEnabled || false
          } : null
        }, (err, response) => {
          err ? reject(err) : resolve(response.traveler);
        });
      });
    },
    updateTravelerName: (_, { id, newName }) => {
      const client = getTravelerClient();
      return new Promise((resolve, reject) => {
        // Utiliser updateTraveler au lieu de updateTravelerName qui n'existe pas
        client.updateTraveler(
          {
            traveler_id: id,
            name: newName
          },
          (err, response) => {
            err ? reject(err) : resolve(response.traveler);
          }
        );
      });
    },
    updateTravelerEmail: (_, { id, email }) => {
      const client = getTravelerClient();
      return new Promise((resolve, reject) => {
        // Utiliser updateTraveler au lieu de updateTravelerEmail qui n'existe pas
        client.updateTraveler(
          { 
            traveler_id: id, 
            email: email 
          },
          (err, response) => {
            err ? reject(err) : resolve(response.traveler);
          }
        );
      });
    },
    updateTravelerPreferences: (_, { id, preferences }) => {
      const client = getTravelerClient();
      return new Promise((resolve, reject) => {
        // Utiliser updateTraveler au lieu de updateTravelerPreferences qui n'existe pas
        client.updateTraveler(
          { 
            traveler_id: id,
            preferences: {
              seatPreference: preferences.seatPreference,
              mealPreference: preferences.mealPreference,
              notificationEnabled: preferences.notificationEnabled
            }
          },
          (err, response) => {
            err ? reject(err) : resolve(response.traveler);
          }
        );
      });
    },
  }
};

module.exports = travelerResolvers;
