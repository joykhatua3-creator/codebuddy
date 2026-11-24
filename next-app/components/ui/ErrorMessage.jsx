'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
    <AlertCircle className="text-red-500" size={32} />
    <p className="text-red-700 text-sm font-medium">{message || 'Something went wrong'}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-secondary btn-sm gap-1">
        <RefreshCw size={14} /> Retry
      </button>
    )}
  </div>
);

export default ErrorMessage;
