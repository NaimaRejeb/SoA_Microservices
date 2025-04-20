    const { Kafka } = require('kafkajs');
    const { MongoClient } = require('mongodb');

    // Get this EXACT string from MongoDB Atlas interface
    const mongoUrl = 'mongodb+srv://kafka-naima:kafka_naima@cluster0.lxg3tpl.mongodb.net/Kafka?retryWrites=true&w=majority';

    const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
    });
    const run = async () => {
    const client = await MongoClient.connect(mongoUrl);
    const db = client.db('Kafka');
    const collection = db.collection('kafka_messages');

    const consumer = kafka.consumer({ groupId: 'test-group' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
        try {
            await collection.insertOne({
            message: message.value.toString(),
            topic,
            partition,
            timestamp: new Date()
            });
            console.log('Saved to MongoDB');
        } catch (err) {
            console.error('MongoDB Error:', err);
        }
        },
    });
    };

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});