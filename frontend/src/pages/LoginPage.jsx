import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_URL}/auth/login`, form);
      const { token, user } = res.data;

      // Save token and user info
      localStorage.setItem('ucab_token', token);
      localStorage.setItem('ucab_user', JSON.stringify(user));

      Swal.fire({
        title: 'Login Successful',
        text: `Welcome back, ${user.name}!`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        if (user.role === 'driver') {
          navigate('/driver-dashboard');
        } else {
          navigate('/bookings');
        }
      });

    } catch (error) {
      Swal.fire({
        title: 'Login Failed',
        text: error.response?.data?.message || 'Invalid email or password',
        icon: 'error'
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-title mb-1">Rider Sign In</h2>
          <p className="auth-subtitle mb-0">Sign in to request rides and check fares</p>
        </div>

        <div className="auth-card-body">
          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label text-black">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="form-label text-black">Password</label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="position-absolute border-0 bg-transparent text-muted"
                  style={{ right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, fontSize: '0.88rem' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 mt-2 text-white fw-bold" style={{ borderRadius: '8px' }}>
              Sign In
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="text-center text-muted-sm mb-0">
              Don't have an account?{' '}
              <span
                style={{ cursor: 'pointer', color: '#000000', textDecoration: 'underline' }}
                className="fw-bold"
                onClick={() => navigate('/register')}
              >
                Register Now
              </span>
            </p>

            <p className="text-center text-muted-sm mb-0 mt-2">
              Are you a Driver?{' '}
              <span
                style={{ cursor: 'pointer', color: '#000000', textDecoration: 'underline' }}
                className="fw-bold"
                onClick={() => navigate('/driver-login')}
              >
                Go to Partner Portal
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
