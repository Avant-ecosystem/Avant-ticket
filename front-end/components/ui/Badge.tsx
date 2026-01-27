// components/ui/Badge.tsx (versión simple)
import React from 'react';


export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg';
}

function Badge({ 
  className, 
  variant = 'default', 
  size = 'default',
  ...props 
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full font-semibold transition-colors';
  
  const variantStyles = {
    default: 'bg-blue-100 text-blue-800 border-transparent',
    secondary: 'bg-gray-100 text-gray-800 border-transparent',
    destructive: 'bg-red-100 text-red-800 border-transparent',
    outline: 'text-gray-800 border border-gray-300',
    success: 'bg-green-100 text-green-800 border-transparent',
    warning: 'bg-yellow-100 text-yellow-800 border-transparent',
  };
  
  const sizeStyles = {
    default: 'px-2.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant as keyof typeof variantStyles]} ${sizeStyles[size as keyof typeof sizeStyles] as string} ${className}`}
      {...props} 
    />
  );
}

export { Badge };