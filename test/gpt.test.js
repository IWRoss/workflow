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
            "hey guys! please can you upload this case study onto the website - thank you!",
    },
    {
        client: "Cegos",
        description:
            "heya guys, \nThe brunch speakeasy copy is ready, could you please upload it to the website on the Oct speakeasy page.\nThanks so much!!",
    },
    {
        client: "Red Bull",
        description:
            "Dear wonderful & amazing dev team!!\n\nThis is the dev request for the Red Bull web browser app that we discussed on Tuesday August 26th. We are SO excited to work with you on this project! I will use this document as a main repository for the development request. Please reach out with any questions!!\n\nThe workshop will run on Wednesday, September 24th, and we would like to be able to test the app on the ground, in Portland OR on Monday, September 22nd to make sure we can address any problems. \n\nPlease see below for all notes. I will be adding in the challenges and will keep you updated as I go.\n\nTHANK YOU for taking this on with such gusto and excitement!!",
    },
    {
        client: "M&S",
        description:
            "Hi both, please would either of you be able to hold a little bit of time to make some tweaks to the M&S Core Skills Dashboard?\n\nUpdates:\nPlease could we pull the data from the final question on the Typeform onto the dashboard: What other topics would you like to see?\n\nWould we also be able to add back in the workshops I deleted? (Sorry about this one)\n\nEvolving Through Change Workshop\nDriving Impactful Change Workshop\nCrafting Clear Goals Workshop\nPrioritising for Productivity Workshop\nInfluencing Stakeholders with Stories Workshop\nPreparing for Feedback Conversations Workshop\nBecoming Commercially Clever Workshop\n\n(I've not specified if their are immersive or knowledge boost because, if we run them, they will likely all follow the same 90 min format now)\n\nTHANK YOU!",
    },
    {
        title: "Cegos",
        description:
            "Hi Ross and Anite,\n\nStudio is working on creating content for a portfolio page on the website, using the same template as the case studies page. Would you be able to hold time on week c 25th August create x1 landing page and x3 pages for 3 projects (I'll send over the content when it's ready!). This request is to get the groundworks laid for this project (the end goal is to have x6 projects on the page by end of September) - it would be great to speak more about the details in person.\n\nThank you so much <3",
    },
];

describe("#generateTitleFromRequest", function () {
    it("should generate a title from descriptions", async function () {
        this.timeout(10000);

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
