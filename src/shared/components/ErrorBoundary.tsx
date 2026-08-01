/**
 * ErrorBoundary — Generic error boundary wrapper
 *
 * Catches JavaScript errors in child component tree and displays
 * a styled error fallback with a retry button.
 * Extracted from Occupieds page and generalized for app-wide use.
 *
 * @example
 *   <ErrorBoundary module="Task Board">
 *     <Tasks />
 *   </ErrorBoundary>
 */
import { Component, type ReactNode } from 'react';
import { logger } from '../lib/logger';

interface ErrorBoundaryProps {
  /** Display name of the module (shown in error message) */
  module?: string;
  /** Child components to wrap */
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(
      'ErrorBoundary',
      `Error in ${this.props.module || 'unknown module'}`,
      { error: error.message, componentStack: errorInfo.componentStack }
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-8 bg-zinc-900 border border-red-500/30 rounded-xl max-w-md">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-200 mb-2">Something went wrong</h2>
            <p className="text-zinc-400 text-sm mb-4">
              {this.props.module
                ? `The ${this.props.module} encountered an error.`
                : 'An unexpected error occurred.'}
            </p>
            <p className="text-red-400/70 text-xs font-mono mb-4 break-all">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
