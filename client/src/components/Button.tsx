import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const variantStyles = {
      primary: 'bg-btn-primary text-btn-primary-text hover:opacity-90 shadow-sm',
      secondary: 'bg-btn-secondary text-btn-secondary-text hover:opacity-90 border border-card-border/40',
      ghost: 'bg-transparent text-heading hover:bg-card border border-transparent',
    }[variant];

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-xl font-medium',
      md: 'px-4 py-2.5 text-sm rounded-xl font-semibold',
      lg: 'px-6 py-3 text-base rounded-2xl font-bold',
    }[size];

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
