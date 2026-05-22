import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function Workflows() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'event' as const,
  });

  // Queries
  const workflowsQuery = trpc.workflows.list.useQuery();
  const createWorkflowMutation = trpc.workflows.create.useMutation({
    onSuccess: () => {
      toast.success('Workflow created successfully');
      workflowsQuery.refetch();
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', triggerType: 'event' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create workflow');
    },
  });

  const deleteWorkflowMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      toast.success('Workflow deleted');
      workflowsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete workflow');
    },
  });

  const workflows = workflowsQuery.data || [];

  const handleCreateWorkflow = async () => {
    if (!formData.name.trim()) {
      toast.error('Workflow name is required');
      return;
    }

    await createWorkflowMutation.mutateAsync({
      name: formData.name,
      description: formData.description,
      triggerType: formData.triggerType,
      triggerConfig: {},
      actions: [],
    });
  };

  const handleDeleteWorkflow = (id: number) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflowMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-gray-600 mt-1">Create and manage automation workflows</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Set up a new automation workflow with triggers and actions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Send welcome email on user signup"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this workflow does..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="trigger">Trigger Type</Label>
                <Select value={formData.triggerType} onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}>
                  <SelectTrigger id="trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateWorkflow}
                disabled={createWorkflowMutation.isPending}
                className="w-full"
              >
                {createWorkflowMutation.isPending ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4">
        {workflowsQuery.isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Loading workflows...
            </CardContent>
          </Card>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No workflows yet. Create one to get started!
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow: any) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{workflow.name}</CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                  <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Trigger Type</p>
                    <p className="font-mono text-sm">{workflow.triggerType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Actions</p>
                    <p className="font-mono text-sm">{(workflow.actions || []).length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm">{new Date(workflow.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className="text-sm">{new Date(workflow.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    disabled={deleteWorkflowMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
