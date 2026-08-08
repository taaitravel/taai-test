import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Network, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BusinessMetricsDashboard } from '@/components/admin/BusinessMetricsDashboard';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen luxury-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Business metrics and financial analytics</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <button onClick={() => navigate('/internal/agents')} className="rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent/40">
            <div className="flex items-center gap-3"><Network className="h-5 w-5 text-primary" /><div><p className="font-semibold">Agent operations</p><p className="text-sm text-muted-foreground">Hermes routing, Tom lane, approvals, evidence, and execution journal</p></div></div>
          </button>
          <button onClick={() => navigate('/internal/tos')} className="rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent/40">
            <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><div><p className="font-semibold">Internal TOS</p><p className="text-sm text-muted-foreground">Directional architecture, component status, roles, and control rules</p></div></div>
          </button>
        </div>

        <BusinessMetricsDashboard />
      </div>
    </div>
  );
};

export default AdminDashboard;
