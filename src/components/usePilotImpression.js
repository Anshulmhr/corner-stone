import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { enrolled, pilotEvent, pilotState, subscribePilot } from '../services/pilot.js';

// Record an impression only after its element is visible, or directly activated.
// The stable ID also links an immediate click before the observer callback fires.
export function usePilotImpression(kind, problem, fields) {
  const token = useSyncExternalStore(subscribePilot, pilotState);
  const key = JSON.stringify([token, kind, problem, fields]);
  const last = useRef(null);
  const element = useRef(null);
  const show = useCallback(() => {
    if (!enrolled() || token !== pilotState() || !problem || !fields) return null;
    if (last.current?.key !== key) {
      const id = crypto.randomUUID();
      last.current = { key, id };
      pilotEvent(kind, problem, fields, id);
    }
    return last.current.id;
  }, [key]); // key includes the complete payload, not its object identity
  useEffect(() => {
    if (!enrolled() || !fields || !element.current) {
      last.current = null;
      return;
    }
    let visible = false;
    const check = () => {
      if (visible && !document.hidden) show();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      check();
    });
    observer.observe(element.current);
    document.addEventListener('visibilitychange', check);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', check);
    };
  }, [show]);
  return [element, show];
}
