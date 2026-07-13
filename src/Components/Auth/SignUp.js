import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [existsError, setExistsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setExistsError(false);

    let valid = true;
    if (!EMAIL_RE.test(email)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    const result = await register(name, email, password);
    setSubmitting(false);
    if (!result.ok) {
      if (result.error.startsWith('An account with that email')) {
        setExistsError(true);
      } else {
        setEmailError(result.error);
      }
      return;
    }
    navigate('/');
  };

  return (
    <div className="auth-card">
      <Link to="/" className="auth-card-logo">Digital Palaeography</Link>
      <div className="auth-card-heading">Create an account</div>
      <div className="auth-card-subtitle">Contribute analyses, fix transcriptions, and track your edits.</div>

      {existsError && (
        <div className="auth-error">
          An account with that email already exists. <Link to="/signin">Sign in</Link> instead.
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="auth-field">
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            type="text"
            placeholder="your name or handle"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {emailError && <div className="auth-field-error">{emailError}</div>}
        </div>
        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="at least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {passwordError && <div className="auth-field-error">{passwordError}</div>}
        </div>
        <button type="submit" className="auth-submit-btn" disabled={submitting}>
          Create account
        </button>
      </form>

      <div className="auth-switch">Already have an account? <Link to="/signin">Sign in</Link></div>
    </div>
  );
}

export default SignUp;
