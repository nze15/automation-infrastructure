# Internal Automation Infrastructure

A powerful event-driven workflow automation platform designed for SaaS, AI applications, and Web3 systems. Build sophisticated automations without code.

## Features

### Core Capabilities

- **Webhook Ingestion Engine**: Receive events from frontend apps, payment processors, blockchain listeners, and external APIs with secure HMAC-SHA256 signature verification
- **Workflow Automation Engine**: Define trigger → process → action pipelines with conditional logic and data transformations
- **Real-Time Event Bus**: In-memory pub/sub system for instant event broadcasting across services
- **Background Job Queue**: Async task processing with retry logic, exponential backoff, and scheduling
- **Admin Dashboard**: Real-time event feed, workflow manager, system metrics, and monitoring
- **Notification System**: Send alerts via email and in-app dashboard notifications
- **AI Task Execution**: Run LLM-powered automation tasks for text analysis, classification, and content generation
- **LLM-Assisted Workflow Builder**: Describe automations in plain English and let AI generate the configuration

## Architecture

### Technology Stack

- **Backend**: Node.js + Express + tRPC
- **Database**: MySQL/TiDB with Drizzle ORM
- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Event Bus**: In-memory pub/sub (production: Redis)
- **Job Queue**: In-process with scheduling (production: Bull MQ + Redis)
- **LLM Integration**: Built-in Manus LLM API

### Database Schema

#### Core Tables

- **webhooks**: Webhook endpoint configurations with HMAC secrets
- **events**: Log of all incoming events (webhooks, internal, blockchain, payments)
- **workflows**: Automation workflow definitions with triggers and actions
- **workflow_executions**: Execution history and results for each workflow run
- **background_jobs**: Queue of async tasks with status tracking and retry counts
- **notifications**: Admin notifications with read/unread status
- **integrations**: Third-party API credentials and configurations
- **system_metrics**: Platform metrics for monitoring and analytics

## API Endpoints

### Webhook Ingestion

```
POST /api/webhooks/:webhookId
Headers:
  Content-Type: application/json
  X-Webhook-Signature: <hmac-sha256-signature>

Body:
{
  "event": "user.created",
  "data": { ... }
}
```

### tRPC Procedures

#### Webhooks
- `webhooks.list()` - List all webhooks
- `webhooks.create(name, description)` - Create new webhook
- `webhooks.delete(id)` - Delete webhook
- `webhooks.getByEndpoint(endpoint)` - Get webhook by endpoint

#### Workflows
- `workflows.list()` - List all workflows
- `workflows.create(name, description, triggerType, triggerConfig, actions)` - Create workflow
- `workflows.delete(id)` - Delete workflow
- `workflows.getExecutions(workflowId)` - Get execution history
- `workflows.execute(id)` - Manually trigger workflow

#### Events
- `events.list(limit, offset)` - List events
- `events.getByType(eventType)` - Filter events by type
- `events.getStats()` - Get event statistics

#### Notifications
- `notifications.list()` - List notifications
- `notifications.markAsRead(id)` - Mark notification as read
- `notifications.delete(id)` - Delete notification

#### System
- `systemMetrics.getQueueStats()` - Get job queue statistics
- `systemMetrics.getEventBusStats()` - Get event bus statistics

## Workflow Definition Format

```typescript
interface Workflow {
  name: string;
  description: string;
  triggerType: 'webhook' | 'event' | 'schedule' | 'manual';
  triggerConfig: {
    eventType?: string;      // For 'event' trigger
    webhookId?: number;      // For 'webhook' trigger
    cronExpression?: string; // For 'schedule' trigger
  };
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
    value: any;
  }>;
  actions: Array<{
    id: string;
    type: 'email' | 'notification' | 'api_call' | 'ai_task' | 'webhook' | 'data_update';
    config: {
      // Action-specific configuration
      to?: string;           // For email
      subject?: string;      // For email
      body?: string;         // For email
      url?: string;          // For API/webhook
      method?: string;       // For API/webhook
      prompt?: string;       // For AI task
      table?: string;        // For data_update
      operation?: string;    // For data_update
    };
  }>;
}
```

## Usage Examples

### Example 1: User Signup Workflow

```javascript
const workflow = {
  name: "User Onboarding",
  description: "Send welcome email and create wallet on user signup",
  triggerType: "event",
  triggerConfig: { eventType: "user.created" },
  actions: [
    {
      id: "action_1",
      type: "email",
      config: {
        to: "{{user.email}}",
        subject: "Welcome to our platform",
        body: "Hi {{user.name}}, welcome!"
      }
    },
    {
      id: "action_2",
      type: "api_call",
      config: {
        url: "https://api.example.com/wallets",
        method: "POST",
        body: { userId: "{{user.id}}" }
      }
    },
    {
      id: "action_3",
      type: "notification",
      config: {
        userId: 1,
        title: "New user registered",
        content: "{{user.name}} just signed up",
        type: "info"
      }
    }
  ]
};
```

### Example 2: Payment Processing

```javascript
const workflow = {
  name: "Payment Confirmation",
  description: "Process payment and send confirmation",
  triggerType: "webhook",
  triggerConfig: { webhookId: 1 },
  conditions: [
    {
      field: "event",
      operator: "equals",
      value: "payment.completed"
    }
  ],
  actions: [
    {
      id: "action_1",
      type: "data_update",
      config: {
        table: "users",
        operation: "update",
        data: { balance: "{{user.balance + payment.amount}}" },
        conditions: { id: "{{user.id}}" }
      }
    },
    {
      id: "action_2",
      type: "email",
      config: {
        to: "{{user.email}}",
        subject: "Payment Received",
        body: "Payment of {{payment.amount}} received"
      }
    }
  ]
};
```

## Admin Dashboard

### Dashboard Pages

1. **Event Feed**: Real-time stream of all system events with filtering
2. **Workflows**: Manage workflow definitions, create, edit, delete
3. **Webhooks**: Generate webhook endpoints and manage secrets
4. **AI Builder**: Describe automations in plain English
5. **System Status**: Monitor queue depth, event throughput, metrics

### Navigation

- Dashboard: `/dashboard`
- Workflows: `/workflows`
- Webhooks: `/webhooks`
- AI Builder: `/ai-builder`

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check

# Build
pnpm build
```

### Project Structure

```
automation-infrastructure/
├── client/                 # React frontend
│   └── src/
│       ├── pages/         # Dashboard pages
│       ├── components/    # Reusable components
│       └── lib/           # tRPC client
├── server/                # Backend services
│   ├── eventBus.ts       # Event pub/sub
│   ├── webhookService.ts # Webhook handling
│   ├── workflowEngine.ts # Workflow execution
│   ├── jobQueue.ts       # Background jobs
│   ├── notificationService.ts
│   ├── aiTaskService.ts
│   ├── workflowBuilder.ts
│   ├── routers.ts        # tRPC procedures
│   └── db.ts             # Database helpers
├── drizzle/              # Database schema
└── shared/               # Shared types
```

## Testing

The project includes vitest tests for:
- Webhook signature verification
- Event bus pub/sub functionality
- Authentication flows

Run tests with:
```bash
pnpm test
```

## Deployment

The platform is built for Cloud Run with:
- Single Node.js process
- Stateless design
- Database-backed persistence
- In-memory event bus (upgrade to Redis for production)

### Production Considerations

1. **Event Bus**: Replace in-memory pub/sub with Redis Pub/Sub
2. **Job Queue**: Replace in-process queue with Bull MQ + Redis
3. **Email**: Integrate SendGrid, Mailgun, or similar
4. **Monitoring**: Set up logging and metrics collection
5. **Scaling**: Use Cloud Run auto-scaling and database connection pooling

## Security

- HMAC-SHA256 webhook signature verification
- JWT-based session authentication
- Role-based access control (admin/user)
- Environment variable secrets management
- HTTPS-only communication

## Monitoring

The platform provides metrics for:
- Queue depth and processing time
- Event throughput and latency
- Workflow success/failure rates
- System health and uptime

## Support

For issues or questions, refer to the reference projects:
- [Windmill](https://github.com/windmill-labs/windmill)
- [Activepieces](https://github.com/activepieces/activepieces)
- [Webhook](https://github.com/adnanh/webhook)

## License

MIT
