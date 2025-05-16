const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  traveler_id: { type: String, required: true },
  journeyId: { type: String, required: true },
  passengersCount: { type: Number, default: 1, min: 1 },
  seatNumbers: [{ type: String }],
  totalPrice: { type: Number, required: true },
  reservationDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending', 'checked-in', 'boarded', 'completed', 'refunded'], 
    default: 'pending',
  },
  paymentInfo: {
    paymentMethod: { type: String, enum: ['credit_card', 'paypal', 'bank_transfer', 'cash'] },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'refunded', 'failed'], default: 'pending' },
    transactionId: { type: String },
    paymentDate: { type: Date }
  },
  baggageAllowance: { type: Number, default: 1 },
  specialRequests: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String }
});

// Ajout d'index pour accélérer les recherches
reservationSchema.index({ traveler_id: 1 });
reservationSchema.index({ journeyId: 1 });
reservationSchema.index({ status: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;
