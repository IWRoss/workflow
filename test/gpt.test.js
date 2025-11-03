const assert = require("assert");

const dotenv = require("dotenv");

beforeEach(() => {
    dotenv.config();
});

const { generateTitleFromRequest } = require("../controllers/openai");

const descriptions = [
    {
        client: "Cegos",
        description:
            "Hi team! This is the request to build in some categorisation for Events Hub as discussed, so we can separate out magazines, whitepapers, brochures, or other events into different sections. Ideally I'd love to be able to compare or at least summarise sign-ups from different 'formats' more easily! Thank youuu",
    },
    {
        client: "Cegos",
        description:
            "Was trying to book half days holiday using whosware but cannot do it. thanks",
    },
    {
        client: "Cegos",
        description:
            "Hey Ross — this is the request for a prioritised list of all webpages for us to start working on SEO improvements! How you prioritise is up to you (also fine if you just start with the top 10 for this week).",
    },
    {
        client: "Cegos",
        description:
            "Have guys, Current we do client evaluations manually via Polleverywhere then into PPT. I would like to automate this process and provide an evals service to all Cegos UK. Currently I only produce reports for Cegos OG. For further details and to see what the process is right now, please contact me. Thank you :-)",
    },
    {
        title: "Cegos",
        description:
            "Hi Ross and Anite,\n\nStudio is working on creating content for a portfolio page on the website, using the same template as the case studies page. Would you be able to hold time on week c 25th August create x1 landing page and x3 pages for 3 projects (I'll send over the content when it's ready!). This request is to get the groundworks laid for this project (the end goal is to have x6 projects on the page by end of September) - it would be great to speak more about the details in person.\n\nThank you so much <3",
    },
];

describe("#generateTitleFromRequest", function () {
    it("should generate a title from descriptions", async function () {
        this.timeout(20000);

        for (const { client, description } of descriptions) {
            try {
                const title = await generateTitleFromRequest(
                    client,
                    description
                );

                console.log(`Client: ${client}`);
                console.log(`Description: ${description}`);
                console.log(`Generated Title: ${title}`);
                console.log("---------------------------");

                assert(title);
            } catch (error) {
                console.error("Error generating title:", error);
            }
        }
    });
});
