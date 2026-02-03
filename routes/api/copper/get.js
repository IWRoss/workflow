const express = require("express");
const router = express.Router();

const {
    getOpportunities,
    getOpportunity,
    getCompanies,
    getCopperUsers,
    getWonOpportunities,
} = require("../../../controllers/copper");

// Copper GET routes 
router.get("/copper/opportunities", async (req, res) => {
    try {
        const opportunities = await getOpportunities();
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch opportunities" });
    }
});

router.get("/copper/opportunities/won", async (req, res) => {
    try {
        const opportunities = await getWonOpportunities();
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch won opportunities" });
    }
});

router.get("/copper/opportunities/:id", async (req, res) => {
    try {
        const opportunity = await getOpportunity(req.params.id);
        res.json(opportunity);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch opportunity" });
    }
});

router.get("/copper/companies", async (req, res) => {
    try {
        const companies = await getCompanies();
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch companies" });
    }
});

router.get("/copper/users", async (req, res) => {
    try {
        const users = await getCopperUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

module.exports = router;

