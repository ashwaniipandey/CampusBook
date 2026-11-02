'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function MotionSection({
  children,
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className={className}
      aria-label={ariaLabel}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: reduceMotion ? 0 : 0.32, ease: 'easeOut' }}
    />
  );
}

export function MotionCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.main
      className={className}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  );
}

export function MotionPage({ children, pageKey }: { children: ReactNode; pageKey: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      key={pageKey}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
      className="flex-1"
    >
      {children}
    </motion.div>
  );
}

export function MotionDialog({
  children,
  labelledBy,
  onClose,
  closeDisabled = false,
  panelClassName = '',
}: {
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
  closeDisabled?: boolean;
  panelClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const getFocusable = () =>
      panel?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    getFocusable()?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabledRef.current) {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable?.length) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return (
    <motion.div
      role="presentation"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.16 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <motion.section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl focus:outline-none ${panelClassName}`}
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
      >
        {children}
      </motion.section>
    </motion.div>
  );
}
