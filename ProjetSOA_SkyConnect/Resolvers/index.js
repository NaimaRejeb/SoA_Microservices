const { mergeResolvers } = require('@graphql-tools/merge');
const reservationResolvers = require('./ReservationResolver');
const journeyResolvers = require('./JourneyResolver');
const travelerResolvers = require('./TravelerResolver');

const resolvers = [
  reservationResolvers,
  journeyResolvers,
  travelerResolvers,
];

module.exports = mergeResolvers(resolvers);
