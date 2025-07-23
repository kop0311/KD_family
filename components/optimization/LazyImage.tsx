'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: 'blur' | 'empty' | React.ReactNode;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  placeholder = 'blur',
  blurDataURL,
  priority = false,
  quality = 80,
  fill = false,
  sizes,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate default blur data URL
  const defaultBlurDataURL = blurDataURL ||
    `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f1f5f9;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#gradient)" />
      </svg>`
    ).toString('base64')}`;

  // Placeholder component
  const PlaceholderComponent = () => {
    if (hasError) {
      return (
        <div className={clsx(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          fill ? 'absolute inset-0' : `w-[${width}px] h-[${height}px]`,
          className
        )}>
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      );
    }

    if (isLoading && placeholder === 'blur') {
      return (
        <div className={clsx(
          'animate-pulse bg-gray-200 loading-skeleton',
          fill ? 'absolute inset-0' : `w-[${width}px] h-[${height}px]`,
          className
        )} />
      );
    }

    if (React.isValidElement(placeholder)) {
      return placeholder;
    }

    return null;
  };

  return (
    <div
      ref={imgRef}
      className={clsx(
        'relative',
        fill ? 'w-full h-full' : '',
        className
      )}
    >
      {isInView ? (
        <>
          <Image
            src={src}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            fill={fill}
            sizes={sizes}
            quality={quality}
            priority={priority}
            placeholder={placeholder === 'blur' ? 'blur' : 'empty'}
            blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
            className={clsx(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
          {(isLoading || hasError) && <PlaceholderComponent />}
        </>
      ) : (
        <PlaceholderComponent />
      )}
    </div>
  );
};

// Optimized avatar component
interface AvatarProps {
  src?: string;
  alt: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  fallbackColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className,
  fallbackColor
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getFallbackColor = (name?: string) => {
    if (fallbackColor) return fallbackColor;

    if (!name) return 'bg-gray-500';

    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
    ];

    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={clsx(
      'relative inline-flex items-center justify-center',
      'rounded-full overflow-hidden flex-shrink-0',
      sizeClasses[size],
      !src && getFallbackColor(name),
      className
    )}>
      {src ? (
        <LazyImage
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 200px"
          className="object-cover"
        />
      ) : (
        <span className="font-semibold text-white">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};
