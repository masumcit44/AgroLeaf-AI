import React from 'react';

export default function PageContainer({ children, className = '' }) {
  return (
    <main className={`w-full max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-6 flex-1 flex flex-col min-w-0 ${className}`}>
      {children}
    </main>
  );
}
