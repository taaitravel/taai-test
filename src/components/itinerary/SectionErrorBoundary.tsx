import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SectionErrorBoundaryProps {
  title: string;
  message: string;
  children: ReactNode;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

/**
 * Keeps one trip section from blanking the whole page. If the section fails to
 * render we show a plain explanation plus a way forward instead of nothing.
 */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Trip section failed to render:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Card className="bg-card/80 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            {this.props.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{this.props.message}</p>
          <Button asChild size="sm" className="gold-gradient text-background hover:opacity-90">
            <Link to="/search"><Search className="mr-2 h-4 w-4" />Book now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
}
