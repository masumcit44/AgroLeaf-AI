import React from 'react';

export default function PageContainer({ children, className = '' }) {
  return (
    <main className={`w-full max-w-lg mx-auto px-4 py-6 flex-1 flex flex-col ${className}`}>
      {children}
    </main>
  );
}
