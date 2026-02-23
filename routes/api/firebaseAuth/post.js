const express = require("express");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const router = express.Router();
const { getPermissionsByDomain } = require("../../../helpers/domainPermissions");

// Initialize Firebase Admin (only once)
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

// Firebase Email/Password Login
router.post("/login", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        // Verify Firebase ID token
        const decoded = await admin.auth().verifyIdToken(token);
        const email = decoded.email;
        const emailDomain = email.split("@")[1];

        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(",");

        if (!allowedDomains.includes(emailDomain)) {
            return res.status(403).json({
                success: false,
                error: "You are not authorized to access this application.",
            });
        }

        // Get permissions
        const permissions = getPermissionsByDomain(emailDomain);

        // Create a JWT for session management
        const jwtToken = jwt.sign(
            {
                userId: decoded.uid,
                email: email,
                name: decoded.name || email.split("@")[0],
                permissions: permissions,
                domain: emailDomain,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token: jwtToken,
            user: {
                id: decoded.uid,
                email: email,
                name: decoded.name || email.split("@")[0],
                permissions: permissions,
                domain: emailDomain,
            },
        });
    } catch (error) {
        console.error("Error verifying Firebase token:", error);
        res.status(401).json({ error: "Invalid token" });
    }
});

module.exports = router;