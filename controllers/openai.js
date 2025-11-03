const OpenAI = require("openai");

//Create a connection to OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const { promptFormattedGlossary } = require("../data/glossary");

const generateTitleFromRequest = async (client, description) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant that generates concise and relevant titles for project descriptions for a company called Cegos. Use the following business-specific vocabulary:\n\n" +
                        promptFormattedGlossary,
                },
                {
                    role: "user",
                    content: `Generate a concise (8 words or less) and relevant title for the following project description, emphasising the deliverable:\n\n${description}\n\nPlease feature the client: ${client}\n\nTitle:`,
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

module.exports = {
    generateTitleFromRequest,
};
