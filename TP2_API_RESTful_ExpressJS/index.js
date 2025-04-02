// Mise en place de l'API 

// Objectif : Créer une API RESTful pour gérer les personnes dans la base de données SQLite
const express = require('express'); // Importer le framework Express
const db = require('./database.js'); // Importer la connexion à la base de données
const app = express(); // Créer une instance de l'application Express
app.use(express.json()); // Middleware pour parser le corps des requêtes JSON 
const PORT = 3000; // Port sur lequel l'application écoute
app.get('/', (req,res)=>{ 
    res.json("Registre des personnes ! Choisissez le bon routage ! ") // Route de base
})

// Route pour récupérer toutes les personnes
app.get('/personnes', (req,res) =>{
    db.all(`SELECT * FROM personnes`, [], (err,rows) =>{ // [] : Pas de paramètres à passer , (err,rows) : Gestion des erreurs et des résultats 
        if (err){
            res.status(400).json({ // Erreur 400 pour une mauvaise requête 
                "error": err.message
            });
            return; // Sortir de la fonction si erreur
        }
        res.json({ // Réponse JSON avec les résultats
            "message": "Succès",
            "data": rows
        });
    });
});

// Route pour récupérer une personne par son ID
app.get('/personnes/:id', (req,res) => {
    const id = req.params.id; // Récupérer l'ID de la personne dans les paramètres de la requête
    db.get(`SELECT * FROM personnes WHERE id=?`,[id], (err,row) => {
        if(err){
            res.status(400).json({
                "error": err.message
            });
            return;
        }
        res.json({
            "message": "Succès",
            "data": row
        });
    });
}); 

// Route pour ajouter une nouvelle personne
app.post('/personnes',(req,res)=>{
    // const nom = req.body.nom; // Récupérer le nom de la personne dans le corps de la requête
    const {nom, adresse}= req.body; // Utiliser la décomposition pour récupérer le nom et l'adresse
    db.run(`INSERT INTO personnes (nom,adresse) VALUES (?,?)`, [nom,adresse], function(err){
        if(err){
            res.status(400).json({
                "error":err.message
            });
            return;
        }
        res.json({
            "message": "Succès",
            "data": {
                id: this.lastID, // ID de la dernière insertion
        }});
});
});

// Route pour mettre à jour une personne par son ID
app.put('/personnes/:id', (req,res) => {
    const id = req.params.id; // Récupérer l'ID de la personne dans les paramètres de la requête    
    // const nom = req.body.nom; // Récupérer le nom de la personne dans le corps de la requête
    const {nom, adresse}=req.body;
    db.run(`UPDATE personnes SET nom= ? , adresse=? WHERE id = ? `, [nom,adresse, id], function(err){
        if(err){
            res.status(400).json({
                "error" : err.message
            });
            return;
            }
            // Vérifier si une ligne est mis à jour 
            if(this.changes === 0){
                res.status(404).json({
                    "message": "Personne non trouvée"
                });
                return;
                }
        res.json({
            "message":"Succès"
        });
        });
        });

// Route pour supprimer une personne par son ID
app.delete('/personnes/:id', (req, res)=>{
    const id = req.params.id;
    db.run(`DELETE FROM personnes WHERE id = ?`,[id], function(err){
        if(err){
            res.status(400).json({
                "error": err.message
            });
            return;
        }
        res.json({
            "message": "Succès"
        });
    });
}); 


// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Le serveur écoute sur le port ${PORT}`); // Afficher un message dans la console lorsque le serveur démarre
});

