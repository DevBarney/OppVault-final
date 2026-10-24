import { ChatIcon } from './Icons';

type Props = {
  url?: string;
  variant?: 'light' | 'dark';
  label?: string;
};

/**
 * Link to the WhatsApp community. If NEXT_PUBLIC_WHATSAPP_URL is not set yet, the
 * button shows as unavailable instead of linking nowhere.
 */
export default function WhatsAppButton({ url, variant = 'light', label = 'Join the WhatsApp community' }: Props) {
  const className = `btn btn--ghost${variant === 'dark' ? ' btn--on-dark' : ''}`;

  if (!url) {
    return (
      <span className={`${className} is-disabled`} aria-disabled="true">
        <ChatIcon className="btn__icon" />
        WhatsApp community opens soon
      </span>
    );
  }

  return (
    <a className={className} href={url} target="_blank" rel="noopener noreferrer">
      <ChatIcon className="btn__icon" />
      {label}
    </a>
  );
}
