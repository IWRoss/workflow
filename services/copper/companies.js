const copperSdk = require("./index");

const { selectCustomFieldIDByName: cfid } = require("../../data/copperFields");

const { createCompanyCode } = require("../../helpers/helpers");

/**
 * Search Copper companies by custom field value
 *
 * @param {string} customFieldValue - The value of the custom field to search for
 * @returns {object} The search results from Copper
 */
exports.searchCompaniesByCustomField = async (customFieldValue) => {
    const copper = copperSdk();

    const response = await copper.get(`/companies/search`, {
        params: {
            custom_field_definition_id: cfid("companyCode"),
            custom_field_value: customFieldValue,
        },
    });

    return response.data;
};

/**
 * Get Copper company by ID
 *
 * @param {string} companyId - The ID of the Copper company
 * @returns {object} The Copper company data
 */
exports.getCompanyById = async (companyId) => {
    const copper = copperSdk();

    const response = await copper.get(`/companies/${companyId}`);

    return response.data;
};

/**
 * Update Copper company
 *
 * @param {string} companyId - The ID of the Copper company
 * @param {object} updateData - The data to update the Copper company with
 * @returns {object} The updated Copper company data
 */
exports.updateCompany = async (companyId, updateData) => {
    const copper = copperSdk();

    const response = await copper.put(`/companies/${companyId}`, updateData);

    return response.data;
};

/**
 * Create Copper company
 *
 * @param {object} companyData - The data for the new Copper company
 * @returns {object} The created Copper company data
 */
exports.createCompany = async (companyData) => {
    const copper = copperSdk();

    const response = await copper.post(`/companies`, companyData);

    return response.data;
};

/**
 * Assign company code to Copper company
 *
 * @param {object} company - The Copper company object
 * @param {boolean} force - Whether to force assignment even if code exists
 * @returns {object} The updated Copper company data
 */
exports.assignCompanyCode = async (company, force = false) => {
    // Check if company already has a company code
    const existingCompanyCode =
        company.custom_fields?.find((field) => field.name === "companyCode")
            ?.value || null;

    if (existingCompanyCode && !force) {
        return {
            message: "Company already has a company code",
            company,
        };
    }

    // Generate a new company code
    const newCompanyCode = await createCompanyCode(company.name);

    // Check if the generated company code is unique
    const searchResults = await exports.searchCompaniesByCustomField(
        newCompanyCode
    );

    if (searchResults.length > 0) {
        throw new Error(
            `Generated company code "${newCompanyCode}" is not unique`
        );
    }

    // Update the company with the new company code
    const updatedCompany = await exports.updateCompany(company.id, {
        custom_fields: [
            {
                custom_field_definition_id: cfid("companyCode"),
                value: newCompanyCode,
            },
        ],
    });

    return updatedCompany;
};
