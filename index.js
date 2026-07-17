// On importe dotenv et on charge immédiatement les variables du fichier .env
// (PRIVATE_APP_TOKEN et CUSTOM_OBJECT_TYPE) dans process.env
require('dotenv').config();

// On importe Express, le framework qui va gérer notre serveur web et nos routes
const express = require('express');

// On importe Axios, la librairie qui nous permet de faire des requêtes HTTP
// vers l'API HubSpot (GET, POST, etc.)
const axios = require('axios');

// On crée l'application Express : c'est l'objet principal qu'on va configurer
const app = express();

// On définit le port sur lequel le serveur va écouter
const PORT = 3000;

// On dit à Express d'utiliser le moteur de templates "pug" pour générer le HTML
app.set('view engine', 'pug');

// On indique où se trouvent les fichiers CSS/JS statiques (dossier "public")
app.use(express.static('public'));

// Ce middleware permet à Express de comprendre les données envoyées
// par un formulaire HTML (POST avec du contenu encodé en URL)
app.use(express.urlencoded({ extended: true }));

// On récupère le token privé HubSpot depuis les variables d'environnement
const PRIVATE_APP_TOKEN = process.env.PRIVATE_APP_TOKEN;

// On récupère l'identifiant du custom object (objectTypeId) depuis .env
const CUSTOM_OBJECT_TYPE = process.env.CUSTOM_OBJECT_TYPE;

// On crée une instance Axios préconfigurée pour parler à l'API HubSpot :
// - baseURL évite de réécrire l'URL complète à chaque requête
// - headers ajoute automatiquement le token d'authentification
const hubspotClient = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${PRIVATE_APP_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// On démarre le serveur : il écoute désormais les requêtes sur le port 3000
// Route GET / : affiche la page d'accueil avec la liste des enregistrements Robot
app.get('/', async (req, res) => {
  try {
    // On appelle l'API HubSpot CRM v3 pour récupérer les objets de type Robot
    // ?properties=name,bio,modele précise quelles propriétés on veut recevoir
    const response = await hubspotClient.get(
      `/crm/v3/objects/${CUSTOM_OBJECT_TYPE}?properties=name,bio,modele`
    );

    // On extrait uniquement le tableau des enregistrements depuis la réponse
    const robots = response.data.results;

    // On envoie ces données au template homepage.pug pour générer le HTML
    res.render('homepage', { title: 'Robots', robots: robots });

  } catch (error) {
    // Si une erreur survient (token invalide, objectTypeId incorrect, etc.),
    // on l'affiche dans la console pour pouvoir la diagnostiquer
    console.error(error);

    // On renvoie une réponse d'erreur au navigateur
    res.status(500).send('Une erreur est survenue lors de la récupération des Robots.');
  }
});
// Route GET /update-cobj : affiche le formulaire pour créer un nouveau Robot
app.get('/update-cobj', (req, res) => {
  // On rend simplement le template updates.pug, pas besoin de données HubSpot ici
  // car c'est juste un formulaire vide à afficher
  res.render('updates', { title: 'Créer un Robot' });
});
// Route POST /update-cobj : reçoit les données du formulaire et crée un Robot dans HubSpot
app.post('/update-cobj', async (req, res) => {
  try {
    // req.body contient les champs envoyés par le formulaire (name, bio, modele)
    // grâce au middleware express.urlencoded() configuré plus haut
    const { name, bio, modele } = req.body;

    // On construit l'objet attendu par l'API HubSpot :
    // toutes les valeurs doivent être regroupées dans "properties"
    const newRobot = {
      properties: {
        name: name,
        bio: bio,
        modele: modele
      }
    };

    // On envoie une requête POST à l'API HubSpot pour créer l'enregistrement
    await hubspotClient.post(
      `/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`,
      newRobot
    );

    // Une fois la création réussie, on redirige l'utilisateur vers la page d'accueil
    // pour qu'il voie son nouveau Robot dans le tableau
    res.redirect('/');

  } catch (error) {
    // On log l'erreur complète en console pour pouvoir diagnostiquer
    console.error(error);

    // On informe l'utilisateur qu'une erreur est survenue
    res.status(500).send("Une erreur est survenue lors de la création du Robot.");
  }
});
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});