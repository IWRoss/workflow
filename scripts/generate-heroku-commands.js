#!/usr/bin/env node

/**
 * Generate Heroku Password Commands
 *
 * This script reads data/passwords.js and generates Heroku config commands
 * that you can copy and paste. It doesn't execute them.
 *
 * Usage: node scripts/generate-heroku-commands.js [app-name]
 */

const fs = require("fs");
const path = require("path");

// Get app name from command line argument
const appName = process.argv[2];

try {
    // Check if passwords file exists
    const passwordsPath = path.join(__dirname, "..", "data", "passwords.js");

    if (!fs.existsSync(passwordsPath)) {
        console.error("❌ Passwords file not found at:", passwordsPath);
        console.log(
            "💡 Make sure you have a data/passwords.js file in your project."
        );
        process.exit(1);
    }

    // Load passwords
    delete require.cache[require.resolve("../data/passwords.js")];
    const passwords = require("../data/passwords.js");

    if (!passwords || typeof passwords !== "object") {
        console.error("❌ Invalid passwords file format. Expected an object.");
        process.exit(1);
    }

    const appNames = Object.keys(passwords);

    if (appNames.length === 0) {
        console.log("⚠️  No passwords found in the passwords file.");
        process.exit(0);
    }

    console.log("🚀 Heroku Config Commands");
    console.log("========================\n");

    if (appName) {
        console.log(`📱 App: ${appName}\n`);
    } else {
        console.log("📱 App: [default]\n");
    }

    // Function to sanitize app keys for environment variable names
    function sanitizeEnvVarName(key) {
        return key
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "_") // Replace non-alphanumeric with underscore
            .replace(/_+/g, "_") // Replace multiple underscores with single
            .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
    }

    // Generate commands
    appNames.forEach((appKey) => {
        const credentials = passwords[appKey];
        const appKeyUpper = sanitizeEnvVarName(appKey);

        console.log(`# ${appKey}`);

        if (
            typeof credentials === "object" &&
            credentials.username &&
            credentials.password
        ) {
            // New format: username + password (+ optional url and commands)
            const usernameVar = `PASSWORDS_${appKeyUpper}_USERNAME`;
            const passwordVar = `PASSWORDS_${appKeyUpper}_PASSWORD`;

            console.log(
                `heroku config:set ${usernameVar}="${credentials.username}"${
                    appName ? ` --app ${appName}` : ""
                }`
            );
            console.log(
                `heroku config:set ${passwordVar}="${credentials.password}"${
                    appName ? ` --app ${appName}` : ""
                }`
            );

            // Add URL if available
            if (credentials.url) {
                const urlVar = `PASSWORDS_${appKeyUpper}_URL`;
                console.log(
                    `heroku config:set ${urlVar}="${credentials.url}"${
                        appName ? ` --app ${appName}` : ""
                    }`
                );
            }

            // Add commands if available
            if (
                credentials.commands &&
                Array.isArray(credentials.commands) &&
                credentials.commands.length > 0
            ) {
                const commandsVar = `PASSWORDS_${appKeyUpper}_COMMANDS`;
                const commandsStr = credentials.commands.join(",");
                console.log(
                    `heroku config:set ${commandsVar}="${commandsStr}"${
                        appName ? ` --app ${appName}` : ""
                    }`
                );
            }
        } else if (typeof credentials === "string") {
            // Legacy format: password only
            const passwordVar = `PASSWORDS_${appKeyUpper}`;
            console.log(
                `heroku config:set ${passwordVar}="${credentials}"${
                    appName ? ` --app ${appName}` : ""
                }`
            );
        } else {
            console.log(`# ⚠️  Skipping ${appKey}: invalid format`);
        }

        console.log("");
    });

    console.log(
        "✅ Copy and paste the commands above to set your Heroku config variables"
    );
    console.log(
        "💡 Or use the automated script: node scripts/set-heroku-passwords.js"
    );
} catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
}
