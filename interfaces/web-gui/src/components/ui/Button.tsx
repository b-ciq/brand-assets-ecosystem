import React from 'react';

// Button sizes following Quantic Design System
type ButtonSize = '28' | '36' | '40' | '44' | '48';

// Button variants following Quantic Design System
type ButtonVariant =
  | 'primary'      // Green background, dark gray text (main CTAs)
  | 'secondary'    // Green outlined (secondary actions)
  | 'destructive'  // Red background (delete, remove actions)
  | 'ghost'        // Transparent, hover only (subtle actions)
  | 'link'         // Text with underline (inline links)
  | 'outline';     // Gray outlined (tertiary actions)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

/**
 * Quantic Design System compliant Button component
 *
 * Implements all required Quantic button patterns:
 * - Fixed heights with perfect vertical centering
 * - Proper disabled states
 * - Icon support with correct sizing
 * - All standard button variants
 *
 * @example
 * <Button variant="primary" size="40" icon={<Plus size={16} />}>
 *   Create New
 * </Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = '40',
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // Base styles - REQUIRED for all Quantic buttons
    const baseStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px', // Quantic standard gap
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      textTransform: variant === 'link' ? 'none' : 'uppercase',
      lineHeight: '1', // CRITICAL for perfect vertical centering
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      ...style,
    };

    // Size-specific styles
    const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
      '28': {
        height: '28px',
        padding: '0 12px',
        fontSize: '14px',
      },
      '36': {
        height: '36px',
        padding: '0 12px',
        fontSize: '14px',
      },
      '40': {
        height: '40px',
        padding: '0 16px',
        fontSize: '14px',
      },
      '44': {
        height: '44px',
        padding: '0 20px',
        fontSize: '16px',
      },
      '48': {
        height: '48px',
        padding: '0 24px',
        fontSize: '16px',
      },
    };

    // Icon size mapping (icons ~1.14× text size)
    const iconSizes: Record<ButtonSize, number> = {
      '28': 16,
      '36': 16,
      '40': 16,
      '44': 18,
      '48': 18,
    };

    // Variant-specific styles
    const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
      primary: {
        backgroundColor: 'var(--quantic-color-brand-400)', // #12a66f
        color: 'var(--quantic-color-gray-dark-mode-900)', // #13161b
      },
      secondary: {
        backgroundColor: 'transparent',
        color: 'var(--quantic-color-brand-400)',
        border: '1px solid var(--quantic-color-brand-400)',
      },
      destructive: {
        backgroundColor: 'var(--quantic-color-error-600)', // #d92d20
        color: 'var(--quantic-color-gray-dark-mode-300)', // #cecfd2
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--quantic-color-gray-dark-mode-50)', // #f7f7f7
      },
      link: {
        backgroundColor: 'transparent',
        color: 'var(--quantic-color-brand-400)',
        padding: '0',
        textDecoration: 'underline',
        textUnderlineOffset: '4px',
        borderRadius: '0',
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--quantic-color-gray-dark-mode-50)',
        border: '1px solid var(--quantic-color-gray-dark-mode-700)', // #373a41
      },
    };

    // Hover styles by variant
    const getHoverStyles = (): React.CSSProperties => {
      if (disabled) return {};

      switch (variant) {
        case 'primary':
          return { backgroundColor: 'var(--quantic-color-brand-300)' }; // #17c484
        case 'secondary':
          return { backgroundColor: 'rgba(18, 166, 111, 0.1)' };
        case 'destructive':
          return { opacity: '0.9' };
        case 'ghost':
          return { backgroundColor: 'var(--quantic-color-gray-dark-mode-800)' };
        case 'link':
          return {};
        case 'outline':
          return { backgroundColor: 'var(--quantic-color-gray-dark-mode-800)' };
        default:
          return {};
      }
    };

    // Disabled state styles (Quantic standard)
    const disabledStyles: React.CSSProperties = disabled
      ? {
          pointerEvents: 'none',
          opacity: 0.5,
        }
      : {};

    // Combine all styles
    const combinedStyles: React.CSSProperties = {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyles,
    };

    // Render icon with proper sizing and flex-shrink
    const renderIcon = (node: React.ReactNode) => {
      if (!node) return null;

      // Clone icon element and ensure flex-shrink: 0
      if (React.isValidElement(node)) {
        return React.cloneElement(node as React.ReactElement<any>, {
          size: iconSizes[size],
          style: { flexShrink: 0, ...(node.props as any).style },
        });
      }

      return node;
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={className}
        style={combinedStyles}
        onMouseEnter={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, getHoverStyles());
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, {
              ...sizeStyles[size],
              ...variantStyles[variant],
            });
          }
        }}
        {...props}
      >
        {iconPosition === 'left' && renderIcon(icon)}
        {children}
        {iconPosition === 'right' && renderIcon(icon)}
      </button>
    );
  }
);

Button.displayName = 'Button';
