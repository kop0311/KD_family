import { render, screen } from '@testing-library/react';
import { GlassContainer } from '../ui/GlassContainer';

describe('GlassContainer', () => {
  it('renders children correctly', () => {
    render(
      <GlassContainer>
        <div>Test content</div>
      </GlassContainer>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(
      <GlassContainer>
        <div>Test content</div>
      </GlassContainer>
    );

    const glassContainer = container.firstChild;
    expect(glassContainer).toHaveClass('glass-container');
  });

  it('applies custom className', () => {
    const { container } = render(
      <GlassContainer className="custom-class">
        <div>Test content</div>
      </GlassContainer>
    );

    const glassContainer = container.firstChild;
    expect(glassContainer).toHaveClass('glass-container', 'custom-class');
  });

  it('applies card variant classes', () => {
    const { container } = render(
      <GlassContainer variant="card">
        <div>Test content</div>
      </GlassContainer>
    );

    const glassContainer = container.firstChild;
    expect(glassContainer).toHaveClass('glass-container', 'glass-card');
  });

  it('applies hover classes when hover prop is true', () => {
    const { container } = render(
      <GlassContainer hover>
        <div>Test content</div>
      </GlassContainer>
    );

    const glassContainer = container.firstChild;
    expect(glassContainer).toHaveClass('hover:bg-white/15', 'hover:scale-[1.02]', 'transition-all', 'duration-300');
  });

  it('applies clickable classes when onClick is provided', () => {
    const mockClick = jest.fn();
    const { container } = render(
      <GlassContainer onClick={mockClick}>
        <div>Test content</div>
      </GlassContainer>
    );

    const glassContainer = container.firstChild;
    expect(glassContainer).toHaveClass('cursor-pointer');
  });

  it('calls onClick when clicked', () => {
    const mockClick = jest.fn();
    const { container } = render(
      <GlassContainer onClick={mockClick}>
        <div>Test content</div>
      </GlassContainer>
    );

    const glassContainer = container.firstChild as HTMLElement;
    glassContainer.click();

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('renders different variants correctly', () => {
    const variants = ['default', 'card', 'modal', 'sidebar'] as const;

    variants.forEach(variant => {
      const { container } = render(
        <GlassContainer variant={variant}>
          <div>Test content</div>
        </GlassContainer>
      );

      const glassContainer = container.firstChild;
      expect(glassContainer).toHaveClass('glass-container');

      if (variant === 'card') {
        expect(glassContainer).toHaveClass('glass-card');
      }
    });
  });
});
