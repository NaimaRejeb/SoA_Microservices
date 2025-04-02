const sqlite3 = require('sqlite3').verbose(); 
// Connexion à la base de données SQLite 
const db = new sqlite3.Database('./maBaseDeDonnees.sqlite', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => { 
if (err) { 
console.error(err.message); 
} else { 
console.log('Connecté à la base de données SQLite.'); 
db.run(`CREATE TABLE IF NOT EXISTS personnes ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    nom TEXT NOT NULL,
    adresse TEXT 
    )`, (err) => { 
    if (err) { 
    console.error(err.message); 
    } else { 
    // Insertion de données initiales avec adresses
    const personnes = [
        {nom: 'Bob', adresse: '123 Rue A'},
        {nom: 'Alice', adresse: '456 Rue B'},
        {nom: 'Charlie', adresse: '789 Rue C'},
    ]; 
personnes.forEach((personne) => { 
db.run(`INSERT INTO personnes (nom,adresse) VALUES (?,?)`, [personne.nom,personne.adresse], (err) => {
    if (err) { 
        console.error('Erreur d\'insertion' , err.message); 
    }
}); 
});
    }
});
}
});
module.exports = db;

// Vidange complète
// db.serialize(() => {
//     db.run("DELETE FROM personnes");
//     db.run("DELETE FROM sqlite_sequence WHERE name='personnes'"); // Réinitialise l'auto-increment
    
//     console.log("✅ Base vidée avec succès !");
//     console.log("N'oubliez pas de SUPPRIMER CE FICHIER après utilisation !");
//   });