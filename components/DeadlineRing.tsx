import { daysUntil } from '../lib/dates';

const WINDOW_DAYS = 30;
const R = 18;
const C = 2 * Math.PI * R;

/**
 * A thin ring around the card's arrow that drains as the deadline gets closer (full at 30+ days, empty on the day).
 * In the last 2 days it turns gold and pulses. No ring for rolling or closed listings. Purely decorative: the text beside it says the same.
 */
export default function DeadlineRing({ deadline }: { deadline: string | null }) {
  const d = daysUntil(deadline);
  if (d === null || d < 0 || d > WINDOW_DAYS) return null;
  const frac = Math.max(0.04, d / WINDOW_DAYS);
  const tone = d <= 2 ? 'ring--urgent' : d <= 7 ? 'ring--soon' : 'ring--open';
  return (
    <svg className={`ring ${tone}`} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle className="ring__track" cx="20" cy="20" r={R} />
      <circle className="ring__bar" cx="20" cy="20" r={R} strokeDasharray={C.toFixed(2)} strokeDashoffset={(C * (1 - frac)).toFixed(2)} />
    </svg>
  );
}
