'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

// Responsive grid system
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  } | number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap = 4,
  className
}) => {
  const gapValue = typeof gap === 'number' ? gap : 4;
  const gapClasses = typeof gap === 'object' ? gap : {};

  const colClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`
  ].filter(Boolean);

  const gapClassList = typeof gap === 'object' ? [
    gapClasses.xs && `gap-${gapClasses.xs}`,
    gapClasses.sm && `sm:gap-${gapClasses.sm}`,
    gapClasses.md && `md:gap-${gapClasses.md}`,
    gapClasses.lg && `lg:gap-${gapClasses.lg}`,
    gapClasses.xl && `xl:gap-${gapClasses.xl}`,
    gapClasses['2xl'] && `2xl:gap-${gapClasses['2xl']}`
  ].filter(Boolean) : [`gap-${gapValue}`];

  return (
    <div className={clsx('grid', colClasses, gapClassList, className)}>
      {children}
    </div>
  );
};

// Responsive container with breakpoint-aware padding
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  padding?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  } | number;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = '7xl',
  padding = { xs: 4, sm: 6, lg: 8 },
  className
}) => {
  const maxWidthClass = maxWidth === 'full' ? 'max-w-full' : `max-w-${maxWidth}`;

  const paddingClasses = typeof padding === 'object' ? [
    padding.xs && `px-${padding.xs}`,
    padding.sm && `sm:px-${padding.sm}`,
    padding.md && `md:px-${padding.md}`,
    padding.lg && `lg:px-${padding.lg}`,
    padding.xl && `xl:px-${padding.xl}`,
    padding['2xl'] && `2xl:px-${padding['2xl']}`
  ].filter(Boolean) : [`px-${padding}`];

  return (
    <div className={clsx('mx-auto', maxWidthClass, paddingClasses, className)}>
      {children}
    </div>
  );
};

// Breakpoint hook
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('xs');
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });

      // Determine current breakpoint
      let current: Breakpoint = 'xs';
      for (const [breakpoint, minWidth] of Object.entries(breakpoints)) {
        if (width >= minWidth) {
          current = breakpoint as Breakpoint;
        }
      }
      setCurrentBreakpoint(current);
    };

    // Set initial values
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isBreakpoint = (breakpoint: Breakpoint) => currentBreakpoint === breakpoint;
  const isBreakpointUp = (breakpoint: Breakpoint) =>
    windowSize.width >= breakpoints[breakpoint];
  const isBreakpointDown = (breakpoint: Breakpoint) =>
    windowSize.width < breakpoints[breakpoint];

  return {
    currentBreakpoint,
    windowSize,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isMobile: isBreakpointDown('md'),
    isTablet: isBreakpointUp('md') && isBreakpointDown('lg'),
    isDesktop: isBreakpointUp('lg')
  };
};

// Responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    xs?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    xl?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    '2xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  };
  weight?: {
    xs?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    sm?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    md?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    lg?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    xl?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    '2xl'?: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  };
  align?: {
    xs?: 'left' | 'center' | 'right' | 'justify';
    sm?: 'left' | 'center' | 'right' | 'justify';
    md?: 'left' | 'center' | 'right' | 'justify';
    lg?: 'left' | 'center' | 'right' | 'justify';
    xl?: 'left' | 'center' | 'right' | 'justify';
    '2xl'?: 'left' | 'center' | 'right' | 'justify';
  };
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { xs: 'base', lg: 'lg' },
  weight,
  align,
  as: Component = 'p',
  className
}) => {
  const sizeClasses = [
    size.xs && `text-${size.xs}`,
    size.sm && `sm:text-${size.sm}`,
    size.md && `md:text-${size.md}`,
    size.lg && `lg:text-${size.lg}`,
    size.xl && `xl:text-${size.xl}`,
    size['2xl'] && `2xl:text-${size['2xl']}`
  ].filter(Boolean);

  const weightClasses = weight ? [
    weight.xs && `font-${weight.xs}`,
    weight.sm && `sm:font-${weight.sm}`,
    weight.md && `md:font-${weight.md}`,
    weight.lg && `lg:font-${weight.lg}`,
    weight.xl && `xl:font-${weight.xl}`,
    weight['2xl'] && `2xl:font-${weight['2xl']}`
  ].filter(Boolean) : [];

  const alignClasses = align ? [
    align.xs && `text-${align.xs}`,
    align.sm && `sm:text-${align.sm}`,
    align.md && `md:text-${align.md}`,
    align.lg && `lg:text-${align.lg}`,
    align.xl && `xl:text-${align.xl}`,
    align['2xl'] && `2xl:text-${align['2xl']}`
  ].filter(Boolean) : [];

  return (
    <Component className={clsx(sizeClasses, weightClasses, alignClasses, className)}>
      {children}
    </Component>
  );
};

// Responsive image component
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: {
    xs?: { width: number; height: number };
    sm?: { width: number; height: number };
    md?: { width: number; height: number };
    lg?: { width: number; height: number };
    xl?: { width: number; height: number };
    '2xl'?: { width: number; height: number };
  };
  aspectRatio?: 'square' | 'video' | '4/3' | '3/2' | '16/9' | 'auto';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  className?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes,
  aspectRatio = 'auto',
  objectFit = 'cover',
  className
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    '4/3': 'aspect-4/3',
    '3/2': 'aspect-3/2',
    '16/9': 'aspect-16/9',
    auto: ''
  };

  const objectFitClasses = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down'
  };

  return (
    <div className={clsx(
      'relative overflow-hidden',
      aspectRatioClasses[aspectRatio],
      className
    )}>
      <img
        src={src}
        alt={alt}
        className={clsx(
          'w-full h-full',
          objectFitClasses[objectFit]
        )}
        loading="lazy"
      />
    </div>
  );
};

// Responsive sidebar/drawer
interface ResponsiveSidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  breakpoint?: Breakpoint;
  className?: string;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  children,
  isOpen,
  onClose,
  side = 'left',
  breakpoint = 'lg',
  className
}) => {
  const { isBreakpointUp } = useBreakpoint();
  const isPersistent = isBreakpointUp(breakpoint);

  // Close sidebar when breakpoint changes to desktop
  useEffect(() => {
    if (isPersistent && isOpen) {
      onClose();
    }
  }, [isPersistent, isOpen, onClose]);

  if (isPersistent) {
    return (
      <aside className={clsx('relative', className)}>
        {children}
      </aside>
    );
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 z-50 w-80 max-w-[80vw]',
          'glass-container transform transition-transform duration-300 ease-in-out',
          side === 'left' ? 'left-0' : 'right-0',
          isOpen
            ? 'translate-x-0'
            : side === 'left'
              ? '-translate-x-full'
              : 'translate-x-full',
          className
        )}
      >
        {children}
      </aside>
    </>
  );
};
