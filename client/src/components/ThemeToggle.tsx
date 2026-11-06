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
      className="relative inline-flex h-9 items-center rounded-full border border-emerald-500/30 bg-emerald-950/40 p-1 backdrop-blur-md dark:border-emerald-500/30 dark:bg-emerald-950/40 light:border-slate-200 light:bg-slate-100"
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
            ? 'bg-emerald-400 text-slate-950 shadow-sm'
            : 'text-emerald-300/70 hover:text-emerald-200'
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
            ? 'bg-emerald-500 text-slate-950 shadow-sm'
            : 'text-slate-600 hover:text-slate-900 dark:text-emerald-300/70 dark:hover:text-emerald-200'
        }`}
      >
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
