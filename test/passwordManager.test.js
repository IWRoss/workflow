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
});
