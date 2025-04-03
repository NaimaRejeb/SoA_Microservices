const express = require('express'); 
const cors = require('cors'); 
const rateLimit = require('express-rate-limit'); 
const db = require('./database'); 
const app = express(); 
const PORT = 3000; 
// Middleware pour parser le JSON 
app.use(express.json()); 
// 1. Configuration CORS : Autoriser toutes les origines 
app.use(cors()); 
// Pour restreindre aux domaines autorisés, décommentez et adaptez la ligne suivante : 
// app.use(cors({ origin: ['http://localhost:3000, 'http://localhost:4200'] })); 
// 2. Configuration du Rate Limiting : 100 requêtes/15 min 
const limiter = rateLimit({ 
windowMs: 15 * 60 * 1000, // 15 minutes 
max: 100, // Limite chaque IP à 100 requêtes par fenêtre 
message: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer après 15 minutes.' 
}); 
app.use(limiter); 


app.get('/',  (req,res)=>{ 
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
app.delete('/personnes/:id',  (req, res)=>{
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

