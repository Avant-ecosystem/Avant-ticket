// components/ui/Image.tsx
'use client';

import { useState } from 'react';


interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  onLoadingComplete?: () => void;
}

export function Image({
  src,
  alt,
  className,
  fill = false,
  sizes,
  priority = false,
  onLoadingComplete,
  ...props
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  const imageClasses = `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${fill ? 'absolute inset-0 w-full h-full' : ''} ${className}`;

  return (
    <div className={`relative ${fill ? 'relative w-full h-full' : ''}`}>
      {/* Placeholder mientras carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      {/* Imagen real */}
      <img
        src={error ? '/placeholder-image.jpg' : src}
        alt={alt}
        className={imageClasses}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">Imagen no disponible</p>
          </div>
        </div>
      )}
    </div>
  );
}