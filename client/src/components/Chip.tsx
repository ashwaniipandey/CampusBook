import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ active, className = '', children, ...props }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm transition-all duration-150 ${
        active
          ? 'bg-accent text-btn-primary-text shadow-xs'
          : 'bg-chip text-heading border border-card-border/60 hover:border-card-border'
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Chip;
