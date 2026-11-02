'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; width: number; text: string },
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void>;
  onError: (message: string) => void;
}

export default function GoogleSignInButton({
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    if (window.google) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => onError('Google sign-in could not be loaded. Please try again.');
    document.head.appendChild(script);
  }, [clientId, onError]);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response.credential) {
          onError('Google did not return a sign-in credential.');
          return;
        }
        void onCredential(response.credential);
      },
    });
    buttonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: Math.min(buttonRef.current.clientWidth, 360),
      text: 'continue_with',
    });
  }, [clientId, onCredential, onError, scriptReady]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        Google sign-in is unavailable until NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured.
      </p>
    );
  }

  return <div ref={buttonRef} className="flex min-h-10 justify-center" aria-label="Continue with Google" />;
}
