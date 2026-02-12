const express = require("express");
const jwt = require("jsonwebtoken");

const {
    getPermissionsByDomain,
} = require("../../../helpers/domainPermissions");
const router = express.Router();
const axios = require("axios");


router.post("/microsoft-login", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        //Verify the token with Microsoft
        const response = await axios.get(
            "https://graph.microsoft.com/v1.0/me",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        //console.log("Microsoft Login response from Graph API:", response);

        const user = response.data;


        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(',').map(d => d.trim());

        const emailDomain =
            user.mail?.split("@")[1] || user.userPrincipalName.split("@")[1];

         if (!allowedDomains.includes(emailDomain)) {
            return res.status(403).json({ 
                success: false,
                valid: false,
                error: 'You are not authorized to access this application.' 
            });
        }

        // Fetch profile photo
        let picture = null;

        try {
            const photoResponse = await axios.get(
                "https://graph.microsoft.com/v1.0/me/photo/$value",
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "arraybuffer",
                },
            );
            const base64 = Buffer.from(photoResponse.data).toString("base64");
            const contentType =
                photoResponse.headers["content-type"] || "image/jpeg";
            picture = `data:${contentType};base64,${base64}`;
        } catch (photoErr) {
            console.log("No Microsoft profile photo available");
        }

        console.log("Microsoft Login user data:", user);

        




        


        console.log("Microsoft Login email domain:", emailDomain);
        const permissions = getPermissionsByDomain(emailDomain);

        console.log("Microsoft Login user permissions:", permissions);

        if (!permissions) {
            return res.status(403).json({ error: "Domain not authorized" });
        }

        const jwtToken = jwt.sign(
            {
                userId: user.id,
                email: user.mail || user.userPrincipalName,
                name: user.displayName,
                domain: emailDomain,
                picture: picture,

                permissions: permissions,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
        );

        res.json({
            success: true,
            token: jwtToken,
            user: {
                id: user.id,
                email: user.mail || user.userPrincipalName,
                name: user.displayName,
                permissions: permissions,
            },
        });
    } catch (error) {
        if (error.response?.status === 401) {
            return res.status(401).json({ error: "Invalid token" });
        }
        console.error("Microsoft Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
