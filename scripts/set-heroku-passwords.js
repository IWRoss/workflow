#!/usr/bin/env node

/**
 * Heroku Password Config Script
 *
 * This script reads data/passwords.js and automatically sets Heroku config variables.
 * It supports both the new username/password format and legacy password-only format.
 *
 * Usage:
 *   node scripts/set-heroku-passwords.js [app-name] [options]
 *
 * Options:
 *   --dry-run    Show commands without executing them
 *   --verbose    Show detailed output
 *   --help       Show this help message
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Parse command line arguments
const args = process.argv.slice(2);
const appName = args.find((arg) => !arg.startsWith("--"));
const isDryRun = args.includes("--dry-run");
const isVerbose = args.includes("--verbose");
const showHelp = args.includes("--help");

// Show help if requested
if (showHelp) {
    console.log(`
Heroku Password Config Script

This script reads data/passwords.js and sets Heroku config variables.

Usage:
  node scripts/set-heroku-passwords.js [app-name] [options]

Arguments:
  app-name    Your Heroku app name (optional if you have a default app)

Options:
  --dry-run   Show commands without executing them
  --verbose   Show detailed output
  --help      Show this help message

Examples:
  node scripts/set-heroku-passwords.js my-app
  node scripts/set-heroku-passwords.js my-app --dry-run
  node scripts/set-heroku-passwords.js --dry-run --verbose
`);
    process.exit(0);
}

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

function log(message, color = "") {
    console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
    log(`❌ Error: ${message}`, colors.red);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

try {
    // Check if passwords file exists
    const passwordsPath = path.join(__dirname, "..", "data", "passwords.js");

    if (!fs.existsSync(passwordsPath)) {
        logError(`Passwords file not found at: ${passwordsPath}`);
        logInfo("Make sure you have a data/passwords.js file in your project.");
        process.exit(1);
    }

    // Load passwords
    delete require.cache[require.resolve("../data/passwords.js")];
    const passwords = require("../data/passwords.js");

    if (!passwords || typeof passwords !== "object") {
        logError("Invalid passwords file format. Expected an object.");
        process.exit(1);
    }

    const appNames = Object.keys(passwords);

    if (appNames.length === 0) {
        logWarning("No passwords found in the passwords file.");
        process.exit(0);
    }

    log(`\n🚀 Heroku Password Config Script`, colors.bright);
    log(`📂 Found ${appNames.length} applications in passwords file\n`);

    if (isVerbose) {
        logInfo(`Applications: ${appNames.join(", ")}`);
        logInfo(`Dry run mode: ${isDryRun ? "ON" : "OFF"}`);
        logInfo(`Target app: ${appName || "default"}\n`);
    }

    // Generate Heroku config commands
    const commands = [];
    let credentialCount = 0;

    // Function to sanitize app keys for environment variable names
    function sanitizeEnvVarName(key) {
        return key
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "_") // Replace non-alphanumeric with underscore
            .replace(/_+/g, "_") // Replace multiple underscores with single
            .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
    }

    appNames.forEach((appKey) => {
        const credentials = passwords[appKey];
        const appKeyUpper = sanitizeEnvVarName(appKey);

        if (
            typeof credentials === "object" &&
            credentials.username &&
            credentials.password
        ) {
            // New format: username + password (+ optional url and commands)
            const usernameVar = `PASSWORDS_${appKeyUpper}_USERNAME`;
            const passwordVar = `PASSWORDS_${appKeyUpper}_PASSWORD`;

            const usernameCmd = `heroku config:set ${usernameVar}="${
                credentials.username
            }"${appName ? ` --app ${appName}` : ""}`;
            const passwordCmd = `heroku config:set ${passwordVar}="${
                credentials.password
            }"${appName ? ` --app ${appName}` : ""}`;

            commands.push(usernameCmd);
            commands.push(passwordCmd);
            credentialCount += 2;

            // Add URL if available
            if (credentials.url) {
                const urlVar = `PASSWORDS_${appKeyUpper}_URL`;
                const urlCmd = `heroku config:set ${urlVar}="${
                    credentials.url
                }"${appName ? ` --app ${appName}` : ""}`;
                commands.push(urlCmd);
                credentialCount += 1;
            }

            // Add commands if available
            if (
                credentials.commands &&
                Array.isArray(credentials.commands) &&
                credentials.commands.length > 0
            ) {
                const commandsVar = `PASSWORDS_${appKeyUpper}_COMMANDS`;
                const commandsStr = credentials.commands.join(",");
                const commandsCmd = `heroku config:set ${commandsVar}="${commandsStr}"${
                    appName ? ` --app ${appName}` : ""
                }`;
                commands.push(commandsCmd);
                credentialCount += 1;
            }

            if (isVerbose) {
                logInfo(
                    `${appKey}: username + password format${
                        credentials.url ? " + URL" : ""
                    }${credentials.commands ? " + commands" : ""}`
                );
            }
        } else if (typeof credentials === "string") {
            // Legacy format: password only
            const passwordVar = `PASSWORDS_${appKeyUpper}`;
            const passwordCmd = `heroku config:set ${passwordVar}="${credentials}"${
                appName ? ` --app ${appName}` : ""
            }`;

            commands.push(passwordCmd);
            credentialCount += 1;

            if (isVerbose) {
                logInfo(`${appKey}: legacy password-only format`);
            }
        } else {
            logWarning(
                `Skipping ${appKey}: invalid format (expected object with username/password or string)`
            );
        }
    });

    if (commands.length === 0) {
        logWarning("No valid credentials found to set.");
        process.exit(0);
    }

    log(
        `📋 Generated ${commands.length} Heroku config commands for ${credentialCount} credentials\n`
    );

    if (isDryRun) {
        log(
            "🔍 Dry run mode - showing commands that would be executed:\n",
            colors.yellow
        );
        commands.forEach((cmd, index) => {
            log(`${index + 1}. ${cmd}`, colors.cyan);
        });
        log(
            `\n💡 Run without --dry-run to execute these commands`,
            colors.yellow
        );
    } else {
        log("⚡ Executing Heroku config commands...\n", colors.green);

        let successCount = 0;
        let errorCount = 0;

        commands.forEach((cmd, index) => {
            try {
                if (isVerbose) {
                    log(`Executing: ${cmd}`, colors.cyan);
                }

                const output = execSync(cmd, {
                    encoding: "utf8",
                    stdio: "pipe",
                });

                if (isVerbose) {
                    console.log(output);
                }

                successCount++;
            } catch (error) {
                logError(`Command failed: ${cmd}`);
                if (isVerbose) {
                    console.error(error.message);
                }
                errorCount++;
            }
        });

        log(`\n📊 Results:`);
        logSuccess(`${successCount} commands executed successfully`);

        if (errorCount > 0) {
            logError(`${errorCount} commands failed`);
        }

        if (successCount > 0) {
            log(`\n🎉 Password configuration complete!`, colors.green);
            logInfo(
                "You can verify the config with: heroku config" +
                    (appName ? ` --app ${appName}` : "")
            );
        }
    }
} catch (error) {
    logError(`Script failed: ${error.message}`);
    if (isVerbose) {
        console.error(error.stack);
    }
    process.exit(1);
}
