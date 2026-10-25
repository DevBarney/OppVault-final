import Reveal from './Reveal';
import SubscribeForm from './SubscribeForm';
import WhatsAppButton from './WhatsAppButton';
import { WHATSAPP_URL } from '../lib/config';

/** The sign-up band above the footer on every page. The "Get updates" button in the nav scrolls here. */
export default function NewsletterBand() {
  return (
    <section className="band" id="subscribe" aria-labelledby="band-title">
      <div className="container band__grid">
        <Reveal className="band__copy">
          <h2 id="band-title" className="band__quote">
            Hear about new opportunities first.
          </h2>
          <p className="band__text">
            Join the list for new scholarships, fellowships, grants, courses, events and student offers, sent to your
            inbox. No spam, and you can unsubscribe at any time.
          </p>
        </Reveal>
        <Reveal className="band__card" delay={140}>
          <SubscribeForm variant="dark" whatsappUrl={WHATSAPP_URL} />
          <div className="band__or">
            <WhatsAppButton url={WHATSAPP_URL} variant="dark" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
