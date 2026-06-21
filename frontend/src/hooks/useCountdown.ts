import { useState, useEffect } from 'react';
import { timeLeft } from '../utils/format';

export function useCountdown(endsAt: string | null | undefined, onEnd?: () => void): string {
  const [display, setDisplay] = useState(() => timeLeft(endsAt ?? null));

  useEffect(() => {
    if (!endsAt) { setDisplay(''); return; }
    setDisplay(timeLeft(endsAt));
    const id = setInterval(() => {
      const t = timeLeft(endsAt);
      setDisplay(t);
      if (t === '✓' && onEnd) { clearInterval(id); setTimeout(onEnd, 500); }
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return display;
}
