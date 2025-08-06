const assert = require("assert");
const dotenv = require("dotenv");

beforeEach(() => {
    dotenv.config();
});

describe("#handleSpendRequest", function () {
    it("should process spend request and send message to Slack channel", async function () {
        const { handleSpendRequest } = require("../controllers/slack");

        // Increase timeout to 10 seconds
        this.timeout(10000);

        const payload = {
            type: "view_submission",
            team: { id: "TBQV8UK43", domain: "cegosians" },
            user: {
                id: "U087XQSQUDV",
                username: "anite",
                name: "anite",
                team_id: "TBQV8UK43",
            },
            api_app_id: "A0926QTH5JB",
            token: "SpZCASaGLGasJZeoy804VbtM",
            trigger_id:
                "9301758739379.398994971139.3da217cce9a9ae8213aaf7db763444e5",
            view: {
                id: "V098K61R24X",
                team_id: "TBQV8UK43",
                type: "modal",
                callback_id: "handleSpendRequestResponse",
                state: {
                    values: {
                        block_1: {
                            spendRequestTypeSelect: {
                                selected_option: {
                                    value: "Overhead",
                                },
                            },
                        },
                        block_2: {
                            departmentSelect: {
                                selected_option: {
                                    value: "Marketing",
                                },
                            },
                        },
                        block_3: {
                            clientSelect: {
                                selected_option: {
                                    value: "Cegos",
                                },
                            },
                        },
                        block_4: {
                            projectCode: {
                                value: "ProjectCode001",
                            },
                        },
                        block_5: {
                            notes: {
                                value: "This is a test spend request for conference attendance and related expenses.",
                            },
                        },
                    },
                },
                title: {
                    type: "plain_text",
                    text: "Post a request",
                    emoji: true,
                },
                submit: { type: "plain_text", text: "Submit", emoji: true },
                close: { type: "plain_text", text: "Cancel", emoji: true },
            },
            response_urls: [],
            is_enterprise_install: false,
            enterprise: null,
        };

        const locations = [
            {
                boardId: undefined,
                slackChannel: "C01LSF9T3B8",
            },
        ];

        try {
            const result = await handleSpendRequest(payload, locations);

            console.log("Spend request result:", result);
            console.dir(result, { depth: null });

            assert(result);
            assert.strictEqual(result.status, "success");
            assert.strictEqual(
                result.message,
                "Spend request submitted successfully."
            );
        } catch (error) {
            console.error("Error processing spend request:", error);
            throw error;
        }
    });
});
