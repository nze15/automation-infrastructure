import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Webhooks() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Queries
  const webhooksQuery = trpc.webhooks.list.useQuery();
  const createWebhookMutation = trpc.webhooks.create.useMutation({
    onSuccess: () => {
      toast.success('Webhook created successfully');
      webhooksQuery.refetch();
      setIsCreateOpen(false);
      setFormData({ name: '', description: '' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create webhook');
    },
  });

  const deleteWebhookMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      toast.success('Webhook deleted');
      webhooksQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete webhook');
    },
  });

  const webhooks = webhooksQuery.data || [];

  const handleCreateWebhook = async () => {
    if (!formData.name.trim()) {
      toast.error('Webhook name is required');
      return;
    }

    await createWebhookMutation.mutateAsync({
      name: formData.name,
      description: formData.description,
    });
  };

  const handleDeleteWebhook = (id: number) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      deleteWebhookMutation.mutate({ id });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-gray-600 mt-1">Receive events from external sources</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Generate a new webhook endpoint to receive events
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Webhook Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Stripe Events"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this webhook..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <Button
                onClick={handleCreateWebhook}
                disabled={createWebhookMutation.isPending}
                className="w-full"
              >
                {createWebhookMutation.isPending ? 'Creating...' : 'Create Webhook'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      <div className="grid gap-4">
        {webhooksQuery.isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Loading webhooks...
            </CardContent>
          </Card>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No webhooks yet. Create one to start receiving events!
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook: any) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{webhook.name}</CardTitle>
                    <CardDescription>{webhook.description}</CardDescription>
                  </div>
                  <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                    {webhook.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Endpoint */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Webhook Endpoint</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 p-2 rounded text-xs font-mono break-all">
                      {webhook.endpoint}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhook.endpoint)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Secret */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Secret Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 p-2 rounded text-xs font-mono break-all">
                      {showSecrets[webhook.id] ? webhook.secret : '••••••••••••••••'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecrets({ ...showSecrets, [webhook.id]: !showSecrets[webhook.id] })}
                    >
                      {showSecrets[webhook.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhook.secret)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm">{new Date(webhook.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className="text-sm">{new Date(webhook.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      disabled={deleteWebhookMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Sending Events</h3>
            <p className="text-sm text-gray-600 mb-2">
              POST your events to the webhook endpoint with an HMAC-SHA256 signature:
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`curl -X POST https://api.example.com/api/webhooks/abc123 \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: <hmac-sha256-signature>" \\
  -d '{"event": "user.created", "userId": 123}'`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
