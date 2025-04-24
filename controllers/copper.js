const axios = require("axios");
const { setCache, getCache } = require("./cache");

const copperHeaders = {
  "X-PW-AccessToken": process.env.COPPER_API_KEY,
  "X-PW-Application": "developer_api",
  "X-PW-UserEmail": process.env.COPPER_API_EMAIL,
  "Content-Type": "application/json",
};

const copperCustomFieldMap = {
  631912: "projectCode",
  22023: "likelyInvoiceDate",
  681214: "internationalProject",
  681471: "submittedOn",
  689549: "invoiceDetail",
  689554: "projectFees",
  689552: "consultingFees",
  689553: "studioFees",
  689556: "invoicingEmail",
  689557: "invoicingContact",
};

const selectCustomFieldIDByName = (name) => {
  const customField = Object.entries(copperCustomFieldMap).find(
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
      if (copperCustomFieldMap[field.custom_field_definition_id]) {
        acc[copperCustomFieldMap[field.custom_field_definition_id]] =
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

module.exports = {
  getPipelines,
  getValidPipelineStageIDs,
  getOpportunities,
  getCustomFieldDefinitions,
};
