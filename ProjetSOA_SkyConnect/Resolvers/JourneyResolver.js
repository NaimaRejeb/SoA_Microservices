const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const journeyProtoPath = path.join(__dirname, '../Protos/Journey.proto');
const journeyProtoDefinition = protoLoader.loadSync(journeyProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const journeyProto = grpc.loadPackageDefinition(journeyProtoDefinition).journey;

const getJourneyClient = () =>
  new journeyProto.JourneyService('localhost:50053', grpc.credentials.createInsecure());

const journeyResolvers = {
  Query: {
    journey: (_, { id }) => {
      const client = getJourneyClient();
      return new Promise((resolve, reject) => {
        client.getJourney({ id }, (err, response) => {
          err ? reject(err) : resolve(response.journey);
        });
      });
    },
    journeys: () => {
      const client = getJourneyClient();
      return new Promise((resolve, reject) => {
        client.listAllJourneys({}, (err, response) => {
          err ? reject(err) : resolve(response.journeys);
        });
      });
    },
    searchJourneys: (_, { departure, arrival, date, passengers, filters }) => {
      const client = getJourneyClient();
      return new Promise((resolve, reject) => {
        client.searchJourneys(
          { 
            departure, 
            arrival, 
            date, 
            passengers: parseInt(passengers || 1),
            filters: filters || {}
          }, 
          (err, response) => {
            err ? reject(err) : resolve(response.journeys);
          }
        );
      });
    },
  },
  Mutation: {
    updateJourneySeats: (_, { id, seatsChange }) => {
      const client = getJourneyClient();
      return new Promise((resolve, reject) => {
        client.updateJourneySeats(
          { id, seatsChange: parseInt(seatsChange) }, 
          (err, response) => {
            err ? reject(err) : resolve(response.journey);
          }
        );
      });
    },
    updateJourneyStatus: (_, { id, status }) => {
      const client = getJourneyClient();
      return new Promise((resolve, reject) => {
        client.updateJourneyStatus(
          { id, status },
          (err, response) => {
            err ? reject(err) : resolve(response.journey);
          }
        );
      });
    },
    addJourney: (_, { 
      journeyNumber, 
      airline, 
      departure, 
      arrival, 
      departureTime, 
      arrivalTime, 
      price, 
      seats, 
      aircraft, 
      cabinClass 
    }) => {
      const client = getJourneyClient();
      return new Promise((resolve, reject) => {
        client.addJourney({
          journeyNumber,
          airline,
          departure,
          arrival,
          departureTime,
          arrivalTime,
          price,
          seats,
          aircraft,
          cabinClass
        }, (err, response) => {
          err ? reject(err) : resolve(response.journey);
        });
      });
    },
  }
};

module.exports = journeyResolvers;
