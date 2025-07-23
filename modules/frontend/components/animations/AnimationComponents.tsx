'use client';

import React, { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider';

// Scroll-triggered animations
interface ScrollAnimationProps {
  children: React.ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'rotate-in';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  animation = 'fade-in',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className,
  once = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { settings } = useAccessibility();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || settings.reducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && (!hasAnimated || !once)) {
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
        } else if (!once && !entry.isIntersecting) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [delay, threshold, once, hasAnimated, settings.reducedMotion]);

  const animationClasses = {
    'fade-in': isVisible ? 'opacity-100' : 'opacity-0',
    'slide-up': isVisible
      ? 'opacity-100 transform translate-y-0'
      : 'opacity-0 transform translate-y-8',
    'slide-down': isVisible
      ? 'opacity-100 transform translate-y-0'
      : 'opacity-0 transform -translate-y-8',
    'slide-left': isVisible
      ? 'opacity-100 transform translate-x-0'
      : 'opacity-0 transform translate-x-8',
    'slide-right': isVisible
      ? 'opacity-100 transform translate-x-0'
      : 'opacity-0 transform -translate-x-8',
    'zoom-in': isVisible
      ? 'opacity-100 transform scale-100'
      : 'opacity-0 transform scale-95',
    'rotate-in': isVisible
      ? 'opacity-100 transform rotate-0'
      : 'opacity-0 transform -rotate-12'
  };

  return (
    <div
      ref={elementRef}
      className={clsx(
        'transition-all ease-out',
        animationClasses[animation],
        settings.reducedMotion ? 'duration-75' : `duration-${duration}`,
        className
      )}
    >
      {children}
    </div>
  );
};

// Staggered animation container
interface StaggeredAnimationProps {
  children: React.ReactNode[];
  delay?: number;
  staggerDelay?: number;
  animation?: 'fade-in' | 'slide-up' | 'scale-in';
  className?: string;
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  delay = 0,
  staggerDelay = 100,
  animation = 'slide-up',
  className
}) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useAccessibility();

  useEffect(() => {
    if (settings.reducedMotion) {
      setVisibleItems(new Set(Array.from({ length: children.length }, (_, i) => i)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            children.forEach((_, index) => {
              setTimeout(() => {
                setVisibleItems(prev => new Set([...prev, index]));
              }, delay + index * staggerDelay);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [children, delay, staggerDelay, settings.reducedMotion]);

  const getAnimationClass = (index: number, isVisible: boolean) => {
    const baseClass = 'transition-all duration-500 ease-out';

    switch (animation) {
    case 'fade-in':
      return clsx(baseClass, isVisible ? 'opacity-100' : 'opacity-0');
    case 'slide-up':
      return clsx(
        baseClass,
        isVisible
          ? 'opacity-100 transform translate-y-0'
          : 'opacity-0 transform translate-y-4'
      );
    case 'scale-in':
      return clsx(
        baseClass,
        isVisible
          ? 'opacity-100 transform scale-100'
          : 'opacity-0 transform scale-95'
      );
    default:
      return baseClass;
    }
  };

  return (
    <div ref={containerRef} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={getAnimationClass(index, visibleItems.has(index))}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Interactive hover animations
interface HoverAnimationProps {
  children: React.ReactNode;
  effect?: 'lift' | 'scale' | 'tilt' | 'glow' | 'bounce' | 'rotate';
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}

export const HoverAnimation: React.FC<HoverAnimationProps> = ({
  children,
  effect = 'lift',
  intensity = 'normal',
  className
}) => {
  const { settings } = useAccessibility();

  if (settings.reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getEffectClasses = () => {
    const intensityMap = {
      subtle: 'hover:scale-[1.02] hover:-translate-y-1',
      normal: 'hover:scale-105 hover:-translate-y-2',
      strong: 'hover:scale-110 hover:-translate-y-4'
    };

    switch (effect) {
    case 'lift':
      return clsx('transition-transform duration-300 ease-out', {
        'hover:-translate-y-1': intensity === 'subtle',
        'hover:-translate-y-2': intensity === 'normal',
        'hover:-translate-y-4': intensity === 'strong'
      });
    case 'scale':
      return clsx('transition-transform duration-300 ease-out', {
        'hover:scale-[1.02]': intensity === 'subtle',
        'hover:scale-105': intensity === 'normal',
        'hover:scale-110': intensity === 'strong'
      });
    case 'tilt':
      return clsx('transition-transform duration-300 ease-out', {
        'hover:rotate-1': intensity === 'subtle',
        'hover:rotate-2': intensity === 'normal',
        'hover:rotate-3': intensity === 'strong'
      });
    case 'glow':
      return clsx('transition-all duration-300 ease-out', {
        'hover:shadow-lg hover:shadow-primary-500/25': intensity === 'subtle',
        'hover:shadow-xl hover:shadow-primary-500/30': intensity === 'normal',
        'hover:shadow-2xl hover:shadow-primary-500/40': intensity === 'strong'
      });
    case 'bounce':
      return 'transition-transform duration-300 ease-out hover:animate-bounce-gentle';
    case 'rotate':
      return clsx('transition-transform duration-300 ease-out', {
        'hover:rotate-3': intensity === 'subtle',
        'hover:rotate-6': intensity === 'normal',
        'hover:rotate-12': intensity === 'strong'
      });
    default:
      return '';
    }
  };

  return (
    <div className={clsx(getEffectClasses(), className)}>
      {children}
    </div>
  );
};

// Ripple effect for buttons
interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  className,
  rippleColor = 'rgba(255, 255, 255, 0.6)'
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const { settings } = useAccessibility();

  const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    if (settings.reducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  };

  return (
    <div
      className={clsx('relative overflow-hidden', className)}
      onMouseDown={addRipple}
    >
      {children}
      {ripples.map(({ x, y, id }) => (
        <span
          key={id}
          className="absolute animate-ripple pointer-events-none rounded-full"
          style={{
            left: x,
            top: y,
            width: '2px',
            height: '2px',
            background: rippleColor
          }}
        />
      ))}
    </div>
  );
};

// Loading skeleton with shimmer effect
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className,
  variant = 'rectangular',
  animation = true
}) => {
  const { settings } = useAccessibility();

  const baseClasses = 'bg-gray-300/20';
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  };

  const animationClasses = animation && !settings.reducedMotion ? 'animate-shimmer' : '';

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses,
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

// Typing animation effect
interface TypingAnimationProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  cursor?: boolean;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 100,
  delay = 0,
  className,
  onComplete,
  cursor = true
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { settings } = useAccessibility();

  useEffect(() => {
    if (settings.reducedMotion) {
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;

    const startTyping = () => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => prev + text[currentIndex]);
        currentIndex++;
        timeoutId = setTimeout(startTyping, speed);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    timeoutId = setTimeout(startTyping, delay);

    return () => clearTimeout(timeoutId);
  }, [text, speed, delay, onComplete, settings.reducedMotion]);

  return (
    <span className={className}>
      {displayedText}
      {cursor && !isComplete && (
        <span className="animate-blink">|</span>
      )}
    </span>
  );
};

// Parallax scrolling effect
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  className
}) => {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const { settings } = useAccessibility();

  useEffect(() => {
    if (settings.reducedMotion) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -speed;
      setOffset(rate);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, settings.reducedMotion]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        transform: settings.reducedMotion ? 'none' : `translateY(${offset}px)`
      }}
    >
      {children}
    </div>
  );
};

// Floating action button with animations
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  label,
  position = 'bottom-right',
  size = 'md',
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { settings } = useAccessibility();

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        'z-50 rounded-full glass-container glass-button-primary',
        'flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'hover:scale-110 hover:shadow-xl hover:shadow-primary-500/30',
        settings.reducedMotion ? '' : 'animate-float',
        positionClasses[position],
        sizeClasses[size],
        className
      )}
      aria-label={label}
      title={label}
    >
      <div className={clsx(
        'transition-transform duration-300',
        isHovered && !settings.reducedMotion ? 'scale-110 rotate-12' : ''
      )}>
        {icon}
      </div>

      {label && isHovered && (
        <span className={clsx(
          'absolute whitespace-nowrap px-3 py-2',
          'glass-container text-sm text-white',
          'transition-all duration-200',
          position.includes('right') ? 'right-full mr-3' : 'left-full ml-3',
          position.includes('top') ? 'top-1/2 -translate-y-1/2' : 'bottom-1/2 translate-y-1/2'
        )}>
          {label}
        </span>
      )}
    </button>
  );
};
