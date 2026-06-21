import { useState, useCallback, useRef, useEffect } from 'react';
import type { LeadInfo } from '../types';

interface LeadFormProps {
  onSubmit: (lead: LeadInfo) => void;
  submitting?: boolean;
  error?: string | null;
}

export default function LeadForm({ onSubmit, submitting = false, error }: LeadFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [needs, setNeeds] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      if (!name.trim()) {
        setValidationError('Please enter your name');
        return;
      }
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
        setValidationError('Please enter a valid email');
        return;
      }

      onSubmit({ name: name.trim(), email: email.trim(), company: company.trim(), needs: needs.trim() });
    },
    [name, email, company, needs, onSubmit]
  );

  return (
    <form className="cf-lead-form" onSubmit={handleSubmit}>
      <h3>Let's get started!</h3>
      <p>Tell us a bit about yourself and we'll be right with you.</p>

      <input
        ref={nameRef}
        className="cf-form-input"
        type="text"
        placeholder="Your Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="cf-form-input"
        type="email"
        placeholder="Email Address *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="cf-form-input"
        type="text"
        placeholder="Company (optional)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
      <textarea
        className="cf-form-input"
        placeholder="What can we help you with? (optional)"
        value={needs}
        onChange={(e) => setNeeds(e.target.value)}
        rows={2}
        style={{ resize: 'none' }}
      />
      {(validationError || error) && (
        <div className="cf-form-error">{validationError || error}</div>
      )}
      <button className="cf-form-btn" type="submit" disabled={submitting}>
        {submitting ? 'Starting chat...' : 'Start Chat'}
      </button>
    </form>
  );
}