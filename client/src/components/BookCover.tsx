'use client';

import { BookOpen } from 'lucide-react';
import { useState } from 'react';

interface BookCoverProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export default function BookCover({ src, alt, className = '' }: BookCoverProps) {
  const [failedSrc, setFailedSrc] = useState('');

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={`${alt} cover unavailable`}
        className={`flex items-center justify-center bg-card/60 border border-card-border text-muted ${className}`}
      >
        <BookOpen className="h-10 w-10 drop-shadow-sm" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
