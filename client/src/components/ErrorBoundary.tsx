import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorMessage } from './ErrorMessage';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '@shared/types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

class ErrorBoundaryClass extends Component<Props & { userRole?: UserRole }, State> {
  constructor(props: Props & { userRole?: UserRole }) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you might want to log this to an error tracking service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error.message.includes('NetworkError') || 
                            this.state.error.message.includes('fetch');
      
      const isPermissionError = this.state.error.message.includes('403') || 
                               this.state.error.message.includes('Unauthorized');

      let errorCode = 'UNKNOWN_ERROR';
      let title = 'Ein Fehler ist aufgetreten';
      let message = 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.';

      if (isNetworkError) {
        errorCode = 'NETWORK_ERROR';
        title = 'Verbindungsproblem';
        message = 'Es konnte keine Verbindung zum Server hergestellt werden. Prüfen Sie Ihre Internetverbindung.';
      } else if (isPermissionError) {
        errorCode = 'PERMISSION_DENIED';
        title = 'Keine Berechtigung';
        message = 'Sie haben keine Berechtigung für diese Aktion.';
      }

      const actions = [
        {
          label: 'Erneut versuchen',
          onClick: this.handleRetry,
          variant: 'primary' as const,
        },
      ];

      // Add reload action if retry has been attempted multiple times
      if (this.state.retryCount >= 2) {
        actions.push({
          label: 'Seite neu laden',
          onClick: this.handleReload,
          variant: 'primary' as const,
        });
      }

      return (
        <div className="min-h-screen bg-kore-bg flex items-center justify-center p-lg">
          <div className="max-w-lg w-full">
            <ErrorMessage
              type="error"
              title={title}
              message={message}
              details={`${this.state.error.message}\n\nStack:\n${this.state.error.stack}`}
              actions={actions}
              userRole={this.props.userRole}
              errorCode={errorCode}
              timestamp={new Date().toISOString()}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to inject user role from auth store
export function ErrorBoundary(props: Props) {
  const { user } = useAuthStore();
  return <ErrorBoundaryClass {...props} userRole={user?.role} />;
}