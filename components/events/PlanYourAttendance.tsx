import type { Venue } from './timing';

type Props = { venue: Venue; fundedPlaces: boolean; past: boolean };

/**
 * General planning advice only. It never states a fact about one specific event
 * (visa rules, costs or funding terms): those come from the organiser's official page.
 */
export default function PlanYourAttendance({ venue, fundedPlaces, past }: Props) {
  if (past) return null;
  const inPerson = venue === 'in-person' || venue === 'hybrid' || venue === 'unknown';
  return (
    <section className="evt-plan" aria-labelledby="evt-plan-h">
      <h2 className="detail__h" id="evt-plan-h">
        Plan your attendance
      </h2>
      <p className="evt-plan__lead">
        These are general steps, not details of this event. Confirm every point on the official page.
      </p>
      <div className="evt-plan__grid">
        {inPerson ? (
          <div className="evt-plan__item">
            <h3>Travel and stay</h3>
            <ul>
              <li>Work out the full cost first: transport, accommodation, meals and any local transfers.</li>
              <li>Book refundable options where you can until your place is confirmed.</li>
              <li>Ask the organiser whether they list a partner hotel or a student rate.</li>
            </ul>
          </div>
        ) : null}
        {inPerson ? (
          <div className="evt-plan__item">
            <h3>Visa and entry</h3>
            <ul>
              <li>Check the entry rules for your passport on the host country&rsquo;s official immigration or embassy site.</li>
              <li>Start early. Visa decisions can take weeks, and the organiser cannot speed them up.</li>
              <li>Ask whether the organiser provides an invitation letter, and what it needs from you.</li>
            </ul>
          </div>
        ) : null}
        {venue === 'online' || venue === 'hybrid' ? (
          <div className="evt-plan__item">
            <h3>Joining online</h3>
            <ul>
              <li>Check the time zone of the start time and convert it to your own.</li>
              <li>Test the platform and your connection before the day, and look for a recording or captions.</li>
              <li>Register in advance if the organiser asks for it. Some links only go to registered people.</li>
            </ul>
          </div>
        ) : null}
        <div className="evt-plan__item">
          <h3>Funding</h3>
          <ul>
            {fundedPlaces ? (
              <li>The organiser lists funded places. Who qualifies, what is covered and the closing date are set by them, so read their rules before you plan anything.</li>
            ) : (
              <li>Ask the organiser or your school whether travel grants, fee waivers or student rates exist.</li>
            )}
            <li>Check what funding covers. Fees, travel and accommodation are often separate.</li>
            <li>Apply for funding before you pay, and keep your receipts.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
