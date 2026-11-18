import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#1E171D] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-8 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#B5727B] font-semibold">
              Application Recovery
            </p>
            <h1 className="font-display text-3xl font-semibold text-[#1E171D]">
              Something interrupted your session
            </h1>
            <p className="text-sm text-[#5A4A57] leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium rounded-lg hover:bg-[#36132C] transition-colors"
            >
              Reload NRITYA
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
