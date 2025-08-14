import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  height?: string;
}

interface ChartContainerState {
  hasError: boolean;
  error: Error | null;
}

class ChartErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  ChartContainerState
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChartContainerState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center p-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              Chart rendering error
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-spin', className)}>
    <RefreshCw className="w-5 h-5" />
  </div>
);

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  className,
  loading = false,
  error = null,
  onRetry,
  height = 'h-64',
}) => {
  const handleError = (error: Error) => {
    console.error(`Chart error in ${title}:`, error);
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {loading && (
              <LoadingSpinner className="text-blue-500 dark:text-blue-400" />
            )}
            {error && onRetry && (
              <button
                onClick={onRetry}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Retry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn('p-4', height)}>
        {error ? (
          <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-center p-4">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                Failed to load chart
              </p>
              <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                {error}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 text-xs rounded-md transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LoadingSpinner className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Loading chart...
              </p>
            </div>
          </div>
        ) : (
          <ChartErrorBoundary onError={handleError}>
            <div className="w-full h-full">
              {children}
            </div>
          </ChartErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;