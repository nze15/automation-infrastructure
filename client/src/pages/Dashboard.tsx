import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data
  const eventsQuery = trpc.events.list.useQuery({ limit: 50, offset: 0 });
  const queueStatsQuery = trpc.systemMetrics.getQueueStats.useQuery();
  const eventBusStatsQuery = trpc.systemMetrics.getEventBusStats.useQuery();

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      eventsQuery.refetch();
      queueStatsQuery.refetch();
      eventBusStatsQuery.refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, eventsQuery, queueStatsQuery, eventBusStatsQuery]);

  const events = eventsQuery.data || [];
  const queueStats = queueStatsQuery.data;
  const eventBusStats = eventBusStatsQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'received':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
      case 'running':
        return <Activity className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'received':
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automation Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}</p>
        </div>
        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Queue Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.queuedCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Queued jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.processingCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventBusStats?.eventTypes.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active listeners</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Event Feed</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Event Feed Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Real-time event stream from all sources</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsQuery.isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No events yet</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {events.map((event: any) => (
                    <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getStatusIcon(event.status)}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{event.eventType}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Source: <span className="font-mono">{event.source}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(event.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>Manage your automation workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Workflow management coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Platform health and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-2">Event Bus</h3>
                <div className="text-sm text-gray-600">
                  <p>Active event types: {eventBusStats?.eventTypes.length || 0}</p>
                  {eventBusStats?.eventTypes.slice(0, 5).map((type: string) => (
                    <div key={type} className="text-xs text-gray-500 ml-2 mt-1">
                      • {type}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
