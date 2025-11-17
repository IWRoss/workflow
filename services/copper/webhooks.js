const copperSdk = require("./index");

/**
 * Subscribe to a Copper webhook
 * @param {string} webhookURL - The URL to receive webhook events
 * @param {string} type - The type of resource to subscribe to (e.g., "opportunity", "lead")
 * @param {string} event - The event to subscribe to (e.g., "create", "update", "delete")
 * @returns {object} The created webhook data
 */
exports.subscribeToWebhook = async (
    webhookURL,
    type = "opportunity",
    event = "update"
) => {
    const copper = copperSdk();

    const response = await copper.post("/webhooks", {
        target: webhookURL,
        type,
        event,
    });

    return response.data;
};

/**
 * Unsubscribe from a Copper webhook
 * @param {string} webhookID - The ID of the webhook to unsubscribe from
 * @returns {object} The response data
 */
exports.unsubscribeFromWebhook = async (webhookID) => {
    const copper = copperSdk();

    const response = await copper.delete(`/webhooks/${webhookID}`);

    return response.data;
};

/**
 * Get all Copper webhooks
 * @returns {Array} The list of Copper webhooks
 */
exports.listAllCopperWebhooks = async () => {
    const copper = copperSdk();

    const response = await copper.get("/webhooks");

    return response.data;
};

/**
 * Set up a Copper webhook
 */
exports.setupWebhook = async () => {
    const webhooks = await exports.listAllCopperWebhooks();

    const webhooksToUnsubscribe = webhooks.filter(
        (webhook) =>
            webhook.target ===
            `${process.env.COPPER_WEBHOOK_URL}/copper/receive`
    );

    if (webhooksToUnsubscribe.length) {
        const unsubscribePromises = webhooksToUnsubscribe.map((webhook) => {
            console.log("Unsubscribing from webhook", webhook.id);
            return exports.unsubscribeFromWebhook(webhook.id);
        });

        await Promise.all(unsubscribePromises);
    }

    const response = await exports.subscribeToWebhook(
        `${process.env.COPPER_WEBHOOK_URL}/copper/receive`
    );

    console.log("Subscribed to Copper webhook", response.id);

    await getCopperUsers();

    return response;
};
