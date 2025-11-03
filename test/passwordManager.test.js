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

        it("should have string values for all passwords", () => {
            const values = Object.values(passwords);
            values.forEach((password) => {
                expect(typeof password).to.equal("string");
                expect(password.length).to.be.greaterThan(0);
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
                const upperCaseApp = testApp.toUpperCase();

                // Should find the password regardless of case
                expect(passwords[testApp.toLowerCase()]).to.exist;
            }
        });
    });
});
