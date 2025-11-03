# Password Manager

A simple password manager feature for the Workflow application that responds to Slack slash commands.

## Features

-   Responds to `/password` slash commands in Slack
-   Displays passwords as ephemeral messages (only visible to the requesting user)
-   Lists available applications when no specific app is requested
-   Provides helpful error messages for invalid applications

## Usage

### Basic Usage

```
/password <application-name>
```

### Examples

```
/password wifi
/password admin
/password database
```

### List Available Applications

```
/password
```

## How It Works

1. User types `/password <app-name>` in any Slack channel
2. Slack sends the command to the Workflow application
3. The application looks up the password in the passwords database
4. Returns an ephemeral message with the password (only visible to the requesting user)

## Configuration

### Adding New Passwords

To add new applications and passwords, edit `/data/passwords.js`:

```javascript
module.exports = {
    "app-name": "password123",
    "another-app": "secret456",
    // Add more applications here
};
```

### Security Notes

-   Passwords are stored in plain text in the `passwords.js` file
-   Messages are sent as ephemeral (only visible to the requesting user)
-   Consider using environment variables for sensitive passwords in production
-   Regularly rotate passwords and update the data file

## Technical Implementation

### Files Modified/Created

1. `/data/passwords.js` - Password database
2. `/controllers/slack.js` - Added `handlePasswordCommand` function
3. `/routes/api/api.js` - Added password command routing
4. `/test/passwordManager.test.js` - Unit tests

### API Endpoints

The password manager uses the existing `/slack/command` endpoint which handles all Slack slash commands.

### Error Handling

-   Invalid application names show available options
-   Empty commands show usage instructions
-   All errors are logged for debugging

## Testing

Run the password manager tests:

```bash
npm test -- test/passwordManager.test.js
```

## Future Enhancements

-   Encrypt passwords at rest
-   Add password expiration tracking
-   Integrate with external password managers
-   Add audit logging for password requests
-   Implement role-based access control
