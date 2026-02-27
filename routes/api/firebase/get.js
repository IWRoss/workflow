const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL, 
    });
}

// Use Realtime Database instead of Firestore
const db = admin.database();

// GET Get sow details by ID
router.get('/sows/:id', async (req, res) => {
    try {
        const sowId = req.params.id;
        const snapshot = await db.ref(`sow/${sowId}`).once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'Sow not found' });
        }

        res.json({ id: sowId, ...snapshot.val() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Get all sow details
router.get('/sows', async (req, res) => {

    try {
        const snapshot = await db.ref('sow').once('value');
        
        if (!snapshot.exists()) {
            return res.json([]); 
        }

        const sowsData = snapshot.val();
        const sows = Object.keys(sowsData).map(id => ({
            id,
            ...sowsData[id]
        }));
        
        res.json(sows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;