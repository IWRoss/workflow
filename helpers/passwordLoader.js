/**
 * Password manager helper
 *
 * This helper loads passwords from either a local file (for development)
 * or environment variables (for production/Heroku)
 */

/**
 * Load passwords from file or environment variables
 * Prioritizes local file, falls back to environment variables
 */
function loadPasswords() {
    try {
        // Try to load from local file first (for development)
        const passwords = require("../data/passwords");
        console.log("Loaded passwords from local file");
        return passwords;
    } catch (error) {
        // File doesn't exist or can't be loaded, use environment variables
        console.log(
            "Local passwords file not found, using environment variables"
        );

        // Load passwords from environment variables
        // Expected format:
        // PASSWORDS_APPNAME_USERNAME=username
        // PASSWORDS_APPNAME_PASSWORD=password
        // PASSWORDS_APPNAME_URL=url (optional)
        // PASSWORDS_APPNAME_COMMANDS=cmd1,cmd2,cmd3 (optional)
        // OR legacy format: PASSWORDS_APPNAME=password
        //
        // Note: App names with spaces/special chars are sanitized in env vars
        // e.g., "teams room 1" becomes "TEAMS_ROOM_1" in env var names
        const passwords = {};

        // Function to convert sanitized env var name back to likely original app name
        function unsanitizeAppName(envVarPart) {
            // Convert TEAMS_ROOM_1 back to "teams room 1"
            return envVarPart.toLowerCase().replace(/_/g, " ");
        }

        // Get all environment variables that start with PASSWORDS_
        Object.keys(process.env).forEach((key) => {
            if (key.startsWith("PASSWORDS_")) {
                const keyParts = key.replace("PASSWORDS_", "").split("_");

                if (keyParts.length >= 2) {
                    // New format: PASSWORDS_APPNAME_USERNAME, PASSWORDS_APPNAME_PASSWORD, etc.
                    // Handle multi-part app names like PASSWORDS_TEAMS_ROOM_1_USERNAME
                    const credentialType =
                        keyParts[keyParts.length - 1].toLowerCase();

                    if (
                        ["username", "password", "url", "commands"].includes(
                            credentialType
                        )
                    ) {
                        // This is a credential field, so everything before the last part is the app name
                        const appNameParts = keyParts.slice(0, -1);
                        const appName = unsanitizeAppName(
                            appNameParts.join("_")
                        );

                        if (!passwords[appName]) {
                            passwords[appName] = {};
                        }

                        if (credentialType === "username") {
                            passwords[appName].username = process.env[key];
                        } else if (credentialType === "password") {
                            passwords[appName].password = process.env[key];
                        } else if (credentialType === "url") {
                            passwords[appName].url = process.env[key];
                        } else if (credentialType === "commands") {
                            // Parse comma-separated commands
                            const commandsStr = process.env[key];
                            if (commandsStr && commandsStr.trim()) {
                                passwords[appName].commands = commandsStr
                                    .split(",")
                                    .map((cmd) => cmd.trim());
                            }
                        }
                    } else {
                        // Legacy format: PASSWORDS_APPNAME=password (no credential type suffix)
                        const appName = unsanitizeAppName(keyParts.join("_"));
                        passwords[appName] = process.env[key];
                    }
                } else if (keyParts.length === 1) {
                    // Legacy format: PASSWORDS_APPNAME=password
                    const appName = unsanitizeAppName(keyParts[0]);
                    passwords[appName] = process.env[key];
                }
            }
        });

        // Clean up incomplete entries (entries that only have username OR password, not both)
        Object.keys(passwords).forEach((appName) => {
            const entry = passwords[appName];
            if (
                typeof entry === "object" &&
                (!entry.username || !entry.password)
            ) {
                console.warn(
                    `Incomplete credentials for ${appName} - both username and password required`
                );
                delete passwords[appName];
            }
        });

        // If no password env vars found, return some defaults for demo
        if (Object.keys(passwords).length === 0) {
            console.warn(
                "No password environment variables found. Using demo passwords."
            );
            return {
                demo: {
                    username: "demo.user",
                    password: "DemoPassword123!",
                },
                example: {
                    username: "example.admin",
                    password: "ExamplePass456@",
                },
            };
        }

        console.log(
            `Loaded ${
                Object.keys(passwords).length
            } passwords from environment variables`
        );
        return passwords;
    }
}

module.exports = {
    loadPasswords,
};
