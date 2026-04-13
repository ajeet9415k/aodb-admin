import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { setSession, isAuthenticated } from '@/utils/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!usernameOrEmail.trim()) {
      setError('Username or email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        if (isJson) {
          const data = await response.json();
          throw new Error(data.message || data.error || 'Login failed');
        } else {
          const text = await response.text();
          throw new Error(text || `Login failed with status ${response.status}`);
        }
      }

      const json = isJson ? await response.json() : null;
      const sessionData = json?.data || json;
      if (!sessionData || !(sessionData.accessToken || sessionData.token)) {
        throw new Error('Invalid response from server');
      }

      // Store session using shared session helper
      setSession(sessionData);

      // Redirect to original destination or admin dashboard
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '40px 32px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              fontFamily: 'Syne, sans-serif',
              color: 'var(--text-1)',
              marginBottom: '8px',
            }}
          >
            AODB Admin
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-2)',
              marginBottom: '24px',
            }}
          >
            Airport Operations Database Management
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              marginBottom: '24px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={20} style={{ color: 'var(--red)', marginTop: '2px', flexShrink: 0 }} />
            <p
              style={{
                fontSize: '14px',
                color: 'var(--red)',
                margin: 0,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email Field */}
          <div>
            <label
              htmlFor="usernameOrEmail"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-1)',
                marginBottom: '8px',
              }}
            >
              Username or Email
            </label>
            <input
              id="usernameOrEmail"
              type="text"
              placeholder="admin"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-1)',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--blue)';
                e.target.style.boxShadow = '0 0 0 2px var(--blue-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-1)',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <div
              style={{
                position: 'relative',
              }}
            >
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  paddingRight: '40px',
                  fontSize: '14px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-1)',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--blue)';
                  e.target.style.boxShadow = '0 0 0 2px var(--blue-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: 'var(--text-2)',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 16px',
              fontSize: '15px',
              fontWeight: '500',
              background: loading ? 'var(--slate)' : 'var(--blue)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '8px',
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'var(--blue-d)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = 'var(--blue)';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>


      </div>
    </div>
  );
}

