const axios = require("axios");
const { setCache, getCache } = require("./cache");

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

    return response.data;
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

const getOpportunities = async () => {
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

    const formattedOpportunities = allOpportunities.map((opportunity) => {
        const customFields = opportunity.custom_fields.reduce((acc, field) => {
            if (opportunityCustomFieldMap[field.custom_field_definition_id]) {
                acc[
                    opportunityCustomFieldMap[field.custom_field_definition_id]
                ] = field.value;
            }
            return acc;
        }, {});

        return {
            id: opportunity.id,
            name: opportunity.name,
            stageId: opportunity.pipeline_stage_id,
            stageName: validPipelineStages.find(
                (stage) => stage.id === opportunity.pipeline_stage_id
            ).name,
            ...customFields,
        };
    });

    setCache(
        "copperOpportunities",
        formattedOpportunities,
        1000 * 60 * 3 // Cache for 3 minutes
    );

    return formattedOpportunities;
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

    return response;
};

//Function to create a project code for an opportunity
const getOrCreateProjectCode = async (opp, compCode, company) => {
    //1. Check if the opportunity has a project code
    console.log("Checking if opportunity has a project code");

    const projectCode = opp.custom_fields.find(
        (field) =>
            field.custom_field_definition_id ==
            selectCustomFieldIDByName("projectCode")
    )?.value;

    //2. If it has a project code, return it
    if (projectCode) {
        console.log("Project code already exists:", projectCode);

        return [projectCode, null];
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
    // Get the company code from the company custom fields
    const companyCode = comp.custom_fields.find(
        (field) =>
            field.custom_field_definition_id ==
            selectCustomFieldIDByName("companyCode", companyCustomFieldMap)
    )?.value;

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
                opp.company_id,
                opportunityIndex
            );

        console.log(
            "Updated company opportunity count:",
            updateCompanyOpportunityCountResponse
        );

        return opportunityIndex;
    } catch (error) {
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
        console.error("Error updating opportunity project code:", error);
    }
};

/**
 * Handle subscription to Copper update opportunity events
 */
const handleCopperUpdateOpportunityWebhook = async (payload) => {
    try {
        const { handleOpsRequestResponse } = require("./slack");

        console.log("Payload before checking stage:", payload);

        //Object to store details
        const config = {
            compCode: null,
            opportunityCounter: null,
            projectCode: null,
            opportunity: null,
        };

        //Any stage past proposal creation, create a project code and company code
        if (
            payload.updated_attributes.stage &&
            (payload.updated_attributes.stage[1] == "Won" ||
                payload.updated_attributes.stage[1] == "Proposal Submitted" ||
                payload.updated_attributes.stage[1] == "Agreed (Backlog)" ||
                payload.updated_attributes.stage[1] == "Completed")
        ) {
            const opportunity = await getOpportunity(payload.ids[0]);
            console.log("Opportunity", opportunity);

            /**
             * If opportunity has a company ID, check if it has a project code
             */

            //Catch if the opportunity does not have a company ID
            let company;

            try {
                company = await getCompany(opportunity.company_id);
            } catch (error) {
                console.error("Error getting opportunity company:", error);
                throw new Error("Opportunity does not have a company ID");
            }

            //Creates a project code for the opportunity if it does not exist
            const compCode = await getOrCreateCompanyCode(company);

            const [projectCode, oppIndex] = await getOrCreateProjectCode(
                opportunity,
                compCode,
                company
            );

            //Attach the project code to the config object
            config.compCode = compCode;
            config.opportunityCounter = oppIndex;
            config.projectCode = projectCode;
            config.opportunity = opportunity;
        }

        //If the stage is Won / Agreed / Completed, then create a ticket in slack
        if (
            payload.updated_attributes.stage &&
            (payload.updated_attributes.stage[1] == "Won" ||
                payload.updated_attributes.stage[1] == "Agreed (Backlog)" ||
                payload.updated_attributes.stage[1] == "Completed")
        ) {
            console.log("Opportunity is Won, creating ticket in Slack");
            // Get copper users
            const copperUsers = await getCopperUsers();
            console.log("Got copper users:", copperUsers);

            // Create a payload for opsRequest
            const opsRequestPayload = {
                opportunityObject: config.opportunity,
                opportunityProjectCodeUpdated: config.projectCode,
                copperUsers,
                stageName: payload.updated_attributes.stage[1],
            };

            // Create OPS request
            console.log("About to call handleOpsRequestResponse");
            await handleOpsRequestResponse(opsRequestPayload);
            console.log("Successfully completed handleOpsRequestResponse");
        }

        return {
            compCode: config.compCode,
            opportunityCounter: config.opportunityCounter,
            projectCode: config.projectCode,
        };
    } catch (error) {
        console.error("Error in handleCopperUpdateOpportunityWebhook:", error);
        throw error;
    }
};

//Get a list of all the copper users
const getCopperUsers = async () => {
    const response = await axios.get(`${process.env.COPPER_API_URL}/users`, {
        headers: copperHeaders,
    });

    return response.data;
};

module.exports = {
    getPipelines,
    getValidPipelineStageIDs,
    getValidContactTypes,
    getOpportunities,
    getCompanies,
    getCustomFieldDefinitions,
    subscribeToCopperWebhook,
    unsubscribeFromCopperWebhook,
    listAllCopperWebhooks,
    setupCopperWebhook,
    handleCopperUpdateOpportunityWebhook,
    createCompanyCode,
    assignCompanyCode,
    getCopperUsers,
    getOpportunity,
};
