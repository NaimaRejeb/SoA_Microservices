# TP6 - Intégration et Manipulation de Données avec Kafka


**Matière** : SoA & Microservices  
**Enseignant** : Dr. Salah Gontara  
**Classe** : 4Info  DataScience & AI 

**Auteur** : Naima REJEB

---

## 📌 Objectifs
- Acquérir des compétences pratiques dans la gestion des flux de données avec Apache Kafka
- Apprendre à intégrer Kafka avec des applications Node.js pour la production et la consommation de messages
- Persister les données dans MongoDB
- Exposer les données via une API REST
- Tester l’intégration complète avec MongoDB Atlas et Postman

---
## 🛠️ Prérequis

- [Node.js](https://nodejs.org/)
- [Apache Kafka](https://kafka.apache.org/downloads) (v3.9.0)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Postman](https://www.postman.com/)

---

## ⚙️ Outils Utilisés
- Kafka
- Zookeeper
- KafkaJS
- MongoDB Atlas
- Express.js
- Postman
---

## 📝 Étapes du TP  

## 📥 Configuration du TP  

#### Étape 1 : Téléchargement

- Installer Node.js depuis : https://nodejs.org/en/download  
- Télécharger Kafka (v3.9.0) depuis : https://kafka.apache.org/downloads
  
#### Étape 2 : Démarrer le serveur Zookeeper

```bash
bin/zookeeper-server-start.sh config/zookeeper.properties
```

#### Étape 3 : Démarrer le serveur Kafka

```bash
bin/kafka-server-start.sh config/server.properties
```

#### Étape 4 : Créer un Topic Kafka

```bash
bin/kafka-topics.sh --create --partitions 1 --replication-factor 1 --topic test-topic --bootstrap-server localhost:9092
```

## 🧱 Installation des Dépendances

```bash
npm init -y
npm install kafkajs express mongoose
```

## ⚙️ Travail à faire 

## 📨 Production de Messages

*producer.js*

```bash
const { Kafka } = require('kafkajs');
const kafka = new Kafka({
clientId: 'my-app',
brokers: ['localhost:9092']
});
const producer = kafka.producer();
const run = async () => {
await producer.connect();
setInterval(async () => {
try {
await producer.send({
topic: 'test-topic',
messages: [
{ value: 'Hello KafkaJS user!' },
],
});
console.log('Message produit avec succès');
} catch (err) {
console.error("Erreur lors de la production de message", err);
}
}, 1000);
};
run().catch(console.error);
```
## 📥 Consommation de Messages + MongoDB

*consumer.js*

```bash
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
```
## 🌐 Création de l’API REST

*api.js*

```bash
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
```
## 🧪 Tests

#### 1. ▶️ Lancer les services

# Terminal 1
```bash
bin/zookeeper-server-start.sh config/zookeeper.properties
```
# Terminal 2
```bash
bin/kafka-server-start.sh config/server.properties
```
# Terminal 3
```bash
node producer.js
```
![Producer ](test_screenshots/producer.png)
# Terminal 4
```bash
node consumer.js
```
![Consumer ](test_screenshots/consumer.png)
# Terminal 5
```bash
node api.js
```
![API ](test_screenshots/api.png)

#### 2. 📫 Tester l’API avec Postman
- Méthode : GET
- URL : http://localhost:3000/messages
- 
![Test avec Postman ](test_screenshots/postman_test.png)

---
#### 3. 💾 Tester avec MongoDB Atlas
1. Connexion au compte MongoDB Atlas.

2. Cluster => "Browse Collections".

3. Sélection de la base de données et la collection utilisées(dans mon cas: Kafka, kafka_messages).

![Test avec MongoDB_Atlas ](test_screenshots/mongodb.png)


### 📂 Structure du Projet

```plaintext
             
TP6_Kafka_Node/
├── node_modules/         # 📦 Dépendances
├── test_screenshots/     # 📜 Les captures des tests effectués 
├── producer.js           # 🚀 Producteur Kafka
├── consumer.js           # 📥 Consommateur Kafka + MongoDB
├── api.js                # 🌐 API REST
├── package.json          # ⚙️ Config projet
└── README.md             # 📖 Documentation



```