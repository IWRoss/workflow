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
    718366: "wizardData",
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

    return Number(customField[0]);
};

module.exports = {
    opportunityCustomFieldMap,
    companyCustomFieldMap,
    selectCustomFieldIDByName,
};
