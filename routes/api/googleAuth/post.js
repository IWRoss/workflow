const  express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getPermissionsByDomain } =  require('../../../helpers/domainPermissions');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//Check Google Auth Token
//Allow certain email domains to login
router.post('/login', async (req, res) => {
    try {
        const { token } = req.body;

        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(',');


        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });


        const payload = ticket.getPayload();
        const emailDomain = payload.email.split('@')[1];

        if (!allowedDomains.includes(emailDomain)) {
            return res.status(403).json({ error: 'You are not authorized to access this application.' });
        }

        //Check the permissions the user has
        const permissions= getPermissionsByDomain(emailDomain);

        console.log('User permissions:', permissions);

        // Create a JWT for session management
        const jwtToken = jwt.sign(
            {
                userId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                permissions: permissions,
                domain: emailDomain,
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
                permissions: permissions,
                domain: emailDomain,
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
                valid: false,
                error: 'Token is required' 
            });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        
        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(',');
        if (!allowedDomains.includes(decoded.domain)) {
            return res.status(403).json({ 
                success: false,
                valid: false,
                error: 'You are not authorized to access this application.' 
            });
        }

                const freshPermissions = getPermissionsByDomain(decoded.domain);


        res.json({ 
            success: true,
            valid: true,
            user: {
                id: decoded.userId,
                email: decoded.email,
                name: decoded.name,
                avatar: decoded.picture,
                permissions: freshPermissions,
                domain: decoded.domain,
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
