const copperSdk = require("./index");

const { getCache, setCache } = require("../../controllers/cache");

const { selectCustomFieldIDByName: cfid } = require("../../data/copperFields");

const { getValidPipelineStageIDs } = require("./pipelines");

/**
 * Format Copper opportunity data
 *
 * @param {object} opportunityData - The raw Copper opportunity data
 * @returns {object} The formatted Copper opportunity data
 */
exports.formatOpportunityData = (opportunity) => {
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
 * Get Copper opportunity by ID
 *
 * @param {string} opportunityId - The ID of the Copper opportunity
 * @returns {object} The Copper opportunity data
 */
exports.getOpportunity = async (opportunityId) => {
    const copper = copperSdk();

    const response = await copper.get(`/opportunities/${opportunityId}`);

    return response.data;
};

/**
 * Update Copper opportunity
 *
 * @param {string} opportunityId - The ID of the Copper opportunity
 * @param {object} updateData - The data to update the Copper opportunity with
 * @returns {object} The updated Copper opportunity data
 */
exports.updateOpportunity = async (opportunityId, updateData) => {
    const copper = copperSdk();

    const response = await copper.put(
        `/opportunities/${opportunityId}`,
        updateData
    );

    return response.data;
};

/**
 * Get Copper opportunity with Wizard Data by ID
 *
 * @param {string} opportunityId - The ID of the Copper opportunity
 * @returns {object} The Copper opportunity data with Wizard Data
 */
exports.getOpportunityWithWizardData = async (opportunityId) => {
    const copper = copperSdk();

    const response = await copper.get(`/opportunities/${opportunityId}`);

    const opportunity = response.data;

    const wizardDataField = opportunity.custom_fields.find(
        (field) => field.custom_field_definition_id === cfid("wizardData")
    );

    const wizardData = wizardDataField
        ? JSON.parse(wizardDataField.value)
        : null;

    return {
        ...opportunity,
        wizardData,
    };
};

/**
 * Update Copper opportunity's Wizard Data
 *
 * @param {number} opportunityId
 * @param {object} wizardData
 * @returns
 */
exports.updateOpportunityWizardData = async (opportunityId, wizardData) => {
    const copper = copperSdk();

    const serializedWizardData = JSON.stringify(wizardData);

    // Check if the serialized data exceeds Copper's field size limit (typically 32KB)
    if (serializedWizardData.length > 1000) {
        throw new Error(
            `Wizard data is too large (${serializedWizardData.length} characters). Maximum allowed size is 1,000 characters.`
        );
    }

    const response = await copper.put(`/opportunities/${opportunityId}`, {
        custom_fields: [
            {
                custom_field_definition_id: cfid("wizardData"),
                value: serializedWizardData,
            },
        ],
    });

    return response.data;
};

/**
 * Get Copper opportunity by Project Code
 *
 * @param {string} projectCode - The Project Code to search for
 * @returns {object} The Copper opportunity data
 */
exports.getOpportunityByProjectCode = async (projectCode) => {
    const copper = copperSdk();

    const response = await copper.get(`/opportunities/search`, {
        params: {
            custom_field_definition_id: cfid("projectCode"),
            custom_field_value: projectCode,
        },
    });

    return response.data;
};

/**
 * Get Copper opportunities with optional filter function
 *
 * @param {object} options - Options for fetching opportunities
 * @param {function} [options.filterFn] - Optional filter function to apply to opportunities
 * @param {string} [options.cacheKey] - Optional cache key for caching results
 * @param {object} [options.params] - Additional query parameters for the API request
 * @param {array} [options.params.ids] - List of opportunity IDs to fetch
 * @param {number} [options.params.page_number] - Page number for pagination
 * @param {number} [options.params.page_size] - Number of entries per page
 * @param {string} [options.params.sort_by] - Field to sort results by
 * @param {string} [options.params.sort_direction] - Direction to sort results (asc or desc)
 * @param {string} [options.params.name] - Full name of the Opportunity to search for
 * @param {array} [options.params.assignee_ids] - IDs of Users that Opportunities must be owned by
 * @param {array} [options.params.status_ids] - Array of Opportunity status IDs
 * @param {array} [options.params.pipeline_ids] - Array of pipeline IDs
 * @param {array} [options.params.pipeline_stage_ids] - Array of pipeline stage IDs
 * @param {array} [options.params.primary_contact_ids] - Array of primary contact IDs
 * @param {array} [options.params.priority_ids] - Array of priority IDs
 * @param {array} [options.params.customer_source_ids] - Array of customer source IDs
 * @param {array} [options.params.loss_reason_ids] - Array of loss reason IDs
 * @param {array} [options.params.company_ids] - Array of company IDs
 * @param {array} [options.params.tags] - Tags to filter Opportunities by
 * @param {number} [options.params.followed] - 1 for followed, 2 for not followed
 * @param {number} [options.params.minimum_monetary_value] - Minimum monetary value for Opportunities
 * @param {number} [options.params.maximum_monetary_value] - Maximum monetary value for Opportunities
 * @param {number} [options.params.minimum_interaction_count] - Minimum number of interactions
 * @param {number} [options.params.maximum_interaction_count] - Maximum number of interactions
 * @param {number} [options.params.minimum_close_date] - Earliest close date (Unix timestamp)
 * @param {number} [options.params.maximum_close_date] - Latest close date (Unix timestamp)
 * @param {number} [options.params.minimum_interaction_date] - Earliest date of last interaction (Unix timestamp)
 * @param {number} [options.params.maximum_interaction_date] - Latest date of last interaction (Unix timestamp)
 * @param {number} [options.params.minimum_stage_change_date] - Earliest date of state change (Unix timestamp)
 * @param {number} [options.params.maximum_stage_change_date] - Latest date of state change (Unix timestamp)
 * @param {number} [options.params.minimum_created_date] - Earliest date Opportunities are created (Unix timestamp)
 * @param {number} [options.params.maximum_created_date] - Latest date Opportunities are created (Unix timestamp)
 * @param {number} [options.params.minimum_modified_date] - Earliest date Opportunities are modified (Unix timestamp)
 * @param {number} [options.params.maximum_modified_date] - Latest date Opportunities are modified (Unix timestamp)
 * @returns {array} List of Copper opportunities
 */
exports.getOpportunities = async ({
    filterFn = null,
    cacheKey = null,
    params = {},
}) => {
    const copper = copperSdk();

    if (cacheKey) {
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return cachedData;
        }
    }

    if (params.page_number || params.page_size) {
        throw new Error(
            "Pagination parameters (page_number, page_size) are not supported. This function handles pagination automatically."
        );
    }

    let page = 1;
    const pageSize = 100;
    let allOpportunities = [];

    while (true) {
        const response = await copper.get(`/opportunities`, {
            params: {
                ...params,
                page,
                page_size: pageSize,
            },
        });

        let opportunities = response.data.opportunities;

        allOpportunities = allOpportunities.concat(opportunities);

        if (opportunities.length < pageSize) {
            break;
        }

        page += 1;
    }

    if (filterFn) {
        allOpportunities = allOpportunities.filter(filterFn);
    }

    if (cacheKey) {
        await setCache(cacheKey, allOpportunities, 300); // Cache for 5 minutes
    }

    return allOpportunities;
};

/**
 * Get won Copper opportunities with optional filter function. See above for params.
 * @param {object} options - Options for fetching opportunities
 * @param {function} [options.filterFn] - Optional filter function to apply to opportunities
 * @param {string} [options.cacheKey] - Optional cache key for caching results
 * @param {object} [options.params] - Additional query parameters for the API request
 * @returns {array} List of won Copper opportunities
 */
exports.getWonOpportunities = async ({
    filterFn = null,
    cacheKey = null,
    params = {},
}) => {
    return await exports.getOpportunities({
        filterFn,
        cacheKey,
        params: { ...params, status_ids: [1] }, // 1 is the ID for 'Won' status
    });
};

/**
 * Update Copper opportunity's Project Code
 *
 * @param {number} opportunityId
 * @param {string} projectCode
 * @returns
 */
exports.updateOpportunityProjectCode = async (opportunityId, projectCode) => {
    const copper = copperSdk();

    const response = await copper.put(`/opportunities/${opportunityId}`, {
        custom_fields: [
            {
                custom_field_definition_id: cfid("projectCode"),
                value: projectCode,
            },
        ],
    });

    return response.data;
};
