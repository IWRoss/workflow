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
  const response = await axios.get(`${process.env.COPPER_API_URL}/pipelines`, {
    headers: copperHeaders,
  });

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
        custom_field_definition_id: selectCustomFieldIDByName("projectCode"),
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
        acc[opportunityCustomFieldMap[field.custom_field_definition_id]] =
          field.value;
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
    companyCode = companyName.split(" ").join("").substr(0, 3).toUpperCase();
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
          custom_field_definition_id: selectCustomFieldIDByName("projectCode"),
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
      webhook.target === `${process.env.COPPER_WEBHOOK_URL}/copper/receive`
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

/**
 * Handle subscription to Copper update opportunity events
 */
const handleCopperUpdateOpportunityWebhook = async (payload) => {
  if (
    !payload.updated_attributes.stage ||
    payload.updated_attributes.stage[1] !== "Proposal Submitted"
  ) {
    return;
  }

  const opportunity = await getOpportunity(payload.ids[0]);

  const projectCode = opportunity.custom_fields.find(
    (field) =>
      field.custom_field_definition_id ==
      selectCustomFieldIDByName("projectCode")
  )?.value;

  if (projectCode) {
    return;
  }

  /**
   * Let's create a code. Get the company from the company id
   */
  const company = await getCompany(opportunity.company_id);

  const companyCode = company.custom_fields.find(
    (field) =>
      field.custom_field_definition_id ==
      selectCustomFieldIDByName("companyCode", companyCustomFieldMap)
  )?.value;

  const opportunityCounter = company.custom_fields.find(
    (field) =>
      field.custom_field_definition_id ==
      selectCustomFieldIDByName("opportunityCounter", companyCustomFieldMap)
  )?.value;

  if (!companyCode) {
    console.error("Company code not found");
    return;
  }

  const opportunityIndex = parseInt(opportunityCounter || 0) + 1;

  // Set company opportunity index
  const updateCompanyOpportunityCountResponse =
    await updateCompanyOpportunityCount(company.id, opportunityIndex);

  const newProjectCode =
    companyCode + String(opportunityIndex).padStart(3, "0");

  const updateOpportunityProjectCodeResponse =
    await updateOpportunityProjectCode(opportunity.id, newProjectCode);

  return {
    companyCode,
    opportunityCounter: opportunityIndex,
    newProjectCode,
  };
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
};
