const mongoose = require('mongoose');

const stopoverSchema = new mongoose.Schema({
  airport: { type: String, required: true },
  arrivalTime: { type: Date, required: true },
  departureTime: { type: Date, required: true },
  duration: { type: Number } // durée de l'escale en minutes
});

const journeySchema = new mongoose.Schema({
  journeyId: { type: String, required: true, unique: true },
  journeyNumber: { type: String, required: true },
  airline: { type: String, required: true },
  departure: { type: String, required: true },
  arrival: { type: String, required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  duration: { type: Number }, // durée du vol en minutes
  stopovers: [stopoverSchema], // escales éventuelles
  price: { type: Number, required: true },
  seats: { type: Number, required: true },
  availableSeats: { type: Number },
  capacity: { type: Number },
  aircraft: { type: String }, // type d'avion
  cabinClass: { 
    type: String, 
    enum: ['economy', 'premium_economy', 'business', 'first'], 
    default: 'economy' 
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'power_outlets', 'entertainment', 'meal', 'lounge_access']
  }],
  status: { 
    type: String, 
    enum: ['scheduled', 'delayed', 'in_air', 'landed', 'cancelled'], 
    default: 'scheduled' 
  }
});

// Indexes pour améliorer les performances des requêtes
journeySchema.index({ journeyNumber: 1 });
journeySchema.index({ departure: 1, arrival: 1 });
journeySchema.index({ departureTime: 1 });
journeySchema.index({ price: 1 });

module.exports = mongoose.model('Journey', journeySchema);
