# Slack App Configuration for Password Manager

To enable the `/password` and `/passwords` slash commands in your Slack workspace, you need to configure them in your Slack app settings.

## Step 1: Create/Configure Slash Commands

1. Go to [Slack API](https://api.slack.com/apps)
2. Select your existing Workflow app (or create a new one)
3. Navigate to "Slash Commands" in the left sidebar
4. Click "Create New Command" for each command

## Step 2: Configure the Commands

### First Command - Individual Password Lookup

-   **Command**: `/password`
-   **Request URL**: `https://your-domain.com/slack/command`
-   **Short Description**: `Get application passwords`
-   **Usage Hint**: `[application-name]`

### Second Command - List All Applications

-   **Command**: `/passwords`
-   **Request URL**: `https://your-domain.com/slack/command`
-   **Short Description**: `List all available applications`
-   **Usage Hint**: `(no parameters needed)`

## Step 3: Configure Permissions

Make sure your app has the following OAuth scopes in "OAuth & Permissions":

-   `chat:write` - To send messages
-   `commands` - To receive slash commands

## Step 4: Install/Reinstall App

After adding the slash command, you may need to reinstall the app to your workspace to pick up the new permissions.

## Environment Variables

Make sure your application has the following environment variables set:

```bash
SLACK_TOKEN=xoxb-your-bot-token
```

## Testing

Once configured, you can test both commands in any Slack channel:

```
/password wifi     # Get specific password
/password admin    # Get another password
/passwords         # List all available applications
/password          # Also lists applications (legacy)
```

## Security Considerations

-   The request URL should use HTTPS in production
-   Consider restricting the command to specific channels or users
-   Regularly rotate your Slack bot token
-   Monitor command usage through Slack's analytics

## Troubleshooting

### Command not appearing

-   Verify the slash command was created successfully
-   Check that the app is installed in your workspace
-   Ensure you have the `commands` scope

### Getting timeout errors

-   Verify your server is accessible from Slack
-   Check that the request URL is correct
-   Ensure your server responds within 3 seconds

### Permissions errors

-   Verify the bot token has `chat:write` permissions
-   Check that the bot is added to the channel (for public commands)

### No response

-   Check server logs for errors
-   Verify the command name matches exactly (`password`)
-   Ensure the API route is correctly configured
