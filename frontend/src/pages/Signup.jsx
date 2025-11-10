import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await signup(form);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} required />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={handleChange} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
