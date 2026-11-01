import React from 'react';

export default function ResultSkeleton({ className = '' }) {
  return (
    <div
      className={`w-full max-w-sm rounded-3xl p-5 border border-gray-200 bg-white space-y-4 animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="flex justify-between items-center">
        <div className="h-6 w-28 bg-gray-200 rounded-full" />
        <div className="h-6 w-20 bg-gray-200 rounded-md" />
      </div>

      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-32 bg-gray-100 rounded-md" />
      </div>

      <div className="h-20 w-full bg-gray-100 rounded-2xl" />

      <div className="space-y-2 pt-2">
        <div className="h-4 w-24 bg-gray-200 rounded-md" />
        <div className="h-3 w-full bg-gray-100 rounded-md" />
        <div className="h-3 w-5/6 bg-gray-100 rounded-md" />
      </div>

      <div className="h-16 w-full bg-leaf-100/50 rounded-2xl" />
    </div>
  );
}
