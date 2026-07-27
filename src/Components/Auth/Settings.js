import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../Auth/AuthContext';
import config from '../../config';

function Settings() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/signin" replace />;

  return (
    <div className="auth-card">
      <Link to="/" className="auth-card-logo">{config.projectName}</Link>
      <div className="auth-card-heading">Settings</div>
      <div className="auth-card-subtitle">Your account details.</div>

      <div className="auth-field">
        <label>Name</label>
        <input type="text" value={user.full_name || ''} disabled />
      </div>
      <div className="auth-field">
        <label>Email</label>
        <input type="text" value={user.email} disabled />
      </div>

      <button className="auth-submit-btn" onClick={logout}>Sign out</button>
    </div>
  );
}

export default Settings;
