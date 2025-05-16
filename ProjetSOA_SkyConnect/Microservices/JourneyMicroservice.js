// JourneyMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const path = require('path');
const Journey = require('../Models/Journey'); 

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/travel_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Charger le nouveau fichier Journey.proto
const journeyProtoPath = path.join(__dirname, '..', 'Protos', 'Journey.proto');

const journeyProtoDefinition = protoLoader.loadSync(journeyProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const journeyProto = grpc.loadPackageDefinition(journeyProtoDefinition).journey;

// Implémenter le service journey avec Mongoose
const journeyService = {
  getJourney: async (call, callback) => {
    try {
      const journey = await Journey.findOne({ journeyId: call.request.journey_id });
      if (!journey) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Trajet non trouvé"
        });
      }
      callback(null, { journey: journey.toObject() });
    } catch (err) {
      console.error("Erreur dans getJourney:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur serveur"
      });
    }
  },

  searchJourneys: async (call, callback) => {
    try {
      const { departure, arrival, departureDate, passengers, cabinClass } = call.request;
      const query = { 
        departure: new RegExp(departure, 'i'),
        arrival: new RegExp(arrival, 'i')
      };
      
      // Ajout des filtres optionnels
      if (departureDate) {
        const startDate = new Date(departureDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        query.departureTime = {
          $gte: startDate,
          $lt: endDate
        };
      }
      
      if (cabinClass) {
        query.cabinClass = cabinClass;
      }
      
      // Recherche des trajets qui correspondent à la requête
      const journeys = await Journey.find(query);
      
      // Filtrer par nombre de passagers si spécifié
      let filteredJourneys = journeys;
      if (passengers) {
        filteredJourneys = journeys.filter(j => j.availableSeats >= passengers);
      }
      
      callback(null, { journeys: filteredJourneys.map(j => j.toObject()) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la recherche"
      });
    }
  },

  updateJourneySeats: async (call, callback) => {
    try {
      const { journey_id, seatsChange } = call.request;
      const journey = await Journey.findOne({ journeyId: journey_id });

      if (!journey) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Trajet non trouvé"
        });
      }

      // Vérifier qu'il y a assez de sièges disponibles
      if (journey.availableSeats + seatsChange < 0) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          details: "Nombre de sièges insuffisant"
        });
      }

      journey.availableSeats += seatsChange;
      const updatedJourney = await journey.save();

      callback(null, { journey: updatedJourney.toObject() });
    } catch (err) {
      console.error("Erreur dans updateJourneySeats:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la mise à jour"
      });
    }
  },
  
  updateJourneyStatus: async (call, callback) => {
    try {
      const { journey_id, status } = call.request;
      const journey = await Journey.findOne({ journeyId: journey_id });

      if (!journey) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Trajet non trouvé"
        });
      }

      journey.status = status;
      const updatedJourney = await journey.save();

      callback(null, { journey: updatedJourney.toObject() });
    } catch (err) {
      console.error("Erreur dans updateJourneyStatus:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la mise à jour du statut"
      });
    }
  },

  listAllJourneys: async (call, callback) => {
    try {
      const { page = 1, limit = 10 } = call.request;
      const skip = (page - 1) * limit;

      const journeys = await Journey.find()
        .skip(skip)
        .limit(limit);

         // Transformer les objets pour s'assurer que id = journeyId
      const transformedJourneys = journeys.map(journey => {
        const journeyObj = journey.toObject();
        journeyObj.id = journeyObj.journeyId;
        return journeyObj;
      });

      // Utiliser les objets transformés dans le callback
      callback(null, { journeys: transformedJourneys });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la récupération"
      });
    }
  },

  createJourney: async (call, callback) => {
    try {
      const journeyData = call.request;
      // S'assurer que journeyNumber est défini
      if (!journeyData.journeyNumber && journeyData.flightNumber) {
        journeyData.journeyNumber = journeyData.flightNumber;
        delete journeyData.flightNumber;
      }
      
      // Générer un journeyId unique
      const journeyId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      
      const newJourney = new Journey({
        id: journeyId, // Utiliser le même ID que journeyId
        journeyId: journeyId,
        ...journeyData,
        availableSeats: journeyData.seats || journeyData.capacity || 100, // Valeur par défaut si non spécifiée
        status: journeyData.status || 'scheduled' // Statut par défaut
      });

      const savedJourney = await newJourney.save();
      console.log("Nouveau trajet créé avec journeyId:", journeyId);
      callback(null, { journey: savedJourney.toObject() });
    } catch (err) {
      console.error("Erreur dans createJourney:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la création"
      });
    }
  },
  
  // Méthode addJourney comme alias de createJourney pour le support GraphQL
  addJourney: async (call, callback) => {
    try {
      const journeyData = call.request;
      // Générer un journeyId unique
      const journeyId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      
      const newJourney = new Journey({
        id: journeyId,
        journeyId: journeyId,
        journeyNumber: journeyData.journeyNumber,
        airline: journeyData.airline,
        departure: journeyData.departure,
        arrival: journeyData.arrival,
        departureTime: journeyData.departureTime,
        arrivalTime: journeyData.arrivalTime,
        price: journeyData.price,
        seats: journeyData.seats,
        availableSeats: journeyData.seats,
        aircraft: journeyData.aircraft || 'Standard',
        cabinClass: journeyData.cabinClass || 'economy',
        status: 'scheduled'
      });

      const savedJourney = await newJourney.save();
      console.log("Nouveau trajet créé avec journeyId (via addJourney):", journeyId);
      callback(null, { journey: savedJourney.toObject() });
    } catch (err) {
      console.error("Erreur dans addJourney:", err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de l'ajout du trajet: " + err.message
      });
    }
  }
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(journeyProto.JourneyService.service, journeyService);
const port = 50053; // Port différent des autres services
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('Échec de la liaison du serveur:', err);
      return;
    }
    console.log(`Serveur Journey en écoute sur le port ${port}`);
    server.start();
  });
