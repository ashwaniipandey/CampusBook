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
        className={`flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-100 to-teal-100 text-emerald-700 dark:from-slate-800 dark:via-emerald-950 dark:to-slate-900 dark:text-emerald-300 ${className}`}
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
