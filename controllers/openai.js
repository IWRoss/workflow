const OpenAI = require("openai");

//Create a connection to OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const { promptFormattedGlossary } = require("../data/glossary");

const generateTitleFromRequest = async (client, description) => {
    let systemPrompt = `You are a helpful assistant that generates concise and relevant titles for project descriptions for a company called Cegos. Use British English spelling and terminology throughout. Use the following business-specific vocabulary:\n\n${promptFormattedGlossary}`;

    let userPrompt = `Generate a concise (8 words or less) and relevant title for the following project description, in sentence-case, emphasising the deliverable, and the verb corresponding to the action (e.g. "Add options to M&S Typeform"):\n\n${description}`;

    if (client && !client.toLowerCase().includes("cegos")) {
        userPrompt += `\n\nPlease feature the client: ${client}`;
    }

    userPrompt += `\n\nTitle:`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
            max_tokens: 20,
            temperature: 0.7,
        });

        const title = response.choices[0].message.content.trim();

        // Remove speech marks if they are present
        if (title.startsWith('"') && title.endsWith('"')) {
            return title.slice(1, -1);
        }

        return title;
    } catch (error) {
        console.error("Error generating title:", error);
        throw error;
    }
};

//Function to format the SOW document description using OpenAI
const formatSowDescription = async (description) => {
    if (!description) return "";

    const systemPrompt =
    "You are a careful editor for Statements of Work (SOW). " +
    "Rewrite the user's text to be clear, professional, and concise. " +
    "Preserve meaning. Do not add new scope or claims. Output only the rewritten text. " +
    "Use British English spelling and terminology throughout. " +
    "This text will be included in a legal document, so ensure it is well-written and formal. " +
    "\n\nFORMATTING RULES:\n" +
    "- Use **bold** for emphasis on key terms\n" +
    "- Use bullets (-) for lists\n" +
    "- STRICT RULE: Maximum 2 levels of bullets only\n" +
    "- Level 1: Main items (no indentation)\n" +
    "- Level 2: Details (3 spaces indentation)\n" +
    "- Combine all details into a single bullet point at level 2 instead of creating sub-levels\n" +
    "- Use ## for section headings\n" +
    "Keep formatting minimal and professional.";

const userPrompt =
    `Rewrite and polish this SOW description:\n\n${description.trim()}\n\n` +
    "Requirements:\n" +
    "- Use EXACTLY 2 levels of bullets:\n" +
    "  - **Main item** (bold, no sub-items)\n" +
    "     - All details in a single line or consolidated sub-item\n" +
    "- Example format:\n" +
    "  - **Hg-branded live learning modules**\n" +
    "     - 6 modules delivered at 2 per cohort\n" +
    "- NEVER create a third level of bullets\n" +
    "- Fix grammar, clarity, and tone.\n" +
    "- Output in markdown format.";

    try {
        const response = await openai.responses.create({
            model: "gpt-5-mini",
            input: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        let formatted = (response.output_text || "").trim();

        // Remove wrapping quotes if added
        if (
            (formatted.startsWith('"') && formatted.endsWith('"')) ||
            (formatted.startsWith("'") && formatted.endsWith("'"))
        ) {
            formatted = formatted.slice(1, -1).trim();
        }

        console.log("Formatted SOW description (markdown):", formatted);
        return formatted + "\n\n";
    } catch (error) {
        console.error("Error formatting SOW description:", error);
        throw error;
    }
};

module.exports = {
    generateTitleFromRequest,
    formatSowDescription,
};
