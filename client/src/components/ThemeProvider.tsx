'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export default function ThemeProvider(props: ThemeProviderProps) {
  return <NextThemesProvider {...props} disableTransitionOnChange={false} />;
}
