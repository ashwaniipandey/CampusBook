import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ as: Component = 'div', className = '', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`rounded-2xl border border-card-border bg-card p-5 sm:p-6 backdrop-blur-md shadow-sm transition-all duration-200 text-text ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';
export default Card;
