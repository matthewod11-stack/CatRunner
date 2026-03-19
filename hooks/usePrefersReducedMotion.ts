import { useEffect, useState } from 'react';

/** Synced with `(prefers-reduced-motion: reduce)` for conditional UI / `motion-intense` toggles. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

/**
 * Applies `prefers-reduced-motion` on `<html>` for global CSS (see index.html)
 * and returns the same flag for conditional rendering.
 */
export function useDocumentReducedMotionClass(): boolean {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    document.documentElement.classList.toggle('prefers-reduced-motion', reduced);
    return () => document.documentElement.classList.remove('prefers-reduced-motion');
  }, [reduced]);

  return reduced;
}
