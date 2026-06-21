import { useCountdown } from '../hooks/useCountdown';

export default function Countdown({ endsAt, prefix = '', onEnd }: { endsAt: string | null | undefined; prefix?: string; onEnd?: () => void }) {
  const display = useCountdown(endsAt, onEnd);
  if (!display) return null;
  return <>{prefix}{display}</>;
}
