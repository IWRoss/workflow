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
            "Lovely design team! content in progress but flagging early here. We are running a live scoping day next thursday, and will need: - Some ppt decks - mostly existing Cegos templates, some tweaking and polishing - Posters; 1 or 2 A1 posters, to be printed by Wednesday for use in person. Simple scoping templates, but want them to be lovely! If someone can take this on then will brief on Monday. Thankyouplease!",
    },
    {
        client: "Made In Add",
        description:
            "Hey Studio, Would love to hold time for a 15-20 slide workshop deck for Made In Add. I'll have it ready by EOP Wednesday - Would like to share it with the client on Monday 15th EOP. Can give a proper briefing f2f or virtully.",
    },
    {
        client: "Brunch",
        description:
            "heya guys, The brunch speakeasy copy is ready, could you please upload it to the website on the Oct speakeasy page. Thanks so much!!",
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
