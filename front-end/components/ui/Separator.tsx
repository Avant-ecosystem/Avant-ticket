'use client';

export function Separator({ className, orientation = 'horizontal', ...props }) {
  return (
    <div
      className={`
        ${orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'}
        bg-gray-200
        ${className || ''}
      `}
      {...props}
    />
  );
}
