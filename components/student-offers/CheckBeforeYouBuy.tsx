/** Shown on every offer page. OppVault lists offers; it does not sell, test or endorse them. */
export default function CheckBeforeYouBuy({ ended }: { ended: boolean }) {
  return (
    <section className="off-check" aria-labelledby="off-check-h">
      <h2 className="off-check__title" id="off-check-h">
        Check before you buy
      </h2>
      <ul>
        <li>OppVault lists this offer for information. We have not tested it and we do not endorse it.</li>
        <li>{ended ? 'The end date has passed, so the offer may no longer be available.' : 'Read the price, terms and end date on the provider\u2019s own page, because they can change without notice.'}</li>
        <li>Check what you must prove to qualify, and what the provider does with your documents, before you upload anything.</li>
        <li>Find out whether the price changes after a trial or discount period, and how to cancel.</li>
        <li>Pay only on the provider&rsquo;s official site. Never send money or card details to someone who contacted you about an offer.</li>
      </ul>
    </section>
  );
}
