'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className="relative inline-flex h-9 items-center rounded-full border border-card-border bg-card p-1 backdrop-blur-md"
    >
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        onClick={() => setTheme('light')}
        aria-label="Switch to light theme"
        title="Light theme"
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
          !isDark
            ? 'bg-accent text-btn-primary-text shadow-sm'
            : 'text-muted hover:text-heading'
        }`}
      >
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        onClick={() => setTheme('dark')}
        aria-label="Switch to dark theme"
        title="Dark theme"
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
          isDark
            ? 'bg-accent text-btn-primary-text shadow-sm'
            : 'text-muted hover:text-heading'
        }`}
      >
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
