import { useEffect, useState } from 'react';

export function useCardScale() {
  const [scale, setScale] = useState(getScale());

  function getScale() {
    const w = window.innerWidth;
    if (w < 360) return 0.52;
    if (w < 480) return 0.62;
    if (w < 640) return 0.72;
    return 0.82;
  }

  useEffect(() => {
    const handler = () => setScale(getScale());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return scale;
}

export function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}
