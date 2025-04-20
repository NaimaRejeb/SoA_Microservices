const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;
const mongoUrl = 'mongodb+srv://kafka-naima:kafka_naima@cluster0.lxg3tpl.mongodb.net/Kafka?retryWrites=true&w=majority';
const dbName = 'Kafka'; // ← Modifié pour être cohérent (majuscule)
const collectionName = 'kafka_messages';

app.get('/messages', async (req, res) => {
const client = new MongoClient(mongoUrl);
try {
    await client.connect();
    const db = client.db(dbName); // ← Utilise la variable cohérente
    const messages = await db.collection(collectionName).find().toArray();
    res.json(messages);
} catch (err) {
    console.error("Erreur MongoDB:", err);
    res.status(500).json({ error: "Database error" });
} finally {
    await client.close(); // ← Fermeture garantie
}
});

app.listen(port, () => {
console.log(`API disponible sur http://localhost:${port}`);
});