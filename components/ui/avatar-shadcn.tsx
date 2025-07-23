'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const AvatarShadcn = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'size-6',
    md: 'size-8',
    lg: 'size-10',
    xl: 'size-12'
  };

  return (
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
AvatarShadcn.displayName = AvatarPrimitive.Root.displayName;

const AvatarImageShadcn = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-slot="avatar-image"
    className={cn('aspect-square size-full object-cover', className)}
    {...props}
  />
));
AvatarImageShadcn.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallbackShadcn = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    className={cn(
      'bg-muted flex size-full items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-medium',
      className
    )}
    {...props}
  />
));
AvatarFallbackShadcn.displayName = AvatarPrimitive.Fallback.displayName;

// Enhanced Avatar with status indicator
interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'away' | 'busy'
  showStatus?: boolean
}

const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  children,
  status = 'offline',
  showStatus = false,
  className,
  ...props
}) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  return (
    <div className="relative">
      <AvatarShadcn className={className} {...props}>
        {children}
      </AvatarShadcn>
      {showStatus && (
        <div
          className={cn(
            'absolute bottom-0 right-0 size-3 rounded-full border-2 border-background',
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export { AvatarShadcn, AvatarImageShadcn, AvatarFallbackShadcn, AvatarWithStatus };
