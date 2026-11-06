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
            auto_select?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; width?: number; text: string }
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

// Module-level globals ensure Google Accounts ID is initialized ONLY ONCE per window session
let isGlobalGsiInitialized = false;
let globalCredentialCallback: ((response: { credential: string }) => void) | null = null;

export default function GoogleSignInButton({
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Load the Google GSI script once
  useEffect(() => {
    if (!clientId) return;
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () =>
      onErrorRef.current('Google sign-in could not be loaded. Please try again.');
    document.head.appendChild(script);
  }, [clientId]);

  // Initialize once and render button safely
  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    globalCredentialCallback = (response) => {
      if (!response.credential) {
        onErrorRef.current('Google did not return a sign-in credential.');
        return;
      }
      void onCredentialRef.current(response.credential);
    };

    try {
      if (!isGlobalGsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (globalCredentialCallback) {
              globalCredentialCallback(response);
            }
          },
          auto_select: false,
          itp_support: true,
        });
        isGlobalGsiInitialized = true;
      }

      buttonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
      });
    } catch (err: any) {
      console.warn('Google GSI render error:', err);
    }
  }, [clientId, scriptReady]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        Google sign-in is unavailable until NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured.
      </p>
    );
  }

  return (
    <div
      ref={buttonRef}
      className="flex min-h-11 justify-center"
      aria-label="Continue with Google"
    />
  );
}
