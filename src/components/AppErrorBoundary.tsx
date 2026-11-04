import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

/**
 * Last-resort boundary for render crashes (including a dashboard with a large
 * trip history). Logs the error and the component stack, then offers a reload
 * instead of leaving a blank screen.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("app encountered an error", {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">This page ran into a problem</h1>
          <p className="text-sm text-muted-foreground">
            The error was recorded. Reload the page to try again.
          </p>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
