import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    // Never reveal whether the email is registered — always show the same confirmation.
    setSent(true);
  };

  return (
    <div className="auth-card">
      <Link to="/" className="auth-card-logo">Digital Palaeography</Link>
      <div className="auth-card-heading">Reset your password</div>
      <div className="auth-card-subtitle">Enter your email and we'll send you a reset link.</div>

      {sent && (
        <div className="auth-confirm">Check your email — we sent a reset link to {email}.</div>
      )}

      <form onSubmit={onSubmit}>
        <div className="auth-field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-submit-btn">Send reset link</button>
      </form>

      <div className="auth-switch"><Link to="/signin">Back to sign in</Link></div>
    </div>
  );
}

export default ForgotPassword;
