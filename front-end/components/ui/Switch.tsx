import * as React from 'react';

export function Switch({ checked, onCheckedChange, ...props }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors ${
        checked 
          ? 'border-gray-900 bg-gray-900' 
          : 'border-gray-300 bg-transparent'
      }`}
      {...props}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
