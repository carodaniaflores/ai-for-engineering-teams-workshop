'use client';

import { Suspense, useState } from 'react';
import MarketIntelligenceWidget from '../components/MarketIntelligenceWidget';
import HealthIndicator from '../components/HealthIndicator';
import AlertsPanel from '../components/AlertsPanel';
import CustomerHealthDisplay from '../components/CustomerHealthDisplay';
import PredictiveIntelligencePanel from '../components/PredictiveIntelligencePanel';
import { Alert } from '../lib/alerts';
import { mockCustomers } from '../data/mock-customers';

// Dynamic component imports with error boundaries
const CustomerCardDemo = () => {
  try {
    // Try to import CustomerCard - this will work after Exercise 3
    const CustomerCard = require('../components/CustomerCard')?.default;
    const customers = require('../data/mock-customers')?.mockCustomers;

    if (CustomerCard && customers?.length > 0) {
      return (
        <div className="space-y-4">
          <p className="text-green-600 text-sm font-medium">✅ CustomerCard implemented!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customers.map((customer: { id: string }) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        </div>
      );
    }
  } catch (error) {
    // Component doesn't exist yet
  }

  return (
    <div className="text-gray-500 text-sm">
      After Exercise 3, your CustomerCard components will appear here showing customer information with health scores.
    </div>
  );
};

const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    customerId: '2',
    type: 'engagement_cliff',
    priority: 'high',
    message: 'Globex Industries login frequency has dropped 60% over the last 14 days.',
    triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dismissed: false,
  },
  {
    id: 'alert-2',
    customerId: '3',
    type: 'contract_expiration',
    priority: 'medium',
    message: 'Initech Solutions contract renews in 28 days with unresolved health concerns.',
    triggeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    dismissed: false,
  },
  {
    id: 'alert-3',
    customerId: '1',
    type: 'payment_risk',
    priority: 'high',
    message: 'Acme Corp payment is 12 days overdue with $4,200 outstanding.',
    triggeredAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    dismissed: false,
  },
];

export default function Home() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [selectedCustomer, setSelectedCustomer] = useState(mockCustomers[0]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Customer Intelligence Dashboard
        </h1>
        <p className="text-gray-600">
          AI for Engineering Teams Workshop - Your Progress
        </p>
      </header>

      {/* Progress Indicator */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Workshop Progress</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>✅ Setup Complete - Next.js app is running</p>
          <p>✅ Exercise 3: CustomerCard component</p>
          <p>✅ Exercise 4: CustomerSelector integration</p>
          <p>✅ Exercise 5: Domain Health widget</p>
          <p>✅ Exercise 9: Production-ready features</p>
        </div>
      </div>

      {/* Component Showcase Area */}
      <div className="space-y-8">
        {/* CustomerCard Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">CustomerCard Component</h3>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <CustomerCardDemo />
          </Suspense>
        </section>

        {/* Dashboard Widgets Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Dashboard Widgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Health Score Widget */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Health Score</h3>
              <div className="space-y-3">
                {[15, 45, 85].map((score) => (
                  <HealthIndicator key={score} score={score} />
                ))}
              </div>
            </div>

            {/* Market Intelligence Widget */}
            <MarketIntelligenceWidget />

            {/* Alerts Panel */}
            <AlertsPanel
              alerts={alerts}
              onAlertsChange={setAlerts}
            />
          </div>
        </section>

        {/* Customer Intelligence Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Intelligence</h3>

          {/* Customer selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
            <div className="flex flex-wrap gap-2">
              {mockCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCustomer.id === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Health Display */}
            <CustomerHealthDisplay
              healthResult={{
                overall: selectedCustomer.healthScore,
                riskLevel:
                  selectedCustomer.healthScore >= 71
                    ? 'healthy'
                    : selectedCustomer.healthScore >= 31
                    ? 'warning'
                    : 'critical',
                breakdown: {
                  payment: Math.min(100, selectedCustomer.healthScore + 5),
                  engagement: Math.max(0, selectedCustomer.healthScore - 5),
                  contract: selectedCustomer.healthScore,
                  support: Math.min(100, selectedCustomer.healthScore + 10),
                },
              }}
              customerName={selectedCustomer.name}
            />

            {/* Predictive Intelligence Panel */}
            <PredictiveIntelligencePanel customer={selectedCustomer} />
          </div>
        </section>

        {/* Getting Started */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Start Building?</h3>
          <p className="text-blue-800 mb-4">
            Follow along with the workshop exercises to see this dashboard come to life with AI-generated components.
          </p>
          <div className="text-sm text-blue-700">
            <p className="mb-1"><strong>Next:</strong> Exercise 1 - Create your first specification</p>
            <p className="mb-1"><strong>Then:</strong> Exercise 3 - Generate your first component</p>
            <p className="text-xs text-blue-600">💡 Tip: Refresh this page after completing exercises to see your progress!</p>
          </div>
        </section>
      </div>
    </div>
  );
}
