import { Fraunces } from 'next/font/google';

/** A warm serif used only for the big, expressive moments on the About page. Loaded for this route only. */
export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: '700',
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});
