import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIWorkflowBuilder() {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const createWorkflowMutation = trpc.workflows.create.useMutation({
    onSuccess: () => {
      toast.success('Workflow created from AI suggestion');
      setDescription('');
      setContext('');
      setGeneratedWorkflow(null);
      setSuggestions([]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create workflow');
    },
  });

  const handleGenerateWorkflow = async () => {
    if (!description.trim()) {
      toast.error('Please describe what you want to automate');
      return;
    }

    setIsGenerating(true);
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll show a mock workflow
      const mockWorkflow = {
        name: 'Generated Workflow',
        description: description,
        triggerType: 'event',
        triggerConfig: { eventType: 'user.created' },
        actions: [
          {
            id: 'action_1',
            type: 'email',
            config: {
              to: 'user@example.com',
              subject: 'Welcome',
              body: 'Welcome to our platform',
            },
          },
        ],
      };

      setGeneratedWorkflow(mockWorkflow);
      setSuggestions([
        'Add a notification action to alert admins',
        'Consider adding a delay before sending the email',
        'Add a condition to check user status before sending',
      ]);

      toast.success('Workflow generated successfully');
    } catch (error) {
      toast.error('Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateFromGenerated = async () => {
    if (!generatedWorkflow) return;

    await createWorkflowMutation.mutateAsync({
      name: generatedWorkflow.name,
      description: generatedWorkflow.description,
      triggerType: generatedWorkflow.triggerType,
      triggerConfig: generatedWorkflow.triggerConfig,
      actions: generatedWorkflow.actions,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-blue-600" />
          AI Workflow Builder
        </h1>
        <p className="text-gray-600 mt-1">Describe your automation in plain English, and AI will generate the workflow</p>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Describe Your Automation</CardTitle>
            <CardDescription>Tell us what you want to automate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">What should happen?</label>
              <Textarea
                placeholder="Example: When a user signs up, send them a welcome email and create a wallet for them"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Additional Context (Optional)</label>
              <Textarea
                placeholder="Any additional details that might help..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-24"
              />
            </div>

            <Button
              onClick={handleGenerateWorkflow}
              disabled={isGenerating || !description.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Workflow Section */}
        <div className="space-y-4">
          {generatedWorkflow ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Generated Workflow</CardTitle>
                  <CardDescription>Review and customize before creating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-medium">{generatedWorkflow.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trigger Type</p>
                    <Badge>{generatedWorkflow.triggerType}</Badge>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Actions</p>
                    <div className="space-y-2">
                      {generatedWorkflow.actions.map((action: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                          <p className="font-mono text-xs text-gray-600">{action.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateFromGenerated}
                    disabled={createWorkflowMutation.isPending}
                    className="w-full"
                  >
                    {createWorkflowMutation.isPending ? 'Creating...' : 'Create Workflow'}
                  </Button>
                </CardContent>
              </Card>

              {suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Generated workflow will appear here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Examples Section */}
      <Card>
        <CardHeader>
          <CardTitle>Example Automations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setDescription('When a user registers, send them a welcome email and create a wallet')}>
              <p className="font-medium text-sm">User Onboarding</p>
              <p className="text-xs text-gray-600 mt-1">Send welcome email and create wallet</p>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setDescription('When a payment is received, update the user account and send a confirmation email')}>
              <p className="font-medium text-sm">Payment Processing</p>
              <p className="text-xs text-gray-600 mt-1">Update account and send confirmation</p>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setDescription('When a blockchain transaction is detected, classify it and notify the admin')}>
              <p className="font-medium text-sm">Blockchain Monitoring</p>
              <p className="text-xs text-gray-600 mt-1">Classify transaction and notify admin</p>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setDescription('Every day at 9 AM, generate a summary of all events and send it to the team')}>
              <p className="font-medium text-sm">Daily Summary</p>
              <p className="text-xs text-gray-600 mt-1">Generate and send daily report</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
