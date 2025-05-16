const { faker } = require('@faker-js/faker/locale/fr');
const mongoose = require('mongoose');
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/travel_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
}
// Import des modèles renommés
const Journey = require('./Models/Journey');
const Reservation = require('./Models/Reservation');
const Traveler = require('./Models/Traveler');

// Configuration Faker
faker.seed(123); // Pour des résultats reproductibles

// 1. Génération des données
const generateJourneys = (count = 20) => {
  return Array.from({ length: count }).map(() => ({
    journeyId: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
    journeyNumber: `${faker.airline.airline().iataCode}${faker.airline.flightNumber()}`,
    airline: faker.airline.airline().name,
    departure: faker.location.city(),
    arrival: faker.location.city(),
    departureTime: faker.date.soon({ days: 30 }),
    arrivalTime: faker.date.soon({ days: 31 }),
    duration: faker.number.int({ min: 60, max: 600 }),
    price: faker.number.float({ min: 50, max: 1500, precision: 0.01 }),
    seats: faker.number.int({ min: 100, max: 300 }),
    availableSeats: faker.number.int({ min: 0, max: 300 }),
    capacity: faker.number.int({ min: 100, max: 300 }),
    aircraft: faker.helpers.arrayElement(['Boeing 737', 'Airbus A320', 'Embraer E190']),
    cabinClass: faker.helpers.arrayElement(['economy', 'business', 'first']),
    status: faker.helpers.arrayElement(['scheduled', 'delayed', 'in_air', 'landed'])
  }));
};

const generateTravelers = (count = 10) => {
  return Array.from({ length: count }).map(() => ({
    id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.number(),
    preferences: {
      seatPreference: faker.helpers.arrayElement(['window', 'aisle', 'middle']),
      mealPreference: faker.helpers.arrayElement(['regular', 'vegetarian', 'vegan']),
      notificationEnabled: faker.datatype.boolean()
    }
  }));
};

const generateReservations = (travelers, journeys, count = 30) => {
  return Array.from({ length: count }).map(() => ({
    traveler_id: travelers[faker.number.int({ min: 0, max: travelers.length - 1 })]._id,
    journeyId: journeys[faker.number.int({ min: 0, max: journeys.length - 1 })]._id,
    passengersCount: faker.number.int({ min: 1, max: 4 }),
    totalPrice: faker.number.float({ min: 100, max: 3000, precision: 0.01 }),
    reservationDate: faker.date.past(),
    status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled']),
    contactEmail: faker.internet.email(),
    contactPhone: faker.phone.number()
  }));
};

// 2. Fonction pour effacer les données existantes
async function clearDatabase() {
  try {
    console.log('⚡ Suppression des données existantes...');
    await mongoose.connection.dropDatabase();
    console.log('✅ Base de données nettoyée avec succès');
  } catch (err) {
    console.error('❌ Erreur lors du nettoyage:', err);
    throw err;
  }
}

// 3. Fonction principale
async function seedDatabase() {
  try {
    await connectDB();
    
    // Optionnel : Demande de confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise(resolve => {
      readline.question('⚠️  Voulez-vous VRAIMENT effacer toutes les données et regénérer un jeu de test ? (y/N) ', answer => {
        if (answer.toLowerCase() !== 'y') {
          console.log('Annulation...');
          process.exit(0);
        }
        readline.close();
        resolve();
      });
    });

    await clearDatabase();

    console.log('\n🛫 Génération des trajets...');
    const journeys = await Journey.insertMany(generateJourneys());
    
    console.log('👤 Génération des voyageurs...');
    const travelers = await Traveler.insertMany(generateTravelers());
    
    console.log('📅 Génération des réservations...');
    const validReservations = generateReservations(travelers, journeys)
      .filter(reservation => !!reservation.journeyId); // Filtre les réservations invalides
    
    await Reservation.insertMany(validReservations);

    // Vérification finale
    const reservationCount = await Reservation.countDocuments();
    const sampleReservation = await Reservation.findOne().populate('journeyId').lean();

    console.log('\n✅ Base de données régénérée avec succès !');
    console.log(`- Trajets: ${journeys.length}`);
    console.log(`- Voyageurs: ${travelers.length}`);
    console.log(`- Réservations valides: ${reservationCount}`);
    
    console.log('\n🔍 Exemple de réservation:');
    console.log({
      id: sampleReservation._id,
      traveler: sampleReservation.traveler_id,
      journey: sampleReservation.journeyId ? sampleReservation.journeyId.journeyNumber : 'N/A',
      status: sampleReservation.status
    });

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erreur lors du seeding:', err);
    process.exit(1);
  }
}

seedDatabase();
