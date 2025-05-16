const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { 
  reservationTypeDefs, 
  journeyTypeDefs, 
  travelerTypeDefs 
} = require('./Schema');
const resolvers = require('./Resolvers');
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { connectProducer } = require('./Kafka/Producer');
const { consumeMessages } = require('./Kafka/Consumer');
const app = express();
app.use(cors());
app.use(bodyParser.json());


const server = new ApolloServer({
  typeDefs: mergeTypeDefs([reservationTypeDefs, journeyTypeDefs, travelerTypeDefs]),
  resolvers,
});

require('./Routes')(app);

(async () => {
  await server.start();
  await connectProducer();
  // Start consuming messages from the reservations topic
  await consumeMessages("reservations");
  app.use('/graphql', expressMiddleware(server));
  app.listen(4000, () => console.log("🚀 Server ready at http://localhost:4000/graphql"));
})();
