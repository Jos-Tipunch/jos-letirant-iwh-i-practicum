require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

// --- Middleware ---
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

// --- Config ---
const PRIVATE_APP_TOKEN = process.env.PRIVATE_APP_TOKEN;

// Remplace par le fullyQualifiedName ou l'objectTypeId de TON custom object "Robots"
// (ex: "2-12345678" ou "p12345678_robots"). Voir NOTES.md, etape "Recuperer l'objectTypeId".
const CUSTOM_OBJECT_TYPE = process.env.CUSTOM_OBJECT_TYPE || 'robots';

// Les 3 proprietes internes de ton custom object Robots.
// "name" est obligatoire (string). Adapte les noms internes a ceux crees dans HubSpot.
const PROPERTIES = ['name', 'model', 'bio'];

const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${PRIVATE_APP_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// ============================================================
// ROUTE 1 — Homepage : GET "/"
// ============================================================
app.get('/', async (req, res) => {
  const url = `/crm/v3/objects/${CUSTOM_OBJECT_TYPE}?properties=${PROPERTIES.join(',')}`;
  try {
    const resp = await hubspot.get(url);
    const records = resp.data.results;
    res.render('homepage', {
      title: 'Homepage | Integrating With HubSpot I Practicum',
      records,
      properties: PROPERTIES,
    });
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
    res.status(500).send('Error fetching custom object records. Check your token and object type.');
  }
});

// ============================================================
// ROUTE 2 — Formulaire : GET "/update-cobj"
// ============================================================
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
  });
});

// ============================================================
// ROUTE 3 — Creation : POST "/update-cobj"
// ============================================================
app.post('/update-cobj', async (req, res) => {
  const newRecord = {
    properties: {
      name: req.body.name,
      model: req.body.model,
      bio: req.body.bio,
    },
  };
  try {
    await hubspot.post(`/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`, newRecord);
    res.redirect('/');
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
    res.status(500).send('Error creating custom object record.');
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
