const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const reservationProtoPath = path.join(__dirname, '../Protos/Reservation.proto');
const reservationProtoDefinition = protoLoader.loadSync(reservationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;

const grpcClient = new reservationProto.ReservationService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

const reservationResolvers = {
  Query: {
    reservation: async (_, { status }) => {
      return new Promise((resolve, reject) => {
        grpcClient.getReservation({ status }, (err, response) => {
          if (err) {
            console.error("Erreur GraphQL getReservation:", err);
            return reject(err);
          }
          resolve(response.reservations);
        });
      });
    },    
    reservations: () => {
      return new Promise((resolve, reject) => {
        grpcClient.listAllReservations({}, (err, response) => {
          err ? reject(err) : resolve(response.reservations);
        });
      });
    },
    reservationsByTraveler: (_, { traveler_id }) => {
      return new Promise((resolve, reject) => {
        grpcClient.getTravelerReservations(
          { traveler_id },
          (err, response) => {
            err ? reject(err) : resolve(response.reservations);
          }
        );
      });
    },
  },

  Mutation: {
    createReservation: (_, { 
      traveler_id, 
      journeyId, 
      passengersCount, 
      seatNumbers, 
      totalPrice, 
      contactEmail, 
      contactPhone 
    }) => {
      return new Promise((resolve, reject) => {
        grpcClient.createReservation(
          { 
            traveler_id, 
            journeyId, 
            passengersCount, 
            seatNumbers, 
            totalPrice, 
            contactEmail, 
            contactPhone 
          },
          (err, response) => {
            err ? reject(err) : resolve(response.reservation);
          }
        );
      });
    },
    cancelReservation: (_, { id }) => {
      console.log(`Tentative d'annulation de la réservation avec ID: ${id}`);
      return new Promise((resolve, reject) => {
        grpcClient.deleteReservation({ reservation_id: id }, (err, response) => {
          if (err) {
            console.error("Erreur lors de l'annulation de la réservation:", err);
            return reject(err);
          }
          resolve({ success: true, message: response.message || 'Réservation annulée avec succès' });
        });
      });
    },
    updateReservationStatus: (_, { id, status }) => {
      return new Promise((resolve, reject) => {
        grpcClient.updateReservationStatus(
          { id, status },
          (err, response) => {
            err ? reject(err) : resolve(response.reservation);
          }
        );
      });
    },
  }
};

module.exports = reservationResolvers;
