// TravelerMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const path = require('path');
const Traveler = require('../Models/Traveler'); 

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/travel_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Charger le nouveau fichier Traveler.proto
const travelerProtoPath = path.join(__dirname, '..', 'Protos', 'Traveler.proto');

const travelerProtoDefinition = protoLoader.loadSync(travelerProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const travelerProto = grpc.loadPackageDefinition(travelerProtoDefinition).traveler;

// Implémenter le service traveler avec Mongoose
const travelerService = {
  getTraveler: async (call, callback) => {
    try {
      // Rechercher par le champ id personnalisé au lieu de _id
      const traveler = await Traveler.findOne({ id: call.request.traveler_id });

      if (!traveler) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Voyageur non trouvé"
        });
      }
      callback(null, { traveler: traveler.toObject() });
    } catch (err) {
      console.error('Erreur dans getTraveler:', err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur serveur: " + err.message
      });
    }
  },

  createTraveler: async (call, callback) => {
    try {
      const { name, email, phoneNumber, preferences, traveler_id } = call.request;
      
      // Utiliser le traveler_id fourni ou générer un nouvel ID
      const travelerId = traveler_id || Date.now().toString() + Math.floor(Math.random() * 10000).toString();
      
      const newTraveler = new Traveler({
        id: travelerId,
        name,
        email,
        phoneNumber,
        preferences
      });
      
      const savedTraveler = await newTraveler.save();
      callback(null, { traveler: savedTraveler.toObject() });
    } catch (err) {
      console.error('Erreur dans createTraveler:', err);
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la création: " + err.message
      });
    }
  },

  updateTraveler: async (call, callback) => {
  try {
    const { traveler_id, name, email, phoneNumber, preferences } = call.request;
    
    // Construire l'objet de mise à jour avec seulement les champs fournis
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (preferences !== undefined) updateData.preferences = preferences;
    
    // Utiliser findOneAndUpdate avec le champ id personnalisé
    const updatedTraveler = await Traveler.findOneAndUpdate(
      { id: traveler_id },
      updateData,
      { new: true }
    );

    if (!updatedTraveler) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Voyageur non trouvé"
      });
    }

    callback(null, { traveler: updatedTraveler.toObject() });
  } catch (err) {
    console.error('Erreur dans updateTraveler:', err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Erreur lors de la mise à jour: " + err.message
    });
  }
},

  listAllTravelers: async (call, callback) => {
    try {
      const { page = 1, limit = 10 } = call.request;
      const skip = (page - 1) * limit;

      const travelers = await Traveler.find()
        .skip(skip)
        .limit(limit);

      callback(null, { travelers: travelers.map(t => t.toObject()) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la récupération"
      });
    }
  },
  
  deleteTraveler: async (call, callback) => {
    try {
      const result = await Traveler.findByIdAndDelete(call.request.traveler_id);
      
      if (!result) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: "Voyageur non trouvé"
        });
      }
      
      callback(null, { message: "Voyageur supprimé avec succès" });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: "Erreur lors de la suppression"
      });
    }
  }
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(travelerProto.TravelerService.service, travelerService);
const port = 50050; // Port différent des autres services
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('Échec de la liaison du serveur:', err);
      return;
    }
    console.log(`Serveur Traveler en écoute sur le port ${port}`);
    server.start();
  });
