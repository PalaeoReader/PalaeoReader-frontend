import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Auth/AuthContext';

function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(location.state?.from || '/');
  };

  return (
    <div className="auth-card">
      <Link to="/" className="auth-card-logo">Digital Palaeography</Link>
      <div className="auth-card-heading">Sign in</div>
      <div className="auth-card-subtitle">Access your contributions and edit history.</div>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="auth-field">
          <label htmlFor="signin-email">Email</label>
          <input
            id="signin-email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <div className="auth-field-label-row">
            <label htmlFor="signin-password">Password</label>
            <Link to="/forgot-password" className="auth-field-link">Forgot password?</Link>
          </div>
          <input
            id="signin-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-submit-btn" disabled={submitting}>
          Sign in
        </button>
      </form>

      <div className="auth-switch">No account? <Link to="/signup">Create one</Link></div>
    </div>
  );
}

export default SignIn;
