import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies default variant and size classes', () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('glass-button', 'focus-glass', 'font-medium', 'transition-all', 'duration-200');
    expect(button).toHaveClass('glass-button-primary'); // default variant
    expect(button).toHaveClass('px-6', 'py-3', 'text-base'); // default size (md)
  });

  it('applies different variants correctly', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;

    variants.forEach(variant => {
      const { unmount } = render(<Button variant={variant}>Test</Button>);
      const button = screen.getByRole('button');

      switch (variant) {
      case 'primary':
        expect(button).toHaveClass('glass-button-primary');
        break;
      case 'secondary':
        expect(button).toHaveClass('glass-button-secondary');
        break;
      case 'ghost':
        expect(button).toHaveClass('bg-transparent', 'border-white/20', 'text-white', 'hover:bg-white/10');
        break;
      case 'danger':
        expect(button).toHaveClass('bg-red-500/20', 'border-red-300/30', 'text-white', 'hover:bg-red-400/30');
        break;
      }

      unmount();
    });
  });

  it('applies different sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      const { unmount } = render(<Button size={size}>Test</Button>);
      const button = screen.getByRole('button');

      switch (size) {
      case 'sm':
        expect(button).toHaveClass('px-3', 'py-2', 'text-sm');
        break;
      case 'md':
        expect(button).toHaveClass('px-6', 'py-3', 'text-base');
        break;
      case 'lg':
        expect(button).toHaveClass('px-8', 'py-4', 'text-lg');
        break;
      }

      unmount();
    });
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    expect(screen.getByText('加载中...')).toBeInTheDocument();
    expect(button.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('is disabled when loading is true', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const mockClick = jest.fn();
    render(<Button onClick={mockClick}>Clickable Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const mockClick = jest.fn();
    render(<Button onClick={mockClick} disabled>Disabled Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const mockClick = jest.fn();
    render(<Button onClick={mockClick} loading>Loading Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('custom-class');
  });

  it('passes through other button props', () => {
    render(<Button type="submit" data-testid="submit-button">Submit</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('data-testid', 'submit-button');
  });
});
