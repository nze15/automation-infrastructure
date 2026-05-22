# API Documentation

## Overview

The Internal Automation Infrastructure provides two main API interfaces:

1. **Webhook Ingestion API**: HTTP endpoints for receiving events
2. **tRPC API**: Type-safe RPC procedures for admin operations

## Webhook Ingestion API

### Base URL

```
POST /api/webhooks/:webhookId
```

### Authentication

Webhooks are authenticated using HMAC-SHA256 signatures:

```
X-Webhook-Signature: sha256=<signature>
```

The signature is computed as:
```
HMAC-SHA256(secret, request_body)
```

### Request Headers

```
Content-Type: application/json
X-Webhook-Signature: sha256=<hmac-sha256-signature>
```

### Request Body

```json
{
  "event": "event.type",
  "data": {
    "key": "value"
  }
}
```

### Response

**Success (200)**
```json
{
  "success": true,
  "eventId": 123
}
```

**Error (400)**
```json
{
  "success": false,
  "error": "Invalid signature"
}
```

### Example

```bash
# Generate signature
SECRET="your-webhook-secret"
BODY='{"event":"user.created","data":{"userId":123}}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send webhook
curl -X POST https://api.example.com/api/webhooks/abc123 \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIGNATURE" \
  -d "$BODY"
```

## tRPC API

### Base URL

```
POST /api/trpc/<procedure>
```

### Authentication

tRPC calls include session cookies automatically. Use Manus OAuth for authentication.

### Webhooks Router

#### List Webhooks

```typescript
trpc.webhooks.list.useQuery()
```

**Response**
```typescript
Array<{
  id: number;
  name: string;
  description: string;
  endpoint: string;
  secret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### Create Webhook

```typescript
trpc.webhooks.create.useMutation({
  name: string;
  description: string;
})
```

**Response**
```typescript
{
  id: number;
  endpoint: string;
  secret: string;
}
```

#### Delete Webhook

```typescript
trpc.webhooks.delete.useMutation({
  id: number;
})
```

### Workflows Router

#### List Workflows

```typescript
trpc.workflows.list.useQuery()
```

**Response**
```typescript
Array<{
  id: number;
  name: string;
  description: string;
  triggerType: 'webhook' | 'event' | 'schedule' | 'manual';
  triggerConfig: Record<string, any>;
  actions: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
  }>;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### Create Workflow

```typescript
trpc.workflows.create.useMutation({
  name: string;
  description: string;
  triggerType: 'webhook' | 'event' | 'schedule' | 'manual';
  triggerConfig: Record<string, any>;
  actions: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
  }>;
})
```

#### Delete Workflow

```typescript
trpc.workflows.delete.useMutation({
  id: number;
})
```

#### Get Workflow Executions

```typescript
trpc.workflows.getExecutions.useQuery({
  workflowId: number;
})
```

**Response**
```typescript
Array<{
  id: number;
  workflowId: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  result: Record<string, any>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}>
```

#### Execute Workflow

```typescript
trpc.workflows.execute.useMutation({
  id: number;
  data?: Record<string, any>;
})
```

### Events Router

#### List Events

```typescript
trpc.events.list.useQuery({
  limit: number;
  offset: number;
})
```

**Response**
```typescript
Array<{
  id: number;
  eventType: string;
  source: string;
  payload: Record<string, any>;
  status: 'received' | 'processed' | 'failed';
  createdAt: Date;
}>
```

#### Get Events by Type

```typescript
trpc.events.getByType.useQuery({
  eventType: string;
})
```

#### Get Event Statistics

```typescript
trpc.events.getStats.useQuery()
```

**Response**
```typescript
{
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  averageProcessingTime: number;
}
```

### Notifications Router

#### List Notifications

```typescript
trpc.notifications.list.useQuery()
```

**Response**
```typescript
Array<{
  id: number;
  userId: number;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
}>
```

#### Mark as Read

```typescript
trpc.notifications.markAsRead.useMutation({
  id: number;
})
```

#### Delete Notification

```typescript
trpc.notifications.delete.useMutation({
  id: number;
})
```

### System Metrics Router

#### Get Queue Statistics

```typescript
trpc.systemMetrics.getQueueStats.useQuery()
```

**Response**
```typescript
{
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  averageProcessingTime: number;
}
```

#### Get Event Bus Statistics

```typescript
trpc.systemMetrics.getEventBusStats.useQuery()
```

**Response**
```typescript
{
  eventTypes: string[];
  listenerCount: number;
  eventHistorySize: number;
}
```

## Error Handling

### tRPC Errors

tRPC returns errors with standard HTTP status codes:

```typescript
{
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR';
  message: string;
}
```

### Webhook Errors

Webhook ingestion returns specific error messages:

```json
{
  "success": false,
  "error": "Invalid signature" | "Webhook not found" | "Invalid JSON"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Production deployments should add:
- Per-webhook rate limits
- Per-user API rate limits
- Queue depth monitoring

## Pagination

List endpoints support pagination:

```typescript
{
  limit: number;  // Default: 50, Max: 1000
  offset: number; // Default: 0
}
```

## Filtering

Event list supports filtering:

```typescript
trpc.events.list.useQuery({
  limit: 50;
  offset: 0;
  eventType?: string;
  source?: string;
  status?: string;
})
```

## Sorting

Results are sorted by creation date (newest first) by default.

## Batch Operations

For bulk operations, use:

```typescript
// Create multiple workflows
await Promise.all(
  workflows.map(w => trpc.workflows.create.mutate(w))
);
```

## Webhooks Best Practices

1. **Verify Signatures**: Always verify HMAC-SHA256 signatures
2. **Idempotency**: Design workflows to be idempotent
3. **Retry Logic**: Implement exponential backoff for retries
4. **Logging**: Log all webhook events for debugging
5. **Timeouts**: Set appropriate timeouts for webhook processing

## Rate Limiting Best Practices

1. Implement per-webhook rate limiting
2. Monitor queue depth
3. Set up alerts for high queue depth
4. Implement circuit breakers for failing actions
5. Use exponential backoff for retries
