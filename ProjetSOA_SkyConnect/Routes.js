const grpc = require('@grpc/grpc-js');

// Charger les services gRPC
const protoLoader = require('@grpc/proto-loader');
const { sendMessage } = require('./Kafka/Producer'); 


// Configuration des services gRPC
const services = {
  reservation: {
    protoPath: './Protos/Reservation.proto',
    port: 50052,
    serviceName: 'ReservationService',
  },
  journey: {
    protoPath: './Protos/Journey.proto',
    port: 50053,
    serviceName: 'JourneyService',
  },
  traveler: {
    protoPath: './Protos/Traveler.proto',
    port: 50050,
    serviceName: 'TravelerService',
  },
};

// Charger les protos et créer les clients
const clients = {};
for (const [serviceName, config] of Object.entries(services)) {
  const packageDefinition = protoLoader.loadSync(config.protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDefinition)[serviceName];
  clients[serviceName] = new proto[config.serviceName](
    `localhost:${config.port}`,
    grpc.credentials.createInsecure()
  );
}

module.exports = function(app) {
  // Routes REST Reservation
  app.get('/reservations', (req, res) => {
    clients.reservation.listAllReservations({}, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.reservations);
    });
  });

  // Get reservations by status
  app.get('/reservations/status/:status', (req, res) => {
    clients.reservation.getReservation({ status: req.params.status }, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.reservations);
    });
  });

  // Get reservations by traveler
  app.get('/travelers/:traveler_id/reservations', (req, res) => {
    clients.reservation.getTravelerReservations(
      { traveler_id: req.params.traveler_id },
      (err, response) => {
        err ? res.status(500).json(err) : res.json(response.reservations);
      }
    );
  });

  app.delete('/reservations/:id', async (req, res) => {
    clients.reservation.deleteReservation({ reservation_id: req.params.id }, async (err, response) => {
      if (err) {
        return res.status(500).json({ error: err.details });
      }
  
      await sendMessage('reservations', {
        event: 'RESERVATION_DELETED',
        reservationId: req.params.id,
        timestamp: new Date().toISOString(),
      });
  
      res.json({ message: response.message });
    });
  });
  
  app.post('/reservations', (req, res) => {
    // Mapper les champs de la requête REST vers le format attendu par le service gRPC
    const reservationData = {
      traveler_id: req.body.traveler_id|| req.body.traveler_id,
      journeyId: req.body.journeyId|| req.body.journeyId,
      passengersCount: req.body.passengersCount || req.body.passengerscount || 1,
      totalPrice: req.body.totalPrice || req.body.totalprice || 0,
      contactEmail: req.body.contactEmail || req.body.contactemail,
      contactPhone: req.body.contactPhone || req.body.contactphone || ""
    };

    // Vérifier les champs requis
    if (!reservationData.traveler_id || !reservationData.journeyId || !reservationData.contactEmail) {
      return res.status(400).json({
        error: "Champs requis manquants: traveler_id, journeyId et contactEmail sont obligatoires"
      });
    }

    clients.reservation.createReservation(reservationData, (err, response) => {
      if (err) {
        console.error("Erreur lors de la création de la réservation:", err);
        return res.status(500).json({
          code: err.code || 500,
          message: err.details || "Erreur lors de la création de la réservation"
        });
      }
      // Envoyer un événement Kafka pour la nouvelle réservation
      console.log("Nouvelle réservation reçue:", response.reservation);
      sendMessage('reservations', 'new_reservation', response.reservation);
      res.status(201).json(response.reservation);
    });
  });

  // Routes REST Journey
  app.get('/journeys', (req, res) => {
    clients.journey.listAllJourneys({}, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.journeys);
    });
  });

  // Search journeys
  app.get('/journeys/search', (req, res) => {
    const { departure, arrival, date, passengers } = req.query;
    clients.journey.searchJourneys(
      { departure, arrival, date, passengers: parseInt(passengers) },
      (err, response) => {
        err ? res.status(500).json(err) : res.json(response.journeys);
      }
    );
  });

  app.put('/journeys/:id/seats', async (req, res) => {
    clients.journey.updateJourneySeats(
      { journey_id: req.params.id, seatsChange: req.body.seatsChange },
      async (err, response) => {
        if (err) return res.status(500).json({ error: err.details });
  
        await sendMessage('journeys', {
          event: 'JOURNEY_UPDATED',
          journey: response.journey,
          timestamp: new Date().toISOString(),
        });
        
        // Notifier également le topic des réservations
        await sendMessage('reservations', {
          event: 'SEATS_UPDATED',
          journey: response.journey,
          seatsChange: req.body.seatsChange,
          timestamp: new Date().toISOString(),
        });
  
        res.json(response.journey);
      }
    );
  });
  
  // Nouvelle route pour mettre à jour les sièges directement avec un nombre dans l'URL
  app.put('/journeys/:id/seats', async (req, res) => {
    // Convertir le paramètre seats en nombre et l'utiliser comme seatsChange
    const seats = parseInt(req.params.seats);
    if (isNaN(seats)) {
      return res.status(400).json({ error: "Le nombre de sièges doit être un nombre valide" });
    }
    
    clients.journey.updateJourneySeats(
      { journey_id: req.params.id, seatsChange: seats },
      async (err, response) => {
        if (err) return res.status(500).json({ error: err.details });
  
        await sendMessage('journeys', {
          event: 'JOURNEY_UPDATED',
          journey: response.journey,
          timestamp: new Date().toISOString(),
        });
  
        res.json(response.journey);
      }
    );
  });
  
  // Update journey status
  app.put('/journeys/:id/status', async (req, res) => {
    clients.journey.updateJourneyStatus(
      { journey_id: req.params.id, status: req.body.status },
      (err, response) => {
        if (err) return res.status(500).json({ error: err.details });
        res.json(response.journey);
      }
    );
  });

  app.get('/travelers', (req, res) => {
    clients.traveler.listAllTravelers({}, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.travelers);
    });
  });

  app.get('/travelers/:id', (req, res) => {
    clients.traveler.getTraveler({ traveler_id: req.params.id }, (err, response) => {
      err ? res.status(500).json(err) : res.json(response.traveler);
    });
  });

  app.post('/travelers', async (req, res) => {
    try {
      clients.traveler.createTraveler(req.body, async (err, response) => {
        if (err) {
          return res.status(500).json(err);
        }
  
        // Envoi d'un message Kafka après création
        await sendMessage('travelers', {
          event: 'TRAVELER_CREATED',
          traveler: response.traveler,
          timestamp: new Date().toISOString(),
        });
  
        res.status(201).json(response.traveler);
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'An error occurred while processing the request', 
        details: error.message 
      });
    }
  });
};
