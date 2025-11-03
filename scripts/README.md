# Heroku Password Deployment Scripts

This directory contains scripts to help you deploy your password manager credentials to Heroku without committing them to your Git repository.

## Scripts Overview

### 1. `set-heroku-passwords.js` - Automated Deployment

Automatically reads your local `data/passwords.js` file and sets the corresponding Heroku config variables.

### 2. `generate-heroku-commands.js` - Command Generator

Generates Heroku config commands that you can copy and paste manually.

## Quick Start

### Option A: Automated Deployment (Recommended)

```bash
# Dry run (shows commands without executing)
node scripts/set-heroku-passwords.js my-app --dry-run

# Execute commands
node scripts/set-heroku-passwords.js my-app

# With verbose output
node scripts/set-heroku-passwords.js my-app --verbose
```

### Option B: Manual Commands

```bash
# Generate commands for copy/paste
node scripts/generate-heroku-commands.js my-app

# Generate commands for default app
node scripts/generate-heroku-commands.js
```

## Script Details

### `set-heroku-passwords.js`

**Features:**

-   ✅ Reads `data/passwords.js` automatically
-   ✅ Handles both username/password and legacy password-only formats
-   ✅ Dry-run mode for safety
-   ✅ Verbose output for debugging
-   ✅ Error handling and validation
-   ✅ Progress tracking

**Usage:**

```bash
node scripts/set-heroku-passwords.js [app-name] [options]
```

**Arguments:**

-   `app-name`: Your Heroku app name (optional if you have a default app)

**Options:**

-   `--dry-run`: Show commands without executing them
-   `--verbose`: Show detailed output
-   `--help`: Show help message

**Examples:**

```bash
# Basic usage
node scripts/set-heroku-passwords.js my-production-app

# Safe preview
node scripts/set-heroku-passwords.js my-app --dry-run --verbose

# Help
node scripts/set-heroku-passwords.js --help
```

### `generate-heroku-commands.js`

**Features:**

-   ✅ Simple command generation
-   ✅ Copy/paste friendly output
-   ✅ No execution (safe for review)
-   ✅ Handles both credential formats

**Usage:**

```bash
node scripts/generate-heroku-commands.js [app-name]
```

**Examples:**

```bash
# Generate commands for specific app
node scripts/generate-heroku-commands.js my-production-app

# Generate commands for default app
node scripts/generate-heroku-commands.js
```

## Environment Variable Format

The scripts convert your `data/passwords.js` format to Heroku environment variables:

### New Format (Username + Password + Optional Fields)

```javascript
// data/passwords.js
{
    "teams room 1": {
        username: "teamsroom1@cegos.co.uk",
        password: "VirtualRoom2025!!",
        url: "https://teams.microsoft.com/room1",
        commands: ["teams room 1", "room 1", "tr1"]
    }
}
```

Becomes:

```bash
PASSWORDS_TEAMS_ROOM_1_USERNAME="teamsroom1@cegos.co.uk"
PASSWORDS_TEAMS_ROOM_1_PASSWORD="VirtualRoom2025!!"
PASSWORDS_TEAMS_ROOM_1_URL="https://teams.microsoft.com/room1"
PASSWORDS_TEAMS_ROOM_1_COMMANDS="teams room 1,room 1,tr1"
```

**Note:** App names with spaces and special characters are automatically sanitized for environment variable names:

-   `"teams room 1"` becomes `TEAMS_ROOM_1`
-   `"motion design school"` becomes `MOTION_DESIGN_SCHOOL`
-   Special characters are replaced with underscores

### Legacy Format (Password Only)

```javascript
// data/passwords.js
{
    oldapp: "just-a-password";
}
```

Becomes:

```bash
PASSWORDS_OLDAPP="just-a-password"
```

## Security Best Practices

### ✅ DO:

-   Run with `--dry-run` first to review commands
-   Use these scripts only on trusted machines
-   Keep your `data/passwords.js` file secure and gitignored
-   Verify Heroku config after deployment: `heroku config --app my-app`

### ❌ DON'T:

-   Commit these scripts' output to version control
-   Run scripts on untrusted or shared machines
-   Share your `data/passwords.js` file

## Troubleshooting

### "Passwords file not found"

-   Ensure you have a `data/passwords.js` file in your project root
-   Check that the file is properly formatted as a JavaScript module

### "Command failed"

-   Verify you're logged into Heroku CLI: `heroku auth:whoami`
-   Check your app name is correct: `heroku apps`
-   Ensure you have access to the app: `heroku access --app my-app`

### "Invalid format"

-   Check your `data/passwords.js` file exports an object
-   Ensure username/password objects have both properties
-   Validate JavaScript syntax: `node -c data/passwords.js`

## Workflow Example

```bash
# 1. Update your local passwords
vim data/passwords.js

# 2. Test the script (dry run)
node scripts/set-heroku-passwords.js my-app --dry-run

# 3. Deploy to Heroku
node scripts/set-heroku-passwords.js my-app

# 4. Verify deployment
heroku config --app my-app

# 5. Test the password manager in Slack
# /password gmail
```

## Integration with CI/CD

You can integrate these scripts into your deployment pipeline:

```bash
# In your deployment script
if [ "$NODE_ENV" = "production" ]; then
    echo "Setting Heroku passwords..."
    node scripts/set-heroku-passwords.js $HEROKU_APP_NAME --verbose
fi
```

**Note:** Only do this if your CI/CD environment is secure and you trust it with your credentials.
