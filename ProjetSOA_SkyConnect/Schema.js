const { gql } = require('@apollo/server');

// Schéma GraphQL pour Reservation
const reservationTypeDefs = `#graphql
  type PaymentInfo {
    paymentMethod: String
    paymentStatus: String
    transactionId: String
    paymentDate: String
  }

  type Reservation {
    id: String!
    travelerId: String!
    journeyId: String!
    passengersCount: Int
    seatNumbers: [String]
    totalPrice: Float
    reservationDate: String
    status: String! # "confirmed", "cancelled", "pending", "checked-in", "boarded", "completed", "refunded"
    paymentInfo: PaymentInfo
    baggageAllowance: Int
    specialRequests: String
    contactEmail: String
    contactPhone: String
  }

  input PaymentInfoInput {
    paymentMethod: String
    paymentStatus: String
    transactionId: String
    paymentDate: String
  }

  type Query {
    reservation(status: String!): [Reservation]
    reservations: [Reservation]
    reservationsByTraveler(travelerId: String!): [Reservation]
    getReservationDetails(id: String!): Reservation
  }

  type Mutation {
    createReservation(travelerId: String!, journeyId: String!, passengersCount: Int, seatNumbers: [String], totalPrice: Float!, contactEmail: String, contactPhone: String): Reservation
    cancelReservation(id: String!): String
    updateReservationStatus(id: String!, status: String!): Reservation
    updatePaymentInfo(id: String!, paymentInfo: PaymentInfoInput!): Reservation
    addSpecialRequest(id: String!, request: String!): Reservation
  }
`;

// Schéma GraphQL pour Journey
const journeyTypeDefs = `#graphql
  type Stopover {
    airport: String!
    arrivalTime: String!
    departureTime: String!
    duration: Int
  }

  type Journey {
    id: String!
    journeyNumber: String!
    airline: String!
    departure: String!
    arrival: String!
    departureTime: String!
    arrivalTime: String!
    duration: Int
    stopovers: [Stopover]
    price: Float!
    seats: Int!
    availableSeats: Int!
    capacity: Int
    aircraft: String
    cabinClass: String
    amenities: [String]
    status: String
  }

  input StopoverInput {
    airport: String!
    arrivalTime: String!
    departureTime: String!
    duration: Int
  }

  input JourneyFilterInput {
    airline: String
    minPrice: Float
    maxPrice: Float
    cabinClass: String
    departureTime: String
    amenities: [String]
    directOnly: Boolean
  }

  type Query {
    journey(id: String!): Journey
    journeys: [Journey]
    searchJourneys(departure: String!, arrival: String!, date: String, passengers: Int, filters: JourneyFilterInput): [Journey]
    getJourneysByAirline(airline: String!): [Journey]
    getJourneyStatistics: JourneyStats
  }

  type JourneyStats {
    totalJourneys: Int
    availableJourneys: Int
    mostPopularRoutes: [String]
    averagePrice: Float
  }

  type Mutation {
    updateJourneySeats(id: String!, seatsChange: Int!): Journey
    updateJourneyStatus(id: String!, status: String!): Journey
    addJourney(journeyNumber: String!, airline: String!, departure: String!, arrival: String!, departureTime: String!, arrivalTime: String!, price: Float!, seats: Int!, aircraft: String, cabinClass: String): Journey
    createJourney(
      journeyNumber: String! 
      airline: String! 
      departure: String! 
      arrival: String! 
      departureTime: String! 
      arrivalTime: String! 
      price: Float! 
      seats: Int! 
      aircraft: String 
      cabinClass: String
    ): Journey
  }
`;

// Schéma GraphQL pour Traveler
const travelerTypeDefs = `#graphql
  type TravelerPreferences {
    seatPreference: String
    mealPreference: String
    notificationEnabled: Boolean
  }

  type Traveler {
    id: String!
    name: String!
    email: String!
    phoneNumber: String
    preferences: TravelerPreferences
    createdAt: String
  }

  input TravelerPreferencesInput {
    seatPreference: String
    mealPreference: String
    notificationEnabled: Boolean
  }

  type Query {
    traveler(id: String!): Traveler
    travelers: [Traveler]
    findTravelerByEmail(email: String!): Traveler
    getTravelerPreferences(id: String!): TravelerPreferences
  }

  type Mutation {
    createTraveler(name: String!, email: String!, phoneNumber: String, preferences: TravelerPreferencesInput): Traveler
    updateTravelerName(id: String!, newName: String!): Traveler
    updateTravelerEmail(id: String!, email: String!): Traveler
    updateTravelerPreferences(id: String!, preferences: TravelerPreferencesInput!): Traveler
    updateTravelerPhone(id: String!, phoneNumber: String!): Traveler
  }
`;

module.exports = {
  reservationTypeDefs,
  journeyTypeDefs,
  travelerTypeDefs
};