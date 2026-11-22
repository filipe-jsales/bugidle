import { useEffect, useRef, useState } from "react";

/** Tracks an element's size with a ResizeObserver. */
export function useElementSize<T extends HTMLElement>(initial = { width: 640, height: 360 }) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}
