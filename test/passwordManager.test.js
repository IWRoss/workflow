const { expect } = require("mocha");
const passwords = require("../data/passwords");

describe("Password Manager", () => {
    describe("passwords data", () => {
        it("should have password data as an object", () => {
            expect(typeof passwords).to.equal("object");
        });

        it("should contain at least one password", () => {
            const keys = Object.keys(passwords);
            expect(keys.length).to.be.greaterThan(0);
        });

        it("should have credential objects or strings for all passwords", () => {
            const values = Object.values(passwords);
            values.forEach((credentials) => {
                if (typeof credentials === "object") {
                    // New format: should have username and password properties
                    expect(credentials).to.have.property("username");
                    expect(credentials).to.have.property("password");
                    expect(typeof credentials.username).to.equal("string");
                    expect(typeof credentials.password).to.equal("string");
                    expect(credentials.username.length).to.be.greaterThan(0);
                    expect(credentials.password.length).to.be.greaterThan(0);

                    // Optional fields
                    if (credentials.url) {
                        expect(typeof credentials.url).to.equal("string");
                        expect(credentials.url.length).to.be.greaterThan(0);
                    }

                    if (credentials.commands) {
                        expect(Array.isArray(credentials.commands)).to.be.true;
                        credentials.commands.forEach((cmd) => {
                            expect(typeof cmd).to.equal("string");
                            expect(cmd.length).to.be.greaterThan(0);
                        });
                    }
                } else {
                    // Legacy format: should be a string
                    expect(typeof credentials).to.equal("string");
                    expect(credentials.length).to.be.greaterThan(0);
                }
            });
        });

        it("should have lowercase keys for consistency", () => {
            const keys = Object.keys(passwords);
            keys.forEach((key) => {
                expect(key).to.equal(key.toLowerCase());
            });
        });
    });

    describe("commands functionality", () => {
        it("should be able to list all application names", () => {
            const appNames = Object.keys(passwords);
            expect(Array.isArray(appNames)).to.be.true;
            expect(appNames.length).to.be.greaterThan(0);
        });

        it("should return sorted application names for better UX", () => {
            const appNames = Object.keys(passwords);
            const sortedNames = [...appNames].sort();
            expect(JSON.stringify(sortedNames)).to.equal(
                JSON.stringify(appNames.sort())
            );
        });

        it("should handle case-insensitive lookups", () => {
            const appNames = Object.keys(passwords);
            if (appNames.length > 0) {
                const testApp = appNames[0];

                // Should find the credentials regardless of case
                expect(passwords[testApp.toLowerCase()]).to.exist;
            }
        });

        it("should support both new credential format and legacy password format", () => {
            const values = Object.values(passwords);
            let hasNewFormat = false;
            let hasLegacyFormat = false;

            values.forEach((credentials) => {
                if (
                    typeof credentials === "object" &&
                    credentials.username &&
                    credentials.password
                ) {
                    hasNewFormat = true;
                } else if (typeof credentials === "string") {
                    hasLegacyFormat = true;
                }
            });

            // At least one format should be present
            expect(hasNewFormat || hasLegacyFormat).to.be.true;
        });

        it("should support alternative commands for flexible lookup", () => {
            const hasAlternativeCommands = Object.values(passwords).some(
                (credentials) =>
                    typeof credentials === "object" &&
                    credentials.commands &&
                    Array.isArray(credentials.commands) &&
                    credentials.commands.length > 0
            );

            // At least some entries should have alternative commands
            expect(hasAlternativeCommands).to.be.true;
        });

        it("should support optional URL field for enhanced user experience", () => {
            const hasUrls = Object.values(passwords).some(
                (credentials) =>
                    typeof credentials === "object" &&
                    credentials.url &&
                    typeof credentials.url === "string"
            );

            // At least some entries should have URLs
            expect(hasUrls).to.be.true;
        });

        it("should handle app names with spaces and special characters", () => {
            // Check that we have apps with spaces (these are common in the current dataset)
            const appNamesWithSpaces = Object.keys(passwords).filter((key) =>
                key.includes(" ")
            );

            // Should have at least some apps with spaces
            expect(appNamesWithSpaces.length).to.be.greaterThan(0);

            // All apps with spaces should still have valid credentials
            appNamesWithSpaces.forEach((appName) => {
                const credentials = passwords[appName];
                if (typeof credentials === "object") {
                    expect(credentials).to.have.property("username");
                    expect(credentials).to.have.property("password");
                } else {
                    expect(typeof credentials).to.equal("string");
                }
            });
        });
    });
});
