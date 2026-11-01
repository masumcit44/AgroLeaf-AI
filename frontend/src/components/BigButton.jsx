import React from 'react';

export default function BigButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  note = null,
  icon = null,
  type = 'button',
  className = '',
  ariaLabel,
}) {
  const isPrimary = variant === 'primary';

  return (
    <div className="w-full flex flex-col items-center">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`w-full min-h-[56px] px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-sm transition-all duration-150 ${
          disabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
            : isPrimary
            ? 'bg-leaf-700 text-white hover:bg-leaf-700/90 active:scale-[0.99] cursor-pointer'
            : 'bg-white text-ink border border-gray-300 hover:bg-gray-50 active:scale-[0.99] cursor-pointer'
        } ${className}`}
      >
        {icon && <span className="text-2xl">{icon}</span>}
        <span>{children}</span>
      </button>
      {note && (
        <span className="text-xs text-amber-600 font-medium mt-1.5 text-center">
          {note}
        </span>
      )}
    </div>
  );
}
