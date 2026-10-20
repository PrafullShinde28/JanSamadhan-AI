import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin dashboard component crash:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50/40 border border-red-200 rounded-card p-5 text-center space-y-3 w-full min-w-0">
          <AlertCircle className="w-8 h-8 text-danger mx-auto animate-pulse" />
          <h4 className="text-xs font-bold text-slate-805">Dashboard Widget Offline</h4>
          <p className="text-[10px] text-slate-455 max-w-xs mx-auto leading-normal">
            This analytical chart or listing widget failed to render. Let's try reloading the block.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] px-3 py-1.5 rounded-button shadow-sm transition uppercase tracking-wider cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary shrink-0 animate-spin-slow" />
            <span>Reload Widget</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
