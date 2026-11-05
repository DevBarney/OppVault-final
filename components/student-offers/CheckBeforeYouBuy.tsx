import { CheckIcon } from '../Icons';

/** Shown on every offer page. OppVault lists offers; it does not sell, test or endorse them. */
export default function CheckBeforeYouBuy({ ended }: { ended: boolean }) {
  return (
    <section className="off-check" aria-labelledby="off-check-h">
      <h2 className="off-check__title" id="off-check-h">
        Check before you buy
      </h2>
      <ul className="off-check__list">
        <li><CheckIcon className="off-check__tick" /><span>OppVault lists this offer for information. We have not tested it and we do not endorse it.</span></li>
        <li><CheckIcon className="off-check__tick" /><span>{ended ? 'The end date has passed, so the offer may no longer be available.' : 'Read the price, terms and end date on the provider\u2019s own page, because they can change without notice.'}</span></li>
        <li><CheckIcon className="off-check__tick" /><span>Check what you must prove to qualify, and what the provider does with your documents, before you upload anything.</span></li>
        <li><CheckIcon className="off-check__tick" /><span>Find out whether the price changes after a trial or discount period, and how to cancel.</span></li>
        <li><CheckIcon className="off-check__tick" /><span>Pay only on the provider&rsquo;s official site. Never send money or card details to someone who contacted you about an offer.</span></li>
      </ul>
    </section>
  );
}
