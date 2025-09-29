const glossary = {
    Cegos: "A global learning and development company that provides training solutions to businesses and individuals. This is the name of the company requesting the project.",
    Deliverable:
        "A specific output or product that is to be delivered as part of a project.",
    "Project Description":
        "A detailed explanation of the project's objectives, scope, and requirements.",
    Title: "A concise and relevant name or heading that summarizes the essence of the project.",
    Studio: "The creative team within Cegos responsible for content creation and design.",
    Speakeasy:
        "A regular event or series of events organized by Cegos, often involving presentations or discussions on various topics.",
    Workshop:
        "An interactive training session or seminar focused on a specific topic or skill.",
    Workflow:
        "Cegos's internal application for managing projects, tasks, and communications.",
    "Events Hub":
        "Cegos's internal application for managing events and related activities.",
    "Case Study":
        "A detailed analysis of a particular project or situation, often used for marketing or educational purposes.",
    Barometer:
        "A type of survey or assessment used to measure performance or satisfaction.",
    Mag: "A digitally published magazine produced by Cegos, featuring articles, insights, and updates on various topics related to learning and development.",
    "Imagine Magazine":
        "The official name of Cegos's digitally published magazine, known as 'Mag', which includes articles, insights, and updates on various topics related to learning and development.",
};

const promptFormattedGlossary = Object.entries(glossary)
    .map(([term, definition]) => `- ${term}: ${definition}`)
    .join("\n");

module.exports = {
    promptFormattedGlossary,
};
