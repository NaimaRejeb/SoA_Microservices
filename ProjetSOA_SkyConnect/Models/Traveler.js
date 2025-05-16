// Models/Traveler.js
const mongoose = require('mongoose');

const travelerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String },
  preferences: {
    seatPreference: { type: String, enum: ['window', 'aisle', 'middle'], default: 'window' },
    mealPreference: { type: String, enum: ['regular', 'vegetarian', 'vegan', 'kosher', 'halal'] },
    notificationEnabled: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Traveler', travelerSchema);
