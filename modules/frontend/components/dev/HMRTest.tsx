'use client';

import { useState } from 'react';

export function HMRTest() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 bg-blue-100 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">
        HMR Test Component
      </h3>
      <p className="text-blue-700 mb-4">
        This component tests Hot Module Replacement. Try editing this text and save the file.
        The changes should appear instantly without losing the counter state.
      </p>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setCount(count - 1)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          -
        </button>
        <span className="text-xl font-bold text-blue-900">
          Count: {count}
        </span>
        <button
          onClick={() => setCount(count + 1)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          +
        </button>
      </div>
      <p className="text-sm text-blue-600 mt-2">
        ✅ HMR is working if this component updates without resetting the counter
      </p>
    </div>
  );
}
