import Reveal from './Reveal';
import { CheckIcon } from './Icons';

const POINTS = ['Every listing links to its official source', 'Deadlines and rules can change', 'The provider makes the final decision'];

/** The honest "we cannot guarantee anything" note, written to be read rather than skipped. */
export default function FinePrint() {
  return (
    <Reveal>
      <aside className="fp" aria-labelledby="fp-title">
        <span className="fp__seal" aria-hidden="true">
          <svg viewBox="0 0 40 52" className="fp__key">
            <circle cx="20" cy="17" r="8" />
            <path d="M16 22h8l3 20H13l3-20Z" />
          </svg>
        </span>
        <div className="fp__body">
          <h3 id="fp-title" className="fp__title">
            We open the door. Walking through it is up to you.
          </h3>
          <p className="fp__text">
            OppVault helps you find opportunities, but we cannot promise you will be selected for any of them. Always confirm the details on the official page
            before you apply.
          </p>
          <ul className="fp__points">
            {POINTS.map((p) => (
              <li key={p}>
                <CheckIcon className="fp__tick" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </Reveal>
  );
}
