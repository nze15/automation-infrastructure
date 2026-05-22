import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { 
  Zap, 
  Webhook, 
  Workflow, 
  Bell, 
  Brain, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Sparkles
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg">Automation Infrastructure</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto px-4 py-20 flex flex-col justify-center">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium">
              Event-Driven Automation
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
            Build Powerful Automations
            <br />
            <span className="text-blue-600">Without Code</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect your apps, process events in real-time, and automate complex workflows across your entire infrastructure. From webhooks to AI tasks, all in one platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/windmill-labs/windmill" target="_blank" rel="noopener noreferrer">
                View Documentation
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Webhook className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Webhook Ingestion</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Receive events from frontend apps, payment processors, blockchain listeners, and external APIs with secure HMAC-SHA256 signatures.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Workflow className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Workflow Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Define trigger → process → action pipelines. Execute complex automations with conditional logic and data transformations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Send alerts via email and in-app dashboard. Keep your team informed of critical events and workflow outcomes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>AI Task Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Run LLM-powered automation tasks for text analysis, classification, and content generation as workflow actions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Real-Time Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor event throughput, queue depth, workflow success rates, and system health in real-time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>LLM-Assisted Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Describe your automation in plain English and let AI generate the workflow configuration automatically.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Built for Modern Systems</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">SaaS Applications</h3>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>User registration workflows</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Payment processing automation</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Email notification pipelines</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Web3 & Blockchain</h3>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Smart contract event listeners</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Wallet creation automation</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Transaction tracking & alerts</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">AI Applications</h3>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Content analysis & classification</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Automated content generation</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Intelligent routing & decisions</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Data Integration</h3>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Real-time data synchronization</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>API integration pipelines</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Third-party service connections</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate?</h2>
          <p className="text-lg mb-8 opacity-90">
            Start building event-driven automations in minutes. No credit card required.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href={getLoginUrl()}>
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 Automation Infrastructure. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
