import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** One row of choices with explicit paging and a cancellable press-and-hold. */
export function PaletteLane({ kind, label, resetKey, active, children }: {
  kind: 'families' | 'shades';
  label: string;
  resetKey?: string;
  active: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const lane = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const [edges, setEdges] = useState({ left: false, right: false });

  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    timer.current = frame.current = undefined;
  }, []);

  const measure = useCallback(() => {
    const element = lane.current;
    if (!element) return;
    const left = element.scrollLeft > 1;
    const right = element.scrollLeft < element.scrollWidth - element.clientWidth - 1;
    setEdges(previous => previous.left === left && previous.right === right ? previous : { left, right });
  }, []);

  useLayoutEffect(() => {
    stop();
    if (lane.current) lane.current.scrollLeft = 0;
    measure();
  }, [resetKey, measure, stop]);

  useEffect(() => {
    const element = lane.current;
    if (!element) return;
    const observer = new ResizeObserver(() => { stop(); measure(); });
    observer.observe(element);
    window.addEventListener('blur', stop);
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hide);
    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [measure, stop]);

  useEffect(() => { if (!active) stop(); }, [active, stop]);

  const begin = (direction: number) => {
    stop();
    // A new press takes over from any short-click smooth scroll.
    const element = lane.current;
    element?.scrollTo({ left: element.scrollLeft, behavior: 'instant' });
    held.current = false;
    timer.current = window.setTimeout(() => {
      held.current = true;
      let previous = performance.now();
      const tick = (now: number) => {
        const element = lane.current;
        if (!element) return;
        const max = Math.max(0, element.scrollWidth - element.clientWidth);
        const next = Math.max(0, Math.min(max, element.scrollLeft + direction * 360 * Math.min(now - previous, 50) / 1000));
        previous = now;
        element.scrollLeft = next;
        if ((direction < 0 && next === 0) || (direction > 0 && next === max)) {
          stop();
          return;
        }
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    }, 300);
  };

  const arrow = (direction: -1 | 1) => (
    <button
      type="button"
      className="palette-arrow"
      data-direction={direction < 0 ? 'left' : 'right'}
      aria-label={`${label}を${direction < 0 ? '左' : '右'}へ`}
      aria-controls={id}
      disabled={!active || !(direction < 0 ? edges.left : edges.right)}
      onPointerDown={event => {
        if (event.button !== 0 || !event.isPrimary) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        begin(direction);
      }}
      onPointerUp={stop}
      onPointerCancel={() => { stop(); held.current = false; }}
      onLostPointerCapture={stop}
      onContextMenu={event => event.preventDefault()}
      onClick={event => {
        // The click following a hold must not add another page of movement.
        if (event.detail !== 0 && held.current) { held.current = false; return; }
        held.current = false;
        const element = lane.current;
        if (!element) return;
        const style = getComputedStyle(element);
        const clearWidth = element.clientWidth - (parseFloat(style.scrollPaddingLeft) || 0) - (parseFloat(style.scrollPaddingRight) || 0);
        element.scrollBy({
          left: direction * Math.max(44, clearWidth * 0.8),
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
      }}
    >
      {direction < 0 ? <ChevronLeft aria-hidden="true" size={24} /> : <ChevronRight aria-hidden="true" size={24} />}
    </button>
  );

  return <div className={`palette-lane palette-lane-${kind}`}>
    {arrow(-1)}
    <div id={id} ref={lane} className={kind === 'families' ? 'color-families' : 'shades'} role="group" aria-label={label} onScroll={measure}>
      {children}
    </div>
    {arrow(1)}
  </div>;
}
