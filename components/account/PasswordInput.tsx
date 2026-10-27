'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import './account.css';

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  minLength,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
  label: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="acct-field">
      <label htmlFor={id}>{label}</label>
      <div className="acct-pw">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          autoCapitalize="none"
          spellCheck={false}
        />
        <button type="button" className="acct-pw__toggle" aria-pressed={shown} aria-controls={id} onClick={() => setShown((s) => !s)}>
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
