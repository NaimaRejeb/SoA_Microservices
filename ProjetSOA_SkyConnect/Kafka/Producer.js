const { Kafka, Partitioners } = require("kafkajs");

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner, 
});

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log("Kafka Producer connected successfully");
  } catch (error) {
    console.error("Error connecting to Kafka producer:", error);
  }
};

const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log("Message sent to Kafka successfully");
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
  }
};

module.exports = {
  connectProducer,
  sendMessage,
};
