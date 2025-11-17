const axios = require("axios");

/**
 * SDK for Copper CRM
 *
 * @param {string} apiKey - Copper API Key
 * @returns {object} Copper SDK instance
 */
const copperSdk = () => {
    const instance = axios.create({
        baseURL: "https://api.copper.com/developer_api/v1/",
        headers: {
            "X-PW-AccessToken": process.env.COPPER_API_KEY,
            "X-PW-Application": "developer_api",
            "X-PW-UserEmail": process.env.COPPER_API_EMAIL,
            "Content-Type": "application/json",
        },
    });

    return instance;
};

module.exports = copperSdk;
