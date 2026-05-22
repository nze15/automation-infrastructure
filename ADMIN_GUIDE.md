# Admin User Guide

## Getting Started

### Login

1. Navigate to the platform homepage
2. Click "Get Started Free" or "Sign In"
3. Complete Manus OAuth authentication
4. You'll be redirected to the admin dashboard

### Dashboard Overview

The admin dashboard has four main sections:

1. **Dashboard**: Real-time event feed and system metrics
2. **Workflows**: Create and manage automation workflows
3. **Webhooks**: Generate webhook endpoints
4. **AI Builder**: Use AI to create workflows from descriptions

## Webhooks

### Creating a Webhook

1. Go to **Webhooks** section
2. Click **"New Webhook"**
3. Enter webhook name and description
4. Click **"Create Webhook"**
5. Copy the endpoint URL and secret key

### Using a Webhook

The webhook endpoint URL and secret will be displayed. Share the endpoint with your external service.

**Example**: Stripe webhook integration

```bash
# In Stripe dashboard, add webhook endpoint:
https://your-platform.com/api/webhooks/abc123

# Stripe will send events with signature header:
X-Webhook-Signature: sha256=<signature>
```

### Webhook Security

- Each webhook has a unique HMAC-SHA256 secret
- All incoming events are signature-verified
- Invalid signatures are rejected automatically
- Secrets are hidden by default (click eye icon to reveal)

### Deleting a Webhook

1. Go to **Webhooks** section
2. Find the webhook to delete
3. Click **"Delete"**
4. Confirm deletion

⚠️ Deleting a webhook will stop accepting events for that endpoint.

## Workflows

### Creating a Workflow

**Method 1: Manual Creation**

1. Go to **Workflows** section
2. Click **"New Workflow"**
3. Enter workflow name and description
4. Select trigger type:
   - **Event**: Triggered by internal events
   - **Webhook**: Triggered by webhook events
   - **Schedule**: Triggered on a schedule (cron)
   - **Manual**: Triggered manually
5. Click **"Create Workflow"**

**Method 2: AI Builder**

1. Go to **AI Builder** section
2. Describe your automation in plain English
3. Example: "When a user signs up, send them a welcome email and create a wallet"
4. Click **"Generate Workflow"**
5. Review the generated workflow
6. Click **"Create Workflow"** to save

### Workflow Components

#### Triggers

- **Event Trigger**: Responds to internal events (e.g., "user.created")
- **Webhook Trigger**: Responds to incoming webhooks
- **Schedule Trigger**: Runs on a schedule (cron expression)
- **Manual Trigger**: Requires manual execution

#### Conditions

Add conditions to filter when workflows execute:

- **Field**: The data field to check
- **Operator**: equals, contains, gt, lt, gte, lte
- **Value**: The value to compare against

Example: Only send welcome email if user.country == "US"

#### Actions

Workflows execute actions in sequence:

1. **Email**: Send email notification
   - To: recipient email
   - Subject: email subject
   - Body: email content

2. **Notification**: Send in-app notification
   - Title: notification title
   - Content: notification message
   - Type: info, success, warning, error

3. **API Call**: Call external API
   - URL: API endpoint
   - Method: GET, POST, PUT, DELETE
   - Headers: custom headers
   - Body: request payload

4. **AI Task**: Run AI-powered task
   - Prompt: task description
   - Type: classification, generation, extraction, sentiment, summarization

5. **Webhook**: Call webhook
   - URL: webhook endpoint
   - Method: HTTP method
   - Headers: custom headers
   - Body: payload

6. **Data Update**: Update database
   - Table: target table
   - Operation: insert, update, delete
   - Data: fields to update
   - Conditions: where clause

### Variable Interpolation

Use double curly braces to reference data:

```
Hello {{user.name}},

Your account has been created with email {{user.email}}.

Regards,
The Team
```

Available variables depend on the trigger source:
- Webhook events: all fields in webhook payload
- Internal events: event-specific fields
- Previous action results: results from earlier actions

### Workflow Execution

#### Manual Execution

1. Go to **Workflows** section
2. Find the workflow
3. Click **"Test"** to manually trigger
4. View execution results

#### Automatic Execution

Workflows execute automatically when:
- A matching event is received
- A scheduled trigger fires
- A webhook is received

### Monitoring Workflows

1. Go to **Workflows** section
2. Click a workflow to view details
3. Scroll to **"Execution History"**
4. View past executions with:
   - Status: pending, processing, success, failed
   - Start time and duration
   - Results and errors

### Disabling/Enabling Workflows

1. Go to **Workflows** section
2. Find the workflow
3. Toggle the **"Active"** badge to disable/enable

⚠️ Disabled workflows won't execute automatically.

### Deleting Workflows

1. Go to **Workflows** section
2. Find the workflow
3. Click **"Delete"**
4. Confirm deletion

⚠️ Deleted workflows cannot be recovered.

## Dashboard

### Event Feed

The **Dashboard** shows a real-time feed of all system events:

- **Event Type**: Type of event (user.created, payment.received, etc.)
- **Source**: Where the event came from (webhook, internal, blockchain, payment)
- **Status**: Current status (received, processed, failed)
- **Timestamp**: When the event occurred

#### Filtering Events

Click on event types to filter the feed by specific event types.

### System Metrics

View real-time metrics:

- **Queue Depth**: Number of pending background jobs
- **Processing**: Number of currently processing jobs
- **Event Types**: Number of active event listeners

### Auto-Refresh

Toggle **"Auto-refresh: ON/OFF"** to enable/disable automatic updates every 5 seconds.

## AI Builder

### Creating Workflows with AI

1. Go to **AI Builder** section
2. In **"What should happen?"** field, describe your automation:
   - "When a user registers, send them a welcome email and create a wallet"
   - "Process payments and update user balance"
   - "Classify incoming support tickets by priority"
3. Optionally add **"Additional Context"**
4. Click **"Generate Workflow"**
5. Review the generated workflow
6. View **"Suggestions"** for improvements
7. Click **"Create Workflow"** to save

### Example Prompts

- "Send a daily summary email at 9 AM with all events from the past day"
- "When a blockchain transaction is detected, classify it and notify admins"
- "On payment received, update user account and send confirmation email"
- "Analyze support tickets and route to appropriate team member"

### Suggestions

AI provides suggestions to improve workflows:
- Add error handling
- Implement retries
- Add notifications
- Optimize performance

## System Status

The **Dashboard** system tab shows:

- **Event Bus Status**: Active event listeners
- **Queue Depth**: Pending background jobs
- **Processing Jobs**: Currently running jobs
- **Recent Errors**: Latest system errors

## Best Practices

### Workflow Design

1. **Keep workflows simple**: Complex workflows are harder to debug
2. **Use meaningful names**: Make workflow purpose clear
3. **Add conditions**: Filter events to reduce unnecessary executions
4. **Test before deploying**: Use manual execution to test
5. **Monitor execution**: Check execution history for errors

### Webhook Management

1. **Secure secrets**: Never share webhook secrets
2. **Rotate secrets**: Periodically rotate webhook secrets
3. **Monitor events**: Check event feed for webhook activity
4. **Test signatures**: Verify webhook signatures are correct
5. **Handle errors**: Implement retry logic in workflows

### Performance

1. **Limit action count**: Keep workflows under 10 actions
2. **Use conditions**: Reduce unnecessary executions
3. **Monitor queue depth**: Alert if queue gets too deep
4. **Optimize API calls**: Batch requests when possible
5. **Cache results**: Avoid redundant API calls

### Security

1. **Verify signatures**: Always verify webhook signatures
2. **Use HTTPS**: Ensure all connections are encrypted
3. **Limit access**: Restrict admin access to authorized users
4. **Audit logs**: Monitor workflow executions
5. **Rotate secrets**: Periodically rotate webhook secrets

## Troubleshooting

### Workflow Not Executing

1. Check if workflow is **"Active"**
2. Verify trigger configuration
3. Check event feed for matching events
4. Review workflow conditions
5. Check execution history for errors

### Webhook Not Receiving Events

1. Verify webhook endpoint URL is correct
2. Check webhook secret is correct
3. Verify signature calculation
4. Check event feed for incoming events
5. Review webhook logs

### Slow Performance

1. Check queue depth in system metrics
2. Review workflow execution times
3. Optimize API calls in actions
4. Reduce number of actions per workflow
5. Add conditions to filter events

### High Error Rate

1. Review execution history for error messages
2. Check external API availability
3. Verify email configuration
4. Review workflow logic
5. Check database connectivity

## Support

For issues or questions:

1. Check the **API Documentation** for endpoint details
2. Review the **Platform Documentation** for architecture
3. Check workflow execution history for error messages
4. Monitor system metrics for performance issues

## Advanced Topics

### Custom Integrations

To integrate with external services:

1. Use **API Call** action to call external APIs
2. Use **Webhook** action to trigger external webhooks
3. Map request/response data using variable interpolation
4. Handle errors with retry logic

### Scheduled Workflows

To run workflows on a schedule:

1. Create workflow with **Schedule** trigger
2. Enter cron expression (e.g., "0 9 * * *" for 9 AM daily)
3. Workflow will execute automatically on schedule

### Data Transformations

To transform data between actions:

1. Use **AI Task** action for complex transformations
2. Use variable interpolation for simple mappings
3. Use **Data Update** action to persist results

### Error Handling

To handle errors in workflows:

1. Add conditions to check for errors
2. Use multiple actions to implement retry logic
3. Send notifications on errors
4. Log errors to external systems
