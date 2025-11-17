const copperSdk = require("./index");

/**
 * Get Copper pipelines
 *
 * @returns {Array} The Copper pipelines data
 */
exports.getPipelines = async () => {
    const copper = copperSdk();

    const response = await copper.get("/pipelines");

    return response.data;
};

/**
 * Get valid pipeline stage IDs
 *
 * @returns {Array} An array of valid pipeline stage IDs
 */
exports.getValidPipelineStageIDs = async (
    validStages = ["Proposal Submitted", "Agreed (Backlog)", "Completed"]
) => {
    const pipelinesData = await exports.getPipelines();

    const validStageIDs = [];

    pipelinesData.forEach((pipeline) => {
        pipeline.stages.forEach((stage) => {
            if (validStages.includes(stage.name)) {
                validStageIDs.push(stage.id);
            }
        });
    });

    return validStageIDs;
};
