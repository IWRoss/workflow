const  express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const router = express.Router();


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//Check Google Auth Token
router.post('/login', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Create a JWT for session management
        const jwtToken = jwt.sign(
            {
                userId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

         res.json({ 
            success: true,
            token: jwtToken,  
            user: {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                avatar: payload.picture,  
            }
        });
    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
})


// Verify JWT Token
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body; 

        if (!token) {
            return res.status(400).json({ 
                success: false,
                error: 'Token is required' 
            });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        res.json({ 
            success: true,
            valid: true,
            user: {
                id: decoded.userId,
                email: decoded.email,
                name: decoded.name,
                avatar: decoded.picture,
            }
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                valid: false,
                error: 'Token expired' 
            });
        }
        
        res.status(401).json({ 
            success: false,
            valid: false,
            error: 'Invalid token' 
        });
    }
});

module.exports = router;
