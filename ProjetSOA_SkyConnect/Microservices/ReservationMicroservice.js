// ReservationMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const path = require('path');
const Reservation = require('../Models/Reservation'); 

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/travel_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Charger le fichier Reservation.proto
const reservationProtoPath = path.join(__dirname, '..', 'Protos', 'Reservation.proto');

const reservationProtoDefinition = protoLoader.loadSync(reservationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;

// Implémenter le service reservation avec Mongoose
const reservationService = {
  GetReservation: async (call, callback) => {
    try {
      // Trouver toutes les réservations avec le statut donné
      const reservations = await Reservation.find({ status: call.request.status });
      
      if (!reservations || reservations.length === 0) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Aucune réservation trouvée avec ce statut"
        });
      }
  
      // Si des réservations sont trouvées, renvoyer la liste
      callback(null, { reservations: reservations.map(reservation => reservation.toObject()) });
      
    } catch (err) {
      console.error("Erreur dans GetReservation:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur serveur"
      });
    }
  },
  
  CreateReservation: async (call, callback) => {
    try {
      const { traveler_id, journeyId, passengersCount, totalPrice, contactEmail, contactPhone } = call.request;
      console.log("Requête reçue pour CreateReservation avec :", call.request);
  
      // Validation des champs requis
      if (!traveler_id || !journeyId || !contactEmail) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          details: "Champs requis manquants: traveler_id, journeyId et contactEmail sont obligatoires"
        });
      }

      // Création de la réservation
      const newReservation = new Reservation({
        id: Math.random().toString(36).substr(2, 9),
        traveler_id: traveler_id,
        journeyId: journeyId,
        passengersCount: passengersCount || 1,
        totalPrice: totalPrice || 0,
        contactEmail,
        contactPhone: contactPhone || "",
        status: 'pending',
        reservationDate: new Date()
      });
  
      const savedReservation = await newReservation.save();
      console.log("Réservation sauvegardée :", savedReservation);
  
      // Retourner avec le bon nom de champ 'reservation'
      callback(null, { reservation: savedReservation.toObject() });
  
    } catch (err) {
      console.error(" Erreur MongoDB:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la création de la réservation"
      });
    }
  },  

  listAllReservations: async (call, callback) => {
    try {
      const { page = 1, limit = 10 } = call.request;
      const skip = (page - 1) * limit;
      const reservations = await Reservation.find()
        .skip(skip)
        .limit(limit);
      callback(null, { reservations: reservations.map(r => r.toObject()) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la récupération"
      });
    }
  },
  // Get reservations by travelerId
getTravelerReservations: async (call, callback) => {
  try {
    console.log("Requête reçue pour getTravelerReservations avec :", call.request);
    
    const { traveler_id } = call.request;
    
    if (!traveler_id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: "L'ID du voyageur est requis"
      });
    }
    
    const reservations = await Reservation.find({ traveler_id: traveler_id });
    
    if (!reservations || reservations.length === 0) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Aucune réservation trouvée pour ce voyageur"
      });
    }
    
    callback(null, { reservations: reservations.map(r => r.toObject()) });
  } catch (err) {
    console.error("Erreur dans getTravelerReservations:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Erreur lors de la récupération des réservations du voyageur"
    });
  }
},
DeleteReservation: async (call, callback) => {
  try {
    console.log("ID reçu pour suppression:", call.request.reservation_id);
    
    if (!call.request.reservation_id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: "L'ID de réservation est requis"
      });
    }
    
    // Supprimer par le champ id personnalisé
    const result = await Reservation.findOneAndDelete({ id: call.request.reservation_id });
    
    if (!result) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Réservation non trouvée"
      });
    }
    
    callback(null, { message: "Réservation supprimée avec succès" });
  } catch (err) {
    console.error("Erreur dans DeleteReservation:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Erreur lors de la suppression de la réservation"
    });
  }
}
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(reservationProto.ReservationService.service, reservationService);
const port = 50052; // Port différent des autres services
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('Échec de la liaison du serveur:', err);
      return;
    }
    console.log(`Serveur Reservation en écoute sur le port ${port}`);
    server.start();
  });
