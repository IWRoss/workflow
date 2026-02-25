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
        "Format using markdown for better readability:\n" +
        "- Use **bold** for emphasis on key terms\n" +
        "- Use bullet points (- ) for lists\n" +
        "- Use numbered lists (1. 2. 3.) when order matters\n" +
        "- Use ## for section headings if needed\n" +
        "Keep formatting minimal and professional.";

    const userPrompt =
        `Rewrite and polish this SOW description:\n\n${description.trim()}\n\n` +
        "Requirements:\n" +
        "- Structure with headings and bullets where appropriate.\n" +
        "- Fix grammar, clarity, and tone.\n" +
        "- Do not wrap in quotes.\n" +
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
        return formatted;
    } catch (error) {
        console.error("Error formatting SOW description:", error);
        throw error;
    }
};

module.exports = {
    generateTitleFromRequest,
    formatSowDescription,
};
