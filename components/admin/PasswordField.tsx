'use client';

import { useState } from 'react';

/** A password box with a Show / Hide button, so people can check what they typed. Hidden by default. */
export default function PasswordField({
  id,
  name,
  autoComplete,
  minLength,
  required = true,
}: {
  id: string;
  name: string;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="adm__pw">
      <input
        id={id}
        name={name}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className="adm__input adm__pwinput"
        autoCapitalize="none"
        spellCheck={false}
      />
      <button type="button" className="adm__pwtoggle" aria-pressed={shown} aria-controls={id} onClick={() => setShown((s) => !s)}>
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
