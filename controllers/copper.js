const axios = require("axios");
const { setCache, getCache } = require("./cache");
const { reportErrorToSlack } = require("./slack");

const copperHeaders = {
    "X-PW-AccessToken": process.env.COPPER_API_KEY,
    "X-PW-Application": "developer_api",
    "X-PW-UserEmail": process.env.COPPER_API_EMAIL,
    "Content-Type": "application/json",
};

const opportunityCustomFieldMap = {
    631912: "projectCode",
    22023: "likelyInvoiceDate",
    681214: "internationalProject",
    681471: "submittedOn",
    692217: "invoiceDetail",
    689554: "projectFees",
    689552: "consultingFees",
    689553: "studioFees",
    692218: "invoicingEmail",
    699619: "totalDays",
};

const companyCustomFieldMap = {
    630949: "companyCode",
    692247: "opportunityCounter",
};

const selectCustomFieldIDByName = (
    name,
    fields = opportunityCustomFieldMap
) => {
    const customField = Object.entries(fields).find(
        ([key, value]) => value === name
    );

    if (!customField) {
        return null;
    }

    return customField[0];
};

const getPipelines = async () => {
    const response = await axios.get(
        `${process.env.COPPER_API_URL}/pipelines`,
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

const getCustomFieldDefinitions = async () => {
    const response = await axios.get(
        `${process.env.COPPER_API_URL}/custom_field_definitions`,
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

const getValidPipelineStageIDs = async () => {
    const pipelines = await getPipelines();

    const pipelineStages = pipelines
        .map((pipeline) => {
            return pipeline.stages.map((stage) => {
                return {
                    id: stage.id,
                    name: stage.name,
                    pipelineId: pipeline.id,
                };
            });
        })
        .flat();

    return pipelineStages.filter((stage) => {
        return ["Proposal Submitted", "Agreed (Backlog)", "Completed"].includes(
            stage.name
        );
    });
    // .map((stage) => stage.id);
};

const getValidContactTypes = async () => {
    const response = await axios.get(
        `${process.env.COPPER_API_URL}/contact_types`,
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

const getOpportunity = async (opportunityId) => {
    const response = await axios.get(
        `${process.env.COPPER_API_URL}/opportunities/${opportunityId}`,
        {
            headers: copperHeaders,
        }
    );

    if (!response.data) {
        throw new Error("Opportunity not found");
    }

    const formattedOpportunity = formatOpportunity(response.data);

    return formattedOpportunity;
};

const getOpportunityByProjectCode = async (projectCode) => {
    const response = await axios.get(
        `${process.env.COPPER_API_URL}/opportunities/search`,
        {
            headers: copperHeaders,
            params: {
                custom_field_definition_id:
                    selectCustomFieldIDByName("projectCode"),
                custom_field_value: projectCode,
            },
        }
    );

    return response.data;
};

const getOpportunities = async (filter = () => true) => {
    // Get the first day of the current year as an epoch timestamp
    // const firstDayOfYearTimestamp =
    //   new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;

    const cachedOpportunities = getCache("copperOpportunities");

    if (cachedOpportunities) {
        return cachedOpportunities;
    }

    const oneMonthAgoTodayTimestamp = Math.floor(
        new Date(new Date().setMonth(new Date().getMonth() - 1)).setHours(
            0,
            0,
            0,
            0
        ) / 1000
    );

    let page = 1;
    let allOpportunities = [];
    let validPipelineStages = await getValidPipelineStageIDs();

    const payload = {
        page_size: 100,
        pipeline_stage_ids: validPipelineStages.map((stage) => stage.id),
        minimum_stage_change_date: oneMonthAgoTodayTimestamp,
    };

    while (true) {
        const response = await axios.post(
            `${process.env.COPPER_API_URL}/opportunities/search`,
            { ...payload, page_number: page },
            {
                headers: copperHeaders,
            }
        );

        const opportunities = response.data;

        if (opportunities.length === 0) {
            break;
        }

        allOpportunities = [...allOpportunities, ...opportunities];
        page++;
    }

    const formattedOpportunities = allOpportunities.map((opportunity) =>
        formatOpportunity(opportunity)
    );

    setCache(
        "copperOpportunities",
        formattedOpportunities,
        1000 * 60 * 3 // Cache for 3 minutes
    );

    // Filter the opportunities based on the provided filter function
    const filteredOpportunities = formattedOpportunities.filter(filter);

    return filteredOpportunities;
};

const getWonOpportunities = async () => {
    return await getOpportunities(
        (opp) => opp.status === "Won" && opp.stageName !== "Completed"
    );
};

const formatOpportunity = (opportunity) => {
    const customFields = opportunity.custom_fields.reduce((acc, field) => {
        if (opportunityCustomFieldMap[field.custom_field_definition_id]) {
            acc[opportunityCustomFieldMap[field.custom_field_definition_id]] =
                field.value;
        }
        return acc;
    }, {});

    return {
        id: opportunity.id,
        name: opportunity.name,
        status: opportunity.status,
        stageId: opportunity.pipeline_stage_id,
        stageName: opportunity.stageName,
        companyId: opportunity.company_id,
        ownerId: opportunity.assignee_id,
        ...customFields,
    };
};

/**
 * Get companies
 */
const getCompanies = async () => {
    /**
     * Get companies with Contact Type of "3. Current Client", "4. Previous Client", "5. Potential Client"
     */

    let page = 1;
    let allCompanies = [];
    let validCompanyTypes = await getValidContactTypes();

    const validCompanyTypesIds = validCompanyTypes
        .filter((type) => {
            return [
                "3. Current Client",
                "4. Previous Client",
                "5. Potential Client",
            ].includes(type.name);
        })
        .map((type) => type.id);

    const payload = {
        page_size: 100,
        contact_type_ids: validCompanyTypesIds,
    };

    while (true) {
        const response = await axios.post(
            `${process.env.COPPER_API_URL}/companies/search`,
            { ...payload, page_number: page },
            {
                headers: copperHeaders,
            }
        );

        const companies = response.data;

        if (companies.length === 0) {
            break;
        }

        allCompanies = [...allCompanies, ...companies];
        page++;
    }
    const formattedCompanies = allCompanies.map((company) => {
        const customFields = company.custom_fields.reduce((acc, field) => {
            if (companyCustomFieldMap[field.custom_field_definition_id]) {
                acc[companyCustomFieldMap[field.custom_field_definition_id]] =
                    field.value;
            }
            return acc;
        }, {});

        return {
            id: company.id,
            name: company.name,
            ...customFields,
        };
    });

    return formattedCompanies;
};

/**
 * Get the company from the company ID
 */
const getCompany = async (companyId) => {
    const response = await axios.get(
        `${process.env.COPPER_API_URL}/companies/${companyId}`,
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

const getCompanyByCompanyCode = async (companyCode) => {
    const response = await axios.get(
        `${process.env.COPPER_API_URL}/companies/search`,
        {
            headers: copperHeaders,
            params: {
                custom_field_definition_id: selectCustomFieldIDByName(
                    "companyCode",
                    companyCustomFieldMap
                ),
                custom_field_value: companyCode,
            },
        }
    );

    return response.data;
};

const assignCompanyCode = async (companyData, dryRun = false) => {
    const companyCode = await createCompanyCode(companyData.name);

    if (dryRun) {
        return {
            companyCode,
            companyName: companyData.name,
        };
    }

    const response = await axios.post(
        `${process.env.COPPER_API_URL}/companies`,
        {
            name: companyData.name,
            custom_fields: [
                {
                    custom_field_definition_id: selectCustomFieldIDByName(
                        "companyCode",
                        companyCustomFieldMap
                    ),
                    value: companyCode,
                },
            ],
        },
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

const createCompanyCode = (companyName) => {
    let companyCode = false;

    // First check if company name is a three letter initialism
    if (companyName.length === 3 && companyName.match(/^[A-Z]{3}$/)) {
        companyCode = companyName;
    }

    // Then check if company name has multiple words and can be converted to a three letter initialism
    if (!companyCode && companyName.split(" ").length > 2) {
        const words = companyName.split(" ");
        companyCode = words
            .map((word) => word[0].toUpperCase())
            .join("")
            .substr(0, 3);
    }

    // If not, then take the first three letters of the company name
    if (!companyCode) {
        companyCode = companyName
            .split(" ")
            .join("")
            .substr(0, 3)
            .toUpperCase();
    }

    return companyCode;
};

const updateCompanyOpportunityCount = async (companyId, count) => {
    const response = await axios.put(
        `${process.env.COPPER_API_URL}/companies/${companyId}`,
        {
            custom_fields: [
                {
                    custom_field_definition_id: selectCustomFieldIDByName(
                        "opportunityCounter",
                        companyCustomFieldMap
                    ),
                    value: count,
                },
            ],
        },
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

const updateOpportunityProjectCode = async (opportunityId, projectCode) => {
    const response = await axios.put(
        `${process.env.COPPER_API_URL}/opportunities/${opportunityId}`,
        {
            custom_fields: [
                {
                    custom_field_definition_id:
                        selectCustomFieldIDByName("projectCode"),
                    value: projectCode,
                },
            ],
        },
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

/**
 * Subscribe to Copper webhook events
 */
const subscribeToCopperWebhook = async (webhookUrl) => {
    const response = await axios.post(
        `${process.env.COPPER_API_URL}/webhooks`,
        {
            target: webhookUrl,
            type: "opportunity",
            event: "update",
        },
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

const unsubscribeFromCopperWebhook = async (webhookId) => {
    const response = await axios.delete(
        `${process.env.COPPER_API_URL}/webhooks/${webhookId}`,
        {
            headers: copperHeaders,
        }
    );

    return response.data;
};

const listAllCopperWebhooks = async () => {
    const response = await axios.get(`${process.env.COPPER_API_URL}/webhooks`, {
        headers: copperHeaders,
    });

    return response.data;
};

const setupCopperWebhook = async () => {
    const webhooks = await listAllCopperWebhooks();

    const webhooksToUnsubscribe = webhooks.filter(
        (webhook) =>
            webhook.target ===
            `${process.env.COPPER_WEBHOOK_URL}/copper/receive`
    );

    if (webhooksToUnsubscribe.length) {
        const unsubscribePromises = webhooksToUnsubscribe.map((webhook) => {
            console.log("Unsubscribing from webhook", webhook.id);
            return unsubscribeFromCopperWebhook(webhook.id);
        });

        await Promise.all(unsubscribePromises);
    }

    const response = await subscribeToCopperWebhook(
        `${process.env.COPPER_WEBHOOK_URL}/copper/receive`
    );

    console.log("Subscribed to Copper webhook", response.id);

    await getCopperUsers();

    return response;
};

//Function to create a project code for an opportunity
const getOrCreateProjectCode = async (opp, compCode, company) => {
    //1. Check if the opportunity has a project code
    console.log("Checking if opportunity has a project code");

    //2. If it has a project code, return it
    if (opp.projectCode) {
        console.log("Project code already exists:", opp.projectCode);

        return [opp.projectCode, null];
    }

    //3. If it does not have a project code, create one
    const oppIndex = await updateOpportunityCounter(opp, company);

    const newProjectCode = await createProjectCodeForOpportunity(
        compCode,
        oppIndex,
        opp
    );

    console.log("New project code created:", newProjectCode);
    return [newProjectCode, oppIndex];
};

//Check if the opportunity has a company code, if not, create one
const getOrCreateCompanyCode = async (comp) => {
    console.dir(comp, { depth: null });

    // Get the company code from the company custom fields
    const companyCode = comp.custom_fields.find(
        (field) =>
            field.custom_field_definition_id ==
            selectCustomFieldIDByName("companyCode", companyCustomFieldMap)
    )?.value;

    console.dir(companyCode, { depth: null });

    // If the company code exists, return it
    if (companyCode) {
        console.log("Company code already exists:", companyCode);
        return companyCode;
    }

    // If the company code does not exist, create one
    console.log("Company code does not exist, creating one...");

    try {
        const newCompanyCode = createCompanyCode(comp.name);

        //If the company code was not created, return null
        if (!newCompanyCode) {
            console.log("Failed to create company code");
            return null;
        }

        ///If successfully created, return the new company code
        console.log("New company code created:", newCompanyCode);
        return newCompanyCode;
    } catch (error) {
        await reportErrorToSlack(error, "getOrCreateCompanyCode");
        console.error("Error creating company code:", error);
        return null;
    }
};

//Get current opportunity counter for a company
const getOpportunityCounter = async (comp) => {
    const opportunityCounter = comp.custom_fields.find(
        (field) =>
            field.custom_field_definition_id ==
            selectCustomFieldIDByName(
                "opportunityCounter",
                companyCustomFieldMap
            )
    )?.value;
    //If the opportunity counter does not exist, return 0
    if (!opportunityCounter) {
        console.log("Opportunity counter does not exist, returning 0");
        return 0;
    }
    //If the opportunity counter exists, return it
    console.log("Opportunity counter exists:", opportunityCounter);
    return parseInt(opportunityCounter);
};

//Function to update the opportunity counter for a company
const updateOpportunityCounter = async (opp, comp) => {
    //1. Check if the opportunity has a opportunityCounter
    const opportunityCounter = comp.custom_fields.find(
        (field) =>
            field.custom_field_definition_id ==
            selectCustomFieldIDByName(
                "opportunityCounter",
                companyCustomFieldMap
            )
    )?.value;

    //2. If it has a opportunityCounter, increment it by 1
    const opportunityIndex = parseInt(opportunityCounter || 0) + 1;

    //3. Update the opportunityCounter for the company
    try {
        const updateCompanyOpportunityCountResponse =
            await updateCompanyOpportunityCount(
                opp.companyId,
                opportunityIndex
            );

        console.log(
            "Updated company opportunity count:",
            updateCompanyOpportunityCountResponse
        );

        return opportunityIndex;
    } catch (error) {
        await reportErrorToSlack(error, "updateOpportunityCounter");
        console.error("Error updating company opportunity count:", error);
    }
};

//Function to create a new project code for an opportunity
const createProjectCodeForOpportunity = async (compCode, oppIndex, opp) => {
    //1. Generate a new project code
    const newProjectCode = compCode + String(oppIndex).padStart(3, "0");

    //2. Update the opportunity with the new project code
    try {
        const updateOpportunityProjectCodeResponse =
            await updateOpportunityProjectCode(opp.id, newProjectCode);

        console.log(
            "Updated opportunity project code:",
            updateOpportunityProjectCodeResponse
        );

        return newProjectCode;
    } catch (error) {
        await reportErrorToSlack(error, "createProjectCodeForOpportunity");
        console.error("Error updating opportunity project code:", error);
    }
};

const handleCopperOpportunityWebhook = async (
    payload,
    filter = async () => true,
    action = async () => true
) => {
    try {
        console.log("Payload received:", payload);

        // Check if the payload has the required properties
        if (!payload || !payload.event || !payload.type || !payload.ids) {
            throw new Error("Invalid payload");
        }

        // Only handle opportunity events
        if (payload.type !== "opportunity") {
            console.log("Ignoring non-opportunity event");
            return;
        }

        // Get the opportunity details
        const opportunity = await getOpportunity(payload.ids[0]);

        console.log("Opportunity details:", opportunity);

        // Apply the filter function
        if (!filter(opportunity, payload)) {
            console.log("Filter function returned false, ignoring event");
            return;
        }

        // Perform the action
        await action(opportunity, payload);

        return { success: true };
    } catch (error) {
        await reportErrorToSlack(error, "handleCopperOpportunityWebhook");
        console.error("Error in handleCopperOpportunityWebhook:", error);
        throw error;
    }
};

const addOpportunityToProjectBoardOnWebhook = async (payload) => {
    return handleCopperOpportunityWebhook(
        payload,
        // Filter function to only process certain stage changes
        (opportunity, payload) =>
            payload.updated_attributes.status &&
            payload.updated_attributes.status[1] === "Won",
        // Action function to perform when the filter passes
        async (opportunity, payload) => {
            return await addOpportunityToProjectBoard(opportunity);
        }
    );
};

const addOpportunityToProjectBoard = async (opportunity) => {
    const { addProjectToProjectBoard } = require("./monday");

    try {
        console.log("Adding opportunity to project board:", opportunity);

        if (opportunity.companyId === null) {
            throw new Error("Opportunity does not have a company ID");
        }

        const company = await getCompany(opportunity.companyId);
        console.log("Got opportunity company:", company);

        //Creates a project code for the opportunity if it does not exist
        const compCode = await getOrCreateCompanyCode(company);
        const [projectCode, oppIndex] = await getOrCreateProjectCode(
            opportunity,
            compCode,
            company
        );

        const opportunityOwner = await getCopperUserById(opportunity.ownerId);

        return await addProjectToProjectBoard({
            name: `${projectCode} - ${opportunity.name}`,
            "Project Code": projectCode,
            "Project Owner": opportunityOwner.email,
            Client: company.name,
        });
    } catch (error) {
        await reportErrorToSlack(error, "addOpportunityToProjectBoard");
        console.error("Error adding opportunity to project board:", error);
    }
};

const addWonOpportunitiesToProjectBoard = async () => {
    const wonOpportunities = await getWonOpportunities();

    for (const opportunity of wonOpportunities) {
        try {
            await addOpportunityToProjectBoard(opportunity);
        } catch (error) {
            await reportErrorToSlack(
                error,
                "addWonOpportunitiesToProjectBoard"
            );

            console.error(
                "Error adding won opportunity to project board:",
                error
            );
        }
    }
};

// Get a list of all the copper users
const getCopperUsers = async () => {
    const copperUsers = getCache("copperUsers");

    if (copperUsers) {
        return copperUsers;
    }

    const response = await axios.get(`${process.env.COPPER_API_URL}users/`, {
        headers: copperHeaders,
        page_number: 1,
        page_size: 100,
    });

    setCache("copperUsers", response.data, 1000 * 60 * 60 * 24); // Cache for 24 hours

    return response.data;
};

// Get Copper User
const getCopperUserById = async (userId) => {
    const copperUsers = await getCopperUsers();

    return copperUsers.find((user) => user.id === userId);
};

module.exports = {
    getPipelines,
    getValidPipelineStageIDs,
    getValidContactTypes,
    getOpportunities,
    getWonOpportunities,
    getCompanies,
    getCustomFieldDefinitions,
    subscribeToCopperWebhook,
    unsubscribeFromCopperWebhook,
    listAllCopperWebhooks,
    setupCopperWebhook,
    addOpportunityToProjectBoardOnWebhook,
    addOpportunityToProjectBoard,
    addWonOpportunitiesToProjectBoard,
    createCompanyCode,
    assignCompanyCode,
    getCopperUsers,
    getOpportunity,
    getCopperUserById,
};
