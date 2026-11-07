import './vault-door.css';

/** The ring of tick marks around the vault door. Computed once, so server and browser always agree. */
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const angle = (i * 10 * Math.PI) / 180;
  const long = i % 3 === 0;
  const r1 = long ? 160 : 166;
  const r2 = 174;
  return {
    key: i,
    x1: (200 + r1 * Math.sin(angle)).toFixed(2),
    y1: (200 - r1 * Math.cos(angle)).toFixed(2),
    x2: (200 + r2 * Math.sin(angle)).toFixed(2),
    y2: (200 - r2 * Math.cos(angle)).toFixed(2),
    long,
  };
});

const SPOKES = [0, 60, 120, 180, 240, 300];
const RIVETS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  return { key: i, cx: (200 + 186 * Math.sin(angle)).toFixed(2), cy: (200 - 186 * Math.cos(angle)).toFixed(2) };
});

export default function VaultDoor() {
  return (
    <div className="abt-vaultwrap">
      <span className="abt-halo" aria-hidden="true" />
      <span className="abt-rays" aria-hidden="true" />
      <svg className="abt-vault" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="abt-face" cx="50%" cy="40%" r="70%">
            <stop offset="0" stopColor="#1740c9" />
            <stop offset="1" stopColor="#06147d" />
          </radialGradient>
          <linearGradient id="abt-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8fe9ff" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#1bdbe3" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="abt-beam" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fbb800" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fbb800" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="196" className="abt-vault__outer" />
        <circle cx="200" cy="200" r="192" fill="none" stroke="url(#abt-rim)" strokeWidth="3" />
        {RIVETS.map((r) => (
          <circle key={r.key} cx={r.cx} cy={r.cy} r="2.6" className="abt-vault__rivet" />
        ))}
        <g className="abt-vault__dial">
          {TICKS.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              className={t.long ? 'abt-vault__tick abt-vault__tick--long' : 'abt-vault__tick'}
            />
          ))}
        </g>
        <circle cx="200" cy="200" r="148" className="abt-vault__ring" />
        <circle cx="200" cy="200" r="118" className="abt-vault__disc" />
        <g className="abt-vault__wheel">
          {SPOKES.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 200 200)`}>
              <rect x="195" y="88" width="10" height="46" rx="5" className="abt-vault__spoke" />
              <circle cx="200" cy="84" r="9" className="abt-vault__knob" />
            </g>
          ))}
        </g>
        <circle cx="200" cy="200" r="78" fill="url(#abt-face)" className="abt-vault__hub" />
        <circle cx="200" cy="200" r="120" fill="url(#abt-beam)" className="abt-vault__glow" />
        <circle cx="200" cy="184" r="19" className="abt-vault__key" />
        <path d="M190 196h20l7 44h-34l7-44Z" className="abt-vault__key" />
      </svg>
    </div>
  );
}
